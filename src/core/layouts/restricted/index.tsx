import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { apiService } from "@/services/api";
import { SessionApi } from "@/services/api/features/session-api";
import { useAuthStore } from "@/store/auth-store";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Content } from "./content";
import { AppSidebar } from "./sidebar";

export const RestrictedLayout = () => {
  const sessionApi = new SessionApi();
  const [isLoading, setIsLoading] = useState(true);
  const { token, updateSessionInfo, logout, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const hasFetched = useRef(false);

  const callbackUnauthenticated = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const onFetchSessionInfo = async () => {
    try {
      apiService.setNavigationCallback(callbackUnauthenticated);
      const response = await sessionApi.getSessionInfo();

      if (response.success && response.data) {
        updateSessionInfo(response.data);
      } else {
        callbackUnauthenticated();
      }
    } catch (error) {
      console.error("Error fetching session info:", error);
      callbackUnauthenticated();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    if (token && !hasFetched.current) {
      hasFetched.current = true;
      // clearAccessCode();
      onFetchSessionInfo();
    }
  }, [token]);

  useEffect(() => {
    if (!isLoading && user) {
      if (!user.email && location.pathname !== "/set-email") {
        navigate("/set-email", { replace: true });
      } else if (user.email && location.pathname === "/set-email") {
        navigate("/", { replace: true });
      }
    }
  }, [isLoading, user, location.pathname]);

  if (isLoading) {
    return <Spinner fullScreen tip='FactuChat' />;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Content />
      </SidebarInset>
    </SidebarProvider>
  );
};
