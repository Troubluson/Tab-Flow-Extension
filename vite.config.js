import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        utils: "src/utils.js",
        viewer: "src/viewer/viewer.js",
        background: "src/background.js",
        popup: "src/extension_popup/popup.js",
        export: "src/viewer/ui/export.js",
        tooltip: "src/viewer/ui/tooltip.js",
        styles: "src/viewer/ui/styles.js",
        layout: "src/viewer/layout.js",
      },
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});
