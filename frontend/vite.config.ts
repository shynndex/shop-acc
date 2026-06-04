import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Tách vendor chunks cho thư viện nặng
          if (id.includes("@tiptap")) return "vendor-tiptap";
          if (id.includes("@dnd-kit")) return "vendor-dnd-kit";
          if (id.includes("recharts")) return "vendor-recharts";
          if (id.includes("node_modules/react")) return "vendor-react";
        },
      },
    },
  },
});
