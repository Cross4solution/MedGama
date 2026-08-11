<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Str;
use Ramsey\Uuid\Uuid;

abstract class TestCase extends BaseTestCase
{
    // RefreshDatabase bu bayrakla veritabanını sıfırlarken "tüm tipleri düşür"
    // adımını da çalıştırıyor; bu yalnızca PostgreSQL'de destekleniyor ve testler
    // SQLite üzerinde koştuğu için her koşunun İLK testi LogicException ile
    // düşüyordu. Migration'lar özel tip oluşturmuyor, bu adıma ihtiyaç yok.
    protected $dropTypes = false;
    protected $dropViews = false;

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
