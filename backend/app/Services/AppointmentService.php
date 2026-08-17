<?php

namespace App\Services;

use App\Models\Appointment;
use App\Events\AppointmentChanged;
use App\Models\CalendarSlot;
use App\Models\User;
use App\Notifications\AppointmentBookedNotification;
use App\Notifications\AppointmentRescheduledNotification;
use App\Notifications\AppointmentConfirmedNotification;
use App\Notifications\AppointmentCancelledNotification;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AppointmentService
{
    /**
     * List appointments scoped by the authenticated user's role.
     */
    public function list(User $user, array $filters): LengthAwarePaginator
    {
        $query = Appointment::query()
            ->with(['patient:id,fullname,avatar,email', 'doctor:id,fullname,avatar', 'clinic:id,fullname']);

        // Scope by role
        if ($user->isDoctor()) {
            $query->where('doctor_id', $user->id);
        } elseif ($user->isPatient()) {
            $query->where('patient_id', $user->id);
        } elseif ($user->isClinicOwner()) {
            $query->where('clinic_id', $user->clinic_id);
        }

        // Filters
        $query->when($filters['status'] ?? null, fn($q, $v) => $q->where('status', $v))
              ->when($filters['date'] ?? null, fn($q, $v) => $q->whereDate('appointment_date', $v))
              ->when($filters['date_from'] ?? null, fn($q, $v) => $q->whereDate('appointment_date', '>=', $v))
              ->when($filters['date_to'] ?? null, fn($q, $v) => $q->whereDate('appointment_date', '<=', $v))
              ->when($filters['appointment_type'] ?? null, fn($q, $v) => $q->where('appointment_type', $v))
              ->when($filters['doctor_id'] ?? null, fn($q, $v) => $q->where('doctor_id', $v))
              ->when($filters['patient_id'] ?? null, fn($q, $v) => $q->where('patient_id', $v));

        return $query
            ->orderBy('appointment_date', 'desc')
            ->orderBy('appointment_time', 'desc')
            ->paginate($filters['per_page'] ?? 20);
    }

    /**
     * Show a single appointment with full relations.
     */
    public function find(string $id): Appointment
    {
        return Appointment::with(['patient:id,fullname,avatar,email,mobile', 'doctor:id,fullname,avatar', 'clinic:id,fullname', 'slot'])
            ->findOrFail($id);
    }

    /**
     * Create an appointment inside a DB transaction.
     *
     * Steps (all atomic):
     *  1. Resolve patient (find-or-create if doctor is booking)
     *  2. Verify & lock the calendar slot
     *  3. Create the appointment record
     *  4. Send notifications (outside transaction — fire-and-forget)
     */
    public function store(User $createdBy, array $data, bool $isCreatedByDoctor): Appointment
    {
        $appointment = DB::transaction(function () use ($createdBy, $data, $isCreatedByDoctor) {

            // 1. Resolve patient
            $patientId = $this->resolvePatientId($data, $isCreatedByDoctor);

            // 1b. Snapshot the patient's medical history (anamnesis) + booking symptoms,
            // so they travel with the appointment for the doctor (encrypted at rest).
            $snapshot = $this->buildMedicalSnapshot($patientId, $data);

            // 2. Kapora (deposit) altyapısı — ÖDEMESİZ.
            // GERÇEK TAHSİLAT YOK: yalnızca durum/tutar kaydı yapılır.
            // İleride payment gateway başarılı tahsilatta deposit_status='paid' yapacaktır.
            // Kural: kapora tutarı tanımlıysa -> 'pending' + deposit_amount; değilse -> 'skipped'.
            // Doktor/klinik profilinde henüz kapora alanı yok; istek payload'ında gelebilir.
            [$depositStatus, $depositAmount] = $this->resolveDeposit($data);

            // 2b. Başlangıç durumu.
            // Hasta doktorun KENDİ AÇTIĞI takvim saatinden seçtiyse doktor zaten
            // "o saat müsaitim" demiştir; ikinci kez onay istemek gereksiz bir adım
            // ve hastayı belirsizlikte bekletiyor. Bu yüzden slot üzerinden alınan
            // (veya doktorun kendi oluşturduğu) randevu doğrudan onaylı başlar;
            // doktor uygun değilse reddeder. Slotsuz gelen serbest talep, doktor
            // o saat için müsaitlik beyan etmediğinden onay bekler.
            $status = (!empty($data['slot_id']) || $isCreatedByDoctor) ? 'confirmed' : 'pending';

            // 2c. Saat dilimi + mutlak an.
            // Duvar saati ("14:00") tek başına anlamsız: kimin 14:00'ü olduğu
            // yazmazsa yurt dışındaki hasta ile klinik farklı anları anlar.
            // Saat, randevuyu veren sağlayıcının (klinik, yoksa doktor) saat
            // diliminde yorumlanır ve mutlak an olarak da saklanır.
            $tz = $this->saglayiciTimezone($data['clinic_id'] ?? null, $data['doctor_id'] ?? null);
            $baslangic = Appointment::anHesapla(
                $data['appointment_date'] ?? null,
                $data['appointment_time'] ?? null,
                $tz
            );

            // 3. Build appointment payload
            $appointmentData = [
                'patient_id'        => $patientId,
                'doctor_id'         => $data['doctor_id'] ?? null,
                'clinic_id'         => $data['clinic_id'] ?? null,
                'appointment_type'  => $data['appointment_type'],
                'slot_id'           => $data['slot_id'] ?? null,
                'appointment_date'  => $data['appointment_date'],
                'appointment_time'  => $data['appointment_time'],
                'starts_at'         => $baslangic,
                'timezone'          => $tz,
                'confirmation_note' => $data['confirmation_note'] ?? null,
                'patient_medical_snapshot' => $snapshot,
                'status'            => $status,
                'deposit_status'    => $depositStatus,
                'deposit_amount'    => $depositAmount,
                'created_by'        => $createdBy->id,
            ];

            // 4. Lock & close the slot (inside transaction for consistency)
            if (!empty($appointmentData['slot_id']) && !empty($appointmentData['doctor_id'])) {
                $this->lockSlot($appointmentData['slot_id'], $appointmentData['doctor_id']);
            }

            // 5. Create appointment
            return Appointment::create($appointmentData);
        });

        // 5. Eager-load relations for response & notifications
        $appointment->load(['patient', 'doctor']);

        // 6. Notifications (outside transaction — non-critical)
        $this->sendBookedNotifications($appointment);

        event(new AppointmentChanged($appointment, 'created'));

        return $appointment;
    }

    /**
     * Update an appointment. If status changes to cancelled, release the slot.
     */
    public function update(User $updatedBy, Appointment $appointment, array $data): Appointment
    {
        $oldStatus = $appointment->status;

        DB::transaction(function () use ($appointment, $data) {
            $appointment->update($data);

            // Release slot on cancellation
            if (($data['status'] ?? null) === 'cancelled' && $appointment->slot_id) {
                CalendarSlot::where('id', $appointment->slot_id)
                    ->update(['is_available' => true]);
            }
        });

        $appointment->refresh()->load(['patient', 'doctor']);

        // Status-change notifications (outside transaction)
        $newStatus = $data['status'] ?? null;
        if ($newStatus && $newStatus !== $oldStatus) {
            $this->sendStatusChangeNotifications($appointment, $newStatus, $updatedBy);
        }

        event(new AppointmentChanged($appointment, $newStatus === 'cancelled' ? 'cancelled' : 'updated'));

        return $appointment;
    }

    /**
     * Cancel an appointment (status -> cancelled) and release its slot.
     * Yetki kontrolü controller'da yapılır (hasta kendi randevusu / doktor / klinik).
     */
    public function cancel(User $cancelledBy, Appointment $appointment): Appointment
    {
        DB::transaction(function () use ($appointment) {
            $appointment->update(['status' => 'cancelled']);

            // Slotu tekrar uygun hale getir
            if ($appointment->slot_id) {
                CalendarSlot::where('id', $appointment->slot_id)
                    ->update(['is_available' => true]);
            }
        });

        $appointment->refresh()->load(['patient', 'doctor']);

        // İptal bildirimleri (transaction dışında, kritik değil)
        $this->sendStatusChangeNotifications($appointment, 'cancelled', $cancelledBy);

        event(new AppointmentChanged($appointment, 'cancelled'));

        return $appointment;
    }

    /**
     * Kapora (deposit) durum + tutarını çözümler. — ÖDEMESİZ.
     * GERÇEK TAHSİLAT YOK: yalnızca durum/tutar kaydı.
     *
     * Kural:
     *  - deposit_amount payload'da > 0 ise  -> ['pending', amount]
     *  - aksi halde                         -> ['skipped', null]
     *
     * NOT: Doktor/klinik profilinde henüz kapora tutarı alanı yok.
     * Alan eklendiğinde burada profilden okunabilir. Şimdilik payload veya 'skipped'.
     *
     * @return array{0:string,1:?float}
     */
    private function resolveDeposit(array $data): array
    {
        $amount = isset($data['deposit_amount']) ? (float) $data['deposit_amount'] : 0.0;

        if ($amount > 0) {
            return ['pending', $amount]; // ödeme adımı ileride 'paid' yapacak
        }

        return ['skipped', null];
    }

    /**
     * Soft-delete an appointment and release its slot.
     */
    public function destroy(Appointment $appointment): void
    {
        DB::transaction(function () use ($appointment) {
            if ($appointment->slot_id) {
                CalendarSlot::where('id', $appointment->slot_id)
                    ->update(['is_available' => true]);
            }

            $appointment->delete();
        });

        event(new AppointmentChanged($appointment, 'deleted'));
    }

    /**
     * Return appointments formatted as FullCalendar events.
     * Flat array (no pagination) filtered by date range.
     */
    public function calendarEvents(User $user, array $filters): array
    {
        $query = Appointment::query()
            ->with(['patient:id,fullname,avatar,email,mobile', 'doctor:id,fullname,avatar', 'clinic:id,fullname']);

        // Scope by role
        if ($user->isDoctor()) {
            $query->where('doctor_id', $user->id);
        } elseif ($user->isPatient()) {
            $query->where('patient_id', $user->id);
        } elseif ($user->isClinicOwner()) {
            $query->where('clinic_id', $user->clinic_id);
        }

        // Date range filter (required for calendar view)
        $query->when($filters['start'] ?? null, fn($q, $v) => $q->whereDate('appointment_date', '>=', $v))
              ->when($filters['end'] ?? null, fn($q, $v) => $q->whereDate('appointment_date', '<=', $v))
              ->when($filters['status'] ?? null, fn($q, $v) => $q->where('status', $v));

        // Savunma: start/end verilmezse tüm geçmişi çekmesin — büyüyen tabloda üst sınır.
        // Normal takvim penceresi bu sınıra asla yaklaşmaz.
        $appointments = $query->orderBy('appointment_date')->orderBy('appointment_time')->limit(2000)->get();

        return $appointments->map(function ($apt) {
            $date = $apt->appointment_date->format('Y-m-d');
            $time = $apt->appointment_time;

            // Takvime mutlak an gönderiyoruz. Saat dilimsiz "2026-08-20T14:00"
            // gönderilirse takvim onu tarayıcının yerel saati sanıyor: yurt
            // dışındaki doktorun ekranında randevu yanlış saat kutusuna düşüyor.
            $an = $apt->startsAt();
            $start = $an ? $an->toIso8601String() : "{$date}T{$time}:00";
            $end = $an
                ? $an->copy()->addMinutes(30)->toIso8601String()
                : date('Y-m-d\TH:i:s', strtotime("{$date}T{$time}:00") + 1800);

            $statusColor = match ($apt->status) {
                'confirmed'  => ['bg' => '#ECFDF5', 'border' => '#10B981', 'text' => '#065F46'],
                'pending'    => ['bg' => '#FFFBEB', 'border' => '#F59E0B', 'text' => '#92400E'],
                'cancelled'  => ['bg' => '#FEF2F2', 'border' => '#EF4444', 'text' => '#991B1B'],
                'completed'  => ['bg' => '#F3F4F6', 'border' => '#9CA3AF', 'text' => '#374151'],
                default      => ['bg' => '#EFF6FF', 'border' => '#3B82F6', 'text' => '#1E40AF'],
            };

            return [
                'id'              => $apt->id,
                'title'           => $apt->patient?->fullname ?? 'Patient',
                'start'           => $start,
                'end'             => $end,
                'backgroundColor' => $statusColor['bg'],
                'borderColor'     => $statusColor['border'],
                'textColor'       => $statusColor['text'],
                'extendedProps'   => [
                    'appointment_id'   => $apt->id,
                    'patient_id'       => $apt->patient_id,
                    'doctor_id'        => $apt->doctor_id,
                    'clinic_id'        => $apt->clinic_id,
                    'status'           => $apt->status,
                    'appointment_type' => $apt->appointment_type,
                    'appointment_date' => $date,
                    'appointment_time' => $time,
                    // Saat dilimi farkındalıklı gösterim ve ret hakkı için:
                    // CRM takvimi bunları randevu listesiyle aynı şekilde okur.
                    'starts_at'        => $an?->toISOString(),
                    'timezone'         => $apt->timezoneName(),
                    'doctor_can_reject'=> $apt->doctorCanReject(),
                    'confirmation_note'=> $apt->confirmation_note,
                    'doctor_note'      => $apt->doctor_note,
                    'video_conference_link' => $apt->video_conference_link,
                    'patient' => $apt->patient ? [
                        'id'       => $apt->patient->id,
                        'fullname' => $apt->patient->fullname,
                        'avatar'   => $apt->patient->avatar,
                        'email'    => $apt->patient->email,
                        'mobile'   => $apt->patient->mobile,
                    ] : null,
                    'doctor' => $apt->doctor ? [
                        'id'       => $apt->doctor->id,
                        'fullname' => $apt->doctor->fullname,
                        'avatar'   => $apt->doctor->avatar,
                    ] : null,
                    'clinic' => $apt->clinic ? [
                        'id'       => $apt->clinic->id,
                        'fullname' => $apt->clinic->fullname,
                    ] : null,
                ],
            ];
        })->values()->toArray();
    }

    /**
     * Reschedule an appointment (drag-drop from calendar).
     * Updates date + time atomically and releases/locks slots if needed.
     */
    public function reschedule(User $user, Appointment $appointment, array $data): Appointment
    {
        // Bildirimde eski saat de yazacak; güncellemeden önce alınmalı.
        $eskiTarih = $appointment->appointment_date?->format('d.m.Y') ?? (string) $appointment->appointment_date;
        $eskiSaat  = (string) $appointment->appointment_time;

        DB::transaction(function () use ($appointment, $data) {
            // Release old slot
            if ($appointment->slot_id) {
                CalendarSlot::where('id', $appointment->slot_id)
                    ->update(['is_available' => true]);
            }

            // Erteleme de mutlak anı tazelemeli; yoksa hatırlatmalar ve red
            // penceresi eski saate göre çalışmaya devam eder.
            $tz = $appointment->timezone
                ?: $this->saglayiciTimezone($appointment->clinic_id, $appointment->doctor_id);

            $appointment->update([
                'appointment_date' => $data['appointment_date'],
                'appointment_time' => $data['appointment_time'],
                'starts_at'        => Appointment::anHesapla(
                    $data['appointment_date'] ?? null,
                    $data['appointment_time'] ?? null,
                    $tz
                ),
                'timezone'         => $tz,
                'slot_id'          => $data['slot_id'] ?? null,
            ]);

            // Lock new slot if provided
            if (!empty($data['slot_id'])) {
                $this->lockSlot($data['slot_id'], $appointment->doctor_id);
            }
        });

        $appointment->refresh()->load(['patient:id,fullname,avatar,email,mobile', 'doctor:id,fullname,avatar', 'clinic:id,fullname']);

        event(new AppointmentChanged($appointment, 'rescheduled'));

        $this->sendRescheduledNotifications($appointment, $eskiTarih, $eskiSaat);

        return $appointment;
    }

    // ── Private Helpers ──

    /**
     * Randevu saatinin ait olduğu saat dilimi: önce klinik, sonra doktor profili,
     * ikisi de boşsa uygulama varsayılanı.
     *
     * Ofset değil, IANA adı ("Europe/Istanbul") saklanır — ofset yaz saatiyle
     * değişir; Almanya kışın +1, yazın +2. Adı saklayınca doğru farkı sistem
     * kendisi hesaplar.
     */
    private function saglayiciTimezone(?string $clinicId, ?string $doctorId): string
    {
        if ($clinicId) {
            $tz = \App\Models\Clinic::where('id', $clinicId)->value('timezone');
            if ($tz) {
                return $tz;
            }
        }

        if ($doctorId) {
            $tz = \App\Models\DoctorProfile::where('user_id', $doctorId)->value('timezone');
            if ($tz) {
                return $tz;
            }
        }

        return Appointment::VARSAYILAN_TZ;
    }

    /**
     * Build the medical snapshot (patient's stored medical history + booking
     * symptoms) attached to the appointment for the treating doctor.
     */
    /**
     * Otomatik paylaşım (B): hasta bir doktora randevu aldığında, tedaviyi
     * yürütecek doktorun KOMPLE anamnezi görmesi gerekir (ilaç etkileşimi,
     * alerji vb. güvenlik riskleri hastanın "kritik değil" sandığı bilgilerde
     * saklı olabilir). Bu yüzden bilinen durumlar/alerjiler, kullanılan ilaçlar,
     * aşılar ve notların tamamı randevuya gömülür. Hasta bunun paylaşılacağını
     * profil/tıbbi arşiv sayfasındaki bilgilendirme ile önceden bilir.
     */
    private function buildMedicalSnapshot(?string $patientId, array $data): ?string
    {
        $parts = [];

        if ($patientId) {
            $patient = \App\Models\User::find($patientId);
            // Yapılandırılmış {conditions,medications,vaccinations,notes} + eski düz liste uyumlu
            $mh = app(\App\Services\AuthService::class)->getMedicalHistory($patient);
            $conditions = array_filter((array) ($mh['conditions'] ?? []));
            $medications = array_filter((array) ($mh['medications'] ?? []));
            $vaccinations = array_filter((array) ($mh['vaccinations'] ?? []));
            $notes = trim((string) ($mh['notes'] ?? ''));
            if ($conditions) {
                $parts[] = 'Bilinen Durumlar / Alerjiler: ' . implode(', ', $conditions);
            }
            if ($medications) {
                $parts[] = 'Kullanılan İlaçlar: ' . implode(', ', $medications);
            }
            if ($vaccinations) {
                $parts[] = 'Aşılar: ' . implode(', ', $vaccinations);
            }
            if ($notes !== '') {
                $parts[] = 'Hasta Notları: ' . $notes;
            }
        }

        if (!empty($data['symptoms'])) {
            $parts[] = 'Şikayet / Not: ' . trim((string) $data['symptoms']);
        }

        return $parts ? implode("\n", $parts) : null;
    }

    /**
     * Resolve patient_id: if doctor is booking and no patient_id given,
     * find-or-create a patient by email.
     */
    private function resolvePatientId(array $data, bool $isCreatedByDoctor): string
    {
        if (!$isCreatedByDoctor || !empty($data['patient_id'])) {
            return $data['patient_id'];
        }

        $patient = User::where('email', $data['patient_email'])->first();

        if (!$patient) {
            $patient = User::create([
                'email'         => $data['patient_email'],
                'fullname'      => $data['patient_name'],
                'mobile'        => $data['patient_phone'] ?? null,
                'date_of_birth' => $data['patient_dob'] ?? null,
                'role_id'       => 'patient',
                'password'      => bcrypt(\Str::random(32)),
            ]);
        }

        return $patient->id;
    }

    /**
     * Lock a calendar slot — fail if already taken or belongs to another doctor.
     *
     * @throws ValidationException
     */
    private function lockSlot(string $slotId, string $doctorId): void
    {
        $slot = CalendarSlot::active()->lockForUpdate()->findOrFail($slotId);

        if ($slot->doctor_id !== $doctorId) {
            throw ValidationException::withMessages([
                'slot_id' => ['This time slot does not belong to the selected doctor.'],
            ]);
        }

        if (!$slot->is_available) {
            throw ValidationException::withMessages([
                'slot_id' => ['This time slot is no longer available.'],
            ]);
        }

        $slot->update(['is_available' => false]);
    }

    /**
     * Send "booked" notifications to patient & doctor (fire-and-forget).
     */
    private function sendBookedNotifications(Appointment $appointment): void
    {
        try {
            $appointment->patient?->notify(
                new AppointmentBookedNotification($appointment, 'patient')
            );
        } catch (\Throwable $e) {
            \Log::warning('Appointment booked patient notification failed: ' . $e->getMessage());
        }

        try {
            $appointment->doctor?->notify(
                new AppointmentBookedNotification($appointment, 'doctor')
            );
        } catch (\Throwable $e) {
            \Log::warning('Appointment booked doctor notification failed: ' . $e->getMessage());
        }
    }

    /**
     * Randevu saati değiştiğinde iki tarafı da haberdar et.
     *
     * Bildirim gönderimi randevunun kendisini bozmamalı: takvimde saat
     * kaydırıldı, kayıt yazıldı; posta kuyruğu tökezlerse işlem geri
     * alınmaz, yalnızca kaydedilir.
     */
    private function sendRescheduledNotifications(Appointment $appointment, string $eskiTarih, string $eskiSaat): void
    {
        foreach (['patient', 'doctor'] as $rol) {
            try {
                $appointment->{$rol}?->notify(
                    new AppointmentRescheduledNotification($appointment, $eskiTarih, $eskiSaat, $rol)
                );
            } catch (\Throwable $e) {
                \Log::warning("Appointment rescheduled {$rol} notification failed: " . $e->getMessage());
            }
        }
    }

    /**
     * Send notifications when appointment status changes.
     */
    private function sendStatusChangeNotifications(Appointment $appointment, string $newStatus, User $changedBy): void
    {
        $cancelledBy = $changedBy->isDoctor() ? 'doctor'
            : ($changedBy->isPatient() ? 'patient' : 'system');

        try {
            if ($newStatus === 'confirmed' && $appointment->patient) {
                $appointment->patient->notify(
                    new AppointmentConfirmedNotification($appointment)
                );
            } elseif ($newStatus === 'cancelled') {
                $appointment->patient?->notify(
                    new AppointmentCancelledNotification($appointment, 'patient', $cancelledBy)
                );
                $appointment->doctor?->notify(
                    new AppointmentCancelledNotification($appointment, 'doctor', $cancelledBy)
                );
            }
        } catch (\Throwable $e) {
            \Log::warning('Appointment status notification failed: ' . $e->getMessage());
        }
    }
}
