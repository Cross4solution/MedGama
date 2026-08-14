<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Video alt yazıları.
 *
 * Kayıtlı videolar canlı görüşmeden farklı çalışır: gerçek zamanlı olmak
 * zorunda değiller, arka planda dakikalarca işlenebilirler ve sonuç SAKLANIR.
 * Bir kez üretilen alt yazıyı sonraki her izleyen hazır bulur — canlı
 * görüşmede her seferinde baştan üretmek gerekiyordu.
 *
 * Her satır bir videonun bir dildeki alt yazısıdır:
 *   kind='original'    → videoda konuşulan dil (sesten yazıya)
 *   kind='translation' → o metnin başka bir dile çevirisi
 *
 * `segments`: [{start, end, text}] — zaman damgalı parçalar. Oynatıcı bunu
 * doğrudan kullanır; düz metin saklamak zaman bilgisini kaybettirirdi.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('video_subtitles', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('post_id');
            // Bir gönderide birden fazla video olabiliyor (media dizisindeki sıra).
            $table->unsignedSmallInteger('media_index')->default(0);

            $table->string('language', 8);
            $table->string('kind', 16)->default('original'); // original | translation

            // pending → ready / failed
            $table->string('status', 16)->default('pending');

            $table->longText('segments')->nullable();

            // Doktor düzelttiyse otomatik üretim onun üzerine yazmamalı.
            $table->boolean('edited')->default(false);
            $table->uuid('edited_by')->nullable();
            $table->dateTime('edited_at')->nullable();

            $table->string('engine', 32)->nullable();
            $table->text('error')->nullable();

            $table->timestamps();

            $table->unique(['post_id', 'media_index', 'language'], 'video_subtitles_post_dil_unique');
            $table->index(['post_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('video_subtitles');
    }
};
