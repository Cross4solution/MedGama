<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Clinic;
use App\Models\Specialty;
use App\Models\City;
use App\Models\SymptomSpecialtyMapping;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Super Admin ──
        $admin = User::create([
            'id' => 'f7103b85-fcda-4dec-92c6-c336f71fd3a2',
            'email' => 'admin@admin.com',
            'password' => 'admin123',
            'fullname' => 'Platform Admin',
            'role_id' => 'superAdmin',
            'mobile' => '+905001234567',
            'email_verified' => true,
            'mobile_verified' => true,
            'is_verified' => true,
            'avatar' => 'https://gravatar.com/avatar/' . md5('admin@admin.com') . '?s=200&d=identicon',
        ]);

        // ── Test Clinic ──
        $clinicOwner = User::create([
            'email' => 'clinic@medgama.com',
            'password' => 'clinic123',
            'fullname' => 'Dr. Mehmet Yılmaz',
            'role_id' => 'clinicOwner',
            'mobile' => '+905001234568',
            'email_verified' => true,
            'mobile_verified' => true,
            'is_verified' => true,
            'avatar' => 'https://gravatar.com/avatar/' . md5('clinic@medgama.com') . '?s=200&d=identicon',
        ]);

        $clinic = Clinic::create([
            'name' => 'MedGama',
            'codename' => 'medgama-clinic',
            'fullname' => 'MedGama Sağlık Merkezi',
            'owner_id' => $clinicOwner->id,
            'address' => 'Levent, İstanbul, Türkiye',
            'biography' => 'Modern sağlık hizmetleri sunan çok branşlı klinik.',
            'is_verified' => true,
            'avatar' => 'https://gravatar.com/avatar/' . md5('medgama') . '?s=200&d=identicon',
        ]);

        $clinicOwner->update(['clinic_id' => $clinic->id]);

        // ── Test Doctor ──
        $doctor = User::create([
            'email' => 'doctor@medgama.com',
            'password' => 'doctor123',
            'fullname' => 'Dr. Ayşe Kaya',
            'role_id' => 'doctor',
            'mobile' => '+905001234569',
            'email_verified' => true,
            'mobile_verified' => true,
            'is_verified' => true,
            'clinic_id' => $clinic->id,
            'avatar' => 'https://gravatar.com/avatar/' . md5('doctor@medgama.com') . '?s=200&d=identicon',
        ]);

        // ── Test Patient ──
        $patient = User::create([
            'email' => 'patient@medgama.com',
            'password' => 'patient123',
            'fullname' => 'Ali Demir',
            'role_id' => 'patient',
            'mobile' => '+905001234570',
            'email_verified' => true,
            'mobile_verified' => true,
            'date_of_birth' => '1990-05-15',
            'gender' => 'male',
            'country_id' => 90,
            'avatar' => 'https://gravatar.com/avatar/' . md5('patient@medgama.com') . '?s=200&d=identicon',
        ]);

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
            $spec = Specialty::create($s);
            $specialtyIds[$s['code']] = $spec->id;
        }

        // ── Cities (Turkey) ──
        $cities = [
            ['code' => 'IST', 'country_id' => 90, 'translations' => ['en' => 'Istanbul', 'tr' => 'İstanbul']],
            ['code' => 'ANK', 'country_id' => 90, 'translations' => ['en' => 'Ankara', 'tr' => 'Ankara']],
            ['code' => 'IZM', 'country_id' => 90, 'translations' => ['en' => 'Izmir', 'tr' => 'İzmir']],
            ['code' => 'ANT', 'country_id' => 90, 'translations' => ['en' => 'Antalya', 'tr' => 'Antalya']],
            ['code' => 'BUR', 'country_id' => 90, 'translations' => ['en' => 'Bursa', 'tr' => 'Bursa']],
        ];

        // Cities (Germany)
        $citiesDE = [
            ['code' => 'BER', 'country_id' => 49, 'translations' => ['en' => 'Berlin', 'tr' => 'Berlin', 'de' => 'Berlin']],
            ['code' => 'MUN', 'country_id' => 49, 'translations' => ['en' => 'Munich', 'tr' => 'Münih', 'de' => 'München']],
            ['code' => 'HAM', 'country_id' => 49, 'translations' => ['en' => 'Hamburg', 'tr' => 'Hamburg', 'de' => 'Hamburg']],
        ];

        foreach (array_merge($cities, $citiesDE) as $c) {
            City::create($c);
        }

        // ── Symptom-Specialty Mappings ──
        $symptoms = [
            ['symptom' => 'chest_pain', 'specialty_ids' => [$specialtyIds['CARD']], 'translations' => ['en' => 'Chest Pain', 'tr' => 'Göğüs Ağrısı']],
            ['symptom' => 'headache', 'specialty_ids' => [$specialtyIds['NEUR']], 'translations' => ['en' => 'Headache', 'tr' => 'Baş Ağrısı']],
            ['symptom' => 'skin_rash', 'specialty_ids' => [$specialtyIds['DERM'], $specialtyIds['ALLE']], 'translations' => ['en' => 'Skin Rash', 'tr' => 'Cilt Döküntüsü']],
            ['symptom' => 'cough', 'specialty_ids' => [$specialtyIds['PULM'], $specialtyIds['ENT']], 'translations' => ['en' => 'Cough', 'tr' => 'Öksürük']],
            ['symptom' => 'stomach_pain', 'specialty_ids' => [$specialtyIds['GAST']], 'translations' => ['en' => 'Stomach Pain', 'tr' => 'Mide Ağrısı']],
            ['symptom' => 'joint_pain', 'specialty_ids' => [$specialtyIds['ORTH'], $specialtyIds['RHEU']], 'translations' => ['en' => 'Joint Pain', 'tr' => 'Eklem Ağrısı']],
            ['symptom' => 'blurred_vision', 'specialty_ids' => [$specialtyIds['OPHT']], 'translations' => ['en' => 'Blurred Vision', 'tr' => 'Bulanık Görme']],
            ['symptom' => 'anxiety', 'specialty_ids' => [$specialtyIds['PSYC']], 'translations' => ['en' => 'Anxiety', 'tr' => 'Anksiyete']],
            ['symptom' => 'frequent_urination', 'specialty_ids' => [$specialtyIds['UROL'], $specialtyIds['ENDO']], 'translations' => ['en' => 'Frequent Urination', 'tr' => 'Sık İdrara Çıkma']],
            ['symptom' => 'toothache', 'specialty_ids' => [$specialtyIds['DENT']], 'translations' => ['en' => 'Toothache', 'tr' => 'Diş Ağrısı']],
        ];

        foreach ($symptoms as $s) {
            SymptomSpecialtyMapping::create($s);
        }

        $this->command->info('Seeded: 1 admin, 1 clinic owner, 1 doctor, 1 patient, 20 specialties, 8 cities, 10 symptom mappings');
    }
}
