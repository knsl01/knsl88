import React, { useState } from "react";
import { User, Mail, Building2, Phone, Lock, Save, LogOut } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.jsx";

export default function ProfilePanel({ onClose }) {
  const { user, profile, updateProfile, updatePassword, signOut } = useAuth();
  const [fullName, setFullName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [firmName, setFirmName] = useState(user?.firmName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [newPw, setNewPw] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const saveProfile = async () => {
    setBusy(true); setErr(""); setMsg("");
    try {
      await updateProfile({ fullName, username, firmName, phone });
      setMsg("Profil disimpan.");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async () => {
    if (newPw.length < 6) { setErr("Password minimal 6 karakter."); return; }
    setBusy(true); setErr(""); setMsg("");
    try {
      await updatePassword(newPw);
      setNewPw("");
      setMsg("Password diperbarui.");
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="view-enter page scrollbar">
      <div className="glass rise" style={{ padding: 24, maxWidth: 520, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <User size={20} className="gold-text" />
          <h2 className="serif" style={{ margin: 0, fontSize: 22 }}>Profil Akun</h2>
          {onClose && <span className="chip" style={{ marginLeft: "auto" }} onClick={onClose}>Tutup</span>}
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <label style={{ fontSize: 12, color: "var(--muted)" }}><Mail size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />Email</label>
          <input className="field" value={user?.email || ""} disabled />

          <label style={{ fontSize: 12, color: "var(--muted)" }}>Nama lengkap</label>
          <input className="field" value={fullName} onChange={(e) => setFullName(e.target.value)} />

          <label style={{ fontSize: 12, color: "var(--muted)" }}>Username</label>
          <input className="field" value={username} onChange={(e) => setUsername(e.target.value)} autoCapitalize="none" />

          <label style={{ fontSize: 12, color: "var(--muted)" }}><Building2 size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />Firma / Kantor</label>
          <input className="field" value={firmName} onChange={(e) => setFirmName(e.target.value)} placeholder="Opsional" />

          <label style={{ fontSize: 12, color: "var(--muted)" }}><Phone size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />Telepon</label>
          <input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Opsional" />

          <div style={{ fontSize: 11, color: "var(--muted-2)" }}>Role: {profile?.role || user?.role || "reviewer"} · ID: {user?.id?.slice(0, 8)}…</div>

          <button className="btn-primary" onClick={saveProfile} disabled={busy} style={{ marginTop: 8 }}>
            <Save size={16} /> Simpan Profil
          </button>

          <div className="hairline" style={{ margin: "8px 0" }} />
          <label style={{ fontSize: 12, color: "var(--muted)" }}><Lock size={12} /> Password baru</label>
          <input className="field" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Min. 6 karakter" />
          <button className="btn-ghost" onClick={changePassword} disabled={busy || !newPw}>Ubah Password</button>

          {msg && <p style={{ color: "var(--emerald-bright)", fontSize: 13, margin: 0 }}>{msg}</p>}
          {err && <p style={{ color: "#ff9a8b", fontSize: 13, margin: 0 }}>{err}</p>}

          <button className="btn-ghost" style={{ marginTop: 12, color: "#ff9a8b", borderColor: "rgba(220,68,55,0.3)" }} onClick={() => signOut()}>
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </div>
    </div>
  );
}
