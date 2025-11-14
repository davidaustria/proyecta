# Plan de Implementación - Sistema de Proyección de Ingresos

**Fecha de creación:** 2025-11-13
**Versión:** 1.3
**Estado:** En Progreso
**Última Actualización:** 2025-11-14

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

**Estado Actual (2025-11-14):**
- ✅ Fase 1 completada (Servicios de Cálculo)
- ✅ Fase 2 completada (API Backend - Controladores y Rutas)
- ✅ Fase 3.1 completada (Layouts y Navegación)
- 🔄 Siguiente: Fase 3.2-3.4 (Componentes Base Reutilizables y Utilidades)

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

### **FASE 1: API Backend - Lógica de Cálculo de Proyecciones** ✅
**Duración:** 1 semana
**Estado:** COMPLETADO (2025-11-14)
**Objetivo:** Implementar el motor de cálculo de proyecciones

#### 1.1 Servicios de Cálculo
- [x] **`ProjectionCalculatorService`** - Servicio principal de cálculo
  - [x] Método `calculateForScenario(Scenario $scenario): void`
  - [x] Método `calculateMonthlyDistribution($annualAmount, $seasonalityFactors): array`
  - [x] Método `applyGrowthAndInflation($baseAmount, $growthRate, $inflationRate): float`
  - [x] Método `getApplicableAssumption(Scenario, $year, $dimensions): ScenarioAssumption`
  - [x] Implementar jerarquía de supuestos (cliente > grupo > tipo > global)

- [x] **`HistoricalDataAnalyzerService`** - Análisis de datos históricos
  - [x] Método `getAverageMonthlyRevenue(Customer $customer, $startDate, $endDate): float`
  - [x] Método `getRevenueByProduct(Customer $customer, Product $product, $period): float`
  - [x] Método `validateSufficientData(Customer $customer, int $requiredMonths): bool`
  - [x] Método `aggregateInvoicesByPeriod($filters): Collection`

#### 1.2 Observers
- [x] **`ScenarioAssumptionObserver`**
  - [x] `updated()` - Invalidar (soft delete) proyecciones del escenario
  - [x] `deleted()` - Invalidar proyecciones asociadas

- [x] **`ProjectionObserver`**
  - [x] `creating()` - Calcular `total_amount` = `total_subtotal` + `total_tax`
  - [x] `saving()` - Validar que los totales cuadren

#### 1.3 Helpers y Utilities
- [x] **`AssumptionResolver`** - Clase para resolver jerarquía de supuestos
  - [x] Método `resolve(Scenario, $year, $dimensions): ?ScenarioAssumption`
  - [x] Lógica de cascada: cliente→grupo→tipo→global

#### 1.4 Tests Unitarios
- [x] `ProjectionCalculatorServiceTest`
  - [x] Test cálculo con crecimiento y inflación
  - [x] Test distribución mensual con estacionalidad
  - [x] Test jerarquía de supuestos
- [x] `HistoricalDataAnalyzerServiceTest`
  - [x] Test agregación de facturas
  - [x] Test promedios mensuales
- [x] `AssumptionResolverTest`
  - [x] Test resolución de jerarquía completa

**Entregables:**
- ✅ Servicios de cálculo funcionales con tests al 100%
- ✅ Documentación inline de algoritmos de cálculo
- ✅ Modelos base creados con relaciones y scopes
- ✅ Tests de feature para validar modelos

---

### **FASE 2: API Backend - Controladores y Rutas** ✅
**Duración:** 1.5 semanas
**Estado:** COMPLETADO (2025-11-14)
**Objetivo:** Crear endpoints RESTful para toda la funcionalidad

#### 2.1 Form Requests (Validación)
- [x] `StoreCustomerRequest` / `UpdateCustomerRequest`
- [x] `StoreCustomerTypeRequest` / `UpdateCustomerTypeRequest`
- [x] `StoreBusinessGroupRequest` / `UpdateBusinessGroupRequest`
- [x] `StoreProductRequest` / `UpdateProductRequest`
- [x] `StoreScenarioRequest` / `UpdateScenarioRequest`
- [x] `StoreScenarioAssumptionRequest` / `UpdateScenarioAssumptionRequest`
  - [x] Validar que no exista duplicado según constraint único
  - [x] Validar que `seasonality_factors` tenga 12 valores si se provee (JSON array)
- [x] `ImportInvoicesRequest`
  - [x] Validar archivo Excel
  - [x] Validar columnas requeridas

#### 2.2 API Resources (Serialización)
- [x] `CustomerResource`, `CustomerTypeResource`, `BusinessGroupResource`
- [x] `ProductResource`
- [x] `ScenarioResource`
  - [x] Incluir `assumptions` con nested resource
  - [x] Incluir conteo de proyecciones
