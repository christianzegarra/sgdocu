import type { ReactNode } from "react";
import type { ColumnDef, RowData } from "@tanstack/react-table";

// Tipos exportados para que el editor sugiera las opciones al autocompletar
export type ProTableStatusColor =
  | "success"
  | "danger"
  | "warning"
  | "muted"
  | "info"
  | "primary"
  | "secondary"
  | "accent"
  | "purple"
  | "violet"
  | "indigo"
  | "blue"
  | "cyan"
  | "teal"
  | "green"
  | "lime"
  | "amber"
  | "orange"
  | "rose"
  | "slate"
  | "stone"
  | "zinc"
  | "neutral";

export type ProTableStatusMapValue = string | { label: string; color?: ProTableStatusColor };
export type ProTableStatusMap = Record<string, ProTableStatusMapValue>;

export type ProTableSelectMap = Record<string, string>;

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    enableReordering?: boolean;
    align?: "left" | "center" | "right";
    fixed?: "left" | "right";
    enableSearchFilter?: boolean;
    enableSelectFilter?: boolean;
    /**
     * Mapeo opcional key→label para filtros de selección. Si se proporciona,
     * el filtro mostrará `label` en lugar de la clave cruda.
     * Ej: { "A": "Activo", "I": "Inactivo" }
     */
    selectFilterOptions?: ProTableSelectMap;
    enableSort?: boolean;
    /**
     * Configuración para columnas de estado (badges).
     * - `type: 'boolean'` muestra un badge para true/false usando `trueLabel`/`falseLabel`.
     * - `type: 'map'` muestra un badge con el label obtenido desde `map[value]`.
     */
    status?:
      | {
          type: "boolean";
          /** Etiqueta para true (por defecto 'Sí') */
          trueLabel?: string;
          /** Etiqueta para false (por defecto 'No') */
          falseLabel?: string;
          /** Si true usa 'Yes'/'No' en lugar de 'Sí'/'No' */
          useYesNo?: boolean;
          /** Clases CSS personalizadas para true/false (opcional) */
          trueClass?: string;
          falseClass?: string;
        }
      | {
          type: "map";
          /**
           * Mapa simple de valor→label, o valor→{ label, className }
           * Ej: { Activo: 'Activo', Inactivo: { label: 'Inactivo', className: 'bg-red-100 text-red-700' } }
           */
          // value can be either a label string or an object with label + color
          // `color` acepta nombres semánticos (p.e. 'success','danger','warning','muted','info',
          // 'primary','secondary','accent', 'purple', 'blue', ...) o una cadena raw
          // con clases CSS de Tailwind.
          map: ProTableStatusMap;
        };
    /**
     * Configuración para convertir la celda en un control editable.
     * - `type`: tipo de editor ('text' | 'number' | 'currency' | 'textarea' | 'select')
     * - `options`: para select, array de strings/objetos { value, label } o Record<string,string>
     * - `onChange`: callback(newValue, rowOriginal, columnId)
     *   - `value` es del tipo de la columna (`TValue`) o `undefined` (p.e. número para currency/number, string para text/select)
     *   - `row` es el registro original tipado (`TData`)
     */
    input?: {
      type: "text" | "number" | "currency" | "textarea" | "select";
      options?: string[] | { value: string; label: string }[] | Record<string, string>;
      /**
       * Callback al editar una celda.
       * @param value   Nuevo valor de la celda (tipado según la columna).
       * @param row     Registro original antes del cambio.
       * @param updated Registro con el nuevo valor ya aplicado (`{ ...row, [columnId]: value }`).
       * @param columnId Id de la columna editada.
       */
      onChange?: (value: TValue | undefined, row: TData, updated: TData, columnId: string) => void;
    };
  }

  interface TableMeta<TData extends RowData> {
    rowSelection?: TData;
    selectedSet?: Set<string>;
    allKeys?: (string | number)[];
    dataSource?: TData[];
    updateSelection?: (keys: (string | number)[], selectedRows: TData[]) => void;
  }
}

