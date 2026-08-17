{{--
    Medagama e-posta düzeni — tüm e-postalar bunu kullanır.

    Kurallar:
    · Tablo tabanlı ve satır içi stil: Outlook ve Gmail kutu modelini
      desteklemiyor, dış stil sayfası da çoğu istemcide siliniyor.
    · Görsel yok. Logo bir <img> ile çekiliyordu ve elimizde o görseli
      yayınlayan bir alan adı olmadığı için her e-postada kırık resim
      çıkıyordu; e-postada JavaScript çalışmadığından onerror da kurtarmıyor.
      Yazı tipiyle kurulan bir marka adı her istemcide aynı görünür.
    · Bağlantılar config('app.frontend_url') üzerinden; hiçbir alan adı
      şablona sabit yazılmaz.
--}}
@php
    $locale = $locale ?? app()->getLocale();
    $siteUrl = rtrim((string) config('app.frontend_url'), '/');
    $rtl = in_array($locale, ['ar', 'he', 'fa'], true);
@endphp
<!DOCTYPE html>
<html lang="{{ $locale }}" dir="{{ $rtl ? 'rtl' : 'ltr' }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>{{ $subject ?? 'Medagama' }}</title>
    <!--[if mso]>
    <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
    <![endif]-->
    <style>
        body, table, td, p, a, li { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
        table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
        img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; }
        body { margin:0; padding:0; width:100% !important; }
        a { color:#0d9488; }

        @media (prefers-color-scheme: dark) {
            .bg-page  { background-color:#0f172a !important; }
            .bg-card  { background-color:#1e293b !important; }
            .txt      { color:#e2e8f0 !important; }
            .txt-soft { color:#94a3b8 !important; }
            .rule     { border-color:#334155 !important; }
            .bg-panel { background-color:#0f172a !important; }
        }

        @media only screen and (max-width:600px) {
            .wrap    { width:100% !important; max-width:100% !important; }
            .pad     { padding:24px 20px !important; }
            .pad-top { padding:26px 20px !important; }
            .stack   { display:block !important; width:100% !important; }
        }
    </style>
</head>
<body class="bg-page" style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

{{-- Gelen kutusunda konunun yanında görünen önizleme metni --}}
<div style="display:none;font-size:1px;color:#f1f5f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    {{ $preheader ?? '' }}&#8199;&#65279;&#8199;&#65279;&#8199;&#65279;&#8199;&#65279;&#8199;&#65279;&#8199;&#65279;
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="bg-page" style="background-color:#f1f5f9;">
<tr><td align="center" style="padding:32px 16px 40px;">

    <table role="presentation" width="560" cellpadding="0" cellspacing="0" class="wrap bg-card"
           style="max-width:560px;width:100%;background-color:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.08),0 8px 24px rgba(15,23,42,0.06);">

        {{-- ── Başlık ── --}}
        <tr>
            <td class="pad-top" align="center" style="background:linear-gradient(135deg,#0d9488 0%,#059669 100%);background-color:#0d9488;padding:32px 40px;text-align:center;">
                {{--
                    Logo CID ile gömülür, data: URI ile değil: Gmail data: kaynaklı
                    görselleri engelliyor, uzak adres ise henüz sahibi olmadığımız
                    bir alan adına işaret ederdi. Gömme yalnızca gerçek gönderimde
                    mümkün olduğu için $message yokken (önizleme/render) sessizce
                    atlanır — başlık logosuz da dursa okunur kalır.
                --}}
                @isset($message)
                    <img src="{{ $message->embed(public_path('images/logo/favicon-icon-white.png')) }}"
                         width="52" height="52" alt="Medagama"
                         style="display:block;margin:0 auto 12px;width:52px;height:52px;border:0;outline:none;">
                @endisset

                <div style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;">Medagama</div>

                @isset($headerTitle)
                    <div style="margin-top:6px;font-size:14px;color:rgba(255,255,255,0.88);font-weight:400;">{{ $headerTitle }}</div>
                @endisset
            </td>
        </tr>

        {{-- ── Gövde ── --}}
        <tr>
            <td class="pad txt" style="padding:32px 40px 8px;color:#0f172a;">
                @yield('content')
            </td>
        </tr>

        {{-- ── Eylem düğmesi (yalnızca tanımlıysa) ── --}}
        @hasSection('actionUrl')
        <tr>
            <td class="pad" style="padding:16px 40px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="border-radius:10px;background-color:#0d9488;">
                            <a href="@yield('actionUrl')" target="_blank" rel="noopener"
                               style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">
                                @yield('actionText')
                            </a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        @endif

        {{-- ── Alt bilgi ── --}}
        <tr>
            <td style="padding:0 40px;">
                <div class="rule" style="border-top:1px solid #e2e8f0;"></div>
            </td>
        </tr>
        <tr>
            <td class="pad" style="padding:20px 40px 24px;">
                <p class="txt-soft" style="margin:0 0 4px;font-size:12px;color:#64748b;line-height:1.5;">
                    {{ trans('email.footer_brand', [], $locale) }}
                </p>
                <p class="txt-soft" style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">
                    <a href="{{ $siteUrl }}" style="color:#0d9488;text-decoration:none;">{{ preg_replace('#^https?://#', '', $siteUrl) }}</a>
                    &nbsp;·&nbsp;
                    <a href="mailto:{{ config('app.support_email') }}" style="color:#0d9488;text-decoration:none;">{{ config('app.support_email') }}</a>
                </p>
                <p class="txt-soft" style="margin:12px 0 0;font-size:10px;color:#cbd5e1;line-height:1.5;">
                    {{ trans('email.footer_disclaimer', [], $locale) }}
                </p>
            </td>
        </tr>
    </table>

    <p style="margin:16px 0 0;font-size:10px;color:#94a3b8;">
        © {{ date('Y') }} Medagama. {{ trans('email.all_rights', [], $locale) }}
    </p>

</td></tr>
</table>

</body>
</html>
