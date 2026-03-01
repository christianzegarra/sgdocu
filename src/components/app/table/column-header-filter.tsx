import { useState, useMemo, useEffect } from "react";
import { type Header, type RowData } from "@tanstack/react-table";
import { FilterIcon, SearchIcon, XIcon } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface ColumnHeaderFilterProps<TData extends RowData> {
  header: Header<TData, unknown>;
}

/**
 * Botón de filtro que aparece en las cabeceras de columna.
 * Soporta filtro por texto y/o selección múltiple por facetas.
 */
export function ColumnHeaderFilter<TData extends RowData>({ header }: ColumnHeaderFilterProps<TData>) {
  const meta = header.column.columnDef.meta;
  if (!meta?.enableSearchFilter && !meta?.enableSelectFilter) return null;

  const isSorted = header.column.getIsSorted();
  const filterValue = header.column.getFilterValue();
  const facets = header.column.getFacetedUniqueValues();
  const uniqueKeys = useMemo(() => Array.from(facets.keys()).sort(), [facets]);

  const activeSet = useMemo(() => new Set<string>(Array.isArray(filterValue) ? filterValue : []), [filterValue]);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(!Array.isArray(filterValue) ? ((filterValue as string) ?? "") : "");

  const isSearchOnly = meta.enableSearchFilter && !meta.enableSelectFilter;
  const TriggerIcon = isSearchOnly ? SearchIcon : FilterIcon;

  // Debounce del filtro de texto
  useEffect(() => {
    if (meta.enableSearchFilter && !meta.enableSelectFilter) {
      const timeout = setTimeout(() => {
        header.column.setFilterValue(search || undefined);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [search, meta, header.column]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={cn("p-0.5 rounded-sm hover:bg-black/5 text-muted-foreground outline-none", meta.align === "right" ? "mr-1.5" : "ml-1.5")}>
          <TriggerIcon className={cn("w-3 h-3", isSorted || filterValue ? "text-primary fill-primary/20" : "")} />
        </button>
      </PopoverTrigger>
      <PopoverContent className='w-56 p-2 rounded-lg' align='end' style={{ zIndex: 200 }}>
        <div className='flex flex-col gap-2'>
          {/* FILTRO DE TEXTO */}
          {meta.enableSearchFilter && (
            <div className='flex flex-col gap-1 mt-1'>
              <div className='text-[0.65rem] font-semibold text-muted-foreground uppercase px-1'>Buscar</div>
              <div className='relative'>
                <SearchIcon className='absolute left-2 top-1.5 w-3 h-3 text-muted-foreground' />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder='Filtrar...' className='h-7 pl-7 pr-7 text-xs rounded-md' />
                {search && (
                  <button
                    className='absolute right-2 top-1.5 text-muted-foreground hover:text-foreground transition-colors'
                    onClick={() => setSearch("")}
                    tabIndex={-1}
                    type='button'
                  >
                    <XIcon className='w-3 h-3' />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* SELECCIÓN POR FACETAS */}
          {meta.enableSelectFilter && uniqueKeys.length > 0 && (
            <div className='flex flex-col gap-1 mt-1'>
              <div className='max-h-72 overflow-y-auto flex flex-col gap-1 py-1'>
                {uniqueKeys.map((key) => {
                  const count = facets.get(key) || 0;
                  if (key === undefined || key === null || key === "") return null;
                  if (search && !String(key).toLowerCase().includes(search.toLowerCase())) return null;

                  const labelText = header.column.columnDef.meta?.selectFilterOptions?.[String(key)] ?? String(key);

                  return (
                    <label key={String(key)} className='flex items-center gap-2 px-1 py-0.5 hover:bg-muted/50 rounded cursor-pointer'>
                      <Checkbox
                        className='w-3 h-3 rounded-[2px]'
                        checked={activeSet.has(String(key))}
                        onCheckedChange={(c) => {
                          const newSet = new Set(activeSet);
                          if (c) newSet.add(String(key));
                          else newSet.delete(String(key));
                          header.column.setFilterValue(newSet.size > 0 ? Array.from(newSet) : undefined);
                        }}
                      />
                      <span className='text-xs flex-1 truncate'>{String(labelText)}</span>
                      <span className='text-[0.65rem] text-muted-foreground'>{count}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
