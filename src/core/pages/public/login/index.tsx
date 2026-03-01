import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Page } from "@/components/app/page";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ProTable,
  type ColumnDef,
  type ProTableContextMenuItem,
  type ProTableContextMenuEvent,
  type ProTableInfiniteScrollParams,
  type ProTableGroupRowConfig,
  type ProTableSummary,
} from "@/components/app/table";
import { EditIcon, Trash2Icon, EyeIcon, CopyIcon } from "lucide-react";
import { sileo } from "sileo";

// ─── Interface ────────────────────────────────────────────────────────────────
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  salary: number;
  status: "A" | "I" | "P";
  createdAt: string;
  location: string;
  phone: string;
  contractType: string;
}

// ─── Fake data ────────────────────────────────────────────────────────────────
const ROLES = ["Administrador", "Analista", "Desarrollador", "Soporte", "Gerente", "Asesor"];
const DEPTS = ["Tecnología", "Finanzas", "Recursos Humanos", "Ventas", "Operaciones", "Legal"];
const STATUSES: User["status"][] = ["A", "I", "P"];
const FNAMES = ["Carlos", "María", "José", "Ana", "Luis", "Carmen", "Jorge", "Patricia", "Miguel", "Rosa", "Andrés", "Laura", "David", "Lucía", "Sergio", "Elena"];
const LNAMES = ["García", "Rodríguez", "Martínez", "López", "González", "Pérez", "Sánchez", "Ramírez", "Torres", "Flores", "Rivera", "Cruz", "Morales", "Reyes"];
const LOCATIONS = ["Sede Central", "Sucursal Norte", "Sucursal Sur", "Remoto", "Oficina Arequipa", "Oficina Trujillo"];
const CONTRACTS = ["Indeterminado", "Plazo Fijo", "Honorarios", "Practicante"];

const pick = <T,>(arr: T[], i: number) => arr[i % arr.length];

const fakeUsers: User[] = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `${pick(FNAMES, i * 3 + 7)} ${pick(LNAMES, i * 5 + 2)} ${pick(LNAMES, i * 7 + 4)}`,
  email: `${pick(FNAMES, i * 3 + 7).toLowerCase()}.${pick(LNAMES, i * 5 + 2).toLowerCase()}${i + 1}@empresa.pe`,
  role: pick(ROLES, i),
  department: pick(DEPTS, i + 2),
  salary: 2000 + (i % 30) * 250,
  status: pick(STATUSES, i),
  createdAt: `${2020 + (i % 5)}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}`,
  location: pick(LOCATIONS, i * 4 + 1),
  phone: `9${Math.floor(Math.random() * 90000000) + 10000000}`,
  contractType: pick(CONTRACTS, i * 2 + 3),
}));

// ─── Columns ──────────────────────────────────────────────────────────────────

