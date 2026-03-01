import { getCoreRowModel } from "@tanstack/react-table";
import { createTable } from "@tanstack/table-core";
// Wait, react-table doesn't export createTable in v8, we have to use something else.
