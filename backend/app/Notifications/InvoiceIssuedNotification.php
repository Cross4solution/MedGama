<?php

namespace App\Notifications;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Fatura kesildiğinde hastaya gider.
 *
 * PDF eklenmez: fatura hastanın adını, aldığı hizmeti ve tutarı taşıyor.
 * Bu, e-posta kutusunda şifresiz duran bir sağlık kaydı demek. Bunun
 * yerine kimlik doğrulamalı indirme bağlantısı verilir.
 */
class InvoiceIssuedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Invoice $invoice) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $locale = $notifiable->preferred_language ?? 'en';
        $fatura = $this->invoice;
        $tutar  = number_format((float) $fatura->grand_total, 2) . ' ' . $fatura->currency;

        $rows = [
            trans('email.row_invoice_no', [], $locale) => $fatura->invoice_number,
            trans('email.row_amount', [], $locale)     => $tutar,
        ];
        if ($fatura->issue_date) {
            $rows[trans('email.row_issued', [], $locale)] = $fatura->issue_date instanceof \DateTimeInterface
                ? $fatura->issue_date->format('d.m.Y')
                : (string) $fatura->issue_date;
        }
        if ($fatura->due_date) {
            $rows[trans('email.row_due', [], $locale)] = $fatura->due_date instanceof \DateTimeInterface
                ? $fatura->due_date->format('d.m.Y')
                : (string) $fatura->due_date;
        }

        return (new MailMessage)
            ->subject(trans('email.invoice_subject', ['number' => $fatura->invoice_number], $locale))
            ->view('emails.generic', [
                'locale'      => $locale,
                'subject'     => trans('email.invoice_subject', ['number' => $fatura->invoice_number], $locale),
                'headerTitle' => trans('email.invoice_header', [], $locale),
                'intro'       => trans('email.invoice_intro', ['amount' => $tutar], $locale),
                'rows'        => $rows,
                'outro'       => trans('email.invoice_outro', [], $locale),
                'actionUrl'   => config('app.frontend_url') . '/billing/' . $fatura->id,
                'actionLabel' => trans('email.invoice_action', [], $locale),
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'           => 'invoice_issued',
            'invoice_id'     => $this->invoice->id,
            'invoice_number' => $this->invoice->invoice_number,
            'title'          => 'Invoice issued',
            'message'        => 'Invoice ' . $this->invoice->invoice_number . ' has been issued.',
            'amount'         => $this->invoice->grand_total,
            'currency'       => $this->invoice->currency,
            'link'           => '/billing/' . $this->invoice->id,
        ];
    }
}
