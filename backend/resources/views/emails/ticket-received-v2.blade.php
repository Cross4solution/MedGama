@extends('emails.layouts.medgama', [
    'locale'      => $locale,
    'subject'     => trans('email.ticket_received_subject', ['number' => $ticketNumber], $locale),
    'preheader'   => trans('email.ticket_received_line1', ['number' => $ticketNumber], $locale),
    'headerIcon'  => '🎫',
    'headerTitle' => trans('email.ticket_received_subject', ['number' => $ticketNumber], $locale),
])

@section('content')
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;" class="text-dark">
        {{ trans('email.ticket_received_greeting', ['name' => $userName], $locale) }}
    </h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.7;" class="text-muted">
        {{ trans('email.ticket_received_line1', ['number' => $ticketNumber], $locale) }}
    </p>

    <!-- Ticket Details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f9ff;border-radius:12px;overflow:hidden;margin-bottom:24px;" class="info-table">
        @include('emails.layouts.info-row', [
            'label' => trans('email.ticket_received_label_subject', [], $locale),
            'value' => $ticketSubject,
        ])
        @include('emails.layouts.info-row', [
            'label' => trans('email.ticket_received_label_priority', [], $locale),
            'value' => ucfirst($ticketPriority),
        ])
    </table>

    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;" class="text-muted">
        {{ trans('email.ticket_received_thanks', [], $locale) }}
    </p>
@endsection

@section('actionUrl', $actionUrl ?? config('app.frontend_url', 'https://medgama.com') . '/crm/support')
@section('actionText', trans('email.ticket_received_cta', [], $locale))
