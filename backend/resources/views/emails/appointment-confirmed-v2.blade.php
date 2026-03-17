@extends('emails.layouts.medgama', [
    'locale'      => $locale,
    'subject'     => trans('email.appt_confirmed_subject', [], $locale),
    'preheader'   => trans('email.appt_confirmed_line1', [], $locale),
    'headerIcon'  => '✅',
    'headerTitle' => trans('email.appt_confirmed_subject', [], $locale),
])

@section('content')
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;" class="text-dark">
        {{ trans('email.appt_confirmed_greeting', ['name' => $userName], $locale) }}
    </h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.7;" class="text-muted">
        {{ trans('email.appt_confirmed_line1', [], $locale) }}
    </p>

    <!-- Appointment Details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ecfdf5;border-radius:12px;overflow:hidden;margin-bottom:24px;" class="info-table">
        @include('emails.layouts.info-row', [
            'label' => trans('email.appt_booked_label_doctor', [], $locale),
            'value' => $doctorName,
        ])
        @include('emails.layouts.info-row', [
            'label' => trans('email.appt_booked_label_date', [], $locale),
            'value' => $date,
        ])
        @include('emails.layouts.info-row', [
            'label' => trans('email.appt_booked_label_time', [], $locale),
            'value' => $time,
        ])
        @if(!empty($videoLink))
        <tr>
            <td style="padding:8px 16px;font-size:12px;color:#6b7280;width:35%;vertical-align:top;border-bottom:1px solid #f3f4f6;">{{ trans('email.appt_confirmed_join', [], $locale) }}</td>
            <td style="padding:8px 16px;font-size:14px;font-weight:600;border-bottom:1px solid #f3f4f6;">
                <a href="{{ $videoLink }}" style="color:#0d9488;text-decoration:none;">{{ trans('email.appt_confirmed_join', [], $locale) }} →</a>
            </td>
        </tr>
        @endif
    </table>

    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;" class="text-muted">
        {{ trans('email.appt_confirmed_available', [], $locale) }}
    </p>
@endsection

@section('actionUrl', $actionUrl)
@section('actionText', !empty($videoLink) ? trans('email.appt_confirmed_join', [], $locale) : trans('email.appt_confirmed_cta', [], $locale))
