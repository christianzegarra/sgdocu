import React from "react";
import { type Column } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import type { ProTableSummary, ProTableSummaryReducer } from "./types";

const ACTION_COLS = new Set(["_selection_", "_drag_", "_expand_"]);

function computeAggregate<T>(rows: T[], reducer: ProTableSummaryReducer, accessorKey: string): number | null {
  const values: number[] = [];
  for (const r of rows) {
    const v = (r as any)[accessorKey];
    const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
    if (!Number.isNaN(n)) values.push(n);
  }
  if (values.length === 0) return null;
  switch (reducer) {
    case "sum":
      return values.reduce((a, b) => a + b, 0);
    case "avg":
      return values.reduce((a, b) => a + b, 0) / values.length;
    case "count":
      return values.length;
    case "min":
      return Math.min(...values);
    case "max":
      return Math.max(...values);
    default:
      return null;
  }
}

interface Props<T extends object> {
  dataSource: T[];
  visibleLeaves: Column<T, any>[];
  virtualSizes: Map<string, number>;
  virtualOffsets: Map<string, number>;
  virtualRightOffsets: Map<string, number>;
  tableW: number;
  rowHeight: number;
  showVerticalRecordBorder: boolean;
  summary: ProTableSummary<T> | ProTableSummary<T>[];
}

export function ProTableSummaryRow<T extends object>(props: Props<T>) {
  const { dataSource, visibleLeaves, virtualSizes, virtualOffsets, virtualRightOffsets, tableW, rowHeight, showVerticalRecordBorder, summary } = props;

  const summaries = Array.isArray(summary) ? summary : [summary];
  const totalSummaryH = summaries.length * rowHeight;

  return (
    <div className={cn("sticky bottom-0 z-10")} style={{ width: tableW, height: totalSummaryH, overflow: "clip" }}>
      {summaries.map((s, idx) => {
        const cells: React.ReactNode[] = [];
        let i = 0;

        while (i < visibleLeaves.length) {
          const col = visibleLeaves[i];
          const colId = col.id;
          const isAction = ACTION_COLS.has(colId);

          if (isAction) {
            // render each action column individually so each can have its own sticky offset
            const actionCol = visibleLeaves[i];
            const actionId = actionCol.id;
            const actionW = virtualSizes.get(actionId) ?? actionCol.getSize();
            const isPinnedLeft = actionCol.getIsPinned() === "left";
            const isPinnedRight = actionCol.getIsPinned() === "right";
            const actionStickyStyle: React.CSSProperties =
              isPinnedLeft
                ? {
                    position: "sticky",
                    left: virtualOffsets.get(actionId) ?? 0,
                    zIndex: 30,
                    backgroundColor: "var(--muted)",
                  }
                : isPinnedRight
                ? {
                    position: "sticky",
                    right: virtualRightOffsets.get(actionId) ?? 0,
                    zIndex: 30,
                    backgroundColor: "var(--muted)",
                  }
                : { backgroundColor: "var(--muted)" };

            cells.push(
              <div
                key={`__action_${actionId}_${idx}`}
                className='shrink-0 border-r border-border'
                style={{ width: actionW, minWidth: actionW, maxWidth: actionW, height: rowHeight, ...actionStickyStyle }}
              />,
            );
            i += 1;
            continue;
          }

          const cfg = s.columns[visibleLeaves[i].id];
          const span = cfg?.colSpan && cfg.colSpan > 1 ? Math.min(cfg.colSpan, visibleLeaves.length - i) : 1;

          let totalWidth = 0;
          for (let sidx = 0; sidx < span; sidx++) {
            const leafCol = visibleLeaves[i + sidx];
            totalWidth += virtualSizes.get(leafCol.id) ?? leafCol.getSize();
          }

          const isPinned = col.getIsPinned();
          const lastSpannedCol = visibleLeaves[i + span - 1];
          const lastPinned = lastSpannedCol.getIsPinned();

          let aggregatedValue: number | null = null;
          if (!isAction && cfg?.reducer) {
            const def = col.columnDef as any;
            const accessorKey: string = cfg.valueKey ? String(cfg.valueKey) : def.accessorKey ? String(def.accessorKey) : colId;
            aggregatedValue = computeAggregate(dataSource, cfg.reducer, accessorKey);
          }

          let content: React.ReactNode = null;
          if (!isAction && cfg) {
            if (cfg.render) content = cfg.render(dataSource, aggregatedValue);
            else if (aggregatedValue !== null) {
              content = (
                <span className='font-semibold tabular-nums'>
                  {aggregatedValue % 1 === 0 ? aggregatedValue.toLocaleString() : aggregatedValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              );
            }
          }

          const align = cfg?.align ?? (col.columnDef.meta?.align as "left" | "center" | "right" | undefined);
          const isLastCell = i + span - 1 === visibleLeaves.length - 1;

          let stickyStyle: React.CSSProperties = {};
          if (isPinned === "left") {
            stickyStyle = {
              position: "sticky",
              left: virtualOffsets.get(colId) ?? 0,
              zIndex: 20,
              backgroundColor: "var(--background)",
            };
          } else if (lastPinned === "right") {
            stickyStyle = {
              position: "sticky",
              right: virtualRightOffsets.get(lastSpannedCol.id) ?? 0,
              zIndex: 20,
              backgroundColor: "var(--background)",
            };
          }

          cells.push(
            <div
              key={`${colId}_${idx}`}
              className={cn(
                "flex items-center px-2 text-xs box-border shrink-0",
                !isLastCell && showVerticalRecordBorder && "border-r border-border",
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

        const borderClass = idx === 0 ? "border-t-2 border-border" : "border-t border-border";

        return (
          <div
            key={`__summary_row_${idx}`}
            className={cn("flex box-border bg-background shrink-0", borderClass, s.className)}
            style={{ width: tableW, height: rowHeight, zIndex: 10 + idx }}
          >
            {cells}
          </div>
        );
      })}
    </div>
  );
}
