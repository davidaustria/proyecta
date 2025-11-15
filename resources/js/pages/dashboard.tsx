import * as React from "react"
import { Head, router } from "@inertiajs/react"
import {
  TrendingUp,
  DollarSign,
  Percent,
  Calendar,
  Filter,
  X,
} from "lucide-react"
import AppLayout from "@/layouts/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { KPICard } from "@/components/projections/kpi-card"
import { ProjectionChart } from "@/components/projections/projection-chart"
import { ProjectionTable } from "@/components/projections/projection-table"
import { ChartCard } from "@/components/ui/chart-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CHART_COLORS } from "@/lib/constants"
import {
  type Scenario,
  type CustomerType,
  type BusinessGroup,
  type DashboardKPI,
  type DashboardFilters,
  type BreadcrumbItem,
} from "@/types"
import { dashboard } from "@/routes"

interface DashboardProps {
  scenario: Scenario | null
  scenarios: Scenario[]
  customerTypes: CustomerType[]
  businessGroups: BusinessGroup[]
  filters: DashboardFilters
  kpis: DashboardKPI
  yearComparisonData: Array<{
    year: number
    subtotal: number
    tax: number
    total: number
  }>
  monthlyEvolutionData: Array<{
    month: number
    monthName: string
    [key: string]: number | string
  }>
  customerTypeDistribution: Array<{
    year: number
    [key: string]: number
  }>
  summaryTableData: Array<{
    id: string | number
    label: string
    years: Record<number, number>
  }>
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Dashboard",
    href: dashboard().url,
  },
]

