# Database Design - Sistema de Proyección de Ingresos

## Resumen Ejecutivo

Este documento describe la arquitectura de base de datos para el sistema de proyección de ingresos, diseñado para importar datos históricos de facturas y generar proyecciones anuales con detalle mensual, considerando múltiples escenarios, tipos de cliente, grupos empresariales y productos.

---

## Índice

1. [Modelos de Datos Históricos](#1-modelos-de-datos-históricos)
2. [Modelos de Configuración](#2-modelos-de-configuración)
3. [Modelos de Proyección](#3-modelos-de-proyección)
4. [Modelos de Control](#4-modelos-de-control)
5. [Relaciones](#5-relaciones)
6. [Índices y Optimización](#6-índices-y-optimización)
7. [Casos de Uso](#7-casos-de-uso)

---

## 1. Modelos de Datos Históricos

### `BusinessGroup` (Grupos Empresariales)

Agrupa múltiples clientes bajo una misma entidad empresarial.

**Campos:**
- `id` - bigint, PK
- `name` - string(255)
- `code` - string(50), unique
- `description` - text, nullable
- `is_active` - boolean, default true
- `metadata` - json, nullable (datos adicionales)
- `created_at` - timestamp
- `updated_at` - timestamp
- `deleted_at` - timestamp, nullable

**Índices:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`code`)
- INDEX (`is_active`)

---

### `CustomerType` (Tipos de Cliente)

Define categorías de clientes (Fondos, Afores, Otros).

**Campos:**
- `id` - bigint, PK
- `name` - string(255)
- `code` - string(50), unique
- `description` - text, nullable
- `is_active` - boolean, default true
- `sort_order` - integer, default 0 (para ordenar en UI)
- `created_at` - timestamp
- `updated_at` - timestamp
- `deleted_at` - timestamp, nullable

**Índices:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`code`)
- INDEX (`is_active`, `sort_order`)

---

### `Customer` (Clientes)

Clientes individuales asociados a grupos empresariales y tipos.

**Campos:**
- `id` - bigint, PK
- `business_group_id` - bigint, FK, nullable
- `customer_type_id` - bigint, FK
- `name` - string(255)
- `code` - string(50), unique
- `tax_id` - string(50), nullable (RFC/Tax ID)
- `is_active` - boolean, default true
- `metadata` - json, nullable
- `created_at` - timestamp
- `updated_at` - timestamp
- `deleted_at` - timestamp, nullable

**Índices:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`code`)
- INDEX (`business_group_id`)
- INDEX (`customer_type_id`)
- INDEX (`is_active`)

**Relaciones:**
- `belongsTo(BusinessGroup)`
- `belongsTo(CustomerType)`
- `hasMany(Invoice)`

---

### `Product` (Productos/Servicios)

Productos o servicios facturados.

**Campos:**
- `id` - bigint, PK
- `name` - string(255)
- `code` - string(50), unique
- `description` - text, nullable
- `category` - string(100), nullable
- `is_active` - boolean, default true
- `metadata` - json, nullable
- `created_at` - timestamp
- `updated_at` - timestamp
- `deleted_at` - timestamp, nullable

**Índices:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`code`)
- INDEX (`category`)
- INDEX (`is_active`)

**Relaciones:**
- `hasMany(InvoiceItem)`

---

### `Invoice` (Facturas)

Facturas importadas de sistemas externos.

**Campos:**
- `id` - bigint, PK
- `import_batch_id` - bigint, FK, nullable
- `customer_id` - bigint, FK
- `invoice_number` - string(100)
- `invoice_date` - date
- `due_date` - date, nullable
- `subtotal` - decimal(15,2)
- `tax` - decimal(15,2)
- `total` - decimal(15,2)
- `currency` - string(3), default 'MXN'
- `exchange_rate` - decimal(10,4), default 1.0000
- `status` - enum('draft', 'issued', 'paid', 'cancelled'), default 'issued'
- `source_system` - string(50), nullable
- `external_id` - string(100), nullable
- `metadata` - json, nullable
- `created_at` - timestamp
- `updated_at` - timestamp

**Índices:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`invoice_number`)
- INDEX (`customer_id`, `invoice_date`)
- INDEX (`import_batch_id`)
- INDEX (`invoice_date`)
- INDEX (`status`)

**Relaciones:**
- `belongsTo(Customer)`
- `belongsTo(ImportBatch)`
- `hasMany(InvoiceItem)`

---

### `InvoiceItem` (Detalle de Facturas)

Líneas de detalle de cada factura.

**Campos:**
- `id` - bigint, PK
- `invoice_id` - bigint, FK
- `product_id` - bigint, FK
- `description` - text
- `quantity` - decimal(10,2)
- `unit_price` - decimal(15,2)
- `subtotal` - decimal(15,2)
- `tax` - decimal(15,2)
- `total` - decimal(15,2)
- `metadata` - json, nullable
- `created_at` - timestamp
- `updated_at` - timestamp

**Índices:**
- PRIMARY KEY (`id`)
- INDEX (`invoice_id`)
- INDEX (`product_id`)

**Relaciones:**
- `belongsTo(Invoice)`
- `belongsTo(Product)`

---

## 2. Modelos de Configuración

### `Scenario` (Escenarios de Proyección)

Define escenarios de proyección con diferentes supuestos.

**Campos:**
- `id` - bigint, PK
- `user_id` - bigint, FK
- `name` - string(255)
- `description` - text, nullable
- `base_year` - integer (año base para cálculos)
- `historical_months` - integer, default 12 (N meses para promedio)
- `projection_years` - integer, default 3 (años a proyectar)
- `status` - enum('draft', 'active', 'archived'), default 'draft'
- `is_baseline` - boolean, default false
- `calculation_method` - enum('simple_average', 'weighted_average', 'trend'), default 'simple_average'
- `include_inflation` - boolean, default true
- `created_at` - timestamp
- `updated_at` - timestamp
- `deleted_at` - timestamp, nullable

**Índices:**
- PRIMARY KEY (`id`)
- INDEX (`user_id`)
- INDEX (`status`)
- INDEX (`is_baseline`)

**Relaciones:**
- `belongsTo(User)`
- `hasMany(ScenarioAssumption)`
- `hasMany(Projection)`

---

### `ScenarioAssumption` (Supuestos por Escenario)

Supuestos de crecimiento que pueden variar por año, tipo de cliente, grupo empresarial y producto.

**Campos:**
- `id` - bigint, PK
- `scenario_id` - bigint, FK
- `year` - integer (año de aplicación)
- `business_group_id` - bigint, FK, nullable (null = aplica a todos)
- `customer_type_id` - bigint, FK, nullable (null = aplica a todos)
- `customer_id` - bigint, FK, nullable (null = aplica a todos)
- `product_id` - bigint, FK, nullable (null = aplica a todos)
- `growth_rate` - decimal(5,2) (porcentaje, ej: 5.50 para 5.5%)
- `inflation_rate` - decimal(5,2), nullable (si es diferente a la general)
- `adjustment_type` - enum('percentage', 'fixed_amount'), default 'percentage'
- `fixed_amount` - decimal(15,2), nullable
- `notes` - text, nullable
- `created_at` - timestamp
- `updated_at` - timestamp

**Índices:**
- PRIMARY KEY (`id`)
- INDEX (`scenario_id`, `year`)
- INDEX (`business_group_id`)
- INDEX (`customer_type_id`)
- INDEX (`customer_id`)
- INDEX (`product_id`)

**Reglas de Negocio:**
- Los supuestos más específicos (a nivel cliente/producto) sobrescriben los generales
- Jerarquía: Cliente específico > Grupo empresarial > Tipo de cliente > Global

**Relaciones:**
- `belongsTo(Scenario)`
- `belongsTo(BusinessGroup)`
- `belongsTo(CustomerType)`
- `belongsTo(Customer)`
- `belongsTo(Product)`

---

### `InflationRate` (Tasas de Inflación)

Tasas de inflación por año para cálculos.

**Campos:**
- `id` - bigint, PK
- `year` - integer
- `rate` - decimal(5,2) (porcentaje anual)
- `source` - string(100), nullable (INEGI, Banco de México, etc.)
- `is_estimated` - boolean, default false
- `created_at` - timestamp
- `updated_at` - timestamp

**Índices:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`year`)

---

## 3. Modelos de Proyección

### `Projection` (Proyección Anual)

Proyecciones consolidadas por año y dimensión.

**Campos:**
- `id` - bigint, PK
- `scenario_id` - bigint, FK
- `year` - integer
- `business_group_id` - bigint, FK, nullable
- `customer_type_id` - bigint, FK, nullable
- `customer_id` - bigint, FK, nullable
- `product_id` - bigint, FK, nullable
- `total_amount` - decimal(15,2)
- `total_with_inflation` - decimal(15,2)
- `base_amount` - decimal(15,2) (promedio histórico sin ajustes)
- `growth_applied` - decimal(5,2) (% de crecimiento aplicado)
- `inflation_applied` - decimal(5,2) (% de inflación aplicado)
- `calculation_method` - string(50)
- `calculated_at` - timestamp
- `created_at` - timestamp
- `updated_at` - timestamp

**Índices:**
- PRIMARY KEY (`id`)
- INDEX (`scenario_id`, `year`)
- INDEX (`business_group_id`)
- INDEX (`customer_type_id`)
- INDEX (`customer_id`)
- INDEX (`product_id`)
- UNIQUE KEY (`scenario_id`, `year`, `business_group_id`, `customer_type_id`, `customer_id`, `product_id`)

**Relaciones:**
- `belongsTo(Scenario)`
- `belongsTo(BusinessGroup)`
- `belongsTo(CustomerType)`
- `belongsTo(Customer)`
- `belongsTo(Product)`
- `hasMany(ProjectionDetail)`

---

### `ProjectionDetail` (Detalle Mensual de Proyección)

Desagregación mensual de cada proyección anual.

**Campos:**
- `id` - bigint, PK
- `projection_id` - bigint, FK
- `month` - tinyint (1-12)
- `amount` - decimal(15,2)
- `base_amount` - decimal(15,2) (sin ajustes)
- `seasonality_factor` - decimal(5,4), default 1.0000 (factor estacional)
- `created_at` - timestamp
- `updated_at` - timestamp

**Índices:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`projection_id`, `month`)
- INDEX (`projection_id`)

