const MAP = {
  "Invalid login credentials": "Email atau password salah. Periksa kembali atau reset password.",
  "Email not confirmed": "Email belum dikonfirmasi. Cek inbox (dan folder spam) untuk link aktivasi.",
  "User already registered": "Email sudah terdaftar. Silakan masuk atau gunakan lupa password.",
  "Password should be at least 6 characters": "Password minimal 6 karakter.",
  "Unable to validate email address: invalid format": "Format email tidak valid.",
  "Signup requires a valid password": "Password tidak memenuhi syarat keamanan.",
  "Email rate limit exceeded": "Terlalu banyak percobaan email. Tunggu 1 jam atau pasang Custom SMTP (Resend).",
  "For security purposes, you can only request this once every 60 seconds": "Tunggu 60 detik sebelum mencoba lagi.",
  "Invalid OTP": "Kode OTP salah atau sudah kedaluwarsa. Minta kode baru.",
  "Token has expired or is invalid": "Kode OTP kedaluwarsa. Kirim ulang kode.",
  "Phone number is invalid": "Nomor telepon tidak valid. Gunakan format Indonesia (+62).",
  "Signups not allowed for otp": "Login nomor telepon belum diaktifkan di Supabase. Hubungi admin.",
  "Unsupported phone provider": "SMS OTP belum dikonfigurasi di Supabase (Twilio/MessageBird).",
  "OAuth": "Login Google gagal. Pastikan provider Google aktif di Supabase.",
  "Error sending confirmation OTP": "Gagal kirim email konfirmasi. Cek SMTP Resend: domain verified, Username = resend, Password = API Key.",
  "Error sending confirmation email": "Gagal kirim email konfirmasi. Cek SMTP Resend: domain knsl.tech harus Verified, Username = resend.",
  "Error sending confirmation mail": "Gagal kirim email konfirmasi. Cek SMTP Resend: domain knsl.tech harus Verified, Username = resend.",
  "sms_send_failed": "Gagal kirim SMS via Twilio. Periksa kredensial di Supabase.",
  "over_email_send_rate_limit": "Terlalu banyak email. Tunggu 1 jam atau pasang Custom SMTP (Resend).",
  "over_sms_send_rate_limit": "Terlalu sering minta OTP. Tunggu 60 detik lalu coba lagi.",
  "over_request_rate_limit": "Terlalu banyak percobaan. Tunggu 1–2 menit.",
  "email_address_not_authorized": "Email tujuan belum diizinkan Resend. Verifikasi domain knsl.tech di Resend.",
  "email_address_invalid": "Alamat email tidak valid.",
  "unexpected_failure": "Gagal kirim email. Cek Supabase → Authentication → SMTP Settings (Resend).",
  "weak_password": "Password terlalu lemah. Gunakan kombinasi huruf, angka, dan simbol.",
};

function extractAuthErrorMessage(err) {
  if (!err) return "";
  if (typeof err === "string") return err;

  const parts = [
    err.message,
    err.msg,
    err.error_description,
    typeof err.error === "string" ? err.error : null,
  ].filter((p) => typeof p === "string" && p.trim());

  if (parts.length) return parts[0];

  if (Array.isArray(err.reasons) && err.reasons.length) {
    return `Password lemah: ${err.reasons.join(", ")}`;
  }

  return "";
}

export function formatAuthError(err) {
  if (!err) return "Terjadi kesalahan. Coba lagi.";

  const msg = extractAuthErrorMessage(err);
  const code = err.code || err.error_code || "";
  const lower = msg.toLowerCase();

  if (!msg || msg === "{}" || msg === "[object Object]") {
    if (code && MAP[code]) return MAP[code];
    if (code) {
      return `Gagal mendaftar (kode: ${code}). Cek email SMTP di Supabase atau daftar dengan Google.`;
    }
    return "Gagal mendaftar. Cek pengaturan email (SMTP Resend) di Supabase, atau gunakan Daftar dengan Google.";
  }

  if (lower.includes("trial") && (lower.includes("verified") || lower.includes("unverified"))) {
    return "Akun Twilio trial hanya bisa kirim SMS ke nomor yang sudah diverifikasi di Twilio.";
  }

  if (code && MAP[code]) return MAP[code];

  for (const [key, val] of Object.entries(MAP)) {
    if (msg.includes(key) || (code && String(code).includes(key))) return val;
  }

  if (code) return `${msg} (kode: ${code})`;
  return msg;
}
