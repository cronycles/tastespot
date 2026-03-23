<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_photos', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('activity_id', 36);
            $table->string('storage_path');
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('activity_id')
                  ->references('id')->on('activities')
                  ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_photos');
    }
};
