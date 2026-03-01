import { RouterProvider } from "react-router";
import { setDefaultOptions } from "date-fns";
import { Toaster } from "sileo";
import { es } from "date-fns/locale";
import { ThemeProvider } from "@/components/app/theme-provider";
import { router } from "./router";

export const SGDocuApp = () => {
  setDefaultOptions({ locale: es });

  return (
    <ThemeProvider>
      <Toaster
        position='top-center'
        options={{
          fill: "#171717",
          roundness: 16,
          duration: 2000,
          styles: {
            title: "text-white!",
            description: "text-white/75!",
            badge: "bg-white/10!",
            button: "bg-white/10! hover:bg-white/15!",
          },
        }}
      />
      <RouterProvider router={router()} />
    </ThemeProvider>
  );
};
