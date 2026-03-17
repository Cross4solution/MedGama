@extends('emails.layouts.medgama', [
    'locale'      => $locale,
    'subject'     => trans('email.verify_approved_subject', [], $locale),
    'preheader'   => trans('email.verify_approved_line1', [], $locale),
    'headerIcon'  => '🏅',
    'headerTitle' => trans('email.verify_approved_subject', [], $locale),
])

@section('content')
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;" class="text-dark">
        {{ trans('email.verify_approved_greeting', ['name' => $userName], $locale) }}
    </h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.7;" class="text-muted">
        {{ trans('email.verify_approved_line1', [], $locale) }}
    </p>

    <!-- Document Info -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ecfdf5;border-radius:12px;overflow:hidden;margin-bottom:24px;" class="info-table">
        @include('emails.layouts.info-row', [
            'label' => trans('email.verify_approved_label', [], $locale),
            'value' => $documentLabel,
        ])
    </table>

    <!-- Badge notice -->
    <div style="background:linear-gradient(135deg,#f0fdfa,#ecfdf5);border-radius:12px;padding:16px 20px;margin-bottom:24px;border-left:4px solid #0d9488;">
        <p style="margin:0;font-size:14px;color:#065f46;line-height:1.6;font-weight:500;">
            ✅ {{ trans('email.verify_approved_badge', [], $locale) }}
        </p>
    </div>

    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;" class="text-muted">
        {{ trans('email.verify_approved_thanks', [], $locale) }}
    </p>
@endsection

@section('actionUrl', $actionUrl ?? config('app.frontend_url', 'https://medgama.com') . '/crm')
@section('actionText', trans('email.verify_approved_cta', [], $locale))
