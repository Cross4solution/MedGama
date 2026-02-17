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
            'translations' => 'required|array',
        ]);

        $specialty = Specialty::create($validated);

        return response()->json(['specialty' => $specialty], 201);
    }

    public function updateSpecialty(Request $request, string $id)
    {
        $specialty = Specialty::active()->findOrFail($id);

        $validated = $request->validate([
            'display_order' => 'sometimes|integer',
            'translations' => 'sometimes|array',
        ]);

        $specialty->update($validated);

        return response()->json(['specialty' => $specialty->fresh()]);
    }

    public function destroySpecialty(string $id)
    {
        Specialty::active()->findOrFail($id)->update(['is_active' => false]);
        return response()->json(['message' => 'Specialty deleted.']);
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
            'translations' => 'required|array',
        ]);

        $city = City::create($validated);

        return response()->json(['city' => $city], 201);
    }

    public function updateCity(Request $request, string $id)
    {
        $city = City::active()->findOrFail($id);

        $validated = $request->validate([
            'translations' => 'sometimes|array',
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
            'translations' => 'required|array',
        ]);

        $disease = DiseaseCondition::create($validated);

        return response()->json(['disease' => $disease], 201);
    }

    public function updateDisease(Request $request, string $id)
    {
        $disease = DiseaseCondition::active()->findOrFail($id);

        $validated = $request->validate([
            'recommended_specialty_ids' => 'sometimes|array',
            'translations' => 'sometimes|array',
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
            'translations' => 'required|array',
        ]);

        $mapping = SymptomSpecialtyMapping::create($validated);

        return response()->json(['symptom' => $mapping], 201);
    }

    public function updateSymptom(Request $request, string $id)
    {
        $mapping = SymptomSpecialtyMapping::active()->findOrFail($id);

        $validated = $request->validate([
            'specialty_ids' => 'sometimes|array',
            'translations' => 'sometimes|array',
        ]);

        $mapping->update($validated);

        return response()->json(['symptom' => $mapping->fresh()]);
    }
}
