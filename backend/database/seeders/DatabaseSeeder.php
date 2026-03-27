<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Clinic;
use App\Models\Hospital;
use App\Models\Appointment;
use App\Models\DoctorProfile;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Super Admin ──
        $admin = User::updateOrCreate(
            ['email' => 'admin@medagama.com'],
            [
                'id' => 'f7103b85-fcda-4dec-92c6-c336f71fd3a2',
                'password' => '123asd123',
                'fullname' => 'Platform Admin',
                'role_id' => 'superAdmin',
                'mobile' => '+905001234567',
                'email_verified' => true,
                'mobile_verified' => true,
                'is_verified' => true,
                'is_active' => true,
            ]
        );

        // ── Test Clinic ──
        $clinicOwner = User::updateOrCreate(
            ['email' => 'clinic@medagama.com'],
            [
                'password' => 'clinic123',
                'fullname' => 'Dr. Mehmet Yılmaz',
                'role_id' => 'clinicOwner',
                'mobile' => '+905001234568',
                'email_verified' => true,
                'mobile_verified' => true,
                'is_verified' => true,
                'is_active' => true,
            ]
        );

        $clinic = Clinic::updateOrCreate(
            ['codename' => 'medagama-clinic'],
            [
                'name' => 'MedaGama',
                'fullname' => 'MedaGama Sağlık Merkezi',
                'owner_id' => $clinicOwner->id,
                'address' => 'Levent, İstanbul, Türkiye',
                'biography' => 'Modern sağlık hizmetleri sunan çok branşlı klinik.',
                'is_verified' => true,
                'is_active' => true,
            ]
        );

        $clinicOwner->update(['clinic_id' => $clinic->id]);

        // ── Test Doctor ──
        $doctor = User::updateOrCreate(
            ['email' => 'doctor@medagama.com'],
            [
                'password' => 'doctor123',
                'fullname' => 'Dr. Ayşe Kaya',
                'role_id' => 'doctor',
                'mobile' => '+905001234569',
                'email_verified' => true,
                'mobile_verified' => true,
                'is_verified' => true,
                'clinic_id' => $clinic->id,
                'is_active' => true,
            ]
        );

        // Doctor profile (onboarding complete)
        if (class_exists(DoctorProfile::class)) {
            try {
                DoctorProfile::updateOrCreate(
                    ['user_id' => $doctor->id],
                    [
                        'specialty_code' => 'CARD',
                        'title' => 'Uzm. Dr.',
                        'biography' => 'Kardiyoloji uzmanı, 10 yıllık deneyim.',
                        'onboarding_completed' => true,
                    ]
                );
            } catch (\Throwable $e) {
                // Skip if table/columns don't match
            }
        }

        // ── Test Hospital (L4) ──
        $hospitalUser = User::updateOrCreate(
            ['email' => 'hospital@medagama.com'],
            [
                'password'        => 'hospital123',
                'fullname'        => 'Memorial Hastanesi Yöneticisi',
                'role_id'         => 'hospital',
                'user_level'      => 4,
                'mobile'          => '+905001234572',
                'email_verified'  => true,   // Hospital users are always pre-verified
                'mobile_verified' => true,
                'is_verified'     => true,
                'is_active'       => true,
                'is_crm_active'   => true,
            ]
        );

        if (class_exists(Hospital::class)) {
            try {
                $hospital = Hospital::updateOrCreate(
                    ['codename' => 'memorial-hastanesi'],
                    [
                        'name'       => 'Memorial Hastanesi',
                        'owner_id'   => $hospitalUser->id,
                        'is_active'  => true,
                        'is_verified'=> true,
                    ]
                );
                $hospitalUser->update(['hospital_id' => $hospital->id]);
            } catch (\Throwable $e) {
                // Skip if Hospital table columns don't match yet
            }
        }

        // ── Test Patients ──
        $patient = User::updateOrCreate(
            ['email' => 'patient@medagama.com'],
            [
                'password' => 'patient123',
                'fullname' => 'Ali Demir',
                'role_id' => 'patient',
                'mobile' => '+905001234570',
                'email_verified' => true,
                'mobile_verified' => true,
                'date_of_birth' => '1990-05-15',
                'gender' => 'male',
                'country_id' => 90,
                'is_active' => true,
            ]
        );

        $patient2 = User::updateOrCreate(
            ['email' => 'zeynep@medagama.com'],
            [
                'password' => 'patient123',
                'fullname' => 'Zeynep Arslan',
                'role_id' => 'patient',
                'mobile' => '+905001234571',
                'email_verified' => true,
                'mobile_verified' => true,
                'date_of_birth' => '1985-11-22',
                'gender' => 'female',
                'country_id' => 90,
                'is_active' => true,
            ]
        );

        // ── Sample Appointments ──
        try {
            Appointment::updateOrCreate(
                [
                    'patient_id' => $patient->id,
                    'doctor_id' => $doctor->id,
                    'clinic_id' => $clinic->id,
                    'appointment_date' => now()->addDays(3)->toDateString(),
                    'appointment_time' => '10:00',
                ],
                [
                    'appointment_type' => 'inPerson',
                    'status' => 'confirmed',
                    'created_by' => $patient->id,
                ]
            );
            Appointment::updateOrCreate(
                [
                    'patient_id' => $patient2->id,
                    'doctor_id' => $doctor->id,
                    'clinic_id' => $clinic->id,
                    'appointment_date' => now()->addDays(5)->toDateString(),
                    'appointment_time' => '14:30',
                ],
                [
                    'appointment_type' => 'online',
                    'status' => 'pending',
                    'created_by' => $patient2->id,
                ]
            );
            Appointment::updateOrCreate(
                [
                    'patient_id' => $patient->id,
                    'doctor_id' => $doctor->id,
                    'clinic_id' => $clinic->id,
                    'appointment_date' => now()->subDays(7)->toDateString(),
                    'appointment_time' => '09:00',
                ],
                [
                    'appointment_type' => 'inPerson',
                    'status' => 'completed',
                    'created_by' => $patient->id,
                ]
            );
        } catch (\Throwable $e) {
            $this->command->warn('Appointments seed skipped: ' . $e->getMessage());
        }

        // ── Catalog data (Specialties, Cities, Diseases, Symptoms) ──
        // Delegated to CatalogSeeder with multilingual name/description JSON columns
        $this->call(CatalogSeeder::class);

        $this->command->info('');
        $this->command->info('╔══════════════════════════════════════════════════════════════╗');
        $this->command->info('║  Users:                                                     ║');
        $this->command->info('║    Admin    → admin@medagama.com     / 123asd123              ║');
        $this->command->info('║    Clinic   → clinic@medagama.com    / clinic123              ║');
        $this->command->info('║    Doctor   → doctor@medagama.com    / doctor123              ║');
        $this->command->info('║    Hospital → hospital@medagama.com  / hospital123            ║');
        $this->command->info('║    Patient  → patient@medagama.com   / patient123             ║');
        $this->command->info('║    Patient2 → zeynep@medagama.com    / patient123             ║');
        $this->command->info('╚══════════════════════════════════════════════════════════════╝');
    }
}
