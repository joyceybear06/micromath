// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1", // avoid IPv6/localhost quirks on Windows
    port: 5173,        // keep your expected port
    open: true,        // auto-open correct tab
  },
});
