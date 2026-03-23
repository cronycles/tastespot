<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_type_assignments', function (Blueprint $table) {
            $table->char('activity_id', 36);
            $table->char('activity_type_id', 36);
            $table->primary(['activity_id', 'activity_type_id']);
            $table->foreign('activity_id')
                  ->references('id')->on('activities')
                  ->cascadeOnDelete();
            $table->foreign('activity_type_id')
                  ->references('id')->on('activity_types')
                  ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_type_assignments');
    }
};
