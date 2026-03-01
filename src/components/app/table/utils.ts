import type { Header } from "@tanstack/react-table";

/** Retorna la hoja más a la derecha de un árbol de subHeaders. */
export function lastLeaf<T extends object>(h: Header<T, unknown>): Header<T, unknown> {
  if (!h.subHeaders.length) return h;
  return lastLeaf(h.subHeaders[h.subHeaders.length - 1]);
}

/** Aplica tamaños mínimos y un filterFn por defecto a cada columna hoja. */
export function enforceMinSize(cols: any[]): any[] {
  return cols.map((col) => {
    if (col.columns && Array.isArray(col.columns)) {
      return { ...col, columns: enforceMinSize(col.columns) };
    }
    return {
      ...col,
      minSize: col.minSize ?? col.size ?? 150,
      filterFn:
        col.filterFn ??
        ((row: any, columnId: string, filterValue: any) => {
          const cellVal = String(row.getValue(columnId));
          if (Array.isArray(filterValue)) return filterValue.includes(cellVal);
          if (typeof filterValue === "string") return cellVal.toLowerCase().includes(filterValue.toLowerCase());
          return true;
        }),
    };
  });
}
