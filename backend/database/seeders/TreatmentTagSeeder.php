<?php

namespace Database\Seeders;

use App\Models\Specialty;
use App\Models\TreatmentTag;
use Illuminate\Database\Seeder;

class TreatmentTagSeeder extends Seeder
{
    /**
     * Curated treatment tags grouped by specialty code.
     * Idempotent: updateOrCreate by slug. Bilingual (en/tr).
     */
    public function run(): void
    {
        // [specialty_code => [ [slug, en, tr], ... ]]
        $map = [
            'CARD' => [
                ['angioplasty', 'Angioplasty', 'Anjiyoplasti'],
                ['pacemaker-implantation', 'Pacemaker Implantation', 'Kalp Pili Takılması'],
                ['echocardiography', 'Echocardiography', 'Ekokardiyografi'],
                ['bypass-surgery', 'Bypass Surgery', 'Bypass Ameliyatı'],
                ['holter-monitoring', 'Holter Monitoring', 'Holter Takibi'],
                ['heart-valve-repair', 'Heart Valve Repair', 'Kalp Kapağı Onarımı'],
            ],
            'DERM' => [
                ['acne-treatment', 'Acne Treatment', 'Akne Tedavisi'],
                ['laser-hair-removal', 'Laser Hair Removal', 'Lazer Epilasyon'],
                ['mole-removal', 'Mole Removal', 'Ben Alımı'],
                ['botox', 'Botox', 'Botoks'],
                ['skin-cancer-screening', 'Skin Cancer Screening', 'Cilt Kanseri Taraması'],
                ['psoriasis-treatment', 'Psoriasis Treatment', 'Sedef Tedavisi'],
            ],
            'ENDO' => [
                ['diabetes-management', 'Diabetes Management', 'Diyabet Yönetimi'],
                ['thyroid-treatment', 'Thyroid Treatment', 'Tiroid Tedavisi'],
                ['hormone-therapy', 'Hormone Therapy', 'Hormon Tedavisi'],
                ['obesity-treatment', 'Obesity Treatment', 'Obezite Tedavisi'],
                ['osteoporosis-treatment', 'Osteoporosis Treatment', 'Osteoporoz Tedavisi'],
            ],
            'ENT' => [
                ['tonsillectomy', 'Tonsillectomy', 'Bademcik Ameliyatı'],
                ['functional-rhinoplasty', 'Functional Rhinoplasty', 'Fonksiyonel Burun Ameliyatı'],
                ['sinus-surgery', 'Sinus Surgery', 'Sinüs Ameliyatı'],
                ['hearing-test', 'Hearing Test', 'İşitme Testi'],
                ['ear-tube-insertion', 'Ear Tube Insertion', 'Kulak Tüpü Takılması'],
            ],
            'GAST' => [
                ['endoscopy', 'Endoscopy', 'Endoskopi'],
                ['colonoscopy', 'Colonoscopy', 'Kolonoskopi'],
                ['reflux-treatment', 'Reflux Treatment', 'Reflü Tedavisi'],
                ['liver-disease-treatment', 'Liver Disease Treatment', 'Karaciğer Hastalığı Tedavisi'],
            ],
            'GYNE' => [
                ['prenatal-care', 'Prenatal Care', 'Gebelik Takibi'],
                ['normal-delivery', 'Normal Delivery', 'Normal Doğum'],
                ['cesarean-section', 'Cesarean Section', 'Sezaryen'],
                ['ivf', 'IVF (In Vitro Fertilization)', 'Tüp Bebek'],
                ['hysterectomy', 'Hysterectomy', 'Rahim Alınması'],
                ['pap-smear', 'Pap Smear', 'Smear Testi'],
            ],
            'NEUR' => [
                ['epilepsy-treatment', 'Epilepsy Treatment', 'Epilepsi Tedavisi'],
                ['migraine-treatment', 'Migraine Treatment', 'Migren Tedavisi'],
                ['stroke-rehabilitation', 'Stroke Rehabilitation', 'İnme Rehabilitasyonu'],
                ['emg', 'EMG', 'EMG'],
            ],
            'ONCO' => [
                ['chemotherapy', 'Chemotherapy', 'Kemoterapi'],
                ['radiotherapy', 'Radiotherapy', 'Radyoterapi'],
                ['immunotherapy', 'Immunotherapy', 'İmmünoterapi'],
                ['tumor-screening', 'Tumor Screening', 'Tümör Taraması'],
            ],
            'OPHT' => [
                ['cataract-surgery', 'Cataract Surgery', 'Katarakt Ameliyatı'],
                ['lasik', 'LASIK Eye Surgery', 'LASIK Göz Ameliyatı'],
                ['glaucoma-treatment', 'Glaucoma Treatment', 'Glokom Tedavisi'],
                ['retinal-treatment', 'Retinal Treatment', 'Retina Tedavisi'],
                ['eye-exam', 'Eye Examination', 'Göz Muayenesi'],
            ],
            'ORTH' => [
                ['knee-replacement', 'Knee Replacement', 'Diz Protezi'],
                ['hip-replacement', 'Hip Replacement', 'Kalça Protezi'],
                ['arthroscopy', 'Arthroscopy', 'Artroskopi'],
                ['fracture-treatment', 'Fracture Treatment', 'Kırık Tedavisi'],
                ['spine-surgery', 'Spine Surgery', 'Omurga Cerrahisi'],
            ],
            'PEDI' => [
                ['vaccination', 'Vaccination', 'Aşılama'],
                ['newborn-care', 'Newborn Care', 'Yenidoğan Bakımı'],
                ['child-development-screening', 'Child Development Screening', 'Çocuk Gelişim Taraması'],
            ],
            'PLAS' => [
                ['rhinoplasty', 'Rhinoplasty', 'Burun Estetiği'],
                ['breast-augmentation', 'Breast Augmentation', 'Meme Büyütme'],
                ['liposuction', 'Liposuction', 'Liposuction'],
                ['tummy-tuck', 'Tummy Tuck', 'Karın Germe'],
                ['hair-transplant', 'Hair Transplant', 'Saç Ekimi'],
                ['facelift', 'Facelift', 'Yüz Germe'],
            ],
            'PSYC' => [
                ['depression-treatment', 'Depression Treatment', 'Depresyon Tedavisi'],
                ['anxiety-treatment', 'Anxiety Treatment', 'Anksiyete Tedavisi'],
                ['psychotherapy', 'Psychotherapy', 'Psikoterapi'],
            ],
            'PULM' => [
                ['asthma-treatment', 'Asthma Treatment', 'Astım Tedavisi'],
                ['copd-treatment', 'COPD Treatment', 'KOAH Tedavisi'],
                ['sleep-apnea-treatment', 'Sleep Apnea Treatment', 'Uyku Apnesi Tedavisi'],
            ],
            'UROL' => [
                ['kidney-stone-treatment', 'Kidney Stone Treatment', 'Böbrek Taşı Tedavisi'],
                ['prostate-treatment', 'Prostate Treatment', 'Prostat Tedavisi'],
                ['circumcision', 'Circumcision', 'Sünnet'],
                ['urinary-incontinence-treatment', 'Urinary Incontinence Treatment', 'İdrar Kaçırma Tedavisi'],
            ],
            'DENT' => [
                ['dental-implant', 'Dental Implant', 'Diş İmplantı'],
                ['teeth-whitening', 'Teeth Whitening', 'Diş Beyazlatma'],
                ['orthodontics-braces', 'Orthodontics (Braces)', 'Ortodonti (Tel Tedavisi)'],
                ['root-canal', 'Root Canal Treatment', 'Kanal Tedavisi'],
                ['dental-veneers', 'Dental Veneers', 'Diş Kaplama'],
                ['tooth-extraction', 'Tooth Extraction', 'Diş Çekimi'],
                ['dental-cleaning', 'Dental Cleaning', 'Diş Temizliği'],
            ],
            'NEPH' => [
                ['dialysis', 'Dialysis', 'Diyaliz'],
                ['kidney-transplant-evaluation', 'Kidney Transplant Evaluation', 'Böbrek Nakli Değerlendirmesi'],
            ],
            'RHEU' => [
                ['arthritis-treatment', 'Arthritis Treatment', 'Artrit Tedavisi'],
                ['rheumatoid-arthritis-treatment', 'Rheumatoid Arthritis Treatment', 'Romatoid Artrit Tedavisi'],
            ],
            'HEMA' => [
                ['anemia-treatment', 'Anemia Treatment', 'Anemi Tedavisi'],
                ['bone-marrow-transplant', 'Bone Marrow Transplant', 'Kemik İliği Nakli'],
            ],
            'PHYS' => [
                ['physiotherapy', 'Physiotherapy', 'Fizyoterapi'],
                ['rehabilitation', 'Rehabilitation', 'Rehabilitasyon'],
            ],
            'NEUS' => [
                ['brain-tumor-surgery', 'Brain Tumor Surgery', 'Beyin Tümörü Cerrahisi'],
                ['herniated-disc-surgery', 'Herniated Disc Surgery', 'Bel Fıtığı Ameliyatı'],
            ],
            'CVSURG' => [
                ['coronary-bypass', 'Coronary Bypass', 'Koroner Bypass'],
                ['valve-replacement', 'Valve Replacement', 'Kapak Değişimi'],
            ],
        ];

        $specialties = Specialty::whereIn('code', array_keys($map))->get()->keyBy('code');

        foreach ($map as $code => $tags) {
            $specialty = $specialties->get($code);
            if (!$specialty) {
                continue;
            }
            foreach ($tags as $i => [$slug, $en, $tr]) {
                TreatmentTag::updateOrCreate(
                    ['slug' => $slug],
                    [
                        'specialty_id'  => $specialty->id,
                        'name'          => ['en' => $en, 'tr' => $tr],
                        'is_active'     => true,
                        'display_order' => $i + 1,
                    ],
                );
            }
        }
    }
}
