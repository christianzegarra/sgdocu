import { createBrowserRouter } from "react-router";
import { PublicLayout } from "../layouts/public";
import { RestrictedLayout } from "../layouts/restricted";
import { Home } from "../pages/restricted/home";
import { Login } from "../pages/public/login";

export const router = () => {
  return createBrowserRouter([
    {
      path: "/",
      children: [
        {
          path: "login",
          Component: PublicLayout,
          children: [{ index: true, Component: Login }],
        },
        {
          path: "/",
          Component: RestrictedLayout,
          children: [
            { index: true, Component: Home },
            //   { path: "settings", Component: Settings },
          ],
        },
        {
          path: "*",
          Component: () => <div>404 Not Found</div>,
        },
      ],
    },
  ]);
};