**Relaciones:**
- `belongsTo(Projection)`

---

## 4. Modelos de Control

### `ImportBatch` (Control de Importaciones)

Registro de lotes de importación de datos históricos.

**Campos:**
- `id` - bigint, PK
- `user_id` - bigint, FK
- `filename` - string(255)
- `source_system` - string(50)
- `import_type` - enum('invoices', 'customers', 'products'), default 'invoices'
- `total_records` - integer, default 0
- `successful_records` - integer, default 0
- `failed_records` - integer, default 0
- `status` - enum('pending', 'processing', 'completed', 'failed'), default 'pending'
- `started_at` - timestamp, nullable
- `completed_at` - timestamp, nullable
- `error_log` - json, nullable
- `metadata` - json, nullable
- `created_at` - timestamp
- `updated_at` - timestamp

**Índices:**
- PRIMARY KEY (`id`)
- INDEX (`user_id`)
- INDEX (`status`)
- INDEX (`import_type`)

**Relaciones:**
- `belongsTo(User)`
- `hasMany(Invoice)`

---

## 5. Relaciones

### Diagrama de Relaciones Principal

```
User (Laravel Auth)
  ├─ hasMany → Scenario
  └─ hasMany → ImportBatch

BusinessGroup
  ├─ hasMany → Customer
  ├─ hasMany → ScenarioAssumption
  └─ hasMany → Projection

CustomerType
  ├─ hasMany → Customer
  ├─ hasMany → ScenarioAssumption
  └─ hasMany → Projection

Customer
  ├─ belongsTo → BusinessGroup
  ├─ belongsTo → CustomerType
  ├─ hasMany → Invoice
  ├─ hasMany → ScenarioAssumption
  └─ hasMany → Projection

Product
  ├─ hasMany → InvoiceItem
  ├─ hasMany → ScenarioAssumption
  └─ hasMany → Projection

Invoice
  ├─ belongsTo → Customer
  ├─ belongsTo → ImportBatch
  └─ hasMany → InvoiceItem

InvoiceItem
  ├─ belongsTo → Invoice
  └─ belongsTo → Product

Scenario
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

ImportBatch
  ├─ belongsTo → User
  └─ hasMany → Invoice
```

