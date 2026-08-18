<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sohbet önizlemesini genişlet.
 *
 * `last_message_content` varchar(255) olarak açılmıştı ama model onu
 * `encrypted` olarak saklıyor: şifrelenmiş metin base64 zarfıyla birlikte
 * özgün uzunluğun birkaç katına çıkıyor. Sonuç: yaklaşık 120 karakteri geçen
 * her mesajda sohbet kaydı "Data too long" ile düşüyordu — mesaj gitmiyor.
 *
 * TEXT dizin almıyor; bu sütun zaten yalnızca listede gösteriliyor,
 * aranmıyor ve sıralanmıyor.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chat_conversations', function (Blueprint $table) {
            $table->text('last_message_content')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('chat_conversations', function (Blueprint $table) {
            $table->string('last_message_content', 255)->nullable()->change();
        });
    }
};
