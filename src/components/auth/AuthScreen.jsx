import React, { useState, useEffect } from "react";
import { Lock, AlertTriangle, Mail, Scale, FileSignature, BookOpen, FileSearch, ScanLine, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { STYLES, LogoMark } from "../../theme.jsx";

const FEATURES = [
  { icon: Scale, t: "Analisa Kasus AI" },
  { icon: FileSignature, t: "Smart Drafting" },
  { icon: BookOpen, t: "Riset Pasal" },
  { icon: FileSearch, t: "Review Kontrak AI" },
  { icon: ScanLine, t: "Pindai Dokumen" },
  { icon: ShieldCheck, t: "Conflict Check" },
];

export default function AuthScreen() {
  const { signIn, signUp, resetPassword, updatePassword } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const hash = window.location.hash || "";
    if (hash.includes("type=recovery") || hash.includes("type=magiclink")) {
      setMode("reset");
    }
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
      } else if (mode === "register") {
        if (!fullName.trim()) throw new Error("Nama lengkap wajib diisi.");
        if (password.length < 6) throw new Error("Password minimal 6 karakter.");
        const r = await signUp({ email, password, fullName, username });
        if (r.needsEmailConfirmation) {
          setSuccess("Cek email Anda untuk konfirmasi akun, lalu masuk.");
          setMode("login");
        }
      } else if (mode === "forgot") {
        await resetPassword(email);
        setSuccess("Link reset password dikirim ke email Anda.");
      } else if (mode === "reset") {
        if (password.length < 6) throw new Error("Password minimal 6 karakter.");
        if (password !== password2) throw new Error("Konfirmasi password tidak cocok.");
        await updatePassword(password);
        setSuccess("Password berhasil diubah. Silakan masuk.");
        window.history.replaceState(null, "", window.location.pathname);
        setMode("login");
      }
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusy(false);
    }
  };

  const tab = (m, label) => (
    <span
      className="chip"
      onClick={() => { setMode(m); setError(""); setSuccess(""); }}
      style={mode === m ? { borderColor: "rgba(31,179,126,0.5)", color: "var(--emerald-bright)" } : {}}
    >
      {label}
    </span>
  );

  return (
    <div className="knsl">
      <style>{STYLES}</style>
      <div className="login-screen">
        <div className="login-ambient" />
        <div className="login-card">
          <LogoMark size={72} />
          <h1 className="serif" style={{ fontSize: 38, fontWeight: 700, margin: "24px 0 0" }}>KNSL</h1>
          <div style={{ fontSize: 11, letterSpacing: "3.5px", color: "var(--champagne)", marginTop: 6, textTransform: "uppercase" }}>Legal Intelligence</div>
          <p style={{ fontSize: 14, color: "var(--silver)", marginTop: 16, lineHeight: 1.6, maxWidth: 360, marginInline: "auto" }}>
            {mode === "forgot" && "Masukkan email untuk menerima link reset password."}
            {mode === "reset" && "Atur password baru Anda."}
            {mode === "register" && "Buat akun — data tersimpan aman di cloud (Supabase)."}
            {(mode === "login" || !mode) && "Masuk dengan email & password — sesi tersimpan otomatis."}
          </p>

          {mode !== "forgot" && mode !== "reset" && (
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 24, flexWrap: "wrap" }}>
              {tab("login", "Masuk")}
              {tab("register", "Daftar")}
            </div>
          )}

          <form onSubmit={submit} style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            {mode === "register" && (
              <>
                <input className="field" placeholder="Nama Lengkap" value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ textAlign: "center" }} />
                <input className="field" placeholder="Username (opsional)" value={username} onChange={(e) => setUsername(e.target.value)} autoCapitalize="none" style={{ textAlign: "center" }} />
              </>
            )}
            {mode !== "reset" && (
              <input className="field" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoCapitalize="none" autoComplete="email" style={{ textAlign: "center" }} />
            )}
            {mode !== "forgot" && (
              <input className="field" type="password" placeholder={mode === "reset" ? "Password baru" : "Password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} style={{ textAlign: "center" }} />
            )}
            {mode === "reset" && (
              <input className="field" type="password" placeholder="Ulangi password baru" value={password2} onChange={(e) => setPassword2(e.target.value)} style={{ textAlign: "center" }} />
            )}

            {error && (
              <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(220,68,55,0.08)", border: "1px solid rgba(220,68,55,0.28)", fontSize: 13, color: "#ff9a8b", display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={14} />{error}
              </div>
            )}
            {success && (
              <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(31,179,126,0.08)", border: "1px solid rgba(31,179,126,0.28)", fontSize: 13, color: "var(--emerald-bright)", display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
                <CheckCircle2 size={14} />{success}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={busy} style={{ width: "100%" }}>
              <Lock size={16} />
              {mode === "login" && "Masuk"}
              {mode === "register" && "Daftar"}
              {mode === "forgot" && "Kirim Link Reset"}
              {mode === "reset" && "Simpan Password Baru"}
            </button>

            {mode === "login" && (
              <button type="button" className="btn-ghost" style={{ width: "100%", justifyContent: "center", fontSize: 13 }} onClick={() => { setMode("forgot"); setError(""); }}>
                <Mail size={14} /> Lupa password?
              </button>
            )}
            {(mode === "forgot" || mode === "reset") && (
              <button type="button" className="btn-ghost" style={{ width: "100%", justifyContent: "center", fontSize: 13 }} onClick={() => { setMode("login"); setError(""); }}>
                Kembali ke masuk
              </button>
            )}
          </form>

          <div className="login-features">
            {FEATURES.map((ft) => {
              const Icon = ft.icon;
              return (
                <div key={ft.t} className="login-feat">
                  <div style={{ width: 32, height: 32, borderRadius: 9, display: "grid", placeItems: "center", background: "rgba(19,133,92,0.10)", border: "1px solid rgba(31,179,126,0.2)" }}>
                    <Icon size={16} className="emerald-text" />
                  </div>
                  <span style={{ fontSize: 13, color: "var(--silver)", fontWeight: 500 }}>{ft.t}</span>
                </div>
              );
            })}
          </div>

          <div className="login-footer">
            <Lock size={12} /> Auth Supabase · sesi aman · data per akun di cloud
          </div>
        </div>
      </div>
    </div>
  );
}
