import { useState } from "react";
import { type Table } from "@tanstack/react-table";
import { GripVerticalIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface ColumnVisibilityPanelProps<T extends object> {
  table: Table<T>;
  setColumnOrder: (order: string[]) => void;
}

/**
 * Panel interior del popover "Mostrar Columnas".
 * Permite mostrar/ocultar columnas y reordenarlas mediante drag & drop.
 */
export function ColumnVisibilityPanel<T extends object>({ table, setColumnOrder }: ColumnVisibilityPanelProps<T>) {
  const [draggedColId, setDraggedColId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<"top" | "bottom" | null>(null);

  /** Crea una imagen de arrastre limpia con borde primary en lugar del ghost semitransparente del navegador */
  const createDragGhost = (e: React.DragEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const clone = el.cloneNode(true) as HTMLElement;
    clone.style.width = `${rect.width}px`;
    clone.style.backgroundColor = "var(--card)";
    clone.style.border = "1px solid hsl(var(--primary))";
    clone.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.4)";
    clone.style.borderRadius = "6px";
    clone.style.position = "fixed";
    clone.style.top = "-9999px";
    clone.style.left = "-9999px";
    clone.style.zIndex = "99999";
    clone.style.pointerEvents = "none";
    document.body.appendChild(clone);
    e.dataTransfer.setDragImage(clone, e.clientX - rect.left, e.clientY - rect.top);
    setTimeout(() => {
      if (clone.parentNode) clone.parentNode.removeChild(clone);
    }, 0);
  };

  const isColumnDraggable = (colId: string) => {
    const col = table.getColumn(colId);
    if (!col) return true;
    const isFixed = !!col.columnDef.meta?.fixed || !!col.parent?.columnDef.meta?.fixed;
    const explicitlyDisabled = col.columnDef.meta?.enableReordering === false;
    return !isFixed && !explicitlyDisabled;
  };

  const moveArrayElements = (arr: string[], sourceIds: string[], targetId: string, position: "top" | "bottom") => {
    const newArr = arr.filter((id) => !sourceIds.includes(id));
    let targetIdx = newArr.indexOf(targetId);
    if (position === "bottom") targetIdx++;
    newArr.splice(targetIdx, 0, ...sourceIds);
    return newArr;
  };

  const leafCols = table.getAllLeafColumns().filter((c) => c.id !== "_selection_" && c.id !== "_drag_" && c.id !== "_expand_" && c.getCanHide());

  const groups = new Map<string, typeof leafCols>();
  const orphans: typeof leafCols = [];

  leafCols.forEach((col) => {
    if (col.parent) {
      const pId = col.parent.id;
      if (!groups.has(pId)) groups.set(pId, []);
      groups.get(pId)!.push(col);
    } else {
      orphans.push(col);
    }
  });

  const renderedItems: React.ReactNode[] = [];
  const renderedGroupIds = new Set<string>();

  leafCols.forEach((col) => {
    if (col.parent) {
      // ── Columna dentro de un grupo ──────────────────────────────────────────
      const pId = col.parent.id;
      if (renderedGroupIds.has(pId)) return;
      renderedGroupIds.add(pId);

      const children = groups.get(pId)!;
      const parentCol = children[0].parent!;
      const parentHeader = typeof parentCol.columnDef.header === "string" ? parentCol.columnDef.header : parentCol.id;

      const isDraggable = isColumnDraggable(children[0].id);
      const isFixed = children[0].columnDef.meta?.fixed || children[0].parent?.columnDef.meta?.fixed;

      const isGroupDragged = draggedColId === pId;
      const isSomeChildDragged = draggedColId !== null && children.some((c) => c.id === draggedColId);
      const isThisGroupValidDropTarget = draggedColId !== null && isDraggable && !isSomeChildDragged;

      renderedItems.push(
        <div key={pId} className='flex flex-col mb-1 relative pointer-events-auto'>
          {/* ── Cabecera del grupo ── */}
          <div
            className={cn(
              "flex justify-between items-center text-xs font-semibold px-2 py-1 text-foreground/80 bg-muted/30 rounded-t border-b border-border/50 relative",
              !isDraggable ? "opacity-70" : "cursor-grab active:cursor-grabbing hover:bg-muted/50 transition-colors",
              isGroupDragged && "",
            )}
            draggable={isDraggable}
            onDragStart={(e) => {
              if (!isDraggable) return e.preventDefault();
              e.dataTransfer.effectAllowed = "move";
              createDragGhost(e);
              setDraggedColId(pId);
            }}
            onDragOver={(e) => {
              if (!isDraggable || isSomeChildDragged) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (pId !== draggedColId) {
                setDragOverColId(pId);
                const rect = e.currentTarget.getBoundingClientRect();
                setDragOverPosition(e.clientY - rect.top > rect.height / 2 ? "bottom" : "top");
              }
            }}
            onDragLeave={() => {
              if (dragOverColId === pId) {
                setDragOverColId(null);
                setDragOverPosition(null);
              }
            }}
            onDrop={(e) => {
              if (!isDraggable || isSomeChildDragged) return;
              e.preventDefault();
              const dropPos = dragOverPosition;
              setDragOverColId(null);
              setDragOverPosition(null);
              if (draggedColId && draggedColId !== pId) {
                const currentOrder = table.getAllLeafColumns().map((c) => c.id);
                const draggedIds = groups.has(draggedColId) ? groups.get(draggedColId)!.map((c) => c.id) : [draggedColId];
                const targetLeafId = dropPos === "top" ? children[0].id : children[children.length - 1].id;
                setColumnOrder(moveArrayElements(currentOrder, draggedIds, targetLeafId, dropPos || "top"));
              }
              setDraggedColId(null);
            }}
            onDragEnd={() => {
              setDraggedColId(null);
              setDragOverColId(null);
              setDragOverPosition(null);
            }}
          >
            {dragOverColId === pId && isThisGroupValidDropTarget && dragOverPosition === "top" && (
              <div className='absolute top-0 left-0 right-0 h-1 bg-primary rounded-full z-20 pointer-events-none' />
            )}
            <div className='flex items-center gap-1.5 pointer-events-none'>
              {isDraggable && <GripVerticalIcon className='w-3.5 h-3.5 text-muted-foreground/50' />}
              <span>{parentHeader}</span>
            </div>
            {(isFixed || !isDraggable) && (
              <span className='text-[0.60rem] tracking-tight font-medium text-muted-foreground/80 bg-background border border-border/50 px-1 py-px rounded truncate shrink-0 leading-none mr-2'>
                Fija
              </span>
            )}
          </div>

          {/* ── Hijos del grupo ── */}
          <div className={cn("flex flex-col pt-1 bg-muted/10 rounded-b border border-t-0 border-border/30 relative", isGroupDragged && "")}>
            {children.map((column, idx) => {
              const headerContent = typeof column.columnDef.header === "string" ? column.columnDef.header : column.id;
              const draggedCol = draggedColId ? table.getColumn(draggedColId) : null;
              const isSameGroup = draggedCol ? column.parent?.id === draggedCol.parent?.id : true;
              const isChildDragging = draggedColId === column.id;
              const isChildDraggable = isColumnDraggable(column.id);
              const canDragChild = isChildDraggable && !isGroupDragged && (!draggedColId || isSameGroup);

              return (
                <div key={column.id} className='relative'>
                  <div
                    draggable={isChildDraggable && !isGroupDragged}
                    onDragStart={(e) => {
                      if (!isChildDraggable || isGroupDragged) return e.preventDefault();
                      e.dataTransfer.effectAllowed = "move";
                      createDragGhost(e);
                      setDraggedColId(column.id);
                    }}
                    onDragOver={(e) => {
                      if (!canDragChild || isChildDragging) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setDragOverColId(column.id);
                      const rect = e.currentTarget.getBoundingClientRect();
                      setDragOverPosition(e.clientY - rect.top > rect.height / 2 ? "bottom" : "top");
                    }}
                    onDragLeave={() => {
                      if (dragOverColId === column.id) {
                        setDragOverColId(null);
                        setDragOverPosition(null);
                      }
                    }}
                    onDrop={(e) => {
                      if (!canDragChild || isChildDragging) return;
                      e.preventDefault();
                      const dropPos = dragOverPosition || "top";
                      setDragOverColId(null);
                      setDragOverPosition(null);
                      if (draggedColId && draggedColId !== column.id) {
                        const currentOrder = table.getAllLeafColumns().map((c) => c.id);
                        const draggedIds = groups.has(draggedColId) ? groups.get(draggedColId)!.map((c) => c.id) : [draggedColId];
                        setColumnOrder(moveArrayElements(currentOrder, draggedIds, column.id, dropPos));
                      }
                      setDraggedColId(null);
                    }}
                    onDragEnd={() => {
                      setDraggedColId(null);
                      setDragOverColId(null);
                      setDragOverPosition(null);
                    }}
                    className={cn(
                      "flex items-center gap-2 pl-4 pr-1 py-1 hover:bg-muted/50 transition-colors relative",
                      isChildDragging && "",
                      !canDragChild && draggedColId && !isGroupDragged && "opacity-50 cursor-not-allowed",
                      idx === children.length - 1 ? "rounded-b" : "",
                    )}
                  >
                    {dragOverColId === column.id && canDragChild && dragOverPosition === "top" && (
                      <div className='absolute top-0 left-0 right-0 h-0.5 bg-primary rounded-full z-20 pointer-events-none' />
                    )}
                    {dragOverColId === column.id && canDragChild && dragOverPosition === "bottom" && (
                      <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full z-20 pointer-events-none' />
                    )}

                    <div className='absolute left-1.5 top-0 bottom-0 w-px bg-border/50 pointer-events-none' />
                    <div className='absolute left-1.5 top-1/2 w-2 h-px bg-border/50 pointer-events-none' />

                    <div className={cn("shrink-0 relative z-10 pointer-events-none", canDragChild ? "text-muted-foreground/50" : "text-muted-foreground/30")}>
                      {isChildDraggable && <GripVerticalIcon className='w-3.5 h-3.5' />}
                    </div>

                    <label className='flex items-center gap-2 flex-1 min-w-0 pointer-events-none'>
                      <Checkbox
                        className='w-3 h-3 rounded-[2px] shrink-0 pointer-events-auto'
                        checked={column.getIsVisible()}
                        onCheckedChange={(val) => column.toggleVisibility(!!val)}
                        disabled={!!draggedColId && !isSameGroup && !isGroupDragged}
                      />
                      <span className={cn("text-xs flex-1 truncate select-none", (!isSameGroup || !isChildDraggable) && draggedColId && "text-muted-foreground")}>
                        {headerContent}
                      </span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          {dragOverColId === pId && dragOverPosition === "bottom" && isThisGroupValidDropTarget && (
            <div className='absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full z-20 pointer-events-none' />
          )}
        </div>,
      );
    } else {
      // ── Columna sin grupo (huérfana) ────────────────────────────────────────
      const column = col;
      const headerContent = typeof column.columnDef.header === "string" ? column.columnDef.header : column.id;
      const isDraggable = isColumnDraggable(column.id);
      const isFixed = column.columnDef.meta?.fixed;
      const isDragValid = isDraggable && (!draggedColId || draggedColId !== column.id);

      renderedItems.push(
        <div key={column.id} className='relative pointer-events-none mb-1'>
          <div
            draggable={isDraggable}
            onDragStart={(e) => {
              if (!isDraggable) return e.preventDefault();
              e.dataTransfer.effectAllowed = "move";
              createDragGhost(e);
              setDraggedColId(column.id);
            }}
            onDragOver={(e) => {
              if (!isDragValid) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setDragOverColId(column.id);
              const rect = e.currentTarget.getBoundingClientRect();
              setDragOverPosition(e.clientY - rect.top > rect.height / 2 ? "bottom" : "top");
            }}
            onDragLeave={() => {
              if (dragOverColId === column.id) {
                setDragOverColId(null);
                setDragOverPosition(null);
              }
            }}
            onDrop={(e) => {
              if (!isDragValid) return;
              e.preventDefault();
              const dropPos = dragOverPosition || "top";
              setDragOverColId(null);
              setDragOverPosition(null);
              if (draggedColId && draggedColId !== column.id) {
                const currentOrder = table.getAllLeafColumns().map((c) => c.id);
                const draggedIds = groups.has(draggedColId) ? groups.get(draggedColId)!.map((c) => c.id) : [draggedColId];
                setColumnOrder(moveArrayElements(currentOrder, draggedIds, column.id, dropPos));
              }
              setDraggedColId(null);
            }}
            onDragEnd={() => {
              setDraggedColId(null);
              setDragOverColId(null);
              setDragOverPosition(null);
            }}
            className={cn(
              "flex items-center gap-2 px-1 py-1.5 hover:bg-muted/50 rounded transition-colors relative pointer-events-auto",
              isDraggable && "cursor-grab active:cursor-grabbing",
              draggedColId === column.id && "",
              !isDraggable && "opacity-70",
              !isDragValid && draggedColId && "opacity-50 cursor-not-allowed",
            )}
          >
            {dragOverColId === column.id && isDragValid && dragOverPosition === "top" && (
              <div className='absolute top-0 left-0 right-0 h-1 bg-primary rounded-full z-20 pointer-events-none' />
            )}
            {dragOverColId === column.id && isDragValid && dragOverPosition === "bottom" && (
              <div className='absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full z-20 pointer-events-none' />
            )}

            <div className='flex justify-between items-center flex-1 min-w-0 pr-1 pointer-events-none'>
              <div className='flex items-center gap-2 flex-1 min-w-0 pr-1'>
                <div className={cn("shrink-0", isDragValid || (!draggedColId && isDraggable) ? "text-muted-foreground/50 hover:text-foreground" : "text-muted-foreground/30")}>
                  {isDraggable && <GripVerticalIcon className='w-3.5 h-3.5 pointer-events-none' />}
                </div>
                <label className='flex items-center gap-2 flex-1 min-w-0 pointer-events-auto'>
                  <Checkbox
                    className='w-3 h-3 rounded-[2px] shrink-0'
                    checked={column.getIsVisible()}
                    onCheckedChange={(val) => column.toggleVisibility(!!val)}
                    disabled={!!draggedColId && !isDragValid}
                  />
                  <span className={cn("text-xs flex-1 truncate select-none", (!isDragValid || !isDraggable) && draggedColId && "text-muted-foreground")}>{headerContent}</span>
                </label>
              </div>
              {(isFixed || !isDraggable) && (
                <span className='text-[0.60rem] tracking-tight font-medium text-muted-foreground/80 bg-background border border-border/50 px-1 py-px rounded truncate shrink-0 leading-none'>
                  Fija
                </span>
              )}
            </div>
          </div>
        </div>,
      );
    }
  });

  return <>{renderedItems}</>;
}
