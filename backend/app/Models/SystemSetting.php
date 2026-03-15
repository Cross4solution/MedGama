<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'key',
        'value',
        'type',
        'group',
        'label',
        'description',
        'updated_by',
    ];

    // ── Relationships ──

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // ── Accessors ──

    /**
     * Cast value to appropriate PHP type based on 'type' column.
     */
    public function getTypedValueAttribute(): mixed
    {
        return match ($this->type) {
            'boolean' => filter_var($this->value, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int) $this->value,
            'json'    => json_decode($this->value, true),
            default   => $this->value,
        };
    }

    // ── Static Helpers ──

    /**
     * Get a setting value by key, with optional default.
     */
    public static function getValue(string $key, mixed $default = null): mixed
    {
        $setting = static::where('key', $key)->first();

        return $setting ? $setting->typed_value : $default;
    }

    /**
     * Set a setting value by key.
     */
    public static function setValue(string $key, mixed $value, ?string $userId = null): static
    {
        $setting = static::where('key', $key)->first();

        if (!$setting) {
            return static::create([
                'key'        => $key,
                'value'      => is_bool($value) ? ($value ? '1' : '0') : (string) $value,
                'updated_by' => $userId,
            ]);
        }

        $setting->update([
            'value'      => is_bool($value) ? ($value ? '1' : '0') : (string) $value,
            'updated_by' => $userId,
        ]);

        return $setting->refresh();
    }
}
