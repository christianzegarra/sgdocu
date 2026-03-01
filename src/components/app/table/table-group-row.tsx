import { type Column } from "@tanstack/react-table";
import { type VirtualItem } from "@tanstack/react-virtual";
import { ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProTableGroupRowConfig, ProTableSummaryReducer } from "./types";

const ACTION_COLS = new Set(["_selection_", "_drag_", "_expand_"]);

function computeGroupAggregate<T>(rows: T[], reducer: ProTableSummaryReducer, valueKey: string): number | null {
  const nums = rows
    .map((r) => {
      const v = (r as any)[valueKey];
      return typeof v === "number" ? v : parseFloat(String(v));
    })
    .filter((n) => !isNaN(n));

  if (nums.length === 0) return null;

  switch (reducer) {
    case "sum":
      return nums.reduce((a, b) => a + b, 0);
    case "avg":
      return nums.reduce((a, b) => a + b, 0) / nums.length;
    case "count":
      return rows.length;
    case "min":
      return Math.min(...nums);
    case "max":
      return Math.max(...nums);
  }
}

interface ProTableGroupHeaderRowProps<T extends object> {
  groupValue: unknown;
  groupRows: T[];
  collapsed: boolean;
  collapsible: boolean;
  onToggle: () => void;
  config: ProTableGroupRowConfig<T>;
  visibleLeaves: Column<T, unknown>[];
  virtualSizes: Map<string, number>;
  virtualOffsets: Map<string, number>;
  virtualRightOffsets: Map<string, number>;
  tableW: number;
  rowHeight: number;
  showVerticalRecordBorder: boolean;
  vRow: VirtualItem;
  showTopBorder?: boolean;
  showBottomBorder?: boolean;
}

/**
 * Fila cabecera de grupo: se muestra antes de los registros de cada grupo.
 * Soporta  collapse/expand, colSpan, agregados y columnas fijas (sticky).
 */
