<?php

namespace Database\Seeders;

use App\Models\City;
use App\Models\DiseaseCondition;
use App\Models\Icd10Code;
use App\Models\Specialty;
use App\Models\SymptomSpecialtyMapping;
use Illuminate\Database\Seeder;

class CatalogSeeder extends Seeder
{
    /**
     * Seed catalog data with multilingual (TR + EN) translations.
     * Uses updateOrCreate for idempotency — safe to run multiple times.
     */
    public function run(): void
    {
        $this->seedSpecialties();
        $this->seedCities();
        $this->seedDiseases();
        $this->seedSymptoms();
        $this->seedIcd10Codes();

        $this->command->info('✅ Catalog seeded with TR + EN translations.');
    }

    private function seedSpecialties(): void
    {
        $specialties = [
            [
                'code' => 'CARD',
                'display_order' => 1,
                'name' => ['en' => 'Cardiology', 'tr' => 'Kardiyoloji'],
                'description' => [
                    'en' => 'Diagnosis and treatment of heart and cardiovascular system diseases.',
                    'tr' => 'Kalp ve kardiyovasküler sistem hastalıklarının tanı ve tedavisi.',
                ],
            ],
            [
                'code' => 'DERM',
                'display_order' => 2,
                'name' => ['en' => 'Dermatology', 'tr' => 'Dermatoloji'],
                'description' => [
                    'en' => 'Diagnosis and treatment of skin, hair, and nail disorders.',
                    'tr' => 'Cilt, saç ve tırnak hastalıklarının tanı ve tedavisi.',
                ],
            ],
            [
                'code' => 'ENDO',
                'display_order' => 3,
                'name' => ['en' => 'Endocrinology', 'tr' => 'Endokrinoloji'],
                'description' => [
                    'en' => 'Treatment of hormonal disorders including diabetes and thyroid diseases.',
                    'tr' => 'Diyabet ve tiroid hastalıkları dahil hormonal bozuklukların tedavisi.',
                ],
            ],
            [
                'code' => 'ENT',
                'display_order' => 4,
                'name' => ['en' => 'Ear, Nose & Throat (ENT)', 'tr' => 'Kulak Burun Boğaz (KBB)'],
                'description' => [
                    'en' => 'Treatment of ear, nose, throat, and head/neck disorders.',
                    'tr' => 'Kulak, burun, boğaz ve baş/boyun bölgesi hastalıklarının tedavisi.',
                ],
            ],
            [
                'code' => 'GAST',
                'display_order' => 5,
                'name' => ['en' => 'Gastroenterology', 'tr' => 'Gastroenteroloji'],
                'description' => [
                    'en' => 'Diagnosis and treatment of digestive system disorders.',
                    'tr' => 'Sindirim sistemi hastalıklarının tanı ve tedavisi.',
                ],
            ],
            [
                'code' => 'GENS',
                'display_order' => 6,
                'name' => ['en' => 'General Surgery', 'tr' => 'Genel Cerrahi'],
                'description' => [
                    'en' => 'Surgical treatment of abdominal organs, thyroid, breast, and soft tissue.',
                    'tr' => 'Karın organları, tiroid, meme ve yumuşak doku cerrahi tedavisi.',
                ],
            ],
            [
                'code' => 'GYNE',
                'display_order' => 7,
                'name' => ['en' => 'Gynecology & Obstetrics', 'tr' => 'Kadın Hastalıkları ve Doğum'],
                'description' => [
                    'en' => 'Women\'s reproductive health, pregnancy, and childbirth.',
                    'tr' => 'Kadın üreme sağlığı, gebelik ve doğum.',
                ],
            ],
            [
                'code' => 'NEUR',
                'display_order' => 8,
                'name' => ['en' => 'Neurology', 'tr' => 'Nöroloji'],
                'description' => [
                    'en' => 'Diagnosis and treatment of brain and nervous system disorders.',
                    'tr' => 'Beyin ve sinir sistemi hastalıklarının tanı ve tedavisi.',
                ],
            ],
            [
                'code' => 'ONCO',
                'display_order' => 9,
                'name' => ['en' => 'Oncology', 'tr' => 'Onkoloji'],
                'description' => [
                    'en' => 'Diagnosis, treatment, and management of cancer.',
                    'tr' => 'Kanser tanı, tedavi ve yönetimi.',
                ],
            ],
            [
                'code' => 'OPHT',
                'display_order' => 10,
                'name' => ['en' => 'Ophthalmology', 'tr' => 'Göz Hastalıkları'],
                'description' => [
                    'en' => 'Diagnosis and treatment of eye diseases and vision disorders.',
                    'tr' => 'Göz hastalıkları ve görme bozukluklarının tanı ve tedavisi.',
                ],
            ],
            [
                'code' => 'ORTH',
                'display_order' => 11,
                'name' => ['en' => 'Orthopedics', 'tr' => 'Ortopedi'],
                'description' => [
                    'en' => 'Treatment of musculoskeletal system — bones, joints, muscles, and ligaments.',
                    'tr' => 'Kas-iskelet sistemi — kemik, eklem, kas ve bağ tedavisi.',
                ],
            ],
            [
                'code' => 'PEDI',
                'display_order' => 12,
                'name' => ['en' => 'Pediatrics', 'tr' => 'Çocuk Sağlığı ve Hastalıkları'],
                'description' => [
                    'en' => 'Medical care for infants, children, and adolescents.',
                    'tr' => 'Bebek, çocuk ve ergenlerin tıbbi bakımı.',
                ],
            ],
            [
                'code' => 'PLAS',
                'display_order' => 13,
                'name' => ['en' => 'Plastic Surgery', 'tr' => 'Plastik Cerrahi'],
                'description' => [
                    'en' => 'Reconstructive and aesthetic surgical procedures.',
                    'tr' => 'Rekonstrüktif ve estetik cerrahi işlemler.',
                ],
            ],
            [
                'code' => 'PSYC',
                'display_order' => 14,
                'name' => ['en' => 'Psychiatry', 'tr' => 'Psikiyatri'],
                'description' => [
                    'en' => 'Diagnosis and treatment of mental health disorders.',
                    'tr' => 'Ruh sağlığı bozukluklarının tanı ve tedavisi.',
                ],
            ],
            [
                'code' => 'PULM',
                'display_order' => 15,
                'name' => ['en' => 'Pulmonology', 'tr' => 'Göğüs Hastalıkları'],
                'description' => [
                    'en' => 'Diagnosis and treatment of lung and respiratory tract diseases.',
                    'tr' => 'Akciğer ve solunum yolu hastalıklarının tanı ve tedavisi.',
                ],
            ],
            [
                'code' => 'UROL',
                'display_order' => 16,
                'name' => ['en' => 'Urology', 'tr' => 'Üroloji'],
                'description' => [
                    'en' => 'Treatment of urinary tract and male reproductive system disorders.',
                    'tr' => 'İdrar yolu ve erkek üreme sistemi hastalıklarının tedavisi.',
                ],
            ],
            [
                'code' => 'DENT',
                'display_order' => 17,
                'name' => ['en' => 'Dentistry', 'tr' => 'Diş Hekimliği'],
                'description' => [
                    'en' => 'Oral health care including dental treatments and oral surgery.',
                    'tr' => 'Diş tedavileri ve ağız cerrahisi dahil ağız sağlığı bakımı.',
                ],
            ],
            [
                'code' => 'NEPH',
                'display_order' => 18,
                'name' => ['en' => 'Nephrology', 'tr' => 'Nefroloji'],
                'description' => [
                    'en' => 'Diagnosis and treatment of kidney diseases.',
                    'tr' => 'Böbrek hastalıklarının tanı ve tedavisi.',
                ],
            ],
            [
                'code' => 'RHEU',
                'display_order' => 19,
                'name' => ['en' => 'Rheumatology', 'tr' => 'Romatoloji'],
                'description' => [
                    'en' => 'Treatment of autoimmune and inflammatory joint/connective tissue diseases.',
                    'tr' => 'Otoimmün ve enflamatuar eklem/bağ dokusu hastalıklarının tedavisi.',
                ],
            ],
            [
                'code' => 'ANES',
                'display_order' => 20,
                'name' => ['en' => 'Anesthesiology', 'tr' => 'Anesteziyoloji'],
                'description' => [
                    'en' => 'Anesthesia administration, pain management, and critical care.',
                    'tr' => 'Anestezi uygulaması, ağrı yönetimi ve yoğun bakım.',
                ],
            ],
            [
                'code' => 'RADI',
                'display_order' => 21,
                'name' => ['en' => 'Radiology', 'tr' => 'Radyoloji'],
                'description' => [
                    'en' => 'Medical imaging for diagnosis including X-ray, MRI, and CT.',
                    'tr' => 'Röntgen, MR ve BT dahil tanısal tıbbi görüntüleme.',
                ],
            ],
            [
                'code' => 'EMER',
                'display_order' => 22,
                'name' => ['en' => 'Emergency Medicine', 'tr' => 'Acil Tıp'],
                'description' => [
                    'en' => 'Immediate medical care for acute illnesses and injuries.',
                    'tr' => 'Akut hastalık ve yaralanmalar için acil tıbbi bakım.',
                ],
            ],
            [
                'code' => 'FMED',
                'display_order' => 23,
                'name' => ['en' => 'Family Medicine', 'tr' => 'Aile Hekimliği'],
                'description' => [
                    'en' => 'Comprehensive health care for individuals and families of all ages.',
                    'tr' => 'Her yaştan birey ve aile için kapsamlı sağlık bakımı.',
                ],
            ],
            [
                'code' => 'IMED',
                'display_order' => 24,
                'name' => ['en' => 'Internal Medicine', 'tr' => 'Dahiliye (İç Hastalıkları)'],
                'description' => [
                    'en' => 'Diagnosis and nonsurgical treatment of diseases in adults.',
                    'tr' => 'Yetişkinlerde hastalıkların tanı ve cerrahi dışı tedavisi.',
                ],
            ],
            [
                'code' => 'HEMA',
                'display_order' => 25,
                'name' => ['en' => 'Hematology', 'tr' => 'Hematoloji'],
                'description' => [
                    'en' => 'Diagnosis and treatment of blood disorders.',
                    'tr' => 'Kan hastalıklarının tanı ve tedavisi.',
                ],
            ],
            [
                'code' => 'INFD',
                'display_order' => 26,
                'name' => ['en' => 'Infectious Diseases', 'tr' => 'Enfeksiyon Hastalıkları'],
                'description' => [
                    'en' => 'Diagnosis and treatment of infections caused by bacteria, viruses, fungi, and parasites.',
                    'tr' => 'Bakteri, virüs, mantar ve parazitlerin neden olduğu enfeksiyonların tanı ve tedavisi.',
                ],
            ],
            [
                'code' => 'PHYS',
                'display_order' => 27,
                'name' => ['en' => 'Physical Medicine & Rehabilitation', 'tr' => 'Fizik Tedavi ve Rehabilitasyon'],
                'description' => [
                    'en' => 'Restoring functional ability and quality of life after injury or illness.',
                    'tr' => 'Yaralanma veya hastalık sonrası fonksiyonel yeteneğin ve yaşam kalitesinin geri kazanılması.',
                ],
            ],
            [
                'code' => 'NEUS',
                'display_order' => 28,
                'name' => ['en' => 'Neurosurgery', 'tr' => 'Beyin ve Sinir Cerrahisi'],
                'description' => [
                    'en' => 'Surgical treatment of disorders of the brain and nervous system.',
                    'tr' => 'Beyin ve sinir sistemi hastalıklarının cerrahi tedavisi.',
                ],
            ],
            [
                'code' => 'CVSURG',
                'display_order' => 29,
                'name' => ['en' => 'Cardiovascular Surgery', 'tr' => 'Kalp ve Damar Cerrahisi'],
                'description' => [
                    'en' => 'Surgical treatment of heart and blood vessel disorders.',
                    'tr' => 'Kalp ve damar hastalıklarının cerrahi tedavisi.',
                ],
            ],
            [
                'code' => 'NUTR',
                'display_order' => 30,
                'name' => ['en' => 'Nutrition & Dietetics', 'tr' => 'Beslenme ve Diyetetik'],
                'description' => [
                    'en' => 'Dietary planning and nutritional management for health and disease.',
                    'tr' => 'Sağlık ve hastalık için diyet planlama ve beslenme yönetimi.',
                ],
            ],
            [
                'code' => 'PCAR',
                'display_order' => 31,
                'name' => ['en' => 'Pediatric Surgery', 'tr' => 'Çocuk Cerrahisi'],
                'description' => [
                    'en' => 'Surgical care for infants, children, and adolescents.',
                    'tr' => 'Bebek, çocuk ve ergenlerin cerrahi bakımı.',
                ],
            ],
            [
                'code' => 'ALLS',
                'display_order' => 32,
                'name' => ['en' => 'Allergy & Immunology', 'tr' => 'Alerji ve İmmünoloji'],
                'description' => [
                    'en' => 'Diagnosis and treatment of allergic and immune system disorders.',
                    'tr' => 'Alerjik ve bağışıklık sistemi bozukluklarının tanı ve tedavisi.',
                ],
            ],
        ];

        foreach ($specialties as $data) {
            Specialty::updateOrCreate(
                ['code' => $data['code']],
                [
                    'name'          => $data['name'],
                    'description'   => $data['description'],
                    'display_order' => $data['display_order'],
                ]
            );
        }

        $this->command->info('  → ' . count($specialties) . ' specialties seeded.');
    }

