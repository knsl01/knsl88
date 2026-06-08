import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { query } from "./db.mjs";

function secretKey() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET wajib di-set (min 16 karakter) di production.");
    }
    return new TextEncoder().encode("knsl-dev-secret-change-me");
  }
  return new TextEncoder().encode(s);
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export async function signToken(user) {
  return new SignJWT({
    sub: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function verifyToken(token) {
  const { payload } = await jwtVerify(token, secretKey());
  return {
    id: payload.sub,
    username: payload.username,
    role: payload.role,
    name: payload.name,
  };
}

export function getBearer(req) {
  const h = req.headers.authorization || req.headers.Authorization || "";
  if (!h.startsWith("Bearer ")) return null;
  return h.slice(7).trim();
}

export async function requireUser(req) {
  const token = getBearer(req);
  if (!token) {
    const err = new Error("Login diperlukan.");
    err.status = 401;
    throw err;
  }
  try {
    return await verifyToken(token);
  } catch {
    const err = new Error("Sesi kedaluwarsa — login ulang.");
    err.status = 401;
    throw err;
  }
}

export async function findUserByUsername(username) {
  const r = await query("SELECT * FROM users WHERE username = $1", [username.toLowerCase()]);
  return r.rows[0] || null;
}

export async function findUserById(id) {
  const r = await query("SELECT id, username, name, role, email, created_at FROM users WHERE id = $1", [id]);
  return r.rows[0] || null;
}

export function publicUser(row) {
  return { id: row.id, username: row.username, name: row.name, role: row.role, email: row.email || null };
}
