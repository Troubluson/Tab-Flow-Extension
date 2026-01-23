import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        viewer: "src/graph/viewer.js",
        layout: "src/graph/layout.js",
        background: "src/background.js",
        popup: "src/popup.js",
      },
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});
