<?php

namespace App\Models\Traits;

/**
 * Spatie/laravel-translatable-style JSON translation support.
 *
 * Each translatable attribute is stored as a JSON column:
 *   { "en": "Cardiology", "tr": "Kardiyoloji", "de": "Kardiologie" }
 *
 * Usage in model:
 *   use HasTranslations;
 *   public array $translatable = ['name', 'description'];
 *
 * Reading:
 *   $model->name                   → resolved via app locale → fallback
 *   $model->getTranslation('name', 'de')
 *   $model->getTranslations('name') → full array
 *
 * Writing:
 *   $model->setTranslation('name', 'tr', 'Kardiyoloji')
 *   $model->name = ['en' => 'Cardiology', 'tr' => 'Kardiyoloji']
 */
trait HasTranslations
{
    /**
     * Get the translated value for an attribute in the given locale.
     * Falls back to: requested locale → app locale → fallback locale → first available.
     */
    public function getTranslation(string $attribute, ?string $locale = null, bool $useFallback = true): ?string
    {
        $locale = $locale ?: app()->getLocale();
        $translations = $this->getTranslations($attribute);

        if (isset($translations[$locale])) {
            return $translations[$locale];
        }

        if ($useFallback) {
            $fallback = config('app.fallback_locale', 'en');
            if (isset($translations[$fallback])) {
                return $translations[$fallback];
            }

            // Return first available translation
            return !empty($translations) ? reset($translations) : null;
        }

        return null;
    }

    /**
     * Get all translations for an attribute as an associative array.
     */
    public function getTranslations(string $attribute): array
    {
        $value = $this->getAttributes()[$attribute] ?? null;

        if (is_string($value)) {
            $decoded = json_decode($value, true);
            return is_array($decoded) ? $decoded : [];
        }

        return is_array($value) ? $value : [];
    }

    /**
     * Set a single locale translation for an attribute.
     */
    public function setTranslation(string $attribute, string $locale, ?string $value): static
    {
        $translations = $this->getTranslations($attribute);
        $translations[$locale] = $value;

        $this->attributes[$attribute] = json_encode($translations, JSON_UNESCAPED_UNICODE);

        return $this;
    }

    /**
     * Replace all translations for an attribute at once.
     */
    public function setTranslations(string $attribute, array $translations): static
    {
        $this->attributes[$attribute] = json_encode($translations, JSON_UNESCAPED_UNICODE);
        return $this;
    }

    /**
     * Override getAttribute to auto-resolve translatable fields.
     * When you access $model->name it returns the translated string (not JSON).
     */
    public function getAttribute($key)
    {
        if ($this->isTranslatableAttribute($key)) {
            return $this->getTranslation($key);
        }

        return parent::getAttribute($key);
    }

    /**
     * Check if an attribute is marked as translatable.
     */
    public function isTranslatableAttribute(string $key): bool
    {
        return property_exists($this, 'translatable') && in_array($key, $this->translatable);
    }

    /**
     * Get all translatable attribute names.
     */
    public function getTranslatableAttributes(): array
    {
        return property_exists($this, 'translatable') ? $this->translatable : [];
    }

    /**
     * Override toArray to include resolved translations + raw translations.
     * API response will contain both:
     *   "name": "Kardiyoloji"          (resolved for current locale)
     *   "name_translations": {...}     (all locales)
     */
    public function toArray(): array
    {
        $array = parent::toArray();

        foreach ($this->getTranslatableAttributes() as $attribute) {
            // Resolved value for current locale
            $array[$attribute] = $this->getTranslation($attribute);
            // Full translations object
            $array["{$attribute}_translations"] = $this->getTranslations($attribute);
        }

        return $array;
    }
}
