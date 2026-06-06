import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // kalau deploy ke GitHub Pages di sub-path, set base: "/nama-repo/"
  base: "./",
});