---

## 6. Índices y Optimización

### Índices Compuestos Críticos

Para optimizar consultas de reporting y proyección:

#### Tabla `invoices`
```sql
INDEX idx_customer_date (customer_id, invoice_date)
INDEX idx_date_range (invoice_date, status)
```

#### Tabla `invoice_items`
```sql
INDEX idx_invoice_product (invoice_id, product_id)
```

#### Tabla `projections`
```sql
INDEX idx_scenario_year (scenario_id, year)
INDEX idx_multi_dimension (scenario_id, year, business_group_id, customer_type_id)
```

#### Tabla `scenario_assumptions`
```sql
INDEX idx_scenario_year_hierarchy (scenario_id, year, customer_id, product_id)
```

### Consideraciones de Performance

1. **Particionamiento**: Considerar particionar `invoices` por año si el volumen crece significativamente
2. **Materialización**: Las proyecciones son pre-calculadas y almacenadas (no en tiempo real)
3. **Caché**: Usar caché de Redis para escenarios activos y comparativas frecuentes
4. **Soft Deletes**: Solo en modelos maestros (CustomerType, BusinessGroup, Customer, Product, Scenario)

---

## 7. Casos de Uso

### Caso 1: Importar Facturas Históricas

```php
// 1. Crear ImportBatch
$batch = ImportBatch::create([...]);

// 2. Procesar archivo y crear Invoices + InvoiceItems
// 3. Actualizar estadísticas del batch
```

