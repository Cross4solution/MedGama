<!DOCTYPE html>
<html lang="{{ $locale ?? 'en' }}" dir="{{ ($locale ?? 'en') === 'ar' ? 'rtl' : 'ltr' }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>{{ $subject ?? 'MedGama' }}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        /* Reset */
        body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
        body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
        /* Dark mode */
        @media (prefers-color-scheme: dark) {
            .email-bg { background-color: #1a1a2e !important; }
            .email-card { background-color: #16213e !important; }
            .text-dark { color: #e0e0e0 !important; }
            .text-muted { color: #a0a0a0 !important; }
        }
        /* Responsive */
        @media only screen and (max-width: 600px) {
            .email-container { width: 100% !important; max-width: 100% !important; }
            .email-padding { padding: 24px 20px !important; }
            .header-padding { padding: 28px 20px !important; }
            .info-table td { display: block !important; width: 100% !important; padding: 6px 16px !important; }
            .mobile-full { width: 100% !important; display: block !important; }
        }
    </style>
</head>
<body style="margin:0;padding:0;background-color:#f0fdf4;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;" class="email-bg">

<!-- Preheader (invisible preview text) -->
<div style="display:none;font-size:1px;color:#f0fdf4;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    {{ $preheader ?? '' }}
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdf4;" class="email-bg">
<tr>
<td align="center" style="padding:32px 16px 48px;">

    <!-- Main Card -->
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" class="email-container" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

        <!-- ═══ HEADER ═══ -->
        <tr>
            <td style="background:linear-gradient(135deg,#0d9488 0%,#059669 50%,#047857 100%);padding:32px 40px;text-align:center;" class="header-padding">
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                    <tr>
                        <td style="vertical-align:middle;padding-right:12px;">
                            <img src="{{ config('app.frontend_url', 'https://medgama.com') }}/images/logo-white.png" alt="MedGama" width="40" height="40" style="display:block;border-radius:10px;" onerror="this.style.display='none'">
                        </td>
                        <td style="vertical-align:middle;">
                            <span style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;font-family:'Segoe UI',Roboto,sans-serif;">MedGama</span>
                        </td>
                    </tr>
                </table>
                @if(isset($headerIcon) || isset($headerTitle))
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px auto 0;">
                    <tr>
                        @if(isset($headerIcon))
                        <td style="vertical-align:middle;padding-right:8px;">
                            <div style="width:28px;height:28px;background-color:rgba(255,255,255,0.2);border-radius:8px;text-align:center;line-height:28px;font-size:16px;">
                                {{ $headerIcon }}
                            </div>
                        </td>
                        @endif
                        @if(isset($headerTitle))
                        <td style="vertical-align:middle;">
                            <span style="font-size:14px;font-weight:500;color:rgba(255,255,255,0.9);letter-spacing:0.3px;">{{ $headerTitle }}</span>
                        </td>
                        @endif
                    </tr>
                </table>
                @endif
            </td>
        </tr>

        <!-- ═══ BODY ═══ -->
        <tr>
            <td style="padding:36px 40px 24px;" class="email-padding">
                @yield('content')
            </td>
        </tr>

        <!-- ═══ CTA BUTTON ═══ -->
        @hasSection('actionUrl')
        <tr>
            <td style="padding:0 40px 32px;" class="email-padding">
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                    <tr>
                        <td style="border-radius:12px;background:linear-gradient(135deg,#0d9488,#059669);text-align:center;">
                            <a href="@yield('actionUrl')" target="_blank" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;font-family:'Segoe UI',Roboto,sans-serif;">
                                @yield('actionText', 'View Details')
                            </a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        @endif

        <!-- ═══ DIVIDER ═══ -->
        <tr>
            <td style="padding:0 40px;">
                <div style="border-top:1px solid #e5e7eb;"></div>
            </td>
        </tr>

        <!-- ═══ FOOTER ═══ -->
        <tr>
            <td style="padding:24px 40px 20px;text-align:center;" class="email-padding">
                <!-- Social Links -->
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
                    <tr>
                        <td style="padding:0 6px;">
                            <a href="https://twitter.com/medgama" target="_blank" style="display:inline-block;width:32px;height:32px;background-color:#f3f4f6;border-radius:8px;text-align:center;line-height:32px;text-decoration:none;font-size:14px;" title="Twitter">𝕏</a>
                        </td>
                        <td style="padding:0 6px;">
                            <a href="https://instagram.com/medgama" target="_blank" style="display:inline-block;width:32px;height:32px;background-color:#f3f4f6;border-radius:8px;text-align:center;line-height:32px;text-decoration:none;font-size:14px;" title="Instagram">📷</a>
                        </td>
                        <td style="padding:0 6px;">
                            <a href="https://linkedin.com/company/medgama" target="_blank" style="display:inline-block;width:32px;height:32px;background-color:#f3f4f6;border-radius:8px;text-align:center;line-height:32px;text-decoration:none;font-size:14px;" title="LinkedIn">in</a>
                        </td>
                    </tr>
                </table>

                <p style="margin:0 0 6px;font-size:12px;color:#6b7280;line-height:1.5;">
                    MedGama Healthcare Platform
                </p>
                <p style="margin:0 0 6px;font-size:11px;color:#9ca3af;line-height:1.5;">
                    <a href="{{ config('app.frontend_url', 'https://medgama.com') }}" style="color:#0d9488;text-decoration:none;">medgama.com</a>
                    &nbsp;&bull;&nbsp;
                    <a href="mailto:support@medgama.com" style="color:#0d9488;text-decoration:none;">support@medgama.com</a>
                </p>
                <p style="margin:12px 0 0;font-size:10px;color:#d1d5db;line-height:1.4;">
                    {{ trans('email.footer_disclaimer', [], $locale ?? 'en') }}
                </p>
            </td>
        </tr>

    </table>

    <!-- Unsubscribe -->
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" class="email-container" style="max-width:560px;width:100%;">
        <tr>
            <td style="padding:16px 0;text-align:center;">
                <p style="margin:0;font-size:10px;color:#9ca3af;">
                    © {{ date('Y') }} MedGama. {{ trans('email.all_rights', [], $locale ?? 'en') }}
                </p>
            </td>
        </tr>
    </table>

</td>
</tr>
</table>

</body>
</html>
