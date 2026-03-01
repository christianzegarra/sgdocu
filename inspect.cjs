const React = require('react');
const { getCoreRowModel, createTable } = require('@tanstack/react-table');

const t = createTable({
  columns: [
    { id: "id", header: "#", size: 55 },
    {
      id: "personal", header: "Información Personal", size: 450,
      columns: [ { id: "name", header: "Nombre", size: 220 } ],
    }
  ],
  data: [],
  getCoreRowModel: getCoreRowModel(),
  state: {},
  onStateChange: () => {},
});

const groups = t.getHeaderGroups();
console.log(JSON.stringify(groups.map((g, gi) => g.headers.map(h => ({
  gi,
  id: h.id,
  colId: h.column.id,
  isPlaceholder: h.isPlaceholder,
  subHeadersLen: h.subHeaders.length,
  depth: h.column.depth,
  headerLabel: typeof h.column.columnDef.header === 'string' ? h.column.columnDef.header : 'func'
}))), null, 2));
