const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email) {
  const v = (email || "").trim();
  if (!v) return "Email wajib diisi.";
  if (!EMAIL_RE.test(v)) return "Format email tidak valid.";
  return null;
}

export function validatePassword(password, { minLength = 8 } = {}) {
  const v = password || "";
  if (!v) return "Password wajib diisi.";
  if (v.length < minLength) return `Password minimal ${minLength} karakter.`;
  return null;
}

export function validatePasswordMatch(password, confirm) {
  if (password !== confirm) return "Konfirmasi password tidak cocok.";
  return null;
}

export function validateRequired(value, label) {
  if (!(value || "").trim()) return `${label} wajib diisi.`;
  return null;
}

export function passwordStrength(password) {
  const v = password || "";
  if (!v) return { score: 0, label: "" };
  let score = 0;
  if (v.length >= 8) score++;
  if (v.length >= 12) score++;
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
  if (/\d/.test(v)) score++;
  if (/[^A-Za-z0-9]/.test(v)) score++;
  if (score <= 2) return { score: 1, label: "Lemah" };
  if (score <= 3) return { score: 2, label: "Cukup" };
  return { score: 3, label: "Kuat" };
}