export default function Dashboard({
  scenario,
  scenarios,
  customerTypes,
  businessGroups,
  filters,
  kpis,
  yearComparisonData,
  monthlyEvolutionData,
  customerTypeDistribution,
  summaryTableData,
}: DashboardProps) {
  const [selectedScenario, setSelectedScenario] = React.useState<
    number | undefined
  >(filters.scenario_id)
  const [selectedCustomerType, setSelectedCustomerType] = React.useState<
    number | undefined
  >(filters.customer_type_id)
  const [selectedBusinessGroup, setSelectedBusinessGroup] = React.useState<
    number | undefined
  >(filters.business_group_id)

  // Get years from filters or scenario
  const years = React.useMemo(() => {
    if (filters.years && filters.years.length > 0) {
      return filters.years
    }
    if (scenario) {
      return Array.from(
        { length: scenario.projection_years },
        (_, i) => scenario.base_year + i + 1
      )
    }
    return []
  }, [filters.years, scenario])

  // Apply filters
  const applyFilters = () => {
    const params: any = {}

    if (selectedScenario) {
      params.scenario_id = selectedScenario
    }

    if (selectedCustomerType) {
      params.customer_type_id = selectedCustomerType
    }

    if (selectedBusinessGroup) {
      params.business_group_id = selectedBusinessGroup
    }

    router.visit(dashboard().url, {
      data: params,
      preserveState: true,
    })
  }

  // Clear filters
  const clearFilters = () => {
    setSelectedScenario(undefined)
    setSelectedCustomerType(undefined)
    setSelectedBusinessGroup(undefined)

    router.visit(dashboard().url, {
      preserveState: true,
    })
  }

  // Check if filters are active
  const hasActiveFilters =
    selectedCustomerType !== undefined || selectedBusinessGroup !== undefined

  // Prepare monthly evolution chart series
  const monthlyEvolutionSeries = React.useMemo(() => {
    if (monthlyEvolutionData.length === 0) return []

    const sampleData = monthlyEvolutionData[0]
    const yearKeys = Object.keys(sampleData).filter((key) =>
      key.startsWith("year_")
    )

    return yearKeys.map((key, index) => ({
      dataKey: key,
      name: key.replace("year_", ""),
      color: CHART_COLORS[index % CHART_COLORS.length],
    }))
  }, [monthlyEvolutionData])

  // Prepare customer type distribution series
  const customerTypeDistributionSeries = React.useMemo(() => {
    if (customerTypeDistribution.length === 0) return []

    const sampleData = customerTypeDistribution[0]
    const typeKeys = Object.keys(sampleData).filter((key) => key !== "year")

    return typeKeys.map((key, index) => ({
      dataKey: key,
      name: key,
      color: CHART_COLORS[index % CHART_COLORS.length],
      stackId: "1",
    }))
  }, [customerTypeDistribution])

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard de Proyecciones" />

      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <PageHeader
          title="Dashboard de Proyecciones"
          subtitle={
            scenario
              ? `Escenario: ${scenario.name}`
              : "Seleccione un escenario para ver proyecciones"
          }
        />

        {/* Global Filters */}
        <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">Escenario</label>
            <Select
              value={selectedScenario?.toString()}
              onValueChange={(value) => setSelectedScenario(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar escenario" />
              </SelectTrigger>
              <SelectContent>
                {scenarios.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    <div className="flex items-center gap-2">
                      {s.name}
                      {s.is_baseline && (
                        <Badge variant="secondary" className="ml-2">
                          Línea base
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-48 space-y-2">
            <label className="text-sm font-medium">Tipo de Cliente</label>
            <Select
              value={selectedCustomerType?.toString()}
              onValueChange={(value) =>
                setSelectedCustomerType(value ? Number(value) : undefined)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {customerTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-48 space-y-2">
            <label className="text-sm font-medium">Grupo Empresarial</label>
            <Select
              value={selectedBusinessGroup?.toString()}
              onValueChange={(value) =>
                setSelectedBusinessGroup(value ? Number(value) : undefined)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {businessGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id.toString()}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={applyFilters}>
              <Filter className="mr-2 size-4" />
              Aplicar
            </Button>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="mr-2 size-4" />
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* KPIs Section */}
        {scenario && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Total Proyectado"
              value={kpis.total_projected}
              type="currency"
              icon={DollarSign}
              description={
                years.length > 0
                  ? `Años ${years[0]} - ${years[years.length - 1]}`
                  : "Sin años seleccionados"
              }
            />
            <KPICard
              title="vs Promedio Histórico"
              value={kpis.vs_historical}
              type="percentage"
              icon={TrendingUp}
              trend={kpis.vs_historical > 0 ? "up" : "down"}
              trendValue={`${Math.abs(kpis.vs_historical).toFixed(1)}%`}
              variant={kpis.vs_historical > 0 ? "success" : "danger"}
            />
            <KPICard
              title="Crecimiento Anual"
              value={kpis.annual_growth}
              type="percentage"
              icon={Calendar}
              trend={kpis.annual_growth > 0 ? "up" : "down"}
            />
            <KPICard
              title="Inflación Aplicada"
              value={kpis.inflation_applied}
              type="percentage"
              icon={Percent}
            />
          </div>
        )}

        {/* Charts Section */}
        {scenario && yearComparisonData.length > 0 ? (
          <>
            {/* Year Comparison Chart */}
            <ChartCard title="Comparativa por Año" description="Desglose de proyecciones anuales">
              <ProjectionChart
                data={yearComparisonData}
                type="bar"
                series={[
                  {
                    dataKey: "subtotal",
                    name: "Subtotal",
                    color: CHART_COLORS[0],
                  },
                  { dataKey: "tax", name: "Impuesto", color: CHART_COLORS[1] },
                  { dataKey: "total", name: "Total", color: CHART_COLORS[2] },
                ]}
                xAxisKey="year"
                height={350}
              />
            </ChartCard>

            {/* Monthly Evolution Chart */}
            {monthlyEvolutionData.length > 0 && (
              <ChartCard
                title="Evolución Mensual"
                description="Proyecciones mensuales por año"
              >
                <ProjectionChart
                  data={monthlyEvolutionData}
                  type="line"
                  series={monthlyEvolutionSeries}
                  xAxisKey="monthName"
                  height={350}
                />
              </ChartCard>
            )}

            {/* Customer Type Distribution Chart */}
            {customerTypeDistribution.length > 0 &&
              customerTypeDistributionSeries.length > 0 && (
                <ChartCard
                  title="Distribución por Tipo de Cliente"
                  description="Proyecciones apiladas por tipo de cliente"
                >
                  <ProjectionChart
                    data={customerTypeDistribution}
                    type="area"
                    series={customerTypeDistributionSeries}
                    xAxisKey="year"
                    height={350}
                  />
                </ChartCard>
              )}

            {/* Summary Table */}
            {summaryTableData.length > 0 && (
              <div>
                <h3 className="mb-4 text-lg font-semibold">
                  Resumen por Tipo de Cliente
                </h3>
                <ProjectionTable
                  data={summaryTableData}
                  years={years}
                  groupBy="customer_type"
                  showTotals
                  expandable={false}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
            <div className="text-center">
              <p className="text-muted-foreground mb-2 text-lg font-medium">
                No hay datos de proyecciones
              </p>
              <p className="text-muted-foreground text-sm">
                {!scenario
                  ? "Seleccione un escenario para ver las proyecciones"
                  : "El escenario seleccionado no tiene proyecciones calculadas"}
              </p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
