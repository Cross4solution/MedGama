<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                    
                    {{-- Header --}}
                    <tr>
                        <td style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:32px 40px;text-align:center;">
                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                                <tr>
                                    <td style="padding-right:10px;vertical-align:middle;">
                                        <div style="width:36px;height:36px;background-color:rgba(255,255,255,0.2);border-radius:10px;display:inline-block;text-align:center;line-height:36px;">
                                            <span style="font-size:20px;">🔐</span>
                                        </div>
                                    </td>
                                    <td style="vertical-align:middle;">
                                        <span style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">MedaGama</span>
                                    </td>
                                </tr>
                            </table>
                            <p style="color:rgba(255,255,255,0.85);font-size:13px;margin:12px 0 0;font-weight:400;">Password Reset Request</p>
                        </td>
                    </tr>

                    {{-- Body --}}
                    <tr>
                        <td style="padding:36px 40px 20px;">
                            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Reset your password</h1>
                            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                                Hi <strong style="color:#374151;">{{ $userName }}</strong>, we received a request to reset your password. Use the code below to set a new password.
                            </p>
                        </td>
                    </tr>

                    {{-- Code Box --}}
                    <tr>
                        <td style="padding:0 40px 28px;">
                            <div style="background-color:#eef2ff;border:2px dashed #c7d2fe;border-radius:12px;padding:24px;text-align:center;">
                                <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#4f46e5;text-transform:uppercase;letter-spacing:1.5px;">Reset Code</p>
                                <p style="margin:0;font-size:36px;font-weight:800;color:#3730a3;letter-spacing:8px;font-family:'Courier New',monospace;">{{ $code }}</p>
                            </div>
                        </td>
                    </tr>

                    {{-- Info --}}
                    <tr>
                        <td style="padding:0 40px 32px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef2f2;border-radius:10px;border:1px solid #fecaca;">
                                <tr>
                                    <td style="padding:14px 18px;">
                                        <p style="margin:0;font-size:13px;color:#991b1b;line-height:1.5;">
                                            ⏱ This code expires in <strong>15 minutes</strong>.<br>
                                            🚫 If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Divider --}}
                    <tr>
                        <td style="padding:0 40px;">
                            <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;">
                        </td>
                    </tr>

                    {{-- Footer --}}
                    <tr>
                        <td style="padding:24px 40px 32px;text-align:center;">
                            <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">
                                This email was sent by <strong style="color:#6b7280;">MedaGama</strong>
                            </p>
                            <p style="margin:0;font-size:11px;color:#d1d5db;">
                                Medical Tourism & Healthcare Platform
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
