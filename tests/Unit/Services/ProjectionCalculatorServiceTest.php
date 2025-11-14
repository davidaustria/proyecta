<?php

use App\Services\ProjectionCalculatorService;

describe('ProjectionCalculatorService', function () {
    beforeEach(function () {
        $this->service = new ProjectionCalculatorService(
            app(\App\Services\HistoricalDataAnalyzerService::class),
            app(\App\Services\AssumptionResolver::class)
        );
    });

    describe('applyGrowthAndInflation', function () {
        it('applies growth rate correctly', function () {
            $result = $this->service->applyGrowthAndInflation(1000, 10, 0);
            expect($result)->toBe(1100.0);
        });

        it('applies inflation rate correctly', function () {
            $result = $this->service->applyGrowthAndInflation(1000, 0, 5);
            expect($result)->toBe(1050.0);
        });

        it('applies both growth and inflation', function () {
            // 1000 * 1.10 = 1100
            // 1100 * 1.05 = 1155
            $result = $this->service->applyGrowthAndInflation(1000, 10, 5);
            expect($result)->toBe(1155.0);
        });

        it('handles negative growth rate', function () {
            $result = $this->service->applyGrowthAndInflation(1000, -10, 0);
            expect($result)->toBe(900.0);
        });

        it('handles zero rates', function () {
            $result = $this->service->applyGrowthAndInflation(1000, 0, 0);
            expect($result)->toBe(1000.0);
        });

        it('rounds to 2 decimal places', function () {
            $result = $this->service->applyGrowthAndInflation(1000, 3.33, 2.22);
            // 1000 * 1.0333 = 1033.3
            // 1033.3 * 1.0222 = 1056.27
            expect($result)->toBe(1056.27);
        });
    });

    describe('calculateMonthlyDistribution', function () {
        it('distributes evenly with uniform factors', function () {
            $annualAmount = 12000;
            $factors = array_fill(0, 12, 1.0);

            $result = $this->service->calculateMonthlyDistribution($annualAmount, $factors);

            expect($result)->toHaveCount(12);
            expect($result[0])->toBe(1000.0); // Each month gets 1000
            expect(array_sum($result))->toBe(12000.0);
        });

        it('applies seasonality factors correctly', function () {
            $annualAmount = 12000;
            // Higher factor in January (2.0), lower in other months
            $factors = [2.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];

            $result = $this->service->calculateMonthlyDistribution($annualAmount, $factors);

            // Sum of factors: 13.0
            // Normalized: [2.0/13*12, 1.0/13*12, ...]
            // January should be roughly 1846.15
            expect($result)->toHaveCount(12);
            expect($result[0])->toBeGreaterThan($result[1]);
            expect(round(array_sum($result), 2))->toBe(12000.0);
        });

        it('normalizes factors that do not sum to 12', function () {
            $annualAmount = 12000;
            // Factors that sum to 6 instead of 12
            $factors = array_fill(0, 12, 0.5);

            $result = $this->service->calculateMonthlyDistribution($annualAmount, $factors);

            expect($result)->toHaveCount(12);
            expect(round(array_sum($result), 2))->toBe(12000.0);
        });

        it('uses default uniform factors for invalid input', function () {
            $annualAmount = 12000;
            $factors = [1.0, 1.0]; // Only 2 factors instead of 12

            $result = $this->service->calculateMonthlyDistribution($annualAmount, $factors);

            expect($result)->toHaveCount(12);
            expect($result[0])->toBe(1000.0);
        });

        it('handles zero sum factors', function () {
            $annualAmount = 12000;
            $factors = array_fill(0, 12, 0);

            $result = $this->service->calculateMonthlyDistribution($annualAmount, $factors);

            expect($result)->toHaveCount(12);
            expect($result[0])->toBe(1000.0); // Falls back to uniform
        });
    });
});
