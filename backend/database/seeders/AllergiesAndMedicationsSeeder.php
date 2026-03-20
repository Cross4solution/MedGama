<?php

namespace Database\Seeders;

use App\Models\Allergy;
use App\Models\Medication;
use Illuminate\Database\Seeder;

class AllergiesAndMedicationsSeeder extends Seeder
{
    public function run(): void
    {
        // ── Allergies (50) ──
        $allergies = [
            // Drug allergies — Popular
            ['code' => 'ALG-PEN', 'name' => ['en' => 'Penicillin Allergy', 'tr' => 'Penisilin Alerjisi'], 'category' => 'drug', 'is_popular' => true],
            ['code' => 'ALG-SUL', 'name' => ['en' => 'Sulfonamide Allergy', 'tr' => 'Sülfonamid Alerjisi'], 'category' => 'drug', 'is_popular' => true],
            ['code' => 'ALG-ASP', 'name' => ['en' => 'Aspirin Allergy', 'tr' => 'Aspirin Alerjisi'], 'category' => 'drug', 'is_popular' => true],
            ['code' => 'ALG-POL', 'name' => ['en' => 'Pollen Allergy', 'tr' => 'Polen Alerjisi'], 'category' => 'environmental', 'is_popular' => true],
            ['code' => 'ALG-PEA', 'name' => ['en' => 'Peanut Allergy', 'tr' => 'Yer Fıstığı Alerjisi'], 'category' => 'food', 'is_popular' => true],
            // Drug allergies
            ['code' => 'ALG-IBU', 'name' => ['en' => 'Ibuprofen Allergy', 'tr' => 'İbuprofen Alerjisi'], 'category' => 'drug'],
            ['code' => 'ALG-CEP', 'name' => ['en' => 'Cephalosporin Allergy', 'tr' => 'Sefalosporin Alerjisi'], 'category' => 'drug'],
            ['code' => 'ALG-AMX', 'name' => ['en' => 'Amoxicillin Allergy', 'tr' => 'Amoksisilin Alerjisi'], 'category' => 'drug'],
            ['code' => 'ALG-COD', 'name' => ['en' => 'Codeine Allergy', 'tr' => 'Kodein Alerjisi'], 'category' => 'drug'],
            ['code' => 'ALG-MOR', 'name' => ['en' => 'Morphine Allergy', 'tr' => 'Morfin Alerjisi'], 'category' => 'drug'],
            ['code' => 'ALG-TET', 'name' => ['en' => 'Tetracycline Allergy', 'tr' => 'Tetrasiklin Alerjisi'], 'category' => 'drug'],
            ['code' => 'ALG-ERY', 'name' => ['en' => 'Erythromycin Allergy', 'tr' => 'Eritromisin Alerjisi'], 'category' => 'drug'],
            ['code' => 'ALG-ANE', 'name' => ['en' => 'Local Anesthetic Allergy', 'tr' => 'Lokal Anestezik Alerjisi'], 'category' => 'drug'],
            ['code' => 'ALG-INS', 'name' => ['en' => 'Insulin Allergy', 'tr' => 'İnsülin Alerjisi'], 'category' => 'drug'],
            ['code' => 'ALG-NSAID', 'name' => ['en' => 'NSAID Allergy', 'tr' => 'NSAİİ Alerjisi'], 'category' => 'drug'],
            ['code' => 'ALG-MET', 'name' => ['en' => 'Metformin Allergy', 'tr' => 'Metformin Alerjisi'], 'category' => 'drug'],
            ['code' => 'ALG-ACE', 'name' => ['en' => 'ACE Inhibitor Allergy', 'tr' => 'ACE İnhibitörü Alerjisi'], 'category' => 'drug'],
            ['code' => 'ALG-STA', 'name' => ['en' => 'Statin Allergy', 'tr' => 'Statin Alerjisi'], 'category' => 'drug'],
            ['code' => 'ALG-CON', 'name' => ['en' => 'Contrast Dye Allergy', 'tr' => 'Kontrast Madde Alerjisi'], 'category' => 'drug'],
            ['code' => 'ALG-LID', 'name' => ['en' => 'Lidocaine Allergy', 'tr' => 'Lidokain Alerjisi'], 'category' => 'drug'],
            // Food allergies
            ['code' => 'ALG-LAC', 'name' => ['en' => 'Lactose Intolerance', 'tr' => 'Laktoz İntoleransı'], 'category' => 'food'],
            ['code' => 'ALG-GLU', 'name' => ['en' => 'Gluten Allergy (Celiac)', 'tr' => 'Glüten Alerjisi (Çölyak)'], 'category' => 'food'],
            ['code' => 'ALG-TRN', 'name' => ['en' => 'Tree Nut Allergy', 'tr' => 'Kabuklu Yemiş Alerjisi'], 'category' => 'food'],
            ['code' => 'ALG-SHE', 'name' => ['en' => 'Shellfish Allergy', 'tr' => 'Kabuklu Deniz Ürünü Alerjisi'], 'category' => 'food'],
            ['code' => 'ALG-EGG', 'name' => ['en' => 'Egg Allergy', 'tr' => 'Yumurta Alerjisi'], 'category' => 'food'],
            ['code' => 'ALG-SOY', 'name' => ['en' => 'Soy Allergy', 'tr' => 'Soya Alerjisi'], 'category' => 'food'],
            ['code' => 'ALG-WHE', 'name' => ['en' => 'Wheat Allergy', 'tr' => 'Buğday Alerjisi'], 'category' => 'food'],
            ['code' => 'ALG-MIL', 'name' => ['en' => 'Cow Milk Allergy', 'tr' => 'İnek Sütü Alerjisi'], 'category' => 'food'],
            ['code' => 'ALG-FSH', 'name' => ['en' => 'Fish Allergy', 'tr' => 'Balık Alerjisi'], 'category' => 'food'],
            ['code' => 'ALG-SES', 'name' => ['en' => 'Sesame Allergy', 'tr' => 'Susam Alerjisi'], 'category' => 'food'],
            ['code' => 'ALG-CORN', 'name' => ['en' => 'Corn Allergy', 'tr' => 'Mısır Alerjisi'], 'category' => 'food'],
            ['code' => 'ALG-FRU', 'name' => ['en' => 'Fructose Intolerance', 'tr' => 'Fruktoz İntoleransı'], 'category' => 'food'],
            ['code' => 'ALG-CHOC', 'name' => ['en' => 'Chocolate Allergy', 'tr' => 'Çikolata Alerjisi'], 'category' => 'food'],
            ['code' => 'ALG-STR', 'name' => ['en' => 'Strawberry Allergy', 'tr' => 'Çilek Alerjisi'], 'category' => 'food'],
            ['code' => 'ALG-CIT', 'name' => ['en' => 'Citrus Fruit Allergy', 'tr' => 'Narenciye Alerjisi'], 'category' => 'food'],
            // Environmental allergies
            ['code' => 'ALG-DUS', 'name' => ['en' => 'Dust Mite Allergy', 'tr' => 'Toz Akarı Alerjisi'], 'category' => 'environmental'],
            ['code' => 'ALG-MOL', 'name' => ['en' => 'Mold Allergy', 'tr' => 'Küf Alerjisi'], 'category' => 'environmental'],
            ['code' => 'ALG-CAT', 'name' => ['en' => 'Cat Dander Allergy', 'tr' => 'Kedi Tüyü Alerjisi'], 'category' => 'environmental'],
            ['code' => 'ALG-DOG', 'name' => ['en' => 'Dog Dander Allergy', 'tr' => 'Köpek Tüyü Alerjisi'], 'category' => 'environmental'],
            ['code' => 'ALG-LAT', 'name' => ['en' => 'Latex Allergy', 'tr' => 'Lateks Alerjisi'], 'category' => 'environmental'],
            ['code' => 'ALG-BEE', 'name' => ['en' => 'Bee Venom Allergy', 'tr' => 'Arı Zehiri Alerjisi'], 'category' => 'environmental'],
            ['code' => 'ALG-COC', 'name' => ['en' => 'Cockroach Allergy', 'tr' => 'Hamam Böceği Alerjisi'], 'category' => 'environmental'],
            ['code' => 'ALG-NIC', 'name' => ['en' => 'Nickel Allergy', 'tr' => 'Nikel Alerjisi'], 'category' => 'environmental'],
            ['code' => 'ALG-WASP', 'name' => ['en' => 'Wasp Venom Allergy', 'tr' => 'Yaban Arısı Alerjisi'], 'category' => 'environmental'],
            ['code' => 'ALG-PERF', 'name' => ['en' => 'Perfume / Fragrance Allergy', 'tr' => 'Parfüm / Koku Alerjisi'], 'category' => 'environmental'],
            ['code' => 'ALG-FORM', 'name' => ['en' => 'Formaldehyde Allergy', 'tr' => 'Formaldehit Alerjisi'], 'category' => 'environmental'],
            ['code' => 'ALG-SUN', 'name' => ['en' => 'Sun Allergy (Photosensitivity)', 'tr' => 'Güneş Alerjisi (Fotosensitivite)'], 'category' => 'environmental'],
            ['code' => 'ALG-COLD', 'name' => ['en' => 'Cold Urticaria (Cold Allergy)', 'tr' => 'Soğuk Ürtikeri (Soğuk Alerjisi)'], 'category' => 'environmental'],
            ['code' => 'ALG-GRAS', 'name' => ['en' => 'Grass Pollen Allergy', 'tr' => 'Çimen Poleni Alerjisi'], 'category' => 'environmental'],
            ['code' => 'ALG-TREE', 'name' => ['en' => 'Tree Pollen Allergy', 'tr' => 'Ağaç Poleni Alerjisi'], 'category' => 'environmental'],
        ];

        foreach ($allergies as $a) {
            $isPopular = $a['is_popular'] ?? false;
            unset($a['is_popular']);
            Allergy::updateOrCreate(['code' => $a['code']], array_merge($a, ['is_popular' => $isPopular]));
        }

        // ── Medications (50) ──
        $medications = [
            // Popular
            ['code' => 'MED-PAR', 'name' => ['en' => 'Paracetamol (Acetaminophen)', 'tr' => 'Parasetamol'], 'category' => 'analgesic', 'form' => 'tablet', 'is_popular' => true],
            ['code' => 'MED-IBU', 'name' => ['en' => 'Ibuprofen', 'tr' => 'İbuprofen'], 'category' => 'analgesic', 'form' => 'tablet', 'is_popular' => true],
            ['code' => 'MED-AMX', 'name' => ['en' => 'Amoxicillin', 'tr' => 'Amoksisilin'], 'category' => 'antibiotic', 'form' => 'capsule', 'is_popular' => true],
            ['code' => 'MED-MFO', 'name' => ['en' => 'Metformin', 'tr' => 'Metformin'], 'category' => 'diabetes', 'form' => 'tablet', 'is_popular' => true],
            ['code' => 'MED-OMP', 'name' => ['en' => 'Omeprazole', 'tr' => 'Omeprazol'], 'category' => 'gastrointestinal', 'form' => 'capsule', 'is_popular' => true],
            // Analgesics / Anti-inflammatory
            ['code' => 'MED-ASP', 'name' => ['en' => 'Aspirin', 'tr' => 'Aspirin'], 'category' => 'analgesic', 'form' => 'tablet'],
            ['code' => 'MED-NAP', 'name' => ['en' => 'Naproxen', 'tr' => 'Naproksen'], 'category' => 'analgesic', 'form' => 'tablet'],
            ['code' => 'MED-DIC', 'name' => ['en' => 'Diclofenac', 'tr' => 'Diklofenak'], 'category' => 'analgesic', 'form' => 'tablet'],
            ['code' => 'MED-TRA', 'name' => ['en' => 'Tramadol', 'tr' => 'Tramadol'], 'category' => 'analgesic', 'form' => 'capsule'],
            ['code' => 'MED-MEL', 'name' => ['en' => 'Meloxicam', 'tr' => 'Meloksikam'], 'category' => 'analgesic', 'form' => 'tablet'],
            // Antibiotics
            ['code' => 'MED-AZI', 'name' => ['en' => 'Azithromycin', 'tr' => 'Azitromisin'], 'category' => 'antibiotic', 'form' => 'tablet'],
            ['code' => 'MED-CIP', 'name' => ['en' => 'Ciprofloxacin', 'tr' => 'Siprofloksasin'], 'category' => 'antibiotic', 'form' => 'tablet'],
            ['code' => 'MED-MET', 'name' => ['en' => 'Metronidazole', 'tr' => 'Metronidazol'], 'category' => 'antibiotic', 'form' => 'tablet'],
            ['code' => 'MED-DOX', 'name' => ['en' => 'Doxycycline', 'tr' => 'Doksisiklin'], 'category' => 'antibiotic', 'form' => 'capsule'],
            ['code' => 'MED-CEF', 'name' => ['en' => 'Cefuroxime', 'tr' => 'Sefuroksim'], 'category' => 'antibiotic', 'form' => 'tablet'],
            ['code' => 'MED-CLA', 'name' => ['en' => 'Clarithromycin', 'tr' => 'Klaritromisin'], 'category' => 'antibiotic', 'form' => 'tablet'],
            ['code' => 'MED-AUG', 'name' => ['en' => 'Amoxicillin-Clavulanate', 'tr' => 'Amoksisilin-Klavulanat'], 'category' => 'antibiotic', 'form' => 'tablet'],
            ['code' => 'MED-LEV', 'name' => ['en' => 'Levofloxacin', 'tr' => 'Levofloksasin'], 'category' => 'antibiotic', 'form' => 'tablet'],
            ['code' => 'MED-TMS', 'name' => ['en' => 'Trimethoprim-Sulfamethoxazole', 'tr' => 'Trimetoprim-Sülfametoksazol'], 'category' => 'antibiotic', 'form' => 'tablet'],
            // Cardiovascular
            ['code' => 'MED-AML', 'name' => ['en' => 'Amlodipine', 'tr' => 'Amlodipin'], 'category' => 'cardiovascular', 'form' => 'tablet'],
            ['code' => 'MED-ATE', 'name' => ['en' => 'Atenolol', 'tr' => 'Atenolol'], 'category' => 'cardiovascular', 'form' => 'tablet'],
            ['code' => 'MED-LOS', 'name' => ['en' => 'Losartan', 'tr' => 'Losartan'], 'category' => 'cardiovascular', 'form' => 'tablet'],
            ['code' => 'MED-RAM', 'name' => ['en' => 'Ramipril', 'tr' => 'Ramipril'], 'category' => 'cardiovascular', 'form' => 'capsule'],
            ['code' => 'MED-WAR', 'name' => ['en' => 'Warfarin', 'tr' => 'Varfarin'], 'category' => 'cardiovascular', 'form' => 'tablet'],
            ['code' => 'MED-CLO', 'name' => ['en' => 'Clopidogrel', 'tr' => 'Klopidogrel'], 'category' => 'cardiovascular', 'form' => 'tablet'],
            ['code' => 'MED-ATO', 'name' => ['en' => 'Atorvastatin', 'tr' => 'Atorvastatin'], 'category' => 'cardiovascular', 'form' => 'tablet'],
            ['code' => 'MED-ROS', 'name' => ['en' => 'Rosuvastatin', 'tr' => 'Rosuvastatin'], 'category' => 'cardiovascular', 'form' => 'tablet'],
            ['code' => 'MED-BIS', 'name' => ['en' => 'Bisoprolol', 'tr' => 'Bisoprolol'], 'category' => 'cardiovascular', 'form' => 'tablet'],
            ['code' => 'MED-ENL', 'name' => ['en' => 'Enalapril', 'tr' => 'Enalapril'], 'category' => 'cardiovascular', 'form' => 'tablet'],
            // Diabetes
            ['code' => 'MED-GLI', 'name' => ['en' => 'Glimepiride', 'tr' => 'Glimepirid'], 'category' => 'diabetes', 'form' => 'tablet'],
            ['code' => 'MED-INS', 'name' => ['en' => 'Insulin (Regular)', 'tr' => 'İnsülin (Regüler)'], 'category' => 'diabetes', 'form' => 'injection'],
            ['code' => 'MED-SIT', 'name' => ['en' => 'Sitagliptin', 'tr' => 'Sitagliptin'], 'category' => 'diabetes', 'form' => 'tablet'],
            ['code' => 'MED-EMP', 'name' => ['en' => 'Empagliflozin', 'tr' => 'Empagliflozin'], 'category' => 'diabetes', 'form' => 'tablet'],
            // Respiratory
            ['code' => 'MED-SAL', 'name' => ['en' => 'Salbutamol (Albuterol)', 'tr' => 'Salbutamol'], 'category' => 'respiratory', 'form' => 'inhaler'],
            ['code' => 'MED-MON', 'name' => ['en' => 'Montelukast', 'tr' => 'Montelukast'], 'category' => 'respiratory', 'form' => 'tablet'],
            ['code' => 'MED-FLU', 'name' => ['en' => 'Fluticasone', 'tr' => 'Flutikazon'], 'category' => 'respiratory', 'form' => 'inhaler'],
            ['code' => 'MED-BUD', 'name' => ['en' => 'Budesonide', 'tr' => 'Budesonid'], 'category' => 'respiratory', 'form' => 'inhaler'],
            // Gastrointestinal
            ['code' => 'MED-LAN', 'name' => ['en' => 'Lansoprazole', 'tr' => 'Lansoprazol'], 'category' => 'gastrointestinal', 'form' => 'capsule'],
            ['code' => 'MED-RAN', 'name' => ['en' => 'Ranitidine', 'tr' => 'Ranitidin'], 'category' => 'gastrointestinal', 'form' => 'tablet'],
            ['code' => 'MED-DOM', 'name' => ['en' => 'Domperidone', 'tr' => 'Domperidon'], 'category' => 'gastrointestinal', 'form' => 'tablet'],
            ['code' => 'MED-PAN', 'name' => ['en' => 'Pantoprazole', 'tr' => 'Pantoprazol'], 'category' => 'gastrointestinal', 'form' => 'tablet'],
            // Neurological / Psychiatric
            ['code' => 'MED-SER', 'name' => ['en' => 'Sertraline', 'tr' => 'Sertralin'], 'category' => 'neurological', 'form' => 'tablet'],
            ['code' => 'MED-FLX', 'name' => ['en' => 'Fluoxetine', 'tr' => 'Fluoksetin'], 'category' => 'neurological', 'form' => 'capsule'],
            ['code' => 'MED-GAB', 'name' => ['en' => 'Gabapentin', 'tr' => 'Gabapentin'], 'category' => 'neurological', 'form' => 'capsule'],
            ['code' => 'MED-PRE', 'name' => ['en' => 'Pregabalin', 'tr' => 'Pregabalin'], 'category' => 'neurological', 'form' => 'capsule'],
            ['code' => 'MED-DIA', 'name' => ['en' => 'Diazepam', 'tr' => 'Diazepam'], 'category' => 'neurological', 'form' => 'tablet'],
            ['code' => 'MED-ESC', 'name' => ['en' => 'Escitalopram', 'tr' => 'Essitalopram'], 'category' => 'neurological', 'form' => 'tablet'],
            // Antihistamine / Corticosteroid
            ['code' => 'MED-CET', 'name' => ['en' => 'Cetirizine', 'tr' => 'Setirizin'], 'category' => 'antihistamine', 'form' => 'tablet'],
            ['code' => 'MED-LOR', 'name' => ['en' => 'Loratadine', 'tr' => 'Loratadin'], 'category' => 'antihistamine', 'form' => 'tablet'],
            ['code' => 'MED-PRD', 'name' => ['en' => 'Prednisolone', 'tr' => 'Prednizolon'], 'category' => 'corticosteroid', 'form' => 'tablet'],
            ['code' => 'MED-DEX', 'name' => ['en' => 'Dexamethasone', 'tr' => 'Deksametazon'], 'category' => 'corticosteroid', 'form' => 'tablet'],
        ];

        foreach ($medications as $m) {
            $isPopular = $m['is_popular'] ?? false;
            unset($m['is_popular']);
            Medication::updateOrCreate(['code' => $m['code']], array_merge($m, ['is_popular' => $isPopular]));
        }
    }
}
