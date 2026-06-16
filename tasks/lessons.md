# Lessons

## 2026-05-08 — Push öncesi TÜM değişen PHP dosyalarını lint et
- **Hata:** Main'e push ettim, sadece `routes/api.php` ve frontend build'i kontrol ettim. `BillingService.php` heredoc'ta ternary parse error içeriyordu (line 365) — backend boot'u komple kırıyordu. Kırık kod canlıya (Render) gitti, ikinci push'la düzeltildi.
- **Kural:** Push öncesi `git diff --name-only` ile değişen TÜM `.php` dosyalarını `php -l` ile lint et. Sadece elle dokunduklarımı değil, merge sonucu değişen hepsini.
- **Kural:** Merge sonrası deploy etmeden önce backend boot smoke-test zorunlu (`php -l` tüm değişen PHP).

## PHP heredoc kuralı
- Heredoc içinde SADECE değişken interpolation çalışır. Ternary/method-chain/fonksiyon çağrısı parse error verir.
- Çözüm: değeri heredoc öncesi bir değişkene hesapla, heredoc'ta `{$var}` kullan.
