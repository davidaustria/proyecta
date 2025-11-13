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
        Schema::create('projection_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('projection_id')->constrained()->cascadeOnDelete();
            $table->tinyInteger('month');
            $table->decimal('subtotal', 15, 2);
            $table->decimal('tax', 15, 2);
            $table->decimal('amount', 15, 2);
            $table->decimal('base_amount', 15, 2);
            $table->decimal('seasonality_factor', 5, 4)->default(1.0000);
            $table->timestamps();

            $table->unique(['projection_id', 'month']);
            $table->index('projection_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projection_details');
    }
};
