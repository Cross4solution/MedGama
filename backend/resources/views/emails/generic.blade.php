{{--
    Bildirim e-postaları için ortak gövde.

    Laravel'in kendi MailMessage şablonu markasız duruyordu ve aynı kutuya
    düşen iki Medagama e-postası birbirinden tamamen farklı görünüyordu.
    Bu şablon markalı düzeni kullanır; bildirimler yalnızca içeriği verir.

    Beklenen değişkenler:
      headerTitle  başlık şeridi
      intro        ilk paragraf
      rows         ['etiket' => 'değer'] — künye tablosu (isteğe bağlı)
      quote        alıntılanacak metin, ör. hasta yorumu (isteğe bağlı)
      outro        kapanış cümlesi (isteğe bağlı)
      actionUrl    buton adresi (isteğe bağlı)
      actionLabel  buton yazısı
--}}
@extends('emails.layouts.medagama', [
    'subject'     => $subject,
    'preheader'   => $preheader ?? $intro,
    'headerTitle' => $headerTitle,
    'headerIcon'  => $headerIcon ?? null,
    'headerMeta'  => $headerMeta ?? null,
])

@section('content')
    <p class="txt" style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#334155;">
        {{ $intro }}
    </p>

    @if (!empty($rows))
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               class="bg-panel"
               style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:4px 18px;margin:0 0 20px;">
            @foreach ($rows as $etiket => $deger)
                <tr>
                    <td class="txt-soft" style="padding:10px 0;font-size:13px;color:#64748b;width:40%;vertical-align:top;">
                        {{ $etiket }}
                    </td>
                    <td class="txt" style="padding:10px 0;font-size:14px;color:#0f172a;font-weight:600;vertical-align:top;">
                        {{ $deger }}
                    </td>
                </tr>
                @if (!$loop->last)
                    <tr><td colspan="2" class="rule" style="border-top:1px solid #e2e8f0;font-size:0;line-height:0;">&nbsp;</td></tr>
                @endif
            @endforeach
        </table>
    @endif

    @if (!empty($quote))
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
            <tr>
                <td class="bg-panel" style="background-color:#f0fdfa;border-left:3px solid #14b8a6;border-radius:0 8px 8px 0;padding:14px 18px;">
                    <p class="txt" style="margin:0;font-size:14px;line-height:1.65;color:#334155;font-style:italic;">
                        “{{ $quote }}”
                    </p>
                </td>
            </tr>
        </table>
    @endif

    @if (!empty($outro))
        <p class="txt-soft" style="margin:20px 0 0;font-size:13px;line-height:1.65;color:#64748b;">
            {{ $outro }}
        </p>
    @endif
@endsection

@if (!empty($actionUrl))
    @section('actionUrl', $actionUrl)
    {{-- Düzen bu bölümü actionText adıyla bekliyor; adı tutmazsa buton yazısız çıkar. --}}
    @section('actionText', $actionLabel ?? trans('email.open'))
@endif
