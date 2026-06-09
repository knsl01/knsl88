const DEFAULT_ALLOWED_ORIGINS = [
  "https://knsl.tech",
  "https://www.knsl.tech",
];

const LOCAL_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i;
const rateBuckets = new Map();

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function configuredOrigins() {
  const origins = new Set(DEFAULT_ALLOWED_ORIGINS);
  for (const origin of splitCsv(process.env.AI_ALLOWED_ORIGINS)) origins.add(origin);
  if (process.env.VERCEL_URL) origins.add(`https://${process.env.VERCEL_URL}`);
  return origins;
}

export function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (LOCAL_ORIGIN_RE.test(origin)) return true;
  return configuredOrigins().has(origin);
}

export function applyCors(req, res) {
  const origin = req.headers?.origin || "";
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  return isAllowedOrigin(origin);
}

export function getClientId(req) {
  const forwarded = String(req.headers?.["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || req.headers?.["x-real-ip"] || req.socket?.remoteAddress || "unknown";
}

export function checkRateLimit(req, now = Date.now()) {
  const windowMs = Number(process.env.AI_RATE_LIMIT_WINDOW_MS) || 60_000;
  const max = Number(process.env.AI_RATE_LIMIT_MAX) || 60;
  if (max <= 0) return { ok: true, remaining: Infinity, retryAfter: 0 };

  const id = getClientId(req);
  const bucket = rateBuckets.get(id);
  if (!bucket || now >= bucket.resetAt) {
    rateBuckets.set(id, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1, retryAfter: 0 };
  }

  if (bucket.count >= max) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true, remaining: max - bucket.count, retryAfter: 0 };
}

export function resetRateLimitForTests() {
  rateBuckets.clear();
}

export function bodySizeBytes(body, headers = {}) {
  const len = Number(headers["content-length"] || headers["Content-Length"] || 0);
  if (Number.isFinite(len) && len > 0) return len;
  if (body == null) return 0;
  return Buffer.byteLength(typeof body === "string" ? body : JSON.stringify(body), "utf8");
}

export function checkBodySize(req) {
  const maxBytes = Number(process.env.AI_MAX_BODY_BYTES) || 8 * 1024 * 1024;
  const size = bodySizeBytes(req.body, req.headers || {});
  return {
    ok: size <= maxBytes,
    size,
    maxBytes,
  };
}
