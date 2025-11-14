import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Spinner } from "./spinner"

const loadingSpinnerVariants = cva("flex items-center justify-center", {
  variants: {
    variant: {
      default: "",
      overlay: "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
      inline: "w-full py-8",
      page: "min-h-[400px] w-full",
    },
    size: {
      sm: "[&>svg]:size-4",
      md: "[&>svg]:size-6",
      lg: "[&>svg]:size-8",
      xl: "[&>svg]:size-12",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
})

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingSpinnerVariants> {
  label?: string
}

function LoadingSpinner({
  className,
  variant,
  size,
  label = "Loading...",
  ...props
}: LoadingSpinnerProps) {
  return (
    <div
      data-slot="loading-spinner"
      className={cn(loadingSpinnerVariants({ variant, size }), className)}
      {...props}
    >
      <div className="flex flex-col items-center gap-2">
        <Spinner className="text-primary" />
        {label && (
          <span className="text-muted-foreground text-sm">{label}</span>
        )}
      </div>
    </div>
  )
}

export { LoadingSpinner, loadingSpinnerVariants }
