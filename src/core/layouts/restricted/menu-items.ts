import { AppPaths } from "@/lib/config/routing";
import { LayoutDashboard, FileUser } from "lucide-react";
import { PERMS } from "@/lib/config/permissions";
import { ItemType, type IMenuItem } from "@/types/ui/sidebar.d";

export const allMenuItems: IMenuItem[] = [
  {
    key: "main",
    type: ItemType.group,
    items: [
      {
        key: "dashboard",
        title: "Dashboard",
        type: ItemType.menu,
        url: AppPaths.root,
        icon: LayoutDashboard,
        permissions: [{ key: PERMS.DASHBOARD_VIEW, label: "Ver el dashboard principal", isMain: true }],
      },
    ],
  },
  {
    key: "operations",
    type: ItemType.group,
    items: [
      {
        key: "payroll",
        title: "Planillas",
        type: ItemType.menu,
        url: "/test",
        icon: FileUser,
        permissions: [],
      },
    ],
  },
];
