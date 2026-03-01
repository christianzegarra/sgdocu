import { type Table } from "@tanstack/react-table";
import { ChevronLeftIcon, ChevronRightIcon, ChevronsLeftIcon, ChevronsRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProTablePaginationConfig } from "./types";

interface ProTableFooterProps<T extends object> {
  selectedSet: Set<string>;
  dataSource: T[];
  pagination?: boolean | ProTablePaginationConfig;
  table: Table<T>;
  paginationConfig: ProTablePaginationConfig;
  groupRowEnabled?: boolean;
}

/**
 * Pie de la tabla: contador de selección/registros y controles de paginación.
 */
export function ProTableFooter<T extends object>({ selectedSet, pagination, table, paginationConfig, groupRowEnabled }: ProTableFooterProps<T>) {
  const hasGroupedRows = !!groupRowEnabled || table.getRowModel().rows.some((r) => r.getIsGrouped && r.getIsGrouped());

  return (
    <div className='shrink-0 bg-card px-4 py-2 flex items-center justify-between text-muted-foreground text-xs border-t border-border'>
      {/* Contadores */}
      <div className='flex items-center gap-4'>
        {selectedSet.size > 0 && (
          <span>
            {selectedSet.size} seleccionado{selectedSet.size > 1 ? "s" : ""}
          </span>
        )}
        {(() => {
          const preCount = table.getPreFilteredRowModel().rows.length;
          const filteredCount = table.getFilteredRowModel().rows.length;
          if (filteredCount !== preCount) {
            return (
              <span>
                {filteredCount} de {preCount} registros
              </span>
            );
          }
          return (
            <span>
              {preCount} registro{preCount !== 1 ? "s" : ""}
            </span>
          );
        })()}
      </div>

      {/* Paginación (oculta si hay filas agrupadas) */}
      {pagination && !hasGroupedRows && (
        <div className='flex items-center gap-6'>
          {/* Tamaño de página */}
          <div className='flex items-center gap-2'>
            <span className='font-medium text-foreground'>Mostrar</span>
            <Select value={String(table.getState().pagination.pageSize)} onValueChange={(val) => table.setPageSize(Number(val))}>
              <SelectTrigger className='h-7 w-18 text-xs'>
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side='top'>
                {(paginationConfig.pageSizeOptions ?? [10, 20, 50, 100, 250, 500]).map((pageSize) => (
                  <SelectItem key={pageSize} value={String(pageSize)} className='text-xs'>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Indicador de página */}
          <div className='flex items-center gap-2'>
            <span className='font-medium text-foreground'>
              Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
            </span>
          </div>

          {/* Navegación */}
          <div className='flex items-center gap-1'>
            <Button variant='outline' className='h-7 w-7 p-0' onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
              <ChevronsLeftIcon className='h-4 w-4' />
            </Button>
            <Button variant='outline' className='h-7 w-7 p-0' onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <ChevronLeftIcon className='h-4 w-4' />
            </Button>
            <Button variant='outline' className='h-7 w-7 p-0' onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <ChevronRightIcon className='h-4 w-4' />
            </Button>
            <Button variant='outline' className='h-7 w-7 p-0' onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
              <ChevronsRightIcon className='h-4 w-4' />
            </Button>
          </div>
        </div>
      )}

      {/* Mensaje cuando la paginación está activada pero las filas se muestran agrupadas */}
      {pagination && hasGroupedRows && (
        <div className='text-xs text-muted-foreground'>
          Paginación desactivada en registros agrupados
        </div>
      )}
    </div>
  );
}
