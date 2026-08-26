<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\MassPrunable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Traits\LogsActivity;

class Appointment extends Model
{
    use HasFactory, HasUuids, LogsActivity, MassPrunable, SoftDeletes;

    protected static string $auditResourceLabel = 'Appointment';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'patient_id', 'doctor_id', 'clinic_id', 'appointment_type', 'slot_id',
        'appointment_date', 'appointment_time', 'starts_at', 'timezone',
        'status', 'confirmation_note',
        'video_conference_link', 'meeting_id', 'meeting_url', 'meeting_status',
        'doctor_note', 'patient_medical_snapshot', 'created_by', 'is_active',
        // Onaylı Review Sistemi alanları
        'deposit_status', 'deposit_amount', 'auto_completed_at',
        // Otomatik hatırlatma gönderim flag'leri
        'reminder_24h_sent_at', 'reminder_1h_sent_at',
    ];

    // cakisma_anahtari bilerek $fillable DIŞINDA: yalnızca model üretir.
    // Toplu atamaya açık olsaydı istekle beraber gönderilip kilit atlatılabilirdi.

    /** Aynı saatin iki kez verilmesini engelleyen anahtarın aktif olduğu durumlar. */
    public const CAKISMA_DURUMLARI = ['pending', 'confirmed'];

    protected static function booted(): void
    {
        // Çakışma anahtarı her kayıtta yeniden hesaplanır: durum, tarih, saat
        // veya doktor değişince kilit de değişmeli. İptal edilen randevuda
        // anahtar NULL olur ve o saat yeniden verilebilir hâle gelir
        // (benzersiz dizin birden çok NULL'a izin verir).
        static::saving(function (self $randevu) {
            $randevu->cakisma_anahtari = $randevu->cakismaAnahtariUret();
        });
    }

    /**
     * doctor_id|YYYY-AA-GG|SS:DD — yalnızca aktif randevular için.
     */
    public function cakismaAnahtariUret(): ?string
    {
        if (!$this->doctor_id || !in_array($this->status, self::CAKISMA_DURUMLARI, true)) {
            return null;
        }

        $tarih = $this->appointment_date instanceof \DateTimeInterface
            ? $this->appointment_date->format('Y-m-d')
            : substr((string) $this->appointment_date, 0, 10);

        $saat = substr((string) $this->appointment_time, 0, 5);

        if (!$tarih || !$saat) {
            return null;
        }

        return $this->doctor_id . '|' . $tarih . '|' . $saat;
    }

    protected function casts(): array
    {
        return [
            'appointment_date'  => 'date',
            'starts_at'         => 'datetime',
            'is_active'         => 'boolean',
            'doctor_note'       => 'encrypted',
            'confirmation_note' => 'encrypted',
            'patient_medical_snapshot' => 'encrypted',
            'auto_completed_at' => 'datetime',
            'reminder_24h_sent_at' => 'datetime',
            'reminder_1h_sent_at'  => 'datetime',
        ];
    }

    /**
     * Aktif (iptal edilmemiş kayıt) randevular.
     *
     * SendAppointmentReminders bu kapsamı çağırıyordu ama modelde tanımlı
     * değildi: komut her çalıştığında BadMethodCallException ile düşüyordu.
     * Zamanlayıcı süreci de olmadığı için bu hata hiç görünmedi ve randevu
     * hatırlatmaları bugüne kadar bir kez bile gönderilmedi.
     *
     * is_active eski kayıtlarda boş olabilir; NULL'ı "aktif" sayıyoruz, aksi
     * hâlde geçmişte oluşturulmuş randevular hatırlatma almazdı.
     */
    public function scopeActive($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('is_active')->orWhere('is_active', true);
        });
    }

    /**
     * Hastanın BUGÜNKÜ tıbbi beyanı, randevu anındaki dondurulmuş kopyanın
     * karşısına konmak üzere.
     *
     * İki kayıt da gerekiyor: dondurulmuş olan "randevu alınırken ne beyan
     * edildi" sorusunun cevabı ve sonradan değiştirilemez; güncel olan ise
     * hastanın o randevudan sonra başladığı ilacı gösterir. Doktor ilaç
     * etkileşimine ikincisine bakarak karar verir.
     */
    public function guncelTibbiGecmis(): ?string
    {
        if (!$this->patient_id) {
            return null;
        }

        $hasta = $this->relationLoaded('patient') ? $this->patient : User::find($this->patient_id);
        if (!$hasta) {
            return null;
        }

        $mh = app(\App\Services\AuthService::class)->getMedicalHistory($hasta);

        $parcalar = [];
        foreach ([
            'conditions'   => 'Bilinen Durumlar / Alerjiler',
            'medications'  => 'Kullanılan İlaçlar',
            'vaccinations' => 'Aşılar',
        ] as $anahtar => $etiket) {
            $liste = array_filter((array) ($mh[$anahtar] ?? []));
            if ($liste) {
                $parcalar[] = $etiket . ': ' . implode(', ', $liste);
            }
        }

        $not = trim((string) ($mh['notes'] ?? ''));
        if ($not !== '') {
            $parcalar[] = 'Hasta Notları: ' . $not;
        }

        return $parcalar ? implode("\n", $parcalar) : null;
    }

    /** Duvar saati hangi saat diliminde yazıldıysa o; bilinmiyorsa uygulama varsayılanı. */
    public const VARSAYILAN_TZ = 'Europe/Istanbul';

    public function timezoneName(): string
    {
        return $this->timezone ?: self::VARSAYILAN_TZ;
    }

    /**
     * Randevunun başlangıç anı — dünyada tek bir ana karşılık gelen mutlak değer.
     *
     * `starts_at` UTC olarak saklanır ve TÜM zaman karşılaştırmaları bunun
     * üzerinden yapılır. Daha önce duvar saati ("14:00") doğrudan sunucu saatiyle
     * karşılaştırılıyordu; sunucu UTC olduğu için Türkiye randevuları 3 saat
     * ileride sanılıyordu. `starts_at` boşsa (eski kayıt) duvar saati, randevunun
     * kendi saat diliminde yorumlanarak çözülür — sunucununkinde değil.
     */
    public function startsAt(): ?\Illuminate\Support\Carbon
    {
        if ($this->starts_at) {
            return $this->starts_at->copy();
        }

        if (!$this->appointment_date || !$this->appointment_time) {
            return null;
        }

        try {
            return \Illuminate\Support\Carbon::createFromFormat(
                'Y-m-d H:i',
                $this->appointment_date->toDateString() . ' ' . substr((string) $this->appointment_time, 0, 5),
                $this->timezoneName()
            )->utc();
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Duvar saati + tarih ile saat diliminden mutlak anı hesaplar.
     * Randevu oluşturma/erteleme tek noktadan bunu kullanır.
     */
    public static function anHesapla(?string $tarih, ?string $saat, ?string $tz): ?\Illuminate\Support\Carbon
    {
        if (!$tarih || !$saat) {
            return null;
        }

        try {
            return \Illuminate\Support\Carbon::createFromFormat(
                'Y-m-d H:i',
                substr($tarih, 0, 10) . ' ' . substr($saat, 0, 5),
                $tz ?: self::VARSAYILAN_TZ
            )->utc();
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Doktor bu randevuyu hâlâ reddedebilir mi?
     *
     * Randevu doktorun kendi açtığı saatten alındığı için onay adımı yok; doktorun
     * tek aracı reddetmek. Son ana kadar açık bırakılırsa hasta görüşmeye dakikalar
     * kala boşa düşer — bu yüzden başlangıçtan 2 saat öncesinde kapanır.
     */
    public const REJECT_CUTOFF_HOURS = 2;

    public function doctorCanReject(): bool
    {
        if (!in_array($this->status, ['pending', 'confirmed'], true)) {
            return false;
        }

        $start = $this->startsAt();

        // Saat okunamıyorsa engelleme — doktoru kilitlemek, geç reddedilmesinden kötü.
        return $start === null || now()->lte($start->copy()->subHours(self::REJECT_CUTOFF_HOURS));
    }

    // ── Prunable (GDPR Art. 5(1)(e) — 10 year retention) ──

    public function prunable()
    {
        return static::onlyTrashed()
            ->where('deleted_at', '<=', now()->subYears(10));
    }

    // ── Relationships ──

    public function patient()
    {
        // Hesabını silen hasta YUMUŞAK silinmiş oluyor (saklama sayacı ancak
        // öyle başlıyor). Varsayılan ilişki yumuşak silinmişi getirmez ve
        // klinik geçmiş randevusunda hasta adını BOŞ görürdü — kayıt duruyor
        // ama kime ait olduğu görünmüyor.
        //
        // Kimlik zaten anonimleştirildi ("Deleted User"), yani burada dönen
        // satırda kişisel veri yok; getirilmesinin tek işlevi listenin
        // okunabilir kalması.
        return $this->belongsTo(User::class, 'patient_id')->withTrashed();
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function clinic()
    {
        return $this->belongsTo(Clinic::class);
    }

    public function slot()
    {
        return $this->belongsTo(CalendarSlot::class, 'slot_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
