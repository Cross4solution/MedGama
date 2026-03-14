<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

/**
 * One-time command to encrypt existing plain-text message data in-place.
 *
 * Encrypts:
 *   - chat_messages.content, chat_messages.attachment_url
 *   - chat_conversations.last_message_content
 *   - messages.body
 *   - message_attachments.file_path, message_attachments.thumb_path
 *
 * Safe to re-run: skips rows that are already encrypted (valid base64 JSON payload).
 *
 * Usage:
 *   php artisan medgama:encrypt-messages
 *   php artisan medgama:encrypt-messages --dry-run
 */
class EncryptMessages extends Command
{
    protected $signature = 'medgama:encrypt-messages
                            {--dry-run : Show what would be encrypted without writing}
                            {--batch=500 : Rows per batch}';

    protected $description = 'Encrypt existing plain-text message content using APP_KEY (one-time migration)';

    private int $encrypted = 0;
    private int $skipped = 0;

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $batch  = (int) $this->option('batch');

        $this->info($dryRun ? '🔍 DRY RUN — no data will be modified' : '🔐 Starting message encryption...');
        $this->newLine();

        // ── 1. chat_messages: content + attachment_url ──
        $this->encryptTable(
            table: 'chat_messages',
            columns: ['content', 'attachment_url'],
            batch: $batch,
            dryRun: $dryRun,
        );

        // ── 2. chat_conversations: last_message_content ──
        $this->encryptTable(
            table: 'chat_conversations',
            columns: ['last_message_content'],
            batch: $batch,
            dryRun: $dryRun,
        );

        // ── 3. messages: body ──
        $this->encryptTable(
            table: 'messages',
            columns: ['body'],
            batch: $batch,
            dryRun: $dryRun,
        );

        // ── 4. message_attachments: file_path + thumb_path ──
        $this->encryptTable(
            table: 'message_attachments',
            columns: ['file_path', 'thumb_path'],
            batch: $batch,
            dryRun: $dryRun,
        );

        $this->newLine();
        $this->info("✅ Done. Encrypted: {$this->encrypted} | Skipped (already encrypted or null): {$this->skipped}");

        return self::SUCCESS;
    }

    /**
     * Encrypt specified columns on a table in batches.
     */
    private function encryptTable(string $table, array $columns, int $batch, bool $dryRun): void
    {
        $exists = DB::getSchemaBuilder()->hasTable($table);
        if (!$exists) {
            $this->warn("  ⚠ Table '{$table}' does not exist — skipping.");
            return;
        }

        $this->info("  📋 {$table} → [" . implode(', ', $columns) . "]");

        $total = DB::table($table)->count();
        if ($total === 0) {
            $this->line("     No rows found.");
            return;
        }

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        DB::table($table)
            ->orderBy('id')
            ->chunk($batch, function ($rows) use ($table, $columns, $dryRun, $bar) {
                foreach ($rows as $row) {
                    $updates = [];

                    foreach ($columns as $col) {
                        $value = $row->$col ?? null;

                        // Skip null values
                        if ($value === null || $value === '') {
                            $this->skipped++;
                            continue;
                        }

                        // Skip if already encrypted (Laravel encrypted values are base64 JSON)
                        if ($this->isAlreadyEncrypted($value)) {
                            $this->skipped++;
                            continue;
                        }

                        $updates[$col] = Crypt::encryptString($value);
                        $this->encrypted++;
                    }

                    if (!empty($updates) && !$dryRun) {
                        DB::table($table)->where('id', $row->id)->update($updates);
                    }

                    $bar->advance();
                }
            });

        $bar->finish();
        $this->newLine();
    }

    /**
     * Check if a value is already a Laravel-encrypted payload.
     * Laravel encryption produces a base64-encoded JSON with keys: iv, value, mac, tag.
     */
    private function isAlreadyEncrypted(string $value): bool
    {
        // Laravel encrypted strings are base64 encoded and decode to JSON with 'iv' key
        $decoded = base64_decode($value, true);
        if ($decoded === false) {
            return false;
        }

        $json = json_decode($decoded, true);
        return is_array($json) && isset($json['iv'], $json['value'], $json['mac']);
    }
}
