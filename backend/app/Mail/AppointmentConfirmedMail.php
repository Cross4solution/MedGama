<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AppointmentConfirmedMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $patientName;
    public string $doctorName;
    public string $date;
    public string $time;
    public ?string $videoLink;

    public function __construct(string $patientName, string $doctorName, string $date, string $time, ?string $videoLink = null)
    {
        $this->patientName = $patientName;
        $this->doctorName = $doctorName;
        $this->date = $date;
        $this->time = $time;
        $this->videoLink = $videoLink;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'MedaGama — Appointment Confirmed',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.appointment-confirmed',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
