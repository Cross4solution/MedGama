<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DoctorFaq;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DoctorFaqController extends Controller
{
    /**
     * GET /api/doctors/{doctorId}/faqs — Public list (active only)
     */
    public function index(string $doctorId): JsonResponse
    {
        $faqs = DoctorFaq::where('doctor_id', $doctorId)
            ->active()
            ->ordered()
            ->get();

        return response()->json(['data' => $faqs]);
    }

    /**
     * GET /api/doctor-profile/faqs — CRM: list own FAQs (all, including inactive)
     */
    public function myFaqs(Request $request): JsonResponse
    {
        $user = $request->user();

        $faqs = DoctorFaq::where('doctor_id', $user->id)
            ->ordered()
            ->get();

        return response()->json(['data' => $faqs]);
    }

    /**
     * POST /api/doctor-profile/faqs — CRM: create FAQ
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'question'   => 'required|string|max:500',
            'answer'     => 'required|string|max:5000',
            'sort_order' => 'nullable|integer|min:0',
            'is_active'  => 'nullable|boolean',
        ]);

        $data['doctor_id'] = $user->id;
        $data['sort_order'] = $data['sort_order'] ?? DoctorFaq::where('doctor_id', $user->id)->max('sort_order') + 1;

        $faq = DoctorFaq::create($data);

        return response()->json(['data' => $faq, 'message' => 'FAQ created'], 201);
    }

    /**
     * PUT /api/doctor-profile/faqs/{id} — CRM: update FAQ
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $faq = DoctorFaq::where('doctor_id', $user->id)->findOrFail($id);

        $data = $request->validate([
            'question'   => 'nullable|string|max:500',
            'answer'     => 'nullable|string|max:5000',
            'sort_order' => 'nullable|integer|min:0',
            'is_active'  => 'nullable|boolean',
        ]);

        $faq->update(array_filter($data, fn($v) => $v !== null));

        return response()->json(['data' => $faq, 'message' => 'FAQ updated']);
    }

    /**
     * DELETE /api/doctor-profile/faqs/{id} — CRM: delete FAQ
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        DoctorFaq::where('doctor_id', $user->id)->findOrFail($id)->delete();

        return response()->json(['message' => 'FAQ deleted']);
    }

    /**
     * PUT /api/doctor-profile/faqs/reorder — CRM: bulk reorder
     */
    public function reorder(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'order'   => 'required|array',
            'order.*' => 'uuid',
        ]);

        foreach ($data['order'] as $index => $faqId) {
            DoctorFaq::where('doctor_id', $user->id)
                ->where('id', $faqId)
                ->update(['sort_order' => $index]);
        }

        return response()->json(['message' => 'Reordered']);
    }
}
