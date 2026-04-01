<?php

namespace Database\Seeders;

use App\Models\Accreditation;
use Illuminate\Database\Seeder;

class AccreditationSeeder extends Seeder
{
    public function run(): void
    {
        // ── Master Accreditations Library ──
        $accreditations = [
            [
                'name' => 'JCI Accredited',
                'description' => 'Joint Commission International Accreditation - Global standard for quality and safety',
                'icon' => 'award',
                'category' => 'certification',
                'sort_order' => 1,
            ],
            [
                'name' => 'ISO 9001',
                'description' => 'Quality Management System Certification',
                'icon' => 'certificate',
                'category' => 'certification',
                'sort_order' => 2,
            ],
            [
                'name' => 'ISO 14001',
                'description' => 'Environmental Management System Certification',
                'icon' => 'leaf',
                'category' => 'certification',
                'sort_order' => 3,
            ],
            [
                'name' => 'Temos International',
                'description' => 'Turkish Health Tourism Certification by Temos International',
                'icon' => 'hospital',
                'category' => 'certification',
                'sort_order' => 4,
            ],
            [
                'name' => 'Sağlık Turizmi Yetki Belgesi',
                'description' => 'Health Tourism Authorization Certificate - Turkish Ministry of Health',
                'icon' => 'certificate',
                'category' => 'authorization',
                'sort_order' => 5,
            ],
            [
                'name' => 'T.C. Sağlık Bakanlığı Onaylı',
                'description' => 'Turkish Ministry of Health Approval',
                'icon' => 'check-circle',
                'category' => 'authorization',
                'sort_order' => 6,
            ],
            [
                'name' => 'EFQM Excellence Award',
                'description' => 'European Foundation for Quality Management Excellence Award',
                'icon' => 'trophy',
                'category' => 'award',
                'sort_order' => 7,
            ],
        ];

        foreach ($accreditations as $data) {
            Accreditation::firstOrCreate(
                ['name' => $data['name']],
                $data
            );
        }
    }
}
