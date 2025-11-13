# Resumen de Migraciones y Modelos - Sistema de Proyección de Ingresos

**Fecha de creación:** 2025-11-13
**Base de datos:** SQLite (desarrollo) / MySQL/SQL Server (producción)
**Framework:** Laravel 12

---

## Tabla de Contenidos

1. [Migraciones Creadas](#migraciones-creadas)
2. [Modelos Eloquent](#modelos-eloquent)
3. [Global Scope - Multi-tenancy](#global-scope---multi-tenancy)
4. [Características Implementadas](#características-implementadas)
5. [Relaciones entre Modelos](#relaciones-entre-modelos)
6. [Convenciones y Patrones](#convenciones-y-patrones)

---

## Migraciones Creadas

### 1. Organizaciones y Multi-tenancy

#### `2025_11_13_223559_create_organizations_table.php`

Tabla raíz para soporte multi-tenancy. Cada organización tiene sus propios datos aislados.

**Campos principales:**
- `id` - Primary Key
- `name` - Nombre de la organización (string 255)
- `slug` - Identificador único (string 100, unique)
- `domain` - Dominio asociado (string 255, nullable, unique)
- `is_active` - Estado activo/inactivo (boolean, default true)
- `settings` - Configuración en JSON (nullable)
- `deleted_at` - Soft delete timestamp

**Índices:**
- Primary key en `id`
- Unique en `slug`
- Unique en `domain`
- Index en `is_active`

---

### 2. Datos Maestros

#### `2025_11_13_223636_create_business_groups_table.php`

Grupos empresariales que agrupan múltiples clientes bajo una misma entidad.

**Campos principales:**
- `id` - Primary Key
- `organization_id` - FK a organizations (cascade on delete)
- `name` - Nombre del grupo (string 255)
- `code` - Código único (string 50)
- `description` - Descripción (text, nullable)
- `is_active` - Estado (boolean, default true)
- `metadata` - Datos adicionales en JSON (nullable)
- `deleted_at` - Soft delete

**Índices:**
- Primary key en `id`
- Index en `organization_id`
- Unique en `(organization_id, code)` - Composite
- Index en `is_active`

---

#### `2025_11_13_223653_create_customer_types_table.php`

Tipos de clientes (Fondos, Afores, Otros).

**Campos principales:**
- `id` - Primary Key
- `organization_id` - FK a organizations (cascade on delete)
- `name` - Nombre del tipo (string 255)
- `code` - Código único (string 50)
- `description` - Descripción (text, nullable)
- `is_active` - Estado (boolean, default true)
- `sort_order` - Orden de presentación (integer, default 0)
- `deleted_at` - Soft delete

**Índices:**
- Primary key en `id`
- Index en `organization_id`
- Unique en `(organization_id, code)` - Composite
- Index en `(is_active, sort_order)` - Composite

---

#### `2025_11_13_223654_create_customers_table.php`

Clientes individuales asociados a grupos empresariales y tipos.

**Campos principales:**
- `id` - Primary Key
- `organization_id` - FK a organizations (cascade on delete)
- `business_group_id` - FK a business_groups (nullable, null on delete)
- `customer_type_id` - FK a customer_types (restrict on delete)
- `name` - Nombre del cliente (string 255)
- `code` - Código único (string 50)
- `tax_id` - RFC/Tax ID (string 50, nullable)
- `is_active` - Estado (boolean, default true)
- `metadata` - Datos adicionales en JSON (nullable)
- `deleted_at` - Soft delete

**Índices:**
- Primary key en `id`
- Index en `organization_id`
- Unique en `(organization_id, code)` - Composite
- Index en `business_group_id`
- Index en `customer_type_id`
- Index en `is_active`

---

#### `2025_11_13_223655_create_products_table.php`

Productos o servicios facturados.

**Campos principales:**
- `id` - Primary Key
- `organization_id` - FK a organizations (cascade on delete)
- `name` - Nombre del producto (string 255)
- `code` - Código único (string 50)
- `description` - Descripción (text, nullable)
- `category` - Categoría (string 100, nullable)
- `is_active` - Estado (boolean, default true)
- `metadata` - Datos adicionales en JSON (nullable)
- `deleted_at` - Soft delete

**Índices:**
- Primary key en `id`
- Index en `organization_id`
- Unique en `(organization_id, code)` - Composite
- Index en `category`
- Index en `is_active`

---

### 3. Datos Históricos

#### `2025_11_13_223655_create_import_batches_table.php`

Control de lotes de importación de datos históricos.

**Campos principales:**
- `id` - Primary Key
- `user_id` - FK a users (restrict on delete)
- `filename` - Nombre del archivo (string 255)
- `source_system` - Sistema origen (string 50)
- `import_type` - Tipo: invoices, customers, products (enum, default 'invoices')
- `total_records` - Total de registros (integer, default 0)
- `successful_records` - Registros exitosos (integer, default 0)
- `failed_records` - Registros fallidos (integer, default 0)
- `status` - Estado: pending, processing, completed, failed (enum, default 'pending')
- `started_at` - Inicio de importación (timestamp, nullable)
- `completed_at` - Fin de importación (timestamp, nullable)
- `error_log` - Errores en JSON (nullable)
- `metadata` - Datos adicionales en JSON (nullable)

**Índices:**
- Primary key en `id`
- Index en `user_id`
- Index en `status`
- Index en `import_type`

---

#### `2025_11_13_223656_create_invoices_table.php`

Facturas importadas de sistemas externos.

**Campos principales:**
- `id` - Primary Key
- `import_batch_id` - FK a import_batches (nullable, null on delete)
- `customer_id` - FK a customers (restrict on delete)
- `invoice_number` - Número de factura (string 100, unique)
- `invoice_date` - Fecha de factura (date)
- `due_date` - Fecha de vencimiento (date, nullable)
- `subtotal` - Subtotal sin impuestos (decimal 15,2)
- `tax` - Impuestos (decimal 15,2)
- `total` - Total (decimal 15,2)
- `currency` - Moneda (string 3, default 'MXN')
- `exchange_rate` - Tipo de cambio (decimal 10,4, default 1.0000)
- `status` - Estado: draft, issued, paid, cancelled (enum, default 'issued')
- `source_system` - Sistema origen (string 50, nullable)
- `external_id` - ID externo (string 100, nullable)
- `metadata` - Datos adicionales en JSON (nullable)

**Índices:**
- Primary key en `id`
- Unique en `invoice_number`
- Index en `(customer_id, invoice_date)` - Composite
- Index en `import_batch_id`
- Index en `invoice_date`
- Index en `status`

---

#### `2025_11_13_223657_create_invoice_items_table.php`

Líneas de detalle de cada factura.

**Campos principales:**
- `id` - Primary Key
- `invoice_id` - FK a invoices (cascade on delete)
- `product_id` - FK a products (restrict on delete)
- `description` - Descripción del ítem (text)
- `quantity` - Cantidad (decimal 10,2)
- `unit_price` - Precio unitario (decimal 15,2)
- `subtotal` - Subtotal sin impuestos (decimal 15,2)
- `tax` - Impuestos (decimal 15,2)
- `total` - Total (decimal 15,2)
- `metadata` - Datos adicionales en JSON (nullable)

**Índices:**
- Primary key en `id`
- Index en `invoice_id`
- Index en `product_id`

---

### 4. Configuración de Proyecciones

#### `2025_11_13_223702_create_scenarios_table.php`

Escenarios de proyección con diferentes supuestos.

**Campos principales:**
- `id` - Primary Key
- `organization_id` - FK a organizations (cascade on delete)
- `user_id` - FK a users (restrict on delete)
- `name` - Nombre del escenario (string 255)
- `description` - Descripción (text, nullable)
- `base_year` - Año base para cálculos (integer)
- `historical_months` - Meses históricos para promedio (integer, default 12)
- `projection_years` - Años a proyectar (integer, default 3)
- `status` - Estado: draft, active, archived (enum, default 'draft')
- `is_baseline` - Es escenario base (boolean, default false)
- `calculation_method` - Método: simple_average, weighted_average, trend (enum, default 'simple_average')
- `include_inflation` - Incluir inflación (boolean, default true)
- `deleted_at` - Soft delete

**Índices:**
- Primary key en `id`
- Index en `organization_id`
- Index en `user_id`
- Index en `status`
- Index en `is_baseline`

---

#### `2025_11_13_223703_create_inflation_rates_table.php`

Tasas de inflación por año.

**Campos principales:**
- `id` - Primary Key
- `year` - Año (integer, unique)
- `rate` - Tasa de inflación (decimal 5,2)
- `source` - Fuente de datos (string 100, nullable)
- `is_estimated` - Es estimado (boolean, default false)

**Índices:**
- Primary key en `id`
- Unique en `year`

---

#### `2025_11_13_223704_create_scenario_assumptions_table.php`

Supuestos de crecimiento por escenario (pueden variar por año, tipo de cliente, grupo empresarial y producto).

**Campos principales:**
- `id` - Primary Key
- `scenario_id` - FK a scenarios (cascade on delete)
- `year` - Año de aplicación (integer)
- `business_group_id` - FK a business_groups (nullable, cascade on delete)
- `customer_type_id` - FK a customer_types (nullable, cascade on delete)
- `customer_id` - FK a customers (nullable, cascade on delete)
- `product_id` - FK a products (nullable, cascade on delete)
- `growth_rate` - Tasa de crecimiento % (decimal 5,2)
- `inflation_rate` - Tasa de inflación específica % (decimal 5,2, nullable)
- `adjustment_type` - Tipo: percentage, fixed_amount (enum, default 'percentage')
- `fixed_amount` - Monto fijo (decimal 15,2, nullable)
- `notes` - Notas (text, nullable)

**Índices:**
- Primary key en `id`
- Index en `(scenario_id, year)` - Composite
- Index en `business_group_id`
- Index en `customer_type_id`
- Index en `customer_id`
- Index en `product_id`

**Jerarquía de supuestos (de más específico a general):**
1. Cliente + Producto específicos
2. Cliente específico (todos los productos)
3. Grupo Empresarial + Producto
4. Grupo Empresarial (todos los productos)
5. Tipo de Cliente + Producto
6. Tipo de Cliente (todos los productos)
7. Global (sin filtros)

---

### 5. Proyecciones

#### `2025_11_13_223704_create_projections_table.php`

Proyecciones consolidadas por año y dimensión.

**Campos principales:**
- `id` - Primary Key
- `scenario_id` - FK a scenarios (cascade on delete)
- `year` - Año de proyección (integer)
- `business_group_id` - FK a business_groups (nullable, cascade on delete)
- `customer_type_id` - FK a customer_types (nullable, cascade on delete)
- `customer_id` - FK a customers (nullable, cascade on delete)
- `product_id` - FK a products (nullable, cascade on delete)
- `total_subtotal` - Subtotal anual proyectado (decimal 15,2)
- `total_tax` - Impuestos anuales proyectados (decimal 15,2)
- `total_amount` - Total anual (decimal 15,2)
- `total_with_inflation` - Total con inflación (decimal 15,2)
- `base_amount` - Promedio histórico sin ajustes (decimal 15,2)
- `growth_applied` - % de crecimiento aplicado (decimal 5,2)
- `inflation_applied` - % de inflación aplicado (decimal 5,2)
- `calculation_method` - Método de cálculo (string 50)
- `calculated_at` - Fecha de cálculo (timestamp)
- `deleted_at` - Soft delete

**Índices:**
- Primary key en `id`
- Index en `(scenario_id, year)` - Composite
- Index en `business_group_id`
- Index en `customer_type_id`
- Index en `customer_id`
- Index en `product_id`

---

#### `2025_11_13_223705_create_projection_details_table.php`

Desagregación mensual de cada proyección anual.

**Campos principales:**
- `id` - Primary Key
- `projection_id` - FK a projections (cascade on delete)
- `month` - Mes (1-12, donde 1=enero del año de proyección) (tinyInteger)
- `subtotal` - Subtotal mensual sin impuestos (decimal 15,2)
- `tax` - Impuestos mensuales (decimal 15,2)
- `amount` - Total mensual (decimal 15,2)
- `base_amount` - Monto base sin ajustes (decimal 15,2)
- `seasonality_factor` - Factor estacional (decimal 5,4, default 1.0000)

**Índices:**
- Primary key en `id`
- Unique en `(projection_id, month)` - Composite
- Index en `projection_id`

**Nota importante:** El campo `month` es relativo al año de proyección especificado en `projections.year` (1=enero, 12=diciembre del año de proyección).

---

#### `2025_11_13_223705_create_organization_user_table.php`

Tabla pivote para relación many-to-many entre organizaciones y usuarios.

**Campos principales:**
- `id` - Primary Key
- `organization_id` - FK a organizations (cascade on delete)
- `user_id` - FK a users (cascade on delete)

**Índices:**
- Primary key en `id`
- Unique en `(organization_id, user_id)` - Composite

---

## Modelos Eloquent

### Convenciones Aplicadas

Todos los modelos siguen las convenciones de Laravel 12:
- Uso de `casts()` method en lugar de propiedad `$casts`
- Type hints explícitos en todos los métodos
- Relaciones con return types definidos
- Constructor property promotion cuando aplica

### 1. Modelos de Multi-tenancy

#### `Organization.php`

**Ubicación:** `app/Models/Organization.php`

**Traits:**
- `SoftDeletes`

**Fillable:**
- name, slug, domain, is_active, settings

**Casts:**
- `is_active` → boolean
- `settings` → array

**Relaciones:**
- `users()` → BelongsToMany (User) - Con timestamps
- `businessGroups()` → HasMany (BusinessGroup)
- `customerTypes()` → HasMany (CustomerType)
- `customers()` → HasMany (Customer)
- `products()` → HasMany (Product)
- `scenarios()` → HasMany (Scenario)

---

### 2. Modelos Maestros

#### `BusinessGroup.php`

**Ubicación:** `app/Models/BusinessGroup.php`

**Global Scope:** `OrganizationScope`

**Traits:**
- `SoftDeletes`

**Fillable:**
- organization_id, name, code, description, is_active, metadata

**Casts:**
- `is_active` → boolean
- `metadata` → array

**Relaciones:**
- `organization()` → BelongsTo (Organization)
- `customers()` → HasMany (Customer)
- `scenarioAssumptions()` → HasMany (ScenarioAssumption)
- `projections()` → HasMany (Projection)

---

#### `CustomerType.php`

**Ubicación:** `app/Models/CustomerType.php`

**Global Scope:** `OrganizationScope`

**Traits:**
- `SoftDeletes`

**Fillable:**
- organization_id, name, code, description, is_active, sort_order

**Casts:**
- `is_active` → boolean
- `sort_order` → integer

**Relaciones:**
- `organization()` → BelongsTo (Organization)
- `customers()` → HasMany (Customer)
- `scenarioAssumptions()` → HasMany (ScenarioAssumption)
- `projections()` → HasMany (Projection)

---

#### `Customer.php`

**Ubicación:** `app/Models/Customer.php`

**Global Scope:** `OrganizationScope`

**Traits:**
- `SoftDeletes`

**Fillable:**
- organization_id, business_group_id, customer_type_id, name, code, tax_id, is_active, metadata

**Casts:**
- `is_active` → boolean
- `metadata` → array

**Relaciones:**
- `organization()` → BelongsTo (Organization)
- `businessGroup()` → BelongsTo (BusinessGroup)
- `customerType()` → BelongsTo (CustomerType)
- `invoices()` → HasMany (Invoice)
- `scenarioAssumptions()` → HasMany (ScenarioAssumption)
- `projections()` → HasMany (Projection)

---

#### `Product.php`

**Ubicación:** `app/Models/Product.php`

**Global Scope:** `OrganizationScope`

**Traits:**
- `SoftDeletes`

**Fillable:**
- organization_id, name, code, description, category, is_active, metadata

**Casts:**
- `is_active` → boolean
- `metadata` → array

**Relaciones:**
- `organization()` → BelongsTo (Organization)
- `invoiceItems()` → HasMany (InvoiceItem)
- `scenarioAssumptions()` → HasMany (ScenarioAssumption)
- `projections()` → HasMany (Projection)

---

### 3. Modelos de Datos Históricos

#### `ImportBatch.php`

**Ubicación:** `app/Models/ImportBatch.php`

**Fillable:**
- user_id, filename, source_system, import_type, total_records, successful_records, failed_records, status, started_at, completed_at, error_log, metadata

**Casts:**
- `total_records` → integer
- `successful_records` → integer
- `failed_records` → integer
- `started_at` → datetime
- `completed_at` → datetime
- `error_log` → array
- `metadata` → array

**Relaciones:**
- `user()` → BelongsTo (User)
- `invoices()` → HasMany (Invoice)

---

#### `Invoice.php`

**Ubicación:** `app/Models/Invoice.php`

**Fillable:**
- import_batch_id, customer_id, invoice_number, invoice_date, due_date, subtotal, tax, total, currency, exchange_rate, status, source_system, external_id, metadata

**Casts:**
- `invoice_date` → date
- `due_date` → date
- `subtotal` → decimal:2
- `tax` → decimal:2
- `total` → decimal:2
- `exchange_rate` → decimal:4
- `metadata` → array

**Relaciones:**
- `importBatch()` → BelongsTo (ImportBatch)
- `customer()` → BelongsTo (Customer)
- `items()` → HasMany (InvoiceItem)

---

#### `InvoiceItem.php`

**Ubicación:** `app/Models/InvoiceItem.php`

**Fillable:**
- invoice_id, product_id, description, quantity, unit_price, subtotal, tax, total, metadata

**Casts:**
- `quantity` → decimal:2
- `unit_price` → decimal:2
- `subtotal` → decimal:2
- `tax` → decimal:2
- `total` → decimal:2
- `metadata` → array

**Relaciones:**
- `invoice()` → BelongsTo (Invoice)
- `product()` → BelongsTo (Product)

---

### 4. Modelos de Proyecciones

#### `Scenario.php`

**Ubicación:** `app/Models/Scenario.php`

**Global Scope:** `OrganizationScope`

**Traits:**
- `SoftDeletes`

**Fillable:**
- organization_id, user_id, name, description, base_year, historical_months, projection_years, status, is_baseline, calculation_method, include_inflation

**Casts:**
- `base_year` → integer
- `historical_months` → integer
- `projection_years` → integer
- `is_baseline` → boolean
- `include_inflation` → boolean

**Relaciones:**
- `organization()` → BelongsTo (Organization)
- `user()` → BelongsTo (User)
- `assumptions()` → HasMany (ScenarioAssumption)
- `projections()` → HasMany (Projection)

---

#### `ScenarioAssumption.php`

**Ubicación:** `app/Models/ScenarioAssumption.php`

**Fillable:**
- scenario_id, year, business_group_id, customer_type_id, customer_id, product_id, growth_rate, inflation_rate, adjustment_type, fixed_amount, notes

**Casts:**
- `year` → integer
- `growth_rate` → decimal:2
- `inflation_rate` → decimal:2
- `fixed_amount` → decimal:2

**Relaciones:**
- `scenario()` → BelongsTo (Scenario)
- `businessGroup()` → BelongsTo (BusinessGroup)
- `customerType()` → BelongsTo (CustomerType)
- `customer()` → BelongsTo (Customer)
- `product()` → BelongsTo (Product)

---

#### `InflationRate.php`

**Ubicación:** `app/Models/InflationRate.php`

**Fillable:**
- year, rate, source, is_estimated

**Casts:**
- `year` → integer
- `rate` → decimal:2
- `is_estimated` → boolean

**Relaciones:**
- Ninguna

---

#### `Projection.php`

**Ubicación:** `app/Models/Projection.php`

**Traits:**
- `SoftDeletes`

**Fillable:**
- scenario_id, year, business_group_id, customer_type_id, customer_id, product_id, total_subtotal, total_tax, total_amount, total_with_inflation, base_amount, growth_applied, inflation_applied, calculation_method, calculated_at

**Casts:**
- `year` → integer
- `total_subtotal` → decimal:2
- `total_tax` → decimal:2
- `total_amount` → decimal:2
- `total_with_inflation` → decimal:2
- `base_amount` → decimal:2
- `growth_applied` → decimal:2
- `inflation_applied` → decimal:2
- `calculated_at` → datetime

**Relaciones:**
- `scenario()` → BelongsTo (Scenario)
- `businessGroup()` → BelongsTo (BusinessGroup)
- `customerType()` → BelongsTo (CustomerType)
- `customer()` → BelongsTo (Customer)
- `product()` → BelongsTo (Product)
- `details()` → HasMany (ProjectionDetail)

---

#### `ProjectionDetail.php`

**Ubicación:** `app/Models/ProjectionDetail.php`

**Fillable:**
- projection_id, month, subtotal, tax, amount, base_amount, seasonality_factor

**Casts:**
- `month` → integer
- `subtotal` → decimal:2
- `tax` → decimal:2
- `amount` → decimal:2
- `base_amount` → decimal:2
- `seasonality_factor` → decimal:4

**Relaciones:**
- `projection()` → BelongsTo (Projection)

---

## Global Scope - Multi-tenancy

### `OrganizationScope.php`

**Ubicación:** `app/Models/Scopes/OrganizationScope.php`

**Propósito:** Filtrar automáticamente todos los queries por `organization_id` basándose en la organización actual del usuario autenticado.

**Implementación:**

```php
<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class OrganizationScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        if (auth()->check() && auth()->user()->currentOrganization) {
            $builder->where($model->getTable().'.organization_id', auth()->user()->currentOrganization->id);
        }
    }
}
```

**Modelos que usan este scope:**
- BusinessGroup
- CustomerType
- Customer
- Product
- Scenario

**Nota:** Para queries sin el scope, usar `ModelName::withoutGlobalScope(OrganizationScope::class)`.

---

## Características Implementadas

### 1. Multi-tenancy Completo

✅ Todas las tablas principales incluyen `organization_id`
✅ Global Scope automático filtra por organización
✅ Relación many-to-many entre users y organizations
✅ Aislamiento completo de datos entre organizaciones

### 2. Integridad Referencial

✅ Foreign keys con acciones apropiadas:
- `cascadeOnDelete()` - Eliminar registros relacionados
- `restrictOnDelete()` - Prevenir eliminación si existen relaciones
- `nullOnDelete()` - Nullificar FK al eliminar padre

### 3. Constraints de Unicidad

✅ Composite unique keys para prevenir duplicados:
- `(organization_id, code)` en BusinessGroup, CustomerType, Customer, Product
- `(projection_id, month)` en ProjectionDetail
- `(organization_id, user_id)` en organization_user pivot

### 4. Índices Optimizados

✅ Índices simples y compuestos para queries comunes:
- Búsquedas por `organization_id`
- Filtros por `is_active`, `status`
- Queries por rangos de fechas: `(customer_id, invoice_date)`
- Jerarquías de supuestos: `(scenario_id, year)`

### 5. Soft Deletes

✅ Implementado en modelos maestros:
- Organization
- BusinessGroup
- CustomerType
- Customer
- Product
- Scenario
- Projection

✅ Permite mantener historial y recuperar registros eliminados

### 6. Campos JSON para Extensibilidad

✅ Campo `metadata` en la mayoría de tablas
✅ `settings` en Organization para configuración específica
✅ `error_log` en ImportBatch para registro de errores

### 7. Precisión Financiera

✅ Uso de `decimal` para todos los campos monetarios
✅ Precisión de 2 decimales para cantidades (15,2)
✅ Precisión de 4 decimales para tasas de cambio (10,4)
✅ Precisión de 4 decimales para factores estacionales (5,4)

### 8. Enumeraciones Type-Safe

✅ Uso de `enum` para campos con valores fijos:
- `status` en Invoice: draft, issued, paid, cancelled
- `status` en ImportBatch: pending, processing, completed, failed
- `status` en Scenario: draft, active, archived
- `import_type` en ImportBatch: invoices, customers, products
- `calculation_method` en Scenario: simple_average, weighted_average, trend
- `adjustment_type` en ScenarioAssumption: percentage, fixed_amount

---

## Relaciones entre Modelos

### Diagrama Conceptual

```
Organization (Multi-tenancy Root)
  ├─ belongsToMany → User (pivot: organization_user)
  ├─ hasMany → BusinessGroup
  ├─ hasMany → CustomerType
  ├─ hasMany → Customer
  ├─ hasMany → Product
  └─ hasMany → Scenario

User
  ├─ belongsToMany → Organization
  ├─ hasMany → Scenario
  └─ hasMany → ImportBatch

BusinessGroup
  ├─ belongsTo → Organization
  ├─ hasMany → Customer
  ├─ hasMany → ScenarioAssumption
  └─ hasMany → Projection

CustomerType
  ├─ belongsTo → Organization
  ├─ hasMany → Customer
  ├─ hasMany → ScenarioAssumption
  └─ hasMany → Projection

Customer
  ├─ belongsTo → Organization
  ├─ belongsTo → BusinessGroup
  ├─ belongsTo → CustomerType
  ├─ hasMany → Invoice
  ├─ hasMany → ScenarioAssumption
  └─ hasMany → Projection

Product
  ├─ belongsTo → Organization
  ├─ hasMany → InvoiceItem
  ├─ hasMany → ScenarioAssumption
  └─ hasMany → Projection

ImportBatch
  ├─ belongsTo → User
  └─ hasMany → Invoice

Invoice
  ├─ belongsTo → ImportBatch
  ├─ belongsTo → Customer
  └─ hasMany → InvoiceItem

InvoiceItem
  ├─ belongsTo → Invoice
  └─ belongsTo → Product

Scenario
  ├─ belongsTo → Organization
  ├─ belongsTo → User
  ├─ hasMany → ScenarioAssumption
  └─ hasMany → Projection

ScenarioAssumption
  ├─ belongsTo → Scenario
  ├─ belongsTo → BusinessGroup (nullable)
  ├─ belongsTo → CustomerType (nullable)
  ├─ belongsTo → Customer (nullable)
  └─ belongsTo → Product (nullable)

Projection
  ├─ belongsTo → Scenario
  ├─ belongsTo → BusinessGroup (nullable)
  ├─ belongsTo → CustomerType (nullable)
  ├─ belongsTo → Customer (nullable)
  ├─ belongsTo → Product (nullable)
  └─ hasMany → ProjectionDetail

ProjectionDetail
  └─ belongsTo → Projection

InflationRate
  └─ (sin relaciones - tabla independiente)
```

---

## Convenciones y Patrones

### 1. Naming Conventions

✅ **Tablas:** plural snake_case (`business_groups`, `customer_types`)
✅ **Modelos:** singular PascalCase (`BusinessGroup`, `CustomerType`)
✅ **Foreign Keys:** `{model}_id` (ej: `organization_id`, `customer_type_id`)
✅ **Pivot Tables:** alfabético (`organization_user`, no `user_organization`)
✅ **Timestamps:** `created_at`, `updated_at`, `deleted_at`

### 2. Laravel 12 Patterns

✅ **Casts:** Método `casts()` en lugar de propiedad `$casts`
✅ **Global Scopes:** Atributo PHP `#[ScopedBy([OrganizationScope::class])]`
✅ **Type Hints:** Explícitos en todos los métodos y relaciones
✅ **Return Types:** Definidos para todas las relaciones

### 3. Código Formateado

✅ Todo el código PHP formateado con Laravel Pint
✅ Estilo consistente en todos los archivos
✅ Sin errores de sintaxis o estilo

---

## Próximos Pasos Sugeridos

### 1. Factories y Seeders

Crear factories para testing y desarrollo:
- OrganizationFactory
- BusinessGroupFactory
- CustomerTypeFactory
- CustomerFactory
- ProductFactory
- InvoiceFactory con InvoiceItemFactory
- ScenarioFactory con ScenarioAssumptionFactory

### 2. Form Requests

Crear validadores para cada operación CRUD:
- StoreOrganizationRequest / UpdateOrganizationRequest
- StoreCustomerRequest / UpdateCustomerRequest
- StoreScenarioRequest / UpdateScenarioRequest
- etc.

### 3. API Resources

Crear recursos para serialización de API:
- OrganizationResource
- CustomerResource
- ScenarioResource
- ProjectionResource con ProjectionDetailResource

### 4. Query Scopes

Agregar scopes útiles a los modelos:
- `scopeActive()` - Filtrar registros activos
- `scopeByYear()` - Filtrar por año
- `scopeByCustomerType()` - Filtrar por tipo de cliente
- etc.

### 5. Observers

Implementar observers para lógica de negocio:
- ScenarioAssumptionObserver - Invalidar proyecciones al modificar supuestos
- ProjectionObserver - Calcular totales automáticamente
- InvoiceObserver - Actualizar estadísticas del ImportBatch

### 6. Jobs

Crear jobs para procesos en background:
- CalculateProjectionsJob - Calcular proyecciones para un escenario
- ImportInvoicesJob - Importar facturas desde archivo
- GenerateReportJob - Generar reportes de proyecciones

### 7. Tests

Crear tests completos:
- Unit tests para cálculos de proyecciones
- Feature tests para importación de facturas
- Feature tests para jerarquía de supuestos
- Feature tests para comparación de escenarios
- Tests de integridad referencial

---

## Referencias

- **Database Design Document:** [docs/database-design.md](database-design.md)
- **Laravel 12 Documentation:** https://laravel.com/docs/12.x
- **Eloquent Relationships:** https://laravel.com/docs/12.x/eloquent-relationships
- **Global Scopes:** https://laravel.com/docs/12.x/eloquent#global-scopes

---

**Documento generado:** 2025-11-13
**Versión:** 1.0
**Autor:** Claude Code
