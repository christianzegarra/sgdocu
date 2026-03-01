import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import packageJSON from "./package.json";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss({
      optimize: {
        minify: true,
      },
    }),
  ],
  define: {
    "import.meta.env.PACKAGE_VERSION": JSON.stringify(packageJSON.version),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 9004,
    open: true,
    watch: {
      usePolling: true,
    },
  },
});
