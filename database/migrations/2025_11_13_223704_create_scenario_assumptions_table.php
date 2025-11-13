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
        Schema::create('scenario_assumptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scenario_id')->constrained()->cascadeOnDelete();
            $table->integer('year');
            $table->foreignId('business_group_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('customer_type_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->cascadeOnDelete();
            $table->decimal('growth_rate', 5, 2);
            $table->decimal('inflation_rate', 5, 2)->nullable();
            $table->enum('adjustment_type', ['percentage', 'fixed_amount'])->default('percentage');
            $table->decimal('fixed_amount', 15, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['scenario_id', 'year']);
            $table->index('business_group_id');
            $table->index('customer_type_id');
            $table->index('customer_id');
            $table->index('product_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scenario_assumptions');
    }
};
