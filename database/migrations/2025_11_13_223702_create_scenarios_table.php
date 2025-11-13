<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('scenarios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->integer('base_year');
            $table->integer('historical_months')->default(12);
            $table->integer('projection_years')->default(3);
            $table->enum('status', ['draft', 'active', 'archived'])->default('draft');
            $table->boolean('is_baseline')->default(false);
            $table->enum('calculation_method', ['simple_average', 'weighted_average', 'trend'])->default('simple_average');
            $table->boolean('include_inflation')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('organization_id');
            $table->index('user_id');
            $table->index('status');
            $table->index('is_baseline');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scenarios');
    }
};
