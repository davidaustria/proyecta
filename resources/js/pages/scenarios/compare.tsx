import * as React from "react"
import { Head, router } from "@inertiajs/react"
import { ArrowLeft, GitCompare, TrendingUp, TrendingDown } from "lucide-react"
import AppLayout from "@/layouts/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { ProjectionChart } from "@/components/projections/projection-chart"
import { ChartCard } from "@/components/ui/chart-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CHART_COLORS } from "@/lib/constants"
import { formatCurrency, formatPercentage } from "@/lib/formatters"
import { Link } from "@inertiajs/react"
import {
  type Scenario,
  type CustomerType,
  type BusinessGroup,
  type BreadcrumbItem,
} from "@/types"
import { dashboard } from "@/routes"

interface ScenarioComparison {
  scenario_id: number
  scenario_name: string
  year: number
  total_amount: number
  total_subtotal: number
  total_tax: number
  growth_rate: number
  inflation_rate: number
}

interface ComparisonDifference {
  year: number
  scenario1_amount: number
  scenario2_amount: number
  absolute_difference: number
  percentage_difference: number
}

interface ScenarioCompareProps {
  scenarios: Scenario[]
  customerTypes: CustomerType[]
  businessGroups: BusinessGroup[]
  comparisonData?: ScenarioComparison[]
  differences?: ComparisonDifference[]
  selectedScenarios?: number[]
  selectedYear?: number
  selectedCustomerTypeId?: number
  selectedBusinessGroupId?: number
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Dashboard", href: dashboard().url },
  {
    title: "Comparar Escenarios",
    href: "#",
  },
]