    private function seedCities(): void
    {
        $cities = [
            // Turkey (country_id: 90)
            ['code' => 'IST', 'country_id' => 90, 'name' => ['en' => 'Istanbul', 'tr' => 'İstanbul']],
            ['code' => 'ANK', 'country_id' => 90, 'name' => ['en' => 'Ankara', 'tr' => 'Ankara']],
            ['code' => 'IZM', 'country_id' => 90, 'name' => ['en' => 'Izmir', 'tr' => 'İzmir']],
            ['code' => 'ANT', 'country_id' => 90, 'name' => ['en' => 'Antalya', 'tr' => 'Antalya']],
            ['code' => 'BUR', 'country_id' => 90, 'name' => ['en' => 'Bursa', 'tr' => 'Bursa']],
            ['code' => 'ADA', 'country_id' => 90, 'name' => ['en' => 'Adana', 'tr' => 'Adana']],
            ['code' => 'KOC', 'country_id' => 90, 'name' => ['en' => 'Kocaeli', 'tr' => 'Kocaeli']],
            ['code' => 'MER', 'country_id' => 90, 'name' => ['en' => 'Mersin', 'tr' => 'Mersin']],
            ['code' => 'GAZ', 'country_id' => 90, 'name' => ['en' => 'Gaziantep', 'tr' => 'Gaziantep']],
            ['code' => 'KON', 'country_id' => 90, 'name' => ['en' => 'Konya', 'tr' => 'Konya']],

            // Germany (country_id: 49)
            ['code' => 'BER', 'country_id' => 49, 'name' => ['en' => 'Berlin', 'tr' => 'Berlin']],
            ['code' => 'MUN', 'country_id' => 49, 'name' => ['en' => 'Munich', 'tr' => 'Münih']],
            ['code' => 'HAM', 'country_id' => 49, 'name' => ['en' => 'Hamburg', 'tr' => 'Hamburg']],
            ['code' => 'FRA', 'country_id' => 49, 'name' => ['en' => 'Frankfurt', 'tr' => 'Frankfurt']],
            ['code' => 'COL', 'country_id' => 49, 'name' => ['en' => 'Cologne', 'tr' => 'Köln']],

            // United Kingdom (country_id: 44)
            ['code' => 'LON', 'country_id' => 44, 'name' => ['en' => 'London', 'tr' => 'Londra']],
            ['code' => 'MAN', 'country_id' => 44, 'name' => ['en' => 'Manchester', 'tr' => 'Manchester']],
            ['code' => 'BIR', 'country_id' => 44, 'name' => ['en' => 'Birmingham', 'tr' => 'Birmingham']],
        ];

        foreach ($cities as $data) {
            City::updateOrCreate(
                ['code' => $data['code'], 'country_id' => $data['country_id']],
                ['name' => $data['name']]
            );
        }

        $this->command->info('  → ' . count($cities) . ' cities seeded.');
    }

