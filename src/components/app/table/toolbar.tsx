import { type Table } from "@tanstack/react-table";
import { Settings2Icon, MoreHorizontalIcon, PlusIcon, DownloadIcon, FileSpreadsheetIcon, FileTextIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { cn } from "@/lib/utils";
import { ColumnVisibilityPanel } from "./column-visibility-panel";
import type { ProTableToolbarOptions, ProTableContextMenuEvent, ProTableSelectionType } from "./types";

interface ProTableToolbarProps<T extends object> {
  title?: React.ReactNode;
  selectedSet: Set<string>;
  enableColumnVisibility?: boolean;
  toolbarOptions?: ProTableToolbarOptions<T>;
  dataSource: T[];
  getRK: (r: T) => string | number;
  rowSelectionType?: "single" | "multiple";
  table: Table<T>;
  setColumnOrder: (order: string[]) => void;
}

/**
 * Barra de herramientas superior de la tabla.
 * Contiene: título, acciones sobre filas, exportación, botón agregar y panel de columnas.
 */
export function ProTableToolbar<T extends object>({
  title,
  selectedSet,
  enableColumnVisibility,
  toolbarOptions,
  dataSource,
  getRK,
  rowSelectionType,
  table,
  setColumnOrder,
}: ProTableToolbarProps<T>) {
  const hasToolbar = !!title || selectedSet.size > 0 || !!enableColumnVisibility || !!toolbarOptions;

  if (!hasToolbar) return null;

  const fireRowAction = (actionKey: string) => {
    const firstVal = Array.from(selectedSet)[0];
    const firstRow = dataSource.find((r) => String(getRK(r)) === firstVal);
    const finalRows = dataSource.filter((r) => selectedSet.has(String(getRK(r))));
    if (firstRow) {
      toolbarOptions?.rowActions?.onEvent?.({
        actionKey,
        rowKey: firstVal,
        row: firstRow,
        selectionType: (rowSelectionType as ProTableSelectionType) || "none",
        selectedKeys: Array.from(selectedSet),
        selectedRows: finalRows,
      } as ProTableContextMenuEvent<T>);
    }
  };

  return (
    <div className='flex items-center justify-between px-4 border-b bg-card shrink-0 gap-4 overflow-x-auto min-h-11'>
      {/* ── Lado izquierdo: título ── */}
      <div className='flex items-center gap-3'>{title && <div className='font-semibold text-sm'>{title}</div>}</div>

      {/* ── Lado derecho: acciones ── */}
      <div className='flex items-center gap-2 ml-auto'>
        {/* Acciones de fila seleccionada */}
        {selectedSet.size > 0 && toolbarOptions?.rowActions?.items && (
          <>
            {/* Desktop: botones visibles */}
            <div className='hidden sm:flex items-center gap-2'>
              {[...toolbarOptions.rowActions.items].reverse().map((item) => {
                if (selectedSet.size > 1 && !item.multiSelect) return null;
                const btn = (
                  <Button
                    key={item.key}
                    variant={item.variant === "destructive" ? "destructive" : "outline"}
                    size='sm'
                    className='h-7 text-xs px-2.5 shadow-none'
                    onClick={() => fireRowAction(item.key)}
                  >
                    {item.icon && <span className='mr-1 [&>svg]:w-3.5 [&>svg]:h-3.5'>{item.icon}</span>}
                    {item.label}
                  </Button>
                );
                return item.separator ? [<div key={`sep-${item.key}`} className='w-px h-4 bg-border mx-1' />, btn] : btn;
              })}
            </div>

            {/* Mobile: dropdown */}
            <div className='flex sm:hidden items-center'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='outline' size='sm' className='h-7 w-7 p-0 shadow-none' aria-label='Acciones'>
                    <MoreHorizontalIcon className='w-4 h-4' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='z-9999'>
                  <DropdownMenuGroup>
                    {toolbarOptions.rowActions.items.map((item) => {
                      if (selectedSet.size > 1 && !item.multiSelect) return null;
                      if (item.separator) return <DropdownMenuSeparator key={`sep-${item.key}`} />;
                      return (
                        <DropdownMenuItem
                          key={item.key}
                          disabled={item.disabled}
                          className={cn(item.variant === "destructive" && "text-destructive focus:bg-destructive/10 focus:text-destructive")}
                          onClick={() => fireRowAction(item.key)}
                        >
                          {item.icon && <span className='mr-2 [&>svg]:w-4 [&>svg]:h-4'>{item.icon}</span>}
                          {item.label}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}

        {/* Botón de exportar */}
        {toolbarOptions?.export && (toolbarOptions.export.onExcel || toolbarOptions.export.onPdf) && (
          <>
            <div className='w-px h-4 bg-border mx-1' />
            <div className='flex items-center h-7'>
              <ButtonGroup>
                <Button variant='outline' size='sm' className='h-7 px-2 sm:px-2.5 text-xs shadow-none font-medium text-foreground' style={{ cursor: "default" }}>
                  <span className='hidden sm:inline'>Exportar</span>
                  <DownloadIcon className='w-3.5 h-3.5 sm:hidden' />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' size='sm' className='h-7 w-7 p-0 shadow-none' aria-label='Opciones de exportación'>
                      <MoreHorizontalIcon className='w-4 h-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='z-9999'>
                    <DropdownMenuGroup>
                      {toolbarOptions.export.onExcel && (
                        <DropdownMenuItem onClick={toolbarOptions.export.onExcel}>
                          <FileSpreadsheetIcon className='w-4 h-4 text-green-600' />
                          Excel
                        </DropdownMenuItem>
                      )}
                      {toolbarOptions.export.onPdf && (
                        <DropdownMenuItem onClick={toolbarOptions.export.onPdf}>
                          <FileTextIcon className='w-4 h-4 text-red-600' />
                          PDF
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </ButtonGroup>
            </div>
          </>
        )}

        {/* Botón agregar */}
        {toolbarOptions?.add && (
          <Button size='sm' className='h-7 text-xs px-2 sm:px-3 shadow-none' onClick={toolbarOptions.add.onClick}>
            <PlusIcon className='w-3.5 h-3.5 sm:mr-1' />
            <span className='hidden sm:inline'>{toolbarOptions.add.label || "Agregar"}</span>
          </Button>
        )}

        {/* Panel de visibilidad de columnas */}
        {enableColumnVisibility && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant='outline' size='sm' className='h-7 text-xs px-2.5 text-muted-foreground'>
                <Settings2Icon className='w-3.5 h-3.5' />
              </Button>
            </PopoverTrigger>
            <PopoverContent align='end' className='w-64 p-2 rounded-lg' style={{ zIndex: 200 }}>
              <div className='flex flex-col gap-1'>
                <div className='text-[0.65rem] font-semibold text-muted-foreground uppercase px-1 pb-1 border-b mb-1'>Mostrar Columnas</div>
                <div className='max-h-[60vh] overflow-y-auto flex flex-col gap-1 py-1 pr-1'>
                  <ColumnVisibilityPanel table={table} setColumnOrder={setColumnOrder} />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}
