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
        Schema::create('projections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scenario_id')->constrained()->cascadeOnDelete();
            $table->integer('year');
            $table->foreignId('business_group_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('customer_type_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->cascadeOnDelete();
            $table->decimal('total_subtotal', 15, 2);
            $table->decimal('total_tax', 15, 2);
            $table->decimal('total_amount', 15, 2);
            $table->decimal('total_with_inflation', 15, 2);
            $table->decimal('base_amount', 15, 2);
            $table->decimal('growth_applied', 5, 2);
            $table->decimal('inflation_applied', 5, 2);
            $table->string('calculation_method', 50);
            $table->timestamp('calculated_at');
            $table->timestamps();
            $table->softDeletes();

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
        Schema::dropIfExists('projections');
    }
};
