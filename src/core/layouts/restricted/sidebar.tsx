import { NavUser } from "./nav-user";
import { Sidebar, SidebarContent, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";
import { MenuNavigation } from "./nav-main";
import { AppSidebarFooter } from "./sidebar-footer";

export const AppSidebar = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <NavUser />
      </SidebarHeader>
      <SidebarContent>
        <MenuNavigation />
      </SidebarContent>
      <SidebarRail />
      <AppSidebarFooter />
    </Sidebar>
  );
};
