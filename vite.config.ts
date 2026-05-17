import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Lantern dev/build config. The app is a local-first workbench, so the
// production build is a plain SPA — no SSR, no API routes.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5180,
    open: false,
  },
});