    private function seedDiseases(): void
    {
        $diseases = [
            // ── Top 5 Popular (is_popular = true) ──
            ['code' => 'DIAB',  'is_popular' => true,  'name' => ['en' => 'Diabetes Mellitus', 'tr' => 'Diyabet (Şeker Hastalığı)'], 'description' => ['en' => 'A chronic metabolic disease characterized by elevated blood sugar levels.', 'tr' => 'Kan şekeri seviyesinin yükselmesiyle karakterize kronik bir metabolik hastalık.']],
            ['code' => 'HYPER', 'is_popular' => true,  'name' => ['en' => 'Hypertension', 'tr' => 'Hipertansiyon (Yüksek Tansiyon)'], 'description' => ['en' => 'Persistently elevated arterial blood pressure.', 'tr' => 'Sürekli yüksek seyreden arter kan basıncı.']],
            ['code' => 'ASTHM', 'is_popular' => true,  'name' => ['en' => 'Asthma', 'tr' => 'Astım'], 'description' => ['en' => 'A chronic respiratory condition causing airway inflammation and breathing difficulty.', 'tr' => 'Hava yolu iltihabı ve nefes darlığına neden olan kronik solunum hastalığı.']],
            ['code' => 'DEPR',  'is_popular' => true,  'name' => ['en' => 'Depression', 'tr' => 'Depresyon'], 'description' => ['en' => 'A mood disorder causing persistent feelings of sadness and loss of interest.', 'tr' => 'Sürekli üzüntü ve ilgi kaybına neden olan bir duygudurum bozukluğu.']],
            ['code' => 'ALLER', 'is_popular' => true,  'name' => ['en' => 'Allergic Rhinitis', 'tr' => 'Alerjik Rinit (Saman Nezlesi)'], 'description' => ['en' => 'Inflammation of the nasal passages caused by an allergic reaction.', 'tr' => 'Havadaki maddelere alerjik reaksiyon sonucu burun mukozasının iltihaplanması.']],
            // ── Remaining diseases ──
            ['code' => 'MIGR',  'name' => ['en' => 'Migraine', 'tr' => 'Migren'], 'description' => ['en' => 'A neurological condition with recurring severe headaches.', 'tr' => 'Tekrarlayan şiddetli baş ağrısı ile seyreden nörolojik bir durum.']],
            ['code' => 'ARTH',  'name' => ['en' => 'Arthritis', 'tr' => 'Artrit (Eklem İltihabı)'], 'description' => ['en' => 'Inflammation of one or more joints, causing pain and stiffness.', 'tr' => 'Bir veya daha fazla eklemin iltihaplanması.']],
            ['code' => 'GERD',  'name' => ['en' => 'Gastroesophageal Reflux Disease (GERD)', 'tr' => 'Gastroözofageal Reflü Hastalığı (GÖRH)'], 'description' => ['en' => 'Stomach acid frequently flows back into the esophagus.', 'tr' => 'Mide asidinin yemek borusuna geri aktığı sindirim bozukluğu.']],
            ['code' => 'ECZM',  'name' => ['en' => 'Eczema (Atopic Dermatitis)', 'tr' => 'Egzama (Atopik Dermatit)'], 'description' => ['en' => 'A condition causing inflamed, itchy, and cracked skin.', 'tr' => 'Cildin iltihaplanmasına, kaşıntı ve çatlaklara neden olan durum.']],
            ['code' => 'UTI',   'name' => ['en' => 'Urinary Tract Infection (UTI)', 'tr' => 'İdrar Yolu Enfeksiyonu (İYE)'], 'description' => ['en' => 'An infection in any part of the urinary system.', 'tr' => 'Üriner sistemin herhangi bir bölgesindeki enfeksiyon.']],
            ['code' => 'THYR',  'name' => ['en' => 'Thyroid Disorders', 'tr' => 'Tiroid Hastalıkları'], 'description' => ['en' => 'Conditions affecting the thyroid gland.', 'tr' => 'Tiroid bezini etkileyen durumlar.']],
            ['code' => 'PNEU',  'name' => ['en' => 'Pneumonia', 'tr' => 'Pnömoni (Zatürre)'], 'description' => ['en' => 'An infection that inflames the air sacs in one or both lungs.', 'tr' => 'Akciğerdeki hava keseciklerini iltihaplandıran enfeksiyon.']],
            ['code' => 'ANXI',  'name' => ['en' => 'Anxiety Disorder', 'tr' => 'Anksiyete Bozukluğu'], 'description' => ['en' => 'Excessive worry and fear affecting daily activities.', 'tr' => 'Günlük aktiviteleri etkileyen aşırı endişe ve korku.']],
            ['code' => 'COPD',  'name' => ['en' => 'Chronic Obstructive Pulmonary Disease (COPD)', 'tr' => 'Kronik Obstrüktif Akciğer Hastalığı (KOAH)'], 'description' => ['en' => 'A group of lung diseases that block airflow.', 'tr' => 'Hava akışını engelleyen akciğer hastalıkları grubu.']],
            ['code' => 'CHF',   'name' => ['en' => 'Heart Failure', 'tr' => 'Kalp Yetmezliği'], 'description' => ['en' => 'The heart cannot pump blood efficiently.', 'tr' => 'Kalbin kanı yeterince pompalayamaması.']],
            ['code' => 'CAD',   'name' => ['en' => 'Coronary Artery Disease', 'tr' => 'Koroner Arter Hastalığı'], 'description' => ['en' => 'Narrowing of the coronary arteries.', 'tr' => 'Koroner arterlerin daralması.']],
            ['code' => 'STRK',  'name' => ['en' => 'Stroke', 'tr' => 'İnme (Felç)'], 'description' => ['en' => 'Brain damage caused by interrupted blood supply.', 'tr' => 'Kan akışının kesilmesiyle oluşan beyin hasarı.']],
            ['code' => 'EPIL',  'name' => ['en' => 'Epilepsy', 'tr' => 'Epilepsi (Sara)'], 'description' => ['en' => 'A neurological disorder with recurrent seizures.', 'tr' => 'Tekrarlayan nöbetlerle seyreden nörolojik bozukluk.']],
            ['code' => 'PARK',  'name' => ['en' => 'Parkinson Disease', 'tr' => 'Parkinson Hastalığı'], 'description' => ['en' => 'A progressive nervous system disorder affecting movement.', 'tr' => 'Hareketi etkileyen ilerleyici sinir sistemi hastalığı.']],
            ['code' => 'ALZH',  'name' => ['en' => 'Alzheimer Disease', 'tr' => 'Alzheimer Hastalığı'], 'description' => ['en' => 'A progressive brain disorder causing memory loss.', 'tr' => 'Hafıza kaybına neden olan ilerleyici beyin hastalığı.']],
            ['code' => 'OSTE',  'name' => ['en' => 'Osteoporosis', 'tr' => 'Osteoporoz (Kemik Erimesi)'], 'description' => ['en' => 'Bones become weak and brittle.', 'tr' => 'Kemiklerin zayıflaması ve kırılganlaşması.']],
            ['code' => 'ANEMIA','name' => ['en' => 'Anemia', 'tr' => 'Anemi (Kansızlık)'], 'description' => ['en' => 'A condition with insufficient healthy red blood cells.', 'tr' => 'Yeterli sağlıklı kırmızı kan hücresi bulunmaması.']],
            ['code' => 'IBS',   'name' => ['en' => 'Irritable Bowel Syndrome (IBS)', 'tr' => 'İrritabl Bağırsak Sendromu (İBS)'], 'description' => ['en' => 'A disorder affecting the large intestine.', 'tr' => 'Kalın bağırsağı etkileyen bir bozukluk.']],
            ['code' => 'CROHN', 'name' => ['en' => 'Crohn Disease', 'tr' => 'Crohn Hastalığı'], 'description' => ['en' => 'Chronic inflammatory disease of the digestive tract.', 'tr' => 'Sindirim sisteminin kronik iltihabı.']],
            ['code' => 'ULCER', 'name' => ['en' => 'Peptic Ulcer', 'tr' => 'Peptik Ülser'], 'description' => ['en' => 'Sores on the stomach or small intestine lining.', 'tr' => 'Mide veya ince bağırsak iç yüzeyindeki yaralar.']],
            ['code' => 'HEPA',  'name' => ['en' => 'Hepatitis', 'tr' => 'Hepatit'], 'description' => ['en' => 'Inflammation of the liver.', 'tr' => 'Karaciğer iltihabı.']],
            ['code' => 'CIRR',  'name' => ['en' => 'Liver Cirrhosis', 'tr' => 'Karaciğer Sirozu'], 'description' => ['en' => 'Late stage of scarring of the liver.', 'tr' => 'Karaciğer hasarının ileri aşaması.']],
            ['code' => 'CKD',   'name' => ['en' => 'Chronic Kidney Disease', 'tr' => 'Kronik Böbrek Hastalığı'], 'description' => ['en' => 'Gradual loss of kidney function.', 'tr' => 'Böbrek fonksiyonlarının kademeli kaybı.']],
            ['code' => 'GOUT',  'name' => ['en' => 'Gout', 'tr' => 'Gut (Damla) Hastalığı'], 'description' => ['en' => 'A form of arthritis caused by excess uric acid.', 'tr' => 'Aşırı ürik asit birikiminin neden olduğu artrit.']],
            ['code' => 'LUPUS', 'name' => ['en' => 'Systemic Lupus Erythematosus (SLE)', 'tr' => 'Sistemik Lupus Eritematozus (SLE)'], 'description' => ['en' => 'An autoimmune disease that affects multiple organ systems.', 'tr' => 'Birden fazla organ sistemini etkileyen otoimmün hastalık.']],
            ['code' => 'FIBRO', 'name' => ['en' => 'Fibromyalgia', 'tr' => 'Fibromiyalji'], 'description' => ['en' => 'Widespread musculoskeletal pain.', 'tr' => 'Yaygın kas-iskelet sistemi ağrısı.']],
            ['code' => 'PSOR',  'name' => ['en' => 'Psoriasis', 'tr' => 'Sedef Hastalığı (Psoriazis)'], 'description' => ['en' => 'A skin disease causing red, itchy scaly patches.', 'tr' => 'Kırmızı, kaşıntılı ve pullu cilt lekeleri oluşturan hastalık.']],
            ['code' => 'VITIL', 'name' => ['en' => 'Vitiligo', 'tr' => 'Vitiligo'], 'description' => ['en' => 'Loss of skin color in patches.', 'tr' => 'Ciltte leke şeklinde renk kaybı.']],
            ['code' => 'HYPOT', 'name' => ['en' => 'Hypothyroidism', 'tr' => 'Hipotiroidi'], 'description' => ['en' => 'Underactive thyroid gland.', 'tr' => 'Tiroid bezinin az çalışması.']],
            ['code' => 'HYPERT','name' => ['en' => 'Hyperthyroidism', 'tr' => 'Hipertiroidi'], 'description' => ['en' => 'Overactive thyroid gland.', 'tr' => 'Tiroid bezinin aşırı çalışması.']],
            ['code' => 'OBESI', 'name' => ['en' => 'Obesity', 'tr' => 'Obezite'], 'description' => ['en' => 'Excessive body fat accumulation.', 'tr' => 'Aşırı vücut yağı birikimi.']],
            ['code' => 'SLEEP', 'name' => ['en' => 'Sleep Apnea', 'tr' => 'Uyku Apnesi'], 'description' => ['en' => 'Breathing repeatedly stops during sleep.', 'tr' => 'Uyku sırasında nefes alma tekrarlayan şekilde durur.']],
            ['code' => 'INSOM', 'name' => ['en' => 'Insomnia', 'tr' => 'Uykusuzluk (İnsomni)'], 'description' => ['en' => 'Difficulty falling or staying asleep.', 'tr' => 'Uykuya dalma veya uykuda kalma güçlüğü.']],
            ['code' => 'DVT',   'name' => ['en' => 'Deep Vein Thrombosis (DVT)', 'tr' => 'Derin Ven Trombozu (DVT)'], 'description' => ['en' => 'Blood clot in a deep vein, usually in the leg.', 'tr' => 'Genellikle bacakta derin bir damarda kan pıhtısı.']],
            ['code' => 'AFIB',  'name' => ['en' => 'Atrial Fibrillation', 'tr' => 'Atriyal Fibrilasyon'], 'description' => ['en' => 'Irregular and often rapid heart rate.', 'tr' => 'Düzensiz ve genellikle hızlı kalp atışı.']],
            ['code' => 'PCOS',  'name' => ['en' => 'Polycystic Ovary Syndrome (PCOS)', 'tr' => 'Polikistik Over Sendromu (PKOS)'], 'description' => ['en' => 'A hormonal disorder common in women of reproductive age.', 'tr' => 'Üreme çağındaki kadınlarda yaygın hormonal bozukluk.']],
            ['code' => 'ENDO',  'name' => ['en' => 'Endometriosis', 'tr' => 'Endometriozis'], 'description' => ['en' => 'Tissue similar to the uterine lining grows outside the uterus.', 'tr' => 'Rahim iç tabakasına benzer dokunun rahim dışında büyümesi.']],
            ['code' => 'BPH',   'name' => ['en' => 'Benign Prostatic Hyperplasia', 'tr' => 'İyi Huylu Prostat Büyümesi'], 'description' => ['en' => 'Non-cancerous enlargement of the prostate gland.', 'tr' => 'Prostat bezinin kanser dışı büyümesi.']],
            ['code' => 'GLAU',  'name' => ['en' => 'Glaucoma', 'tr' => 'Glokom (Göz Tansiyonu)'], 'description' => ['en' => 'Increased pressure in the eye damaging the optic nerve.', 'tr' => 'Göz içi basıncının artarak optik sinire zarar vermesi.']],
            ['code' => 'CATAR', 'name' => ['en' => 'Cataracts', 'tr' => 'Katarakt'], 'description' => ['en' => 'Clouding of the eye lens.', 'tr' => 'Göz merceğinin bulanıklaşması.']],
            ['code' => 'OTITIS','name' => ['en' => 'Otitis Media (Middle Ear Infection)', 'tr' => 'Otitis Media (Orta Kulak İltihabı)'], 'description' => ['en' => 'Infection of the middle ear.', 'tr' => 'Orta kulak enfeksiyonu.']],
            ['code' => 'SINUSI','name' => ['en' => 'Sinusitis', 'tr' => 'Sinüzit'], 'description' => ['en' => 'Inflammation of the sinuses.', 'tr' => 'Sinüslerin iltihaplanması.']],
            ['code' => 'BRNCH', 'name' => ['en' => 'Bronchitis', 'tr' => 'Bronşit'], 'description' => ['en' => 'Inflammation of the bronchial tubes.', 'tr' => 'Bronş tüplerinin iltihaplanması.']],
            ['code' => 'HERNIA','name' => ['en' => 'Hernia', 'tr' => 'Fıtık'], 'description' => ['en' => 'An organ pushes through an opening in surrounding tissue.', 'tr' => 'Bir organın çevresindeki dokudan dışarı çıkması.']],
            ['code' => 'HEMOR', 'name' => ['en' => 'Hemorrhoids', 'tr' => 'Hemoroid (Basur)'], 'description' => ['en' => 'Swollen veins in the lower rectum and anus.', 'tr' => 'Alt rektum ve anüsteki şişmiş damarlar.']],
            ['code' => 'VARIC', 'name' => ['en' => 'Varicose Veins', 'tr' => 'Varis'], 'description' => ['en' => 'Enlarged, swollen, and twisting veins.', 'tr' => 'Genişlemiş, şişmiş ve kıvrımlı damarlar.']],
        ];

        foreach ($diseases as $data) {
            $isPopular = $data['is_popular'] ?? false;
            unset($data['is_popular']);
            DiseaseCondition::updateOrCreate(
                ['code' => $data['code']],
                [
                    'name'        => $data['name'],
                    'description' => $data['description'],
                    'is_popular'  => $isPopular,
                ]
            );
        }

        $this->command->info('  → ' . count($diseases) . ' diseases seeded.');
    }

