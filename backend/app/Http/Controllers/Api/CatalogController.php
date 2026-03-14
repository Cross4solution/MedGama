<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Specialty;
use App\Models\City;
use App\Models\DiseaseCondition;
use App\Models\SymptomSpecialtyMapping;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    // ── Specialties ──

    public function specialties(Request $request)
    {
        $specialties = Specialty::active()
            ->ordered()
            ->when($request->code, fn($q, $v) => $q->where('code', $v))
            ->get();

        return response()->json(['specialties' => $specialties]);
    }

    public function storeSpecialty(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:specialties,code',
            'display_order' => 'sometimes|integer',
            'name' => 'required|array',
            'name.en' => 'required|string|max:255',
            'name.tr' => 'required|string|max:255',
            'description' => 'sometimes|array',
        ]);

        $specialty = Specialty::create($validated);

        return response()->json(['specialty' => $specialty], 201);
    }

    public function updateSpecialty(Request $request, string $id)
    {
        $specialty = Specialty::active()->findOrFail($id);

        $validated = $request->validate([
            'display_order' => 'sometimes|integer',
            'name' => 'sometimes|array',
            'description' => 'sometimes|array',
        ]);

        $specialty->update($validated);

        return response()->json(['specialty' => $specialty->fresh()]);
    }

    public function destroySpecialty(string $id)
    {
        Specialty::active()->findOrFail($id)->update(['is_active' => false]);
        return response()->json(['message' => 'Specialty deleted.']);
    }

    /**
     * GET /api/catalog/specialties/search — Lightweight for search bar autocomplete.
     * Returns only id + resolved name (locale-aware). Cached 10 min.
     */
    public function specialtiesSearch(Request $request)
    {
        $locale = app()->getLocale();
        $fallback = config('app.fallback_locale', 'en');

        $items = cache()->remember("catalog:specialties:search:{$locale}", 600, function () use ($locale, $fallback) {
            return Specialty::active()->ordered()->get()->map(fn($s) => [
                'id'   => $s->id,
                'code' => $s->code,
                'name' => $s->getTranslation('name', $locale) ?? $s->getTranslation('name', $fallback),
            ])->values();
        });

        // Optional client-side q filter
        if ($q = $request->query('q')) {
            $q = mb_strtolower($q);
            $items = $items->filter(fn($i) => str_contains(mb_strtolower($i['name'] ?? ''), $q)
                                           || str_contains(mb_strtolower($i['code'] ?? ''), $q))->values();
        }

        return response()->json(['specialties' => $items]);
    }

    /**
     * GET /api/catalog/cities/search — Lightweight for search bar autocomplete.
     * Returns only id + resolved name (locale-aware). Cached 10 min.
     */
    public function citiesSearch(Request $request)
    {
        $locale = app()->getLocale();
        $fallback = config('app.fallback_locale', 'en');

        $items = cache()->remember("catalog:cities:search:{$locale}", 600, function () use ($locale, $fallback) {
            return City::active()->orderBy('name')->get()->map(fn($c) => [
                'id'   => $c->id,
                'code' => $c->code,
                'name' => $c->getTranslation('name', $locale) ?? $c->getTranslation('name', $fallback),
            ])->values();
        });

        if ($q = $request->query('q')) {
            $q = mb_strtolower($q);
            $items = $items->filter(fn($i) => str_contains(mb_strtolower($i['name'] ?? ''), $q))->values();
        }

        return response()->json(['cities' => $items]);
    }

    // ── Cities ──

    public function cities(Request $request)
    {
        $cities = City::active()
            ->when($request->country_id, fn($q, $v) => $q->byCountry($v))
            ->when($request->code, fn($q, $v) => $q->where('code', $v))
            ->get();

        return response()->json(['cities' => $cities]);
    }

    public function storeCity(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20',
            'country_id' => 'required|integer',
            'name' => 'required|array',
            'name.en' => 'required|string|max:255',
            'name.tr' => 'required|string|max:255',
        ]);

        $city = City::create($validated);

        return response()->json(['city' => $city], 201);
    }

    public function updateCity(Request $request, string $id)
    {
        $city = City::active()->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|array',
        ]);

        $city->update($validated);

        return response()->json(['city' => $city->fresh()]);
    }

    public function destroyCity(string $id)
    {
        City::active()->findOrFail($id)->update(['is_active' => false]);
        return response()->json(['message' => 'City deleted.']);
    }

    // ── Disease Conditions ──

    public function diseases(Request $request)
    {
        $diseases = DiseaseCondition::active()
            ->when($request->code, fn($q, $v) => $q->where('code', $v))
            ->get();

        return response()->json(['diseases' => $diseases]);
    }

    public function storeDisease(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:disease_conditions,code',
            'recommended_specialty_ids' => 'sometimes|array',
            'name' => 'required|array',
            'name.en' => 'required|string|max:255',
            'name.tr' => 'required|string|max:255',
            'description' => 'sometimes|array',
        ]);

        $disease = DiseaseCondition::create($validated);

        return response()->json(['disease' => $disease], 201);
    }

    public function updateDisease(Request $request, string $id)
    {
        $disease = DiseaseCondition::active()->findOrFail($id);

        $validated = $request->validate([
            'recommended_specialty_ids' => 'sometimes|array',
            'name' => 'sometimes|array',
            'description' => 'sometimes|array',
        ]);

        $disease->update($validated);

        return response()->json(['disease' => $disease->fresh()]);
    }

    // ── Symptom-Specialty Mapping ──

    public function symptoms(Request $request)
    {
        $symptoms = SymptomSpecialtyMapping::active()
            ->when($request->symptom, fn($q, $v) => $q->where('symptom', 'like', "%{$v}%"))
            ->get();

        return response()->json(['symptoms' => $symptoms]);
    }

    public function storeSymptom(Request $request)
    {
        $validated = $request->validate([
            'symptom' => 'required|string|max:100|unique:symptom_specialty_mappings,symptom',
            'specialty_ids' => 'required|array',
            'name' => 'required|array',
            'name.en' => 'required|string|max:255',
            'name.tr' => 'required|string|max:255',
        ]);

        $mapping = SymptomSpecialtyMapping::create($validated);

        return response()->json(['symptom' => $mapping], 201);
    }

    public function updateSymptom(Request $request, string $id)
    {
        $mapping = SymptomSpecialtyMapping::active()->findOrFail($id);

        $validated = $request->validate([
            'specialty_ids' => 'sometimes|array',
            'name' => 'sometimes|array',
        ]);

        $mapping->update($validated);

        return response()->json(['symptom' => $mapping->fresh()]);
    }
}
