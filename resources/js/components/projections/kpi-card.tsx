import * as React from "react"
import { StatCard, type StatCardProps } from "@/components/ui/stat-card"
import { formatCurrency, formatPercentage } from "@/lib/formatters"

export interface KPICardProps extends Omit<StatCardProps, "value"> {
  /**
   * Numeric value to display
   */
  value: number
  /**
   * Type of formatting to apply
   */
  type?: "currency" | "percentage" | "number"
  /**
   * Currency code (only for currency type)
   */
  currency?: string
  /**
   * Number of decimal places (for percentage and number types)
   */
  decimals?: number
}

/**
 * Specialized StatCard for KPI metrics with automatic formatting
 * Supports currency, percentage, and number formatting
 */
function KPICard({
  value,
  type = "currency",
  currency = "MXN",
  decimals = 2,
  ...props
}: KPICardProps) {
  const formattedValue = React.useMemo(() => {
    switch (type) {
      case "currency":
        return formatCurrency(value, currency)
      case "percentage":
        return formatPercentage(value, decimals)
      case "number":
        return value.toLocaleString("es-MX", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      default:
        return String(value)
    }
  }, [value, type, currency, decimals])

  return <StatCard value={formattedValue} {...props} />
}

export { KPICard }