    private function seedSymptoms(): void
    {
        // We need specialty IDs for mapping — fetch them by code
        $specialtyIds = Specialty::pluck('id', 'code')->toArray();

        $symptoms = [
            [
                'symptom' => 'headache',
                'name' => ['en' => 'Headache', 'tr' => 'Baş Ağrısı'],
                'specialty_codes' => ['NEUR', 'ENT'],
            ],
            [
                'symptom' => 'chest_pain',
                'name' => ['en' => 'Chest Pain', 'tr' => 'Göğüs Ağrısı'],
                'specialty_codes' => ['CARD', 'PULM'],
            ],
            [
                'symptom' => 'cough',
                'name' => ['en' => 'Cough', 'tr' => 'Öksürük'],
                'specialty_codes' => ['PULM', 'ENT'],
            ],
            [
                'symptom' => 'abdominal_pain',
                'name' => ['en' => 'Abdominal Pain', 'tr' => 'Karın Ağrısı'],
                'specialty_codes' => ['GAST', 'GENS'],
            ],
            [
                'symptom' => 'skin_rash',
                'name' => ['en' => 'Skin Rash', 'tr' => 'Cilt Döküntüsü'],
                'specialty_codes' => ['DERM'],
            ],
            [
                'symptom' => 'joint_pain',
                'name' => ['en' => 'Joint Pain', 'tr' => 'Eklem Ağrısı'],
                'specialty_codes' => ['ORTH', 'RHEU'],
            ],
            [
                'symptom' => 'back_pain',
                'name' => ['en' => 'Back Pain', 'tr' => 'Sırt / Bel Ağrısı'],
                'specialty_codes' => ['ORTH', 'NEUR'],
            ],
            [
                'symptom' => 'fever',
                'name' => ['en' => 'Fever', 'tr' => 'Ateş'],
                'specialty_codes' => ['PEDI', 'PULM'],
            ],
            [
                'symptom' => 'blurred_vision',
                'name' => ['en' => 'Blurred Vision', 'tr' => 'Bulanık Görme'],
                'specialty_codes' => ['OPHT', 'NEUR'],
            ],
            [
                'symptom' => 'frequent_urination',
                'name' => ['en' => 'Frequent Urination', 'tr' => 'Sık İdrara Çıkma'],
                'specialty_codes' => ['UROL', 'ENDO', 'NEPH'],
            ],
            [
                'symptom' => 'anxiety',
                'name' => ['en' => 'Anxiety', 'tr' => 'Anksiyete (Kaygı)'],
                'specialty_codes' => ['PSYC'],
            ],
            [
                'symptom' => 'shortness_of_breath',
                'name' => ['en' => 'Shortness of Breath', 'tr' => 'Nefes Darlığı'],
                'specialty_codes' => ['PULM', 'CARD'],
            ],
            [
                'symptom' => 'toothache',
                'name' => ['en' => 'Toothache', 'tr' => 'Diş Ağrısı'],
                'specialty_codes' => ['DENT'],
            ],
            [
                'symptom' => 'sore_throat',
                'name' => ['en' => 'Sore Throat', 'tr' => 'Boğaz Ağrısı'],
                'specialty_codes' => ['ENT', 'PULM'],
            ],
            [
                'symptom' => 'weight_loss',
                'name' => ['en' => 'Unexplained Weight Loss', 'tr' => 'Açıklanamayan Kilo Kaybı'],
                'specialty_codes' => ['ENDO', 'ONCO', 'GAST'],
            ],
        ];

        foreach ($symptoms as $data) {
            $ids = array_values(array_filter(
                array_map(fn($c) => $specialtyIds[$c] ?? null, $data['specialty_codes'])
            ));

            SymptomSpecialtyMapping::updateOrCreate(
                ['symptom' => $data['symptom']],
                [
                    'name'          => $data['name'],
                    'specialty_ids' => $ids,
                ]
            );
        }

        $this->command->info('  → ' . count($symptoms) . ' symptom mappings seeded.');
    }

