<?php

namespace App\Services;

use App\Models\DoctorReview;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Vasco — symptom → right-specialist routing assistant. NEVER diagnoses.
 *
 * Pipeline: (1) understand the free-text complaint in any language and pick the
 * best-fitting specialty from the member catalog (LLM if configured, else keyword
 * fallback — keyless), optionally ask one follow-up; (2) retrieve the most relevant
 * member doctors for that specialty; (3) return ranked cards + a short rationale.
 *
 * LLM is provider-agnostic via an OpenAI-compatible Chat Completions endpoint
 * (env: VASCO_LLM_BASE, VASCO_LLM_KEY, VASCO_LLM_MODEL). Default target: Groq +
 * Llama 3.3 (free, fast, multilingual). No key → keyword fallback still works.
 */
class VascoService
{
    public function suggest(string $text, string $lang = 'tr', ?string $location = null, int $limit = 8): array
    {
        $text = trim($text);
        if ($text === '') {
            return ['specialty' => null, 'follow_up' => null, 'rationale' => '', 'doctors' => []];
        }

        $specialties = Specialty::query()->where('is_active', true)
            ->get(['id', 'code', 'name'])
            ->map(fn ($s) => ['id' => $s->id, 'code' => $s->code, 'name' => $s->name])
            ->all();

        $picked = $this->extract($text, $lang, $specialties);

        $specialty = null;
        if (!empty($picked['code'])) {
            $specialty = collect($specialties)->firstWhere('code', $picked['code']);
        }

        $doctors = $specialty ? $this->retrieveDoctors($specialty['id'], $location, $limit) : [];

        return [
            'specialty'  => $specialty,
            'follow_up'  => $picked['follow_up'] ?? null,
            'rationale'  => $picked['rationale'] ?? '',
            'doctors'    => $doctors,
            'disclaimer' => true, // UI must show: Vasco does not diagnose.
        ];
    }

    /** @return array{code:?string, follow_up:?string, rationale:string} */
    private function extract(string $text, string $lang, array $specialties): array
    {
        $base = rtrim((string) env('VASCO_LLM_BASE', 'https://api.groq.com/openai/v1'), '/');
        $key = env('VASCO_LLM_KEY');
        if ($key) {
            try {
                return $this->llmExtract($base, $key, $text, $lang, $specialties);
            } catch (\Throwable $e) {
                Log::warning('Vasco LLM failed, falling back: ' . $e->getMessage());
            }
        }
        return $this->keywordExtract($text, $specialties);
    }

    private function llmExtract(string $base, string $key, string $text, string $lang, array $specialties): array
    {
        $list = collect($specialties)
            ->map(fn ($s) => $s['code'] . ' = ' . ($s['name'][$lang] ?? $s['name']['en'] ?? reset($s['name'])))
            ->implode("\n");

        $sys = "You are Vasco, a medical routing assistant for the MedaGama platform. "
            . "You DO NOT diagnose. From the patient's complaint, choose the single best specialty CODE "
            . "from this list:\n{$list}\n"
            . "Reply ONLY as compact JSON: {\"code\":\"<CODE>\",\"follow_up\":\"<one short clarifying question or null>\",\"rationale\":\"<one short sentence in the patient's language, why this specialty — NO diagnosis>\"}. "
            . "If the complaint is too vague to choose, set code=null and provide follow_up.";

        $res = Http::timeout(15)->withToken($key)->post($base . '/chat/completions', [
            'model'       => env('VASCO_LLM_MODEL', 'llama-3.3-70b-versatile'),
            'temperature' => 0.2,
            'messages'    => [
                ['role' => 'system', 'content' => $sys],
                ['role' => 'user', 'content' => $text],
            ],
        ]);

        $content = $res->json('choices.0.message.content') ?: '';
        $json = json_decode($this->stripFences($content), true);
        if (!is_array($json)) {
            return $this->keywordExtract($text, $specialties);
        }
        return [
            'code'      => $json['code'] ?? null,
            'follow_up' => $json['follow_up'] ?? null,
            'rationale' => $json['rationale'] ?? '',
        ];
    }

    private function stripFences(string $s): string
    {
        $s = preg_replace('/^```(?:json)?/m', '', $s);
        $s = str_replace('```', '', $s);
        // Grab the first {...} block.
        if (preg_match('/\{.*\}/s', $s, $m)) {
            return $m[0];
        }
        return trim($s);
    }

