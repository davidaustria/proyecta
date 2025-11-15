# Plan de Implementación - Sistema de Proyección de Ingresos

**Fecha de creación:** 2025-11-13
**Versión:** 1.9
**Estado:** En Progreso
**Última Actualización:** 2025-11-15

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

**Estado Actual (2025-11-15):**
- ✅ Fase 1 completada (Servicios de Cálculo)
- ✅ Fase 2 completada (API Backend - Controladores y Rutas)
- ✅ Fase 3 completada (Infraestructura Frontend - Layouts, Componentes, Hooks, Utilidades)
- ✅ Fase 4 completada (Módulo de Maestros - Customers, Types, Groups, Products, Inflation Rates)
- ✅ Fase 5 completada (Escenarios: Listado, Crear/Editar, Supuestos, Cálculo, Duplicar) - Path crítico del MVP
- ✅ Fase 6 completada (Dashboard de Proyecciones - Dashboard, Detalle, Comparación) - Path crítico del MVP
- ✅ Fase 7 completada (Módulo de Importación - Wizard, Historial, Validaciones)
- ✅ Fase 8 completada (Reportes y Exportaciones - Excel exports desde Dashboard, Proyecciones, Comparación, Facturas)
- 📊 Progreso: 68.1% (157/231 tareas completadas)

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

#### 3.3 Hooks Personalizados ✅
- [x] **`useInertiaForm.ts`** - Wrapper para Inertia forms con Wayfinder
- [x] **`useConfirm.ts`** - Hook para confirmaciones
- [x] **`useToast.ts`** - Hook para notificaciones

#### 3.4 Utilidades ✅
- [x] **`formatters.ts`** - Funciones de formato
  - [x] `formatCurrency(amount, currency = 'MXN')`
  - [x] `formatPercentage(value, decimals = 2)`
  - [x] `formatDate(date, format = 'DD/MM/YYYY')`
  - [x] `formatDateTime(date, format)`
  - [x] `formatNumber(value, decimals)`
  - [x] `formatRelativeTime(date)`
  - [x] `formatCompactCurrency(amount, currency)`

- [x] **`constants.ts`** - Constantes de la app
  - [x] Enums (status, calculation methods, adjustment types)
  - [x] Labels y colores para UI
  - [x] Configuraciones por defecto
  - [x] Constantes de paginación y formatos

**Entregables:**
- Layout base funcional
- Componentes reutilizables documentados
- Navegación integrada con Wayfinder

---

### **FASE 4: Frontend - Módulo de Maestros** ✅
**Duración:** 1 semana
**Estado:** COMPLETADO (2025-11-14)
**Objetivo:** CRUD completo de datos maestros

#### 4.1 Customers (Clientes)
- [x] `pages/customers/index.tsx` - Listado
  - [x] DataTable con columnas: name, code, type, group, active
  - [x] Filtros: type, group, active status, search
  - [x] Acciones: create, edit, delete, view
  - [x] Paginación

- [x] `pages/customers/create.tsx` - Crear
  - [x] Form con Wayfinder
  - [x] Campos: name, code, tax_id, customer_type_id, business_group_id, is_active
  - [x] Validación client-side

- [x] `pages/customers/[id]/edit.tsx` - Editar
  - [x] Similar a create, pre-poblado

- [x] `pages/customers/[id]/show.tsx` - Detalle
  - [x] Info del cliente
  - [x] Estadísticas de facturas históricas
  - [x] Proyecciones asociadas

- [x] `components/customers/CustomerForm.tsx` - Formulario reutilizable

#### 4.2 Customer Types (Tipos de Cliente)
- [x] `pages/customer-types/index.tsx` - Listado
- [x] `pages/customer-types/create.tsx` - Crear
- [x] `pages/customer-types/[id]/edit.tsx` - Editar
- [x] Formularios inline (sin componente separado)

#### 4.3 Business Groups (Grupos Empresariales)
- [x] `pages/business-groups/index.tsx` - Listado
- [x] `pages/business-groups/create.tsx` - Crear
- [x] `pages/business-groups/[id]/edit.tsx` - Editar
- [x] Formularios inline (sin componente separado)

#### 4.4 Products (Productos)
- [x] `pages/products/index.tsx` - Listado
- [x] `pages/products/create.tsx` - Crear
- [x] `pages/products/[id]/edit.tsx` - Editar
- [x] `components/products/ProductForm.tsx`

#### 4.5 Inflation Rates (Tasas de Inflación)
- [x] `pages/settings/inflation-rates.tsx` - CRUD en una sola página
  - [x] Tabla editable inline
  - [x] Add/edit/delete individual años
  - [x] Indicador de estimado vs real

**Entregables:**
- ✅ CRUDs completos y funcionales
- ✅ Validaciones integradas con error display
- ✅ UX consistente entre módulos
- ✅ TypeScript con type safety completo
- ✅ Wayfinder integration para routing
- ✅ Hooks (useToast, useConfirm, useInertiaForm)
- ✅ Dark mode support
- ✅ Spanish UI
- ✅ 20 archivos creados/modificados
- ✅ 2999+ líneas de código

---

### **FASE 5: Frontend - Módulo de Escenarios** ✅
**Duración:** 1.5 semanas (Parcialmente completada)
**Objetivo:** Gestión completa de escenarios y supuestos
**Estado:** Fase 5.1, 5.2, 5.3 completadas ✅

