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
        Schema::create('inflation_rates', function (Blueprint $table) {
            $table->id();
            $table->integer('year')->unique();
            $table->decimal('rate', 5, 2);
            $table->string('source', 100)->nullable();
            $table->boolean('is_estimated')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inflation_rates');
    }
};