export function ProTableGroupHeaderRow<T extends object>({
  groupValue,
  groupRows,
  collapsed,
  collapsible,
  onToggle,
  config,
  visibleLeaves,
  virtualSizes,
  virtualOffsets,
  virtualRightOffsets,
  tableW,
  rowHeight,
  showVerticalRecordBorder,
  vRow,
  showTopBorder = false,
  showBottomBorder = true,
}: ProTableGroupHeaderRowProps<T>) {
  const cells: React.ReactNode[] = [];
  let i = 0;

  while (i < visibleLeaves.length) {
    const col = visibleLeaves[i];
    const colId = col.id;
    const isAction = ACTION_COLS.has(colId);

    // ── Columnas de acción: una sola celda muted con botón toggle ──────────
    if (isAction) {
      let actionWidth = 0;
      let actionCount = 0;
      let j = i;
      while (j < visibleLeaves.length && ACTION_COLS.has(visibleLeaves[j].id)) {
        actionWidth += virtualSizes.get(visibleLeaves[j].id) ?? visibleLeaves[j].getSize();
        actionCount++;
        j++;
      }
      const isPinnedLeft = col.getIsPinned() === "left";
      const stickyStyle: React.CSSProperties = isPinnedLeft
        ? {
            position: "sticky",
            left: virtualOffsets.get(colId) ?? 0,
            zIndex: 120,
            backgroundColor: "var(--muted)",
          }
        : {};

      cells.push(
        <div
          key={`__action_group_${i}`}
          className='shrink-0 bg-muted border-r border-border/60 flex items-center justify-center'
          style={{ width: actionWidth, minWidth: actionWidth, maxWidth: actionWidth, height: rowHeight, ...stickyStyle }}
        >
          {collapsible && (
            <button
              className='flex items-center justify-center w-5 h-5 rounded hover:bg-muted-foreground/20 transition-colors'
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              title={collapsed ? "Expandir grupo" : "Colapsar grupo"}
            >
              <ChevronRightIcon className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform duration-200", !collapsed && "rotate-90")} />
            </button>
          )}
        </div>,
      );
      i += actionCount;
      continue;
    }

    const columnConfig = config.columns?.[colId];

    // ── colSpan ─────────────────────────────────────────────────────────────
    const span = columnConfig?.colSpan && columnConfig.colSpan > 1 ? Math.min(columnConfig.colSpan, visibleLeaves.length - i) : 1;

    // ── Ancho total del span ─────────────────────────────────────────────────
    let totalWidth = 0;
    for (let s = 0; s < span; s++) {
      const leafCol = visibleLeaves[i + s];
      totalWidth += virtualSizes.get(leafCol.id) ?? leafCol.getSize();
    }

    // ── Pinned ───────────────────────────────────────────────────────────────
    const isPinned = col.getIsPinned();
    const lastSpannedCol = visibleLeaves[i + span - 1];
    const lastPinned = lastSpannedCol.getIsPinned();

    // ── Agregado ─────────────────────────────────────────────────────────────
    let aggregatedValue: number | null = null;
    if (columnConfig?.reducer) {
      const def = col.columnDef as any;
      const accessorKey: string = columnConfig.valueKey ? String(columnConfig.valueKey) : def.accessorKey ? String(def.accessorKey) : colId;
      aggregatedValue = computeGroupAggregate(groupRows, columnConfig.reducer, accessorKey);
    }

    // ── Contenido ────────────────────────────────────────────────────────────
    let content: React.ReactNode = null;
    if (columnConfig) {
      if (columnConfig.render) {
        content = columnConfig.render(groupValue, groupRows, aggregatedValue);
      } else if (aggregatedValue !== null) {
        content = (
          <span className='font-semibold tabular-nums'>
            {aggregatedValue % 1 === 0 ? aggregatedValue.toLocaleString() : aggregatedValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        );
      }
    }

    const align = columnConfig?.align ?? (col.columnDef.meta?.align as "left" | "center" | "right" | undefined);

    const isLastCell = i + span - 1 === visibleLeaves.length - 1;

    // ── Sticky ───────────────────────────────────────────────────────────────
    let stickyStyle: React.CSSProperties = {};
    if (isPinned === "left") {
      stickyStyle = {
        position: "sticky",
        left: virtualOffsets.get(colId) ?? 0,
        zIndex: 10,
        backgroundColor: "var(--muted)",
      };
    } else if (lastPinned === "right") {
      stickyStyle = {
        position: "sticky",
        right: virtualRightOffsets.get(lastSpannedCol.id) ?? 0,
        zIndex: 10,
        backgroundColor: "var(--muted)",
      };
    }

    cells.push(
      <div
        key={colId}
        className={cn(
          "flex items-center px-2 text-xs box-border shrink-0",
          !isLastCell && showVerticalRecordBorder && "border-r border-border/60",
          align === "center" && "justify-center",
          align === "right" && "justify-end",
        )}
        style={{
          width: totalWidth,
          minWidth: totalWidth,
          maxWidth: totalWidth,
          height: rowHeight,
          ...stickyStyle,
        }}
      >
        {content}
      </div>,
    );

    i += span;
  }

  return (
    <div
      className={cn(
        "absolute left-0 flex box-border bg-muted",
        collapsible && "cursor-pointer",
        config.className,
      )}
      style={{
        top: 0,
        transform: `translateY(${vRow.start}px)`,
        width: tableW,
        height: rowHeight,
        zIndex: 5,
      }}
      onClick={collapsible ? onToggle : undefined}
    >
      {/* Full-width absolute bars at very high z-index so they paint over sticky/fixed columns */}
      {showTopBorder && (
        <div className='absolute inset-x-0 top-0 h-px bg-border pointer-events-none' style={{ zIndex: 500 }} />
      )}
      {showBottomBorder && (
        <div className='absolute inset-x-0 bottom-0 h-px bg-border pointer-events-none' style={{ zIndex: 500 }} />
      )}
      {cells}
    </div>
  );
}
