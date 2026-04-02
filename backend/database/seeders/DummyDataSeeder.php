<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Clinic;
use App\Models\DoctorProfile;
use App\Models\MedStreamPost;
use App\Models\MedStreamComment;
use App\Models\MedStreamLike;
use App\Models\MedStreamBookmark;
use App\Models\Scopes\VisiblePostScope;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DummyDataSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Create 5 Clinics (different specialties) ──
        $clinics = [
            [
                'name' => 'Istanbul Heart Center',
                'fullname' => 'Istanbul Cardiovascular & Heart Surgery Center',
                'specialties' => ['Cardiology', 'Cardiovascular Surgery'],
                'city' => 'Istanbul',
                'phone' => '+90 212 555 0101',
            ],
            [
                'name' => 'Ankara Dental Clinic',
                'fullname' => 'Ankara Advanced Dental Care & Orthodontics',
                'specialties' => ['Dentistry', 'Orthodontics'],
                'city' => 'Ankara',
                'phone' => '+90 312 555 0202',
            ],
            [
                'name' => 'Izmir Eye Hospital',
                'fullname' => 'Izmir Ophthalmology & Laser Eye Surgery Center',
                'specialties' => ['Ophthalmology', 'Laser Surgery'],
                'city' => 'Izmir',
                'phone' => '+90 232 555 0303',
            ],
            [
                'name' => 'Antalya Dermatology',
                'fullname' => 'Antalya Skin & Aesthetic Medicine Clinic',
                'specialties' => ['Dermatology', 'Aesthetic Medicine'],
                'city' => 'Antalya',
                'phone' => '+90 242 555 0404',
            ],
            [
                'name' => 'Bursa Orthopedics',
                'fullname' => 'Bursa Orthopedic Surgery & Sports Medicine Center',
                'specialties' => ['Orthopedics', 'Sports Medicine'],
                'city' => 'Bursa',
                'phone' => '+90 224 555 0505',
            ],
        ];

        $createdClinics = [];
        foreach ($clinics as $idx => $clinicData) {
            // Create clinic owner
            $owner = User::create([
                'email' => 'clinic' . ($idx + 1) . '@medgama.com',
                'password' => Hash::make('password123'),
                'fullname' => $clinicData['name'] . ' Admin',
                'role_id' => 'clinicOwner',
                'is_verified' => true,
                'email_verified' => true,
                'mobile' => $clinicData['phone'],
            ]);

            // Create clinic
            $clinic = Clinic::create([
                'name' => $clinicData['name'],
                'fullname' => $clinicData['fullname'],
                'codename' => Str::slug($clinicData['name']) . '-' . Str::random(4),
                'owner_id' => $owner->id,
                'address' => $clinicData['city'] . ', Turkey',
                'phone' => $clinicData['phone'],
                'biography' => 'Leading healthcare provider in ' . $clinicData['city'] . ' specializing in ' . implode(' and ', $clinicData['specialties']) . '.',
                'is_verified' => true,
                'is_active' => true,
                'is_crm_active' => true,
                'crm_expires_at' => now()->addYear(),
                'specialties' => $clinicData['specialties'],
                'onboarding_completed' => true,
            ]);

            $owner->update(['clinic_id' => $clinic->id]);
            $createdClinics[] = ['clinic' => $clinic, 'specialties' => $clinicData['specialties']];
        }

        // ── 2. Create 5 Doctors (assign to clinics) ──
        $doctors = [
            ['name' => 'Dr. Mehmet Yılmaz', 'specialty' => 'Cardiology', 'title' => 'Prof. Dr.', 'experience' => 15],
            ['name' => 'Dr. Ayşe Kaya', 'specialty' => 'Dentistry', 'title' => 'Dr.', 'experience' => 8],
            ['name' => 'Dr. Ahmet Demir', 'specialty' => 'Ophthalmology', 'title' => 'Assoc. Prof. Dr.', 'experience' => 12],
            ['name' => 'Dr. Zeynep Şahin', 'specialty' => 'Dermatology', 'title' => 'Dr.', 'experience' => 10],
            ['name' => 'Dr. Can Öztürk', 'specialty' => 'Orthopedics', 'title' => 'Prof. Dr.', 'experience' => 18],
        ];

        $createdDoctors = [];
        foreach ($doctors as $idx => $doctorData) {
            // Find matching clinic
            $clinicMatch = collect($createdClinics)->first(function ($item) use ($doctorData) {
                return in_array($doctorData['specialty'], $item['specialties']);
            });

            $doctor = User::create([
                'email' => 'doctor' . ($idx + 1) . '@medgama.com',
                'password' => Hash::make('password123'),
                'fullname' => $doctorData['name'],
                'role_id' => 'doctor',
                'is_verified' => true,
                'email_verified' => true,
                'clinic_id' => $clinicMatch ? $clinicMatch['clinic']->id : null,
                'is_crm_active' => true,
                'crm_expires_at' => now()->addYear(),
            ]);

            // Create doctor profile
            DoctorProfile::create([
                'user_id' => $doctor->id,
                'specialty' => $doctorData['specialty'],
                'title' => $doctorData['title'],
                'experience_years' => $doctorData['experience'],
                'bio' => 'Experienced ' . $doctorData['specialty'] . ' specialist with ' . $doctorData['experience'] . ' years of practice.',
                'languages' => ['Turkish', 'English'],
                'education' => ['Istanbul University Faculty of Medicine'],
                'certifications' => ['Board Certified in ' . $doctorData['specialty']],
                'onboarding_completed' => true,
            ]);

            $createdDoctors[] = $doctor;
        }

        // ── 3. Create 5 Patients ──
        $patients = [
            ['name' => 'Ali Yıldız', 'email' => 'patient1@medgama.com', 'gender' => 'male', 'dob' => '1985-03-15'],
            ['name' => 'Fatma Arslan', 'email' => 'patient2@medgama.com', 'gender' => 'female', 'dob' => '1990-07-22'],
            ['name' => 'Emre Çelik', 'email' => 'patient3@medgama.com', 'gender' => 'male', 'dob' => '1978-11-08'],
            ['name' => 'Selin Aydın', 'email' => 'patient4@medgama.com', 'gender' => 'female', 'dob' => '1995-05-30'],
            ['name' => 'Burak Koç', 'email' => 'patient5@medgama.com', 'gender' => 'male', 'dob' => '1988-09-12'],
        ];

        $createdPatients = [];
        foreach ($patients as $patientData) {
            $patient = User::create([
                'email' => $patientData['email'],
                'password' => Hash::make('password123'),
                'fullname' => $patientData['name'],
                'role_id' => 'patient',
                'email_verified' => true,
                'gender' => $patientData['gender'],
                'date_of_birth' => $patientData['dob'],
            ]);
            $createdPatients[] = $patient;
        }

        // ── 4. Create MedStream Posts (realistic medical content) ──
        $posts = [
            [
                'author' => $createdDoctors[0],
                'content' => '🫀 Understanding Heart Health: Regular cardiovascular check-ups are crucial for early detection of heart disease. Key indicators include blood pressure, cholesterol levels, and ECG results. Prevention is always better than cure! #Cardiology #HeartHealth',
            ],
            [
                'author' => $createdDoctors[1],
                'content' => '🦷 Dental Hygiene Tips: Brushing twice daily is essential, but don\'t forget to floss! Flossing removes plaque between teeth where your toothbrush can\'t reach. Your gums will thank you! #DentalCare #OralHealth',
            ],
            [
                'author' => $createdDoctors[2],
                'content' => '👁️ Eye Care in the Digital Age: Spending long hours in front of screens? Follow the 20-20-20 rule: Every 20 minutes, look at something 20 feet away for 20 seconds. This simple habit can prevent digital eye strain. #EyeHealth #Ophthalmology',
            ],
            [
                'author' => $createdDoctors[3],
                'content' => '☀️ Skin Protection Reminder: UV radiation is the leading cause of premature skin aging and skin cancer. Always use SPF 30+ sunscreen, even on cloudy days. Your skin is your largest organ—protect it! #Dermatology #SkinCare',
            ],
            [
                'author' => $createdDoctors[4],
                'content' => '🏃‍♂️ Joint Health & Exercise: Low-impact exercises like swimming and cycling are excellent for maintaining joint health without excessive stress. Remember: movement is medicine! #Orthopedics #JointHealth',
            ],
            [
                'author' => $createdDoctors[0],
                'content' => 'Exciting news! Our clinic just acquired state-of-the-art cardiac imaging equipment. This will allow us to provide even more accurate diagnoses and better patient outcomes. #MedicalTechnology #Innovation',
            ],
            [
                'author' => $createdDoctors[2],
                'content' => 'Attended an amazing ophthalmology conference today. The latest advances in laser eye surgery are truly remarkable. The future of vision correction is here! #MedicalConference #LASIK',
            ],
            [
                'author' => $createdDoctors[3],
                'content' => '📊 Case Study: Successfully treated a patient with severe acne using a combination of topical retinoids and oral antibiotics. Results after 3 months were outstanding. Personalized treatment plans make all the difference! #Dermatology #CaseStudy',
            ],
        ];

        $createdPosts = [];
        foreach ($posts as $postData) {
            $post = MedStreamPost::withoutGlobalScope(VisiblePostScope::class)->create([
                'author_id' => $postData['author']->id,
                'content' => $postData['content'],
                'is_active' => true,
                'is_hidden' => false,
                'gdpr_consent' => true,
                'created_at' => now()->subDays(rand(1, 30)),
            ]);
            $createdPosts[] = $post;
        }

        // ── 5. Add Interactions (likes, comments, bookmarks) ──
        foreach ($createdPosts as $post) {
            // Random likes from doctors and patients
            $likers = collect([...$createdDoctors, ...$createdPatients])->random(rand(2, 5));
            foreach ($likers as $liker) {
                MedStreamLike::create([
                    'post_id' => $post->id,
                    'user_id' => $liker->id,
                    'is_active' => true,
                ]);
            }

            // Random comments
            $commenters = collect([...$createdDoctors, ...$createdPatients])->random(rand(1, 3));
            $commentTexts = [
                'Very informative, thank you for sharing!',
                'This is exactly what I needed to know.',
                'Great advice! I\'ll definitely follow this.',
                'Thank you doctor, very helpful information.',
                'Excellent post! Keep sharing such valuable content.',
                'This helped me understand my condition better.',
            ];

            foreach ($commenters as $commenter) {
                MedStreamComment::create([
                    'post_id' => $post->id,
                    'author_id' => $commenter->id,
                    'content' => $commentTexts[array_rand($commentTexts)],
                    'is_active' => true,
                    'is_hidden' => false,
                    'created_at' => now()->subDays(rand(1, 20)),
                ]);
            }

            // Random bookmarks
            $bookmarkers = collect([...$createdDoctors, ...$createdPatients])->random(rand(1, 3));
            foreach ($bookmarkers as $bookmarker) {
                MedStreamBookmark::create([
                    'user_id' => $bookmarker->id,
                    'bookmarked_type' => 'post',
                    'target_id' => $post->id,
                    'is_active' => true,
                ]);
            }
        }

        $this->command->info('✅ Dummy data created successfully!');
        $this->command->info('📊 Summary:');
        $this->command->info('   - 5 Clinics (with owners)');
        $this->command->info('   - 5 Doctors (verified, with profiles)');
        $this->command->info('   - 5 Patients');
        $this->command->info('   - ' . count($createdPosts) . ' MedStream Posts');
        $this->command->info('   - Likes, Comments, and Bookmarks added');
        $this->command->info('');
        $this->command->info('🔑 Login credentials:');
        $this->command->info('   Clinics: clinic1@medgama.com to clinic5@medgama.com');
        $this->command->info('   Doctors: doctor1@medgama.com to doctor5@medgama.com');
        $this->command->info('   Patients: patient1@medgama.com to patient5@medgama.com');
        $this->command->info('   Password: password123');
    }
}