- [x] `ScenarioAssumptionResource`
  - [x] Incluir relaciones opcionales (customer, product, etc.)
- [x] `ProjectionResource`
  - [x] Incluir `details` (monthly breakdown)
  - [x] Calcular variaciones vs base_amount
- [x] `ProjectionDetailResource`
- [x] `InvoiceResource`, `ImportBatchResource`
- [x] `ScenarioComparisonResource` (custom para comparativas)

#### 2.3 Controladores

**Maestros:**
- [x] `CustomerController` - CRUD completo
  - [x] `index()` - Listar con filtros (type, group, active)
  - [x] `store()` - Crear con validación
  - [x] `show($id)` - Detalle con invoices count
  - [x] `update($id)` - Actualizar
  - [x] `destroy($id)` - Soft delete

- [x] `CustomerTypeController` - Similar a Customer
- [x] `BusinessGroupController` - Similar a Customer
- [x] `ProductController` - Similar a Customer

**Proyecciones:**
- [x] `ScenarioController`
  - [x] `index()` - Listar con filtros (status, baseline, user)
  - [x] `store()` - Crear escenario
  - [x] `show($id)` - Detalle con assumptions y projections
  - [x] `update($id)` - Actualizar
  - [x] `destroy($id)` - Soft delete
  - [x] `duplicate($id)` - Duplicar escenario con todos sus supuestos
  - [x] `calculate($id)` - POST para calcular proyecciones (sincrónico)

- [x] `ScenarioAssumptionController`
  - [x] `index(scenario_id)` - Listar supuestos de un escenario
  - [x] `store()` - Crear supuesto
  - [x] `update($id)` - Actualizar (invalida proyecciones)
  - [x] `destroy($id)` - Eliminar
  - [x] `bulkStore()` - POST para crear múltiples supuestos a la vez

- [x] `ProjectionController`
  - [x] `index()` - Listar proyecciones con filtros (scenario, year, dimensions)
  - [x] `show($id)` - Detalle con monthly breakdown
  - [x] `recalculate($id)` - POST para recalcular proyección específica

- [x] `ProjectionComparisonController`
  - [x] `compare()` - POST con array de scenario_ids
  - [x] Retornar datos comparativos (diferencias, porcentajes)

**Datos Históricos:**
- [x] `InvoiceController`
  - [x] `index()` - Listar con filtros (customer, date range, status)
  - [x] `show($id)` - Detalle con items
  - [x] `stats()` - GET estadísticas generales (total revenue, count by period)

- [x] `ImportController`
  - [x] `upload()` - POST archivo Excel
  - [x] `preview()` - POST preview de datos antes de importar
  - [x] `import()` - POST ejecutar importación
  - [x] `history()` - GET historial de importaciones
  - [x] `show($batchId)` - Detalle de importación con errores

**Configuración:**
- [x] `InflationRateController`
  - [x] `index()` - Listar todas las tasas
  - [x] `store()` - Crear/actualizar tasa por año
  - [x] `bulkStore()` - POST para múltiples años

#### 2.4 Rutas API
- [x] `routes/api.php` - Definir todas las rutas con nombres
  - [x] Grupo `api/v1/` con prefijo
  - [x] Middleware `auth:sanctum`
  - [x] Resource routes para CRUDs
  - [x] Custom routes para acciones especiales

#### 2.5 Tests de Feature
- [x] `CustomerControllerTest` - CRUD completo
- [x] `ScenarioControllerTest`
  - [x] Test creación de escenario
  - [x] Test cálculo de proyecciones (test structure ready)
  - [x] Test duplicación
- [x] `ScenarioAssumptionControllerTest`
  - [x] Test creación de supuestos
  - [x] Test validaciones completas
  - [x] Test bulk operations

**Entregables:**
- ✅ API RESTful completa y documentada
- ✅ Tests de feature implementados para controladores clave
- ✅ 13 Form Request classes con validación robusta
- ✅ 11 API Resource classes para serialización
- ✅ 11 Controllers con todas las operaciones CRUD y especiales
- ✅ Rutas API registradas en bootstrap/app.php

---

### **FASE 3: Frontend - Infraestructura y Layouts** 🔄
**Duración:** 0.5 semanas
**Objetivo:** Crear la estructura base del frontend

#### 3.1 Layouts y Navegación ✅
- [x] **`DashboardLayout.tsx`** - Layout principal (ya existía como `app-sidebar-layout.tsx`)
  - [x] Sidebar colapsable
  - [x] Header con breadcrumbs
  - [x] Footer
  - [x] Contenedor de contenido con max-width

