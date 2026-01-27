import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        viewer: "src/viewer/viewer.js",
        background: "src/background.js",
        popup: "src/popup.js",
        utils: "src/utils.js",
        export: "src/viewer/ui/export.js",
        tooltip: "src/viewer/ui/tooltip.js",
        filters: "src/viewer/ui/filters.js",
        styles: "src/viewer/ui/styles.js",
        layout: "src/viewer/layout.js",
      },
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});
