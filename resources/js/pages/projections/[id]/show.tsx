import * as React from "react"
import { Head, Link } from "@inertiajs/react"
import { ArrowLeft, Calendar, TrendingUp, Percent } from "lucide-react"
import AppLayout from "@/layouts/app-layout"
import { PageHeader } from "@/components/ui/page-header"
import { KPICard } from "@/components/projections/kpi-card"
import { ProjectionChart } from "@/components/projections/projection-chart"
import { ChartCard } from "@/components/ui/chart-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CHART_COLORS, MONTHS } from "@/lib/constants"
import { formatCurrency, formatPercentage } from "@/lib/formatters"
import { type Projection, type BreadcrumbItem } from "@/types"
import { dashboard } from "@/routes"

interface ProjectionShowProps {
  projection: Projection
}

export default function ProjectionShow({ projection }: ProjectionShowProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: dashboard().url },
    {
      title: "Proyección",
      href: "#",
    },
  ]

  // Get dimension label
  const getDimensionLabel = () => {
    if (projection.customer) {
      return `Cliente: ${projection.customer.name}`
    }
    if (projection.business_group) {
      return `Grupo: ${projection.business_group.name}`
    }
    if (projection.customer_type) {
      return `Tipo: ${projection.customer_type.name}`
    }
    if (projection.product) {
      return `Producto: ${projection.product.name}`
    }
    return "Global"
  }

  // Prepare monthly chart data
  const monthlyChartData = React.useMemo(() => {
    if (!projection.details || projection.details.length === 0) {
      return []
    }

    return projection.details
      .sort((a, b) => a.month - b.month)
      .map((detail) => ({
        month: MONTHS[detail.month - 1],
        monthNumber: detail.month,
        subtotal: detail.subtotal,
        tax: detail.tax,
        total: detail.total,
      }))
  }, [projection.details])

  // Calculate variation vs base
  const variationVsBase =
    projection.base_amount > 0
      ? ((projection.total_amount - projection.base_amount) /
          projection.base_amount) *
        100
      : 0

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Proyección ${projection.year} - ${getDimensionLabel()}`} />

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
          title={`Proyección ${projection.year}`}
          subtitle={getDimensionLabel()}
        />

        {/* Scenario Info */}
        {projection.scenario && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Información del Escenario
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-muted-foreground text-sm">Nombre</p>
                <p className="font-medium">{projection.scenario.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Estado</p>
                <div className="mt-1">
                  <Badge
                    variant={
                      projection.scenario.status === "active"
                        ? "default"
                        : projection.scenario.status === "draft"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {projection.scenario.status === "active"
                      ? "Activo"
                      : projection.scenario.status === "draft"
                        ? "Borrador"
                        : "Archivado"}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Método</p>
                <p className="font-medium">
                  {projection.scenario.calculation_method === "simple_average"
                    ? "Promedio Simple"
                    : projection.scenario.calculation_method ===
                        "weighted_average"
                      ? "Promedio Ponderado"
                      : "Tendencia"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Línea Base</p>
                <div className="mt-1">
                  {projection.scenario.is_baseline ? (
                    <Badge variant="secondary">Sí</Badge>
                  ) : (
                    <span className="text-sm">No</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Monto Base"
            value={projection.base_amount}
            type="currency"
            description="Monto histórico promedio"
          />
          <KPICard
            title="Total Proyectado"
            value={projection.total_amount}
            type="currency"
            description={`Año ${projection.year}`}
          />
          <KPICard
            title="Variación vs Base"
            value={Math.abs(variationVsBase)}
            type="percentage"
            icon={TrendingUp}
            trend={variationVsBase > 0 ? "up" : variationVsBase < 0 ? "down" : "neutral"}
            trendValue={`${Math.abs(variationVsBase).toFixed(1)}%`}
            variant={variationVsBase > 0 ? "success" : variationVsBase < 0 ? "danger" : "default"}
          />
          <KPICard
            title="Inflación Aplicada"
            value={projection.inflation_rate}
            type="percentage"
            icon={Percent}
          />
        </div>

        {/* Assumptions Applied */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Supuestos Aplicados</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-muted-foreground text-sm">
                Tasa de Crecimiento
              </p>
              <p className="text-lg font-semibold">
                {formatPercentage(projection.growth_rate)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">
                Tasa de Inflación
              </p>
              <p className="text-lg font-semibold">
                {formatPercentage(projection.inflation_rate)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Año Proyectado</p>
              <p className="text-lg font-semibold">{projection.year}</p>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Chart */}
        {monthlyChartData.length > 0 && (
          <ChartCard
            title="Distribución Mensual"
            description="Proyección desglosada por mes"
          >
            <ProjectionChart
              data={monthlyChartData}
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
              xAxisKey="month"
              height={400}
            />
          </ChartCard>
        )}

        {/* Monthly Breakdown Table */}
        {projection.details && projection.details.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Desglose Mensual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mes</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="text-right">Impuesto</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">% del Año</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projection.details
                      .sort((a, b) => a.month - b.month)
                      .map((detail) => {
                        const percentOfYear =
                          projection.total_amount > 0
                            ? (detail.total / projection.total_amount) * 100
                            : 0

                        return (
                          <TableRow key={detail.id}>
                            <TableCell className="font-medium">
                              {MONTHS[detail.month - 1]}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(detail.subtotal)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(detail.tax)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(detail.total)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatPercentage(percentOfYear)}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(projection.total_subtotal)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(projection.total_tax)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(projection.total_amount)}
                      </TableCell>
                      <TableCell className="text-right">100.00%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comparison with Historical Base */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Comparación con Base Histórica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-muted-foreground mb-1 text-sm">
                  Monto Base (Histórico)
                </p>
                <p className="text-xl font-bold">
                  {formatCurrency(projection.base_amount)}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-muted-foreground mb-1 text-sm">
                  Monto Proyectado ({projection.year})
                </p>
                <p className="text-xl font-bold">
                  {formatCurrency(projection.total_amount)}
                </p>
              </div>
              <div
                className={`rounded-lg border p-4 ${
                  variationVsBase > 0
                    ? "border-green-500/30 bg-green-500/10"
                    : variationVsBase < 0
                      ? "border-red-500/30 bg-red-500/10"
                      : "bg-muted/50"
                }`}
              >
                <p className="text-muted-foreground mb-1 text-sm">
                  Variación Absoluta
                </p>
                <p className="text-xl font-bold">
                  {formatCurrency(
                    projection.total_amount - projection.base_amount
                  )}
                </p>
                <p className="text-sm">
                  {formatPercentage(Math.abs(variationVsBase))}
                  {variationVsBase > 0 ? " ↑" : variationVsBase < 0 ? " ↓" : ""}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
