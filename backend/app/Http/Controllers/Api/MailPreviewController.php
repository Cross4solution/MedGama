<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

/**
 * Her e-posta şablonundan birer örnek gönderir — tasarımı gerçek posta
 * kutusunda görebilmek için.
 *
 * GEÇİCİ: teslimden önce bu denetleyici ve rotası kaldırılacak. Anahtar
 * INIT_DB_KEY ile aynı, alıcı listesi de sabit değil çünkü tasarımı kimin
 * inceleyeceği değişebiliyor.
 */
class MailPreviewController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        if ($request->query('key') !== config('app.init_db_key')) {
            return response()->json(['error' => 'unauthorized'], 403);
        }

        $aliciListesi = array_filter(array_map('trim', explode(',', (string) $request->query('to'))));
        if (!$aliciListesi) {
            return response()->json(['error' => 'to parametresi gerekli'], 422);
        }

        $dil = $request->query('locale', 'tr');
        $ornekler = $this->ornekler($dil);
        $sonuc = [];

        foreach ($aliciListesi as $alici) {
            foreach ($ornekler as $ad => $veri) {
                try {
                    Mail::send($veri['view'], $veri['data'], function ($m) use ($alici, $veri, $ad) {
                        $m->to($alici)->subject('[ÖRNEK ' . $ad . '] ' . $veri['subject']);
                    });
                    $sonuc[$alici][$ad] = 'gonderildi';
                } catch (\Throwable $e) {
                    $sonuc[$alici][$ad] = 'HATA: ' . $e->getMessage();
                }
            }
        }

        return response()->json([
            'locale'    => $dil,
            'mailer'    => config('mail.default'),
            'from'      => config('mail.from.address'),
            'sablon_sayisi' => count($ornekler),
            'sonuc'     => $sonuc,
        ]);
    }

    private function ornekler(string $dil): array
    {
        $site = rtrim((string) config('app.frontend_url'), '/');
        $ortak = ['locale' => $dil];

        $t = fn (string $k, array $r = []) => trans("email.$k", $r, $dil);

        return [
            'sifre-sifirlama' => [
                'view' => 'emails.password-reset',
                'subject' => $t('pwd_reset_subject'),
                'data' => $ortak + ['code' => '482913', 'name' => 'Oğuzhan Özcan'],
            ],
            'dogrulama-kodu' => [
                'view' => 'emails.verification-code',
                'subject' => $t('verify_code_subject'),
                'data' => $ortak + ['code' => '739154', 'name' => 'Oğuzhan Özcan'],
            ],
            'hosgeldin' => [
                'view' => 'emails.welcome',
                'subject' => $t('welcome_subject'),
                'data' => $ortak + [
                    'userName' => 'Oğuzhan Özcan',
                    'isDoctor' => false,
                    'actionUrl' => $site . '/medstream',
                ],
            ],
            'randevu-olusturuldu' => [
                'view' => 'emails.appointment-booked-v2',
                'subject' => $t('appt_booked_subject', ['date' => '12 Eylül 2026']),
                'data' => $ortak + [
                    'isDoctor' => false,
                    'userName' => 'Oğuzhan Özcan',
                    'counterpartName' => 'Dr. Elif Yılmaz',
                    'date' => '12 Eylül 2026',
                    'time' => '14:30',
                    'type' => 'online',
                    'patientNote' => 'Kontrol muayenesi.',
                    'actionUrl' => $site . '/telehealth',
                ],
            ],
            'randevu-onaylandi' => [
                'view' => 'emails.appointment-confirmed-v2',
                'subject' => $t('appt_confirmed_subject'),
                'data' => $ortak + [
                    'userName' => 'Oğuzhan Özcan',
                    'doctorName' => 'Dr. Elif Yılmaz',
                    'date' => '12 Eylül 2026',
                    'time' => '14:30',
                    'type' => 'online',
                    'actionUrl' => $site . '/telehealth',
                ],
            ],
            'randevu-hatirlatma' => [
                'view' => 'emails.appointment-reminder-v2',
                'subject' => $t('appt_reminder_subject'),
                'data' => $ortak + [
                    'isDoctor' => false,
                    'userName' => 'Oğuzhan Özcan',
                    'counterpartName' => 'Dr. Elif Yılmaz',
                    'date' => '12 Eylül 2026',
                    'time' => '14:30',
                    'timeLabel' => '14:30 (Europe/Istanbul)',
                    'isOnline' => true,
                    'type' => 'online',
                    'actionUrl' => $site . '/telehealth',
                ],
            ],
            'randevu-iptal' => [
                'view' => 'emails.appointment-cancelled-v2',
                'subject' => $t('appt_cancelled_subject'),
                'data' => $ortak + [
                    'isDoctor' => false,
                    'userName' => 'Oğuzhan Özcan',
                    'counterpartName' => 'Dr. Elif Yılmaz',
                    'cancelledBy' => 'doctor',
                    'date' => '12 Eylül 2026',
                    'time' => '14:30',
                    'reason' => 'Doktorun programında acil değişiklik.',
                    'actionUrl' => $site . '/doctors',
                ],
            ],
            'dogrulama-onaylandi' => [
                'view' => 'emails.verification-approved-v2',
                'subject' => $t('verify_approved_subject'),
                'data' => $ortak + [
                    'userName' => 'Dr. Elif Yılmaz',
                    'documentLabel' => 'Diploma',
                    'actionUrl' => $site . '/crm',
                ],
            ],
            'dogrulama-reddedildi' => [
                'view' => 'emails.verification-rejected-v2',
                'subject' => $t('verify_rejected_subject'),
                'data' => $ortak + [
                    'userName' => 'Dr. Elif Yılmaz',
                    'documentLabel' => 'Diploma',
                    'reason' => 'Belgenin tarih alanı okunamıyor.',
                    'actionUrl' => $site . '/crm/settings?tab=verification',
                ],
            ],
            'destek-talebi-alindi' => [
                'view' => 'emails.ticket-received-v2',
                'subject' => $t('ticket_received_subject'),
                'data' => $ortak + [
                    'userName' => 'Oğuzhan Özcan',
                    'ticketNumber' => 'TKT-2026-0184',
                    'ticketSubject' => 'Faturamı indiremiyorum',
                    'ticketPriority' => 'high',
                    'actionUrl' => $site . '/support',
                ],
            ],
            'destek-talebi-yanit' => [
                'view' => 'emails.ticket-reply-v2',
                'subject' => $t('ticket_reply_subject'),
                'data' => $ortak + [
                    'userName' => 'Oğuzhan Özcan',
                    'ticketNumber' => 'TKT-2026-0184',
                    'ticketSubject' => 'Faturamı indiremiyorum',
                    'replyPreview' => 'Sorunu tespit ettik, fatura indirme bağlantısı yenilendi.',
                    'actionUrl' => $site . '/support',
                ],
            ],
            'yeni-yorum' => [
                'view' => 'emails.generic',
                'subject' => $t('new_review_subject'),
                'data' => $ortak + [
                    'subject' => $t('new_review_subject'),
                    'headerTitle' => $t('new_review_header'),
                    'intro' => $t('new_review_intro', ['name' => 'Ayşe K.', 'rating' => 5]),
                    'quote' => 'Doktor çok ilgiliydi, görüşme tam saatinde başladı.',
                    'outro' => $t('new_review_outro'),
                    'actionUrl' => $site . '/crm/reviews',
                    'actionLabel' => $t('new_review_action'),
                ],
            ],
            'yoruma-yanit' => [
                'view' => 'emails.generic',
                'subject' => $t('review_response_subject'),
                'data' => $ortak + [
                    'subject' => $t('review_response_subject'),
                    'headerTitle' => $t('review_response_header'),
                    'intro' => $t('review_response_intro', ['doctor' => 'Elif Yılmaz']),
                    'quote' => 'Nazik yorumunuz için teşekkür ederim, geçmiş olsun.',
                    'outro' => $t('review_response_outro'),
                    'actionUrl' => $site . '/doctors/ornek',
                    'actionLabel' => $t('review_response_action'),
                ],
            ],
            'yonetici-yeni-talep' => [
                'view' => 'emails.generic',
                'subject' => $t('ticket_admin_subject', ['number' => 'TKT-2026-0184']),
                'data' => $ortak + [
                    'subject' => $t('ticket_admin_subject', ['number' => 'TKT-2026-0184']),
                    'headerTitle' => $t('ticket_admin_header'),
                    'intro' => $t('ticket_admin_intro'),
                    'rows' => [
                        $t('row_ticket') => 'TKT-2026-0184',
                        $t('row_subject') => 'Faturamı indiremiyorum',
                        $t('row_from') => 'Ayşe K. <ayse@ornek.test>',
                        $t('row_priority') => 'High',
                    ],
                    'outro' => $t('ticket_admin_outro'),
                    'actionUrl' => $site . '/admin/support',
                    'actionLabel' => $t('ticket_admin_action'),
                ],
            ],
            'ek-belge-istendi' => [
                'view' => 'emails.generic',
                'subject' => $t('verify_info_subject'),
                'data' => $ortak + [
                    'subject' => $t('verify_info_subject'),
                    'headerTitle' => $t('verify_info_header'),
                    'intro' => $t('verify_info_intro'),
                    'quote' => 'Diplomanın arka yüzünü de yükler misiniz?',
                    'outro' => $t('verify_info_outro'),
                    'actionUrl' => $site . '/crm/settings?tab=verification',
                    'actionLabel' => $t('verify_info_action'),
                ],
            ],
        ];
    }
}
