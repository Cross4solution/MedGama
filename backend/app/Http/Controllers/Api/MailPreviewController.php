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
                    // Konu gerçek gönderimdekinin aynısı — etiket, damga yok.
                    // Yan etkisi: aynı şablon ikinci kez gönderilince Gmail
                    // onu öncekinin altına iliştirir ve gövdeyi gizler.
                    Mail::send($veri['view'], $veri['data'], function ($m) use ($alici, $veri) {
                        $m->to($alici)->subject($veri['subject']);

                        // Gmail aynı konulu postaları tek başlıkta topluyor ve
                        // sonrakilerin gövdesini "tekrar eden metin" sayıp
                        // gizliyor — örnekler incelenemez hale geliyor.
                        // X-Entity-Ref-ID her iletiyi ayrı bir konuşma yapar;
                        // konu ve gövde olduğu gibi kalır.
                        $m->getHeaders()->addTextHeader('X-Entity-Ref-ID', bin2hex(random_bytes(8)));
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
            // Bağlantılar buradan kuruluyor; localhost görünüyorsa canlıda
            // FRONTEND_URL tanımsız demektir ve e-postadaki her bağlantı kırıktır.
            'site_url'  => config('app.frontend_url'),
            'sablon_sayisi' => count($ornekler),
            // Gönderilen konu satırları: dolmamış bir yer tutucu ya da eski
            // bir sürümün canlıda kaldığı buradan görülür.
            'konular'   => array_map(fn ($v) => $v['subject'], $ornekler),
            'sonuc'     => $sonuc,
        ]);
    }

    private function ornekler(string $dil): array
    {
        $site = rtrim((string) config('app.frontend_url'), '/');
        $ortak = ['locale' => $dil];

        $t = fn (string $k, array $r = []) => trans("email.$k", $r, $dil);

        $tr = $dil === 'tr';
        $hasta   = 'Sarah Whitfield';
        $doktor  = 'Dr. Elif Yılmaz';
        $tarih   = $tr ? '12 Eylül 2026' : '12 September 2026';
        $not     = $tr ? 'Kontrol muayenesi.' : 'Follow-up examination.';
        $iptalSebep = $tr ? 'Doktorun programında acil değişiklik.' : 'An urgent change in the doctor\'s schedule.';
        $redSebep   = $tr ? 'Belgenin tarih alanı okunamıyor.' : 'The date on the document is not legible.';
        $talepKonu  = $tr ? 'Faturamı indiremiyorum' : 'I cannot download my invoice';
        $talepYanit = $tr ? 'Sorunu tespit ettik, fatura indirme bağlantısı yenilendi.' : 'We found the problem and refreshed your invoice download link.';
        $belgeAdi   = $tr ? 'Diploma' : 'Medical diploma';
        $ekBelgeNot = $tr ? 'Diplomanızın arka yüzünü de yükler misiniz?' : 'Could you also upload the reverse side of your diploma?';
        $yorum      = $tr ? 'Çok ilgili bir doktor, her sorumu sabırla yanıtladı.' : 'A very attentive doctor who answered every question patiently.';
        $yorumYanit = $tr ? 'Güzel sözleriniz için teşekkür ederim, geçmiş olsun.' : 'Thank you for your kind words — I wish you a swift recovery.';
        $saat       = $tr ? '1 saat' : '1 hour';

        return [
            'sifre-sifirlama' => [
                'view' => 'emails.password-reset',
                'subject' => $t('pwd_reset_subject'),
                'data' => $ortak + ['code' => '482913', 'name' => $hasta],
            ],
            'dogrulama-kodu' => [
                'view' => 'emails.verification-code',
                'subject' => $t('verify_code_subject'),
                'data' => $ortak + ['code' => '739154', 'name' => $hasta],
            ],
            'hosgeldin' => [
                'view' => 'emails.welcome',
                'subject' => $t('welcome_subject'),
                'data' => $ortak + [
                    'userName' => $hasta,
                    'isDoctor' => false,
                    'actionUrl' => $site . '/medstream',
                ],
            ],
            'randevu-olusturuldu' => [
                'view' => 'emails.appointment-booked-v2',
                'subject' => $t('appt_booked_subject', ['date' => $tarih]),
                'data' => $ortak + [
                    'isDoctor' => false,
                    'userName' => $hasta,
                    'counterpartName' => $doktor,
                    'date' => $tarih,
                    'time' => '14:30',
                    'type' => 'online',
                    'patientNote' => $not,
                    'actionUrl' => $site . '/telehealth',
                ],
            ],
            'randevu-onaylandi' => [
                'view' => 'emails.appointment-confirmed-v2',
                'subject' => $t('appt_confirmed_subject'),
                'data' => $ortak + [
                    'userName' => $hasta,
                    'doctorName' => $doktor,
                    'date' => $tarih,
                    'time' => '14:30',
                    'type' => 'online',
                    'actionUrl' => $site . '/telehealth',
                ],
            ],
            'randevu-hatirlatma' => [
                'view' => 'emails.appointment-reminder-v2',
                'subject' => $t('appt_reminder_subject', ['time' => $saat]),
                'data' => $ortak + [
                    'isDoctor' => false,
                    'userName' => $hasta,
                    'counterpartName' => $doktor,
                    'date' => $tarih,
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
                    'userName' => $hasta,
                    'counterpartName' => $doktor,
                    'cancelledBy' => 'doctor',
                    'date' => $tarih,
                    'time' => '14:30',
                    'reason' => $iptalSebep,
                    'actionUrl' => $site . '/telehealth-appointment',
                ],
            ],
            'dogrulama-onaylandi' => [
                'view' => 'emails.verification-approved-v2',
                'subject' => $t('verify_approved_subject'),
                'data' => $ortak + [
                    'userName' => $doktor,
                    'documentLabel' => $belgeAdi,
                    'actionUrl' => $site . '/crm',
                ],
            ],
            'dogrulama-reddedildi' => [
                'view' => 'emails.verification-rejected-v2',
                'subject' => $t('verify_rejected_subject'),
                'data' => $ortak + [
                    'userName' => $doktor,
                    'documentLabel' => $belgeAdi,
                    'reason' => $redSebep,
                    'actionUrl' => $site . '/crm/settings?tab=verification',
                ],
            ],
            'destek-talebi-alindi' => [
                'view' => 'emails.ticket-received-v2',
                'subject' => $t('ticket_received_subject', ['number' => 'TKT-2026-0184']),
                'data' => $ortak + [
                    'userName' => $hasta,
                    'ticketNumber' => 'TKT-2026-0184',
                    'ticketSubject' => $talepKonu,
                    'ticketPriority' => 'high',
                    'actionUrl' => $site . '/crm/support',
                ],
            ],
            'destek-talebi-yanit' => [
                'view' => 'emails.ticket-reply-v2',
                'subject' => $t('ticket_reply_subject', ['number' => 'TKT-2026-0184']),
                'data' => $ortak + [
                    'userName' => $hasta,
                    'ticketNumber' => 'TKT-2026-0184',
                    'ticketSubject' => $talepKonu,
                    'replyPreview' => $talepYanit,
                    'actionUrl' => $site . '/crm/support',
                ],
            ],
            'yeni-yorum' => [
                'view' => 'emails.generic',
                'subject' => $t('new_review_subject'),
                'data' => $ortak + [
                    'subject' => $t('new_review_subject'),
                    'headerTitle' => $t('new_review_header'),
                    'headerIcon' => 'star',
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
                    'headerIcon' => 'star',
                    'intro' => $t('review_response_intro', ['doctor' => 'Elif Yılmaz']),
                    'quote' => 'Nazik yorumunuz için teşekkür ederim, geçmiş olsun.',
                    'outro' => $t('review_response_outro'),
                    'actionUrl' => $site . '/doctor/ornek',
                    'actionLabel' => $t('review_response_action'),
                ],
            ],
            'yonetici-yeni-talep' => [
                'view' => 'emails.generic',
                'subject' => $t('ticket_admin_subject', ['number' => 'TKT-2026-0184']),
                'data' => $ortak + [
                    'subject' => $t('ticket_admin_subject', ['number' => 'TKT-2026-0184']),
                    'headerTitle' => $t('ticket_admin_header'),
                    'headerIcon' => 'chat',
                    'intro' => $t('ticket_admin_intro'),
                    'rows' => [
                        $t('row_ticket') => 'TKT-2026-0184',
                        $t('row_subject') => $talepKonu,
                        $t('row_from') => 'Ayşe K. <ayse@ornek.test>',
                        $t('row_priority') => 'High',
                    ],
                    'outro' => $t('ticket_admin_outro'),
                    'actionUrl' => $site . '/admin/support',
                    'actionLabel' => $t('ticket_admin_action'),
                ],
            ],
            'gorusme-basliyor' => [
                'view' => 'emails.generic',
                'subject' => $t('call_starting_subject'),
                'data' => $ortak + [
                    'subject' => $t('call_starting_subject'),
                    'headerTitle' => $t('call_starting_header'),
                    'headerIcon' => 'video',
                    'intro' => $t('call_starting_intro', ['name' => $doktor]),
                    'rows' => [
                        $t('row_time') => '14:30',
                        $t('row_timezone') => 'Europe/Istanbul',
                    ],
                    'outro' => $t('call_starting_outro'),
                    'actionUrl' => $site . '/telehealth',
                    'actionLabel' => $t('call_starting_action'),
                ],
            ],
            'sifre-degistirildi' => [
                'view' => 'emails.generic',
                'subject' => $t('pwd_changed_subject'),
                'data' => $ortak + [
                    'subject' => $t('pwd_changed_subject'),
                    'headerTitle' => $t('pwd_changed_header'),
                    'headerIcon' => 'lock',
                    'intro' => $t('pwd_changed_intro'),
                    'rows' => [
                        $t('row_when') => '17.08.2026 19:42 UTC',
                        $t('row_ip') => '88.243.10.7',
                        $t('row_device') => 'Chrome · macOS',
                    ],
                    'outro' => $t('pwd_changed_outro'),
                    'actionUrl' => $site . '/forgot-password',
                    'actionLabel' => $t('pwd_changed_action'),
                ],
            ],
            'randevu-saati-degisti' => [
                'view' => 'emails.generic',
                'subject' => $t('appt_moved_subject'),
                'data' => $ortak + [
                    'subject' => $t('appt_moved_subject'),
                    'headerTitle' => $t('appt_moved_header'),
                    'headerIcon' => 'calendar',
                    'intro' => $t('appt_moved_intro', ['name' => $doktor]),
                    'rows' => [
                        $t('row_old_time') => '12.09.2026 · 14:30',
                        $t('row_new_time') => '14.09.2026 · 11:00',
                        $t('row_timezone') => 'Europe/Istanbul',
                    ],
                    'outro' => $t('appt_moved_outro'),
                    'actionUrl' => $site . '/patient/appointments',
                    'actionLabel' => $t('appt_moved_action'),
                ],
            ],
            'fatura-kesildi' => [
                'view' => 'emails.generic',
                'subject' => $t('invoice_subject', ['number' => 'INV-2026-0341']),
                'data' => $ortak + [
                    'subject' => $t('invoice_subject', ['number' => 'INV-2026-0341']),
                    'headerTitle' => $t('invoice_header'),
                    'headerIcon' => 'receipt',
                    'intro' => $t('invoice_intro', ['amount' => '1.250,00 EUR']),
                    'rows' => [
                        $t('row_invoice_no') => 'INV-2026-0341',
                        $t('row_amount') => '1.250,00 EUR',
                        $t('row_issued') => '17.08.2026',
                        $t('row_due') => '31.08.2026',
                    ],
                    'outro' => $t('invoice_outro'),
                    'actionUrl' => $site . '/patient/invoices',
                    'actionLabel' => $t('invoice_action'),
                ],
            ],
            'ek-belge-istendi' => [
                'view' => 'emails.generic',
                'subject' => $t('verify_info_subject'),
                'data' => $ortak + [
                    'subject' => $t('verify_info_subject'),
                    'headerTitle' => $t('verify_info_header'),
                    'headerIcon' => 'document',
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
