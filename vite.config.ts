import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path"; // <-- 1. ADD THIS IMPORT

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    allowedHosts: [
      "v5svtr-5173.csb.app", // <-- Adds your specific CodeSandbox URL
    ],
  },
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  /* --- 2. ADD THIS RESOLVE OBJECT --- */
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@ucp/sdk": path.resolve(__dirname, "./src/lib/ucp-sdk.tsx"),
    },
  },
  /* --- END OF ADDITION --- */
});