#### 5.1 Listado de Escenarios ✅
- [x] `pages/scenarios/index.tsx`
  - [x] Cards o tabla con: name, status, baseline, projection_years, user
  - [x] Filtros: status, baseline, user
  - [x] Acciones: create, edit, duplicate, calculate, compare, delete
  - [x] Badge indicators para status (draft, active, archived)

#### 5.2 Crear/Editar Escenario ✅
- [x] `pages/scenarios/create.tsx` - Wizard multi-step
  - [x] **Step 1:** Información básica (name, description, base_year)
  - [x] **Step 2:** Configuración (historical_months, projection_years, calculation_method, include_inflation)
  - [x] **Step 3:** Review y submit

- [x] `pages/scenarios/[id]/edit.tsx` - Editar información básica
  - [x] Similar a create pero sin wizard

- [x] `components/scenarios/ScenarioForm.tsx` - Formulario reutilizable

#### 5.3 Gestión de Supuestos ✅
- [x] `pages/scenarios/[id]/assumptions.tsx` - Página principal de supuestos
  - [x] Tabs por año (2025, 2026, 2027...)
  - [x] Tabla de supuestos agrupados por jerarquía
  - [x] Indicadores visuales de jerarquía (global, tipo, grupo, cliente)
  - [x] Acciones: add, edit, delete

- [x] `components/scenarios/AssumptionForm.tsx` - Formulario completo (reemplaza AssumptionBuilder)
  - [x] Seleccionar dimensión (global, customer type, business group, customer, product)
  - [x] Seleccionar año
  - [x] Configurar tasas
    - [x] `growth_rate` (%)
    - [x] `inflation_rate` (% o usar la global)
    - [x] `adjustment_type` (percentage / fixed_amount)
    - [x] `fixed_amount` (si aplica)
    - [x] `seasonality_factors` (array de 12 valores, opcional)
  - [x] Notas adicionales

- [x] Visualización de jerarquía integrada en tabla con badges de colores

- [x] `components/scenarios/SeasonalityEditor.tsx` - Editor de factores estacionales
  - [x] 12 inputs numéricos (uno por mes)
  - [x] Validación: suma debe ser ≈ 12.0 (promedio = 1.0)
  - [x] Presets: uniforme (1.0 todos), Q4 Alto, Q1 Alto

#### 5.4 Cálculo de Proyecciones ✅
- [x] `components/scenarios/CalculateProjectionsButton.tsx` - Botón con modal
  - [x] Modal de confirmación
  - [x] Mostrar advertencia si hay proyecciones existentes (se borrarán)
  - [x] Progress indicator (sincrónico con loading state)
  - [x] Notificación de éxito con resumen (X proyecciones creadas)
  - [x] Error handling con detalles

#### 5.5 Duplicar Escenario ✅
- [x] `components/scenarios/DuplicateScenarioDialog.tsx` - Modal de duplicación
  - [x] Input para nuevo nombre
  - [x] Checkbox: copiar supuestos (default: true)
  - [x] Checkbox: copiar proyecciones (default: false)

**Entregables:**
- Wizard de creación de escenarios funcional
- Constructor de supuestos con jerarquía visual
- Cálculo de proyecciones integrado

---

### **FASE 6: Frontend - Dashboard de Proyecciones** ✅
**Duración:** 1.5 semanas
**Estado:** COMPLETADO (2025-11-14)
**Objetivo:** Visualización principal de proyecciones

#### 6.1 Dashboard Principal
- [x] `pages/dashboard.tsx`
  - [x] **Filtros Globales:**
    - [x] Selector de escenario (default: baseline activo)
    - [x] Selector de año(s) (múltiple)
    - [x] Filtros opcionales: customer type, business group

  - [x] **Sección KPIs (4 cards):**
    - [x] Total Proyectado (año seleccionado)
    - [x] vs Promedio Histórico (% variación)
    - [x] Crecimiento Anual (%)
    - [x] Inflación Aplicada (%)

  - [x] **Gráfica Principal: Comparativa por Año**
    - [x] Barras agrupadas: Subtotal, Tax, Total
    - [x] Eje X: Años (2025, 2026, 2027)
    - [x] Eje Y: Monto en MXN
    - [x] Tooltip con detalles

  - [x] **Gráfica Secundaria: Evolución Mensual**
    - [x] Líneas por año (si se seleccionan varios)
    - [x] Eje X: Meses (Ene - Dic)
    - [x] Eje Y: Monto en MXN
    - [x] Responsive (zoom y pan disponible en biblioteca)

  - [x] **Gráfica Terciaria: Distribución por Tipo de Cliente**
    - [x] Áreas apiladas
    - [x] Desglose por tipo de cliente

  - [x] **Tabla Resumen:**
    - [x] Filas: Customer Types o Business Groups
    - [x] Columnas: Años proyectados
    - [x] Subtotales y totales
    - [x] Estructura preparada para drill-down

#### 6.2 Componentes de Visualización
- [x] `components/projections/ProjectionChart.tsx` - Gráficas con Recharts
  - [x] Props genéricos: data, type (bar, line, area), config
  - [x] Theming con Tailwind colors
  - [x] Responsive
  - [x] Dark mode support

