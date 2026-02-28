import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5176,

    // VERY IMPORTANT: allow ngrok hosts
    allowedHosts: [
      "nehemiah-misleading-punctually.ngrok-free.dev"
    ]
  }
});
