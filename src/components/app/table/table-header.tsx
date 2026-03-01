import { flexRender, type Header, type HeaderGroup } from "@tanstack/react-table";
import { ChevronDownIcon, ChevronUpIcon, ChevronsUpDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ColumnHeaderFilter } from "./column-header-filter";
import { lastLeaf } from "./utils";

interface ProTableStickyHeaderProps<T extends object> {
  headerGroups: HeaderGroup<T>[];
  tableW: number;
  headerH: number;
  getHeaderVirtualSize: (header: Header<T, unknown>) => number;
  getHeaderVirtualOffsetL: (h: any) => number;
  virtualRightOffsets: Map<string, number>;
}

export function ProTableStickyHeader<T extends object>({
  headerGroups,
  tableW,
  headerH,
  getHeaderVirtualSize,
  getHeaderVirtualOffsetL,
  virtualRightOffsets,
}: ProTableStickyHeaderProps<T>) {
  return (
    <div className='bg-card isolate' style={{ position: "sticky", top: 0, zIndex: 100, width: tableW }}>
      {headerGroups.map((group, gi) => {
        const isLeaf = gi === headerGroups.length - 1;
        const rowH = isLeaf ? 28 : 26;

        return (
          <div key={group.id} className={cn("flex box-border bg-muted")} style={{ width: tableW, height: rowH }}>
            {group.headers.map((header, headerIndex, allHeaders) => {
              const isGroup = header.subHeaders.length > 0;
              const isL = !header.isPlaceholder && !isGroup;
              const target = isGroup ? header : isL ? header : null;

              const isRootLeaf = header.column.depth === 0 && !header.column.columns?.length;
              const isFullHeight = isRootLeaf && headerGroups.length > 1;

              const leafHeaders = header.getLeafHeaders();
              const allLeavesLeft = leafHeaders.length > 0 && leafHeaders.every((lh) => lh.column.getIsPinned() === "left");
              const allLeavesRight = leafHeaders.length > 0 && leafHeaders.every((lh) => lh.column.getIsPinned() === "right");
              const isPinned = isGroup ? (allLeavesLeft ? "left" : allLeavesRight ? "right" : header.column.getIsPinned()) : header.column.getIsPinned();

              // Columna de ancho completo (span de filas)
              if (isFullHeight) {
                if (gi === 0) {
                  const leaf = lastLeaf(header);
                  return (
                    <div
                      key={header.id}
                      className={cn("relative box-border", isPinned && "bg-muted")}
                      style={{
                        width: getHeaderVirtualSize(header),
                        minWidth: getHeaderVirtualSize(header),
                        maxWidth: getHeaderVirtualSize(header),
                        flexShrink: 0,
                        flexGrow: 0,
                        ...(isPinned
                          ? {
                              position: "sticky",
                              left: isPinned === "left" ? getHeaderVirtualOffsetL(header) : undefined,
                              right: isPinned === "right" ? (virtualRightOffsets.get(lastLeaf(header).column.id) ?? 0) : undefined,
                              zIndex: 30,
                            }
                          : {}),
                      }}
                    >
                      <div
                        className={cn(
                          "absolute left-0 top-0 flex items-center box-border select-none bg-muted z-10 overflow-visible border-b border-border",
                          headerIndex !== allHeaders.length - 1 && "border-r border-border",
                          header.column.id === "_selection_" ? "justify-center px-0" : "px-2.5",
                        )}
                        style={{
                          width: getHeaderVirtualSize(header),
                          height: headerH,
                          minWidth: getHeaderVirtualSize(header),
                          maxWidth: getHeaderVirtualSize(header),
                        }}
                      >
                        {leaf.column.columnDef.meta?.align === "right" && header.column.id !== "_selection_" && <ColumnHeaderFilter header={leaf} />}
                        <div
                          className={cn(
                            "flex flex-1 h-full items-center",
                            header.column.id === "_selection_" ? "justify-center" : "overflow-hidden",
                            header.column.columnDef.meta?.align === "center" && "justify-center",
                            header.column.columnDef.meta?.align === "right" && "justify-end",
                            "text-[0.68rem] font-semibold text-foreground uppercase tracking-[0.04em]",
                            leaf.column.columnDef.meta?.enableSort && "cursor-pointer select-none hover:opacity-80 transition-opacity",
                          )}
                          onClick={leaf.column.columnDef.meta?.enableSort ? leaf.column.getToggleSortingHandler() : undefined}
                        >
                          <span className={cn("truncate", header.column.id === "_selection_" && "w-full text-center")}>
                            {flexRender(leaf.column.columnDef.header, leaf.getContext())}
                          </span>
                          {leaf.column.columnDef.meta?.enableSort && (
                            <div className='ml-1 shrink-0 text-foreground flex items-center'>
                              {(
                                {
                                  asc: <ChevronUpIcon className='w-3 h-3 text-primary' />,
                                  desc: <ChevronDownIcon className='w-3 h-3 text-primary' />,
                                } as Record<string, React.ReactNode>
                              )[leaf.column.getIsSorted() as string] ?? <ChevronsUpDownIcon className='w-3 h-3' />}
                            </div>
                          )}
                        </div>
                        {leaf.column.columnDef.meta?.align !== "right" && header.column.id !== "_selection_" && <ColumnHeaderFilter header={leaf} />}
                        {target && target.column.getCanResize() !== false && (
                          <div
                            onMouseDown={target.getResizeHandler()}
                            onTouchStart={target.getResizeHandler()}
                            onDoubleClick={() => target.column.resetSize()}
                            className='absolute top-0 w-1 touch-none'
                            style={{
                              right: headerIndex !== allHeaders.length - 1 ? "-2px" : 0,
                              height: "100%",
                              cursor: "col-resize",
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                } else {
                  // Placeholder para filas secundarias de columnas full-height
                  return (
                    <div
                      key={header.id}
                      className={cn(headerIndex !== allHeaders.length - 1 && "border-r border-border", "border-b border-border", isPinned && "bg-muted")}
                      style={{
                        width: getHeaderVirtualSize(header),
                        minWidth: getHeaderVirtualSize(header),
                        maxWidth: getHeaderVirtualSize(header),
                        flexShrink: 0,
                        flexGrow: 0,
                      }}
                    />
                  );
                }
              }

              // Columna normal (no full-height)
              return (
                <div
                  key={header.id}
                  className={cn(
                    "relative flex items-center px-2.5 whitespace-nowrap box-border select-none",
                    headerIndex !== allHeaders.length - 1 && "border-r border-border",
                    "border-b border-border",
                    "overflow-visible",
                    isLeaf ? "text-[0.68rem] font-semibold text-foreground uppercase tracking-[0.04em]" : "text-[0.72rem] font-bold text-foreground uppercase tracking-[0.04em]",
                    isGroup ? "justify-center" : "justify-start",
                    header.column.id === "_selection_" && "justify-center px-0 overflow-visible",
                    isPinned && "bg-muted",
                  )}
                  style={{
                    width: getHeaderVirtualSize(header),
                    minWidth: getHeaderVirtualSize(header),
                    maxWidth: getHeaderVirtualSize(header),
                    flexShrink: 0,
                    flexGrow: 0,
                    ...(isPinned
                      ? {
                          position: "sticky",
                          left: isPinned === "left" ? getHeaderVirtualOffsetL(header) : undefined,
                          right: isPinned === "right" ? (virtualRightOffsets.get(header.column.id) ?? 0) : undefined,
                          zIndex: 30,
                        }
                      : {}),
                  }}
                >
                  {header.column.columnDef.meta?.align === "right" && !header.isPlaceholder && header.column.id !== "_selection_" && !isGroup && (
                    <ColumnHeaderFilter header={header} />
                  )}

                  <div
                    className={cn(
                      "flex items-center",
                      header.column.id === "_selection_" ? "justify-center flex-1" : "overflow-hidden flex-1",
                      header.column.columnDef.meta?.align === "center" && "justify-center",
                      header.column.columnDef.meta?.align === "right" && "justify-end",
                      header.column.columnDef.meta?.enableSort && "cursor-pointer select-none hover:text-foreground transition-colors",
                    )}
                    onClick={header.column.columnDef.meta?.enableSort ? header.column.getToggleSortingHandler() : undefined}
                  >
                    <span className={cn("truncate", header.column.id === "_selection_" && "w-full text-center")}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </span>
                    {!header.isPlaceholder && header.column.columnDef.meta?.enableSort && (
                      <div className='ml-1 shrink-0 text-muted-foreground flex items-center'>
                        {(
                          {
                            asc: <ChevronUpIcon className='w-3 h-3 text-primary' />,
                            desc: <ChevronDownIcon className='w-3 h-3 text-primary' />,
                          } as Record<string, React.ReactNode>
                        )[header.column.getIsSorted() as string] ?? <ChevronsUpDownIcon className='w-3 h-3' />}
                      </div>
                    )}
                  </div>

                  {header.column.columnDef.meta?.align !== "right" && !header.isPlaceholder && header.column.id !== "_selection_" && !isGroup && (
                    <ColumnHeaderFilter header={header} />
                  )}

                  {target && target.column.getCanResize() !== false && (
                    <div
                      onMouseDown={target.getResizeHandler()}
                      onTouchStart={target.getResizeHandler()}
                      onDoubleClick={() => target.column.resetSize()}
                      className='absolute top-0 w-1 touch-none'
                      style={{
                        right: headerIndex !== allHeaders.length - 1 ? "-2px" : 0,
                        height: "100%",
                        cursor: "col-resize",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