- [x] `components/projections/ProjectionTable.tsx` - Tabla detallada
  - [x] Props: data, groupBy (customer_type, business_group)
  - [x] Expandable rows para drill-down
  - [x] Botón de exportar (preparado)
  - [x] Estructura para sorting

- [x] `components/projections/KPICard.tsx` - Especialización de StatCard
  - [x] Formato de moneda
  - [x] Indicadores de tendencia (↑↓)

#### 6.3 Detalle de Proyección
- [x] `pages/projections/[id]/show.tsx` - Detalle individual
  - [x] Información del escenario
  - [x] Dimensiones (customer, product, etc.)
  - [x] Gráfica mensual (12 meses)
  - [x] Tabla de desglose mensual
  - [x] Supuestos aplicados (growth_rate, inflation_rate)
  - [x] Comparación con base histórica

#### 6.4 Comparación de Escenarios
- [x] `pages/scenarios/compare.tsx`
  - [x] Selector de escenarios (2-4)
  - [x] Selector de año
  - [x] Filtros de dimensión

  - [x] **Gráfica Comparativa:**
    - [x] Barras agrupadas por escenario
    - [x] Eje X: Años
    - [x] Eje Y: Total Amount

  - [x] **Tabla de Diferencias:**
    - [x] Columnas por escenario
    - [x] Filas por año
    - [x] Tabla de supuestos comparativos

  - [x] **Análisis de Sensibilidad:**
    - [x] Tabla de supuestos con tasas aplicadas

**Entregables:**
- ✅ Dashboard interactivo y funcional con filtros, KPIs y 3 gráficas
- ✅ Gráficas responsive con dark mode
- ✅ Comparación de escenarios completa
- ✅ Página de detalle de proyección individual
- ✅ DashboardController con lógica de agregación
- ✅ TypeScript types (Projection, ProjectionDetail, DashboardKPI, DashboardFilters)
- ✅ 3 componentes de visualización reutilizables
- ✅ Recharts integrado y configurado
- ✅ Rutas web para dashboard, proyecciones y comparación
- ✅ 800+ líneas de código frontend
- ✅ 300+ líneas de código backend

---

### **FASE 7: Frontend - Módulo de Importación** ✅
**Duración:** 1 semana
**Estado:** COMPLETADO (2025-11-15)
**Objetivo:** Importación de datos históricos desde Excel

#### 7.1 Importación de Facturas
- [x] `pages/import/invoices.tsx` - Wizard multi-paso completo
  - [x] **Step 1: Upload**
    - [x] Drag & drop zone para archivo Excel
    - [x] Validación de extensión (.xlsx)
    - [x] Validación de tamaño (< 10MB)
    - [x] Preview de archivo seleccionado

  - [x] **Step 2: Mapeo de Columnas**
    - [x] Detectar headers automáticamente
    - [x] Auto-mapeo inteligente por nombre de columna
    - [x] Dropdowns para mapear columnas a campos:
      - [x] `invoice_number` (requerido)
      - [x] `customer_code` (requerido, se busca Customer por code)
      - [x] `invoice_date` (requerido)
      - [x] `due_date` (opcional)
      - [x] `subtotal` (requerido)
      - [x] `tax` (requerido)
      - [x] `total` (requerido)
      - [x] `currency` (opcional, default: MXN)
      - [x] `status` (opcional, default: issued)
    - [x] Validación de campos requeridos
    - [x] Indicadores visuales de campos faltantes

  - [x] **Step 3: Preview**
    - [x] Tabla con primeras 10 filas procesadas
    - [x] Validaciones inline (errores en rojo)
    - [x] Resumen: X filas válidas, Y con errores
    - [x] Badges de estado por fila

  - [x] **Step 4: Importar**
    - [x] Progress indicator durante importación
    - [x] Resumen final con estadísticas:
      - [x] Total procesado
      - [x] Exitosos
      - [x] Fallidos
      - [x] Tasa de éxito
    - [x] Log de errores completo
    - [x] Opción de descargar log de errores

- [x] `components/import/FileUploader.tsx` - Drag & drop zone
  - [x] Validación de tipo de archivo
  - [x] Validación de tamaño
  - [x] Preview del archivo seleccionado
  - [x] Opción para remover archivo
- [x] `components/import/ColumnMapper.tsx` - Mapeo de columnas
  - [x] Select dropdowns para cada columna Excel
  - [x] Indicadores de campos requeridos
  - [x] Prevención de mapeos duplicados
  - [x] Leyenda explicativa
- [x] `components/import/ImportProgress.tsx` - Progress indicator
  - [x] Barra de progreso visual
  - [x] Estados: idle, processing, completed, failed
  - [x] Estadísticas en tiempo real
  - [x] Log de errores scrollable
- [x] `components/import/ImportResults.tsx` - Resumen de importación
  - [x] Cards con estadísticas
  - [x] Preview del log de errores
  - [x] Botones de acción (ver detalles, descargar errores, nueva importación)
  - [x] Mensaje de éxito/advertencia según resultado

#### 7.2 Validaciones de Importación (Backend ya implementado)
- [x] Validar `invoice_number` único
- [x] Validar `customer_code` existe
- [x] Validar duplicado lógico:
  - [x] Misma combinación `invoice_number + customer_id + business_group_id`
  - [x] Misma fecha y monto (fuzzy match)
