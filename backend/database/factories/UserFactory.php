<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    protected static ?string $password;

    public function definition(): array
    {
        return [
            'fullname'       => fake()->name(),
            'email'          => strtolower((string) Str::ulid()) . '@example.test',
            'password'       => static::$password ??= Hash::make('password'),
            'role_id'        => 'patient',
            'user_level'     => self::SEVIYE['patient'],
            'mobile'         => fake()->phoneNumber(),
            'email_verified' => true,
            'is_verified'    => true,
            'is_active'      => true,
        ];
    }

    /**
     * Rol → seviye eşlemesi (AuthService::register ile aynı).
     * Fabrika bu sütunu doldurmuyordu; seviyeye bakan yetki kontrolleri testte
     * gerçek davranıştan farklı sonuç veriyor, testler yanlış güven veriyordu.
     */
    private const SEVIYE = [
        'patient' => 1, 'doctor' => 2, 'clinicOwner' => 3, 'clinic' => 3,
        'hospital' => 4, 'superAdmin' => 5, 'saasAdmin' => 5,
    ];

    private function rol(string $rol): static
    {
        return $this->state(['role_id' => $rol, 'user_level' => self::SEVIYE[$rol] ?? 1]);
    }

    public function patient(): static
    {
        return $this->rol('patient');
    }

    public function doctor(): static
    {
        return $this->rol('doctor');
    }

    public function clinicOwner(): static
    {
        return $this->rol('clinicOwner');
    }

    public function unverified(): static
    {
        return $this->state(['is_verified' => false]);
    }

    public function admin(): static
    {
        return $this->rol('superAdmin');
    }

    /**
     * Satış temsilcisi.
     *
     * Rolün kendi rotaları ve kendine özgü kapsam kuralı var (yalnızca
     * kendisine atanan adayları görür) ama fabrikada karşılığı yoktu, bu
     * yüzden hiç test edilememişti.
     */
    public function salesperson(): static
    {
        return $this->rol('salesperson');
    }
}
