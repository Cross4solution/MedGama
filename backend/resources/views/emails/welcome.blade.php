@extends('emails.layouts.medgama', [
    'locale'      => $locale,
    'subject'     => trans('email.welcome_subject', [], $locale),
    'preheader'   => trans('email.welcome_line1', [], $locale),
    'headerIcon'  => '👋',
    'headerTitle' => trans('email.welcome_subject', [], $locale),
])

@section('content')
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;" class="text-dark">
        {{ trans('email.welcome_greeting', ['name' => $userName], $locale) }}
    </h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.7;" class="text-muted">
        {{ trans('email.welcome_line1', [], $locale) }}
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.7;" class="text-dark">
        {{ $isDoctor ? trans('email.welcome_line2_doctor', [], $locale) : trans('email.welcome_line2_patient', [], $locale) }}
    </p>

    <!-- Features -->
    <div style="background-color:#f0fdfa;border-radius:12px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #0d9488;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#0d9488;text-transform:uppercase;letter-spacing:0.5px;">
            {{ trans('email.welcome_features_title', [], $locale) }}
        </p>
        @php
            $suffix = $isDoctor ? 'doctor' : 'patient';
            $features = [
                trans("email.welcome_f1_{$suffix}", [], $locale),
                trans("email.welcome_f2_{$suffix}", [], $locale),
                trans("email.welcome_f3_{$suffix}", [], $locale),
            ];
        @endphp
        @foreach($features as $feature)
        <p style="margin:0 0 8px;font-size:14px;color:#374151;line-height:1.5;padding-left:8px;">
            <span style="color:#0d9488;font-weight:700;">✓</span>&nbsp; {{ $feature }}
        </p>
        @endforeach
    </div>

    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;" class="text-muted">
        {{ trans('email.welcome_footer', [], $locale) }}
    </p>
@endsection

@section('actionUrl', $actionUrl ?? config('app.frontend_url', 'https://medgama.com'))
@section('actionText', trans('email.welcome_cta', [], $locale))
