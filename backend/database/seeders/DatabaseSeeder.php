<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Clinic;
use App\Models\Specialty;
use App\Models\City;
use App\Models\Appointment;
use App\Models\DoctorProfile;
use App\Models\SymptomSpecialtyMapping;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Super Admin ──
        $admin = User::updateOrCreate(
            ['email' => 'admin@admin.com'],
            [
                'id' => 'f7103b85-fcda-4dec-92c6-c336f71fd3a2',
                'password' => 'admin123',
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
                    'appointment_type' => 'in_person',
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
                    'appointment_type' => 'video',
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
                    'appointment_type' => 'in_person',
                    'status' => 'completed',
                    'created_by' => $patient->id,
                ]
            );
        } catch (\Throwable $e) {
            $this->command->warn('Appointments seed skipped: ' . $e->getMessage());
        }

        // ── Specialties ──
        $specialties = [
            ['code' => 'CARD', 'display_order' => 1, 'translations' => ['en' => 'Cardiology', 'tr' => 'Kardiyoloji']],
            ['code' => 'DERM', 'display_order' => 2, 'translations' => ['en' => 'Dermatology', 'tr' => 'Dermatoloji']],
            ['code' => 'ENDO', 'display_order' => 3, 'translations' => ['en' => 'Endocrinology', 'tr' => 'Endokrinoloji']],
            ['code' => 'GAST', 'display_order' => 4, 'translations' => ['en' => 'Gastroenterology', 'tr' => 'Gastroenteroloji']],
            ['code' => 'NEUR', 'display_order' => 5, 'translations' => ['en' => 'Neurology', 'tr' => 'Nöroloji']],
            ['code' => 'ONCO', 'display_order' => 6, 'translations' => ['en' => 'Oncology', 'tr' => 'Onkoloji']],
            ['code' => 'OPHT', 'display_order' => 7, 'translations' => ['en' => 'Ophthalmology', 'tr' => 'Göz Hastalıkları']],
            ['code' => 'ORTH', 'display_order' => 8, 'translations' => ['en' => 'Orthopedics', 'tr' => 'Ortopedi']],
            ['code' => 'PEDI', 'display_order' => 9, 'translations' => ['en' => 'Pediatrics', 'tr' => 'Çocuk Hastalıkları']],
            ['code' => 'PSYC', 'display_order' => 10, 'translations' => ['en' => 'Psychiatry', 'tr' => 'Psikiyatri']],
            ['code' => 'PULM', 'display_order' => 11, 'translations' => ['en' => 'Pulmonology', 'tr' => 'Göğüs Hastalıkları']],
            ['code' => 'UROL', 'display_order' => 12, 'translations' => ['en' => 'Urology', 'tr' => 'Üroloji']],
            ['code' => 'GYNE', 'display_order' => 13, 'translations' => ['en' => 'Gynecology', 'tr' => 'Kadın Hastalıkları']],
            ['code' => 'ENT', 'display_order' => 14, 'translations' => ['en' => 'ENT (Ear, Nose, Throat)', 'tr' => 'Kulak Burun Boğaz']],
            ['code' => 'GENE', 'display_order' => 15, 'translations' => ['en' => 'General Surgery', 'tr' => 'Genel Cerrahi']],
            ['code' => 'DENT', 'display_order' => 16, 'translations' => ['en' => 'Dentistry', 'tr' => 'Diş Hekimliği']],
            ['code' => 'RHEU', 'display_order' => 17, 'translations' => ['en' => 'Rheumatology', 'tr' => 'Romatoloji']],
            ['code' => 'NEPH', 'display_order' => 18, 'translations' => ['en' => 'Nephrology', 'tr' => 'Nefroloji']],
            ['code' => 'ALLE', 'display_order' => 19, 'translations' => ['en' => 'Allergy & Immunology', 'tr' => 'Alerji ve İmmünoloji']],
            ['code' => 'PLAS', 'display_order' => 20, 'translations' => ['en' => 'Plastic Surgery', 'tr' => 'Plastik Cerrahi']],
        ];

        $specialtyIds = [];
        foreach ($specialties as $s) {
            $spec = Specialty::updateOrCreate(
                ['code' => $s['code']],
                [
                    'display_order' => $s['display_order'],
                    'translations' => $s['translations'],
                ]
            );
            $specialtyIds[$s['code']] = $spec->id;
        }

        // ── Cities (Turkey) ──
        $cities = [
            ['code' => 'IST', 'country_id' => 90, 'translations' => ['en' => 'Istanbul', 'tr' => 'İstanbul']],
            ['code' => 'ANK', 'country_id' => 90, 'translations' => ['en' => 'Ankara', 'tr' => 'Ankara']],
            ['code' => 'IZM', 'country_id' => 90, 'translations' => ['en' => 'Izmir', 'tr' => 'İzmir']],
            ['code' => 'ANT', 'country_id' => 90, 'translations' => ['en' => 'Antalya', 'tr' => 'Antalya']],
            ['code' => 'BUR', 'country_id' => 90, 'translations' => ['en' => 'Bursa', 'tr' => 'Bursa']],
            ['code' => 'ADA', 'country_id' => 90, 'translations' => ['en' => 'Adana', 'tr' => 'Adana']],
            ['code' => 'GAZ', 'country_id' => 90, 'translations' => ['en' => 'Gaziantep', 'tr' => 'Gaziantep']],
            ['code' => 'KON', 'country_id' => 90, 'translations' => ['en' => 'Konya', 'tr' => 'Konya']],
        ];

        $citiesDE = [
            ['code' => 'BER', 'country_id' => 49, 'translations' => ['en' => 'Berlin', 'de' => 'Berlin']],
            ['code' => 'MUC', 'country_id' => 49, 'translations' => ['en' => 'Munich', 'de' => 'München']],
        ];

        foreach (array_merge($cities, $citiesDE) as $c) {
            City::updateOrCreate(
                ['code' => $c['code'], 'country_id' => $c['country_id']],
                ['translations' => $c['translations']]
            );
        }

        // ── Symptom-Specialty Mappings ──
        $symptoms = [
            ['symptom' => 'chest pain', 'specialty_code' => 'CARD'],
            ['symptom' => 'shortness of breath', 'specialty_code' => 'PULM'],
            ['symptom' => 'skin rash', 'specialty_code' => 'DERM'],
            ['symptom' => 'stomach pain', 'specialty_code' => 'GAST'],
            ['symptom' => 'headache', 'specialty_code' => 'NEUR'],
            ['symptom' => 'joint pain', 'specialty_code' => 'RHEU'],
            ['symptom' => 'vision problem', 'specialty_code' => 'OPHT'],
            ['symptom' => 'tooth pain', 'specialty_code' => 'DENT'],
            ['symptom' => 'anxiety', 'specialty_code' => 'PSYC'],
            ['symptom' => 'urination pain', 'specialty_code' => 'UROL'],
        ];

        foreach ($symptoms as $s) {
            SymptomSpecialtyMapping::updateOrCreate(
                ['symptom' => $s['symptom']],
                ['specialty_code' => $s['specialty_code']]
            );
        }

        $this->command->info('');
        $this->command->info('╔══════════════════════════════════════════════════════════════╗');
        $this->command->info('║  Users:                                                     ║');
        $this->command->info('║    Admin    → admin@admin.com       / admin123               ║');
        $this->command->info('║    Clinic   → clinic@medagama.com    / clinic123              ║');
        $this->command->info('║    Doctor   → doctor@medagama.com    / doctor123              ║');
        $this->command->info('║    Patient  → patient@medagama.com   / patient123             ║');
        $this->command->info('║    Patient2 → zeynep@medagama.com    / patient123             ║');
        $this->command->info('╚══════════════════════════════════════════════════════════════╝');
    }
}
