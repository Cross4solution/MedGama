<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FaqController extends Controller
{
    /**
     * GET /api/faqs — Public list (published only)
     */
    public function index(Request $request): JsonResponse
    {
        $query = Faq::published()->orderBy('sort_order');

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        return response()->json($query->get());
    }

    /**
     * GET /api/admin/faqs — Admin list (all)
     */
    public function adminIndex(): JsonResponse
    {
        return response()->json(Faq::orderBy('sort_order')->get());
    }

    /**
     * POST /api/admin/faqs
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'question'     => 'required|array',
            'question.en'  => 'required|string|max:500',
            'answer'       => 'required|array',
            'answer.en'    => 'required|string|max:5000',
            'category'     => 'nullable|string|max:50',
            'sort_order'   => 'nullable|integer',
            'is_published' => 'nullable|boolean',
        ]);

        $faq = Faq::create($data);
        return response()->json($faq, 201);
    }

    /**
     * PUT /api/admin/faqs/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $faq = Faq::findOrFail($id);

        $data = $request->validate([
            'question'     => 'nullable|array',
            'answer'       => 'nullable|array',
            'category'     => 'nullable|string|max:50',
            'sort_order'   => 'nullable|integer',
            'is_published' => 'nullable|boolean',
        ]);

        $faq->update(array_filter($data, fn($v) => $v !== null));
        return response()->json($faq);
    }

    /**
     * DELETE /api/admin/faqs/{id}
     */
    public function destroy(string $id): JsonResponse
    {
        Faq::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
