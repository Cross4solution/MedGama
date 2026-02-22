<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Str;
use Ramsey\Uuid\Uuid;

abstract class TestCase extends BaseTestCase
{
    protected $dropTypes = true;
    protected $dropViews = true;

    protected function setUp(): void
    {
        parent::setUp();

        Str::createUuidsUsing(static fn () => Uuid::uuid4());
    }

    protected function tearDown(): void
    {
        Str::createUuidsNormally();

        parent::tearDown();
    }
}
