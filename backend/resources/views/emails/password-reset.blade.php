@extends('emails.layouts.medagama', [
    'subject'     => trans('email.pwd_reset_subject', [], $locale),
    'preheader'   => trans('email.pwd_reset_preheader', [], $locale),
    'headerTitle' => trans('email.pwd_reset_header', [], $locale),
])

@section('content')
    <p style="margin:0 0 16px;font-size:16px;font-weight:600;line-height:1.4;">
        {{ trans('email.pwd_reset_greeting', ['name' => $name], $locale) }}
    </p>

    <p class="txt" style="margin:0 0 24px;font-size:14px;line-height:1.65;color:#334155;">
        {{ trans('email.pwd_reset_intro', [], $locale) }}
    </p>

    {{-- Kod, okunması kolay olsun diye harf aralığı açılmış tek bir blokta.
         Kopyalanabilir düz metin: e-posta istemcileri seçimi bozmasın diye
         görsel değil, yazı. --}}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td class="bg-panel" align="center" style="background-color:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;padding:24px 16px;">
                <p class="txt-soft" style="margin:0 0 8px;font-size:11px;color:#0f766e;text-transform:uppercase;letter-spacing:1px;font-weight:600;">
                    {{ trans('email.pwd_reset_code_label', [], $locale) }}
                </p>
                <p style="margin:0;font-size:32px;font-weight:700;color:#0f766e;letter-spacing:8px;font-family:'SF Mono',Menlo,Consolas,monospace;">
                    {{ $code }}
                </p>
            </td>
        </tr>
    </table>

    <p class="txt-soft" style="margin:20px 0 0;font-size:13px;line-height:1.65;color:#64748b;">
        {{ trans('email.pwd_reset_expiry', ['minutes' => 15], $locale) }}
    </p>

    {{-- Bu satır güvenlik açısından önemli: kullanıcı istemediği hâlde
         e-posta aldıysa, hesabına birinin girmeye çalıştığını buradan anlar. --}}
    <p class="txt-soft" style="margin:12px 0 0;font-size:13px;line-height:1.65;color:#64748b;">
        {{ trans('email.pwd_reset_ignore', [], $locale) }}
    </p>
@endsection
