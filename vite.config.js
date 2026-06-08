import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Dev-only proxy: POST /api/claude → Anthropic (needs ANTHROPIC_API_KEY in env). */
function claudeDevProxy() {
  return {
    name: "knsl-claude-dev-proxy",
    configureServer(server) {
      server.middlewares.use("/api/claude", async (req, res) => {
        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type");
          res.end();
          return;
        }
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }
        const key = process.env.ANTHROPIC_API_KEY;
        if (!key) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "ANTHROPIC_API_KEY belum di-set untuk dev proxy." }));
          return;
        }
        const chunks = [];
        req.on("data", (c) => chunks.push(c));
        req.on("end", async () => {
          try {
            const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
            if (process.env.CLAUDE_MODEL) payload.model = process.env.CLAUDE_MODEL;
            if (!payload.max_tokens) payload.max_tokens = 2000;
            const upstream = await fetch("https://api.anthropic.com/v1/messages", {
              method: "POST",
              headers: {
                "content-type": "application/json",
                "x-api-key": key,
                "anthropic-version": "2023-06-01",
              },
              body: JSON.stringify(payload),
            });
            const text = await upstream.text();
            res.statusCode = upstream.status;
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.end(text);
          } catch (e) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Dev proxy gagal: " + (e.message || e) }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), claudeDevProxy()],
  // kalau deploy ke GitHub Pages di sub-path, set base: "/nama-repo/"
  base: "./",
});
