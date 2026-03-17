@extends('emails.layouts.medgama', [
    'locale'      => $locale,
    'subject'     => $isDoctor
        ? trans('email.appt_booked_subject_doctor', ['date' => $date], $locale)
        : trans('email.appt_booked_subject', ['date' => $date], $locale),
    'preheader'   => $isDoctor
        ? trans('email.appt_booked_line1_doctor', ['patient' => $counterpartName], $locale)
        : trans('email.appt_booked_line1', [], $locale),
    'headerIcon'  => '📅',
    'headerTitle' => $isDoctor
        ? trans('email.appt_booked_subject_doctor', ['date' => $date], $locale)
        : trans('email.appt_booked_subject', ['date' => $date], $locale),
])

@section('content')
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;" class="text-dark">
        {{ trans('email.appt_booked_greeting', ['name' => $isDoctor ? 'Dr. ' . $userName : $userName], $locale) }}
    </h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.7;" class="text-muted">
        {{ $isDoctor
            ? trans('email.appt_booked_line1_doctor', ['patient' => $counterpartName], $locale)
            : trans('email.appt_booked_line1', [], $locale) }}
    </p>

    <!-- Appointment Details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdfa;border-radius:12px;overflow:hidden;margin-bottom:24px;" class="info-table">
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
        @if(!empty($patientNote))
        @include('emails.layouts.info-row', [
            'label' => trans('email.appt_booked_label_note', [], $locale),
            'value' => $patientNote,
        ])
        @endif
    </table>

    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;" class="text-muted">
        {{ $isDoctor
            ? trans('email.appt_booked_manage', [], $locale)
            : trans('email.appt_booked_pending', [], $locale) }}
    </p>
@endsection

@section('actionUrl', $actionUrl)
@section('actionText', trans('email.appt_booked_cta', [], $locale))