const columns: ColumnDef<User>[] = [
  { id: "id", accessorKey: "id", header: "#", size: 40, enableHiding: false, meta: { fixed: "left", align: "center", enableReordering: false } },
  {
    id: "personal",
    header: "Información Personal",
    // meta: { fixed: "left" },
    columns: [
      {
        id: "name",
        accessorKey: "name",
        header: "Nombre Completo",
        size: 400,
        enableHiding: false,
        meta: { enableSearchFilter: true, enableSort: true, enableReordering: false },
      },
      { id: "email", accessorKey: "email", header: "Correo", size: 250, enableHiding: true, meta: { enableSearchFilter: true, enableReordering: false } },
    ],
  },
  {
    id: "work",
    header: "Información Laboral",
    columns: [
      { id: "role", accessorKey: "role", header: "Rol", size: 150, meta: { enableSelectFilter: true } },
      { id: "department", accessorKey: "department", header: "Departamento", size: 200, meta: { enableSelectFilter: true } },
      {
        id: "salary",
        accessorKey: "salary",
        header: "Salario",
        size: 150,
        meta: { align: "right", enableSort: true, enableSelectFilter: false },
        cell: ({ getValue }) => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(getValue() as number),
      },
    ],
  },
  { id: "location", accessorKey: "location", header: "Ubicación", size: 150, meta: { enableSelectFilter: true } },
  { id: "phone", accessorKey: "phone", header: "Teléfono", size: 120 },
  { id: "contractType", accessorKey: "contractType", header: "T. Contrato", size: 130, meta: { enableSelectFilter: true } },
  {
    id: "isPermanent",
    header: "Contrato Indet.",
    accessorFn: (row: User) => row.contractType === "Indeterminado",
    size: 120,
    meta: { align: "center", status: { type: "boolean", trueLabel: "Sí", falseLabel: "No" } },
    enableHiding: true,
  },
  {
    id: "metadata",
    header: "Metadatos Sistema",
    columns: [
      {
        id: "status",
        accessorKey: "status",
        header: "Estado",
        size: 120,
        meta: {
          align: "center",
          enableSelectFilter: true,
          selectFilterOptions: {
            A: "Activo",
            I: "Inactivo",
            P: "Pendiente",
          },
          status: {
            type: "map",
            map: {
              A: { label: "Activo", color: "blue" },
              I: { label: "Inactivo", color: "danger" },
              P: { label: "Pendiente", color: "warning" },
            },
          },
        },
      },
      { id: "createdAt", accessorKey: "createdAt", header: "F. Registro", size: 150, meta: { align: "center", enableSearchFilter: true, enableSort: true } },
      { id: "lastLogin", header: "Último Acceso", size: 140, meta: { enableSort: true }, cell: () => "Ayer" },
    ],
  },
];

// ─── Context menu items ───────────────────────────────────────────────────────
const ctxItems: ProTableContextMenuItem[] = [
  { key: "view", label: "Ver detalle", icon: <EyeIcon /> },
  { key: "edit", label: "Editar", icon: <EditIcon /> },
  { key: "copy", label: "Copiar ID", icon: <CopyIcon /> },
  { key: "delete", label: "Eliminar", icon: <Trash2Icon />, variant: "destructive", multiSelect: true },
];