- [x] **`Sidebar.tsx`** - Navegación principal (actualizado `app-sidebar.tsx`)
  - [x] Sección "Dashboard"
  - [x] Sección "Escenarios"
  - [x] Sección "Datos Maestros" (Customers, Types, Groups, Products)
  - [x] Sección "Importación"
  - [x] Sección "Configuración" (Inflation Rates)
  - [x] Active state con Wayfinder
  - [x] Icons con lucide-react

#### 3.2 Componentes Base Reutilizables
- [x] **`DataTable.tsx`** - Tabla genérica
  - [x] Props: columns, data, onSort, onFilter, pagination
  - [x] Soporte para acciones (edit, delete)
  - [x] Loading skeleton
  - [x] Empty state

- [x] **`StatCard.tsx`** - Cards para KPIs
  - [x] Props: title, value, icon, trend, trendValue
  - [x] Variantes: default, success, warning, danger

- [x] **`ChartCard.tsx`** - Wrapper para gráficas
  - [x] Header con título y acciones
  - [x] Loading state
  - [x] Empty state

- [x] **`PageHeader.tsx`** - Headers consistentes
  - [x] Props: title, subtitle, actions (botones)
  - [x] Breadcrumbs opcionales

- [x] **`EmptyState.tsx`** - Estados vacíos
  - [x] Props: icon, title, description, action
  - [x] Variantes: no-data, no-results, error

- [x] **`LoadingSpinner.tsx`** - Spinner reutilizable
- [x] **`ConfirmDialog.tsx`** - Modal de confirmación
- [x] **`Toaster.tsx`** - Sistema de notificaciones (integrar con Sonner)

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
- [x] **Fase 1:** Servicios de Cálculo (14/14 tareas) ✅
- [x] **Fase 2:** Controladores y API (42/42 tareas) ✅
- [ ] **Fase 8:** Reportes Backend (0/4 tareas)
- [ ] **Fase 9:** Testing Backend (0/35 tareas)
- [ ] **Fase 10:** Optimización Backend (0/8 tareas)

**Total Backend:** 56/103 tareas (54.4%)

### Frontend
- [ ] **Fase 3:** Infraestructura (8/17 tareas) 🔄
  - [ ] Fase 3.1: Layouts y Navegación (0/9 tareas)
  - [x] Fase 3.2: Componentes Base Reutilizables (8/8 tareas) ✅
  - [ ] Fase 3.3: Hooks Personalizados (0/3 tareas)
  - [ ] Fase 3.4: Utilidades (0/2 tareas)
- [ ] **Fase 4:** Maestros (0/20 tareas)
- [ ] **Fase 5:** Escenarios (0/21 tareas)
- [ ] **Fase 6:** Dashboard (0/24 tareas)
- [ ] **Fase 7:** Importación (0/20 tareas)
- [ ] **Fase 8:** Reportes Frontend (0/3 tareas)
- [ ] **Fase 10:** Optimización Frontend (0/16 tareas)

**Total Frontend:** 8/121 tareas (6.6%)

### **PROGRESO GLOBAL: 64/224 tareas (28.6%)**

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

### v1.3 (2025-11-14)

- ✅ **FASE 3.2 COMPLETADA:** Frontend - Componentes Base Reutilizables
  - **Componentes UI implementados:** 9 componentes reutilizables de alta calidad
    - **Table.tsx** - Componente base de tabla con TableHeader, TableBody, TableRow, TableCell, TableFooter
    - **DataTable.tsx** - Tabla avanzada con sorting, filtrado, paginación, acciones, loading skeleton y empty state
    - **StatCard.tsx** - Cards para KPIs con variantes (default, success, warning, danger) y tendencias (up, down, neutral)
    - **ChartCard.tsx** - Wrapper para gráficas con header, acciones, loading state y empty state
    - **PageHeader.tsx** - Headers consistentes con título, subtítulo, acciones y breadcrumbs opcionales
    - **EmptyState.tsx** - Estados vacíos con variantes (default, no-data, no-results, error) y acciones opcionales
    - **LoadingSpinner.tsx** - Spinner reutilizable con variantes (default, overlay, inline, page) y tamaños configurables
    - **ConfirmDialog.tsx** - Modal de confirmación con variantes (default, destructive) y manejo de async
    - **Toaster.tsx** - Sistema de notificaciones integrado con Sonner y soporte para tema dark/light
  - **Dependencias:** Instalado paquete sonner para toast notifications
  - **Características clave:**
    - Todos los componentes soportan dark mode
    - Uso de class-variance-authority para manejo de variantes
    - Integración con existing UI components (Card, Dialog, Button, etc.)
    - TypeScript types completamente definidos
    - Responsive design en todos los componentes
