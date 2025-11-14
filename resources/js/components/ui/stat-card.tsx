import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "./card"

const statCardVariants = cva("", {
  variants: {
    variant: {
      default: "",
      success: "border-green-500/20 dark:border-green-500/30",
      warning: "border-yellow-500/20 dark:border-yellow-500/30",
      danger: "border-red-500/20 dark:border-red-500/30",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

const trendVariants = cva("flex items-center gap-1 text-sm font-medium", {
  variants: {
    trend: {
      up: "text-green-600 dark:text-green-500",
      down: "text-red-600 dark:text-red-500",
      neutral: "text-muted-foreground",
    },
  },
  defaultVariants: {
    trend: "neutral",
  },
})

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
}

export interface StatCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statCardVariants> {
  title: string
  value: string | number
  icon?: React.ComponentType<{ className?: string }>
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  description?: string
}

function StatCard({
  className,
  variant,
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  description,
  ...props
}: StatCardProps) {
  const TrendIcon = trend ? trendIcons[trend] : null

  return (
    <Card
      data-slot="stat-card"
      className={cn(statCardVariants({ variant }), className)}
      {...props}
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && (
          <Icon className="text-muted-foreground size-4 shrink-0" />
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {trend && trendValue && TrendIcon && (
            <span className={cn(trendVariants({ trend }))}>
              <TrendIcon className="size-4" />
              {trendValue}
            </span>
          )}
        </div>
        {description && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

export { StatCard, statCardVariants }
