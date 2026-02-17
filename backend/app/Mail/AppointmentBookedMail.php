<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AppointmentBookedMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $patientName;
    public string $doctorName;
    public string $date;
    public string $time;
    public string $type;

    public function __construct(string $patientName, string $doctorName, string $date, string $time, string $type = 'online')
    {
        $this->patientName = $patientName;
        $this->doctorName = $doctorName;
        $this->date = $date;
        $this->time = $time;
        $this->type = $type;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'MedGama — Appointment Booked',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.appointment-booked',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
