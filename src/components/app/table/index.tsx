import {
  type ColumnDef,
  type Header,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  getPaginationRowModel,
  type PaginationState,
  getExpandedRowModel,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useState, useMemo, useEffect, memo, type ReactNode, useCallback } from "react";
import { cn } from "@/lib/utils";
import { GripVerticalIcon, MinusCircleIcon, PlusCircleIcon, Loader2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Mapeo semántico fijo a clases Tailwind para estados
// Añadir aquí claves semánticas comunes utilizadas en la app.
const STATUS_COLOR_CLASSES: Record<string, string> = {
  // Core semantic variants
  success: "bg-emerald-100 text-emerald-700 border-emerald-300",
  danger: "bg-red-100 text-red-700 border-red-300",
  warning: "bg-amber-100 text-amber-700 border-amber-300",
  info: "bg-sky-100 text-sky-700 border-sky-300",
  muted: "bg-muted/10 text-muted-foreground border-border",
  // Brand / UI variants
  primary: "bg-primary/10 text-primary border-primary/20",
  secondary: "bg-secondary/10 text-secondary border-secondary/20",
  accent: "bg-accent/10 text-accent border-accent/20",
  // Color-specific helpers
  purple: "bg-purple-100 text-purple-700 border-purple-300",
  violet: "bg-violet-100 text-violet-700 border-violet-300",
  indigo: "bg-indigo-100 text-indigo-700 border-indigo-300",
  blue: "bg-blue-100 text-blue-700 border-blue-300",
  cyan: "bg-cyan-100 text-cyan-700 border-cyan-300",
  teal: "bg-teal-100 text-teal-700 border-teal-300",
  green: "bg-emerald-100 text-emerald-700 border-emerald-300",
  lime: "bg-lime-100 text-lime-700 border-lime-300",
  amber: "bg-amber-100 text-amber-700 border-amber-300",
  orange: "bg-orange-100 text-orange-700 border-orange-300",
  rose: "bg-rose-100 text-rose-700 border-rose-300",
  slate: "bg-slate-100 text-slate-700 border-slate-300",
  stone: "bg-stone-100 text-stone-700 border-stone-300",
  zinc: "bg-zinc-100 text-zinc-700 border-zinc-300",
  neutral: "bg-neutral-100 text-neutral-700 border-neutral-300",
};

function resolveStatusClass(input?: string) {
  if (!input) return "";
  const key = input.trim().toLowerCase();
  if (STATUS_COLOR_CLASSES[key]) return STATUS_COLOR_CLASSES[key];
  return input; // treat as raw className
}

import { ProTableToolbar } from "./toolbar";
import { ProTableStickyHeader } from "./table-header";
import { ProTableRow } from "./table-row";
import { ProTableFooter } from "./table-footer";
import { ProTableSummaryRow } from "./table-summary";
import { ProTableGroupHeaderRow } from "./table-group-row";
import { ProTableContextMenu } from "./context-menu";
import { HighlightedText } from "./highlighted-text";
import { enforceMinSize } from "./utils";

import type { ProTableProps, ProTableBorderConfig, CtxState } from "./types";

export type { ColumnDef };
export type {
  ProTableScroll,
  ProTableContextMenuItem,
  ProTableSelectionType,
  ProTableContextMenuEvent,
  ProTableDraggableProps,
  ProTableExportProps,
  ProTableAddProps,
  ProTableToolbarOptions,
  ProTableExpandable,
  ProTablePaginationConfig,
  ProTableBorderConfig,
  ProTableRowSelection,
  ProTableInfiniteScrollConfig,
  ProTableInfiniteScrollParams,
  ProTableSummary,
  ProTableSummaryColumnConfig,
  ProTableSummaryReducer,
  ProTableGroupRowConfig,
  ProTableGroupColumnConfig,
  ProTableProps,
} from "./types";

function ProTableBase<T extends object>({
  columns,
  dataSource,
  rowKey,
  scroll,
  className,
  rowHeight = 32,
  bordered = true,
  draggable,
  title,
  enableColumnVisibility,
  pagination,
  toolbarOptions,
  expandable,
  loading,
  striped = false,
  rowSelection: _rowSelection,
  infiniteScroll,
  summary,
  groupRow,
}: ProTableProps<T>) {
  const bConfig: ProTableBorderConfig =
    typeof bordered === "boolean" ? { wrapper: bordered, records: bordered ? "vertical" : "none" } : { wrapper: true, records: "vertical", ...(bordered || {}) };

  const showWrapperBorder = !!bConfig.wrapper;
  const showVerticalRecordBorder = bConfig.records === "vertical" || bConfig.records === "both";
  const showHorizontalRecordBorder = bConfig.records === "horizontal" || bConfig.records === "both";

  const rowSelection = useMemo(() => (_rowSelection ? { type: "single" as const, ..._rowSelection } : undefined), [_rowSelection]);

  const [columnSizing, setColumnSizing] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [internalSelectedKeys, setInternalSelectedKeys] = useState<(string | number)[]>([]);

  const activeSelectedKeys = rowSelection?.selectedRowKeys ?? internalSelectedKeys;
  const selectedSet = useMemo(() => new Set((activeSelectedKeys || []).map(String)), [activeSelectedKeys]);

  const updateSelection = useCallback(
    (keys: (string | number)[], selectedRows: T[]) => {
      setInternalSelectedKeys(keys);
      rowSelection?.onChange?.(keys, selectedRows);
    },
    [rowSelection],
  );

  const paginationConfig = typeof pagination === "object" ? pagination : {};
  const isServerPagination = paginationConfig.total !== undefined;

  // groupRow desactiva la paginación de TanStack para que se muestren
  // todos los registros; el footer igual recibe el prop original `pagination`
  // para mostrar el mensaje informativo cuando corresponde.
  const effectivePagination = (infiniteScroll || !!groupRow) ? false : pagination;

  const [infinitePageIndex, setInfinitePageIndex] = useState(0);
  const infiniteLoadingRef = useRef(false);

  const [internalPagination, setInternalPagination] = useState<PaginationState>({
    pageIndex: paginationConfig.pageIndex ?? 0,
    pageSize: paginationConfig.pageSize ?? paginationConfig.defaultPageSize ?? 100,
  });

  const paginationState = {
    pageIndex: paginationConfig.pageIndex ?? internalPagination.pageIndex,
    pageSize: paginationConfig.pageSize ?? internalPagination.pageSize,
  };

  const handlePaginationChange = useCallback(
    (updater: any) => {
      const newState = typeof updater === "function" ? updater(paginationState) : updater;
      setInternalPagination(newState);
      paginationConfig.onPaginationChange?.(newState.pageIndex, newState.pageSize);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paginationState, paginationConfig],
  );

  useEffect(() => {
    if (infiniteScroll && dataSource.length === 0) {
      setInfinitePageIndex(0);
      infiniteLoadingRef.current = false;
    }
  }, [infiniteScroll, dataSource.length]);

  const [containerWidth, setContainerWidth] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [ctx, setCtx] = useState<CtxState<T> | null>(null);
  const [_isScrolledLeft, setIsScrolledLeft] = useState(false);
  const [_isScrolledRight, setIsScrolledRight] = useState(false);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [dragGripKey, setDragGripKey] = useState<string | null>(null);

  // ── Group row: Set que rastreo colapso/expansión explícita ────────────────
  // Si defaultCollapsed=false (defecto): el Set guarda grupos COLAPSADOS
  // Si defaultCollapsed=true:            el Set guarda grupos EXPANDIDOS
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!ctx) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      setCtx(null);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [ctx]);

  const getRK = useCallback((r: T) => r[rowKey] as string | number, [rowKey]);

  const finalColumns = useMemo(() => {
    const dragBaseCols: any[] =
      draggable?.enable && !groupRow
        ? [
            {
              id: "_drag_",
              size: 36,
              minSize: 36,
              maxSize: 36,
              enableResizing: false,
              header: () => <span />,
              meta: { align: "center", fixed: "left" },
              cell: ({ row }: any) => (
                <div
                  className='flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary hover:bg-primary/10 w-7 h-7 mx-auto rounded-md transition-colors'
                  onMouseEnter={() => setDragGripKey(row.id)}
                  onMouseLeave={() => setDragGripKey(null)}
                  title='Arrastrar fila'
                >
                  <GripVerticalIcon className='w-4 h-4' />
                </div>
              ),
            },
          ]
        : [];

    const expandCols: any[] = expandable
      ? [
          {
            id: "_expand_",
            size: 36,
            minSize: 36,
            maxSize: 36,
            enableResizing: false,
            header: ({ table }: any) => {
              const hasExpanded = table.getIsSomeRowsExpanded() || table.getIsAllRowsExpanded();
              if (hasExpanded) {
                return (
                  <button
                    className='flex items-center justify-center w-4 h-4 rounded hover:bg-muted/50 cursor-pointer pointer-events-auto transition-colors'
                    onClick={(e) => {
                      e.stopPropagation();
                      table.toggleAllRowsExpanded(false);
                    }}
                    title='Contraer todas las filas'
                  >
                    <MinusCircleIcon className='w-4 h-4 text-muted-foreground' />
                  </button>
                );
              }
              return null;
            },
            cell: (info: any) => {
              const row = info.row;
              const tableMeta = info.table.options.meta as any;

              if (row.getCanExpand()) {
                return (
                  <button
                    className='flex items-center justify-center w-full rounded hover:bg-muted/50 cursor-pointer pointer-events-auto transition-colors'
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!row.getIsExpanded() && tableMeta?.rowSelection?.type === "single") {
                        tableMeta.updateSelection([getRK(row.original)], [row.original]);
                      }
                      row.toggleExpanded();
                    }}
                  >
                    {row.getIsExpanded() ? <MinusCircleIcon className='w-4 h-4 text-muted-foreground' /> : <PlusCircleIcon className='w-4 h-4 text-muted-foreground' />}
                  </button>
                );
              }
              return null;
            },
            meta: { fixed: "left", align: "center" },
          },
        ]
      : [];

    const selectionCols: any[] = rowSelection
      ? [
          {
            id: "_selection_",
            size: 36,
            minSize: 36,
            maxSize: 36,
            enableResizing: false,
            header: ({ table }) => {
              const metaRowSel = table.options.meta?.rowSelection as any;
              const metaSelectedSet = table.options.meta?.selectedSet as Set<string>;
              const metaAllKeys = table.options.meta?.allKeys as (string | number)[];
              const metaDataSource = table.options.meta?.dataSource as T[];
              const metaUpdateSelection = table.options.meta?.updateSelection as any;

              if (metaRowSel?.type === "single") return null;

              const isAllSelected = metaAllKeys.length > 0 && metaAllKeys.every((k) => metaSelectedSet.has(String(k)));
              const isIndeterminate = metaAllKeys.some((k) => metaSelectedSet.has(String(k))) && !isAllSelected;

              return (
                <input
                  type='checkbox'
                  className='w-3.5 h-3.5 accent-primary cursor-pointer align-middle'
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  onChange={(e) => {
                    if (e.target.checked) {
                      metaUpdateSelection(metaAllKeys, metaDataSource);
                    } else {
                      metaUpdateSelection([], []);
                    }
                  }}
                />
              );
            },
            cell: (info: any) => {
              const row = info.row.original;
              const rk = getRK(row);

              const metaRowSel = info.table.options.meta?.rowSelection as any;
              const metaSelectedSet = info.table.options.meta?.selectedSet as Set<string>;
              const metaDataSource = info.table.options.meta?.dataSource as T[];
              const metaUpdateSelection = info.table.options.meta?.updateSelection as any;

              const isSelected = metaSelectedSet.has(String(rk));

              if (metaRowSel?.type === "single") {
                return (
                  <input
                    type='radio'
                    name={`protable-radio-${info.table.id || "table"}`}
                    className='w-3.5 h-3.5 accent-primary cursor-pointer align-middle'
                    checked={isSelected}
                    onChange={() => metaRowSel.onChange?.([String(rk)], [row])}
                    onClick={(e) => e.stopPropagation()}
                  />
                );
              }

              return (
                <input
                  type='checkbox'
                  className='w-3.5 h-3.5 accent-primary cursor-pointer align-middle'
                  checked={isSelected}
                  onChange={(e) => {
                    const newKeys = new Set(metaSelectedSet);
                    const sRk = String(rk);
                    if (e.target.checked) newKeys.add(sRk);
                    else newKeys.delete(sRk);
                    const finalKeys = Array.from(newKeys);
                    const finalRows = metaDataSource.filter((r) => newKeys.has(String(getRK(r))));
                    metaUpdateSelection(finalKeys as any, finalRows);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              );
            },
          } as ColumnDef<T, any>,
        ]
      : [];

    const rawCols = [...dragBaseCols, ...expandCols, ...selectionCols, ...columns];

    return enforceMinSize(rawCols);
  }, [columns, expandable, draggable, rowSelection, getRK]);

  const allKeys = useMemo(() => dataSource.map((r) => getRK(r)), [dataSource, getRK]);

  const columnPinning = useMemo(() => {
    const left: string[] = [];
    const right: string[] = [];
    const traverse = (cols: any[], inheritedFixed?: "left" | "right") => {
      cols.forEach((col) => {
        const effectiveFixed = inheritedFixed ?? col.meta?.fixed;
        const colId = col.id || col.accessorKey;
        const isSystemCol = col.id === "_selection_" || col.id === "_drag_" || col.id === "_expand_";

        if (col.columns && Array.isArray(col.columns)) {
          traverse(col.columns, effectiveFixed);
        } else {
          if (isSystemCol || effectiveFixed === "left") left.push(colId);
          else if (effectiveFixed === "right") right.push(colId);
        }
      });
    };
    traverse(finalColumns);
    return { left, right };
  }, [finalColumns]);

  const table = useReactTable<T>({
    data: dataSource,
    columns: finalColumns,
    state: {
      columnSizing,
      sorting,
      columnFilters,
      columnPinning,
      columnVisibility,
      ...(columnOrder.length > 0 ? { columnOrder } : {}),
      ...(effectivePagination ? { pagination: paginationState } : {}),
    },
    onColumnSizingChange: setColumnSizing,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    ...(effectivePagination ? { onPaginationChange: handlePaginationChange } : {}),
    ...(effectivePagination && isServerPagination
      ? {
          manualPagination: true,
          pageCount: Math.ceil((paginationConfig.total ?? 0) / paginationState.pageSize),
          rowCount: paginationConfig.total,
        }
      : {}),
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    ...(effectivePagination ? { getPaginationRowModel: getPaginationRowModel() } : {}),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: (row) => (expandable?.rowExpandable ? expandable.rowExpandable(row.original) : !!expandable),
    defaultColumn: {
      size: 150,
      minSize: 50,
      cell: ({ getValue, column }) => {
        const val = getValue();

        const DEFAULT_STATUS_CLASSES: Record<string, string> = {
          Activo: "bg-emerald-100 text-emerald-700 border-emerald-300",
          Inactivo: "bg-red-100 text-red-700 border-red-300",
          Pendiente: "bg-amber-100 text-amber-700 border-amber-300",
        };

        const DEFAULT_BOOLEAN_TRUE_CLASS = "bg-emerald-100 text-emerald-700 border-emerald-300";
        const DEFAULT_BOOLEAN_FALSE_CLASS = "bg-muted/10 text-muted-foreground border-border";

        // Status badge rendering when column.meta.status is provided
        const statusCfg = (column.columnDef as any)?.meta?.status as
          | {
              type: "boolean";
              trueLabel?: string;
              falseLabel?: string;
              useYesNo?: boolean;
              trueClass?: string;
              falseClass?: string;
            }
          | {
              type: "map";
              map: Record<string, string | { label: string; color?: string }>;
            }
          | undefined;

        if (statusCfg) {
          // Boolean status
          if ((statusCfg as any).type === "boolean") {
            const cfg = statusCfg as any;
            const b = Boolean(val);
            const label = b ? (cfg.trueLabel ?? (cfg.useYesNo ? "Yes" : "Sí")) : (cfg.falseLabel ?? (cfg.useYesNo ? "No" : "No"));
            const className = b ? (cfg.trueClass ?? DEFAULT_BOOLEAN_TRUE_CLASS) : (cfg.falseClass ?? DEFAULT_BOOLEAN_FALSE_CLASS);
            return (
              <Badge variant='outline' className={cn(className, "px-2 py-0.5 w-full rounded-sm")}>
                {label}
              </Badge>
            );
          }

          // Map status
          if ((statusCfg as any).type === "map") {
            const cfg = statusCfg as any;
            const entry = cfg.map?.[String(val)];
            let label = String(val ?? "");
            let className = "";
            if (entry !== undefined) {
              if (typeof entry === "string") {
                label = entry;
                const maybeKey = String(entry).trim().toLowerCase();
                if (STATUS_COLOR_CLASSES[maybeKey]) {
                  className = resolveStatusClass(entry);
                } else {
                  className = DEFAULT_STATUS_CLASSES[String(val)] ?? "";
                }
              } else {
                label = entry.label;
                const color = entry.color;
                if (color) {
                  className = resolveStatusClass(String(color));
                } else {
                  className = DEFAULT_STATUS_CLASSES[String(val)] ?? "";
                }
              }
            }
            return (
              <Badge variant='outline' className={cn(className, "px-2 py-0.5 w-full rounded-sm")}>
                {label}
              </Badge>
            );
          }
        }

        const search = column.getFilterValue();
        if ((typeof val === "string" || typeof val === "number") && search) {
          if (typeof search === "string" || (Array.isArray(search) && search.length > 0)) {
            return <HighlightedText text={String(val)} query={search as string | string[]} />;
          }
        }
        return val as ReactNode;
      },
    },
    meta: {
      rowSelection,
      selectedSet,
      dataSource,
      allKeys,
      updateSelection,
    } as any,
  });

  const { rows } = table.getRowModel();

  // ── Group row flat items ──────────────────────────────────────────────────
  type FlatItem = { kind: "group"; groupKey: string; groupValue: unknown; groupRows: T[] } | { kind: "row"; tableRow: (typeof rows)[number] };

  const flatItems = useMemo<FlatItem[]>(() => {
    if (!groupRow) return [];

    const groups = new Map<string, { value: unknown; tableRows: (typeof rows)[number][] }>();
    rows.forEach((row) => {
      const val = (row.original as any)[groupRow.groupBy];
      const key = String(val ?? "");
      if (!groups.has(key)) groups.set(key, { value: val, tableRows: [] });
      groups.get(key)!.tableRows.push(row);
    });

    const items: FlatItem[] = [];
    const isCollapsed = groupRow.defaultCollapsed ? (key: string) => !collapsedGroups.has(key) : (key: string) => collapsedGroups.has(key);

    groups.forEach((group, key) => {
      items.push({ kind: "group", groupKey: key, groupValue: group.value, groupRows: group.tableRows.map((r) => r.original) });
      if (!isCollapsed(key)) {
        group.tableRows.forEach((tr) => items.push({ kind: "row", tableRow: tr }));
      }
    });

    return items;
  }, [groupRow, rows, collapsedGroups]);

  const toggleGroup = useCallback((key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const baseTableW = table.getTotalSize();
  const visibleLeaves = table.getVisibleLeafColumns();
  const extraDiff = containerWidth > baseTableW ? containerWidth - baseTableW : 0;

  const { virtualSizes, virtualOffsets, virtualRightOffsets, tableW } = useMemo(() => {
    let currentOffset = 0;
    const sizes = new Map<string, number>();
    const offsets = new Map<string, number>();

    visibleLeaves.forEach((col) => {
      const flexRatio = col.getSize() / baseTableW;
      const expandedSize = col.getSize() + extraDiff * flexRatio;

      sizes.set(col.id, expandedSize);
      offsets.set(col.id, currentOffset);
      currentOffset += expandedSize;
    });

    let finalTableW = currentOffset > baseTableW ? currentOffset : baseTableW;
    if (containerWidth >= finalTableW) {
      finalTableW = containerWidth;
    }

    const lastNonRightPinned = [...visibleLeaves].reverse().find((col) => col.getIsPinned() !== "right");
    if (lastNonRightPinned) {
      const sumSizes = visibleLeaves.reduce((acc, col) => acc + (sizes.get(col.id) ?? 0), 0);
      const remainder = finalTableW - sumSizes;
      if (Math.abs(remainder) > 0.001) {
        sizes.set(lastNonRightPinned.id, (sizes.get(lastNonRightPinned.id) ?? 0) + remainder);
      }
    }

    let recalcOffset = 0;
    visibleLeaves.forEach((col) => {
      offsets.set(col.id, recalcOffset);
      recalcOffset += sizes.get(col.id) ?? 0;
    });

    const rightOffsets = new Map<string, number>();
    const rightPinnedLeaves = visibleLeaves.filter((col) => col.getIsPinned() === "right");
    let currentRightOffset = 0;
    for (let i = rightPinnedLeaves.length - 1; i >= 0; i--) {
      const col = rightPinnedLeaves[i];
      const sz = sizes.get(col.id) ?? col.getSize();
      rightOffsets.set(col.id, currentRightOffset);
      currentRightOffset += sz;
    }

    return {
      virtualSizes: sizes,
      virtualOffsets: offsets,
      virtualRightOffsets: rightOffsets,
      tableW: finalTableW,
    };
  }, [visibleLeaves, baseTableW, extraDiff, containerWidth]);

  const leftPinnedTotalWidth = useMemo(() => {
    const leftPinned = visibleLeaves.filter((col) => col.getIsPinned() === "left");
    const lastLeft = leftPinned[leftPinned.length - 1];
    if (!lastLeft) return 0;
    return (virtualOffsets.get(lastLeft.id) ?? 0) + (virtualSizes.get(lastLeft.id) ?? 0);
  }, [visibleLeaves, virtualOffsets, virtualSizes]);

  const rightPinnedTotalWidth = useMemo(() => {
    const rightPinned = visibleLeaves.filter((col) => col.getIsPinned() === "right");
    const firstRight = rightPinned[0];
    if (!firstRight) return 0;
    return (virtualRightOffsets.get(firstRight.id) ?? 0) + (virtualSizes.get(firstRight.id) ?? 0);
  }, [visibleLeaves, virtualRightOffsets, virtualSizes]);

  const updateScrollShadows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const left = el.scrollLeft > 0;
    const right = Math.ceil(el.scrollLeft + el.clientWidth) < el.scrollWidth;
    setIsScrolledLeft(left);
    setIsScrolledRight(right);
  }, [leftPinnedTotalWidth, rightPinnedTotalWidth]);

  const handleScroll = useCallback(() => {
    updateScrollShadows();

    if (!infiniteScroll) return;
    if (!infiniteScroll.hasMore) return;
    if (infiniteScroll.loadingMore) return;
    if (infiniteLoadingRef.current) return;

    const el = scrollRef.current;
    if (!el) return;

    const threshold = infiniteScroll.threshold ?? 150;
    const { scrollTop, scrollHeight, clientHeight } = el;

    if (scrollHeight - scrollTop - clientHeight <= threshold) {
      infiniteLoadingRef.current = true;
      const nextPage = infinitePageIndex + 1;
      setInfinitePageIndex(nextPage);
      const pageSize = infiniteScroll.pageSize ?? 50;
      infiniteScroll.onLoadMore({
        pageIndex: nextPage,
        pageSize,
        offset: dataSource.length,
      });
      requestAnimationFrame(() => {
        infiniteLoadingRef.current = false;
      });
    }
  }, [updateScrollShadows, infiniteScroll, infinitePageIndex, dataSource.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setContainerWidth(rect.width);
      updateScrollShadows();
    });

    observer.observe(el);

    updateScrollShadows();
    return () => observer.disconnect();
  }, [updateScrollShadows]);

  const headerGroups = table.getHeaderGroups();
  const headerH = useMemo(() => headerGroups.reduce((t, _, i) => t + (i === headerGroups.length - 1 ? 28 : 26), 0), [headerGroups]);

  const virtualizerCount = groupRow ? flatItems.length : rows.length;

  const getVirtualItemKey = useCallback(
    (i: number) => {
      if (groupRow) {
        const item = flatItems[i];
        if (!item) return `__undef__${i}`;
        return item.kind === "group" ? `__grp__${item.groupKey}` : String((item as any).tableRow.original[rowKey]);
      }
      return String(rows[i]?.original[rowKey] ?? i);
    },
    [groupRow, flatItems, rows, rowKey],
  );

  const rowVirtualizer = useVirtualizer({
    count: virtualizerCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
    getItemKey: getVirtualItemKey,
    scrollPaddingStart: headerH,
    // scrollPaddingEnd garantiza que el último item pueda desplazarse hasta quedar
    // completamente visible sin añadir espacio vacío al DOM.
    // Con summary no hace falta porque ese componente ya provee esa altura.
    scrollPaddingEnd: summary ? 0 : rowHeight,
  });

  const handleCtx = useCallback(
    (e: React.MouseEvent, rk: string | number, row: T) => {
      e.preventDefault();
      setCtx({ x: e.clientX, y: e.clientY, rowKey: rk, row });

      const isAlreadySelected = selectedSet.has(String(rk));
      if (!isAlreadySelected && rowSelection) {
        if (rowSelection.type === "single") {
          updateSelection([rk], [row]);
        } else if (rowSelection.type === "multiple") {
          updateSelection([rk], [row]);
        }
      }

      rowSelection?.onRowContextMenu?.(rk, row);
    },
    [selectedSet, rowSelection, updateSelection],
  );

  const getHeaderVirtualSize = useCallback(
    (header: Header<T, unknown>): number => {
      if (header.subHeaders.length === 0) return virtualSizes.get(header.column.id) ?? header.getSize();
      return header.subHeaders.reduce((sum, child) => sum + getHeaderVirtualSize(child), 0);
    },
    [virtualSizes],
  );

  const getHeaderVirtualOffsetL = useCallback(
    (h: any): number => {
      if (!h) return 0;
      if (h.subHeaders && h.subHeaders.length > 0) return getHeaderVirtualOffsetL(h.subHeaders[0]);
      if (h.column.getIsPinned() === "left") return virtualOffsets.get(h.column.id) ?? 0;
      return virtualOffsets.get(h.column.id) ?? 0;
    },
    [virtualOffsets],
  );

  // ─── Resolución de scroll Y ────────────────────────────────────────────────
  // Detecta si un valor de scroll.y es una expresión CSS (no una clase Tailwind)
  const isCssValue = (v: string) =>
    /^\d/.test(v.trim()) || /^(calc|min|max|clamp|var)\(/.test(v.trim()) || /(px|%|vh|vw|svh|dvh|dvw|rem|em|ex|ch|pt|cm|mm|vmin|vmax)$/.test(v.trim().toLowerCase());

  const scrollY = scroll?.y;
  // maxHeight numérico: sumamos headerH porque el div incluye header + body
  const scrollYMaxHeight: string | number | undefined =
    scrollY === undefined ? undefined : typeof scrollY === "number" ? scrollY + headerH : isCssValue(scrollY) ? scrollY : undefined;
  // Clase Tailwind: sólo cuando es string y NO es una expresión CSS
  const scrollYClass = typeof scrollY === "string" && !isCssValue(scrollY) ? scrollY : undefined;

  return (
    <div
      className={cn(
        "w-full flex flex-col overflow-hidden transition-opacity duration-300",
        showWrapperBorder && "border rounded-md",
        loading ? "opacity-50 pointer-events-none" : "",
        className,
      )}
    >
      <ProTableToolbar
        title={title}
        selectedSet={selectedSet}
        enableColumnVisibility={enableColumnVisibility}
        toolbarOptions={toolbarOptions}
        dataSource={dataSource}
        getRK={getRK}
        rowSelectionType={rowSelection?.type}
        table={table}
        setColumnOrder={setColumnOrder}
      />

      <div
        ref={scrollRef}
        className={scrollYClass}
        style={{
          overflow: "auto",
          flex: scrollYClass ? undefined : 1,
          maxHeight: scrollYMaxHeight,
          position: "relative",
        }}
        onScroll={handleScroll}
        onDragOver={(e) => {
          if (!draggable?.enable) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }}
        onDrop={() => {
          if (!draggable?.enable) return;
          setDraggedIndex(null);
          setHoveredIndex(null);
        }}
      >
        {/* Shadow overlays: posicionados sobre el scroll container para no repetirse por fila */}
        {/* {leftPinnedTotalWidth > 0 && (
          <div
            aria-hidden
            className={cn("pointer-events-none absolute top-0 bottom-0 transition-opacity duration-300", isScrolledLeft ? "opacity-100" : "opacity-0")}
            style={{
              left: leftPinnedTotalWidth,
              width: "12px",
              background: "linear-gradient(to right, rgba(0,0,0,0.12), transparent)",
              zIndex: 200,
            }}
          />
        )}
        {rightPinnedTotalWidth > 0 && (
          <div
            aria-hidden
            className={cn("pointer-events-none absolute top-0 bottom-0 transition-opacity duration-300", isScrolledRight ? "opacity-100" : "opacity-0")}
            style={{
              right: rightPinnedTotalWidth,
              width: "12px",
              background: "linear-gradient(to left, rgba(0,0,0,0.12), transparent)",
              zIndex: 200,
            }}
          />
        )} */}
        {/* Inner: fixed-width container */}
        <div style={{ width: tableW, position: "relative" }}>
          <ProTableStickyHeader
            headerGroups={headerGroups}
            tableW={tableW}
            headerH={headerH}
            getHeaderVirtualSize={getHeaderVirtualSize}
            getHeaderVirtualOffsetL={getHeaderVirtualOffsetL}
            virtualRightOffsets={virtualRightOffsets}
          />

          {/* ─── VIRTUAL BODY ──────────────────────────────────────── */}
          <div
            className='bg-card w-full'
            style={{
              position: "relative",
              zIndex: 0,
              height: rowVirtualizer.getTotalSize(),
            }}
          >
            {rows.length === 0 && <div style={{ textAlign: "center", padding: 24, color: "hsl(var(--muted-foreground))", fontSize: "0.75rem" }}>Sin datos</div>}

            {rowVirtualizer.getVirtualItems().map((vRow) => {
              // ── Modo agrupado ──────────────────────────────────────────────
              if (groupRow) {
                const item = flatItems[vRow.index];
                if (!item) return null;

                if (item.kind === "group") {
                  const isCollapsed = groupRow.defaultCollapsed ? !collapsedGroups.has(item.groupKey) : collapsedGroups.has(item.groupKey);
                  const prevItem = flatItems[vRow.index - 1];
                  const nextItem = flatItems[vRow.index + 1];
                  // Top border only when immediately preceded by a data row:
                  // - First group (no prev) → false ✓
                  // - Group after another group → false ✓ (prevents double border)
                  // - Group after data rows → true ✓
                  const showTopBorder = !!prevItem && prevItem.kind === "row";
                  // Bottom border when something follows (last group → false ✓).
                  // Adjacent groups: only previous group draws its bottom border;
                  // next group has showTopBorder=false → single line, no double border.
                  const showBottomBorder = !!nextItem;
                  return (
                    <ProTableGroupHeaderRow
                      key={`__grp__${item.groupKey}`}
                      groupValue={item.groupValue}
                      groupRows={item.groupRows}
                      collapsed={isCollapsed}
                      collapsible={groupRow.collapsible !== false}
                      onToggle={() => toggleGroup(item.groupKey)}
                      config={groupRow}
                      visibleLeaves={visibleLeaves}
                      virtualSizes={virtualSizes}
                      virtualOffsets={virtualOffsets}
                      virtualRightOffsets={virtualRightOffsets}
                      tableW={tableW}
                      rowHeight={rowHeight}
                      showVerticalRecordBorder={showVerticalRecordBorder}
                      vRow={vRow}
                      showTopBorder={showTopBorder}
                      showBottomBorder={showBottomBorder}
                    />
                  );
                }

                // Fila de datos dentro de un grupo
                const groupedRow = item.tableRow;
                const gRk = getRK(groupedRow.original);
                const gSel = selectedSet.has(String(gRk));
                const gCtx = ctx != null && String(ctx.rowKey) === String(gRk);
                // Determinar si la fila previa/siguiente visible está seleccionada (solo si son filas, no headers)
                const prevItem = flatItems[vRow.index - 1];
                const nextItem = flatItems[vRow.index + 1];
                const isPrevSelected = !!(prevItem && prevItem.kind === "row" && selectedSet.has(String(getRK(prevItem.tableRow.original))));
                const isNextSelected = !!(nextItem && nextItem.kind === "row" && selectedSet.has(String(getRK(nextItem.tableRow.original))));
                const prevIsGroup = prevItem && prevItem.kind === "group";
                return (
                  <ProTableRow
                    key={groupedRow.id}
                    row={groupedRow}
                    vRow={vRow}
                    rk={gRk}
                    hl={gSel || gCtx}
                    isExpanded={groupedRow.getIsExpanded()}
                    isPrevSelected={isPrevSelected}
                    isNextSelected={isNextSelected}
                    isDragHover={false}
                    dragDir={null}
                    isDragged={false}
                    showHorizontalRecordBorder={showHorizontalRecordBorder}
                    showVerticalRecordBorder={showVerticalRecordBorder}
                    tableW={tableW}
                    rowHeight={rowHeight}
                    striped={striped}
                    virtualSizes={virtualSizes}
                    virtualOffsets={virtualOffsets}
                    virtualRightOffsets={virtualRightOffsets}
                    rowSelection={rowSelection}
                    selectedSet={selectedSet}
                    updateSelection={updateSelection}
                    getRK={getRK}
                    draggable={undefined}
                    dragGripKey={null}
                    draggedIndex={null}
                    hoveredIndex={null}
                    setDraggedIndex={setDraggedIndex}
                    setHoveredIndex={setHoveredIndex}
                    dataSource={dataSource}
                    rows={rows}
                    scrollRef={scrollRef}
                    handleCtx={handleCtx}
                    expandable={expandable}
                    rowVirtualizer={rowVirtualizer}
                    containerWidth={containerWidth}
                    precededByGroup={prevIsGroup}
                  />
                );
              }

              // ── Modo normal ────────────────────────────────────────────────
              const row = rows[vRow.index];
              const rk = getRK(row.original);
              const sel = selectedSet.has(String(rk));
              const ctxOn = ctx != null && String(ctx.rowKey) === String(rk);
              const hl = sel || ctxOn;

              const prevRow = vRow.index > 0 ? rows[vRow.index - 1] : null;
              const prevFlat = flatItems[vRow.index - 1];
              const precededByGroup = !!(prevFlat && prevFlat.kind === "group");
              const nextRow = vRow.index < rows.length - 1 ? rows[vRow.index + 1] : null;
              const isPrevSelected = prevRow ? selectedSet.has(String(getRK(prevRow.original))) : false;
              const isNextSelected = nextRow ? selectedSet.has(String(getRK(nextRow.original))) : false;

              const isDragHover = hoveredIndex === vRow.index;
              const dragDir = draggedIndex !== null && hoveredIndex !== null ? (draggedIndex < hoveredIndex ? "down" : "up") : null;
              const isDragged = draggedIndex === vRow.index;

              return (
                <ProTableRow
                  key={row.id}
                  row={row}
                  vRow={vRow}
                  rk={rk}
                  hl={hl}
                  isExpanded={row.getIsExpanded()}
                  isPrevSelected={isPrevSelected}
                  isNextSelected={isNextSelected}
                  isDragHover={isDragHover}
                  dragDir={dragDir}
                  isDragged={isDragged}
                  showHorizontalRecordBorder={showHorizontalRecordBorder}
                  showVerticalRecordBorder={showVerticalRecordBorder}
                  tableW={tableW}
                  rowHeight={rowHeight}
                  striped={striped}
                  virtualSizes={virtualSizes}
                  virtualOffsets={virtualOffsets}
                  virtualRightOffsets={virtualRightOffsets}
                  rowSelection={rowSelection}
                  selectedSet={selectedSet}
                  updateSelection={updateSelection}
                  getRK={getRK}
                  draggable={draggable}
                  dragGripKey={dragGripKey}
                  draggedIndex={draggedIndex}
                  hoveredIndex={hoveredIndex}
                  setDraggedIndex={setDraggedIndex}
                  setHoveredIndex={setHoveredIndex}
                  dataSource={dataSource}
                  rows={rows}
                  scrollRef={scrollRef}
                  handleCtx={handleCtx}
                  expandable={expandable}
                  rowVirtualizer={rowVirtualizer}
                  containerWidth={containerWidth}
                  precededByGroup={precededByGroup}
                />
              );
            })}
          </div>

          {infiniteScroll?.loadingMore && (
            <div style={{ width: tableW }}>
              <div
                className='flex items-center justify-center gap-2 py-3 text-muted-foreground text-xs border-t border-border bg-card sticky left-0'
                style={{ width: containerWidth }}
              >
                <Loader2Icon className='w-3.5 h-3.5 animate-spin' />
                <span>Cargando más registros...</span>
              </div>
            </div>
          )}
          {summary && dataSource.length > 0 && (
            <ProTableSummaryRow
              dataSource={dataSource}
              visibleLeaves={visibleLeaves}
              virtualSizes={virtualSizes}
              virtualOffsets={virtualOffsets}
              virtualRightOffsets={virtualRightOffsets}
              tableW={tableW}
              rowHeight={rowHeight}
              showVerticalRecordBorder={showVerticalRecordBorder}
              summary={summary}
            />
          )}
        </div>
      </div>

      <ProTableFooter
        selectedSet={selectedSet}
        dataSource={dataSource}
        pagination={pagination}
        table={table}
        paginationConfig={paginationConfig}
        groupRowEnabled={!!groupRow}
      />

      <ProTableContextMenu
        ctx={ctx}
        menuRef={menuRef}
        toolbarOptions={toolbarOptions}
        selectedSet={selectedSet}
        dataSource={dataSource}
        getRK={getRK}
        rowSelectionType={rowSelection?.type}
        setCtx={setCtx}
      />
    </div>
  );
}

export const ProTable = memo(ProTableBase) as typeof ProTableBase;
