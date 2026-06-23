<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctor_clinic', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');      // the doctor (users.id)
            $table->uuid('clinic_id');    // clinics.id
            $table->boolean('is_primary')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'clinic_id']);
            $table->index('user_id');
            $table->index('clinic_id');
        });

        // Backfill: every doctor with a current clinic_id gets a primary pivot row
        User::where('role_id', 'doctor')->whereNotNull('clinic_id')->chunkById(200, function ($doctors) {
            $now = now();
            $rows = [];
            foreach ($doctors as $d) {
                $rows[] = [
                    'id'         => (string) \Illuminate\Support\Str::uuid(),
                    'user_id'    => $d->id,
                    'clinic_id'  => $d->clinic_id,
                    'is_primary' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
            if ($rows) {
                DB::table('doctor_clinic')->insert($rows);
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctor_clinic');
    }
};
