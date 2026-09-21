"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export interface Column<T> {
  key: string;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading: boolean;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  idKey?: keyof T;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  onEdit,
  onDelete,
  idKey,
  emptyMessage = "No data found",
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div
        className="overflow-hidden rounded-lg border border-border"
        role="status"
        aria-label="Loading table data"
      >
        <div
          className="grid gap-4 border-b border-border bg-muted px-4 py-3"
          style={{ gridTemplateColumns: `repeat(${columns.length + (onEdit || onDelete ? 1 : 0)}, minmax(7rem, 1fr))` }}
        >
          {columns.map((column) => (
            <Skeleton key={column.key} className="h-4 w-20" />
          ))}
          {(onEdit || onDelete) && <Skeleton className="ml-auto h-4 w-16" />}
        </div>
        <div className="space-y-0">
          {Array.from({ length: 5 }, (_, rowIndex) => (
            <div
              key={rowIndex}
              className="grid gap-4 border-b border-border/50 px-4 py-4 last:border-0"
              style={{ gridTemplateColumns: `repeat(${columns.length + (onEdit || onDelete ? 1 : 0)}, minmax(7rem, 1fr))` }}
            >
              {columns.map((column, columnIndex) => (
                <Skeleton
                  key={column.key}
                  className={cn(
                    "h-4",
                    columnIndex % 2 === 0 ? "w-24" : "w-32",
                  )}
                />
              ))}
              {(onEdit || onDelete) && <Skeleton className="ml-auto h-8 w-24" />}
            </div>
          ))}
        </div>
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="size-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted border-b border-border">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left font-medium text-foreground"
                >
                  {col.label}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-4 py-3 text-right font-medium text-foreground">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => {
              const rowKey =
                idKey && row[idKey] !== undefined
                  ? String(row[idKey])
                  : String(idx);
              const rowRecord = row as Record<string, unknown>;

              return (
                <tr
                  key={rowKey}
                  className="border-b border-border/50 hover:bg-muted/50"
                >
                  {columns.map((col) => {
                    const val = rowRecord[col.key];
                    return (
                      <td key={col.key} className="px-4 py-3">
                        {col.render
                          ? col.render(val, row)
                          : (val as React.ReactNode)}
                      </td>
                    );
                  })}
                  {(onEdit || onDelete) && (
                    <td className="px-4 py-3 text-right space-x-2">
                      {onEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(row)}
                        >
                          Edit
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDelete(row)}
                        >
                          Delete
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
