<?php

namespace App\Support;

/**
 * Para tutarı — kuruş cinsinden tam sayı + para birimi.
 *
 * Ondalıklı sayıyla para tutmak toplamlarda kuruş kaymasına yol açar
 * (0.1 + 0.2 !== 0.3). Bu yüzden tüm tutarlar en küçük birimde (kuruş/cent)
 * tam sayı olarak taşınır; biçimlendirme yalnızca ekranda yapılır.
 *
 * Para birimi tutardan ayrılmaz: iki farklı para birimi toplanamaz.
 */
final class Money
{
    /** Kuruşsuz para birimleri (JPY gibi) buraya eklenir. */
    private const KURUSSUZ = ['JPY', 'KRW'];

    private function __construct(
        public readonly int $minor,
        public readonly string $currency,
    ) {}

    public static function of(int $minor, string $currency): self
    {
        if ($minor < 0) {
            throw new \InvalidArgumentException('Tutar negatif olamaz.');
        }

        return new self($minor, strtoupper($currency));
    }

    /** "120.50" veya 120.5 → 12050 kuruş. Kullanıcı girdisi için. */
    public static function fromDecimal(int|float|string $tutar, string $currency): self
    {
        $carpan = self::carpan($currency);
        // string üzerinden yuvarlama: float aritmetiği kuruş kaydırabiliyor.
        $minor = (int) round(((float) $tutar) * $carpan);

        return self::of($minor, $currency);
    }

    public function plus(self $other): self
    {
        $this->ayniParaBirimi($other);

        return new self($this->minor + $other->minor, $this->currency);
    }

    public function minus(self $other): self
    {
        $this->ayniParaBirimi($other);

        return self::of($this->minor - $other->minor, $this->currency);
    }

    /**
     * Oranla böl (komisyon). Kalan kuruş KLİNİĞE bırakılır: platform kendi
     * lehine yuvarlamamalı, aksi hâlde her işlemde 1 kuruş fazla keser.
     */
    public function komisyonAyir(float $oran): array
    {
        if ($oran < 0 || $oran > 1) {
            throw new \InvalidArgumentException('Komisyon oranı 0 ile 1 arasında olmalı.');
        }

        $komisyon = (int) floor($this->minor * $oran);

        return [
            'komisyon' => new self($komisyon, $this->currency),
            'hakedis'  => new self($this->minor - $komisyon, $this->currency),
        ];
    }

    public function isZero(): bool
    {
        return $this->minor === 0;
    }

    public function equals(self $other): bool
    {
        return $this->minor === $other->minor && $this->currency === $other->currency;
    }

    /** Ekran için: 12050 + TRY → "120,50". Para birimi simgesi arayüzde eklenir. */
    public function toDecimalString(): string
    {
        $carpan = self::carpan($this->currency);
        if ($carpan === 1) {
            return (string) $this->minor;
        }

        return number_format($this->minor / $carpan, 2, ',', '.');
    }

    public function toArray(): array
    {
        return [
            'amount_minor' => $this->minor,
            'currency'     => $this->currency,
            'display'      => $this->toDecimalString(),
        ];
    }

    private static function carpan(string $currency): int
    {
        return in_array(strtoupper($currency), self::KURUSSUZ, true) ? 1 : 100;
    }

    private function ayniParaBirimi(self $other): void
    {
        if ($this->currency !== $other->currency) {
            throw new \InvalidArgumentException(
                "Farklı para birimleri toplanamaz: {$this->currency} / {$other->currency}"
            );
        }
    }
}
