import React, { useState, useEffect, useRef } from "react";
import { User, Mail, Building2, Phone, Lock, Save, LogOut, CheckCircle2, AlertTriangle, Camera } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { isSupabaseConfigured } from "../../lib/supabase.js";
import { getStoredUser, storeUser } from "../../lib/localAuth.js";
import { readImageFileAsDataUrl } from "../../lib/avatarImage.js";
import UserAvatar from "./UserAvatar.jsx";
import LanguageSwitcher from "../LanguageSwitcher.jsx";
import { useI18n } from "../../i18n/I18nContext.jsx";

export default function ProfilePanel({ onClose }) {
  const { t } = useI18n();
  const { user, profile, updateProfile, updatePassword, signOut, isSupabase } = useAuth();
  const [fullName, setFullName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [firmName, setFirmName] = useState(user?.firmName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [newPw, setNewPw] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const toastRef = useRef(null);

  useEffect(() => {
    setFullName(user?.name || "");
    setUsername(user?.username || "");
    setFirmName(user?.firmName || "");
    setPhone(user?.phone || "");
    setAvatarUrl(user?.avatarUrl || "");
  }, [user]);

  useEffect(() => {
    if (!msg && !err) return;
    toastRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    const timer = setTimeout(() => { setMsg(""); setErr(""); }, 5000);
    return () => clearTimeout(timer);
  }, [msg, err]);

  const onPickPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr("");
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      setAvatarUrl(dataUrl);
      setMsg(t("profile.photoPicked"));
    } catch (ex) {
      setErr(ex.message || t("profile.photoError"));
    }
  };

  const saveProfile = async () => {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      if (isSupabase) {
        await updateProfile({ fullName, username, firmName, phone, avatarUrl: avatarUrl || null });
      } else {
        const cur = getStoredUser();
        if (!cur) throw new Error(t("profile.notLoggedIn"));
        storeUser({
          ...cur,
          name: fullName.trim() || cur.name,
          username: (username || cur.username).toLowerCase(),
          firmName,
          phone,
          avatarUrl: avatarUrl || null,
        });
      }
      setMsg(t("profile.saved"));
    } catch (e) {
      setErr(e.message || t("profile.saveError"));
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = () => {
    setAvatarUrl("");
    setMsg(t("profile.photoRemoved"));
  };

  const changePassword = async () => {
    if (!isSupabaseConfigured) {
      setErr(t("profile.localPasswordNote"));
      return;
    }
    if (newPw.length < 6) {
      setErr(t("profile.passwordMin"));
      setMsg("");
      return;
    }
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      await updatePassword(newPw);
      setNewPw("");
      setMsg(t("profile.passwordSaved"));
    } catch (e) {
      setErr(e.message || t("profile.passwordChangeError"));
    } finally {
      setBusy(false);
    }
  };

  const previewUser = { name: fullName, username, avatarUrl };

  return (
    <div className="view-enter page scrollbar">
      <div className="glass rise" style={{ padding: 24, maxWidth: 520, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <User size={20} className="gold-text" />
          <h2 className="serif" style={{ margin: 0, fontSize: 22 }}>{t("profile.title")}</h2>
          {onClose && (
            <span className="chip" style={{ marginLeft: "auto" }} onClick={onClose}>{t("common.close")}</span>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <LanguageSwitcher />
        </div>

        <div ref={toastRef}>
          {msg && (
            <div className="profile-toast profile-toast-success" role="status" aria-live="polite">
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>{msg}</span>
            </div>
          )}
          {err && (
            <div className="profile-toast profile-toast-error" role="alert">
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <span>{err}</span>
            </div>
          )}
        </div>

        <div className="profile-avatar-block">
          <UserAvatar user={previewUser} size={88} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button type="button" className="btn-ghost" style={{ fontSize: 13 }} onClick={() => fileRef.current?.click()} disabled={busy}>
              <Camera size={15} /> {avatarUrl ? t("profile.changePhoto") : t("profile.uploadPhoto")}
            </button>
            {avatarUrl && (
              <button type="button" className="btn-ghost" style={{ fontSize: 13, color: "var(--muted)" }} onClick={removePhoto} disabled={busy}>
                {t("profile.removePhoto")}
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={onPickPhoto} />
          <p style={{ fontSize: 11, color: "var(--muted-2)", margin: 0 }}>{t("profile.photoHint")}</p>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <label style={{ fontSize: 12, color: "var(--muted)" }}><Mail size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />{t("profile.email")}</label>
          <input className="field" value={user?.email || ""} disabled />

          <label style={{ fontSize: 12, color: "var(--muted)" }}>{t("profile.fullName")}</label>
          <input className="field" value={fullName} onChange={(e) => setFullName(e.target.value)} />

          <label style={{ fontSize: 12, color: "var(--muted)" }}>{t("profile.username")}</label>
          <input className="field" value={username} onChange={(e) => setUsername(e.target.value)} autoCapitalize="none" />

          <label style={{ fontSize: 12, color: "var(--muted)" }}><Building2 size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />{t("profile.firm")}</label>
          <input className="field" value={firmName} onChange={(e) => setFirmName(e.target.value)} placeholder={t("common.optional")} />

          <label style={{ fontSize: 12, color: "var(--muted)" }}><Phone size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />{t("profile.phone")}</label>
          <input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("common.optional")} />

          <div style={{ fontSize: 11, color: "var(--muted-2)" }}>
            {t("profile.roleLabel")}: {profile?.role || user?.role || "reviewer"} · ID: {user?.id?.slice(0, 8)}…
          </div>

          <button className="btn-primary" onClick={saveProfile} disabled={busy} style={{ marginTop: 8 }}>
            <Save size={16} /> {t("profile.saveProfile")}
          </button>

          {isSupabase && (
            <>
              <div className="hairline" style={{ margin: "8px 0" }} />
              <label style={{ fontSize: 12, color: "var(--muted)" }}><Lock size={12} /> {t("profile.newPassword")}</label>
              <input className="field" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder={t("auth.passwordMin")} />
              <button className="btn-ghost" onClick={changePassword} disabled={busy || !newPw}>{t("profile.changePassword")}</button>
            </>
          )}

          <button className="btn-ghost" style={{ marginTop: 12, color: "#ff9a8b", borderColor: "rgba(220,68,55,0.3)" }} onClick={() => signOut()}>
            <LogOut size={16} /> {t("profile.logout")}
          </button>
        </div>
      </div>
    </div>
  );
}
