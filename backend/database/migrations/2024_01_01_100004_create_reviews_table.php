<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('activity_id', 36);
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->char('activity_type_id', 36);
            $table->float('score_location')->nullable();
            $table->float('score_food')->nullable();
            $table->float('score_service')->nullable();
            $table->float('score_price')->nullable();
            $table->float('cost_per_person')->nullable();
            $table->text('liked')->nullable();
            $table->text('disliked')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('activity_id')
                  ->references('id')->on('activities')
                  ->cascadeOnDelete();
            $table->foreign('activity_type_id')
                  ->references('id')->on('activity_types')
                  ->cascadeOnDelete();

            // Una recensione per utente per attività per tipologia
            $table->unique(['activity_id', 'user_id', 'activity_type_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