export default function ScenarioCompare({
  scenarios,
  customerTypes,
  businessGroups,
  comparisonData = [],
  differences = [],
  selectedScenarios = [],
  selectedYear,
  selectedCustomerTypeId,
  selectedBusinessGroupId,
}: ScenarioCompareProps) {
  const [scenario1, setScenario1] = React.useState<number | undefined>(
    selectedScenarios[0]
  )
  const [scenario2, setScenario2] = React.useState<number | undefined>(
    selectedScenarios[1]
  )
  const [scenario3, setScenario3] = React.useState<number | undefined>(
    selectedScenarios[2]
  )
  const [scenario4, setScenario4] = React.useState<number | undefined>(
    selectedScenarios[3]
  )
  const [year, setYear] = React.useState<number | undefined>(selectedYear)
  const [customerTypeId, setCustomerTypeId] = React.useState<
    number | undefined
  >(selectedCustomerTypeId)
  const [businessGroupId, setBusinessGroupId] = React.useState<
    number | undefined
  >(selectedBusinessGroupId)

  // Get available years from scenarios
  const availableYears = React.useMemo(() => {
    const years = new Set<number>()
    scenarios.forEach((s) => {
      for (let i = 1; i <= s.projection_years; i++) {
        years.add(s.base_year + i)
      }
    })
    return Array.from(years).sort()
  }, [scenarios])

  // Handle comparison
  const handleCompare = () => {
    const scenarioIds = [scenario1, scenario2, scenario3, scenario4].filter(
      (id) => id !== undefined
    )

    if (scenarioIds.length < 2) {
      alert("Debe seleccionar al menos 2 escenarios para comparar")
      return
    }

    const params: any = {
      scenarios: scenarioIds,
    }

    if (year) params.year = year
    if (customerTypeId) params.customer_type_id = customerTypeId
    if (businessGroupId) params.business_group_id = businessGroupId

    router.visit(route("scenarios.compare"), {
      data: params,
      preserveState: true,
    })
  }

  // Prepare chart data
  const chartData = React.useMemo(() => {
    const grouped = new Map<
      number,
      Record<string, number | string>
    >()

    comparisonData.forEach((item) => {
      if (!grouped.has(item.year)) {
        grouped.set(item.year, { year: item.year })
      }
      const yearData = grouped.get(item.year)!
      yearData[`scenario_${item.scenario_id}`] = item.total_amount
    })

    return Array.from(grouped.values()).sort((a, b) => (a.year as number) - (b.year as number))
  }, [comparisonData])

  // Prepare chart series
  const chartSeries = React.useMemo(() => {
    const scenarioIds = [scenario1, scenario2, scenario3, scenario4].filter(
      (id) => id !== undefined
    )

    return scenarioIds.map((id, index) => {
      const scenario = scenarios.find((s) => s.id === id)
      return {
        dataKey: `scenario_${id}`,
        name: scenario?.name || `Escenario ${id}`,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }
    })
  }, [scenario1, scenario2, scenario3, scenario4, scenarios])

  // Prepare differences table by customer type
  const differencesByType = React.useMemo(() => {
    // Group comparison data by customer type
    const grouped = new Map<string, ScenarioComparison[]>()

    comparisonData.forEach((item) => {
      const key = `type_${item.scenario_id}`
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(item)
    })

    return grouped
  }, [comparisonData])

  const hasComparison = comparisonData.length > 0

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Comparar Escenarios" />

      <div className="flex flex-col gap-6 p-6">
        {/* Back Button */}
        <Link href={dashboard().url}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 size-4" />
            Volver al Dashboard
          </Button>
        </Link>

        {/* Header */}
        <PageHeader
          title="Comparar Escenarios"
          subtitle="Analice las diferencias entre múltiples escenarios de proyección"
        />

        {/* Selection Form */}
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Escenarios y Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Scenario Selectors */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Escenario 1 <span className="text-destructive">*</span>
                </label>
                <Select
                  value={scenario1?.toString()}
                  onValueChange={(value) => setScenario1(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {scenarios.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Escenario 2 <span className="text-destructive">*</span>
                </label>
                <Select
                  value={scenario2?.toString()}
                  onValueChange={(value) => setScenario2(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {scenarios.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Escenario 3</label>
                <Select
                  value={scenario3?.toString()}
                  onValueChange={(value) =>
                    setScenario3(value ? Number(value) : undefined)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Ninguno</SelectItem>
                    {scenarios.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Escenario 4</label>
                <Select
                  value={scenario4?.toString()}
                  onValueChange={(value) =>
                    setScenario4(value ? Number(value) : undefined)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Ninguno</SelectItem>
                    {scenarios.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filters */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Año</label>
                <Select
                  value={year?.toString()}
                  onValueChange={(value) =>
                    setYear(value ? Number(value) : undefined)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los años" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {availableYears.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Cliente</label>
                <Select
                  value={customerTypeId?.toString()}
                  onValueChange={(value) =>
                    setCustomerTypeId(value ? Number(value) : undefined)
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

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Grupo Empresarial
                </label>
                <Select
                  value={businessGroupId?.toString()}
                  onValueChange={(value) =>
                    setBusinessGroupId(value ? Number(value) : undefined)
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
            </div>

            {/* Compare Button */}
            <div className="flex justify-end">
              <Button onClick={handleCompare}>
                <GitCompare className="mr-2 size-4" />
                Comparar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Comparison Results */}
        {hasComparison && (
          <>
            {/* Comparison Chart */}
            <ChartCard
              title="Comparativa de Escenarios"
              description="Proyecciones totales por año"
            >
              <ProjectionChart
                data={chartData}
                type="bar"
                series={chartSeries}
                xAxisKey="year"
                height={400}
              />
            </ChartCard>

            {/* Differences Table */}
            <Card>
              <CardHeader>
                <CardTitle>Tabla de Diferencias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Año</TableHead>
                        {chartSeries.map((series) => (
                          <TableHead key={series.dataKey} className="text-right">
                            {series.name}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {chartData.map((row) => (
                        <TableRow key={row.year}>
                          <TableCell className="font-medium">
                            {row.year}
                          </TableCell>
                          {chartSeries.map((series) => (
                            <TableCell
                              key={series.dataKey}
                              className="text-right"
                            >
                              {formatCurrency(
                                (row[series.dataKey] as number) || 0
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Assumptions Comparison */}
            {comparisonData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Comparación de Supuestos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Escenario</TableHead>
                          <TableHead>Año</TableHead>
                          <TableHead className="text-right">
                            Crecimiento
                          </TableHead>
                          <TableHead className="text-right">
                            Inflación
                          </TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comparisonData.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {item.scenario_name}
                            </TableCell>
                            <TableCell>{item.year}</TableCell>
                            <TableCell className="text-right">
                              {formatPercentage(item.growth_rate)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatPercentage(item.inflation_rate)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.total_amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Empty State */}
        {!hasComparison && (
          <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
            <div className="text-center">
              <GitCompare className="text-muted-foreground mx-auto mb-4 size-12" />
              <p className="text-muted-foreground mb-2 text-lg font-medium">
                Seleccione escenarios para comparar
              </p>
              <p className="text-muted-foreground text-sm">
                Elija al menos 2 escenarios y haga clic en "Comparar" para ver
                las diferencias
              </p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
