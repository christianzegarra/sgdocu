import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import { useAuthStore } from "../../../store/auth-store.ts";
import { apiService } from "@/services/api/index.ts";

export const PublicLayout = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate("/", { replace: true });
    }
    apiService.clearNavigationCallback();
  }, [token]);

  return <Outlet />;
};
