import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { FileQuestion, SearchX, AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "./button"

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center gap-4 text-center py-12",
  {
    variants: {
      variant: {
        default: "",
        "no-data": "",
        "no-results": "",
        error: "text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const defaultIcons = {
  default: FileQuestion,
  "no-data": FileQuestion,
  "no-results": SearchX,
  error: AlertCircle,
}

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: "default" | "outline"
  }
}

function EmptyState({
  className,
  variant = "default",
  icon: Icon,
  title,
  description,
  action,
  ...props
}: EmptyStateProps) {
  const DefaultIcon = Icon || defaultIcons[variant || "default"]

  return (
    <div
      data-slot="empty-state"
      className={cn(emptyStateVariants({ variant }), className)}
      {...props}
    >
      <div
        className={cn(
          "bg-muted flex size-16 items-center justify-center rounded-full",
          variant === "error" && "bg-destructive/10"
        )}
      >
        <DefaultIcon
          className={cn(
            "text-muted-foreground size-8",
            variant === "error" && "text-destructive"
          )}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-muted-foreground text-sm max-w-md">
            {description}
          </p>
        )}
      </div>

      {action && (
        <Button
          variant={action.variant || "default"}
          onClick={action.onClick}
          className="mt-2"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

export { EmptyState, emptyStateVariants }
