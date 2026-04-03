<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Clinic;
use App\Models\Hospital;
use App\Models\Branch;
use App\Models\Appointment;
use App\Models\DoctorProfile;
use App\Models\MedStreamPost;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ══════════════════════════════════════════════════════════════════
        //  CATALOG (Specialties, Cities, Diseases, Symptoms) — must run first
        // ══════════════════════════════════════════════════════════════════
        $this->call(CatalogSeeder::class);
        $this->call(TicketCategorySeeder::class);
        $this->call(AccreditationSeeder::class);

        // ══════════════════════════════════════════════════════════════════
        //  SUPER ADMIN
        // ══════════════════════════════════════════════════════════════════

        User::updateOrCreate(
            ['email' => 'admin@medagama.com'],
            [
                'id'              => 'f7103b85-fcda-4dec-92c6-c336f71fd3a2',
                'password'        => '123asd123',
                'fullname'        => 'Platform Admin',
                'role_id'         => 'superAdmin',
                'mobile'          => '+905001234567',
                'email_verified'  => true,
                'email_verified_at' => now(),
                'mobile_verified' => true,
                'is_verified'     => true,
                'is_active'       => true,
            ]
        );

        // ══════════════════════════════════════════════════════════════════
        //  HOSPITALS (5 adet — L4)
        // ══════════════════════════════════════════════════════════════════

        $hospitalData = [
            [
                'email'    => 'hospital@medagama.com',
                'password' => 'hospital123',
                'fullname' => 'Medipol İstanbul Yönetimi',
                'hospital' => [
                    'name'     => 'Medipol İstanbul',
                    'codename' => 'medipol-istanbul',
                    'fullname' => 'Medipol Mega Üniversite Hastanesi',
                    'avatar'   => 'https://images.unsplash.com/photo-1587351021759-3e566b3db4f1?w=400&q=80',
                    'address'  => 'Bağcılar Merkez, Medipol Blv. No:1, 34214 Bağcılar/İstanbul',
                    'biography'=> 'Türkiye\'nin en büyük özel hastane gruplarından biri olan Medipol, 13 hastane ve 50\'yi aşkın poliklinikle sağlık hizmeti sunmaktadır.',
                    'phone'    => '+902124605000',
                    'email'    => 'info@medipol.com.tr',
                    'website'  => 'https://www.medipol.com.tr',
                    'city'     => 'İstanbul',
                    'country'  => 'Türkiye',
                    'map_coordinates' => ['lat' => 41.0412, 'lng' => 28.8489],
                ],
            ],
            [
                'email'    => 'florence@medagama.com',
                'password' => 'hospital123',
                'fullname' => 'Florence Nightingale Yönetimi',
                'hospital' => [
                    'name'     => 'Florence Nightingale',
                    'codename' => 'florence-nightingale',
                    'fullname' => 'Florence Nightingale Hastanesi',
                    'avatar'   => 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&q=80',
                    'address'  => 'Abide-i Hürriyet Cad. No:166, 34381 Şişli/İstanbul',
                    'biography'=> '1950 yılından bu yana İstanbul\'un kalbinde modern tıbbın öncüsü olarak hizmet veren Florence Nightingale Hastanesi, onlarca branşıyla dünyaca tanınan bir sağlık merkezi.',
                    'phone'    => '+902122245000',
                    'email'    => 'info@florence.com.tr',
                    'website'  => 'https://www.florence.com.tr',
                    'city'     => 'İstanbul',
                    'country'  => 'Türkiye',
                    'map_coordinates' => ['lat' => 41.0597, 'lng' => 28.9862],
                ],
            ],
            [
                'email'    => 'memorial@medagama.com',
                'password' => 'hospital123',
                'fullname' => 'Memorial Hastanesi Yönetimi',
                'hospital' => [
                    'name'     => 'Memorial Hastanesi',
                    'codename' => 'memorial-hastanesi',
                    'fullname' => 'Memorial Sağlık Grubu',
                    'avatar'   => 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=400&q=80',
                    'address'  => 'Piyalepaşa Bulvarı No:4, 34385 Şişli/İstanbul',
                    'biography'=> 'Memorial, uluslararası standartlarda sunduğu hizmetler ile yurt içi ve yurt dışından binlerce hastaya kapılarını açmaktadır. JCI akreditasyonlu hastanesiyle dünya kalitesinde sağlık.',
                    'phone'    => '+902122121212',
                    'email'    => 'info@memorial.com.tr',
                    'website'  => 'https://www.memorial.com.tr',
                    'city'     => 'İstanbul',
                    'country'  => 'Türkiye',
                    'map_coordinates' => ['lat' => 41.0517, 'lng' => 28.9748],
                ],
            ],
            [
                'email'    => 'acibadem@medagama.com',
                'password' => 'hospital123',
                'fullname' => 'Acıbadem Sağlık Yönetimi',
                'hospital' => [
                    'name'     => 'Acıbadem',
                    'codename' => 'acibadem-saglik',
                    'fullname' => 'Acıbadem Sağlık Hizmetleri ve Ticaret A.Ş.',
                    'avatar'   => 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400&q=80',
                    'address'  => 'Tekin Sk. No:8, 34718 Kadıköy/İstanbul',
                    'biography'=> 'Acıbadem, 1991 yılından bu yana Türkiye\'de ve dünyada sağlık hizmetleri sunmaktadır. 20\'den fazla hastane, 15\'ten fazla tıp merkezi ile Türkiye\'nin en büyük özel sağlık grubu.',
                    'phone'    => '+902165004000',
                    'email'    => 'info@acibadem.com.tr',
                    'website'  => 'https://www.acibadem.com.tr',
                    'city'     => 'İstanbul',
                    'country'  => 'Türkiye',
                    'map_coordinates' => ['lat' => 40.9903, 'lng' => 29.0290],
                ],
            ],
            [
                'email'    => 'bayindir@medagama.com',
                'password' => 'hospital123',
                'fullname' => 'Bayındır Hastanesi Yönetimi',
                'hospital' => [
                    'name'     => 'Bayındır Hastanesi',
                    'codename' => 'bayindir-hastanesi',
                    'fullname' => 'Bayındır Sağlık Grubu',
                    'avatar'   => 'https://images.unsplash.com/photo-1632833239869-a37e3a5806d2?w=400&q=80',
                    'address'  => 'Söğütözü Cad. No:18, 06520 Söğütözü/Ankara',
                    'biography'=> 'Bayındır Hastanesi, Türkiye\'nin başkenti Ankara\'da 40 yılı aşkın süredir faaliyet göstermektedir. Onkoloji, kardiyoloji ve nöroloji branşlarında öncü merkez.',
                    'phone'    => '+903122876767',
                    'email'    => 'info@bayindirhastanesi.com.tr',
                    'website'  => 'https://www.bayindirhastanesi.com.tr',
                    'city'     => 'Ankara',
                    'country'  => 'Türkiye',
                    'map_coordinates' => ['lat' => 39.9104, 'lng' => 32.7988],
                ],
            ],
        ];

        $hospitalUsers = [];
        $hospitals     = [];

        foreach ($hospitalData as $index => $hd) {
            $hUser = User::updateOrCreate(
                ['email' => $hd['email']],
                [
                    'password'          => $hd['password'],
                    'fullname'          => $hd['fullname'],
                    'role_id'           => 'hospital',
                    'mobile'            => '+9050012345' . (70 + $index),
                    'email_verified'    => true,
                    'email_verified_at' => now(),
                    'mobile_verified'   => true,
                    'is_verified'       => true,
                    'is_active'         => true,
                    'is_crm_active'     => true,
                    'crm_expires_at'    => now()->addYears(2),
                ]
            );

            $h = Hospital::updateOrCreate(
                ['codename' => $hd['hospital']['codename']],
                array_merge($hd['hospital'], [
                    'owner_id'   => $hUser->id,
                    'is_verified'=> true,
                    'is_active'  => true,
                ])
            );

            $hUser->update(['hospital_id' => $h->id]);

            $hospitalUsers[] = $hUser;
            $hospitals[]     = $h;
        }

        // ══════════════════════════════════════════════════════════════════
        //  CLINICS (5 adet — L3)
        // ══════════════════════════════════════════════════════════════════

        $clinicData = [
            [
                'email'    => 'clinic@medagama.com',
                'password' => 'clinic123',
                'fullname' => 'Dr. Mehmet Yılmaz',
                'clinic'   => [
                    'name'      => 'MedaGama Sağlık',
                    'codename'  => 'medagama-clinic',
                    'fullname'  => 'MedaGama Sağlık Merkezi',
                    'avatar'    => 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&q=80',
                    'address'   => 'Levent, İstanbul, Türkiye',
                    'phone'     => '+905001234568',
                    'biography' => 'Modern sağlık hizmetleri sunan çok branşlı klinik.',
                    'specialties'=> ['Genel Cerrahi', 'İç Hastalıkları', 'Kardiyoloji'],
                    'hospital_index' => 0, // Medipol
                ],
            ],
            [
                'email'    => 'elitedental@medagama.com',
                'password' => 'clinic123',
                'fullname' => 'Dr. Selin Kaya',
                'clinic'   => [
                    'name'      => 'Elite Dental',
                    'codename'  => 'elite-dental-clinic',
                    'fullname'  => 'Elite Dental Ağız ve Diş Sağlığı Kliniği',
                    'avatar'    => 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&q=80',
                    'address'   => 'Bağdat Cad. No:142, Kadıköy/İstanbul',
                    'phone'     => '+902163456789',
                    'biography' => 'İmplant, ortodonti ve estetik diş hekimliğinde uzmanlık. 20 yıllık tecrübesiyle İstanbul\'un en güvenilir diş kliniği.',
                    'specialties'=> ['Diş Hekimliği', 'Ortodonti', 'İmplant', 'Estetik Diş'],
                    'hospital_index' => null,
                ],
            ],
            [
                'email'    => 'visioneye@medagama.com',
                'password' => 'clinic123',
                'fullname' => 'Dr. Murat Öztürk',
                'clinic'   => [
                    'name'      => 'Vision Eye Clinic',
                    'codename'  => 'vision-eye-clinic',
                    'fullname'  => 'Vision Göz Hastalıkları Merkezi',
                    'avatar'    => 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=400&q=80',
                    'address'   => 'Nispetiye Cad. No:30, Etiler/İstanbul',
                    'phone'     => '+902122129999',
                    'biography' => 'Excimer lazer, katarakt ve retina tedavisinde öncü göz merkezi. Avrupa standartlarında teknoloji ile net görüş.',
                    'specialties'=> ['Göz Hastalıkları', 'Lazer Göz', 'Katarakt'],
                    'hospital_index' => 2, // Memorial
                ],
            ],
            [
                'email'    => 'lifeortho@medagama.com',
                'password' => 'clinic123',
                'fullname' => 'Dr. Canan Demir',
                'clinic'   => [
                    'name'      => 'Life Ortopedi',
                    'codename'  => 'life-ortopedi-klinigi',
                    'fullname'  => 'Life Ortopedi ve Spor Kliniği',
                    'avatar'    => 'https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?w=400&q=80',
                    'address'   => 'Atatürk Bulvarı No:55, Çankaya/Ankara',
                    'phone'     => '+903122232323',
                    'biography' => 'Spor yaralanmaları, diz ve omuz cerrahisi, protez uygulamalarında uzmanlaşmış Ankara\'nın önde gelen ortopedi kliniği.',
                    'specialties'=> ['Ortopedi', 'Spor Hekimliği', 'Fizik Tedavi'],
                    'hospital_index' => 4, // Bayındır
                ],
            ],
            [
                'email'    => 'primecardio@medagama.com',
                'password' => 'clinic123',
                'fullname' => 'Dr. Kerem Arslan',
                'clinic'   => [
                    'name'      => 'Prime Cardio',
                    'codename'  => 'prime-cardio-merkezi',
                    'fullname'  => 'Prime Kardiyoloji ve Kalp Merkezi',
                    'avatar'    => 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&q=80',
                    'address'   => 'Alsancak, Mustafa Bey Cad. No:12, Konak/İzmir',
                    'phone'     => '+902325501010',
                    'biography' => 'Kardiyak görüntüleme, anjiyografi ve aritmoloji alanlarında öncü. İzmir\'in en kapsamlı kardiyoloji merkezi.',
                    'specialties'=> ['Kardiyoloji', 'Kalp Damar Cerrahisi', 'Girişimsel Kardiyoloji'],
                    'hospital_index' => null,
                ],
            ],
        ];

        $clinicOwnerUsers = [];
        $clinics          = [];

        foreach ($clinicData as $index => $cd) {
            $cUser = User::updateOrCreate(
                ['email' => $cd['email']],
                [
                    'password'          => $cd['password'],
                    'fullname'          => $cd['fullname'],
                    'role_id'           => 'clinicOwner',
                    'mobile'            => '+9050012345' . (80 + $index),
                    'email_verified'    => true,
                    'email_verified_at' => now(),
                    'mobile_verified'   => true,
                    'is_verified'       => true,
                    'is_active'         => true,
                    'is_crm_active'     => true,
                    'crm_expires_at'    => now()->addYear(),
                ]
            );

            $hospitalId = isset($cd['clinic']['hospital_index'])
                ? ($hospitals[$cd['clinic']['hospital_index']]->id ?? null)
                : null;

            $clinicPayload = [
                'name'                 => $cd['clinic']['name'],
                'codename'             => $cd['clinic']['codename'],
                'fullname'             => $cd['clinic']['fullname'],
                'avatar'               => $cd['clinic']['avatar'],
                'owner_id'             => $cUser->id,
                'hospital_id'          => $hospitalId,
                'address'              => $cd['clinic']['address'],
                'phone'                => $cd['clinic']['phone'],
                'biography'            => $cd['clinic']['biography'],
                'specialties'          => $cd['clinic']['specialties'],
                'is_verified'          => true,
                'is_crm_active'        => true,
                'crm_expires_at'       => now()->addYear(),
                'onboarding_completed' => true,
                'verification_status'  => 'verified',
            ];

            $clinic = Clinic::updateOrCreate(['codename' => $cd['clinic']['codename']], $clinicPayload);
            $cUser->update(['clinic_id' => $clinic->id]);

            $clinicOwnerUsers[] = $cUser;
            $clinics[]          = $clinic;
        }

        // ══════════════════════════════════════════════════════════════════
        //  DOCTORS (5 adet — L2)
        // ══════════════════════════════════════════════════════════════════

        $doctorData = [
            [
                'email'    => 'doctor@medagama.com',
                'password' => 'doctor123',
                'fullname' => 'Dr. Ayşe Kaya',
                'avatar'   => 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300&q=80',
                'clinic_index' => 0,
                'profile'  => [
                    'title'            => 'Uzm. Dr.',
                    'specialty'        => 'Kardiyoloji',
                    'bio'              => 'Kardiyoloji alanında 12 yıllık deneyime sahip uzman hekim. Ekokardiyografi, stres testi ve kalp ritim bozukluklarının tanı ve tedavisinde uzmanlaşmıştır.',
                    'experience_years' => '12',
                    'languages'        => ['Turkish', 'English'],
                    'online_consultation' => true,
                    'accepts_insurance'  => true,
                    'insurance_providers'=> ['SGK', 'Allianz', 'AXA'],
                    'avg_rating'         => 4.8,
                    'review_count'       => 142,
                    'education'          => [
                        ['degree' => 'Tıp Doktorası', 'school' => 'Hacettepe Üniversitesi Tıp Fakültesi', 'year' => '2008'],
                        ['degree' => 'Kardiyoloji Uzmanlığı', 'school' => 'İstanbul Üniversitesi Kardiyoloji ABD', 'year' => '2013'],
                    ],
                    'certifications'   => [
                        ['name' => 'Ekokardiyografi Sertifikası', 'issuer' => 'ESC', 'year' => '2015'],
                        ['name' => 'Girişimsel Kardiyoloji', 'issuer' => 'TÜRK-KARDİO', 'year' => '2018'],
                    ],
                ],
            ],
            [
                'email'    => 'drmustafa@medagama.com',
                'password' => 'doctor123',
                'fullname' => 'Prof. Dr. Mustafa Çelik',
                'avatar'   => 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&q=80',
                'clinic_index' => 2,
                'profile'  => [
                    'title'            => 'Prof. Dr.',
                    'specialty'        => 'Göz Hastalıkları',
                    'bio'              => 'Oftalmoloji alanında 20 yıllık akademik kariyer. Retina cerrahisi, glokom tedavisi ve refraktif cerrahide Türkiye\'nin önde gelen uzmanlarından.',
                    'experience_years' => '20',
                    'languages'        => ['Turkish', 'English', 'German'],
                    'online_consultation' => true,
                    'accepts_insurance'  => true,
                    'insurance_providers'=> ['SGK', 'Allianz', 'Mapfre'],
                    'avg_rating'         => 4.9,
                    'review_count'       => 287,
                    'education'          => [
                        ['degree' => 'Tıp Doktorası', 'school' => 'Marmara Üniversitesi Tıp Fakültesi', 'year' => '2001'],
                        ['degree' => 'Göz Hastalıkları Uzmanlığı', 'school' => 'İstanbul Eğitim Araştırma Hastanesi', 'year' => '2006'],
                        ['degree' => 'Doçentlik', 'school' => 'İstanbul Üniversitesi', 'year' => '2011'],
                    ],
                    'certifications'   => [
                        ['name' => 'Retina Cerrahisi Sertifikası', 'issuer' => 'SOE', 'year' => '2010'],
                    ],
                ],
            ],
            [
                'email'    => 'drfatma@medagama.com',
                'password' => 'doctor123',
                'fullname' => 'Dr. Fatma Şahin',
                'avatar'   => 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&q=80',
                'clinic_index' => 1,
                'profile'  => [
                    'title'            => 'Uzm. Dr.',
                    'specialty'        => 'Diş Hekimliği – Ortodonti',
                    'bio'              => 'Ortodonti ve estetik diş hekimliğinde uzman. Invisalign sertifikalı, metal ve şeffaf braket uygulamaları, dijital gülüş tasarımı konularında geniş deneyim.',
                    'experience_years' => '9',
                    'languages'        => ['Turkish', 'English'],
                    'online_consultation' => false,
                    'accepts_insurance'  => true,
                    'insurance_providers'=> ['SGK', 'AXA'],
                    'avg_rating'         => 4.7,
                    'review_count'       => 98,
                    'education'          => [
                        ['degree' => 'Diş Hekimliği Doktorası (DDS)', 'school' => 'Gazi Üniversitesi Dişhekimliği Fakültesi', 'year' => '2012'],
                        ['degree' => 'Ortodonti Uzmanlığı', 'school' => 'İstanbul Üniversitesi', 'year' => '2016'],
                    ],
                    'certifications'   => [
                        ['name' => 'Invisalign Sertifikası', 'issuer' => 'Align Technology', 'year' => '2018'],
                        ['name' => 'Dijital Diş Tasarımı DSD', 'issuer' => 'DSD Academy', 'year' => '2020'],
                    ],
                ],
            ],
            [
                'email'    => 'dremre@medagama.com',
                'password' => 'doctor123',
                'fullname' => 'Doç. Dr. Emre Yıldız',
                'avatar'   => 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&q=80',
                'clinic_index' => 3,
                'profile'  => [
                    'title'            => 'Doç. Dr.',
                    'specialty'        => 'Ortopedi ve Travmatoloji',
                    'bio'              => 'Diz eklemi artroskopisi, omuz cerrahisi ve spor yaralanmaları konusunda Ankara\'nın deneyimli uzmanı. Uluslararası kongrelerde 50\'den fazla bildiri.',
                    'experience_years' => '15',
                    'languages'        => ['Turkish', 'English', 'French'],
                    'online_consultation' => true,
                    'accepts_insurance'  => true,
                    'insurance_providers'=> ['SGK', 'Allianz', 'Generali'],
                    'avg_rating'         => 4.6,
                    'review_count'       => 203,
                    'education'          => [
                        ['degree' => 'Tıp Doktorası', 'school' => 'Ankara Üniversitesi Tıp Fakültesi', 'year' => '2005'],
                        ['degree' => 'Ortopedi Uzmanlığı', 'school' => 'Hacettepe Üniversitesi', 'year' => '2010'],
                    ],
                    'certifications'   => [
                        ['name' => 'Artroskopik Cerrahi Sertifikası', 'issuer' => 'ESSKA', 'year' => '2013'],
                        ['name' => 'Spor Hekimliği', 'issuer' => 'FIMS', 'year' => '2016'],
                    ],
                ],
            ],
            [
                'email'    => 'drnilufar@medagama.com',
                'password' => 'doctor123',
                'fullname' => 'Dr. Nilüfer Arslan',
                'avatar'   => 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=300&q=80',
                'clinic_index' => 4,
                'profile'  => [
                    'title'            => 'Uzm. Dr.',
                    'specialty'        => 'Kardiyoloji – Girişimsel',
                    'bio'              => 'Girişimsel kardiyoloji, koroner anjiyografi ve perkütan koroner girişim (PCI) alanında uzmanlaşmış. Özellikle kadın kalp hastalıkları üzerine araştırma yapıyor.',
                    'experience_years' => '11',
                    'languages'        => ['Turkish', 'English', 'Arabic'],
                    'online_consultation' => true,
                    'accepts_insurance'  => true,
                    'insurance_providers'=> ['SGK', 'AXA', 'Cigna'],
                    'avg_rating'         => 4.8,
                    'review_count'       => 175,
                    'education'          => [
                        ['degree' => 'Tıp Doktorası', 'school' => 'Ege Üniversitesi Tıp Fakültesi', 'year' => '2009'],
                        ['degree' => 'Kardiyoloji Uzmanlığı', 'school' => 'İzmir Atatürk Eğitim Araştırma Hastanesi', 'year' => '2014'],
                    ],
                    'certifications'   => [
                        ['name' => 'Girişimsel Kardiyoloji Sertifikası', 'issuer' => 'ESC', 'year' => '2017'],
                    ],
                ],
            ],
        ];

        // Build specialty text → ID lookup for Single Source of Truth (both EN and TR keys)
        $allSpecialties = \App\Models\Specialty::all();
        $specialtyMap = []; // lowercase name → specialty model
        foreach ($allSpecialties as $spec) {
            $raw = $spec->getAttributes()['name'];
            $decoded = is_string($raw) ? json_decode($raw, true) : $raw;
            if (is_array($decoded)) {
                foreach ($decoded as $locale => $name) {
                    $specialtyMap[mb_strtolower(trim($name))] = $spec;
                }
            } else {
                $specialtyMap[mb_strtolower(trim((string) $raw))] = $spec;
            }
        }

        $doctors = [];
        foreach ($doctorData as $index => $dd) {
            $clinic = $clinics[$dd['clinic_index']] ?? null;

            $doctor = User::updateOrCreate(
                ['email' => $dd['email']],
                [
                    'password'          => $dd['password'],
                    'fullname'          => $dd['fullname'],
                    'avatar'            => $dd['avatar'],
                    'role_id'           => 'doctor',
                    'mobile'            => '+9050012345' . (90 + $index),
                    'email_verified'    => true,
                    'email_verified_at' => now(),
                    'mobile_verified'   => true,
                    'is_verified'       => true,
                    'verification_status'=> 'verified',
                    'is_active'         => true,
                    'clinic_id'         => $clinic?->id,
                ]
            );

            // Resolve specialty_id from text name via locale-aware lookup
            $specText = $dd['profile']['specialty'] ?? '';
            $specId = null;
            // Normalize: "Kardiyoloji – Girişimsel" → "kardiyoloji", "Ortopedi ve Travmatoloji" → "ortopedi"
            $normalizedSpec = mb_strtolower(trim(preg_split('/[\s]*[–\-][\s]*/u', $specText)[0]));
            // Direct match
            if (isset($specialtyMap[$normalizedSpec])) {
                $specId = $specialtyMap[$normalizedSpec]->id;
            } else {
                // Fuzzy: match first word(s) — e.g. "ortopedi ve travmatoloji" matches "ortopedi"
                foreach ($specialtyMap as $key => $spec) {
                    if (str_starts_with($normalizedSpec, $key) || str_starts_with($key, $normalizedSpec)
                        || str_contains($key, $normalizedSpec) || str_contains($normalizedSpec, $key)) {
                        $specId = $spec->id;
                        break;
                    }
                }
            }

            $profileData = array_merge(['user_id' => $doctor->id], $dd['profile'], [
                'clinic_id'           => $clinic?->id,
                'specialty_id'        => $specId,
                'onboarding_completed' => true,
            ]);

            DoctorProfile::updateOrCreate(
                ['user_id' => $doctor->id],
                $profileData
            );

            $doctors[] = $doctor;
        }

        // ══════════════════════════════════════════════════════════════════
        //  DOCTOR FAQs (Dr. Ayşe Kaya — Cardiology)
        // ══════════════════════════════════════════════════════════════════

        $ayseKaya = $doctors[0] ?? null;
        if ($ayseKaya) {
            $faqData = [
                [
                    'question'   => 'Kardiyoloji muayenesine gelmeden önce ne yapmalıyım?',
                    'answer'     => 'Muayeneye gelmeden önce varsa önceki EKG, efor testi ve kan sonuçlarınızı yanınıza alın. Son 24 saat içinde kafein tüketimini azaltmanız ve rahat kıyafetler giymeniz önerilir. Kullandığınız ilaç listesini de getirmeniz tanı sürecini hızlandıracaktır.',
                    'sort_order' => 0,
                ],
                [
                    'question'   => 'Kalp çarpıntısı ne zaman ciddi bir durum olabilir?',
                    'answer'     => 'Çoğu çarpıntı zararsızdır ve stres, kafein veya uyku bozukluğundan kaynaklanır. Ancak çarpıntıya göğüs ağrısı, nefes darlığı, baş dönmesi veya bayılma eşlik ediyorsa, ya da çarpıntı düzensiz ve 10 dakikadan uzun sürüyorsa mutlaka bir kardiyoloğa başvurun. Erken tanı hayat kurtarır.',
                    'sort_order' => 1,
                ],
                [
                    'question'   => 'Online (uzaktan) kardiyoloji konsültasyonu mümkün mü?',
                    'answer'     => 'Evet, kontrol muayeneleri, ilaç ayarlamaları ve test sonucu değerlendirmeleri için online konsültasyon sunuyorum. İlk muayene veya fizik muayene gerektiren durumlar için yüz yüze görüşme gereklidir. Online randevu almak için profil sayfamdaki "Online Randevu" butonunu kullanabilirsiniz.',
                    'sort_order' => 2,
                ],
            ];
            foreach ($faqData as $fq) {
                \App\Models\DoctorFaq::updateOrCreate(
                    ['doctor_id' => $ayseKaya->id, 'question' => $fq['question']],
                    array_merge($fq, ['doctor_id' => $ayseKaya->id, 'is_active' => true])
                );
            }
        }

        // ══════════════════════════════════════════════════════════════════
        //  PATIENTS (5 adet — L1)
        // ══════════════════════════════════════════════════════════════════

        $patientData = [
            [
                'email'         => 'patient@medagama.com',
                'password'      => 'patient123',
                'fullname'      => 'Ali Demir',
                'date_of_birth' => '1990-05-15',
                'gender'        => 'male',
            ],
            [
                'email'         => 'zeynep@medagama.com',
                'password'      => 'patient123',
                'fullname'      => 'Zeynep Arslan',
                'date_of_birth' => '1985-11-22',
                'gender'        => 'female',
            ],
            [
                'email'         => 'kemal@medagama.com',
                'password'      => 'patient123',
                'fullname'      => 'Kemal Doğan',
                'date_of_birth' => '1978-03-08',
                'gender'        => 'male',
            ],
            [
                'email'         => 'sema@medagama.com',
                'password'      => 'patient123',
                'fullname'      => 'Sema Koç',
                'date_of_birth' => '1993-07-29',
                'gender'        => 'female',
            ],
            [
                'email'         => 'baris@medagama.com',
                'password'      => 'patient123',
                'fullname'      => 'Barış Yılmaz',
                'date_of_birth' => '2001-12-01',
                'gender'        => 'male',
            ],
        ];

        foreach ($patientData as $pd) {
            User::updateOrCreate(
                ['email' => $pd['email']],
                [
                    'password'          => $pd['password'],
                    'fullname'          => $pd['fullname'],
                    'role_id'           => 'patient',
                    'date_of_birth'     => $pd['date_of_birth'],
                    'gender'            => $pd['gender'],
                    'country_id'        => 90,
                    'email_verified'    => true,
                    'email_verified_at' => now(),
                    'mobile_verified'   => true,
                    'is_active'         => true,
                ]
            );
        }

        // ══════════════════════════════════════════════════════════════════
        //  MEDSTREAM POSTS (10 adet — profesyonel medikal içerik)
        // ══════════════════════════════════════════════════════════════════

        $posts = [
            // ── 1. VIDEO — Robotik Cerrahi Tanıtımı ──
            [
                'author'      => $doctors[0],  // Dr. Ayşe Kaya - Kardiyoloji
                'clinic'      => $clinics[0],
                'hospital'    => null,
                'post_type'   => 'video',
                'content'     => "🫀 Robotik kalp cerrahisinde yeni bir çağ başlıyor!\n\nArtık minimal invazif kalp ameliyatları, geleneksel açık cerrahiye kıyasla çok daha küçük kesilerle, daha az ağrı ve daha hızlı iyileşme ile yapılabilmektedir.\n\nBu videoda robotik kardiyovasküler cerrahi tekniklerimizi ve son teknoloji Da Vinci robotik sistemimizi tanıtıyoruz.\n\n#Kardiyoloji #RobotikCerrahi #KalpSağlığı #MinimalİnvazifCerrahi",
                'media'       => [
                    ['type' => 'video', 'url' => 'https://www.youtube.com/embed/cJ4LZOE1Dg0', 'thumbnail' => 'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=800&q=80'],
                ],
                'view_count'  => 1842,
            ],
            // ── 2. IMAGE — Yeni MRI Cihazı Duyurusu ──
            [
                'author'      => $hospitalUsers[0], // Medipol
                'clinic'      => null,
                'hospital'    => $hospitals[0],
                'post_type'   => 'image',
                'content'     => "🏥 Hastanemize yeni nesil 3T MRI sistemimiz kuruldu!\n\nSiemens MAGNETOM Vida 3T cihazımız, mükemmel görüntü kalitesi ve hasta konforu ile nöroloji, ortopedi ve onkoloji tanılarında devrim yaratacak.\n\n✅ 60 cm geniş tünel ile klostrofobi azaltılmış\n✅ Ultra hızlı tarama protokolleri\n✅ AI destekli görüntü analizi\n\nRandevu almak için: +90 212 460 5000\n\n#Medipol #MRI #TıbbiGörüntüleme #Radyoloji",
                'media'       => [
                    ['type' => 'image', 'url' => 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=1200&q=80'],
                ],
                'view_count'  => 3421,
            ],
            // ── 3. TEXT — Kalp Sağlığı İpuçları ──
            [
                'author'      => $doctors[0], // Dr. Ayşe Kaya
                'clinic'      => $clinics[0],
                'hospital'    => null,
                'post_type'   => 'text',
                'content'     => "❤️ GÜNLÜK KARDİYOVASKÜLER SAĞLIK İPUÇLARI\n\nHer gün uygulayabileceğiniz 5 basit adım:\n\n1️⃣ Yürüyüş: Günde en az 30 dakika tempolu yürüyüş, kalp kasınızı güçlendirir ve kan basıncını dengeler.\n\n2️⃣ Tuz kısıtlaması: Günlük tuz tüketimini 5 gramın altında tutun. Hazır gıdaların tuz içeriğini mutlaka kontrol edin.\n\n3️⃣ Uyku: 7-9 saat kaliteli uyku, kardiyovasküler risk faktörlerini önemli ölçüde azaltır.\n\n4️⃣ Stres yönetimi: Kronik stres, kalp hastalığı için bağımsız bir risk faktörüdür. Meditasyon ve nefes egzersizleri deneyin.\n\n5️⃣ Düzenli kontrol: 40 yaşından sonra yıllık kardiyoloji kontrol yaptırmayı ihmal etmeyin.\n\n💙 Sorularınız için DM'den ulaşabilirsiniz.\n\n#KalpSağlığı #Kardiyoloji #SağlıklıYaşam #PreventiveCardiology",
                'media'       => [],
                'view_count'  => 2156,
            ],
            // ── 4. VIDEO — Lazer Göz Ameliyatı ──
            [
                'author'      => $doctors[1], // Prof. Dr. Mustafa Çelik
                'clinic'      => $clinics[2],
                'hospital'    => null,
                'post_type'   => 'video',
                'content'     => "👁️ LASIK vs SMILE Pro — Hangisi Size Uygun?\n\nGözlük ve lens kullanıcıları için refraktif cerrahi seçeneklerini karşılaştırdığımız yeni videomuzu yayınladık!\n\n🔬 Bu videoda:\n• LASIK (Excimer Lazer) prosedürü\n• SMILE Pro (flapless lazer) avantajları\n• Kimler aday olabilir, kimler olamaz?\n• İyileşme süreci ve beklentiler\n\nSorusu olan tüm hastalarımızı muayenehane ziyaretine bekliyoruz.\n\n#LazerGöz #LASIK #SMILE #GözSağlığı #Oftalmoloji",
                'media'       => [
                    ['type' => 'video', 'url' => 'https://www.youtube.com/embed/Z87cPnyzHts', 'thumbnail' => 'https://images.unsplash.com/photo-1609610268806-53e2b5b6fcb7?w=800&q=80'],
                ],
                'view_count'  => 4287,
            ],
            // ── 5. IMAGE — Ortodonti Öncesi/Sonrası ──
            [
                'author'      => $doctors[2], // Dr. Fatma Şahin
                'clinic'      => $clinics[1],
                'hospital'    => null,
                'post_type'   => 'image',
                'content'     => "😁 Invisalign ile 14 ayda hayat değişiyor!\n\nHastamız Aylin H.'nin Invisalign tedavisi tamamlandı. Tedavi öncesi ve sonrası karşılaştırmalı görüntüler paylaşıyorum (hasta onayıyla).\n\nInvisalign'ın avantajları:\n✅ Görünmez şeffaf plaklar\n✅ Yemek yerken çıkarabilme\n✅ Kolay ağız hijyeni\n✅ Metal diş teli rahatsızlığı yok\n✅ Dijital simülasyonla tedavi sonucunu önceden görme\n\nSiz de gülüşünüzü dönüştürmek ister misiniz? Ücretsiz konsültasyon için randevu alın.\n\n#Orthodontics #Invisalign #DiştabiyiHakiyer #GülüşTasarımı",
                'media'       => [
                    ['type' => 'image', 'url' => 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1200&q=80'],
                    ['type' => 'image', 'url' => 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=1200&q=80'],
                ],
                'view_count'  => 5631,
            ],
            // ── 6. IMAGE — Florence Nightingale Sağlık Haberi ──
            [
                'author'      => $hospitalUsers[1], // Florence Nightingale
                'clinic'      => null,
                'hospital'    => $hospitals[1],
                'post_type'   => 'image',
                'content'     => "🎗️ Meme Kanseri Farkındalık Ayı — Erken Teşhis Hayat Kurtarır!\n\nEkim ayında 3 boyutlu mamografi taramalarında %30 indirim uyguluyoruz.\n\nMeme kanseri, kadınlarda en sık görülen kanser türüdür. Ancak erken teşhisle tedavi şansı dramatik biçimde artmaktadır.\n\n📅 Randevu: 0212 224 5000\n🏥 Florence Nightingale Hastanesi — Tüm şubelerimizde geçerlidir.\n\nSevdiklerinize hatırlatın, paylaşın. ❤️\n\n#MemeKanseri #ErkenTeşhis #KadınSağlığı #Onkoloji #FlorenceNightingale",
                'media'       => [
                    ['type' => 'image', 'url' => 'https://images.unsplash.com/photo-1582560469781-1ef6a2f96cb7?w=1200&q=80'],
                ],
                'view_count'  => 8910,
            ],
            // ── 7. VIDEO — Diz Artroskopisi ──
            [
                'author'      => $doctors[3], // Doç. Dr. Emre Yıldız
                'clinic'      => $clinics[3],
                'hospital'    => null,
                'post_type'   => 'video',
                'content'     => "🦵 Diz Menisküs Yırtığında Artroskopik Cerrahi\n\nSon dönemde spora başlayan veya aktif yaşam süren bireylerde menisküs yırtığı oldukça sık karşılaşılan bir sorun.\n\nBu eğitim videosunda:\n🔹 Menisküs anatomisi\n🔹 Artroskopik tanı ve tedavi yöntemi\n🔹 Operasyon sonrası rehabilitasyon\n🔹 Tekrar spora dönüş süreci\n\nAmeliyatsız çözüm mümkün mü? Her vakayı ayrı değerlendiriyoruz.\n\n#Ortopedi #Artroskopi #Menisküs #SporCerrahisi #FizikTedavi",
                'media'       => [
                    ['type' => 'video', 'url' => 'https://www.youtube.com/embed/hAeq0OBvwDk', 'thumbnail' => 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&q=80'],
                ],
                'view_count'  => 3154,
            ],
            // ── 8. IMAGE — Anjiyografi Başarı Hikayesi ──
            [
                'author'      => $doctors[4], // Dr. Nilüfer Arslan
                'clinic'      => $clinics[4],
                'hospital'    => null,
                'post_type'   => 'image',
                'content'     => "💪 Başarılı bir PCI (Koroner Stent) vakası!\n\n55 yaşındaki hastamızda tek damar hastalığı saptandı. LAD'ında kritik darlık bulunan hastamıza perkütan koroner girişim (PCI) ile ilaç kaplı stent implante ettik.\n\nHasta 2 gün içinde taburcu edildi ve şu an aktif yaşamına devam ediyor.\n\n⚠️ Göğüs ağrısını, nefes darlığını ve çarpıntıyı asla görmezden gelmeyin.\n📞 Kardiyoloji acil: +90 232 550 1010\n\n#Kardiyoloji #Anjiyografi #KoroneStent #KalpDamar #İzmirKardiyoloji",
                'media'       => [
                    ['type' => 'image', 'url' => 'https://images.unsplash.com/photo-1530026405186-ed1f139313f0?w=1200&q=80'],
                ],
                'view_count'  => 1974,
            ],
            // ── 9. TEXT — Acıbadem Sağlık Haberi ──
            [
                'author'      => $hospitalUsers[3], // Acıbadem
                'clinic'      => null,
                'hospital'    => $hospitals[3],
                'post_type'   => 'text',
                'content'     => "🌟 Acıbadem, Uluslararası JCI Akreditasyonunu Yeniledi!\n\nJoint Commission International (JCI) akreditasyonu, dünyanın en prestijli hastane kalite belgesidir. Hastanemiz bu yıl 5. kez bu belgeyi başarıyla yenileyerek sağlık hizmetlerindeki üstün kalitemizi kanıtlamış oldu.\n\nJCI akreditasyonu ne anlama gelir?\n\n🔍 Hasta güvenliği protokolleri en yüksek standartta\n💉 İlaç yönetimi ve enfeksiyon kontrolü eksiksiz\n👨‍⚕️ Personel yetkinlik ve eğitim sistemleri düzenli denetleniyor\n📋 Hasta hakları ve mahremiyeti korunuyor\n\nAcıbadem ailesine güvenen tüm hastalarımıza teşekkür ederiz. 🙏\n\n#JCI #Akreditasyon #HastaneKalitesi #PatientSafety #Acıbadem",
                'media'       => [],
                'view_count'  => 6420,
            ],
            // ── 10. IMAGE — Memorial Yeni Binası ──
            [
                'author'      => $hospitalUsers[2], // Memorial
                'clinic'      => null,
                'hospital'    => $hospitals[2],
                'post_type'   => 'image',
                'content'     => "🏗️ Memorial Bahçelievler açılıyor!\n\nMemorial Sağlık Grubu'nun 8. İstanbul hastanesi olan Memorial Bahçelievler, 2025 baharında kapılarını açıyor.\n\n📐 300 yataklı yeni nesil hastane\n🧬 Gen ve kök hücre tedavi merkezi\n🤖 Robotik cerrahi ünitesi\n🏥 24 branşta poliklinik hizmetleri\n🅿️ 800 araçlık otopark\n\nŞimdiden randevu talebinizi ön kayıt formumuzdan yapabilirsiniz.\n\n🔗 www.memorial.com.tr/bahcelievler\n\n#MemorialBahçelievler #YeniHastane #Açılış #Sağlık #İstanbul",
                'media'       => [
                    ['type' => 'image', 'url' => 'https://images.unsplash.com/photo-1587351021759-3e566b3db4f1?w=1200&q=80'],
                    ['type' => 'image', 'url' => 'https://images.unsplash.com/photo-1577375729152-4c8b5fcda381?w=1200&q=80'],
                ],
                'view_count'  => 12340,
            ],
        ];

        foreach ($posts as $p) {
            try {
                MedStreamPost::updateOrCreate(
                    [
                        'author_id' => $p['author']->id,
                        'content'   => substr($p['content'], 0, 80), // match on first 80 chars
                    ],
                    [
                        'author_id'    => $p['author']->id,
                        'clinic_id'    => $p['clinic']?->id,
                        'hospital_id'  => $p['hospital']?->id,
                        'post_type'    => $p['post_type'],
                        'content'      => $p['content'],
                        'media'        => $p['media'],
                        'is_active'    => true,
                        'is_hidden'    => false,
                        'is_anonymous' => false,
                        'gdpr_consent' => true,
                        'view_count'   => $p['view_count'],
                    ]
                );
            } catch (\Throwable $e) {
                $this->command->warn('Post skipped: ' . $e->getMessage());
            }
        }

        // ══════════════════════════════════════════════════════════════════
        //  MEDSTREAM SAMPLE POSTS
        // ══════════════════════════════════════════════════════════════════

        $this->call(MedStreamSampleSeeder::class);

        // ══════════════════════════════════════════════════════════════════
        //  CATALOG DATA
        // ══════════════════════════════════════════════════════════════════

        $this->call(CatalogSeeder::class);

        // ══════════════════════════════════════════════════════════════════
        //  SUMMARY
        // ══════════════════════════════════════════════════════════════════

        $this->command->info('');
        $this->command->info('╔═══════════════════════════════════════════════════════════════════╗');
        $this->command->info('║  MedaGama Demo Database — Seeded!                                ║');
        $this->command->info('╠═══════════════════════════════════════════════════════════════════╣');
        $this->command->info('║  ADMIN:                                                          ║');
        $this->command->info('║    admin@medagama.com            / 123asd123                     ║');
        $this->command->info('╠═══════════════════════════════════════════════════════════════════╣');
        $this->command->info('║  HOSPITALS (L4):                                                 ║');
        $this->command->info('║    hospital@medagama.com         / hospital123  (Medipol)        ║');
        $this->command->info('║    florence@medagama.com         / hospital123  (Florence N.)   ║');
        $this->command->info('║    memorial@medagama.com         / hospital123  (Memorial)       ║');
        $this->command->info('║    acibadem@medagama.com         / hospital123  (Acıbadem)       ║');
        $this->command->info('║    bayindir@medagama.com         / hospital123  (Bayındır)       ║');
        $this->command->info('╠═══════════════════════════════════════════════════════════════════╣');
        $this->command->info('║  CLINICS (L3):                                                   ║');
        $this->command->info('║    clinic@medagama.com           / clinic123   (MedaGama)        ║');
        $this->command->info('║    elitedental@medagama.com      / clinic123   (Elite Dental)    ║');
        $this->command->info('║    visioneye@medagama.com        / clinic123   (Vision Eye)      ║');
        $this->command->info('║    lifeortho@medagama.com        / clinic123   (Life Ortopedi)   ║');
        $this->command->info('║    primecardio@medagama.com      / clinic123   (Prime Cardio)    ║');
        $this->command->info('╠═══════════════════════════════════════════════════════════════════╣');
        $this->command->info('║  DOCTORS (L2):                                                   ║');
        $this->command->info('║    doctor@medagama.com           / doctor123   (Dr. Ayşe Kaya)  ║');
        $this->command->info('║    drmustafa@medagama.com        / doctor123   (Prof. Dr. Çelik)║');
        $this->command->info('║    drfatma@medagama.com          / doctor123   (Dr. Şahin)       ║');
        $this->command->info('║    dremre@medagama.com           / doctor123   (Doç. Dr. Yıldız)║');
        $this->command->info('║    drnilufar@medagama.com        / doctor123   (Dr. Arslan)      ║');
        $this->command->info('╠═══════════════════════════════════════════════════════════════════╣');
        $this->command->info('║  PATIENTS (L1):                                                  ║');
        $this->command->info('║    patient@medagama.com          / patient123  (Ali Demir)       ║');
        $this->command->info('║    zeynep@medagama.com           / patient123  (Zeynep Arslan)   ║');
        $this->command->info('║    kemal@medagama.com            / patient123  (Kemal Doğan)     ║');
        $this->command->info('║    sema@medagama.com             / patient123  (Sema Koç)        ║');
        $this->command->info('║    baris@medagama.com            / patient123  (Barış Yılmaz)    ║');
        $this->command->info('╠═══════════════════════════════════════════════════════════════════╣');
        $this->command->info('║  MEDSTREAM: 10 professional posts (3 video, 4 image, 3 text)    ║');
        $this->command->info('╚═══════════════════════════════════════════════════════════════════╝');
    }
}
