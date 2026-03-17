@extends('emails.layouts.medgama', [
    'locale'      => $locale,
    'subject'     => trans('email.appt_reminder_subject', ['time' => $timeLabel], $locale),
    'preheader'   => $isDoctor
        ? trans('email.appt_reminder_line1_doctor', ['time' => $timeLabel], $locale)
        : trans('email.appt_reminder_line1', ['time' => $timeLabel], $locale),
    'headerIcon'  => '⏰',
    'headerTitle' => trans('email.appt_reminder_subject', ['time' => $timeLabel], $locale),
])

@section('content')
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;" class="text-dark">
        {{ trans('email.appt_reminder_greeting', ['name' => $isDoctor ? 'Dr. ' . $userName : $userName], $locale) }}
    </h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.7;" class="text-muted">
        {{ $isDoctor
            ? trans('email.appt_reminder_line1_doctor', ['time' => $timeLabel], $locale)
            : trans('email.appt_reminder_line1', ['time' => $timeLabel], $locale) }}
    </p>

    <!-- Appointment Details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fffbeb;border-radius:12px;overflow:hidden;margin-bottom:24px;" class="info-table">
        @include('emails.layouts.info-row', [
            'label' => trans($isDoctor ? 'email.appt_booked_label_patient' : 'email.appt_booked_label_doctor', [], $locale),
            'value' => $counterpartName,
        ])
        @include('emails.layouts.info-row', [
            'label' => trans('email.appt_booked_label_date', [], $locale),
            'value' => $date,
        ])
        @include('emails.layouts.info-row', [
            'label' => trans('email.appt_booked_label_time', [], $locale),
            'value' => $time,
        ])
        @include('emails.layouts.info-row', [
            'label' => trans('email.appt_booked_label_type', [], $locale),
            'value' => ucfirst($type),
        ])
    </table>

    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;" class="text-muted">
        {{ $isOnline
            ? trans('email.appt_reminder_online_tip', [], $locale)
            : trans('email.appt_reminder_inperson_tip', [], $locale) }}
    </p>
@endsection

@section('actionUrl', $actionUrl)
@section('actionText', !empty($videoLink)
    ? trans('email.appt_confirmed_join', [], $locale)
    : trans('email.appt_booked_cta', [], $locale))
