const MAP = {
  "Invalid login credentials": "Email atau password salah. Periksa kembali atau reset password.",
  "Email not confirmed": "Email belum dikonfirmasi. Cek inbox (dan folder spam) untuk link aktivasi.",
  "User already registered": "Email sudah terdaftar. Silakan masuk atau gunakan lupa password.",
  "Password should be at least 6 characters": "Password minimal 6 karakter.",
  "Unable to validate email address: invalid format": "Format email tidak valid.",
  "Signup requires a valid password": "Password tidak memenuhi syarat keamanan.",
  "Email rate limit exceeded": "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.",
  "For security purposes, you can only request this once every 60 seconds": "Tunggu 60 detik sebelum meminta link reset lagi.",
  "Invalid OTP": "Kode OTP salah atau sudah kedaluwarsa. Minta kode baru.",
  "Token has expired or is invalid": "Kode OTP kedaluwarsa. Kirim ulang kode.",
  "Phone number is invalid": "Nomor telepon tidak valid. Gunakan format Indonesia (+62).",
  "Signups not allowed for otp": "Login nomor telepon belum diaktifkan di Supabase. Hubungi admin.",
  "Unsupported phone provider": "SMS OTP belum dikonfigurasi di Supabase (Twilio/MessageBird).",
  "OAuth": "Login Google gagal. Pastikan provider Google aktif di Supabase.",
  "Error sending confirmation OTP": "Gagal kirim SMS. Cek Twilio trial: nomor harus diverifikasi dulu, dan Indonesia harus diaktifkan di Geo Permissions.",
  "sms_send_failed": "Gagal kirim SMS via Twilio. Periksa Account SID, Auth Token, dan Verify Service SID di Supabase.",
  "over_sms_send_rate_limit": "Terlalu sering minta OTP. Tunggu 60 detik lalu coba lagi.",
  "over_request_rate_limit": "Terlalu banyak percobaan. Tunggu 1–2 menit.",
  "21608": "Twilio: pengiriman ke Indonesia belum diizinkan. Twilio Console → Messaging → Geo permissions → aktifkan Indonesia.",
  "21211": "Nomor telepon tidak valid menurut Twilio. Pastikan format +62812…",
  "20003": "Kredensial Twilio salah. Cek Account SID & Auth Token di Supabase (tanpa spasi).",
  "21614": "Nomor tujuan bukan nomor mobile yang valid.",
  "60200": "Twilio Verify gagal. Pastikan SMS provider di Supabase = Twilio Verify (bukan Twilio biasa).",
  "Permission to send an SMS has not been enabled": "Twilio trial: verifikasi nomor HP Anda di Verified Caller IDs, atau aktifkan Geo Indonesia.",
  "21610": "Twilio trial: nomor tujuan belum diverifikasi. Tambahkan +62… di Verified Caller IDs.",
  "sms Provider could not be found": "Provider SMS di Supabase salah. Pilih Twilio Verify + isi Verify Service SID (VA…), lalu Save.",
  "twilio-verify could not be found": "Bug konfigurasi Supabase/Twilio Verify. Pastikan SMS provider = Twilio Verify (bukan Twilio biasa).",
};

export function formatAuthError(err) {
  if (!err) return "Terjadi kesalahan. Coba lagi.";
  const msg = err.message || String(err);
  const code = err.code || err.error_code || "";
  const lower = msg.toLowerCase();
  if (lower.includes("trial") && (lower.includes("verified") || lower.includes("unverified"))) {
    return "Akun Twilio trial hanya bisa kirim SMS ke nomor yang sudah diverifikasi di Twilio Console → Verified Caller IDs.";
  }
  if (code && MAP[code]) return MAP[code];
  for (const [key, val] of Object.entries(MAP)) {
    if (msg.includes(key) || (code && String(code).includes(key))) return val;
  }
  if (code) return `${msg} (kode: ${code})`;
  return msg;
}
