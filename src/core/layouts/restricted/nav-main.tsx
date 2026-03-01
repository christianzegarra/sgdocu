import { ChevronRight, ExternalLink } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub } from "@/components/ui/sidebar";
import { NavLink } from "react-router";
import { useActiveRoute } from "@/hooks/use-active-route";
import { allMenuItems } from "./menu-items";
import { SPECIAL_PERMISSIONS } from "@/lib/config/permissions";
import { ItemType, type IMenuItem } from "@/types/ui/sidebar.d";

const hasPermissions = (userPermissions: string[], requiredPermissions?: { key: string; label: string }[]): boolean => {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  if (userPermissions.includes(SPECIAL_PERMISSIONS.ALL_PERMISSIONS) || userPermissions.includes(SPECIAL_PERMISSIONS.ROOT_PERMISSIONS)) {
    return true;
  }

  const requiredPermissionKeys = requiredPermissions.map((permission) => permission.key);

  return requiredPermissionKeys.some((permissionKey) => userPermissions.includes(permissionKey));
};

const filterMenuItemsByPermissions = (items: readonly IMenuItem[], userPermissions: string[]): IMenuItem[] => {
  return items
    .map((item) => {
      if (!hasPermissions(userPermissions, item.permissions)) {
        return null;
      }

      switch (item.type) {
        case ItemType.menu: {
          return item;
        }

        case ItemType.submenu: {
          const filteredSubItems = filterMenuItemsByPermissions(item.items, userPermissions);

          if (filteredSubItems.length === 0) {
            return null;
          }

          return {
            ...item,
            items: filteredSubItems,
          };
        }

        case ItemType.group: {
          const filteredGroupItems = filterMenuItemsByPermissions(item.items, userPermissions);

          if (filteredGroupItems.length === 0) {
            return null;
          }

          return {
            ...item,
            items: filteredGroupItems,
          };
        }

        default: {
          return null;
        }
      }
    })
    .filter((item): item is IMenuItem => item !== null);
};

const MenuItem = ({ item }: { item: IMenuItem }) => {
  const isActive = useActiveRoute();

  switch (item.type) {
    case ItemType.menu: {
      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={isActive(item.url)}>
            <NavLink to={item.url}>
              {item.icon && <item.icon />}
              <span>{item.title}</span>
              <ExternalLink
                className='w-4 h-4 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity'
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(item.url, "_blank");
                }}
              />
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }

    case ItemType.submenu: {
      return (
        <Collapsible key={item.title} asChild defaultOpen={false} className='group/collapsible'>
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip={item.title}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
                <ChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub className='mr-0 pr-0'>
                {item.items.map((subItem) => (
                  <MenuItem key={subItem.title} item={subItem} />
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    }

    case ItemType.group: {
      return (
        <SidebarGroup key={item.title}>
          {item.title && <SidebarGroupLabel>{item.title}</SidebarGroupLabel>}
          <SidebarMenu>
            {item.items.map((groupItem) => (
              <MenuItem key={groupItem.title} item={groupItem} />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      );
    }

    default: {
      return <></>;
    }
  }
};

export const MenuNavigation = () => {
  // const { authRole } = useAuthStore()
  // const [items, setItems] = useState<IMenuItem[]>([])

  // useEffect(() => {
  //   if (!authRole) {
  //     setItems([])
  //     return
  //   }

  //   const filteredItems = filterMenuItemsByPermissions(allMenuItems, authRole.permission_keys)
  //   setItems(filteredItems)
  // }, [authRole])

  const items = allMenuItems;

  return items.map((item, index) => <MenuItem key={index} item={item} />);
};
