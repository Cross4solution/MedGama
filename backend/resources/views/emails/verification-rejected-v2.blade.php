@extends('emails.layouts.medgama', [
    'locale'      => $locale,
    'subject'     => trans('email.verify_rejected_subject', [], $locale),
    'preheader'   => trans('email.verify_rejected_line1', [], $locale),
    'headerIcon'  => '📋',
    'headerTitle' => trans('email.verify_rejected_subject', [], $locale),
])

@section('content')
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;" class="text-dark">
        {{ trans('email.verify_rejected_greeting', ['name' => $userName], $locale) }}
    </h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.7;" class="text-muted">
        {{ trans('email.verify_rejected_line1', [], $locale) }}
    </p>

    <!-- Document Info -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef2f2;border-radius:12px;overflow:hidden;margin-bottom:24px;" class="info-table">
        @include('emails.layouts.info-row', [
            'label' => trans('email.verify_rejected_label', [], $locale),
            'value' => $documentLabel,
        ])
        @if(!empty($rejectionReason))
        @include('emails.layouts.info-row', [
            'label' => trans('email.verify_rejected_reason', [], $locale),
            'value' => $rejectionReason,
        ])
        @endif
    </table>

    <p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.7;" class="text-dark">
        {{ trans('email.verify_rejected_resubmit', [], $locale) }}
    </p>

    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;" class="text-muted">
        {{ trans('email.verify_rejected_help', [], $locale) }}
    </p>
@endsection

@section('actionUrl', $actionUrl ?? config('app.frontend_url', 'https://medgama.com') . '/crm/settings')
@section('actionText', trans('email.verify_rejected_cta', [], $locale))
