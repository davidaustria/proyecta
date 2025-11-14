# Plan de Implementación - Sistema de Proyección de Ingresos

**Fecha de creación:** 2025-11-13
**Versión:** 1.0
**Estado:** En Progreso

---

## Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Decisiones Técnicas](#decisiones-técnicas)
3. [Fases de Implementación](#fases-de-implementación)
4. [Checklist de Progreso](#checklist-de-progreso)
5. [Dependencias entre Fases](#dependencias-entre-fases)
6. [Riesgos y Mitigaciones](#riesgos-y-mitigaciones)

---

## Resumen Ejecutivo

Este documento define el plan de implementación completo del Sistema de Proyección de Ingresos, organizado en 10 fases secuenciales. El sistema permitirá:

- Gestión de escenarios de proyección con múltiples supuestos
- Cálculo de proyecciones basadas en datos históricos de facturas
- Visualización interactiva de proyecciones con comparativas
- Importación masiva de datos históricos
- Generación de reportes y exportaciones

**Path Crítico (MVP):**
Fase 1 → Fase 2 → Fase 5 → Fase 6

**Duración Estimada Total:** 8-10 semanas
**Duración MVP:** 4-5 semanas

---

## Decisiones Técnicas

### 1. Cálculo de Proyecciones
**Decisión:** Cálculo **sincrónico** en primera etapa
**Razón:** Simplifica la implementación inicial y el debugging. Se migrará a asíncrono en Fase 10 si el volumen lo requiere.
**Implicación:** Los usuarios esperarán durante el cálculo (mostrar loading state con progress feedback)

### 2. Granularidad de Proyecciones
**Decisión:** Proyecciones **agregadas** por defecto (Tipo Cliente, Grupo Empresarial)
**Razón:** Optimiza performance y simplifica la UI inicial
**Implicación:** Se puede implementar drill-down cliente×producto bajo demanda en futuras iteraciones

### 3. Factores Estacionales
**Decisión:** Ingreso **manual** de factores estacionales
**Razón:** Mayor control para el usuario, evita complejidad de detección automática
**Implicación:** Se agregará campo de factores estacionales en la UI de supuestos (array de 12 valores para cada mes)

### 4. Importación de Datos
**Decisión:** Soporte **exclusivo para Excel** (XLSX)
**Validaciones:**
- Duplicados por `invoice_number` (único global)
- Duplicados por combinación `Invoice → Customer → BusinessGroup` (validación lógica)
- Validación de integridad referencial (customer_id, product_id existan)

**Implicación:** Usar biblioteca `maatwebsite/excel` para procesamiento

### 5. Multi-tenancy
**Decisión:** **Una organización activa por usuario**
**Razón:** Simplifica la UX inicial, el Global Scope maneja el filtrado automáticamente
**Implicación:** No se requiere selector de organización en el UI por ahora

---

## Fases de Implementación

### **FASE 1: API Backend - Lógica de Cálculo de Proyecciones** ⏳
**Duración:** 1 semana
**Objetivo:** Implementar el motor de cálculo de proyecciones

#### 1.1 Servicios de Cálculo
- [ ] **`ProjectionCalculatorService`** - Servicio principal de cálculo
  - [ ] Método `calculateForScenario(Scenario $scenario): void`
  - [ ] Método `calculateMonthlyDistribution($annualAmount, $seasonalityFactors): array`
  - [ ] Método `applyGrowthAndInflation($baseAmount, $growthRate, $inflationRate): float`
  - [ ] Método `getApplicableAssumption(Scenario, $year, $dimensions): ScenarioAssumption`
  - [ ] Implementar jerarquía de supuestos (cliente > grupo > tipo > global)

- [ ] **`HistoricalDataAnalyzerService`** - Análisis de datos históricos
  - [ ] Método `getAverageMonthlyRevenue(Customer $customer, $startDate, $endDate): float`
  - [ ] Método `getRevenueByProduct(Customer $customer, Product $product, $period): float`
  - [ ] Método `validateSufficientData(Customer $customer, int $requiredMonths): bool`
  - [ ] Método `aggregateInvoicesByPeriod($filters): Collection`

#### 1.2 Observers
- [ ] **`ScenarioAssumptionObserver`**
  - [ ] `updated()` - Invalidar (soft delete) proyecciones del escenario
  - [ ] `deleted()` - Invalidar proyecciones asociadas

- [ ] **`ProjectionObserver`**
  - [ ] `creating()` - Calcular `total_amount` = `total_subtotal` + `total_tax`
  - [ ] `saving()` - Validar que los totales cuadren

#### 1.3 Helpers y Utilities
- [ ] **`AssumptionResolver`** - Clase para resolver jerarquía de supuestos
  - [ ] Método `resolve(Scenario, $year, $dimensions): ?ScenarioAssumption`
  - [ ] Lógica de cascada: cliente→grupo→tipo→global

#### 1.4 Tests Unitarios
- [ ] `ProjectionCalculatorServiceTest`
  - [ ] Test cálculo con crecimiento y inflación
  - [ ] Test distribución mensual con estacionalidad
  - [ ] Test jerarquía de supuestos
- [ ] `HistoricalDataAnalyzerServiceTest`
  - [ ] Test agregación de facturas
  - [ ] Test promedios mensuales
- [ ] `AssumptionResolverTest`
  - [ ] Test resolución de jerarquía completa

**Entregables:**
- Servicios de cálculo funcionales con tests al 100%
- Documentación inline de algoritmos de cálculo

---

### **FASE 2: API Backend - Controladores y Rutas** ⏳
**Duración:** 1.5 semanas
**Objetivo:** Crear endpoints RESTful para toda la funcionalidad

#### 2.1 Form Requests (Validación)
- [ ] `StoreCustomerRequest` / `UpdateCustomerRequest`
- [ ] `StoreCustomerTypeRequest` / `UpdateCustomerTypeRequest`
- [ ] `StoreBusinessGroupRequest` / `UpdateBusinessGroupRequest`
- [ ] `StoreProductRequest` / `UpdateProductRequest`
- [ ] `StoreScenarioRequest` / `UpdateScenarioRequest`
- [ ] `StoreScenarioAssumptionRequest` / `UpdateScenarioAssumptionRequest`
  - [ ] Validar que no exista duplicado según constraint único
  - [ ] Validar que `seasonality_factors` tenga 12 valores si se provee (JSON array)
- [ ] `ImportInvoicesRequest`
  - [ ] Validar archivo Excel
  - [ ] Validar columnas requeridas

#### 2.2 API Resources (Serialización)
- [ ] `CustomerResource`, `CustomerTypeResource`, `BusinessGroupResource`
- [ ] `ProductResource`
- [ ] `ScenarioResource`
  - [ ] Incluir `assumptions` con nested resource
  - [ ] Incluir conteo de proyecciones
- [ ] `ScenarioAssumptionResource`
  - [ ] Incluir relaciones opcionales (customer, product, etc.)
- [ ] `ProjectionResource`
  - [ ] Incluir `details` (monthly breakdown)
  - [ ] Calcular variaciones vs base_amount
- [ ] `ProjectionDetailResource`
- [ ] `InvoiceResource`, `ImportBatchResource`
- [ ] `ScenarioComparisonResource` (custom para comparativas)

#### 2.3 Controladores

**Maestros:**
- [ ] `CustomerController` - CRUD completo
  - [ ] `index()` - Listar con filtros (type, group, active)
  - [ ] `store()` - Crear con validación
  - [ ] `show($id)` - Detalle con invoices count
  - [ ] `update($id)` - Actualizar
  - [ ] `destroy($id)` - Soft delete

- [ ] `CustomerTypeController` - Similar a Customer
- [ ] `BusinessGroupController` - Similar a Customer
- [ ] `ProductController` - Similar a Customer

**Proyecciones:**
- [ ] `ScenarioController`
  - [ ] `index()` - Listar con filtros (status, baseline, user)
  - [ ] `store()` - Crear escenario
  - [ ] `show($id)` - Detalle con assumptions y projections
  - [ ] `update($id)` - Actualizar
  - [ ] `destroy($id)` - Soft delete
  - [ ] `duplicate($id)` - Duplicar escenario con todos sus supuestos
  - [ ] `calculate($id)` - POST para calcular proyecciones (sincrónico)

- [ ] `ScenarioAssumptionController`
  - [ ] `index(scenario_id)` - Listar supuestos de un escenario
  - [ ] `store()` - Crear supuesto
  - [ ] `update($id)` - Actualizar (invalida proyecciones)
  - [ ] `destroy($id)` - Eliminar
  - [ ] `bulkStore()` - POST para crear múltiples supuestos a la vez

- [ ] `ProjectionController`
  - [ ] `index()` - Listar proyecciones con filtros (scenario, year, dimensions)
  - [ ] `show($id)` - Detalle con monthly breakdown
  - [ ] `recalculate($id)` - POST para recalcular proyección específica

- [ ] `ProjectionComparisonController`
  - [ ] `compare()` - POST con array de scenario_ids
  - [ ] Retornar datos comparativos (diferencias, porcentajes)

**Datos Históricos:**
- [ ] `InvoiceController`
  - [ ] `index()` - Listar con filtros (customer, date range, status)
  - [ ] `show($id)` - Detalle con items
  - [ ] `stats()` - GET estadísticas generales (total revenue, count by period)

- [ ] `ImportController`
  - [ ] `upload()` - POST archivo Excel
  - [ ] `preview()` - POST preview de datos antes de importar
  - [ ] `import()` - POST ejecutar importación
  - [ ] `history()` - GET historial de importaciones
  - [ ] `show($batchId)` - Detalle de importación con errores

**Configuración:**
- [ ] `InflationRateController`
  - [ ] `index()` - Listar todas las tasas
  - [ ] `store()` - Crear/actualizar tasa por año
  - [ ] `bulkStore()` - POST para múltiples años

#### 2.4 Rutas API
- [ ] `routes/api.php` - Definir todas las rutas con nombres
  - [ ] Grupo `api/v1/` con prefijo
  - [ ] Middleware `auth:sanctum`
  - [ ] Resource routes para CRUDs
  - [ ] Custom routes para acciones especiales

#### 2.5 Tests de Feature
- [ ] `CustomerControllerTest` - CRUD completo
- [ ] `ScenarioControllerTest`
  - [ ] Test creación de escenario
  - [ ] Test cálculo de proyecciones
  - [ ] Test duplicación
- [ ] `ScenarioAssumptionControllerTest`
  - [ ] Test creación de supuestos
  - [ ] Test invalidación de proyecciones al actualizar
- [ ] `ProjectionComparisonControllerTest`
  - [ ] Test comparación de 2-3 escenarios
- [ ] `ImportControllerTest`
  - [ ] Test importación exitosa
  - [ ] Test detección de duplicados
  - [ ] Test errores de validación

**Entregables:**
- API RESTful completa y documentada
- Tests de feature con cobertura > 80%
- Documentación de endpoints (puede ser Postman collection o OpenAPI)

---

### **FASE 3: Frontend - Infraestructura y Layouts** ⏳
**Duración:** 0.5 semanas
**Objetivo:** Crear la estructura base del frontend

#### 3.1 Layouts y Navegación
- [ ] **`DashboardLayout.tsx`** - Layout principal
  - [ ] Sidebar colapsable
  - [ ] Header con breadcrumbs
  - [ ] Footer
  - [ ] Contenedor de contenido con max-width

- [ ] **`Sidebar.tsx`** - Navegación principal
  - [ ] Sección "Dashboard"
  - [ ] Sección "Escenarios"
  - [ ] Sección "Datos Maestros" (Customers, Types, Groups, Products)
  - [ ] Sección "Importación"
  - [ ] Sección "Configuración" (Inflation Rates)
  - [ ] Active state con Wayfinder
  - [ ] Icons con lucide-react

#### 3.2 Componentes Base Reutilizables
- [ ] **`DataTable.tsx`** - Tabla genérica
  - [ ] Props: columns, data, onSort, onFilter, pagination
  - [ ] Soporte para acciones (edit, delete)
  - [ ] Loading skeleton
  - [ ] Empty state

- [ ] **`StatCard.tsx`** - Cards para KPIs
  - [ ] Props: title, value, icon, trend, trendValue
  - [ ] Variantes: default, success, warning, danger

- [ ] **`ChartCard.tsx`** - Wrapper para gráficas
  - [ ] Header con título y acciones
  - [ ] Loading state
  - [ ] Empty state

- [ ] **`PageHeader.tsx`** - Headers consistentes
  - [ ] Props: title, subtitle, actions (botones)
  - [ ] Breadcrumbs opcionales

- [ ] **`EmptyState.tsx`** - Estados vacíos
  - [ ] Props: icon, title, description, action
  - [ ] Variantes: no-data, no-results, error

- [ ] **`LoadingSpinner.tsx`** - Spinner reutilizable
- [ ] **`ConfirmDialog.tsx`** - Modal de confirmación
- [ ] **`Toast.tsx`** - Sistema de notificaciones (integrar con Sonner)

#### 3.3 Hooks Personalizados
- [ ] **`useInertiaForm.ts`** - Wrapper para Inertia forms con Wayfinder
- [ ] **`useConfirm.ts`** - Hook para confirmaciones
- [ ] **`useToast.ts`** - Hook para notificaciones

#### 3.4 Utilidades
- [ ] **`formatters.ts`** - Funciones de formato
  - [ ] `formatCurrency(amount, currency = 'MXN')`
  - [ ] `formatPercentage(value, decimals = 2)`
  - [ ] `formatDate(date, format = 'DD/MM/YYYY')`

- [ ] **`constants.ts`** - Constantes de la app
  - [ ] Enums (status, calculation methods, etc.)

**Entregables:**
- Layout base funcional
- Componentes reutilizables documentados
- Navegación integrada con Wayfinder

---

### **FASE 4: Frontend - Módulo de Maestros** ⏳
**Duración:** 1 semana
**Objetivo:** CRUD completo de datos maestros

#### 4.1 Customers (Clientes)
- [ ] `pages/customers/index.tsx` - Listado
  - [ ] DataTable con columnas: name, code, type, group, active
  - [ ] Filtros: type, group, active status, search
  - [ ] Acciones: create, edit, delete, view
  - [ ] Paginación

- [ ] `pages/customers/create.tsx` - Crear
  - [ ] Form con Wayfinder
  - [ ] Campos: name, code, tax_id, customer_type_id, business_group_id, is_active
  - [ ] Validación client-side

- [ ] `pages/customers/[id]/edit.tsx` - Editar
  - [ ] Similar a create, pre-poblado

- [ ] `pages/customers/[id]/show.tsx` - Detalle
  - [ ] Info del cliente
  - [ ] Estadísticas de facturas históricas
  - [ ] Proyecciones asociadas

- [ ] `components/customers/CustomerForm.tsx` - Formulario reutilizable

#### 4.2 Customer Types (Tipos de Cliente)
- [ ] `pages/customer-types/index.tsx` - Listado
- [ ] `pages/customer-types/create.tsx` - Crear
- [ ] `pages/customer-types/[id]/edit.tsx` - Editar
- [ ] `components/customer-types/CustomerTypeForm.tsx`

#### 4.3 Business Groups (Grupos Empresariales)
- [ ] `pages/business-groups/index.tsx` - Listado
- [ ] `pages/business-groups/create.tsx` - Crear
- [ ] `pages/business-groups/[id]/edit.tsx` - Editar
- [ ] `components/business-groups/BusinessGroupForm.tsx`

#### 4.4 Products (Productos)
- [ ] `pages/products/index.tsx` - Listado
- [ ] `pages/products/create.tsx` - Crear
- [ ] `pages/products/[id]/edit.tsx` - Editar
- [ ] `components/products/ProductForm.tsx`

#### 4.5 Inflation Rates (Tasas de Inflación)
- [ ] `pages/settings/inflation-rates.tsx` - CRUD en una sola página
  - [ ] Tabla editable inline
  - [ ] Bulk edit para múltiples años
  - [ ] Indicador de estimado vs real

**Entregables:**
- CRUDs completos y funcionales
- Validaciones integradas
- UX consistente entre módulos

---

### **FASE 5: Frontend - Módulo de Escenarios** ⏳
**Duración:** 1.5 semanas
**Objetivo:** Gestión completa de escenarios y supuestos

#### 5.1 Listado de Escenarios
- [ ] `pages/scenarios/index.tsx`
  - [ ] Cards o tabla con: name, status, baseline, projection_years, user
  - [ ] Filtros: status, baseline, user
  - [ ] Acciones: create, edit, duplicate, calculate, compare, delete
  - [ ] Badge indicators para status (draft, active, archived)

#### 5.2 Crear/Editar Escenario
- [ ] `pages/scenarios/create.tsx` - Wizard multi-step
  - [ ] **Step 1:** Información básica (name, description, base_year)
  - [ ] **Step 2:** Configuración (historical_months, projection_years, calculation_method, include_inflation)
  - [ ] **Step 3:** Review y submit

- [ ] `pages/scenarios/[id]/edit.tsx` - Editar información básica
  - [ ] Similar a create pero sin wizard

- [ ] `components/scenarios/ScenarioForm.tsx` - Formulario reutilizable

#### 5.3 Gestión de Supuestos
- [ ] `pages/scenarios/[id]/assumptions.tsx` - Página principal de supuestos
  - [ ] Tabs por año (2025, 2026, 2027...)
  - [ ] Tabla de supuestos agrupados por jerarquía
  - [ ] Indicadores visuales de jerarquía (global, tipo, grupo, cliente)
  - [ ] Acciones: add, edit, delete

- [ ] `components/scenarios/AssumptionBuilder.tsx` - Constructor visual
  - [ ] **Step 1:** Seleccionar dimensión (global, customer type, business group, customer, product)
  - [ ] **Step 2:** Seleccionar año(s)
  - [ ] **Step 3:** Configurar tasas
    - [ ] `growth_rate` (%)
    - [ ] `inflation_rate` (% o usar la global)
    - [ ] `adjustment_type` (percentage / fixed_amount)
    - [ ] `fixed_amount` (si aplica)
    - [ ] `seasonality_factors` (array de 12 valores, opcional)
  - [ ] **Step 4:** Preview y submit

- [ ] `components/scenarios/AssumptionHierarchy.tsx` - Visualización de jerarquía
  - [ ] Tree view o lista indentada
  - [ ] Mostrar qué supuesto aplica a cada entidad
  - [ ] Highlight de conflictos o sobreescrituras

- [ ] `components/scenarios/SeasonalityEditor.tsx` - Editor de factores estacionales
  - [ ] 12 inputs numéricos (uno por mes)
  - [ ] Validación: suma debe ser ≈ 12.0 (promedio = 1.0)
  - [ ] Presets: uniforme (1.0 todos), template común

#### 5.4 Cálculo de Proyecciones
- [ ] `components/scenarios/CalculateProjectionsButton.tsx` - Botón con modal
  - [ ] Modal de confirmación
  - [ ] Mostrar advertencia si hay proyecciones existentes (se borrarán)
  - [ ] Progress indicator (sincrónico con loading state)
  - [ ] Notificación de éxito con resumen (X proyecciones creadas)
  - [ ] Error handling con detalles

#### 5.5 Duplicar Escenario
- [ ] Modal de duplicación
  - [ ] Input para nuevo nombre
  - [ ] Checkbox: copiar supuestos (default: true)
  - [ ] Checkbox: copiar proyecciones (default: false)

**Entregables:**
- Wizard de creación de escenarios funcional
- Constructor de supuestos con jerarquía visual
- Cálculo de proyecciones integrado

---

### **FASE 6: Frontend - Dashboard de Proyecciones** ⏳
**Duración:** 1.5 semanas
**Objetivo:** Visualización principal de proyecciones

#### 6.1 Dashboard Principal
- [ ] `pages/dashboard.tsx`
  - [ ] **Filtros Globales:**
    - [ ] Selector de escenario (default: baseline activo)
    - [ ] Selector de año(s) (múltiple)
    - [ ] Filtros opcionales: customer type, business group

  - [ ] **Sección KPIs (4 cards):**
    - [ ] Total Proyectado (año seleccionado)
    - [ ] vs Promedio Histórico (% variación)
    - [ ] Crecimiento Anual (%)
    - [ ] Inflación Aplicada (%)

  - [ ] **Gráfica Principal: Comparativa por Año**
    - [ ] Barras agrupadas: Subtotal, Tax, Total
    - [ ] Eje X: Años (2025, 2026, 2027)
    - [ ] Eje Y: Monto en MXN
    - [ ] Tooltip con detalles

  - [ ] **Gráfica Secundaria: Evolución Mensual**
    - [ ] Líneas por año (si se seleccionan varios)
    - [ ] Eje X: Meses (Ene - Dic)
    - [ ] Eje Y: Monto en MXN
    - [ ] Zoom y pan

  - [ ] **Gráfica Terciaria: Distribución por Tipo de Cliente**
    - [ ] Áreas apiladas o barras apiladas
    - [ ] Desglose: Fondos, Afores, Otros

  - [ ] **Tabla Resumen:**
    - [ ] Filas: Customer Types o Business Groups
    - [ ] Columnas: Años proyectados
    - [ ] Subtotales y totales
    - [ ] Drill-down al hacer click (navegar a detalle)

#### 6.2 Componentes de Visualización
- [ ] `components/projections/ProjectionChart.tsx` - Gráficas con Recharts
  - [ ] Props genéricos: data, type (bar, line, area), config
  - [ ] Theming con Tailwind colors
  - [ ] Responsive
  - [ ] Dark mode support

- [ ] `components/projections/ProjectionTable.tsx` - Tabla detallada
  - [ ] Props: data, groupBy (customer_type, business_group)
  - [ ] Expandable rows para drill-down
  - [ ] Exportar a Excel (botón)
  - [ ] Sorting y filtering

- [ ] `components/projections/KPICard.tsx` - Especialización de StatCard
  - [ ] Formato de moneda
  - [ ] Indicadores de tendencia (↑↓)

#### 6.3 Detalle de Proyección
- [ ] `pages/projections/[id]/show.tsx` - Detalle individual
  - [ ] Información del escenario
  - [ ] Dimensiones (customer, product, etc.)
  - [ ] Gráfica mensual (12 meses)
  - [ ] Tabla de desglose mensual
  - [ ] Supuestos aplicados (growth_rate, inflation_rate)
  - [ ] Comparación con base histórica

#### 6.4 Comparación de Escenarios
- [ ] `pages/scenarios/compare.tsx`
  - [ ] Selector de escenarios (2-4)
  - [ ] Selector de año
  - [ ] Filtros de dimensión

  - [ ] **Gráfica Comparativa:**
    - [ ] Barras agrupadas por escenario
    - [ ] Eje X: Escenarios
    - [ ] Eje Y: Total Amount

  - [ ] **Tabla de Diferencias:**
    - [ ] Columnas: Escenario 1, Escenario 2, Diferencia Abs, Diferencia %
    - [ ] Filas: Customer Types o años
    - [ ] Heat map de diferencias (color coding)

  - [ ] **Análisis de Sensibilidad:**
    - [ ] Mostrar qué supuestos difieren entre escenarios
    - [ ] Impacto de cada supuesto en el total

**Entregables:**
- Dashboard interactivo y funcional
- Gráficas responsive con dark mode
- Comparación de escenarios completa

---

### **FASE 7: Frontend - Módulo de Importación** ⏳
**Duración:** 1 semana
**Objetivo:** Importación de datos históricos desde Excel

#### 7.1 Importación de Facturas
- [ ] `pages/import/invoices.tsx`
  - [ ] **Step 1: Upload**
    - [ ] Drag & drop zone para archivo Excel
    - [ ] Validación de extensión (.xlsx)
    - [ ] Validación de tamaño (< 10MB)
    - [ ] Preview de archivo seleccionado

  - [ ] **Step 2: Mapeo de Columnas**
    - [ ] Detectar headers automáticamente
    - [ ] Dropdowns para mapear columnas a campos:
      - [ ] `invoice_number` (requerido)
      - [ ] `customer_code` (requerido, se busca Customer por code)
      - [ ] `invoice_date` (requerido)
      - [ ] `due_date` (opcional)
      - [ ] `subtotal` (requerido)
      - [ ] `tax` (requerido)
      - [ ] `total` (requerido)
      - [ ] `currency` (opcional, default: MXN)
      - [ ] `status` (opcional, default: issued)
    - [ ] Items (opcional, otra pestaña en Excel):
      - [ ] `product_code`
      - [ ] `description`
      - [ ] `quantity`
      - [ ] `unit_price`
      - [ ] `subtotal`
      - [ ] `tax`
      - [ ] `total`

  - [ ] **Step 3: Preview**
    - [ ] Tabla con primeras 10 filas procesadas
    - [ ] Validaciones inline (errores en rojo)
    - [ ] Resumen: X filas válidas, Y con errores

  - [ ] **Step 4: Importar**
    - [ ] Progress bar (% completado)
    - [ ] Log de errores en tiempo real
    - [ ] Resumen final:
      - [ ] Total procesado
      - [ ] Exitosos
      - [ ] Duplicados detectados (mostrar detalles)
      - [ ] Errores (mostrar detalles)
    - [ ] Opción de descargar log de errores (CSV)

- [ ] `components/import/FileUploader.tsx` - Drag & drop zone
- [ ] `components/import/ColumnMapper.tsx` - Mapeo de columnas
- [ ] `components/import/ImportProgress.tsx` - Progress indicator
- [ ] `components/import/ImportResults.tsx` - Resumen de importación

#### 7.2 Validaciones de Importación (Backend ya implementado)
- [ ] Validar `invoice_number` único
- [ ] Validar `customer_code` existe
- [ ] Validar duplicado lógico:
  - [ ] Misma combinación `invoice_number + customer_id + business_group_id`
  - [ ] Misma fecha y monto (fuzzy match)
- [ ] Validar `product_code` existe (si se proveen items)
- [ ] Validar totales cuadren (subtotal + tax = total)

#### 7.3 Historial de Importaciones
- [ ] `pages/import/history.tsx`
  - [ ] Tabla con: filename, date, status, total/success/failed records
  - [ ] Acciones: view details, re-import (solo si failed)
  - [ ] Filtros: date range, status, source_system

- [ ] `pages/import/history/[id]/show.tsx` - Detalle de importación
  - [ ] Información del batch
  - [ ] Log de errores (tabla paginada)
  - [ ] Facturas importadas (tabla con link a invoices)

**Entregables:**
- Importación funcional con validación robusta
- UX clara con feedback en cada paso
- Historial de importaciones consultable

---

### **FASE 8: Reportes y Exportaciones** ⏳
**Duración:** 0.5 semanas
**Objetivo:** Generación de reportes Excel/PDF

#### 8.1 Backend
- [ ] **`ReportGeneratorService`** - Generación de archivos
  - [ ] Método `exportProjectionsToExcel(Scenario $scenario, $filters): string`
    - [ ] Usar `maatwebsite/excel`
    - [ ] Sheets: Resumen, Detalle Mensual, Supuestos
    - [ ] Formato: headers bold, moneda, totales
  - [ ] Método `exportComparisonToExcel($scenarios, $filters): string`
    - [ ] Sheet comparativa
  - [ ] Método `exportInvoicesToExcel($filters): string`

- [ ] Controlador `ReportController`
  - [ ] `exportProjections(scenario_id, filters)` - GET, retorna archivo
  - [ ] `exportComparison(scenario_ids, filters)` - GET, retorna archivo
  - [ ] `exportInvoices(filters)` - GET, retorna archivo

#### 8.2 Frontend
- [ ] Botones de exportación en:
  - [ ] Dashboard (exportar vista actual)
  - [ ] Proyecciones (exportar detalle)
  - [ ] Comparación (exportar tabla comparativa)
  - [ ] Invoices (exportar facturas filtradas)

- [ ] `components/reports/ExportButton.tsx` - Botón genérico
  - [ ] Props: endpoint, filters, filename
  - [ ] Loading state durante generación
  - [ ] Auto-descarga del archivo

- [ ] Modal de configuración (opcional):
  - [ ] Seleccionar columnas a incluir
  - [ ] Formato (Excel, CSV)

**Entregables:**
- Exportación funcional a Excel
- Reportes bien formateados y legibles

---

### **FASE 9: Testing Completo** ⏳
**Duración:** 1 semana
**Objetivo:** Garantizar calidad del código

#### 9.1 Backend Tests

**Unit Tests:**
- [ ] `ProjectionCalculatorServiceTest`
  - [ ] `testCalculateSimpleAverage()`
  - [ ] `testCalculateWithGrowthAndInflation()`
  - [ ] `testMonthlyDistributionWithSeasonality()`
  - [ ] `testMonthlyDistributionUniform()`
  - [ ] `testApplyGrowthRate()`
  - [ ] `testApplyInflationRate()`

- [ ] `HistoricalDataAnalyzerServiceTest`
  - [ ] `testGetAverageMonthlyRevenue()`
  - [ ] `testAggregateByCustomerType()`
  - [ ] `testAggregateByBusinessGroup()`
  - [ ] `testValidateSufficientData()`

- [ ] `AssumptionResolverTest`
  - [ ] `testResolveGlobalAssumption()`
  - [ ] `testResolveCustomerTypeAssumption()`
  - [ ] `testResolveBusinessGroupAssumption()`
  - [ ] `testResolveCustomerAssumption()`
  - [ ] `testResolvePriority()` (cliente > grupo > tipo > global)
  - [ ] `testResolveWithProduct()`

**Feature Tests:**
- [ ] `ScenarioManagementTest`
  - [ ] `testCreateScenario()`
  - [ ] `testUpdateScenario()`
  - [ ] `testDeleteScenario()`
  - [ ] `testDuplicateScenario()`
  - [ ] `testCalculateProjections()`
  - [ ] `testCalculateInvalidatesOldProjections()`

- [ ] `ScenarioAssumptionTest`
  - [ ] `testCreateAssumption()`
  - [ ] `testUpdateAssumptionInvalidatesProjections()`
  - [ ] `testDeleteAssumption()`
  - [ ] `testUniqueConstraintEnforced()`
  - [ ] `testSeasonalityFactorsValidation()`

- [ ] `ProjectionComparisonTest`
  - [ ] `testCompareTwoScenarios()`
  - [ ] `testCompareMultipleScenarios()`
  - [ ] `testCompareWithFilters()`

- [ ] `InvoiceImportTest`
  - [ ] `testImportValidExcel()`
  - [ ] `testDetectDuplicateByInvoiceNumber()`
  - [ ] `testDetectDuplicateByCustomerAndGroup()`
  - [ ] `testImportWithInvalidCustomer()`
  - [ ] `testImportWithInvalidProduct()`
  - [ ] `testImportWithMismatchedTotals()`
  - [ ] `testImportWithItems()`

- [ ] `MultiTenancyTest`
  - [ ] `testOrganizationScopeFiltersData()`
  - [ ] `testUserCannotAccessOtherOrganizationData()`
  - [ ] `testProjectionCalculationRespectsOrganization()`

- [ ] `RelationshipConstraintsTest`
  - [ ] `testCascadeDeleteBusinessGroup()`
  - [ ] `testRestrictDeleteCustomerType()`
  - [ ] `testNullOnDeleteBusinessGroup()`
  - [ ] `testSoftDeletePreservesRelationships()`

#### 9.2 Frontend Tests (Opcional, si hay tiempo)
- [ ] Tests de componentes críticos con React Testing Library:
  - [ ] `AssumptionBuilder.test.tsx`
  - [ ] `ProjectionChart.test.tsx`
  - [ ] `DataTable.test.tsx`

- [ ] Tests E2E con Playwright (flujo completo):
  - [ ] `scenario-creation.spec.ts`
  - [ ] `projection-calculation.spec.ts`
  - [ ] `invoice-import.spec.ts`

#### 9.3 Cobertura
- [ ] Backend: > 80% de cobertura
- [ ] Run `php artisan test --coverage`
- [ ] Revisar reportes de cobertura

**Entregables:**
- Suite completa de tests con > 80% cobertura
- Tests pasando en CI/CD
- Documentación de casos de prueba críticos

---

### **FASE 10: Pulido y Optimización** ⏳
**Duración:** 1 semana
**Objetivo:** Mejorar UX y performance

#### 10.1 Performance Backend
- [ ] **Migrar cálculo a asíncrono (si es necesario)**
  - [ ] Crear `CalculateProjectionsJob`
  - [ ] Actualizar `ScenarioController@calculate` para dispatch job
  - [ ] Implementar notificaciones (email o in-app) cuando termine
  - [ ] Agregar endpoint de status para polling (`GET /scenarios/{id}/calculation-status`)

- [ ] **Optimizar queries**
  - [ ] Revisar N+1 queries con Telescope
  - [ ] Agregar eager loading donde falte
  - [ ] Considerar índices adicionales en:
    - [ ] `projections(scenario_id, year, customer_type_id)`
    - [ ] `invoices(customer_id, invoice_date, status)`

- [ ] **Caché**
  - [ ] Cachear escenarios activos por 5 min
  - [ ] Cachear proyecciones calculadas por 1 hora
  - [ ] Invalidar caché al actualizar supuestos

#### 10.2 Performance Frontend
- [ ] **Code Splitting**
  - [ ] Lazy load de rutas con `React.lazy()`
  - [ ] Dynamic imports para componentes pesados (charts)

- [ ] **Optimización de Re-renders**
  - [ ] `React.memo()` en componentes de listas
  - [ ] `useMemo()` para cálculos pesados
  - [ ] `useCallback()` para callbacks en loops

- [ ] **Paginación Infinita** (si aplica)
  - [ ] Implementar en listados largos (invoices)
  - [ ] Usar Inertia's partial reloads

#### 10.3 UX Enhancements
- [ ] **Loading States**
  - [ ] Skeletons en todas las páginas
  - [ ] Shimmer effect
  - [ ] Progress indicators para operaciones largas

- [ ] **Animaciones**
  - [ ] Transiciones suaves entre páginas (Framer Motion)
  - [ ] Animaciones de entrada/salida de modales
  - [ ] Hover states consistentes

- [ ] **Tooltips y Ayuda**
  - [ ] Tooltips explicativos en campos complejos (seasonality, calculation method)
  - [ ] "?" icons con popovers
  - [ ] Tour guiado para nuevos usuarios (opcional)

- [ ] **Responsive Design**
  - [ ] Revisar en mobile, tablet, desktop
  - [ ] Sidebar colapsado por default en mobile
  - [ ] Tablas con scroll horizontal en mobile
  - [ ] Gráficas responsive

- [ ] **Dark Mode**
  - [ ] Revisar todos los componentes en dark mode
  - [ ] Ajustar contrastes
  - [ ] Charts con colores adaptados

- [ ] **Accesibilidad**
  - [ ] Navegación con teclado (tab order)
  - [ ] ARIA labels en elementos interactivos
  - [ ] Contraste de colores WCAG AA

#### 10.4 Error Handling
- [ ] **Frontend:**
  - [ ] Error boundaries en rutas principales
  - [ ] Mensajes de error user-friendly
  - [ ] Retry automático para errores de red

- [ ] **Backend:**
  - [ ] Manejo consistente de excepciones
  - [ ] Logs estructurados (Laravel Log)
  - [ ] Sentry o similar para tracking de errores (opcional)

#### 10.5 Documentación Final
- [ ] **README.md actualizado**
  - [ ] Descripción completa del sistema
  - [ ] Guía de instalación
  - [ ] Guía de uso básico

- [ ] **Documentación de usuario** (opcional)
  - [ ] Manual de usuario en `docs/user-guide.md`
  - [ ] Screenshots y ejemplos

- [ ] **Documentación técnica**
  - [ ] Arquitectura del sistema
  - [ ] Algoritmos de cálculo
  - [ ] API endpoints (Postman collection o OpenAPI)

**Entregables:**
- Sistema optimizado y pulido
- UX mejorada con feedback visual
- Documentación completa

---

## Checklist de Progreso

### Backend
- [ ] **Fase 1:** Servicios de Cálculo (0/14 tareas)
- [ ] **Fase 2:** Controladores y API (0/42 tareas)
- [ ] **Fase 8:** Reportes Backend (0/4 tareas)
- [ ] **Fase 9:** Testing Backend (0/35 tareas)
- [ ] **Fase 10:** Optimización Backend (0/8 tareas)

**Total Backend:** 0/103 tareas (0%)

### Frontend
- [ ] **Fase 3:** Infraestructura (0/17 tareas)
- [ ] **Fase 4:** Maestros (0/20 tareas)
- [ ] **Fase 5:** Escenarios (0/21 tareas)
- [ ] **Fase 6:** Dashboard (0/24 tareas)
- [ ] **Fase 7:** Importación (0/20 tareas)
- [ ] **Fase 8:** Reportes Frontend (0/3 tareas)
- [ ] **Fase 10:** Optimización Frontend (0/16 tareas)

**Total Frontend:** 0/121 tareas (0%)

### **PROGRESO GLOBAL: 0/224 tareas (0%)**

---

## Dependencias entre Fases

```
FASE 1 (Cálculo)
    ↓
FASE 2 (API)
    ↓
FASE 3 (Infraestructura Frontend)
    ↓
    ├─→ FASE 4 (Maestros)
    ├─→ FASE 5 (Escenarios) ← Depende de FASE 1 + 2
    │       ↓
    └─→ FASE 6 (Dashboard) ← Depende de FASE 5
            ↓
        FASE 7 (Importación) ← Puede ser paralelo a FASE 6
            ↓
        FASE 8 (Reportes) ← Depende de FASE 6
            ↓
        FASE 9 (Testing) ← Depende de todo
            ↓
        FASE 10 (Optimización) ← Depende de todo
```

**Path Crítico (MVP):**
```
FASE 1 → FASE 2 → FASE 3 → FASE 5 → FASE 6
```
Duración estimada: **4-5 semanas**

---

## Riesgos y Mitigaciones

### Riesgo 1: Cálculo Sincrónico Lento
**Probabilidad:** Media
**Impacto:** Alto
**Mitigación:**
- Implementar timeout de 60 segundos
- Mostrar progress feedback detallado
- En Fase 10, migrar a asíncrono si se excede constantemente

### Riesgo 2: Complejidad de Jerarquía de Supuestos
**Probabilidad:** Alta
**Impacto:** Medio
**Mitigación:**
- Tests exhaustivos de todos los casos de prioridad
- Documentación clara del algoritmo
- UI visual que muestre qué supuesto aplica a cada entidad

### Riesgo 3: Validación de Duplicados en Importación
**Probabilidad:** Media
**Impacto:** Alto (datos corruptos)
**Mitigación:**
- Validación robusta en múltiples niveles (invoice_number, customer+group+date+amount)
- Preview obligatorio antes de importar
- Transacciones DB con rollback en caso de error

### Riesgo 4: Performance de Gráficas con Muchos Datos
**Probabilidad:** Media
**Impacto:** Medio
**Mitigación:**
- Limitar datos iniciales (año actual por default)
- Lazy loading de datos históricos
- Usar bibliotecas optimizadas (Recharts con memoization)

### Riesgo 5: Scope Creep (Funcionalidades Adicionales)
**Probabilidad:** Alta
**Impacto:** Alto (retraso)
**Mitigación:**
- Seguir estrictamente el plan de fases
- Documentar features adicionales en backlog separado
- Implementar solo después de completar MVP

---

## Notas de Implementación

### Estándares de Código
- **Backend:** Laravel 12 best practices, PSR-12, Laravel Pint
- **Frontend:** ESLint + Prettier, Tailwind 4 conventions
- **Tests:** Pest para backend, RTL para frontend
- **Commits:** Conventional Commits (feat, fix, docs, test, refactor)

### Convenciones de Nombres
- **Rutas API:** `/api/v1/{resource}` (plural, kebab-case)
- **Controladores:** `{Resource}Controller` (singular)
- **Componentes React:** PascalCase
- **Hooks:** `use{Name}` (camelCase)

### Git Workflow
- **Main branch:** `main` (protegida)
- **Feature branches:** `feature/{phase-number}-{description}` (ej: `feature/1-projection-calculator`)
- **Pull Requests:** Obligatorios, con review
- **CI/CD:** Run tests en cada PR

---

## Changelog

### v1.0 (2025-11-13)
- Plan inicial completo con 10 fases
- Decisiones técnicas documentadas
- Checklist de progreso implementado
- Dependencias y riesgos identificados

---

**Documento mantenido por:** Equipo de Desarrollo
**Última actualización:** 2025-11-13
**Próxima revisión:** Al completar cada fase
