import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DarkModeToggle } from "./toggle-theme";
import { Outlet, useLocation } from "react-router";

export const Content = () => {
  const { pathname } = useLocation();

  const isHomePage = pathname === "/";

  return (
    <>
      <header className='sticky top-0 flex h-12 shrink-0 z-10 items-center gap-2 bg-background px-4 ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
        <div className='flex items-center gap-2 w-full'>
          <SidebarTrigger />
          {!isHomePage && <Separator orientation='vertical' className='mr-2 h-4!' />}
          <div id='breadcrumb' />
          <div className='ml-auto flex items-center gap-2'>
            <Separator orientation='vertical' className='h-4!' />
            <DarkModeToggle />
          </div>
        </div>
      </header>
      <div className='min-h-[calc(100dvh-4rem)] z-0 max-w-full overflow-x-hidden'>
        <div className='px-4 pb-4'>
          <Outlet />
        </div>
      </div>
    </>
  );
};
