/** Vite dev middleware — mount Vercel-style API handlers locally */
import health from "../api/health.js";
import migrate from "../api/db/migrate.js";
import register from "../api/auth/register.js";
import login from "../api/auth/login.js";
import me from "../api/auth/me.js";
import caseIndex from "../api/case-analyses/index.js";
import caseId from "../api/case-analyses/[id].js";
import crIndex from "../api/contract-reviews/index.js";
import crId from "../api/contract-reviews/[id].js";
import audit from "../api/audit/index.js";

const STATIC = [
  ["/api/health", health],
  ["/api/db/migrate", migrate],
  ["/api/auth/register", register],
  ["/api/auth/login", login],
  ["/api/auth/me", me],
  ["/api/case-analyses", caseIndex],
  ["/api/contract-reviews", crIndex],
  ["/api/audit", audit],
];

function nodeReqRes(req, res, handler, query = {}) {
  const fakeReq = {
    method: req.method,
    headers: req.headers,
    query,
    body: undefined,
    on: req.on.bind(req),
  };
  const fakeRes = {
    statusCode: 200,
    _headers: {},
    setHeader(k, v) { this._headers[k.toLowerCase()] = v; },
    end(body) {
      res.statusCode = this.statusCode;
      for (const [k, v] of Object.entries(this._headers)) res.setHeader(k, v);
      res.end(body);
    },
  };
  return handler(fakeReq, fakeRes);
}

export function apiDevMiddleware() {
  return async (req, res, next) => {
    if (!req.url?.startsWith("/api/")) return next();
    const url = new URL(req.url, "http://localhost");
    const path = url.pathname;

    for (const [prefix, handler] of STATIC) {
      if (path === prefix) {
        await nodeReqRes(req, res, handler);
        return;
      }
    }

    const caseMatch = path.match(/^\/api\/case-analyses\/([^/]+)$/);
    if (caseMatch) {
      await nodeReqRes(req, res, caseId, { id: caseMatch[1] });
      return;
    }

    const crMatch = path.match(/^\/api\/contract-reviews\/([^/]+)$/);
    if (crMatch) {
      await nodeReqRes(req, res, crId, { id: crMatch[1] });
      return;
    }

    next();
  };
}
