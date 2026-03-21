<?php

namespace App\Enums;

/**
 * Platform-wide moderation & verification status constants.
 * Single Source of Truth — used across all models and controllers.
 *
 * Numeric codes:
 *   0 = Pending
 *   1 = Approved
 *   2 = Rejected
 *   3 = Hidden
 */
enum ModerationStatus: string
{
    case Pending  = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Hidden   = 'hidden';

    public function code(): int
    {
        return match ($this) {
            self::Pending  => 0,
            self::Approved => 1,
            self::Rejected => 2,
            self::Hidden   => 3,
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::Pending  => 'Pending',
            self::Approved => 'Approved',
            self::Rejected => 'Rejected',
            self::Hidden   => 'Hidden',
        };
    }

    public function isPending(): bool
    {
        return $this === self::Pending;
    }

    public function isApproved(): bool
    {
        return $this === self::Approved;
    }

    public function isTerminal(): bool
    {
        return in_array($this, [self::Approved, self::Rejected]);
    }
}
