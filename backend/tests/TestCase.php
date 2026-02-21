<?php

namespace Tests;

use Illuminate\Foundation\Testing\RefreshDatabaseState;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        // Force migrate:fresh before EVERY test method.
        // PostgreSQL nested savepoints (DB::transaction inside RefreshDatabase
        // wrapping transaction) can abort the outer transaction, leaving stale
        // data that causes UniqueConstraintViolationException in later tests.
        RefreshDatabaseState::$migrated = false;

        parent::setUp();
    }
}
