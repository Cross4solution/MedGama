<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AppointmentCancelledMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $patientName;
    public string $doctorName;
    public string $date;
    public string $time;

    public function __construct(string $patientName, string $doctorName, string $date, string $time)
    {
        $this->patientName = $patientName;
        $this->doctorName = $doctorName;
        $this->date = $date;
        $this->time = $time;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'MedaGama — Appointment Cancelled',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.appointment-cancelled',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
