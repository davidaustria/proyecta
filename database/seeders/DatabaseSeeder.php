<?php

namespace Database\Seeders;

use App\Models\BusinessGroup;
use App\Models\Customer;
use App\Models\CustomerType;
use App\Models\ImportBatch;
use App\Models\InflationRate;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Organization;
use App\Models\Product;
use App\Models\Projection;
use App\Models\ProjectionDetail;
use App\Models\Scenario;
use App\Models\ScenarioAssumption;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->command->info('🌱 Seeding database for Revenue Projection System...');

        // 1. Create test user
        $this->command->info('Creating test user...');
        $user = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => 'password',
                'email_verified_at' => now(),
            ]
        );

        // 2. Create organization
        $this->command->info('Creating organization...');
        $organization = Organization::factory()->create([
            'name' => 'Proyecta Demo',
            'slug' => 'proyecta-demo',
            'domain' => 'demo.proyecta.com',
            'is_active' => true,
        ]);

        // Attach user to organization
        $organization->users()->syncWithoutDetaching([$user->id]);

        // 3. Create inflation rates
        $this->command->info('Creating inflation rates...');
        $years = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028];
        $rates = [3.15, 7.36, 7.90, 4.66, 4.50, 4.00, 3.80, 3.50, 3.50];
        $sources = ['INEGI', 'INEGI', 'INEGI', 'INEGI', 'INEGI', 'Estimated', 'Estimated', 'Estimated', 'Estimated'];

        foreach ($years as $index => $year) {
            InflationRate::firstOrCreate(
                ['year' => $year],
                [
                    'rate' => $rates[$index],
                    'source' => $sources[$index],
                    'is_estimated' => $year >= 2025,
                ]
            );
        }

        // 4. Create master data
        $this->command->info('Creating customer types...');
        $customerTypeFondos = CustomerType::factory()->forOrganization($organization)->create([
            'name' => 'Fondos',
            'code' => 'FONDOS',
            'description' => 'Fondos de inversión y patrimoniales',
            'sort_order' => 1,
        ]);

        $customerTypeAfores = CustomerType::factory()->forOrganization($organization)->create([
            'name' => 'Afores',
            'code' => 'AFORES',
            'description' => 'Administradoras de Fondos para el Retiro',
            'sort_order' => 2,
        ]);

        $customerTypeOtros = CustomerType::factory()->forOrganization($organization)->create([
            'name' => 'Otros',
            'code' => 'OTROS',
            'description' => 'Otros tipos de clientes',
            'sort_order' => 3,
        ]);

        $this->command->info('Creating business groups...');
        $businessGroup1 = BusinessGroup::factory()->forOrganization($organization)->create([
            'name' => 'Grupo Financiero Alpha',
            'code' => 'GFA',
        ]);

        $businessGroup2 = BusinessGroup::factory()->forOrganization($organization)->create([
            'name' => 'Corporativo Beta Holdings',
            'code' => 'CBH',
        ]);

        $this->command->info('Creating products...');
        $products = [];
        $productsData = [
            ['name' => 'Consultoría Financiera', 'code' => 'CONS-FIN', 'category' => 'Consulting'],
            ['name' => 'Auditoría Externa', 'code' => 'AUDIT', 'category' => 'Audit'],
            ['name' => 'Valuación de Activos', 'code' => 'VALUATION', 'category' => 'Valuation'],
            ['name' => 'Gestión de Riesgos', 'code' => 'RISK-MGT', 'category' => 'Risk Management'],
            ['name' => 'Due Diligence', 'code' => 'DUE-DILI', 'category' => 'M&A'],
        ];

        foreach ($productsData as $productData) {
            $products[] = Product::factory()->forOrganization($organization)->create($productData);
        }

        $this->command->info('Creating customers...');
        $customers = [];

        // Customers for Fondos type
        for ($i = 1; $i <= 5; $i++) {
            $customers[] = Customer::factory()
                ->forOrganization($organization)
                ->ofType($customerTypeFondos)
                ->forBusinessGroup($i <= 3 ? $businessGroup1 : null)
                ->create([
                    'name' => "Fondo de Inversión {$i}",
                    'code' => "FONDO-{$i}",
                ]);
        }

        // Customers for Afores type
        for ($i = 1; $i <= 3; $i++) {
            $customers[] = Customer::factory()
                ->forOrganization($organization)
                ->ofType($customerTypeAfores)
                ->forBusinessGroup($businessGroup2)
                ->create([
                    'name' => "Afore {$i}",
                    'code' => "AFORE-{$i}",
                ]);
        }

        // Customers for Otros type
        for ($i = 1; $i <= 2; $i++) {
            $customers[] = Customer::factory()
                ->forOrganization($organization)
                ->ofType($customerTypeOtros)
                ->create([
                    'name' => "Cliente Corporativo {$i}",
                    'code' => "CORP-{$i}",
                ]);
        }

        // 5. Create historical invoices
        $this->command->info('Creating import batches and invoices...');

        $importBatch = ImportBatch::factory()->completed()->create([
            'user_id' => $user->id,
            'filename' => 'historical_invoices_2023_2024.csv',
            'source_system' => 'SAP',
            'import_type' => 'invoices',
            'total_records' => 150,
            'successful_records' => 148,
            'failed_records' => 2,
        ]);

        // Create invoices for last 2 years with varied distribution
        foreach ($customers as $customer) {
            $invoiceCount = rand(10, 20);

            for ($i = 0; $i < $invoiceCount; $i++) {
                $invoice = Invoice::factory()
                    ->forCustomer($customer)
                    ->paid()
                    ->inDateRange('-24 months', 'now')
                    ->create([
                        'import_batch_id' => $importBatch->id,
                    ]);

                // Add 2-5 items per invoice
                $itemCount = rand(2, 5);
                for ($j = 0; $j < $itemCount; $j++) {
                    InvoiceItem::factory()
                        ->forInvoice($invoice)
                        ->forProduct($products[array_rand($products)])
                        ->create();
                }
            }
        }

        $this->command->info('Created '.Invoice::count().' invoices with '.InvoiceItem::count().' line items.');

        // 6. Create scenarios with assumptions
        $this->command->info('Creating scenarios...');

        // Baseline scenario
        $baselineScenario = Scenario::factory()
            ->forOrganization($organization)
            ->createdBy($user)
            ->baseline()
            ->active()
            ->create([
                'name' => 'Baseline 2024',
                'description' => 'Escenario base con supuestos moderados de crecimiento',
                'base_year' => 2024,
                'historical_months' => 12,
                'projection_years' => 3,
            ]);

        // Conservative scenario
        $conservativeScenario = Scenario::factory()
            ->forOrganization($organization)
            ->createdBy($user)
            ->active()
            ->create([
                'name' => 'Conservador 2024',
                'description' => 'Escenario conservador con bajo crecimiento',
                'base_year' => 2024,
                'historical_months' => 12,
                'projection_years' => 3,
            ]);

        // Optimistic scenario
        $optimisticScenario = Scenario::factory()
            ->forOrganization($organization)
            ->createdBy($user)
            ->active()
            ->create([
                'name' => 'Optimista 2024',
                'description' => 'Escenario optimista con alto crecimiento',
                'base_year' => 2024,
                'historical_months' => 12,
                'projection_years' => 3,
            ]);

        $this->command->info('Creating scenario assumptions...');

        // Baseline assumptions
        foreach ([2025, 2026, 2027] as $year) {
            // Global assumption
            ScenarioAssumption::factory()
                ->global()
                ->percentage()
                ->create([
                    'scenario_id' => $baselineScenario->id,
                    'year' => $year,
                    'growth_rate' => 5.0,
                    'notes' => 'Crecimiento global moderado',
                ]);

            // Fondos type specific
            ScenarioAssumption::factory()
                ->forCustomerType($customerTypeFondos)
                ->percentage()
                ->create([
                    'scenario_id' => $baselineScenario->id,
                    'year' => $year,
                    'growth_rate' => 7.0,
                    'notes' => 'Fondos con mayor crecimiento',
                ]);
        }

        // Conservative assumptions
        foreach ([2025, 2026, 2027] as $year) {
            ScenarioAssumption::factory()
                ->global()
                ->percentage()
                ->create([
                    'scenario_id' => $conservativeScenario->id,
                    'year' => $year,
                    'growth_rate' => 2.0,
                    'notes' => 'Crecimiento conservador',
                ]);
        }

        // Optimistic assumptions
        foreach ([2025, 2026, 2027] as $year) {
            ScenarioAssumption::factory()
                ->global()
                ->percentage()
                ->create([
                    'scenario_id' => $optimisticScenario->id,
                    'year' => $year,
                    'growth_rate' => 10.0,
                    'notes' => 'Crecimiento alto',
                ]);
        }

        // 7. Create sample projections with monthly details
        $this->command->info('Creating sample projections...');

        foreach ([$baselineScenario, $conservativeScenario, $optimisticScenario] as $scenario) {
            foreach ([2025, 2026, 2027] as $year) {
                // Create global projection
                $projection = Projection::factory()
                    ->forScenario($scenario)
                    ->forYear($year)
                    ->global()
                    ->create();

                // Create 12 monthly details
                for ($month = 1; $month <= 12; $month++) {
                    ProjectionDetail::factory()
                        ->forProjection($projection)
                        ->forMonth($month)
                        ->create();
                }

                // Create projection for each customer type
                foreach ([$customerTypeFondos, $customerTypeAfores, $customerTypeOtros] as $customerType) {
                    $projection = Projection::factory()
                        ->forScenario($scenario)
                        ->forYear($year)
                        ->create([
                            'customer_type_id' => $customerType->id,
                            'business_group_id' => null,
                            'customer_id' => null,
                            'product_id' => null,
                        ]);

                    // Create 12 monthly details
                    for ($month = 1; $month <= 12; $month++) {
                        ProjectionDetail::factory()
                            ->forProjection($projection)
                            ->forMonth($month)
                            ->create();
                    }
                }
            }
        }

        $this->command->info('Created '.Projection::count().' projections with '.ProjectionDetail::count().' monthly details.');

        $this->command->newLine();
        $this->command->info('✅ Database seeding completed successfully!');
        $this->command->newLine();
        $this->command->table(
            ['Resource', 'Count'],
            [
                ['Organizations', Organization::count()],
                ['Users', User::count()],
                ['Customer Types', CustomerType::count()],
                ['Business Groups', BusinessGroup::count()],
                ['Customers', Customer::count()],
                ['Products', Product::count()],
                ['Import Batches', ImportBatch::count()],
                ['Invoices', Invoice::count()],
                ['Invoice Items', InvoiceItem::count()],
                ['Inflation Rates', InflationRate::count()],
                ['Scenarios', Scenario::count()],
                ['Scenario Assumptions', ScenarioAssumption::count()],
                ['Projections', Projection::count()],
                ['Projection Details', ProjectionDetail::count()],
            ]
        );
        $this->command->newLine();
        $this->command->info('📧 Test User: test@example.com');
        $this->command->info('🔑 Password: password');
    }
}
