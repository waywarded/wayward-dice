import { defineConfig } from "vite";
// @ts-ignore
import { resolve } from "path";
import react from "@vitejs/plugin-react";

declare var __dirname: string;
declare var process: { env: Record<string, string | undefined> };

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ["**/*.glb", "**/*.hdr"],
  // Some setups (e.g. a dev server started from another folder) miss file changes; VITE_POLL=1 polls instead
  server: process.env.VITE_POLL ? { watch: { usePolling: true, interval: 300 } } : {},
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        popover: resolve(__dirname, "popover.html"),
        background: resolve(__dirname, "background.html"),
        testSheet: resolve(__dirname, "test-sheet.html"),
      },
    },
  },
});
