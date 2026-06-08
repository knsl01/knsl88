const MAP = {
  "Invalid login credentials": "Email atau password salah. Periksa kembali atau reset password.",
  "Email not confirmed": "Email belum dikonfirmasi. Cek inbox (dan folder spam) untuk link aktivasi.",
  "User already registered": "Email sudah terdaftar. Silakan masuk atau gunakan lupa password.",
  "Password should be at least 6 characters": "Password minimal 6 karakter.",
  "Unable to validate email address: invalid format": "Format email tidak valid.",
  "Signup requires a valid password": "Password tidak memenuhi syarat keamanan.",
  "Email rate limit exceeded": "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.",
  "For security purposes, you can only request this once every 60 seconds": "Tunggu 60 detik sebelum meminta link reset lagi.",
};

export function formatAuthError(err) {
  if (!err) return "Terjadi kesalahan. Coba lagi.";
  const msg = err.message || String(err);
  for (const [key, val] of Object.entries(MAP)) {
    if (msg.includes(key)) return val;
  }
  return msg;
}
