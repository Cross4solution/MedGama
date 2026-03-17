<?php

namespace Database\Seeders;

use App\Models\Allergy;
use App\Models\Medication;
use Illuminate\Database\Seeder;

class AllergiesAndMedicationsSeeder extends Seeder
{
    public function run(): void
    {
        // ── Allergies ──
        $allergies = [
            // Drug allergies
            ['code' => 'ALG-PEN', 'name' => ['en' => 'Penicillin', 'tr' => 'Penisilin'], 'category' => 'drug'],
            ['code' => 'ALG-SUL', 'name' => ['en' => 'Sulfonamides', 'tr' => 'Sülfonamidler'], 'category' => 'drug'],
            ['code' => 'ALG-ASP', 'name' => ['en' => 'Aspirin', 'tr' => 'Aspirin'], 'category' => 'drug'],
            ['code' => 'ALG-IBU', 'name' => ['en' => 'Ibuprofen', 'tr' => 'İbuprofen'], 'category' => 'drug'],
            ['code' => 'ALG-CEP', 'name' => ['en' => 'Cephalosporins', 'tr' => 'Sefalosporinler'], 'category' => 'drug'],
            ['code' => 'ALG-AMX', 'name' => ['en' => 'Amoxicillin', 'tr' => 'Amoksisilin'], 'category' => 'drug'],
            ['code' => 'ALG-COD', 'name' => ['en' => 'Codeine', 'tr' => 'Kodein'], 'category' => 'drug'],
            ['code' => 'ALG-MOR', 'name' => ['en' => 'Morphine', 'tr' => 'Morfin'], 'category' => 'drug'],
            ['code' => 'ALG-TET', 'name' => ['en' => 'Tetracycline', 'tr' => 'Tetrasiklin'], 'category' => 'drug'],
            ['code' => 'ALG-ERY', 'name' => ['en' => 'Erythromycin', 'tr' => 'Eritromisin'], 'category' => 'drug'],
            ['code' => 'ALG-ANE', 'name' => ['en' => 'Local Anesthetics', 'tr' => 'Lokal Anestezikler'], 'category' => 'drug'],
            ['code' => 'ALG-INS', 'name' => ['en' => 'Insulin', 'tr' => 'İnsülin'], 'category' => 'drug'],
            ['code' => 'ALG-NSAID', 'name' => ['en' => 'NSAIDs', 'tr' => 'NSAİİ (Steroid Dışı)'], 'category' => 'drug'],
            // Food allergies
            ['code' => 'ALG-LAC', 'name' => ['en' => 'Lactose', 'tr' => 'Laktoz'], 'category' => 'food'],
            ['code' => 'ALG-GLU', 'name' => ['en' => 'Gluten', 'tr' => 'Glüten'], 'category' => 'food'],
            ['code' => 'ALG-PEA', 'name' => ['en' => 'Peanuts', 'tr' => 'Yer Fıstığı'], 'category' => 'food'],
            ['code' => 'ALG-TRN', 'name' => ['en' => 'Tree Nuts', 'tr' => 'Kabuklu Yemiş'], 'category' => 'food'],
            ['code' => 'ALG-SHE', 'name' => ['en' => 'Shellfish', 'tr' => 'Kabuklu Deniz Ürünü'], 'category' => 'food'],
            ['code' => 'ALG-EGG', 'name' => ['en' => 'Eggs', 'tr' => 'Yumurta'], 'category' => 'food'],
            ['code' => 'ALG-SOY', 'name' => ['en' => 'Soy', 'tr' => 'Soya'], 'category' => 'food'],
            ['code' => 'ALG-WHE', 'name' => ['en' => 'Wheat', 'tr' => 'Buğday'], 'category' => 'food'],
            ['code' => 'ALG-MIL', 'name' => ['en' => 'Cow Milk', 'tr' => 'İnek Sütü'], 'category' => 'food'],
            ['code' => 'ALG-FSH', 'name' => ['en' => 'Fish', 'tr' => 'Balık'], 'category' => 'food'],
            ['code' => 'ALG-SES', 'name' => ['en' => 'Sesame', 'tr' => 'Susam'], 'category' => 'food'],
            // Environmental allergies
            ['code' => 'ALG-POL', 'name' => ['en' => 'Pollen', 'tr' => 'Polen'], 'category' => 'environmental'],
            ['code' => 'ALG-DUS', 'name' => ['en' => 'Dust Mites', 'tr' => 'Toz Akarları'], 'category' => 'environmental'],
            ['code' => 'ALG-MOL', 'name' => ['en' => 'Mold', 'tr' => 'Küf'], 'category' => 'environmental'],
            ['code' => 'ALG-CAT', 'name' => ['en' => 'Cat Dander', 'tr' => 'Kedi Tüyü'], 'category' => 'environmental'],
            ['code' => 'ALG-DOG', 'name' => ['en' => 'Dog Dander', 'tr' => 'Köpek Tüyü'], 'category' => 'environmental'],
            ['code' => 'ALG-LAT', 'name' => ['en' => 'Latex', 'tr' => 'Lateks'], 'category' => 'environmental'],
            ['code' => 'ALG-BEE', 'name' => ['en' => 'Bee Venom', 'tr' => 'Arı Zehiri'], 'category' => 'environmental'],
            ['code' => 'ALG-COC', 'name' => ['en' => 'Cockroach', 'tr' => 'Hamam Böceği'], 'category' => 'environmental'],
            ['code' => 'ALG-NIC', 'name' => ['en' => 'Nickel', 'tr' => 'Nikel'], 'category' => 'environmental'],
        ];

        foreach ($allergies as $a) {
            Allergy::updateOrCreate(['code' => $a['code']], $a);
        }

        // ── Medications ──
        $medications = [
            // Analgesics / Anti-inflammatory
            ['code' => 'MED-IBU', 'name' => ['en' => 'Ibuprofen', 'tr' => 'İbuprofen'], 'category' => 'analgesic', 'form' => 'tablet'],
            ['code' => 'MED-PAR', 'name' => ['en' => 'Paracetamol (Acetaminophen)', 'tr' => 'Parasetamol'], 'category' => 'analgesic', 'form' => 'tablet'],
            ['code' => 'MED-ASP', 'name' => ['en' => 'Aspirin', 'tr' => 'Aspirin'], 'category' => 'analgesic', 'form' => 'tablet'],
            ['code' => 'MED-NAP', 'name' => ['en' => 'Naproxen', 'tr' => 'Naproksen'], 'category' => 'analgesic', 'form' => 'tablet'],
            ['code' => 'MED-DIC', 'name' => ['en' => 'Diclofenac', 'tr' => 'Diklofenak'], 'category' => 'analgesic', 'form' => 'tablet'],
            ['code' => 'MED-TRA', 'name' => ['en' => 'Tramadol', 'tr' => 'Tramadol'], 'category' => 'analgesic', 'form' => 'capsule'],
            // Antibiotics
            ['code' => 'MED-AMX', 'name' => ['en' => 'Amoxicillin', 'tr' => 'Amoksisilin'], 'category' => 'antibiotic', 'form' => 'capsule'],
            ['code' => 'MED-AZI', 'name' => ['en' => 'Azithromycin', 'tr' => 'Azitromisin'], 'category' => 'antibiotic', 'form' => 'tablet'],
            ['code' => 'MED-CIP', 'name' => ['en' => 'Ciprofloxacin', 'tr' => 'Siprofloksasin'], 'category' => 'antibiotic', 'form' => 'tablet'],
            ['code' => 'MED-MET', 'name' => ['en' => 'Metronidazole', 'tr' => 'Metronidazol'], 'category' => 'antibiotic', 'form' => 'tablet'],
            ['code' => 'MED-DOX', 'name' => ['en' => 'Doxycycline', 'tr' => 'Doksisiklin'], 'category' => 'antibiotic', 'form' => 'capsule'],
            ['code' => 'MED-CEF', 'name' => ['en' => 'Cefuroxime', 'tr' => 'Sefuroksim'], 'category' => 'antibiotic', 'form' => 'tablet'],
            ['code' => 'MED-CLA', 'name' => ['en' => 'Clarithromycin', 'tr' => 'Klaritromisin'], 'category' => 'antibiotic', 'form' => 'tablet'],
            ['code' => 'MED-AUG', 'name' => ['en' => 'Amoxicillin-Clavulanate', 'tr' => 'Amoksisilin-Klavulanat'], 'category' => 'antibiotic', 'form' => 'tablet'],
            // Cardiovascular
            ['code' => 'MED-AML', 'name' => ['en' => 'Amlodipine', 'tr' => 'Amlodipin'], 'category' => 'cardiovascular', 'form' => 'tablet'],
            ['code' => 'MED-ATE', 'name' => ['en' => 'Atenolol', 'tr' => 'Atenolol'], 'category' => 'cardiovascular', 'form' => 'tablet'],
            ['code' => 'MED-LOS', 'name' => ['en' => 'Losartan', 'tr' => 'Losartan'], 'category' => 'cardiovascular', 'form' => 'tablet'],
            ['code' => 'MED-RAM', 'name' => ['en' => 'Ramipril', 'tr' => 'Ramipril'], 'category' => 'cardiovascular', 'form' => 'capsule'],
            ['code' => 'MED-WAR', 'name' => ['en' => 'Warfarin', 'tr' => 'Varfarin'], 'category' => 'cardiovascular', 'form' => 'tablet'],
            ['code' => 'MED-CLO', 'name' => ['en' => 'Clopidogrel', 'tr' => 'Klopidogrel'], 'category' => 'cardiovascular', 'form' => 'tablet'],
            ['code' => 'MED-ATO', 'name' => ['en' => 'Atorvastatin', 'tr' => 'Atorvastatin'], 'category' => 'cardiovascular', 'form' => 'tablet'],
            ['code' => 'MED-ROS', 'name' => ['en' => 'Rosuvastatin', 'tr' => 'Rosuvastatin'], 'category' => 'cardiovascular', 'form' => 'tablet'],
            // Diabetes
            ['code' => 'MED-MFO', 'name' => ['en' => 'Metformin', 'tr' => 'Metformin'], 'category' => 'diabetes', 'form' => 'tablet'],
            ['code' => 'MED-GLI', 'name' => ['en' => 'Glimepiride', 'tr' => 'Glimepirid'], 'category' => 'diabetes', 'form' => 'tablet'],
            ['code' => 'MED-INS', 'name' => ['en' => 'Insulin (Regular)', 'tr' => 'İnsülin (Regüler)'], 'category' => 'diabetes', 'form' => 'injection'],
            // Respiratory
            ['code' => 'MED-SAL', 'name' => ['en' => 'Salbutamol (Albuterol)', 'tr' => 'Salbutamol'], 'category' => 'respiratory', 'form' => 'inhaler'],
            ['code' => 'MED-MON', 'name' => ['en' => 'Montelukast', 'tr' => 'Montelukast'], 'category' => 'respiratory', 'form' => 'tablet'],
            ['code' => 'MED-FLU', 'name' => ['en' => 'Fluticasone', 'tr' => 'Flutikazon'], 'category' => 'respiratory', 'form' => 'inhaler'],
            // Gastrointestinal
            ['code' => 'MED-OMP', 'name' => ['en' => 'Omeprazole', 'tr' => 'Omeprazol'], 'category' => 'gastrointestinal', 'form' => 'capsule'],
            ['code' => 'MED-LAN', 'name' => ['en' => 'Lansoprazole', 'tr' => 'Lansoprazol'], 'category' => 'gastrointestinal', 'form' => 'capsule'],
            ['code' => 'MED-RAN', 'name' => ['en' => 'Ranitidine', 'tr' => 'Ranitidin'], 'category' => 'gastrointestinal', 'form' => 'tablet'],
            ['code' => 'MED-DOM', 'name' => ['en' => 'Domperidone', 'tr' => 'Domperidon'], 'category' => 'gastrointestinal', 'form' => 'tablet'],
            // Neurological / Psychiatric
            ['code' => 'MED-SER', 'name' => ['en' => 'Sertraline', 'tr' => 'Sertralin'], 'category' => 'neurological', 'form' => 'tablet'],
            ['code' => 'MED-FLX', 'name' => ['en' => 'Fluoxetine', 'tr' => 'Fluoksetin'], 'category' => 'neurological', 'form' => 'capsule'],
            ['code' => 'MED-GAB', 'name' => ['en' => 'Gabapentin', 'tr' => 'Gabapentin'], 'category' => 'neurological', 'form' => 'capsule'],
            ['code' => 'MED-PRE', 'name' => ['en' => 'Pregabalin', 'tr' => 'Pregabalin'], 'category' => 'neurological', 'form' => 'capsule'],
            ['code' => 'MED-DIA', 'name' => ['en' => 'Diazepam', 'tr' => 'Diazepam'], 'category' => 'neurological', 'form' => 'tablet'],
            // Dermatology
            ['code' => 'MED-CET', 'name' => ['en' => 'Cetirizine', 'tr' => 'Setirizin'], 'category' => 'antihistamine', 'form' => 'tablet'],
            ['code' => 'MED-LOR', 'name' => ['en' => 'Loratadine', 'tr' => 'Loratadin'], 'category' => 'antihistamine', 'form' => 'tablet'],
            ['code' => 'MED-PRD', 'name' => ['en' => 'Prednisolone', 'tr' => 'Prednizolon'], 'category' => 'corticosteroid', 'form' => 'tablet'],
            ['code' => 'MED-DEX', 'name' => ['en' => 'Dexamethasone', 'tr' => 'Deksametazon'], 'category' => 'corticosteroid', 'form' => 'tablet'],
        ];

        foreach ($medications as $m) {
            Medication::updateOrCreate(['code' => $m['code']], $m);
        }
    }
}