- Progreso global actualizado: 28.6% (64/224 tareas)
- Progreso frontend: 6.6% (8/121 tareas)

- ✅ **FASE 3.1 COMPLETADA:** Frontend - Layouts y Navegación
  - **Componentes de Navegación:**
    - NavGroup component para grupos de navegación colapsables
    - Actualizado app-sidebar.tsx con todas las secciones de navegación
  - **Estructura de Navegación:**
    - Sección "Dashboard" (existente)
    - Sección "Escenarios" (nueva)
    - Sección "Datos Maestros" con grupo colapsable (Clientes, Tipos de Cliente, Grupos Empresariales, Productos)
    - Sección "Importación" (nueva)
    - Sección "Configuración" con grupo colapsable (Tasas de Inflación)
  - **Rutas Web:**
    - 7 nuevas rutas placeholder para navegación
    - Páginas index creadas para: scenarios, customers, customer-types, business-groups, products, import, inflation-rates
  - **Características:**
    - Navegación con estados activos usando Wayfinder
    - Iconos de lucide-react
    - Sidebar colapsable (ya existía en app-sidebar-layout.tsx)
    - Breadcrumbs en todas las páginas
    - Dark mode support
- Progreso global actualizado: 28.6% (64/224 tareas)

### v1.2 (2025-11-14)
- ✅ **FASE 2 COMPLETADA:** API Backend - Controladores y Rutas
  - **Form Requests:** 13 clases de validación implementadas con validaciones robustas
    - StoreCustomerRequest, UpdateCustomerRequest
    - StoreCustomerTypeRequest, UpdateCustomerTypeRequest
    - StoreBusinessGroupRequest, UpdateBusinessGroupRequest
    - StoreProductRequest, UpdateProductRequest
    - StoreScenarioRequest, UpdateScenarioRequest
    - StoreScenarioAssumptionRequest, UpdateScenarioAssumptionRequest (con validación de estacionalidad)
    - ImportInvoicesRequest
  - **API Resources:** 11 clases de serialización con relaciones eager loading
    - CustomerResource, CustomerTypeResource, BusinessGroupResource
    - ProductResource
    - ScenarioResource (con assumptions nested)
    - ScenarioAssumptionResource (con hierarchy level)
    - ProjectionResource, ProjectionDetailResource (con variaciones calculadas)
    - InvoiceResource, ImportBatchResource
    - ScenarioComparisonResource (custom)
  - **Controllers:** 11 controladores RESTful completamente funcionales
    - CustomerController, CustomerTypeController, BusinessGroupController, ProductController (CRUD + filtros)
    - ScenarioController (CRUD + duplicate + calculate)
    - ScenarioAssumptionController (CRUD + bulkStore)
    - ProjectionController (index + show + recalculate)
    - ProjectionComparisonController (compare scenarios)
    - InvoiceController (index + show + stats)
    - ImportController (upload + preview + import + history)
    - InflationRateController (index + store + bulkStore)
  - **API Routes:** Rutas registradas en routes/api.php y bootstrap/app.php
    - Grupo api/v1/ con middleware auth:sanctum
    - Resource routes para todos los CRUDs
    - Custom routes para acciones especiales (duplicate, calculate, compare, etc.)
  - **Feature Tests:** Tests comprehensivos para controladores clave
    - CustomerControllerTest (CRUD completo + filtros + búsqueda)
    - ScenarioControllerTest (CRUD + duplicate + validaciones)
    - ScenarioAssumptionControllerTest (CRUD + bulk + validaciones de estacionalidad)
- Progreso global actualizado: 25.0% (56/224 tareas)

### v1.1 (2025-11-14)
- ✅ **FASE 1 COMPLETADA:** Servicios de Cálculo de Proyecciones
  - Implementados: ProjectionCalculatorService, HistoricalDataAnalyzerService, AssumptionResolver
  - Observers creados: ScenarioAssumptionObserver, ProjectionObserver
  - Tests comprehensivos para servicios de cálculo
  - Modelos base creados con relaciones y scopes
- Progreso global actualizado: 6.3% (14/224 tareas)

### v1.0 (2025-11-13)
- Plan inicial completo con 10 fases
- Decisiones técnicas documentadas
- Checklist de progreso implementado
- Dependencias y riesgos identificados

---

**Documento mantenido por:** Equipo de Desarrollo
**Última actualización:** 2025-11-14
**Próxima revisión:** Al completar cada fase
