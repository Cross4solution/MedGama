<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class CalendarFeedController extends Controller
{
    /**
     * GET /api/calendar/feed/{token} — PUBLIC private ICS subscription feed.
     * Calendar apps (Google/Apple/Outlook) poll this URL; appointments appear and
     * update automatically. Token is a long secret (revocable). No login.
     */
    public function feed(string $token): Response
    {
        $user = User::where('calendar_token', $token)->first();

        if (!$user) {
            return response("BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR\r\n", 404)
                ->header('Content-Type', 'text/calendar; charset=utf-8');
        }

        $appointments = Appointment::with(['doctor:id,fullname', 'patient:id,fullname', 'clinic:id,fullname,address'])
            ->where(fn ($q) => $q->where('doctor_id', $user->id)->orWhere('patient_id', $user->id))
            ->whereNotNull('appointment_date')
            ->where('appointment_date', '>=', now()->subDays(30)->toDateString())
            ->orderBy('appointment_date')
            ->limit(500)
            ->get();

        $ics = $this->buildCalendar($user, $appointments);

        return response($ics, 200)
            ->header('Content-Type', 'text/calendar; charset=utf-8')
            ->header('Content-Disposition', 'inline; filename="medagama.ics"')
            ->header('Cache-Control', 'private, max-age=300');
    }

    /** GET /api/calendar/feed — return the current user's subscription URLs. */
    public function info(Request $request): JsonResponse
    {
        $token = $request->user()->getOrCreateCalendarToken();
        return response()->json($this->urls($token));
    }

    /** POST /api/calendar/feed/regenerate — rotate the secret token. */
    public function regenerate(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->calendar_token = null;
        $token = $user->getOrCreateCalendarToken();
        return response()->json($this->urls($token));
    }

    private function urls(string $token): array
    {
        $base = rtrim(config('app.url'), '/');
        $path = "/api/calendar/feed/{$token}";
        $https = $base . $path;
        return [
            'token'     => $token,
            'url'       => $https,
            'webcal'    => preg_replace('#^https?://#', 'webcal://', $https),
            'google'    => 'https://calendar.google.com/calendar/r/settings/addbyurl?cid=' . urlencode($https),
        ];
    }

    private function buildCalendar(User $user, $appointments): string
    {
        $esc = fn ($s) => str_replace(["\\", ",", ";", "\n"], ["\\\\", "\\,", "\\;", "\\n"], (string) $s);
        $lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//MedaGama//Calendar//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'X-WR-CALNAME:MedaGama',
        ];

        foreach ($appointments as $a) {
            $date = optional($a->appointment_date)->format('Ymd') ?: \Illuminate\Support\Carbon::parse($a->appointment_date)->format('Ymd');
            $time = str_replace(':', '', substr((string) ($a->appointment_time ?: '00:00'), 0, 5)) . '00';
            $start = $date . 'T' . $time;
            $end = \Illuminate\Support\Carbon::createFromFormat('Ymd\THis', $start)->addMinutes(30)->format('Ymd\THis');

            $isDoctor = $a->doctor_id === $user->id;
            $other = $isDoctor ? ($a->patient->fullname ?? 'Hasta') : ($a->doctor->fullname ?? 'Doktor');
            $type = $a->appointment_type === 'online' ? 'Online' : 'Klinik';
            $summary = 'MedaGama: ' . $other . ' (' . $type . ')';
            $location = $a->appointment_type === 'online'
                ? 'Online'
                : ($a->clinic->address ?? $a->clinic->fullname ?? '');
            $status = $a->status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED';

            $lines[] = 'BEGIN:VEVENT';
            $lines[] = 'UID:' . $a->id . '@medagama';
            $lines[] = 'DTSTART:' . $start;
            $lines[] = 'DTEND:' . $end;
            $lines[] = 'SUMMARY:' . $esc($summary);
            if ($location) {
                $lines[] = 'LOCATION:' . $esc($location);
            }
            $lines[] = 'STATUS:' . $status;
            $lines[] = 'END:VEVENT';
        }

        $lines[] = 'END:VCALENDAR';
        return implode("\r\n", $lines) . "\r\n";
    }
}
