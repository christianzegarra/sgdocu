import { type RefObject } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import type { CtxState, ProTableToolbarOptions, ProTableSelectionType } from "./types";

interface ProTableContextMenuProps<T extends object> {
  ctx: CtxState<T> | null;
  menuRef: RefObject<HTMLDivElement | null>;
  toolbarOptions?: ProTableToolbarOptions<T>;
  selectedSet: Set<string>;
  dataSource: T[];
  getRK: (r: T) => string | number;
  rowSelectionType?: "single" | "multiple";
  setCtx: (ctx: CtxState<T> | null) => void;
}

/**
 * Menú contextual que se muestra al hacer clic derecho sobre una fila.
 * Renderizado via portal sobre document.body para evitar problemas de z-index.
 */
export function ProTableContextMenu<T extends object>({ ctx, menuRef, toolbarOptions, selectedSet, dataSource, getRK, rowSelectionType, setCtx }: ProTableContextMenuProps<T>) {
  if (!ctx || !toolbarOptions?.rowActions?.items?.length) return null;

  return createPortal(
    <div
      ref={menuRef}
      className='fixed z-9999 min-w-40 rounded-lg bg-popover text-popover-foreground ring-1 ring-foreground/10 p-1 animate-in fade-in-0 zoom-in-95'
      style={{ top: ctx.y, left: ctx.x }}
    >
      {toolbarOptions.rowActions.items.map((item) => {
        if (selectedSet.size > 1 && !item.multiSelect) return null;

        return (
          <div key={item.key}>
            {item.separator && <div className='bg-border/50 -mx-1 my-1 h-px' />}
            <button
              disabled={item.disabled}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors select-none outline-none",
                item.disabled ? "pointer-events-none opacity-50" : "hover:bg-accent hover:text-accent-foreground",
                item.variant === "destructive" && "text-destructive hover:bg-destructive/10 hover:text-destructive",
              )}
              onClick={() => {
                const s = ctx;
                setCtx(null);
                const finalRows = dataSource.filter((r) => selectedSet.has(String(getRK(r))));
                toolbarOptions?.rowActions?.onEvent?.({
                  actionKey: item.key,
                  rowKey: s.rowKey,
                  row: s.row,
                  selectionType: (rowSelectionType as ProTableSelectionType) || "none",
                  selectedKeys: Array.from(selectedSet),
                  selectedRows: finalRows,
                });
              }}
            >
              {item.icon && <span className='size-3.5 [&>svg]:size-full'>{item.icon}</span>}
              {item.label}
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