- [x] Validar `product_code` existe (si se proveen items)
- [x] Validar totales cuadren (subtotal + tax = total)

#### 7.3 Historial de Importaciones
- [x] `pages/import/history.tsx` - Lista de importaciones
  - [x] DataTable con: filename, date, status, total/success/failed records
  - [x] Acciones: view details, download error log
  - [x] Filtros: search, status
  - [x] Badges de estado con colores
  - [x] Barra de progreso visual de tasa de éxito
  - [x] Paginación

- [x] `pages/import/history/[id]/show.tsx` - Detalle de importación
  - [x] Cards con estadísticas (total, exitosos, fallidos, tasa de éxito)
  - [x] Información del batch completa
  - [x] Log de errores completo
  - [x] Tabla de facturas importadas con paginación
  - [x] Navegación de regreso al historial

**Entregables:**
- ✅ Importación funcional con validación robusta
- ✅ UX clara con feedback en cada paso (wizard de 4 pasos)
- ✅ Historial de importaciones consultable
- ✅ 4 componentes reutilizables de importación
- ✅ 3 páginas completas (wizard, historial, detalle)
- ✅ TypeScript types para todas las entidades de importación
- ✅ Rutas web completas con filtros y paginación
- ✅ Navegación en sidebar actualizada
- ✅ Dark mode support completo
- ✅ Spanish UI
- ✅ ~1800 líneas de código

---

### **FASE 8: Reportes y Exportaciones** ✅
**Duración:** 0.5 semanas
**Estado:** COMPLETADO (2025-11-15)
**Objetivo:** Generación de reportes Excel/PDF

#### 8.1 Backend
- [x] **`ReportGeneratorService`** - Generación de archivos
  - [x] Método `exportProjectionsToExcel(Scenario $scenario, $filters): string`
    - [x] Usar `maatwebsite/excel`
    - [x] Sheets: Resumen, Detalle Mensual, Supuestos
    - [x] Formato: headers bold, moneda, totales
  - [x] Método `exportComparisonToExcel($scenarios, $filters): string`
    - [x] Sheet comparativa
  - [x] Método `exportInvoicesToExcel($filters): string`

- [x] Controlador `ReportController`
  - [x] `exportProjections(scenario_id, filters)` - GET, retorna archivo
  - [x] `exportComparison(scenario_ids, filters)` - GET, retorna archivo
  - [x] `exportInvoices(filters)` - GET, retorna archivo

#### 8.2 Frontend
- [x] Botones de exportación en:
  - [x] Dashboard (exportar vista actual)
  - [x] Proyecciones (exportar detalle)
  - [x] Comparación (exportar tabla comparativa)
  - [x] Invoices (exportar facturas filtradas)

- [x] `components/reports/ExportButton.tsx` - Botón genérico
  - [x] Props: endpoint, filters, filename
  - [x] Loading state durante generación
  - [x] Auto-descarga del archivo

- [ ] Modal de configuración (opcional):
  - [ ] Seleccionar columnas a incluir
  - [ ] Formato (Excel, CSV)

