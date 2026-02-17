<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appointment Confirmed</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                    <tr>
                        <td style="background:linear-gradient(135deg,#059669,#047857);padding:32px 40px;text-align:center;">
                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                                <tr>
                                    <td style="padding-right:10px;vertical-align:middle;">
                                        <div style="width:36px;height:36px;background-color:rgba(255,255,255,0.2);border-radius:10px;display:inline-block;text-align:center;line-height:36px;">
                                            <span style="font-size:20px;">✅</span>
                                        </div>
                                    </td>
                                    <td style="vertical-align:middle;">
                                        <span style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">MedGama</span>
                                    </td>
                                </tr>
                            </table>
                            <p style="color:rgba(255,255,255,0.85);font-size:13px;margin:12px 0 0;font-weight:400;">Appointment Confirmed</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px 40px;">
                            <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">Great news, {{ $patientName }}!</h2>
                            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">Your appointment has been confirmed by the doctor.</p>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ecfdf5;border-radius:12px;padding:20px;margin-bottom:24px;">
                                <tr><td style="padding:8px 20px;font-size:13px;color:#6b7280;">Doctor</td><td style="padding:8px 20px;font-size:14px;font-weight:600;color:#111827;">{{ $doctorName }}</td></tr>
                                <tr><td style="padding:8px 20px;font-size:13px;color:#6b7280;">Date</td><td style="padding:8px 20px;font-size:14px;font-weight:600;color:#111827;">{{ $date }}</td></tr>
                                <tr><td style="padding:8px 20px;font-size:13px;color:#6b7280;">Time</td><td style="padding:8px 20px;font-size:14px;font-weight:600;color:#111827;">{{ $time }}</td></tr>
                                @if($videoLink)
                                <tr><td style="padding:8px 20px;font-size:13px;color:#6b7280;">Session Link</td><td style="padding:8px 20px;font-size:14px;font-weight:600;"><a href="{{ $videoLink }}" style="color:#059669;text-decoration:none;">Join Video Call</a></td></tr>
                                @endif
                            </table>

                            <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.6;">Please make sure to be available at the scheduled time. If you need to reschedule, please contact us in advance.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:0 40px 32px;">
                            <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">MedGama Healthcare Platform &bull; <a href="https://medgama.com" style="color:#059669;text-decoration:none;">medgama.com</a></p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
