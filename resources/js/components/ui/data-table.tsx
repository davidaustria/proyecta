import * as React from "react"
import { ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table"
import { Button } from "./button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu"
import { Skeleton } from "./skeleton"
import { EmptyState } from "./empty-state"

export interface ColumnDef<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, row: T) => React.ReactNode
  className?: string
}

export interface DataTableAction<T> {
  label: string
  onClick: (row: T) => void
  variant?: "default" | "destructive"
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  keyField?: keyof T
  onSort?: (key: string, direction: "asc" | "desc") => void
  sortKey?: string
  sortDirection?: "asc" | "desc"
  actions?: DataTableAction<T>[]
  isLoading?: boolean
  isEmpty?: boolean
  emptyMessage?: string
  emptyState?: {
    icon?: React.ComponentType<any>
    title?: string
    description?: string
  }
  className?: string
  pagination?: {
    currentPage: number
    totalPages: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
  }
}

function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField = "id" as keyof T,
  onSort,
  sortKey,
  sortDirection,
  actions,
  isLoading = false,
  isEmpty = false,
  emptyMessage = "No data available",
  emptyState,
  className,
  pagination,
}: DataTableProps<T>) {
  const handleSort = (key: string) => {
    if (!onSort) return

    const newDirection =
      sortKey === key && sortDirection === "asc" ? "desc" : "asc"
    onSort(key, newDirection)
  }

  const renderSortIcon = (columnKey: string) => {
    if (sortKey !== columnKey) {
      return <ArrowUpDown className="ml-2 size-4" />
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-2 size-4" />
    ) : (
      <ArrowDown className="ml-2 size-4" />
    )
  }

  const renderLoadingSkeleton = () => (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index}>
          {columns.map((column) => (
            <TableCell key={column.key}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
          {actions && actions.length > 0 && (
            <TableCell>
              <Skeleton className="size-8" />
            </TableCell>
          )}
        </TableRow>
      ))}
    </>
  )

  const renderEmptyState = () => {
    const Icon = emptyState?.icon;
    return (
      <TableRow>
        <TableCell colSpan={columns.length + (actions ? 1 : 0)}>
          <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
            {Icon && <Icon className="size-12 text-muted-foreground" />}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {emptyState?.title || emptyMessage}
              </h3>
              {emptyState?.description && (
                <p className="text-sm text-muted-foreground">
                  {emptyState.description}
                </p>
              )}
            </div>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  const renderDataRows = () =>
    data.map((row) => (
      <TableRow key={String(row[keyField])}>
        {columns.map((column) => (
          <TableCell key={column.key} className={column.className}>
            {column.render
              ? column.render(row[column.key], row)
              : String(row[column.key] ?? "")}
          </TableCell>
        ))}
        {actions && actions.length > 0 && (
          <TableCell className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.map((action, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => action.onClick(row)}
                    className={cn(
                      action.variant === "destructive" &&
                        "text-destructive focus:text-destructive"
                    )}
                  >
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        )}
      </TableRow>
    ))

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.sortable ? (
                    <Button
                      variant="ghost"
                      onClick={() => handleSort(column.key)}
                      className="-ml-4 h-auto px-4 py-0 font-medium hover:bg-transparent"
                    >
                      {column.label}
                      {renderSortIcon(column.key)}
                    </Button>
                  ) : (
                    column.label
                  )}
                </TableHead>
              ))}
              {actions && actions.length > 0 && (
                <TableHead className="w-[50px] text-right">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? renderLoadingSkeleton()
              : isEmpty || data.length === 0
                ? renderEmptyState()
                : renderDataRows()}
          </TableBody>
        </Table>
      </div>

      {pagination && !isLoading && data.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-sm">
            Showing {(pagination.currentPage - 1) * pagination.pageSize + 1} to{" "}
            {Math.min(
              pagination.currentPage * pagination.pageSize,
              pagination.total
            )}{" "}
            of {pagination.total} results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export { DataTable }
