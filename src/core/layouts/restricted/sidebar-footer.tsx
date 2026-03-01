// import { useState } from "react";
import { SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
// import { logoDarkModeBase64, logoLightModeBase64 } from "@/utils/settings/business";
import { Sparkles } from "lucide-react";
// import { useThemeStore } from "@/store/theme-store";

export const AppSidebarFooter = () => {
  // const { theme } = useThemeStore();
  // const [openChangelog, setOpenChangelog] = useState(false);

  // const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  // const currentLogo = isDark ? logoDarkModeBase64 : logoLightModeBase64;

  const businessName = "SGDocu";

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size='lg'
            className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer hover:bg-sidebar-accent/50 transition-colors'
            // onClick={() => setOpenChangelog(true)}
          >
            <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700 text-sidebar-primary-foreground'>
              EM
              {/* <img src={currentLogo} alt={businessName} className='size-8 object-contain rounded-lg' /> */}
            </div>
            <div className='grid flex-1 text-left text-sm leading-tight'>
              <span className='truncate font-semibold'>{businessName}</span>
              <span className='truncate text-xs flex items-center gap-1'>
                <Sparkles className='h-3 w-3 text-primary' />v{import.meta.env.PACKAGE_VERSION} - Ver novedades
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
};
