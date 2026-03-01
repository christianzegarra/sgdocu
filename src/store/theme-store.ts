import type { ThemeState } from "@/types/ui/theme";
import { create } from "zustand";

const getInitialTheme = (): "light" | "dark" | "system" => {
  if (typeof window !== "undefined") {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
      return storedTheme as "light" | "dark" | "system";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  setTheme: (newTheme: "light" | "dark" | "system") => {
    set({ theme: newTheme });
    localStorage.setItem("theme", newTheme);
  },
  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === "light" ? "dark" : "light";
      localStorage.setItem("theme", newTheme);
      return { theme: newTheme };
    });
  },
}));
