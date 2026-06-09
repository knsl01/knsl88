import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { routeAI } from "./api/aiRouter.mjs";
import { apiDevMiddleware } from "./scripts/api-dev-middleware.mjs";

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
      catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end(JSON.stringify(data));
}

/** Dev proxy: /api/ai (multi-provider) + legacy /api/claude → /api/ai with claude provider */
function aiDevProxy() {
  return {
    name: "knsl-ai-dev-proxy",
    configureServer(server) {
      const handle = async (req, res, forceProvider) => {
        if (req.method === "OPTIONS") {
          res.statusCode = 204;
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type");
          res.end();
          return;
        }
        if (req.method === "GET") {
          const { getAIStatus } = await import("./api/aiRouter.mjs");
          sendJson(res, 200, getAIStatus());
          return;
        }
        if (req.method !== "POST") {
          sendJson(res, 405, { error: "Method not allowed" });
          return;
        }
        try {
          const payload = await readBody(req);
          if (forceProvider === "claude") {
            const msgs = payload.messages || [];
            const userMsg = msgs.find((m) => m.role === "user");
            const result = await routeAI({
              provider: "claude",
              system: payload.system,
              user: userMsg?.content || "",
              maxTokens: payload.max_tokens,
              model: payload.model,
            });
            sendJson(res, 200, {
              content: [{ type: "text", text: result.text }],
              model: result.model,
            });
            return;
          }
          const result = await routeAI(payload);
          sendJson(res, 200, result);
        } catch (e) {
          sendJson(res, 502, { error: String(e.message || e) });
        }
      };

      server.middlewares.use(apiDevMiddleware());
      server.middlewares.use("/api/ai", (req, res) => handle(req, res));
      server.middlewares.use("/api/claude", (req, res) => handle(req, res, "claude"));
    },
  };
}

export default defineConfig({
  plugins: [react(), aiDevProxy()],
  base: "./",
});
