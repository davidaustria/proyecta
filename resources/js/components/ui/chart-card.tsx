import * as React from "react"

import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card"
import { LoadingSpinner } from "./loading-spinner"
import { EmptyState } from "./empty-state"

export interface ChartCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  actions?: React.ReactNode
  isLoading?: boolean
  isEmpty?: boolean
  emptyMessage?: string
  children?: React.ReactNode
}

function ChartCard({
  className,
  title,
  description,
  actions,
  isLoading = false,
  isEmpty = false,
  emptyMessage = "No data available",
  children,
  ...props
}: ChartCardProps) {
  return (
    <Card data-slot="chart-card" className={cn("", className)} {...props}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <LoadingSpinner variant="inline" label="Loading chart..." />
        ) : isEmpty ? (
          <EmptyState
            variant="no-data"
            title={emptyMessage}
            description="Try adjusting your filters or date range"
            className="py-8"
          />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}

export { ChartCard }
