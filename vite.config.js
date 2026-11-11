import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const localBackend = "http://127.0.0.1:5000";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": { target: localBackend, changeOrigin: true },
      "/detect": { target: localBackend, changeOrigin: true },
      "/find_recipe": { target: localBackend, changeOrigin: true },
      "/get-recipe": { target: localBackend, changeOrigin: true },
      "/get_recipe": { target: localBackend, changeOrigin: true },
      "/static": { target: localBackend, changeOrigin: true },
    },
  },
});
