<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('favorites', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->char('activity_id', 36);
            $table->timestamp('created_at')->useCurrent();
            $table->primary(['user_id', 'activity_id']);
            $table->foreign('activity_id')
                  ->references('id')->on('activities')
                  ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('favorites');
    }
};