export type { ColumnDef };

export interface ProTableScroll {
  x?: number;
  /** Altura del cuerpo de la tabla. Acepta:
   * - `number` px para el cuerpo (el header se suma automáticamente)
   * - CSS string  p.e. `"calc(100vh - 120px)"`, `"50%"`, `"400px"` (se aplica al contenedor completo)
   * - Clase Tailwind  p.e. `"h-96"`, `"max-h-screen"` (se aplica como className al contenedor)
   */
  y?: number | string;
}

export interface ProTableContextMenuItem {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  variant?: "default" | "destructive";
  separator?: boolean;
  disabled?: boolean;
  multiSelect?: boolean;
}

export type ProTableSelectionType = "single" | "multiple" | "none";

export interface ProTableContextMenuEvent<T> {
  actionKey: string;
  rowKey: string | number;
  row: T;
  selectionType: ProTableSelectionType;
  selectedKeys: (string | number)[];
  selectedRows: T[];
}

export interface ProTableDraggableProps<T> {
  enable?: boolean;
  onDragChanged?: (sourceIndex: number, destinationIndex: number, reorderedData: T[]) => void;
}

export interface ProTableExportProps {
  onExcel?: () => void;
  onPdf?: () => void;
}

export interface ProTableAddProps {
  label?: string;
  onClick: () => void;
}

export interface ProTableToolbarOptions<T> {
  export?: ProTableExportProps;
  add?: ProTableAddProps;
  rowActions?: {
    items?: ProTableContextMenuItem[];
    onEvent?: (event: ProTableContextMenuEvent<T>) => void;
  };
}

export interface ProTableExpandable<T> {
  expandedRowRender: (record: T) => ReactNode;
  rowExpandable?: (record: T) => boolean;
}

export interface ProTablePaginationConfig {
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  total?: number;
  pageIndex?: number;
  pageSize?: number;
  onPaginationChange?: (pageIndex: number, pageSize: number) => void;
}

export interface ProTableInfiniteScrollParams {
  /** Índice de la página que se está solicitando (base 0). La página 0 ya la cargó el padre. */
  pageIndex: number;
  /** Cantidad de registros por página configurada en infiniteScroll.pageSize */
  pageSize: number;
  /** Total de registros ya cargados (útil para APIs offset-based: offset = dataSource.length) */
  offset: number;
}

export interface ProTableInfiniteScrollConfig {
  /**
   * Se llama cuando el usuario se acerca al final del scroll.
   * El padre es responsable de hacer la petición y agregar los registros a `dataSource`.
   */
  onLoadMore: (params: ProTableInfiniteScrollParams) => Promise<void> | void;
  /** Si hay más registros por cargar. Cuando sea `false` deja de disparar `onLoadMore`. */
  hasMore: boolean;
  /** Controla el indicador de carga al pie. El padre lo pone en `true` mientras hace fetch. */
  loadingMore?: boolean;
  /** Registros que se solicitan por llamada (se pasa en los parámetros, default 50). */
  pageSize?: number;
  /** Píxeles desde el final del scroll para disparar la carga (default 150). */
  threshold?: number;
}

export interface ProTableBorderConfig {
  wrapper?: boolean;
  records?: "vertical" | "horizontal" | "both" | "none";
}

export interface ProTableRowSelection<T> {
  type?: "multiple" | "single";
  selectedRowKeys?: (string | number)[];
  onChange?: (selectedKeys: (string | number)[], selectedRows: T[]) => void;
  onRowClick?: (key: string | number, row: T) => void;
  onRowDoubleClick?: (key: string | number, row: T) => void;
  onRowContextMenu?: (key: string | number, row: T) => void;
}