    private function seedIcd10Codes(): void
    {
        $codes = [
            // Infectious diseases (A00-B99)
            ['code' => 'A09',   'category' => 'A00-B99', 'name' => ['en' => 'Infectious gastroenteritis and colitis, unspecified', 'tr' => 'Enfeksiyöz gastroenterit ve kolit, tanımlanmamış']],
            ['code' => 'B34.9', 'category' => 'A00-B99', 'name' => ['en' => 'Viral infection, unspecified', 'tr' => 'Viral enfeksiyon, tanımlanmamış']],

            // Neoplasms (C00-D49)
            ['code' => 'C50.9', 'category' => 'C00-D49', 'name' => ['en' => 'Malignant neoplasm of breast, unspecified', 'tr' => 'Meme malign neoplazmı, tanımlanmamış']],
            ['code' => 'D50.9', 'category' => 'C00-D49', 'name' => ['en' => 'Iron deficiency anaemia, unspecified', 'tr' => 'Demir eksikliği anemisi, tanımlanmamış']],

            // Endocrine (E00-E89)
            ['code' => 'E11.9', 'category' => 'E00-E89', 'name' => ['en' => 'Type 2 diabetes mellitus without complications', 'tr' => 'Komplikasyonsuz Tip 2 diyabet']],
            ['code' => 'E03.9', 'category' => 'E00-E89', 'name' => ['en' => 'Hypothyroidism, unspecified', 'tr' => 'Hipotiroidizm, tanımlanmamış']],
            ['code' => 'E05.9', 'category' => 'E00-E89', 'name' => ['en' => 'Thyrotoxicosis, unspecified', 'tr' => 'Tirotoksikoz, tanımlanmamış']],
            ['code' => 'E78.5', 'category' => 'E00-E89', 'name' => ['en' => 'Hyperlipidaemia, unspecified', 'tr' => 'Hiperlipidemi, tanımlanmamış']],

            // Mental & behavioural (F00-F99)
            ['code' => 'F32.9', 'category' => 'F00-F99', 'name' => ['en' => 'Depressive episode, unspecified', 'tr' => 'Depresif epizod, tanımlanmamış']],
            ['code' => 'F41.1', 'category' => 'F00-F99', 'name' => ['en' => 'Generalized anxiety disorder', 'tr' => 'Yaygın anksiyete bozukluğu']],
            ['code' => 'F51.0', 'category' => 'F00-F99', 'name' => ['en' => 'Insomnia not due to a substance or known physiological condition', 'tr' => 'Madde veya bilinen fizyolojik duruma bağlı olmayan uykusuzluk']],

            // Nervous system (G00-G99)
            ['code' => 'G43.9', 'category' => 'G00-G99', 'name' => ['en' => 'Migraine, unspecified', 'tr' => 'Migren, tanımlanmamış']],
            ['code' => 'G47.3', 'category' => 'G00-G99', 'name' => ['en' => 'Sleep apnoea', 'tr' => 'Uyku apnesi']],

            // Circulatory system (I00-I99)
            ['code' => 'I10',   'category' => 'I00-I99', 'name' => ['en' => 'Essential (primary) hypertension', 'tr' => 'Esansiyel (primer) hipertansiyon']],
            ['code' => 'I25.9', 'category' => 'I00-I99', 'name' => ['en' => 'Chronic ischaemic heart disease, unspecified', 'tr' => 'Kronik iskemik kalp hastalığı, tanımlanmamış']],
            ['code' => 'I48.9', 'category' => 'I00-I99', 'name' => ['en' => 'Atrial fibrillation, unspecified', 'tr' => 'Atriyal fibrilasyon, tanımlanmamış']],
            ['code' => 'I83.9', 'category' => 'I00-I99', 'name' => ['en' => 'Varicose veins of lower extremities without ulcer or inflammation', 'tr' => 'Alt ekstremite varisler, ülser veya enflamasyon olmadan']],

            // Respiratory system (J00-J99)
            ['code' => 'J06.9', 'category' => 'J00-J99', 'name' => ['en' => 'Acute upper respiratory infection, unspecified', 'tr' => 'Akut üst solunum yolu enfeksiyonu, tanımlanmamış']],
            ['code' => 'J18.9', 'category' => 'J00-J99', 'name' => ['en' => 'Pneumonia, unspecified organism', 'tr' => 'Pnömoni, etken tanımlanmamış']],
            ['code' => 'J30.4', 'category' => 'J00-J99', 'name' => ['en' => 'Allergic rhinitis, unspecified', 'tr' => 'Alerjik rinit, tanımlanmamış']],
            ['code' => 'J45.9', 'category' => 'J00-J99', 'name' => ['en' => 'Asthma, unspecified', 'tr' => 'Astım, tanımlanmamış']],

            // Digestive system (K00-K95)
            ['code' => 'K21.0', 'category' => 'K00-K95', 'name' => ['en' => 'Gastro-oesophageal reflux disease with oesophagitis', 'tr' => 'Özofajitli gastroözofageal reflü hastalığı']],
            ['code' => 'K29.7', 'category' => 'K00-K95', 'name' => ['en' => 'Gastritis, unspecified', 'tr' => 'Gastrit, tanımlanmamış']],
            ['code' => 'K58.9', 'category' => 'K00-K95', 'name' => ['en' => 'Irritable bowel syndrome without diarrhoea', 'tr' => 'Diyaresiz irritabl bağırsak sendromu']],

            // Skin (L00-L99)
            ['code' => 'L20.9', 'category' => 'L00-L99', 'name' => ['en' => 'Atopic dermatitis, unspecified', 'tr' => 'Atopik dermatit, tanımlanmamış']],
            ['code' => 'L40.0', 'category' => 'L00-L99', 'name' => ['en' => 'Psoriasis vulgaris', 'tr' => 'Psoriazis vulgaris']],
            ['code' => 'L70.0', 'category' => 'L00-L99', 'name' => ['en' => 'Acne vulgaris', 'tr' => 'Akne vulgaris']],

            // Musculoskeletal (M00-M99)
            ['code' => 'M54.5', 'category' => 'M00-M99', 'name' => ['en' => 'Low back pain', 'tr' => 'Bel ağrısı']],
            ['code' => 'M79.3', 'category' => 'M00-M99', 'name' => ['en' => 'Panniculitis, unspecified', 'tr' => 'Pannikülit, tanımlanmamış']],
            ['code' => 'M25.5', 'category' => 'M00-M99', 'name' => ['en' => 'Pain in joint', 'tr' => 'Eklem ağrısı']],

            // Genitourinary (N00-N99)
            ['code' => 'N39.0', 'category' => 'N00-N99', 'name' => ['en' => 'Urinary tract infection, site not specified', 'tr' => 'İdrar yolu enfeksiyonu, yeri belirtilmemiş']],
            ['code' => 'N40.0', 'category' => 'N00-N99', 'name' => ['en' => 'Benign prostatic hyperplasia without lower urinary tract symptoms', 'tr' => 'Alt üriner sistem semptomları olmadan benign prostat hiperplazisi']],

            // Symptoms & signs (R00-R99)
            ['code' => 'R10.4', 'category' => 'R00-R99', 'name' => ['en' => 'Other and unspecified abdominal pain', 'tr' => 'Diğer ve tanımlanmamış karın ağrısı']],
            ['code' => 'R50.9', 'category' => 'R00-R99', 'name' => ['en' => 'Fever, unspecified', 'tr' => 'Ateş, tanımlanmamış']],
            ['code' => 'R51',   'category' => 'R00-R99', 'name' => ['en' => 'Headache', 'tr' => 'Baş ağrısı']],
            ['code' => 'R05',   'category' => 'R00-R99', 'name' => ['en' => 'Cough', 'tr' => 'Öksürük']],

            // Injury & external causes (S00-T98)
            ['code' => 'S93.4', 'category' => 'S00-T98', 'name' => ['en' => 'Sprain of ankle', 'tr' => 'Ayak bileği burkulması']],
            ['code' => 'T78.4', 'category' => 'S00-T98', 'name' => ['en' => 'Allergy, unspecified', 'tr' => 'Alerji, tanımlanmamış']],

            // Factors influencing health status (Z00-Z99)
            ['code' => 'Z00.0', 'category' => 'Z00-Z99', 'name' => ['en' => 'General adult medical examination', 'tr' => 'Genel yetişkin tıbbi muayenesi']],
            ['code' => 'Z23',   'category' => 'Z00-Z99', 'name' => ['en' => 'Need for immunization against single bacterial diseases', 'tr' => 'Tek bakteriyel hastalığa karşı bağışıklama ihtiyacı']],
        ];

        foreach ($codes as $data) {
            Icd10Code::updateOrCreate(
                ['code' => $data['code']],
                [
                    'category' => $data['category'],
                    'name'     => $data['name'],
                ]
            );
        }

        $this->command->info('  → ' . count($codes) . ' ICD-10 codes seeded.');
    }
}
