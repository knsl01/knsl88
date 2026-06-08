/** Normalize Indonesian phone numbers to E.164 (+62…) for Supabase Auth */

export function normalizePhoneId(input) {
  let s = String(input || "").replace(/[\s\-().]/g, "");
  if (!s) return "";
  if (s.startsWith("+")) return s;
  if (s.startsWith("0")) return "+62" + s.slice(1);
  if (s.startsWith("62")) return "+" + s;
  return "+62" + s;
}

export function validatePhoneId(input) {
  const normalized = normalizePhoneId(input);
  if (!normalized) return "Nomor telepon wajib diisi.";
  if (!/^\+62[0-9]{9,13}$/.test(normalized)) {
    return "Format nomor tidak valid. Contoh: 0812xxxxxxx atau +62812xxxxxxx";
  }
  return null;
}

export function formatPhoneDisplay(e164) {
  const s = String(e164 || "");
  if (s.startsWith("+62")) return "0" + s.slice(3);
  return s;
}
