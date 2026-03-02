import { useState, type RefObject, memo, useRef, useEffect } from "react";
import type * as React from "react";
import { flexRender, type Row } from "@tanstack/react-table";
import { type VirtualItem, type Virtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";
import { CellTextEditor, CellSelectEditor } from "./cell-editors";
import type { ProTableDraggableProps, ProTableExpandable, ProTableRowSelection } from "./types";

export interface ProTableRowProps<T extends object> {
  row: Row<T>;
  vRow: VirtualItem;
  rk: string | number;
  hl: boolean;
  isPrevSelected: boolean;
  isNextSelected: boolean;
  isDragHover: boolean;
  dragDir: "up" | "down" | null;
  isDragged: boolean;
  showHorizontalRecordBorder: boolean;
  showVerticalRecordBorder: boolean;
  tableW: number;
  rowHeight: number;
  striped: boolean;
  virtualSizes: Map<string, number>;
  virtualOffsets: Map<string, number>;
  virtualRightOffsets: Map<string, number>;
  rowSelection?: ProTableRowSelection<T> & { type?: "single" | "multiple" };
  selectedSet: Set<string>;
  updateSelection: (keys: (string | number)[], selectedRows: T[]) => void;
  getRK: (r: T) => string | number;
  draggable?: ProTableDraggableProps<T>;
  dragGripKey: string | null;
  draggedIndex: number | null;
  hoveredIndex: number | null;
  setDraggedIndex: (i: number | null) => void;
  setHoveredIndex: (i: number | null) => void;
  dataSource: T[];
  rows: Row<T>[];
  scrollRef: RefObject<HTMLDivElement | null>;
  handleCtx: (e: React.MouseEvent, rk: string | number, row: T) => void;
  expandable?: ProTableExpandable<T>;
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
  containerWidth: number;
  isExpanded: boolean;
  precededByGroup?: boolean;
  mapVirtualIndexToOriginal?: (i: number) => T | undefined;
}

function ProTableRowInner<T extends object>({
  row,
  vRow,
  rk,
  hl,
  isPrevSelected,
  isNextSelected,
  isDragHover,
  dragDir,
  isDragged,
  showHorizontalRecordBorder,
  showVerticalRecordBorder,
  tableW,
  rowHeight,
  striped,
  virtualSizes,
  virtualOffsets,
  virtualRightOffsets,
  rowSelection,
  selectedSet,
  updateSelection,
  getRK,
  draggable,
  dragGripKey,
  draggedIndex,
  hoveredIndex,
  setDraggedIndex,
  setHoveredIndex,
  dataSource,
  rows,
  scrollRef,
  handleCtx,
  expandable,
  rowVirtualizer,
  isExpanded,
  precededByGroup = false,
  mapVirtualIndexToOriginal,
}: ProTableRowProps<T>) {
  const [isHovered, setIsHovered] = useState(false);
  void scrollRef;
  const selectedSetRef = useRef(selectedSet);

  useEffect(() => {
    selectedSetRef.current = selectedSet;
  }, [selectedSet]);

  return (
    <div
      key={row.id}
      data-index={vRow.index}
      ref={rowVirtualizer.measureElement}
      className='absolute top-0 left-0 box-border flex flex-col'
      style={{ width: tableW, transform: `translateY(${vRow.start}px)` }}
    >
      <div
        className={cn(
          "group flex box-border relative transition-colors",
          striped && !hl && !isDragged && vRow.index % 2 !== 0 ? "bg-muted" : "bg-card",
          rowSelection?.onRowClick || rowSelection ? "cursor-pointer" : "",
          isDragged && "bg-accent z-40 shadow-md",
          hl && "bg-accent",
        )}
        style={{ height: rowHeight, ...(hl ? { backgroundColor: "var(--table-selection-bg)" } : {}) }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          const isSelectionClick =
            rowSelection &&
            !(e.target as HTMLElement).closest("td[data-ignore-row-click]") &&
            !(e.target as HTMLElement).closest("div[data-ignore-row-click]") &&
            !(e.target as HTMLElement).closest("button") &&
            !(e.target as HTMLElement).closest("a") &&
            !(e.target as HTMLElement).closest("input");

          if (isSelectionClick) {
            const sRk = String(rk);
            if (rowSelection?.type === "single") {
              if (selectedSet.has(sRk)) updateSelection([], []);
              else updateSelection([rk], [row.original]);
            } else if (rowSelection?.type === "multiple") {
              const newKeys = new Set(selectedSetRef.current);
              if (newKeys.has(sRk)) newKeys.delete(sRk);
              else newKeys.add(sRk);
              const finalKeys = Array.from(newKeys);
              // Crear un Map para búsqueda eficiente de filas por key
              const rowMap = new Map(dataSource.map((r) => [String(getRK(r)), r]));
              const finalRows = finalKeys.map((k) => rowMap.get(String(k))).filter((r): r is T => r !== undefined);
              updateSelection(finalKeys, finalRows);
            }
          }
          rowSelection?.onRowClick?.(rk, row.original);
        }}
        onDoubleClick={(e: React.MouseEvent) => {
          try {
            e.stopPropagation();
            const sRk = String(rk);
            if (rowSelection?.type === "single") {
              if (!selectedSet.has(sRk)) updateSelection([rk], [row.original]);
            } else if (rowSelection?.type === "multiple") {
              const newKeys = new Set(selectedSetRef.current);
              newKeys.add(sRk);
              const finalKeys = Array.from(newKeys);
              // Crear un Map para búsqueda eficiente de filas por key
              const rowMap = new Map(dataSource.map((r) => [String(getRK(r)), r]));
              const finalRows = finalKeys.map((k) => rowMap.get(String(k))).filter((r): r is T => r !== undefined);
              updateSelection(finalKeys, finalRows);
            }
          } catch {
            // noop
          }
          rowSelection?.onRowDoubleClick?.(rk, row.original);
        }}
        onContextMenu={(e) => handleCtx(e, rk, row.original)}
        draggable={draggable?.enable && (dragGripKey === row.id || draggedIndex === vRow.index)}
        onDragStart={(e) => {
          if (!draggable?.enable) return;
          e.dataTransfer.effectAllowed = "move";
          setDraggedIndex(vRow.index);

          const target = e.currentTarget as HTMLElement;
          const rect = target.getBoundingClientRect();
          const clone = target.cloneNode(true) as HTMLElement;
          clone.style.width = `${tableW}px`;
          clone.style.height = `${rowHeight}px`;
          clone.style.position = "absolute";
          clone.style.top = "-9999px";
          clone.style.left = "-9999px";
          clone.style.zIndex = "99999";
          document.body.appendChild(clone);
          e.dataTransfer.setDragImage(clone, e.clientX - rect.left, e.clientY - rect.top);
          requestAnimationFrame(() => {
            if (clone.parentNode) clone.parentNode.removeChild(clone);
          });
        }}
        onDragOver={(e) => {
          if (!draggable?.enable) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          if (draggedIndex !== null && draggedIndex !== vRow.index) setHoveredIndex(vRow.index);
        }}
        onDragLeave={() => {
          if (!draggable?.enable) return;
          setHoveredIndex(null);
        }}
        onDrop={(e) => {
          if (!draggable?.enable) return;
          e.preventDefault();
          if (draggedIndex !== null && hoveredIndex !== null && draggedIndex !== hoveredIndex) {
            const newData = [...dataSource];
            const sourceOriginal = mapVirtualIndexToOriginal ? mapVirtualIndexToOriginal(draggedIndex) : rows[draggedIndex]?.original;
            const destOriginal = mapVirtualIndexToOriginal ? mapVirtualIndexToOriginal(hoveredIndex) : rows[hoveredIndex]?.original;
            const sourceRowKey = sourceOriginal ? getRK(sourceOriginal) : undefined;
            const destRowKey = destOriginal ? getRK(destOriginal) : undefined;
            const fromIdx = sourceRowKey !== undefined ? dataSource.findIndex((r) => String(getRK(r)) === String(sourceRowKey)) : -1;
            const toIdx = destRowKey !== undefined ? dataSource.findIndex((r) => String(getRK(r)) === String(destRowKey)) : -1;
            if (fromIdx !== -1 && toIdx !== -1) {
              const [moved] = newData.splice(fromIdx, 1);
              newData.splice(toIdx, 0, moved);
              draggable?.onDragChanged?.(fromIdx, toIdx, newData);
            }
          }
          setDraggedIndex(null);
          setHoveredIndex(null);
        }}
        onDragEnd={() => {
          setDraggedIndex(null);
          setHoveredIndex(null);
        }}
      >
        {hl && <div className='absolute left-0 top-0 bottom-0 w-0.5 bg-primary z-10' />}

        {showHorizontalRecordBorder && !(hl && isNextSelected) && !precededByGroup && (
          <div className='absolute bottom-0 left-0 pointer-events-none z-20 h-px bg-border' style={{ width: tableW }} />
        )}

        {!hl && (
          <div
            className='absolute left-0 top-0 pointer-events-none z-30 transition-colors'
            style={{ width: tableW, height: rowHeight, borderTop: "1px solid transparent", borderBottom: "1px solid transparent" }}
          />
        )}

        <div
          className='absolute left-0 top-0 pointer-events-none z-30 opacity-0 group-hover:opacity-100 transition-opacity'
          style={{ width: tableW, height: rowHeight, borderTop: "1px solid hsl(var(--border))", borderBottom: "1px solid hsl(var(--border))" }}
        />

        {hl && (
          <div
            className='absolute left-0 top-0 pointer-events-none z-30'
            style={{
              width: tableW,
              height: rowHeight,
              borderTop: isPrevSelected ? "1px solid transparent" : "1px solid color-mix(in oklch, var(--primary) 50%, transparent)",
              borderBottom: isNextSelected ? "1px solid transparent" : "1px solid color-mix(in oklch, var(--primary) 50%, transparent)",
              borderLeft: "1px solid color-mix(in oklch, var(--primary) 50%, transparent)",
              borderRight: "1px solid color-mix(in oklch, var(--primary) 50%, transparent)",
            }}
          />
        )}

        {isDragHover && dragDir === "down" && <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-primary z-50 pointer-events-none' style={{ width: tableW }} />}
        {isDragHover && dragDir === "up" && <div className='absolute top-0 left-0 right-0 h-0.5 bg-primary z-50 pointer-events-none' style={{ width: tableW }} />}

        {row.getVisibleCells().map((cell, cellIndex, allCells) => {
          const isSelection = cell.column.id === "_selection_";
          const isPinned = cell.column.getIsPinned();
          const isInput = Boolean(cell.column.columnDef.meta?.input);

          return (
            <div
              key={cell.id}
              className={cn(
                "transition-colors box-border flex items-center text-xs relative",
                !isInput && !isSelection && "px-2",
                hl ? "bg-card" : striped && vRow.index % 2 !== 0 ? "bg-muted group-hover:bg-accent" : "bg-card group-hover:bg-accent",
                cellIndex !== allCells.length - 1 && showVerticalRecordBorder && "border-r border-border",
                isSelection && "justify-center px-0 overflow-visible",
              )}
              style={{
                width: virtualSizes.get(cell.column.id) ?? cell.column.getSize(),
                minWidth: virtualSizes.get(cell.column.id) ?? cell.column.getSize(),
                maxWidth: virtualSizes.get(cell.column.id) ?? cell.column.getSize(),
                flexShrink: 0,
                flexGrow: 0,
                height: rowHeight,
                ...(hl ? { backgroundColor: "var(--table-selection-bg)" } : {}),
                ...(isPinned
                  ? {
                      position: "sticky",
                      left: isPinned === "left" ? (virtualOffsets.get(cell.column.id) ?? 0) : undefined,
                      right: isPinned === "right" ? (virtualRightOffsets.get(cell.column.id) ?? 0) : undefined,
                      zIndex: 20,
                      backgroundColor: hl ? "var(--table-selection-bg)" : isHovered ? "var(--accent)" : striped && vRow.index % 2 !== 0 ? "var(--muted)" : "var(--card)",
                    }
                  : {}),
              }}
            >
              {showHorizontalRecordBorder && isPinned && !(hl && isNextSelected) && <div className='absolute bottom-0 left-0 right-0 pointer-events-none z-20 h-px bg-border' />}
              {(() => {
                const colMeta = cell.column.columnDef.meta as any;
                const editor = colMeta?.input;
                const value = cell.getValue();

                const baseSpanClass = cn(
                  "relative z-10",
                  isSelection || cell.column.id === "_drag_" ? "flex justify-center w-full" : "overflow-hidden text-ellipsis whitespace-nowrap w-full",
                  cell.column.columnDef.meta?.align === "center" && "text-center",
                  cell.column.columnDef.meta?.align === "right" && "text-right",
                );

                if (editor && !isSelection && cell.column.id !== "_drag_") {
                  const opts = editor.options || [];
                  const optionsArray: { value: string; label: string }[] = Array.isArray(opts)
                    ? (opts as any[]).map((o) => {
                        if (o == null) return { value: "", label: "" };
                        if (typeof o === "string" || typeof o === "number") return { value: String(o), label: String(o) };
                        return {
                          value: String((o as any).value ?? (o as any).id ?? (o as any).key ?? ""),
                          label: String((o as any).label ?? (o as any).title ?? (o as any).name ?? String(o)),
                        };
                      })
                    : Object.keys(opts || {}).map((k) => ({ value: k, label: String((opts as any)[k]) }));

                  const handleEditorFocus = () => {
                    try {
                      updateSelection([rk], [row.original]);
                    } catch {
                      // noop
                    }
                  };

                  return (
                    <div className={cn(baseSpanClass, "h-full w-full p-1")} data-ignore-row-click>
                      {editor.type === "select" ? (
                        <CellSelectEditor
                          value={String(value ?? "")}
                          options={optionsArray}
                          onChange={(v) => {
                            const updated = { ...row.original, [cell.column.id]: v };
                            editor.onChange?.(v, row.original, updated as T, cell.column.id);
                          }}
                          onFocus={handleEditorFocus}
                          className='w-full h-full box-border bg-muted/40 rounded-xs outline-none border-none ring-1 ring-gray-200 text-xs'
                        />
                      ) : (
                        <CellTextEditor
                          value={value as any}
                          editorType={editor.type}
                          onChange={(v) => {
                            const updated = { ...row.original, [cell.column.id]: v };
                            editor.onChange?.(v, row.original, updated as T, cell.column.id);
                          }}
                          onFocus={handleEditorFocus}
                          className={cn(
                            "w-full h-full bg-muted/40 outline-none border-none ring-1 ring-gray-200 focus-visible:ring-2 focus-visible:ring-gray-300 text-xs rounded-xs",
                            editor.type === "number" || editor.type === "currency" ? "text-right" : "",
                          )}
                          style={editor.type === "number" || editor.type === "currency" ? { textAlign: "right" as const } : undefined}
                        />
                      )}
                    </div>
                  );
                }

                return <span className={baseSpanClass}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</span>;
              })()}
            </div>
          );
        })}
      </div>

      {isExpanded && expandable && (
        <div className='flex border-b box-border border-t text-xs' style={{ width: tableW }}>
          <div className='box-border py-2 px-3' style={{ width: "100%" }}>
            {expandable.expandedRowRender(row.original)}
          </div>
        </div>
      )}
    </div>
  );
}

export const ProTableRow = memo(ProTableRowInner, (prev: any, next: any) => {
  // quick checks for props that should trigger a re-render
  if (String(prev.rk) !== String(next.rk)) return false;
  if (prev.hl !== next.hl) return false;
  if (prev.selectedSet !== next.selectedSet) return false;
  if (prev.isNextSelected !== next.isNextSelected) return false;
  if (prev.isDragHover !== next.isDragHover) return false;
  if (prev.dragDir !== next.dragDir) return false;
  if (prev.isDragged !== next.isDragged) return false;
  if (prev.tableW !== next.tableW) return false;
  if (prev.rowHeight !== next.rowHeight) return false;
  if (prev.striped !== next.striped) return false;
  if (prev.containerWidth !== next.containerWidth) return false;
  if (prev.precededByGroup !== next.precededByGroup) return false;
  // if the underlying data object changed, re-render
  if (prev.row.original !== next.row.original) return false;
  // expanded state: comparar como primitivo booleano.
  // NOTA: No usar row.getIsExpanded() aquí porque lee estado vivo de la tabla,
  // devolviendo el mismo valor en prev y next → el memo nunca detecta el cambio.
  if (prev.isExpanded !== next.isExpanded) return false;

  // selection presence for this row
  const prevSel = prev.selectedSet.has(String(prev.rk));
  const nextSel = next.selectedSet.has(String(next.rk));
  if (prevSel !== nextSel) return false;

  // virtualSizes/virtualOffsets afectan el layout de las celdas
  if (prev.virtualSizes !== next.virtualSizes) return false;
  if (prev.virtualOffsets !== next.virtualOffsets) return false;
  if (prev.virtualRightOffsets !== next.virtualRightOffsets) return false;

  return true;
}) as typeof ProTableRowInner;