**Entregables:**
- ✅ Exportación funcional a Excel
- ✅ Reportes bien formateados y legibles
- ✅ maatwebsite/excel instalado y configurado
- ✅ ReportGeneratorService con 3 métodos de exportación
- ✅ 6 clases de Export Sheets (Summary, MonthlyDetail, Assumptions, Comparison, Invoices, ProjectionExport wrapper)
- ✅ ReportController con 3 endpoints
- ✅ 3 rutas API registradas (/api/v1/reports/*)
- ✅ ExportButton component reutilizable
- ✅ Export integrado en 4 páginas (Dashboard, Projection detail, Comparison, Invoices)
- ✅ Página de Invoices creada con filtros y export
- ✅ Ruta web para Invoices
- ✅ Navegación actualizada (Datos Históricos section)
- ✅ ~700 líneas de código backend
- ✅ ~300 líneas de código frontend

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
- [x] **Fase 8:** Reportes Backend (7/7 tareas) ✅
- [ ] **Fase 9:** Testing Backend (0/35 tareas)
- [ ] **Fase 10:** Optimización Backend (0/8 tareas)

**Total Backend:** 63/106 tareas (59.4%)

### Frontend
- [x] **Fase 3.1:** Layouts y Navegación (8/8 tareas) ✅
- [x] **Fase 3.2:** Componentes Base Reutilizables (8/8 tareas) ✅
- [x] **Fase 3.3:** Hooks Personalizados (3/3 tareas) ✅
- [x] **Fase 3.4:** Utilidades (2/2 tareas) ✅

- [x] **Fase 4:** Maestros (20/20 tareas) ✅
- [x] **Fase 5.1, 5.2, 5.3:** Escenarios - Listado, Crear/Editar, Supuestos (21/21 tareas) ✅
- [x] **Fase 5.4, 5.5:** Escenarios - Cálculo y Duplicar (2/2 tareas) ✅

- [x] **Fase 6:** Dashboard (24/24 tareas) ✅
- [x] **Fase 7:** Importación (20/20 tareas) ✅
- [x] **Fase 8:** Reportes Frontend (6/6 tareas) ✅
- [ ] **Fase 10:** Optimización Frontend (0/16 tareas)

**Total Frontend:** 94/141 tareas (66.7%)

### **PROGRESO GLOBAL: 157/247 tareas (63.6%)**


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

### v1.9 (2025-11-15)
- ✅ **FASE 8 COMPLETADA:** Reportes y Exportaciones
  - **Backend:**
    - Instalación y configuración de `maatwebsite/excel` package
    - `ReportGeneratorService` con 3 métodos de exportación:
      - `exportProjectionsToExcel()` - Exporta proyecciones de un escenario con 3 sheets:
        - Resumen: Lista de proyecciones con totales agregados
        - Detalle Mensual: Desglose mensual por proyección
        - Supuestos: Configuración de supuestos aplicados
      - `exportComparisonToExcel()` - Exporta comparación de múltiples escenarios
      - `exportInvoicesToExcel()` - Exporta facturas con filtros aplicados
    - 6 Export Sheet classes con formato profesional:
      - Headers en negrita con fondo gris
      - Columnas auto-ajustables
      - Formato de moneda y porcentajes
      - Nombres de dimensiones contextuales
    - `ReportController` con 3 endpoints GET:
      - `/api/v1/reports/projections/{scenario}` - Export proyecciones
      - `/api/v1/reports/comparison` - Export comparación (valida 2-4 escenarios)
      - `/api/v1/reports/invoices` - Export facturas
    - Auto-descarga con `deleteFileAfterSend()`
  - **Frontend:**
    - `ExportButton` component reutilizable (`components/reports/ExportButton.tsx`):
      - Loading state con spinner durante generación
      - Auto-descarga de archivo mediante blob handling
      - Detección automática de filename desde Content-Disposition header
      - Error handling con mensajes específicos por código HTTP
      - Soporte para GET y POST requests
      - Props: endpoint, params, filename, variant, size
    - Integración de export en 4 páginas:
      - Dashboard: Export con filtros de escenario, año, tipo cliente, grupo
      - Proyecciones detail: Export de proyección específica
      - Comparación de escenarios: Export de datos comparativos
      - Facturas: Export con filtros de cliente, estado, fechas, búsqueda
    - Nueva página `invoices/index.tsx`:
      - Lista de facturas con DataTable
      - Filtros: búsqueda, cliente, estado
      - Integración con ExportButton
      - Badges de estado con colores
      - Formato de moneda y fechas
    - Ruta web `/invoices` con filtros y paginación
    - Navegación actualizada:
      - Grupo "Datos Históricos" (antes "Importación")
      - Links: Facturas, Importar Facturas, Historial de Importación
  - **Características:**
    - Spanish UI completo
    - Dark mode support
    - TypeScript type safety
    - Error handling robusto
    - Toast notifications para feedback
    - ~700 líneas de código backend
    - ~300 líneas de código frontend
- Progreso global actualizado: 63.6% (157/247 tareas completadas)

### v1.8 (2025-11-15)
- ✅ **FASE 7 COMPLETADA:** Frontend - Módulo de Importación
  - **Componentes de Importación:**
    - `FileUploader.tsx` - Drag & drop zone con validación de archivos Excel
      - Validación de extensión (.xlsx, .xls)
      - Validación de tamaño (max 10MB)
      - Preview del archivo seleccionado con opción de remover
      - Estados de error descriptivos
    - `ColumnMapper.tsx` - Mapeo inteligente de columnas Excel a campos del sistema
      - Auto-detección de headers del archivo
      - Auto-mapeo por similitud de nombres
      - Select dropdowns para cada columna Excel
      - Indicadores visuales de campos requeridos
      - Prevención de mapeos duplicados
      - Validación de campos obligatorios
      - Leyenda explicativa
    - `ImportProgress.tsx` - Indicador de progreso de importación
      - Estados: idle, processing, completed, failed
      - Barra de progreso visual
      - Estadísticas en tiempo real (exitosos/errores)
      - Log de errores scrollable
      - Íconos de estado con colores
    - `ImportResults.tsx` - Resumen final de importación
      - Cards con estadísticas (total, exitosos, fallidos, tasa de éxito)
      - Preview del log de errores (primeros 10 errores)
      - Botones de acción (ver detalles, descargar log, nueva importación)
      - Mensajes contextuales según resultado
  - **Páginas de Importación:**
    - `pages/import/invoices.tsx` - Wizard multi-paso (4 pasos)
      - Step 1: Upload - FileUploader con validaciones
      - Step 2: Mapeo - ColumnMapper con 9 campos del sistema
      - Step 3: Preview - Tabla con primeras 10 filas y validaciones inline
      - Step 4: Importar - Progress/Results según estado
      - Progress indicator visual de pasos completados
      - Validación antes de avanzar entre pasos
      - Navegación Atrás/Siguiente
      - API integration completa (upload, preview, import)
    - `pages/import/history.tsx` - Lista de importaciones
      - DataTable con paginación
      - Columnas: archivo, fecha, estado, registros (total/exitosos/fallidos), tasa de éxito, usuario
      - Badges de estado con colores (completado, fallido, procesando)
      - Barra de progreso visual por fila
      - Filtros: búsqueda, estado
      - Acciones: ver detalles, descargar log de errores
    - `pages/import/history/[id]/show.tsx` - Detalle de importación
      - 4 cards con estadísticas principales
      - Información completa del batch
      - Log de errores completo con scroll
      - Tabla de facturas importadas con paginación
      - Navegación de regreso al historial
  - **TypeScript Types:**
    - Invoice, InvoiceItem, ImportBatch interfaces
    - ImportPreviewRow, ImportPreviewData para wizard
    - ColumnMapping para mapeo de columnas
  - **Rutas Web:**
    - GET /import/invoices - Wizard de importación
    - GET /import/history - Lista de importaciones con filtros
    - GET /import/history/{id} - Detalle de importación con facturas
  - **Navegación:**
    - Sidebar actualizado con grupo "Importación" colapsable
    - Links: Importar Facturas, Historial
    - Corrección de link de Tasas de Inflación (/settings/inflation-rates)
  - **Features:**
    - Spanish UI completo
    - Dark mode support en todos los componentes
    - TypeScript type safety completo
    - Responsive design
    - Error handling robusto
    - Toast notifications
    - Axios integration para API calls
    - ~1800 líneas de código
- Progreso global actualizado: 60.9% (140/230 tareas completadas)

### v1.8 (2025-11-14)
- ✅ **FASE 6 COMPLETADA:** Frontend - Dashboard de Proyecciones
  - **Dashboard Principal (`pages/dashboard.tsx`):**
    - Dashboard completo con filtros globales (escenario, año, tipo cliente, grupo empresarial)
    - 4 KPI cards: Total Proyectado, vs Histórico, Crecimiento Anual, Inflación Aplicada
    - Gráfica de comparativa por año (barras agrupadas: subtotal, tax, total)
    - Gráfica de evolución mensual (líneas por año)
    - Gráfica de distribución por tipo de cliente (áreas apiladas)
    - Tabla resumen con totales por tipo de cliente y año
    - Filtros dinámicos con aplicación manual
    - Estado vacío cuando no hay escenario o proyecciones
  - **Componentes de Visualización:**
    - `ProjectionChart.tsx` - Componente genérico para bar/line/area charts
      - Integración con Recharts
      - Soporte para múltiples series
      - Custom tooltip con formato de moneda
      - Dark mode support completo
      - Responsive container
    - `ProjectionTable.tsx` - Tabla con drill-down y jerarquías
      - Filas expandibles
      - Agrupación por customer_type, business_group, customer, year
      - Totales automáticos
      - Botón de exportación (preparado)
    - `KPICard.tsx` - Especialización de StatCard
      - Formatos: currency, percentage, number
      - Indicadores de tendencia automáticos
  - **Detalle de Proyección (`pages/projections/[id]/show.tsx`):**
    - Información completa del escenario
    - KPIs: Monto Base, Total Proyectado, Variación, Inflación
    - Gráfica mensual de distribución (12 meses)
    - Tabla de desglose mensual con porcentajes
    - Supuestos aplicados (growth_rate, inflation_rate)
    - Comparación visual con base histórica
    - Indicadores de dimensión (cliente, grupo, tipo, producto)
  - **Comparación de Escenarios (`pages/scenarios/compare.tsx`):**
    - Selector de 2-4 escenarios
    - Filtros: año, tipo cliente, grupo empresarial
    - Gráfica comparativa (barras agrupadas por escenario)
    - Tabla de diferencias por año
    - Tabla de supuestos comparativos (growth_rate, inflation_rate)
    - Estado vacío con instrucciones
  - **Backend:**
    - `DashboardController` con métodos:
      - `index()` - Dashboard principal con agregaciones
      - `calculateKPIs()` - Cálculo de KPIs
      - `getYearComparisonData()` - Datos para gráfica anual
      - `getMonthlyEvolutionData()` - Datos para gráfica mensual
      - `getCustomerTypeDistribution()` - Datos para distribución
      - `getSummaryTableData()` - Datos para tabla resumen
    - Agregaciones eficientes con Eloquent collections
    - Formato de datos optimizado para Recharts
  - **Rutas Web:**
    - `GET /dashboard` - Dashboard principal con DashboardController
    - `GET /projections/{projection}` - Detalle de proyección
    - `GET /scenarios/compare` - Comparación de escenarios
    - `GET /customers/create`, `/customers/{customer}/edit`, `/customers/{customer}` - CRUD completo customers
    - `GET /business-groups/create`, `/business-groups/{businessGroup}/edit` - CRUD business groups
    - `GET /products/create`, `/products/{product}/edit` - CRUD products
  - **TypeScript Types:**
    - `Projection` - Modelo completo de proyección
    - `ProjectionDetail` - Desglose mensual
    - `DashboardKPI` - KPIs del dashboard
    - `DashboardFilters` - Filtros del dashboard
  - **Características:**
    - Recharts instalado y configurado
    - Spanish UI completo
    - Dark mode support en todos los componentes
    - Responsive design
    - TypeScript type safety completo
    - Filtros con state management
    - Empty states informativos
    - Tooltips con información detallada
    - Formato de moneda consistente
  - **Archivos:**
    - 1 backend controller (300+ líneas)
    - 3 páginas frontend (800+ líneas)
    - 3 componentes reutilizables (450+ líneas)
    - TypeScript types actualizados
    - 10+ rutas web agregadas

### v1.7 (2025-11-14)
- ✅ **FASE 5.4 COMPLETADA:** Frontend - Cálculo de Proyecciones
  - **Componente CalculateProjectionsButton (`components/scenarios/CalculateProjectionsButton.tsx`):**
    - Botón con modal de confirmación
    - Muestra advertencia si hay proyecciones existentes que se eliminarán
    - Progress indicator sincrónico con loading state
    - Notificación de éxito con resumen de proyecciones creadas
    - Error handling detallado con mensajes amigables
    - Muestra configuración del escenario antes de calcular
    - Integrado en página de supuestos (assumptions.tsx)
- ✅ **FASE 5.5 COMPLETADA:** Frontend - Duplicar Escenario
  - **Componente DuplicateScenarioDialog (`components/scenarios/DuplicateScenarioDialog.tsx`):**
    - Modal de duplicación completo con formulario
    - Input para nombre del nuevo escenario con validación
    - Checkbox para copiar supuestos (default: true)
    - Checkbox para copiar proyecciones (default: false)
    - Muestra información del escenario original
    - Validación de nombre único
    - Error handling con mensajes específicos
    - Integrado en página de listado de escenarios
  - **Integración:**
    - Updated scenarios index page to use DuplicateScenarioDialog
    - Removed old confirm-based duplication logic
    - Added state management for dialog control
- **Features:**
  - TypeScript type safety completo
  - API endpoints corregidos (/api/v1/scenarios/{id}/calculate y /api/v1/scenarios/{id}/duplicate)
  - Toast notifications para feedback
  - Dark mode support
  - Spanish UI
  - Controlled/uncontrolled dialog modes
  - Auto-reload on completion
- Progreso global actualizado: 52.2% (120/230 tareas completadas)

### v1.6 (2025-11-14)
- ✅ **FASE 5.1 COMPLETADA:** Frontend - Listado de Escenarios
  - **Página de Listado (`pages/scenarios/index.tsx`):**
    - Tabla completa con DataTable component
    - Columnas: Nombre (con descripción), Estado, Año Base, Años de Proyección, Método de Cálculo, Usuario, Estadísticas, Fecha
    - Filtros avanzados: búsqueda, estado (draft/active/archived), tipo (baseline/alternativa), usuario
    - Badges con colores para estados y línea base
    - Menú de acciones completo: Gestionar supuestos, Editar, Duplicar, Calcular proyecciones, Comparar, Eliminar
    - Confirmaciones para acciones destructivas
    - Toast notifications para feedback
  - **TypeScript Types:**
    - Added Scenario interface with all fields
  - **Web Route:**
    - GET /scenarios with filters and pagination
  - **Features:**
    - Spanish UI throughout
    - Dark mode support
    - Responsive design
    - Empty states
    - Loading states
- ✅ **FASE 5.2 COMPLETADA:** Frontend - Crear/Editar Escenario
  - **Wizard de Creación (`pages/scenarios/create.tsx`):**
    - Multi-step wizard con 3 pasos
    - Step 1: Información Básica (nombre, descripción, año base)
    - Step 2: Configuración (meses históricos, años proyección, método cálculo, inflación)
    - Step 3: Revisión y Estado (estado, línea base, resumen completo)
    - Progress indicator visual con checkmarks
    - Validación por paso antes de avanzar
    - Navegación Atrás/Siguiente
  - **Página de Edición (`pages/scenarios/[id]/edit.tsx`):**
    - Formulario simple sin wizard
    - Reutiliza ScenarioForm component
    - Pre-poblado con datos existentes
  - **Componente Reutilizable (`components/scenarios/ScenarioForm.tsx`):**
    - Formulario completo con todas las secciones
    - Validación inline con mensajes de error
    - Helper text explicativo
    - Submit/Cancel actions
  - **Form Requests Fixes:**
    - Fixed calculation_method validation (trend_based → trend)
  - **Features:**
    - TypeScript type safety completo
    - Inertia.js form submission
    - Toast notifications
    - Dark mode support
- ✅ **FASE 5.3 COMPLETADA:** Frontend - Gestión de Supuestos
  - **Página de Supuestos (`pages/scenarios/[id]/assumptions.tsx`):**
    - Tabs por año de proyección con contadores
    - Tabla con jerarquía visual mediante badges de colores
    - Columnas: Nivel, Dimensión, Crecimiento, Inflación, Estacionalidad, Acciones
    - Create/Edit dialog modal scrollable
    - Empty states por año
    - Dropdown menu para acciones (Editar/Eliminar)
  - **Formulario de Supuestos (`components/scenarios/AssumptionForm.tsx`):**
    - Selección de año y nivel jerárquico
    - Dropdowns condicionales por dimensión (tipo, grupo, cliente, producto)
    - Inputs para tasas de crecimiento e inflación
    - Selector de tipo de ajuste (porcentaje/monto fijo)
    - Checkbox y editor de estacionalidad
    - Textarea para notas
    - Validación completa con error display
  - **Editor de Estacionalidad (`components/scenarios/SeasonalityEditor.tsx`):**
    - 12 inputs para factores mensuales
    - Presets: Uniforme, Q4 Alto, Q1 Alto
    - Validación: suma debe ser ≈ 12.0
    - Feedback visual (suma, promedio)
    - Grid responsivo (2→3→4 columnas)
  - **TypeScript Types:**
    - Added ScenarioAssumption interface with hierarchy levels
  - **Hierarchy System:**
    - 5 niveles: Global, Customer Type, Business Group, Customer, Product
    - Badges con colores diferenciados
    - Nombres de dimensiones contextuales
  - **Web Route:**
    - GET /scenarios/{id}/assumptions with eager loading
  - **Features:**
    - CRUD completo (Create, Read, Update, Delete)
    - Confirmaciones con nombres de dimensión
    - Toast notifications
    - Spanish UI
    - Dark mode
    - Responsive design
  - **Files:** 5 files (3 new components, 1 type, 1 route)
  - **Code:** 1170+ lines added
- Progreso global actualizado: 51.8% (118/228 tareas completadas)

### v1.5 (2025-11-14)
- ✅ **FASE 4 COMPLETADA:** Frontend - Módulo de Maestros
  - **Customers Module (4 pages + form component):**
    - `pages/customers/index.tsx` - List with DataTable, filters (type, group, active), search
    - `pages/customers/create.tsx` - Create form with validation
    - `pages/customers/[id]/edit.tsx` - Edit form pre-populated
    - `pages/customers/[id]/show.tsx` - Detail view with info cards, audit data
    - `components/customers/CustomerForm.tsx` - Reusable form component
  - **Customer Types Module (3 pages):**
    - `pages/customer-types/index.tsx` - List with search and actions
    - `pages/customer-types/create.tsx` - Inline create form
    - `pages/customer-types/[id]/edit.tsx` - Inline edit form
  - **Business Groups Module (3 pages):**
    - `pages/business-groups/index.tsx` - List with search and actions
    - `pages/business-groups/create.tsx` - Inline create form
    - `pages/business-groups/[id]/edit.tsx` - Inline edit form
  - **Products Module (3 pages + form component):**
    - `pages/products/index.tsx` - List with price formatting and active filter
    - `pages/products/create.tsx` - Create form with unit price
    - `pages/products/[id]/edit.tsx` - Edit form pre-populated
    - `components/products/ProductForm.tsx` - Reusable form component
  - **Inflation Rates Module (1 page):**
    - `pages/settings/inflation-rates.tsx` - Single page with inline editing
    - Add/edit/delete rates directly in table
    - Year validation and estimated/real status badges
  - **TypeScript Types:**
    - Added Customer, CustomerType, BusinessGroup, Product, InflationRate interfaces
    - Added PaginatedData<T> generic type for Laravel pagination
  - **UI Components:**
    - `components/ui/textarea.tsx` - New textarea component
  - **Key Features:**
    - Full CRUD operations for all master data
    - Wayfinder integration for type-safe routing
    - useToast, useConfirm, useInertiaForm hooks usage
    - Spanish UI throughout
    - Dark mode support
    - Form validation with error display
    - Responsive design
    - Delete confirmations
  - **Files:** 20 files changed (11 new pages, 3 components, types, routes)
  - **Code:** 2999+ lines added
- Progreso global actualizado: 42.5% (97/228 tareas)

### v1.4 (2025-11-14)
- ✅ **FASE 3.3 COMPLETADA:** Frontend - Hooks Personalizados
  - **Custom Hooks:**
    - `useInertiaForm.ts` - Wrapper for Inertia forms with Wayfinder integration
      - Supports route objects and URL strings
      - Provides helper methods: submit, submitGet, submitPost, submitPut, submitPatch, submitDelete
      - Configurable options: preserveScroll, preserveState, resetOnSuccess, callbacks
    - `useConfirm.tsx` - Confirmation dialog hook
      - Returns Promise<boolean> for easy async/await usage
      - Customizable title, description, button text and variants
      - Built on top of existing Dialog component
    - `useToast.tsx` - Toast notification system with provider
      - Support for success, error, info, warning types
      - Auto-dismiss with configurable duration
      - Portal-based rendering
      - Full dark mode support
- ✅ **FASE 3.4 COMPLETADA:** Frontend - Utilidades
  - **Formatting Utilities (formatters.ts):**
    - `formatCurrency()` - Format numbers as currency with locale support
    - `formatCompactCurrency()` - Compact currency (1.2K, 1.2M, etc.)
    - `formatPercentage()` - Format decimals as percentages
    - `formatDate()` - Date formatting with presets and custom formats
    - `formatDateTime()` - Date and time formatting
    - `formatNumber()` - Number formatting with thousand separators
    - `formatRelativeTime()` - Relative time (e.g., "hace 2 horas")
  - **Application Constants (constants.ts):**
    - Scenario enums: SCENARIO_STATUS, CALCULATION_METHOD
    - Invoice enums: INVOICE_STATUS
    - Assumption enums: ADJUSTMENT_TYPE
    - Currency constants: CURRENCIES, symbols, labels
    - Month names (Spanish)
    - Default values: pagination, historical months, projection years
    - Chart colors and palettes
    - File upload limits and allowed types
    - Date format patterns
    - Display labels and colors for all enums
- Progreso global actualizado: 30.3% (69/228 tareas)

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
**Última actualización:** 2025-11-15 (v1.9)
**Próxima revisión:** Al completar cada fase
