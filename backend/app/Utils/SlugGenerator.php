<?php

namespace App\Utils;

use Illuminate\Support\Str;

class SlugGenerator
{
    /**
     * Generate a SEO-friendly slug from doctor title and full name
     * Example: "Uzm. Dr. Ayşe Kaya" → "uzm-dr-ayse-kaya"
     *
     * @param string $title Doctor's title (e.g., "Uzm. Dr.", "Dr.")
     * @param string $fullname Doctor's full name
     * @return string SEO-friendly slug
     */
    public static function generateDoctorSlug(string $title = '', string $fullname = ''): string
    {
        $parts = [];

        // Clean and add title
        if (!empty($title)) {
            $title = trim($title);
            // Remove dots and decode Turkish characters
            $title = str_replace('.', '', $title);
            $parts[] = $title;
        }

        // Add name
        if (!empty($fullname)) {
            $parts[] = trim($fullname);
        }

        // Join and create slug
        $combined = implode(' ', $parts);

        // Turkish character mapping
        $turkishChars = [
            'ç' => 'c', 'ğ' => 'g', 'ı' => 'i', 'ö' => 'o',
            'ş' => 's', 'ü' => 'u', 'Ç' => 'c', 'Ğ' => 'g',
            'İ' => 'i', 'Ö' => 'o', 'Ş' => 's', 'Ü' => 'u',
        ];

        $combined = strtr($combined, $turkishChars);

        // Convert to lowercase slug
        $slug = Str::slug($combined, '-');

        return $slug ?: 'doctor-' . uniqid();
    }

    /**
     * Generate unique slug with collision resolution
     *
     * @param string $baseSlug Base slug to check
     * @param callable $checkExists Function to check if slug exists
     * @return string Unique slug
     */
    public static function ensureUniqueSlug(string $baseSlug, callable $checkExists): string
    {
        $slug = $baseSlug;
        $counter = 1;

        while ($checkExists($slug)) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
