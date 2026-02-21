<?php

namespace Tests;

use Illuminate\Foundation\Testing\RefreshDatabaseState;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Track which test class last ran so we can force a fresh migration
     * when the class changes. This prevents stale data leaking between
     * test classes when PostgreSQL nested savepoints abort the outer
     * transaction used by RefreshDatabase.
     */
    private static ?string $lastTestClass = null;

    protected function setUp(): void
    {
        $currentClass = static::class;

        if (self::$lastTestClass !== $currentClass) {
            RefreshDatabaseState::$migrated = false;
            self::$lastTestClass = $currentClass;
        }

        parent::setUp();
    }
}
