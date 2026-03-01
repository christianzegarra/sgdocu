import { getCoreRowModel, createTable } from "@tanstack/react-table";
const t = createTable({
  columns: [
    { id: "id", header: "#", size: 55 },
    {
      id: "personal", header: "Información Personal", size: 450,
      columns: [ { id: "name", header: "Nombre", size: 220 } ],
    },
    { id: "status", header: "Estado", size: 110 },
  ],
  data: [], getCoreRowModel: getCoreRowModel(), state: {}, onStateChange: () => {},
});
const groups = t.getHeaderGroups();
console.log(JSON.stringify(groups.map((g, gi) => g.headers.map(h => ({
  gi,
  id: h.id,
  colId: h.column.id,
  isPlaceholder: h.isPlaceholder,
  colDepth: h.column.depth,
  parent: !!h.column.parent
}))), null, 2));
