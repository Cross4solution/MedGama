@extends('emails.layouts.medgama', [
    'locale'      => $locale,
    'subject'     => trans('email.appt_cancelled_subject', [], $locale),
    'preheader'   => $isDoctor
        ? trans('email.appt_cancelled_line1_doctor', [], $locale)
        : trans('email.appt_cancelled_line1', [], $locale),
    'headerIcon'  => '❌',
    'headerTitle' => trans('email.appt_cancelled_subject', [], $locale),
])

@section('content')
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;" class="text-dark">
        {{ trans('email.appt_cancelled_greeting', ['name' => $isDoctor ? 'Dr. ' . $userName : $userName], $locale) }}
    </h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.7;" class="text-muted">
        {{ $isDoctor
            ? trans('email.appt_cancelled_line1_doctor', [], $locale)
            : trans('email.appt_cancelled_line1', [], $locale) }}
    </p>

    <!-- Appointment Details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef2f2;border-radius:12px;overflow:hidden;margin-bottom:24px;" class="info-table">
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
            'label' => trans('email.appt_cancelled_label_cancelled', [], $locale),
            'value' => ucfirst($cancelledBy),
        ])
    </table>

    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;" class="text-muted">
        {{ $isDoctor
            ? trans('email.appt_cancelled_slot_freed', [], $locale)
            : trans('email.appt_cancelled_reschedule', [], $locale) }}
    </p>
@endsection

@section('actionUrl', $actionUrl)
@section('actionText', $isDoctor
    ? trans('email.appt_cancelled_cta_doctor', [], $locale)
    : trans('email.appt_cancelled_cta', [], $locale))
