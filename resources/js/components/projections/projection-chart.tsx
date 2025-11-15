import * as React from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from "recharts"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/formatters"

export type ChartType = "bar" | "line" | "area"

export interface ChartDataSeries {
  /**
   * Key to access data in the data array
   */
  dataKey: string
  /**
   * Display name for the series
   */
  name: string
  /**
   * Color for the series (hex or tailwind color variable)
   */
  color: string
  /**
   * Whether to stack this series (for bar and area charts)
   */
  stackId?: string
}

export interface ProjectionChartProps {
  /**
   * Chart data array
   */
  data: any[]
  /**
   * Type of chart to render
   */
  type: ChartType
  /**
   * Data series configuration
   */
  series: ChartDataSeries[]
  /**
   * Key for X-axis in the data
   */
  xAxisKey: string
  /**
   * Label for X-axis
   */
  xAxisLabel?: string
  /**
   * Label for Y-axis
   */
  yAxisLabel?: string
  /**
   * Height of the chart in pixels
   */
  height?: number
  /**
   * Whether to format Y-axis as currency
   */
  formatAsCurrency?: boolean
  /**
   * Currency code for formatting
   */
  currency?: string
  /**
   * Additional className for the container
   */
  className?: string
  /**
   * Whether to show legend
   */
  showLegend?: boolean
  /**
   * Whether to show grid
   */
  showGrid?: boolean
}

/**
 * Custom tooltip component with dark mode support
 */
function CustomTooltip({
  active,
  payload,
  label,
  formatAsCurrency,
  currency,
}: {
  active?: boolean
  payload?: Array<{ color?: string; name?: string; value?: number }>
  label?: string
  formatAsCurrency?: boolean
  currency?: string
}) {
  if (!active || !payload || !payload.length) {
    return null
  }

  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg">
      <p className="mb-2 font-semibold">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="size-3 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">
            {formatAsCurrency
              ? formatCurrency(entry.value as number, currency)
              : (entry.value as number).toLocaleString("es-MX")}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * Generic chart component for projections
 * Supports bar, line, and area charts with theming and responsiveness
 */
function ProjectionChart({
  data,
  type,
  series,
  xAxisKey,
  xAxisLabel,
  yAxisLabel,
  height = 350,
  formatAsCurrency = true,
  currency = "MXN",
  className,
  showLegend = true,
  showGrid = true,
}: ProjectionChartProps) {
  // Format Y-axis tick
  const formatYAxisTick = React.useCallback(
    (value: number) => {
      if (formatAsCurrency) {
        // Compact format for Y-axis
        if (value >= 1000000) {
          return `$${(value / 1000000).toFixed(1)}M`
        }
        if (value >= 1000) {
          return `$${(value / 1000).toFixed(0)}K`
        }
        return `$${value}`
      }
      return value.toLocaleString("es-MX")
    },
    [formatAsCurrency]
  )

  // Common chart props
  const chartProps = {
    data,
    margin: { top: 5, right: 30, left: 20, bottom: 5 },
  }

  // Common axis props
  const axisProps = {
    stroke: "hsl(var(--muted-foreground))",
    fontSize: 12,
  }

  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <BarChart {...chartProps}>
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
              />
            )}
            <XAxis dataKey={xAxisKey} {...axisProps} />
            <YAxis tickFormatter={formatYAxisTick} {...axisProps} />
            <Tooltip
              content={
                <CustomTooltip
                  formatAsCurrency={formatAsCurrency}
                  currency={currency}
                />
              }
            />
            {showLegend && <Legend />}
            {series.map((s) => (
              <Bar
                key={s.dataKey}
                dataKey={s.dataKey}
                name={s.name}
                fill={s.color}
                stackId={s.stackId}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        )

      case "line":
        return (
          <LineChart {...chartProps}>
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
              />
            )}
            <XAxis dataKey={xAxisKey} {...axisProps} />
            <YAxis tickFormatter={formatYAxisTick} {...axisProps} />
            <Tooltip
              content={
                <CustomTooltip
                  formatAsCurrency={formatAsCurrency}
                  currency={currency}
                />
              }
            />
            {showLegend && <Legend />}
            {series.map((s) => (
              <Line
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        )

      case "area":
        return (
          <AreaChart {...chartProps}>
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.3}
              />
            )}
            <XAxis dataKey={xAxisKey} {...axisProps} />
            <YAxis tickFormatter={formatYAxisTick} {...axisProps} />
            <Tooltip
              content={
                <CustomTooltip
                  formatAsCurrency={formatAsCurrency}
                  currency={currency}
                />
              }
            />
            {showLegend && <Legend />}
            {series.map((s) => (
              <Area
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                stroke={s.color}
                fill={s.color}
                fillOpacity={0.6}
                stackId={s.stackId}
              />
            ))}
          </AreaChart>
        )
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  )
}

export { ProjectionChart }
