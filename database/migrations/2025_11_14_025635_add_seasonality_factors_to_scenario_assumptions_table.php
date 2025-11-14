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
        Schema::table('scenario_assumptions', function (Blueprint $table) {
            $table->json('seasonality_factors')->nullable()->after('fixed_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('scenario_assumptions', function (Blueprint $table) {
            $table->dropColumn('seasonality_factors');
        });
    }
};