const summary: ProTableSummary<User>[] = [
  {
    columns: {
      name: {
        colSpan: 4,
        render: () => <div className='w-full font-semibold text-right'>TOTAL</div>,
      },
      salary: {
        reducer: "sum",
        align: "right",
        render: (_, value) =>
          value !== null ? <span className='font-semibold text-right'>{new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value)}</span> : null,
      },
    },
  },
  {
    columns: {
      name: {
        colSpan: 4,
        render: () => <div className='w-full font-semibold text-right'>PROMEDIO</div>,
      },
      salary: {
        reducer: "avg",
        align: "right",
        render: (_, value) =>
          value !== null ? <span className='font-semibold text-right'>{new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value)}</span> : null,
      },
    },
  },
  {
    columns: {
      name: {
        colSpan: 4,
        render: () => <div className='w-full font-semibold text-right'>MINIMO</div>,
      },
      salary: {
        reducer: "min",
        align: "right",
        render: (_, value) =>
          value !== null ? <span className='font-semibold text-right'>{new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value)}</span> : null,
      },
    },
  },
  {
    columns: {
      name: {
        colSpan: 4,
        render: () => <div className='w-full font-semibold text-right'>MAXIMO</div>,
      },
      salary: {
        reducer: "max",
        align: "right",
        render: (_, value) =>
          value !== null ? <span className='font-semibold text-right'>{new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value)}</span> : null,
      },
    },
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export const Login = () => {
  const [users, setUsers] = useState<User[]>(fakeUsers);

  // ─── Api Pagination Demo State ───
  const [isApiMode, setIsApiMode] = useState(false);
  const [apiData, setApiData] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const [isInfiniteMode, setIsInfiniteMode] = useState(false);
  const [infiniteData, setInfiniteData] = useState<User[]>([]);
  const [infiniteLoading, setInfiniteLoading] = useState(false);
  const [infiniteHasMore, setInfiniteHasMore] = useState(true);
  const [isGroupMode, setIsGroupMode] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (isApiMode) {
      setLoading(true);
      // Simular tiempo de respuesta de red
      const timer = setTimeout(() => {
        const start = pageIndex * pageSize;
        const end = start + pageSize;
        setApiData(fakeUsers.slice(start, end));
        setLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isApiMode, pageIndex, pageSize]);

  // ─── Infinite Scroll Demo State ───────────────────────────────────────────────
  const INFINITE_PAGE_SIZE = 50;

  // Carga inicial cuando se activa el modo infinite scroll
  useEffect(() => {
    if (isInfiniteMode) {
      setInfiniteData(fakeUsers.slice(0, INFINITE_PAGE_SIZE));
      setInfiniteHasMore(fakeUsers.length > INFINITE_PAGE_SIZE);
    } else {
      setInfiniteData([]);
      setInfiniteHasMore(true);
    }
  }, [isInfiniteMode]);

  // Simula la llamada al API que devuelve la siguiente página
  const handleLoadMore = useCallback(
    ({ pageSize: ps, offset }: ProTableInfiniteScrollParams) => {
      if (infiniteLoading) return;
      setInfiniteLoading(true);
      setTimeout(() => {
        const nextBatch = fakeUsers.slice(offset, offset + ps);
        setInfiniteData((prev) => [...prev, ...nextBatch]);
        setInfiniteHasMore(offset + ps < fakeUsers.length);
        setInfiniteLoading(false);
      }, 700);
    },
    [infiniteLoading],
  );

  // Los modos son mutuamente excluyentes
  const handleSetApiMode = (val: boolean) => {
    setIsApiMode(val);
    if (val) {
      setIsInfiniteMode(false);
      setIsGroupMode(false);
    }
  };
  const handleSetInfiniteMode = (val: boolean) => {
    setIsInfiniteMode(val);
    if (val) {
      setIsApiMode(false);
      setIsGroupMode(false);
    }
  };
  const handleSetGroupMode = (val: boolean) => {
    setIsGroupMode(val);
    if (val) {
      setIsApiMode(false);
      setIsInfiniteMode(false);
    }
  };

  // ProTable natively handles selection click and right click

  const handleDoubleClick = (_key: string | number, row: User) => {
    sileo.info({ title: `Doble clic en: ${row.name}` });
  };

  const handleContextAction = (event: ProTableContextMenuEvent<User>) => {
    const { actionKey, row, selectionType, selectedKeys, selectedRows } = event;
    console.log("Action triggered:", actionKey, "| Selection Scope:", selectionType, "| Keys:", selectedKeys, "| Rows:", selectedRows);

    if (actionKey === "copy") {
      navigator.clipboard.writeText(String(row.id));
      sileo.success({
        title: "ID recibido",
        icon: <CopyIcon />,
        description: `ID ${row.id} copiado`,
      });
    } else if (actionKey === "delete") {
      if (selectionType === "single") {
        sileo.error({ title: `Eliminando: ${row.name}` });
      } else {
        sileo.error({ title: `Eliminando: ${selectedRows.length} usuarios` });
      }
    } else if (actionKey === "view") {
      sileo.info({ title: `Ver: ${row.name}` });
    } else if (actionKey === "edit") {
      sileo.info({ title: `Editar: ${row.name}` });
    }
  };

  // Optimized updaters: update single row by id and debounced updater per row
  const updateUserField = useCallback((id: string | number, patch: Partial<User>) => {
    setUsers((prev) => {
      const idx = prev.findIndex((u) => String(u.id) === String(id));
      if (idx === -1) return prev;
      const next = prev.slice();
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }, []);

  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const debouncedUpdateField = useCallback(
    (id: string | number, patch: Partial<User>, delay = 250) => {
      const key = String(id);
      const prevTimer = timersRef.current.get(key);
      if (prevTimer) clearTimeout(prevTimer);
      const t = setTimeout(() => {
        updateUserField(id, patch);
        timersRef.current.delete(key);
      }, delay);
      timersRef.current.set(key, t);
    },
    [updateUserField],
  );

  const demoColumns = useMemo(() => {
    const cloneCols = (arr: any[]): any[] =>
      arr.map((c) => {
        if (c.columns && Array.isArray(c.columns)) return { ...c, columns: cloneCols(c.columns) };
        if (c.id === "salary") {
          return {
            ...c,
            meta: {
              ...(c.meta ?? {}),
              input: {
                type: "currency",
                onChange: (_val: any, _orig: User, updated: User) => {
                  const newSalary = typeof updated.salary === "number" ? updated.salary : Number(String(updated.salary).replace(/[^0-9.-]/g, ""));
                  if (!Number.isNaN(newSalary)) debouncedUpdateField(updated.id, { salary: newSalary });
                },
              },
            },
          };
        }
        return c;
      });

    const cloned = cloneCols(columns);

    // Insertar una columna demo editable tipo select para `location`
    const selectCol = {
      id: "location_edit",
      accessorKey: "location",
      header: "Ubicación (Editar)",
      size: 150,
      meta: {
        input: {
          type: "select",
          options: LOCATIONS,
          onChange: (val: any, _orig: User, updated: User) => {
            // column id is "location_edit" ≠ accessorKey "location", so use val directly
            updateUserField(updated.id, { location: val });
          },
        },
      },
    };

    const insertAfter = cloned.findIndex((c) => c.id === "location");
    if (insertAfter !== -1) cloned.splice(insertAfter + 1, 0, selectCol);
    else cloned.push(selectCol);

    return cloned;
  // columns es constante de módulo; sólo reconstruir si cambian los callbacks
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedUpdateField, updateUserField]);

  return (
    <Page title='SGDocu — Demo ProTable'>
      <div className='p-6 flex flex-col gap-4'>
        <div className='flex items-start justify-between'>
          <div>
            <h1 className='text-xl font-bold tracking-tight'>Demo ProTable</h1>
            <p className='text-muted-foreground text-xs mt-0.5'>Virtual list · cabecera estática · columnas resizables · cabeceras anidadas · selección · menú contextual</p>
          </div>
          <div className='flex items-center gap-2'>
            <div className='flex items-center gap-2 bg-card px-4 py-2 rounded-xl border shadow-sm'>
              <Switch id='api-mode' checked={isApiMode} onCheckedChange={handleSetApiMode} />
              <Label htmlFor='api-mode' className='cursor-pointer font-medium text-xs'>
                Paginación API (Servidor)
              </Label>
            </div>
            <div className='flex items-center gap-2 bg-card px-4 py-2 rounded-xl border shadow-sm'>
              <Switch id='infinite-mode' checked={isInfiniteMode} onCheckedChange={handleSetInfiniteMode} />
              <Label htmlFor='infinite-mode' className='cursor-pointer font-medium text-xs'>
                Infinite Scroll (API)
              </Label>
            </div>
            <div className='flex items-center gap-2 bg-card px-4 py-2 rounded-xl border shadow-sm'>
              <Switch id='group-mode' checked={isGroupMode} onCheckedChange={handleSetGroupMode} />
              <Label htmlFor='group-mode' className='cursor-pointer font-medium text-xs'>
                Agrupar por Departamento
              </Label>
            </div>
          </div>
        </div>

        <ProTable<User>
          title={
            <div className='font-bold flex items-center gap-2'>
              Usuarios del Sistema
              {isApiMode && <span className='text-primary font-normal text-xs bg-primary/10 px-2 py-0.5 rounded-full'>Paginación API</span>}
              {isInfiniteMode && (
                <span className='text-violet-600 dark:text-violet-400 font-normal text-xs bg-violet-50 dark:bg-violet-950/30 px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-800'>
                  Infinite Scroll
                </span>
              )}
            </div>
          }
          toolbarOptions={{
            add: {
              onClick: () => sileo.success({ title: "Acción: Agregar Usuario" }),
            },
            export: {
              onExcel: () =>
                sileo.promise(() => new Promise((resolve) => setTimeout(resolve, 1000)), {
                  loading: { title: "Exportando a Excel..." },
                  success: { title: "Exportado a Excel" },
                  error: { title: "Error al exportar a Excel" },
                }),
              onPdf: () =>
                sileo.promise(() => new Promise((resolve) => setTimeout(resolve, 1000)), {
                  loading: { title: "Exportando a PDF..." },
                  success: { title: "Exportado a PDF" },
                  error: { title: "Error al exportar a PDF" },
                }),
            },
            rowActions: {
              items: ctxItems,
              onEvent: handleContextAction,
            },
          }}
          enableColumnVisibility
          loading={isApiMode ? loading : undefined}
          pagination={
            isApiMode
              ? {
                  total: fakeUsers.length,
                  pageIndex,
                  pageSize,
                  pageSizeOptions: [10, 25, 50, 100],
                  onPaginationChange: (newPageIndex: number, newPageSize: number) => {
                    setPageIndex(newPageIndex);
                    setPageSize(newPageSize);
                  },
                }
              : !isInfiniteMode
          }
          infiniteScroll={
            isInfiniteMode
              ? {
                  hasMore: infiniteHasMore,
                  loadingMore: infiniteLoading,
                  pageSize: INFINITE_PAGE_SIZE,
                  threshold: 200,
                  onLoadMore: handleLoadMore,
                }
              : undefined
          }
          columns={demoColumns}
          dataSource={isInfiniteMode ? infiniteData : isApiMode ? apiData : users}
          rowKey='id'
          draggable={{
            enable: true,
            onDragChanged: (_: number, __: number, newOrder: User[]) => {
              if (isInfiniteMode) {
                setInfiniteData(newOrder);
              } else {
                setUsers(newOrder);
              }
              sileo.success({ title: "Orden actualizado" });
            },
          }}
          scroll={{ y: "calc(100vh - 13rem)" }}
          rowSelection={{
            type: "multiple",
            onRowDoubleClick: handleDoubleClick,
          }}
          expandable={{
            rowExpandable: (record) => [1, 15, 2, 5, 6, 7].includes(record.id),
            expandedRowRender: (record) => (
              <>
                <p>
                  <strong>ID Interno:</strong> {record.id}
                </p>
                <p>
                  <strong>Nombre Completo:</strong> {record.name}
                </p>
                <p>
                  <strong>Email:</strong> {record.email}
                </p>
                <p>
                  <strong>Rol:</strong> {record.role}
                </p>
                <p className='text-muted-foreground mt-2'>Estos detalles se renderizan de manera dinámica bajo cada fila.</p>
              </>
            ),
          }}
          groupRow={
            isGroupMode
              ? ({
                  groupBy: "department",
                  collapsible: true,
                  defaultCollapsed: false,
                  columns: {
                    name: {
                      colSpan: 4,
                      render: (groupValue, groupRows) => (
                        <span className='font-semibold text-foreground'>
                          {String(groupValue)}
                          <span className='ml-2 text-muted-foreground font-normal'>
                            ({groupRows.length} registro{groupRows.length !== 1 ? "s" : ""})
                          </span>
                        </span>
                      ),
                    },
                    salary: {
                      reducer: "sum",
                      align: "right",
                      render: (_, __, value) =>
                        value !== null ? <span className='font-semibold'>{new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value)}</span> : null,
                    },
                  },
                } satisfies ProTableGroupRowConfig<User>)
              : undefined
          }
          // summary={summary}
        />
      </div>
    </Page>
  );
};
