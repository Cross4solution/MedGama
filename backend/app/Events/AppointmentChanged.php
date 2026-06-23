<?php

namespace App\Events;

use App\Models\Appointment;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired whenever an appointment is created / updated / cancelled / rescheduled.
 * Broadcasts to both participants (and the clinic) so every open view —
 * patient, doctor, CRM, calendar, availability — refreshes in real time.
 */
class AppointmentChanged implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Appointment $appointment,
        public string $action, // created | updated | cancelled | rescheduled | deleted
    ) {}

    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('user.' . $this->appointment->patient_id),
            new PrivateChannel('user.' . $this->appointment->doctor_id),
        ];
        if ($this->appointment->clinic_id) {
            $channels[] = new PrivateChannel('clinic.' . $this->appointment->clinic_id);
        }
        return $channels;
    }

    public function broadcastWith(): array
    {
        $a = $this->appointment;
        return [
            'action'         => $this->action,
            'appointment_id' => $a->id,
            'status'         => $a->status,
            'doctor_id'      => $a->doctor_id,
            'patient_id'     => $a->patient_id,
            'clinic_id'      => $a->clinic_id,
            'slot_id'        => $a->slot_id,
            'date'           => $a->appointment_date?->toDateString(),
            'time'           => $a->appointment_time,
        ];
    }

    public function broadcastAs(): string
    {
        return 'appointment.changed';
    }
}