### Caso 2: Crear Escenario con Supuestos

```php
// 1. Crear Scenario
$scenario = Scenario::create([
    'name' => 'Escenario Conservador 2025',
    'base_year' => 2024,
    'historical_months' => 12,
    'projection_years' => 3,
]);

// 2. Definir supuestos globales por tipo de cliente
ScenarioAssumption::create([
    'scenario_id' => $scenario->id,
    'year' => 2025,
    'customer_type_id' => $fondosType->id,
    'growth_rate' => 5.5, // 5.5%
]);

// 3. Supuesto específico para un cliente
ScenarioAssumption::create([
    'scenario_id' => $scenario->id,
    'year' => 2025,
    'customer_id' => $clienteImportante->id,
    'growth_rate' => 8.0, // 8%
]);
```

### Caso 3: Calcular Proyecciones

```php
// 1. Obtener datos históricos
$historical = Invoice::with('items.product')
    ->where('customer_id', $customer->id)
    ->whereBetween('invoice_date', [$startDate, $endDate])
    ->get();

// 2. Calcular promedio mensual
$monthlyAverage = calculateMonthlyAverage($historical);

// 3. Aplicar supuestos del escenario (growth + inflation)
$assumptions = getApplicableAssumptions($scenario, $customer, $product, $year);

// 4. Generar Projection + ProjectionDetail (12 meses)
$projection = Projection::create([...]);
foreach ($months as $month) {
    ProjectionDetail::create([...]);
}
```

### Caso 4: Comparar Escenarios

```php
// Obtener proyecciones de múltiples escenarios para el mismo año
$comparison = Projection::whereIn('scenario_id', [$scenario1->id, $scenario2->id])
    ->where('year', 2025)
    ->where('customer_type_id', $fondosType->id)
    ->get()
    ->groupBy('scenario_id');
```

---

## Reglas de Negocio Implementadas

### Jerarquía de Supuestos (de más específico a más general)

1. Cliente + Producto específicos
2. Cliente específico (todos los productos)
3. Grupo Empresarial + Producto
4. Grupo Empresarial (todos los productos)
5. Tipo de Cliente + Producto
6. Tipo de Cliente (todos los productos)
7. Global (sin filtros)

### Cálculo de Proyecciones

```
ProyecciónMensual = PromedioHistórico × (1 + TasaCrecimiento/100) × (1 + Inflación/100) × FactorEstacionalidad
ProyecciónAnual = Σ(ProyeccionMensual[1..12])
```

### Recalculo de Proyecciones

- Al modificar un `ScenarioAssumption`, eliminar todas las `Projection` asociadas al escenario
- Recalcular bajo demanda o en background job
- Marcar el escenario como `draft` durante recalculo

---

## Migraciones Sugeridas (Orden de Ejecución)

1. `create_business_groups_table`
2. `create_customer_types_table`
3. `create_customers_table`
4. `create_products_table`
5. `create_import_batches_table`
6. `create_invoices_table`
7. `create_invoice_items_table`
8. `create_scenarios_table`
9. `create_inflation_rates_table`
10. `create_scenario_assumptions_table`
11. `create_projections_table`
12. `create_projection_details_table`

---

## Extensibilidad Futura

### Posibles Ampliaciones

- **Múltiples monedas**: Ya contemplado en `invoices.currency` y `exchange_rate`
- **Diferentes métodos de cálculo**: Enum `calculation_method` permite agregar nuevos métodos
- **Segmentación adicional**: Campo `metadata` (JSON) en todos los modelos permite datos extra
- **Aprobación de escenarios**: Agregar workflow con estados adicionales
- **Versioning de proyecciones**: Agregar campo `version` a `Projection` si se requiere historial
- **Alertas y notificaciones**: Cuando proyecciones varían significativamente del histórico

---

## Notas de Implementación

### Factories y Seeders

Crear factories robustos para:
- `BusinessGroup`, `CustomerType`, `Customer`, `Product` (maestros)
- `Invoice` con `InvoiceItem` relacionados
- `Scenario` con `ScenarioAssumption`

### Tests Importantes

- Importación de facturas con validaciones
- Cálculo de proyecciones con diferentes supuestos
- Jerarquía de supuestos (que el más específico prevalezca)
- Comparación de escenarios
- Recalculo de proyecciones al cambiar supuestos

### Observaciones Laravel

- Usar **Eloquent Events** en `ScenarioAssumption` para invalidar proyecciones
- **Jobs** para calcular proyecciones en background
- **API Resources** para exponer proyecciones y comparativas
- **Query Scopes** para filtros comunes (active, by year, by customer type, etc.)

---

**Documento generado:** 2025-11-13
**Versión:** 1.0
**Autor:** Claude Code
