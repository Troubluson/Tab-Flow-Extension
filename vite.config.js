import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        viewer: "src/viewer/viewer.js",
        background: "src/background.js",
        popup: "src/popup.js",
      },
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});
