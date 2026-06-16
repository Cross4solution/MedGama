# Lessons

## 2026-06-16 — Next App Router: page server'a geçince screen'e 'use client' ŞART
- **Hata:** Public route page.jsx'lerden `'use client'` kaldırıp server component yaptım (generateMetadata için). Ama asıl screen component'ler (HomeV2, DoctorProfile, vb.) `'use client'` direktifi içermiyordu — eskiden page.jsx onu sağlıyordu. Build kırıldı: "You're importing a component that needs useState/useEffect. This React Hook only works in a Client Component."
- **Kural:** page.jsx'i server'a çevirirken, o page'in render ettiği hook kullanan HER screen/component dosyasının başına `'use client';` ekle. Boundary page'den screen'e kaydı; screen artık kendi boundary'sini ilan etmeli.
- **Kural:** Bu zincir transitif — PrivateRoute gibi ara wrapper'lar da hook kullanıyorsa onlara da `'use client'` gerekir.

## 2026-05-08 — Push öncesi TÜM değişen PHP dosyalarını lint et
- **Hata:** Main'e push ettim, sadece `routes/api.php` ve frontend build'i kontrol ettim. `BillingService.php` heredoc'ta ternary parse error içeriyordu (line 365) — backend boot'u komple kırıyordu. Kırık kod canlıya (Render) gitti, ikinci push'la düzeltildi.
- **Kural:** Push öncesi `git diff --name-only` ile değişen TÜM `.php` dosyalarını `php -l` ile lint et. Sadece elle dokunduklarımı değil, merge sonucu değişen hepsini.
- **Kural:** Merge sonrası deploy etmeden önce backend boot smoke-test zorunlu (`php -l` tüm değişen PHP).

## PHP heredoc kuralı
- Heredoc içinde SADECE değişken interpolation çalışır. Ternary/method-chain/fonksiyon çağrısı parse error verir.
- Çözüm: değeri heredoc öncesi bir değişkene hesapla, heredoc'ta `{$var}` kullan.