export interface ProTableProps<T extends object> {
  columns: ColumnDef<T>[];
  dataSource: T[];
  rowKey: keyof T;
  scroll?: ProTableScroll;
  className?: string;
  rowHeight?: number;
  bordered?: boolean | ProTableBorderConfig;
  draggable?: ProTableDraggableProps<T>;
  title?: React.ReactNode;
  rowSelection?: ProTableRowSelection<T>;
  enableColumnVisibility?: boolean;
  pagination?: boolean | ProTablePaginationConfig;
  toolbarOptions?: ProTableToolbarOptions<T>;
  expandable?: ProTableExpandable<T>;
  loading?: boolean;
  striped?: boolean;
  /**
   * Activa el scroll infinito. Tiene prioridad sobre `pagination`:
   * si `infiniteScroll` está presente, los controles de paginación se ocultan.
   */
  infiniteScroll?: ProTableInfiniteScrollConfig;
  /** Fila(s) de resumen fija(s) al pie del área de datos, antes del footer. */
  summary?: ProTableSummary<T> | ProTableSummary<T>[];
  /**
   * Agrupa registros por un campo mostrando filas cabecera por grupo
   * antes de los registros de ese grupo.
   */
  groupRow?: ProTableGroupRowConfig<T>;
}

export interface CtxState<T> {
  x: number;
  y: number;
  rowKey: string | number;
  row: T;
}

// ─── Summary Row ──────────────────────────────────────────────────────────────

export type ProTableSummaryReducer = "sum" | "avg" | "count" | "min" | "max";

export interface ProTableSummaryColumnConfig<T> {
  /**
   * Función de agregación predefinida.
   * Lee el valor desde `valueKey` si se especifica, si no usa el `accessorKey` de la columna.
   */
  reducer?: ProTableSummaryReducer;
  /** Clave de la propiedad del objeto a usar para calcular el agregado. */
  valueKey?: keyof T;
  /**
   * Renderizador personalizado. Recibe todos los registros y el valor agregado
   * calculado por `reducer` (null si no hay reducer).
   */
  render?: (rows: T[], value: number | null) => ReactNode;
  /** Alineación del texto en la celda de resumen. */
  align?: "left" | "center" | "right";
  /**
   * Número de columnas visibles que ocupa esta celda (a partir de la actual, hacia la derecha).
   * Las columnas "tapadas" por el colSpan no deben tener configuración propia.
   * Default: 1.
   */
  colSpan?: number;
}

export interface ProTableSummary<T> {
  /** Mapa de columnId → configuración de resumen. */
  columns: Partial<Record<string, ProTableSummaryColumnConfig<T>>>;
  /** Clase CSS adicional aplicada al contenedor de la fila de resumen. */
  className?: string;
}

// ─── Group Row ────────────────────────────────────────────────────

export interface ProTableGroupColumnConfig<T> {
  /**
   * Función de agregación predefinida para este grupo.
   */
  reducer?: ProTableSummaryReducer;
  /** Clave del campo a agregar (por defecto usa el accessorKey de la columna). */
  valueKey?: keyof T;
  /**
   * Renderizador personalizado para la celda de este grupo.
   * Recibe: valor de agrupación, registros del grupo, valor agregado.
   */
  render?: (groupValue: unknown, rows: T[], aggregated: number | null) => ReactNode;
  /** Alineación del contenido. */
  align?: "left" | "center" | "right";
  /** Número de columnas que ocupa esta celda (colSpan). Default 1. */
  colSpan?: number;
}

export interface ProTableGroupRowConfig<T> {
  /** Campo del objeto por el cual agrupar los registros. */
  groupBy: keyof T & string;
  /**
   * Configuración por columna para la fila cabecera de cada grupo.
   * La clave es el columnId. Las columnas sin configuración muestran celda vacía.
   */
  columns?: Partial<Record<string, ProTableGroupColumnConfig<T>>>;
  /** Permite colapsar/expandir grupos (default: true). */
  collapsible?: boolean;
  /** Todos los grupos inician colapsados (default: false). */
  defaultCollapsed?: boolean;
  /** Clase CSS adicional para la fila cabecera del grupo. */
  className?: string;
}