    /** Keyless fallback: match the complaint against a TR/EN keyword → specialty map + specialty names. */
    private function keywordExtract(string $text, array $specialties): array
    {
        $t = mb_strtolower($text);
        $map = [
            'CARD' => ['kalp', 'göğüs ağr', 'çarpıntı', 'tansiyon', 'heart', 'chest pain', 'palpitation'],
            'DERM' => ['cilt', 'kaşıntı', 'sivilce', 'akne', 'döküntü', 'ben', 'skin', 'rash', 'acne', 'mole'],
            'DENT' => ['diş', 'dış eti', 'ağız', 'tooth', 'teeth', 'dental', 'gum'],
            'OPHT' => ['göz', 'görme', 'eye', 'vision', 'sight'],
            'ORTH' => ['kemik', 'eklem', 'diz', 'bel', 'kırık', 'bone', 'joint', 'knee', 'back pain', 'fracture'],
            'ENT'  => ['kulak', 'burun', 'boğaz', 'sinüs', 'ear', 'nose', 'throat', 'sinus'],
            'GAST' => ['mide', 'karın', 'bağırsak', 'reflü', 'bulantı', 'stomach', 'abdomen', 'reflux', 'nausea'],
            'NEUR' => ['baş ağr', 'migren', 'baş dön', 'nöbet', 'uyuşma', 'headache', 'migraine', 'dizziness', 'seizure'],
            'GYNE' => ['gebe', 'adet', 'jinekolog', 'rahim', 'pregnan', 'menstru', 'gyneco'],
            'PEDI' => ['çocuk', 'bebek', 'child', 'baby', 'infant'],
            'PSYC' => ['depres', 'anksiyete', 'stres', 'uyku', 'panik', 'depress', 'anxiety', 'stress', 'panic'],
            'PULM' => ['öksürük', 'nefes', 'astım', 'akciğer', 'cough', 'breath', 'asthma', 'lung'],
            'UROL' => ['idrar', 'böbrek', 'prostat', 'urine', 'kidney', 'prostate'],
            'ENDO' => ['tiroid', 'şeker', 'diyabet', 'hormon', 'thyroid', 'diabet', 'hormone'],
        ];
        $available = collect($specialties)->pluck('code')->all();
        foreach ($map as $code => $kws) {
            if (!in_array($code, $available, true)) {
                continue;
            }
            foreach ($kws as $kw) {
                if (mb_strpos($t, $kw) !== false) {
                    return ['code' => $code, 'follow_up' => null, 'rationale' => ''];
                }
            }
        }
        // No confident match → ask a follow-up.
        return ['code' => null, 'follow_up' => 'Şikayetinizi biraz daha açıklar mısınız? (nerede, ne zamandır, nasıl)', 'rationale' => ''];
    }

    private function retrieveDoctors(string $specialtyId, ?string $location, int $limit): array
    {
        $query = User::where('role_id', 'doctor')
            ->where('is_active', true)
            ->whereHas('doctorProfile', fn ($q) => $q->where('specialty_id', $specialtyId))
            ->with(['doctorProfile:id,user_id,specialty,specialty_id,title,experience_years,online_consultation', 'clinic:id,fullname,codename,address'])
            ->select('id', 'fullname', 'avatar', 'clinic_id', 'is_verified', 'city_id');

        if ($location) {
            $query->where(function ($q) use ($location) {
                $q->whereHas('clinic', fn ($cq) => $cq->where('address', 'like', "%{$location}%"));
            });
        }

        $doctors = $query->limit($limit * 2)->get();

        // Rank: verified first, then by review average.
        $ids = $doctors->pluck('id');
        $ratings = DoctorReview::whereIn('doctor_id', $ids)->visible()
            ->selectRaw('doctor_id, AVG(rating) as avg_rating, COUNT(*) as cnt')
            ->groupBy('doctor_id')->get()->keyBy('doctor_id');

        return $doctors
            ->map(function ($d) use ($ratings) {
                $r = $ratings->get($d->id);
                return [
                    'id'         => $d->id,
                    'fullname'   => $d->fullname,
                    'avatar'     => $d->avatar,
                    'title'      => $d->doctorProfile->title ?? null,
                    'specialty'  => $d->doctorProfile->specialty ?? null,
                    'experience' => $d->doctorProfile->experience_years ?? null,
                    'online'     => (bool) ($d->doctorProfile->online_consultation ?? false),
                    'is_verified' => (bool) $d->is_verified,
                    'clinic'     => $d->clinic ? ['fullname' => $d->clinic->fullname, 'codename' => $d->clinic->codename, 'address' => $d->clinic->address] : null,
                    'rating'     => $r ? round((float) $r->avg_rating, 1) : null,
                    'review_count' => $r ? (int) $r->cnt : 0,
                ];
            })
            ->sortByDesc(fn ($d) => ($d['is_verified'] ? 100 : 0) + ($d['rating'] ?? 0))
            ->take($limit)
            ->values()
            ->all();
    }
}
