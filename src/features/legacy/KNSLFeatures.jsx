import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard, Scale, FileSignature, BookOpen, ShieldCheck,
  Search, Bell, Menu, X, ChevronRight, Gavel, Clock, CalendarDays,
  TrendingUp, AlertTriangle, CheckCircle2, Sparkles, FileText,
  ArrowUpRight, Briefcase, Users, Activity, Settings, Zap, Info,
  FileSearch, Upload, ScanLine, ChevronDown, Download, Trash2, Lock, History, LogOut, User,
} from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  RadialBarChart, RadialBar, PolarAngleAxis,
} from "recharts";
import { CaseAnalysisAgent, ContractReviewAgent } from "../../services/ai/agent.js";
import AiProviderPicker from "../../components/AiProviderPicker.jsx";
import { getLastAiMeta, getLastAiError, getProviderLabel, formatAiError, getAiProvider } from "../../services/ai/providers.js";
import { checkBackend, login as apiLogin, register as apiRegister, getToken, saveCaseAnalysis, saveContractReview, clearToken } from "../../services/api/client.js";
import { STYLES, LogoMark } from "../../theme.jsx";
import { persistCaseAnalysis, persistContractReview } from "../../services/persistence.js";

/* ============================================================
   KNSL LEGAL INTELLIGENCE — v2 (responsive + pasal engine)
   Index hukum diekstraksi dari dokumen: KUHP, UU PT 40/2007, UUD 1945
   ============================================================ */

import PASAL from "../../data/statutes/pasal.json";
import {
  KUHP_MAP, classifyDomain, searchPasal, lawShort, lawSlug, lawColor,
  extractFacts, spotIssues, retrieveStatutes, testElements, auditPipeline,
  buildFromAI, aiRunPipeline, runPipeline, buildMemoHTML, memoDocHTML,
  DOMAINS, ACTIONS,
} from "../../legal-pipeline/engine.js";

const SCENARIOS = {
  "Pembunuhan (12 Apr)": "Pada Sabtu 12 April 2026 sekitar pukul 22.30 WIB, korban bernama Budi Santoso berada di warung kopi di Lowokwaru, Malang. Korban bertemu pelaku bernama Andi Pratama yang punya riwayat masalah utang piutang. Sekitar 23.00 terjadi adu mulut dan dilerai saksi, lalu pelaku meninggalkan tempat. Sekitar 30 menit kemudian saat korban pulang, pelaku diduga menghadang korban di jalan sepi dan terjadi perkelahian. Pelaku mengeluarkan pisau yang sebelumnya telah dibawa dan menusuk korban beberapa kali pada dada dan perut, lalu melarikan diri. Korban dibawa warga ke rumah sakit namun dinyatakan meninggal akibat luka tusuk. Keluarga melapor ke polisi dan berdasarkan saksi, rekaman CCTV, dan barang bukti, polisi menetapkan Andi Pratama sebagai tersangka pembunuhan.",
  "Penipuan / utang": "Pada 10 Januari 2026 terlapor bernama Rudi meminjam uang Rp 50 juta kepada korban dengan janji mengembalikan dalam satu bulan dan menandatangani surat perjanjian. Setelah jatuh tempo terlapor tidak membayar, lalu memberikan janji palsu berkali-kali dan akhirnya nomornya tidak bisa dihubungi. Korban memiliki bukti transfer dan perjanjian tertulis.",
  "Pencurian": "Pada malam hari pelaku mengambil sepeda motor milik korban yang terparkir di depan rumah tanpa izin, lalu membawa kabur kendaraan tersebut. Kejadian terekam CCTV tetangga.",
};


/* ---------- shared demo data ---------- */
const caseTrend = [{ m: "Jan", v: 18 }, { m: "Feb", v: 24 }, { m: "Mar", v: 22 }, { m: "Apr", v: 31 }, { m: "Mei", v: 28 }, { m: "Jun", v: 37 }];
const deadlines = [
  { t: "Memori Banding — PT Anugrah vs. Sinarmas", d: "Hari ini · 16:00", risk: "high" },
  { t: "Sidang Pembuktian — Perkara Pidana No. 442", d: "Besok · 09:30", risk: "med" },
  { t: "Review Kontrak Akuisisi Mandala Group", d: "5 Jun · 11:00", risk: "med" },
  { t: "Mediasi Sengketa Tanah — Klien Wijaya", d: "9 Jun · 14:00", risk: "low" },
];
const docket = [
  { id: "KNSL-2401", name: "PT Anugrah vs. Sinarmas Tbk", area: "Perdata Komersial", stage: "Banding", risk: "high", rate: 42 },
  { id: "KNSL-2389", name: "Akuisisi Aset Mandala Group", area: "Korporasi / M&A", stage: "Due Diligence", risk: "med", rate: 71 },
  { id: "KNSL-2377", name: "Negara vs. Hartono", area: "Pidana Khusus", stage: "Pembuktian", risk: "med", rate: 58 },
  { id: "KNSL-2350", name: "Sengketa Lahan — Wijaya", area: "Pertanahan", stage: "Mediasi", risk: "low", rate: 83 },
];
const Badge = ({ risk, children }) => <span className={`badge ${risk === "high" ? "badge-high" : risk === "med" ? "badge-med" : "badge-low"}`}>{children}</span>;
const riskLabel = (r) => (r === "high" ? "Tinggi" : r === "med" ? "Menengah" : "Rendah");

/* ---------- brand mark: scales-of-justice seal ---------- */

/* ---------- auth (local username/password) ---------- */

async function hashPW(pw) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pw + ":knsl-salt-2026"));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function getStoredUser() {
  try { const raw = localStorage.getItem("knsl:auth"); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

function storeUser(user) {
  localStorage.setItem("knsl:auth", JSON.stringify(user));
  if (typeof window !== "undefined") window.__KNSL_USER_ID__ = user.id;
}

function clearStoredUser() {
  localStorage.removeItem("knsl:auth");
  clearToken();
  if (typeof window !== "undefined") window.__KNSL_USER_ID__ = "";
}

function getAccounts() {
  try { return JSON.parse(localStorage.getItem("knsl:accounts") || "{}"); } catch { return {}; }
}

function saveAccount(username, data) {
  const accs = getAccounts();
  accs[username.toLowerCase()] = data;
  localStorage.setItem("knsl:accounts", JSON.stringify(accs));
}

function LoginScreen({ onLogin }) {
  const hasAccounts = Object.keys(getAccounts()).length > 0;
  const [mode, setMode] = useState(hasAccounts ? "login" : "register");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");
  const [serverMode, setServerMode] = useState(false);

  useEffect(() => { checkBackend().then(setServerMode); }, []);

  const doLogin = async () => {
    setError(""); setSuccess("");
    const u = username.trim().toLowerCase();
    const pw = password;
    if (!u || !pw) { setError("Isi username dan password."); return; }
    setBusy(true);
    try {
      if (await checkBackend()) {
        const { user } = await apiLogin(u, pw);
        storeUser(user);
        setBusy(false);
        onLogin(user);
        return;
      }
      const accs = getAccounts();
      const acc = accs[u];
      if (!acc) {
        setBusy(false);
        setError("Akun \"" + u + "\" tidak ditemukan di perangkat ini. Klik \"Daftar Baru\" untuk membuat akun.");
        return;
      }
      const h = await hashPW(pw);
      if (h !== acc.hash) { setBusy(false); setError("Password salah. Coba lagi."); return; }
      const user = { id: acc.id, name: acc.name, username: acc.username };
      storeUser(user);
      onLogin(user);
    } catch (e) { setBusy(false); setError("Terjadi kesalahan: " + e.message); }
  };

  const doRegister = async () => {
    setError(""); setSuccess("");
    if (!name.trim()) { setError("Isi nama lengkap."); return; }
    const u = username.trim().toLowerCase();
    if (!u || u.length < 3) { setError("Username minimal 3 karakter."); return; }
    if (/[^a-zA-Z0-9._-]/.test(u)) { setError("Username hanya boleh huruf, angka, titik, strip."); return; }
    if (!password || password.length < 6) { setError("Password minimal 6 karakter."); return; }
    setBusy(true);
    try {
      if (await checkBackend()) {
        const { user } = await apiRegister({ name: name.trim(), username: u, password });
        storeUser(user);
        setBusy(false);
        setSuccess("Akun server dibuat — data akan tersimpan di cloud.");
        onLogin(user);
        return;
      }
      const accs = getAccounts();
      if (accs[u]) {
        // Akun sudah ada → langsung coba login
        const h = await hashPW(password);
        if (h === accs[u].hash) {
          const user = { id: accs[u].id, name: accs[u].name, username: accs[u].username };
          storeUser(user);
          onLogin(user);
          return;
        }
        setBusy(false);
        setError("Username sudah terdaftar dengan password berbeda. Gunakan tab \"Masuk\" atau pilih username lain.");
        return;
      }
      const h = await hashPW(password);
      const id = "u_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
      const acc = { id, name: name.trim(), username: u, hash: h };
      saveAccount(u, acc);
      const user = { id, name: name.trim(), username: u };
      storeUser(user);
      onLogin(user);
    } catch (e) { setBusy(false); setError("Terjadi kesalahan: " + e.message); }
  };

  const submit = (e) => { e.preventDefault(); mode === "login" ? doLogin() : doRegister(); };

  const features = [
    { icon: Scale, t: "Analisa Kasus AI" },
    { icon: FileSignature, t: "Smart Drafting" },
    { icon: BookOpen, t: "Riset Pasal" },
    { icon: FileSearch, t: "Review Kontrak AI" },
    { icon: ScanLine, t: "Pindai Dokumen" },
    { icon: ShieldCheck, t: "Conflict Check" },
  ];

  return (
    <div className="knsl">
      <style>{STYLES}</style>
      <div className="login-screen">
        <div className="login-ambient" />
        <div className="login-card">
          <LogoMark size={72} />
          <h1 className="serif" style={{ fontSize: 38, fontWeight: 700, margin: "24px 0 0", letterSpacing: ".5px" }}>KNSL</h1>
          <div style={{ fontSize: 11, letterSpacing: "3.5px", color: "var(--champagne)", marginTop: 6, textTransform: "uppercase" }}>Legal Intelligence</div>
          <p style={{ fontSize: 15, color: "var(--silver)", marginTop: 16, lineHeight: 1.6, maxWidth: 340, margin: "16px auto 0" }}>
            Platform AI untuk praktisi hukum Indonesia — analisa kasus, drafting, riset pasal, dan review kontrak dalam satu sistem.
          </p>
          {serverMode && (
            <p style={{ fontSize: 12, color: "var(--emerald-bright)", marginTop: 12, padding: "8px 12px", borderRadius: 10, background: "rgba(31,179,126,0.08)", border: "1px solid rgba(31,179,126,0.25)" }}>
              ☁ Backend aktif — akun &amp; riwayat analisa tersimpan di server (PostgreSQL)
            </p>
          )}

          {/* tabs login / register */}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 28 }}>
            <span className="chip" onClick={() => { setMode("login"); setError(""); }} style={mode === "login" ? { borderColor: "rgba(31,179,126,0.5)", color: "var(--emerald-bright)" } : {}}>Masuk</span>
            <span className="chip" onClick={() => { setMode("register"); setError(""); }} style={mode === "register" ? { borderColor: "rgba(31,179,126,0.5)", color: "var(--emerald-bright)" } : {}}>Daftar Baru</span>
          </div>

          <form onSubmit={submit} style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            {mode === "register" && (
              <input className="field" placeholder="Nama Lengkap" value={name} onChange={(e) => setName(e.target.value)} style={{ textAlign: "center" }} />
            )}
            <input className="field" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoCapitalize="none" autoCorrect="off" style={{ textAlign: "center" }} />
            <input className="field" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ textAlign: "center" }} />

            {error && (
              <div className="view-enter" style={{ padding: "10px 16px", borderRadius: 12, background: "rgba(220,68,55,0.08)", border: "1px solid rgba(220,68,55,0.28)", fontSize: 13, color: "#ff9a8b", display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={14} style={{ flexShrink: 0 }} />{error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={busy} style={{ width: "100%", marginTop: 4 }}>
              <Lock size={16} />{mode === "login" ? "Masuk" : "Daftar & Masuk"}
            </button>
            {mode === "login" && (
              <div style={{ marginTop: 10, textAlign: "center" }}>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>Belum punya akun? </span>
                <span onClick={() => { setMode("register"); setError(""); }} style={{ fontSize: 13, color: "var(--emerald-bright)", cursor: "pointer", fontWeight: 600 }}>Daftar Baru</span>
              </div>
            )}
            {mode === "register" && (
              <div style={{ marginTop: 10, textAlign: "center" }}>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>Sudah punya akun? </span>
                <span onClick={() => { setMode("login"); setError(""); }} style={{ fontSize: 13, color: "var(--emerald-bright)", cursor: "pointer", fontWeight: 600 }}>Masuk</span>
              </div>
            )}
          </form>

          <div className="login-features">
            {features.map((ft) => {
              const Icon = ft.icon;
              return (
                <div key={ft.t} className="login-feat">
                  <div style={{ width: 32, height: 32, borderRadius: 9, display: "grid", placeItems: "center", background: "rgba(19,133,92,0.10)", border: "1px solid rgba(31,179,126,0.2)", flexShrink: 0 }}><Icon size={16} className="emerald-text" /></div>
                  <span style={{ fontSize: 13, color: "var(--silver)", fontWeight: 500 }}>{ft.t}</span>
                </div>
              );
            })}
          </div>

          <div className="login-footer">
            <Lock size={12} />Data tersimpan lokal di perangkat \u00b7 per-akun
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- dashboard ---------- */
function Metric({ icon: Icon, label, value, delta, suffix, i, editing, onChange }) {
  const inp = {
    width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(31,179,126,0.35)", borderRadius: 10, color: "var(--text)",
    padding: "8px 10px", fontFamily: "inherit", marginTop: 6, outline: "none",
  };
  return (
    <div className="glass glass-hover rise" style={{ padding: 22, animationDelay: `${i * 0.07}s` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, display: "grid", placeItems: "center", background: "rgba(19,133,92,0.12)", border: "1px solid rgba(31,179,126,0.2)" }}><Icon size={19} className="emerald-text" strokeWidth={1.8} /></div>
        {editing ? (
          <input value={delta} onChange={(e) => onChange("delta", e.target.value)} placeholder="cth: 4%" style={{ ...inp, width: 74, marginTop: 0, textAlign: "center", fontSize: 12 }} />
        ) : (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, color: "var(--emerald-bright)", fontWeight: 600 }}><ArrowUpRight size={13} />{delta}</span>
        )}
      </div>
      {editing ? (
        <>
          <input value={value} onChange={(e) => onChange("value", e.target.value)} inputMode="numeric" placeholder="Angka" style={{ ...inp, fontSize: 22, fontWeight: 700 }} />
          <input value={label} onChange={(e) => onChange("label", e.target.value)} placeholder="Label" style={{ ...inp, fontSize: 13 }} />
        </>
      ) : (
        <>
          <div className="gauge-num" style={{ fontSize: 30, fontWeight: 700, marginTop: 16, lineHeight: 1 }}>{value}<span style={{ fontSize: 15, color: "var(--muted)", fontWeight: 500 }}>{suffix}</span></div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 7 }}>{label}</div>
        </>
      )}
    </div>
  );
}
const DASH_DEFAULT = [
  { icon: Briefcase, label: "Kasus Aktif", value: "37", suffix: "", delta: "12%" },
  { icon: TrendingUp, label: "Rata-rata Win-Rate", value: "68", suffix: "%", delta: "4%" },
  { icon: Clock, label: "Tenggat Minggu Ini", value: "9", suffix: "", delta: "2" },
  { icon: Users, label: "Klien Korporat", value: "24", suffix: "", delta: "3" },
];

function Dashboard({ editing, setEditing }) {
  const [metrics, setMetrics] = useState(DASH_DEFAULT);
  const prevEditing = useRef(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (typeof window !== "undefined" && window.storage) {
          const r = await window.storage.get("dash:metrics");
          if (alive && r && r.value) {
            const saved = JSON.parse(r.value);
            setMetrics(DASH_DEFAULT.map((d, idx) => ({ ...d, ...(saved[idx] || {}), icon: d.icon })));
          }
        }
      } catch (e) { /* abaikan, pakai default */ }
    })();
    return () => { alive = false; };
  }, []);

  const update = (idx, field, val) =>
    setMetrics((ms) => ms.map((m, j) => (j === idx ? { ...m, [field]: val } : m)));

  const persist = async (data) => {
    try {
      if (typeof window !== "undefined" && window.storage) {
        const payload = data.map(({ label, value, suffix, delta }) => ({ label, value, suffix, delta }));
        await window.storage.set("dash:metrics", JSON.stringify(payload));
      }
    } catch (e) { /* abaikan */ }
  };

  // Simpan otomatis ketika keluar dari mode edit (transisi true -> false)
  useEffect(() => {
    if (prevEditing.current && !editing) persist(metrics);
    prevEditing.current = editing;
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetDefault = () => setMetrics(DASH_DEFAULT.map((d) => ({ ...d })));

  return (
    <div className="view-enter page scrollbar">
      {editing && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.4 }}>Mode edit — ubah angka, tekan ✓ di atas untuk simpan.</span>
          <button className="btn-ghost" onClick={resetDefault} style={{ fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <History size={14} /> Reset
          </button>
        </div>
      )}
      <div className="metric-grid">
        {metrics.map((m, idx) => (
          <Metric
            key={idx} i={idx} icon={m.icon} label={m.label} value={m.value}
            suffix={m.suffix} delta={m.delta} editing={editing}
            onChange={(field, val) => update(idx, field, val)}
          />
        ))}
      </div>
      <div className="two-col">
        <div className="glass glass-hover rise" style={{ padding: 24, animationDelay: ".25s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><h3 className="serif" style={{ fontSize: 19, margin: 0 }}>Analitik Perkara</h3><p style={{ fontSize: 12.5, color: "var(--muted)", margin: "4px 0 0" }}>Volume kasus · 6 bulan terakhir</p></div>
            <span className="badge badge-low"><Activity size={12} /> +37% YoY</span>
          </div>
          <div style={{ height: 210, marginTop: 18 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={caseTrend} margin={{ top: 8, right: 6, left: -22, bottom: 0 }}>
                <defs><linearGradient id="em" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1fb37e" stopOpacity={0.5} /><stop offset="100%" stopColor="#1fb37e" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(216,192,138,0.08)" vertical={false} />
                <XAxis dataKey="m" stroke="#5c6863" tickLine={false} axisLine={false} fontSize={12} /><YAxis stroke="#5c6863" tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip contentStyle={{ background: "#101413", border: "1px solid rgba(216,192,138,0.2)", borderRadius: 12, color: "#eef2ef", fontSize: 13 }} cursor={{ stroke: "rgba(216,192,138,0.2)" }} />
                <Area type="monotone" dataKey="v" stroke="#1fb37e" strokeWidth={2.5} fill="url(#em)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass glass-hover rise" style={{ padding: 24, animationDelay: ".32s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16 }}><CalendarDays size={18} className="gold-text" /><h3 className="serif" style={{ fontSize: 19, margin: 0 }}>Kalender Litigasi</h3></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {deadlines.map((d, i) => (
              <div key={i} className="clause-flag" style={{ borderColor: d.risk === "high" ? "#dc4437" : d.risk === "med" ? "#d8c08a" : "#1fb37e" }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.4 }}>{d.t}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}><Clock size={12} style={{ color: "var(--muted)" }} /><span style={{ fontSize: 12, color: "var(--muted)" }}>{d.d}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="glass rise" style={{ padding: 24, marginTop: 18, animationDelay: ".4s" }}>
        <h3 className="serif" style={{ fontSize: 19, margin: "0 0 16px" }}>Daftar Perkara Berjalan</h3>
        <div className="tablewrap scrollbar">
          <div className="docket-row" style={{ fontSize: 11, letterSpacing: "1px", color: "var(--muted-2)", textTransform: "uppercase", paddingBottom: 12 }}>
            <span>No.</span><span>Perkara</span><span>Bidang</span><span>Tahap</span><span>Win-Rate</span><span>Status</span>
          </div>
          <div className="hairline" />
          {docket.map((c) => (
            <div key={c.id} className="docket-row" style={{ padding: "14px 0", borderBottom: "1px solid rgba(216,192,138,0.06)" }}>
              <span className="gold-text" style={{ fontSize: 12.5, fontWeight: 600 }}>{c.id}</span>
              <span style={{ fontSize: 13.5, fontWeight: 500 }}>{c.name}</span>
              <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{c.area}</span>
              <span style={{ fontSize: 12.5, color: "var(--silver)" }}>{c.stage}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, height: 5, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}><div style={{ width: `${c.rate}%`, height: "100%", background: c.rate > 65 ? "linear-gradient(90deg,#13855c,#1fb37e)" : c.rate > 50 ? "linear-gradient(90deg,#b89a52,#d8c08a)" : "linear-gradient(90deg,#a83b30,#dc4437)" }} /></div>
                <span className="gauge-num" style={{ fontSize: 12.5, fontWeight: 600 }}>{c.rate}%</span>
              </div>
              <Badge risk={c.risk}>{riskLabel(c.risk)}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- pasal card (klik untuk lihat isi penuh) ---------- */
function PasalCard({ e, i }) {
  const [open, setOpen] = useState(false);
  const newP = e.l === "KUHP" ? KUHP_MAP[e.p] : null;
  return (
    <div className="recommend-card glass" style={{ padding: 16, animationDelay: `${i * 0.04}s` }} onClick={() => setOpen((o) => !o)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 7 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
          <span className="badge" style={{ color: lawColor(e.l), background: "rgba(255,255,255,0.04)", borderColor: lawColor(e.l) + "55" }}>{lawShort(e.l)}</span>
          <span className="gold-text serif" style={{ fontSize: 17, fontWeight: 700 }}>Pasal {e.p}</span>
          {newP && <span className="badge" style={{ color: "#8fb6d6", background: "rgba(143,182,214,0.08)", borderColor: "rgba(143,182,214,0.3)" }}>KUHP 2023: Ps. {newP}</span>}
        </div>
        {e.rel != null && <span style={{ fontSize: 11.5, color: "var(--emerald-bright)", fontWeight: 600, whiteSpace: "nowrap" }}>{e.rel}% relevan</span>}
      </div>
      {e.b && <div style={{ fontSize: 11.5, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 7 }}>{e.b}</div>}
      <p className={open ? "" : "pasal-text"} style={{ fontSize: 13, color: "var(--silver)", margin: 0, lineHeight: 1.6 }}>{e.t}</p>
      {open && newP && (
        <div className="glass" style={{ marginTop: 12, padding: 12, background: "rgba(143,182,214,0.05)", borderColor: "rgba(143,182,214,0.2)" }}>
          <div style={{ fontSize: 11.5, color: "#8fb6d6", fontWeight: 600, marginBottom: 4 }}>PADANAN KUHP BARU (UU 1/2023)</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.5 }}>Ketentuan ini setara dengan <b className="gold-text">Pasal {newP} UU No. 1 Tahun 2023</b> yang berlaku menggantikan KUHP lama. Periksa rumusan & ancaman pidana pada teks resmi.</div>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 9, fontSize: 12, color: "var(--muted-2)" }}>
        <ChevronRight size={13} style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .3s" }} />
        {open ? "Tutup" : "Lihat isi pasal lengkap"}
      </div>
    </div>
  );
}

/* ---------- legal analysis engine ---------- */
function StageChip({ label, color }) {
  return <span className="badge" style={{ color, background: color + "16", borderColor: color + "44" }}>{label}</span>;
}

function Analysis({ seed }) {
  const [q, setQ] = useState(SCENARIOS["Pembunuhan (12 Apr)"]);
  const [filter, setFilter] = useState("all");
  const [tab, setTab] = useState("facts");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showGuards, setShowGuards] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiWanted, setAiWanted] = useState(false);

  const doRun = async (input, flt) => {
    if (!input || !input.trim()) return;
    setLoading(true); setAiBusy(false); setAiWanted(useAI);
    await new Promise((r) => setTimeout(r, 250));
    if (useAI) {
      setAiBusy(true);
      try {
        const r = await aiRunPipeline(input, flt);
        setData(r); setLoading(false); setTab("facts");
        persistCaseAnalysis({ title: input.slice(0, 100), lawFilter: flt, source: r.source, aiStatus: r.aiStatus, payload: r });
      }
      catch (e) {
        const heur = runPipeline(input, flt);
        heur.source = "heuristic"; heur.aiStatus = "error"; heur.aiError = String(e.message || e);
        setData(heur); setLoading(false); setTab("facts");
      }
      setAiBusy(false);
    } else {
      const heur = runPipeline(input, flt);
      heur.source = "heuristic"; heur.aiStatus = "off";
      setData(heur); setLoading(false); setTab("facts");
      persistCaseAnalysis({ title: input.slice(0, 100), lawFilter: flt, source: "heuristic", aiStatus: "off", payload: heur });
    }
  };
  const run = (text) => { doRun(text != null ? text : q, filter); };
  useEffect(() => { if (seed && seed.q) { setQ(seed.q); doRun(seed.q, "all"); } }, [seed]);

  const cls = useMemo(() => {
    if (!data) return null;
    return classifyDomain({ results: data.rs.retrieved.map((r) => ({ l: r.law })), outside: data.rs.outside });
  }, [data]);

  const catColor = (c) => (c === "criminal" ? "#ff9a8b" : c === "civil" ? "#8fb6d6" : c === "corporate" ? "#d8c08a" : "#9fd6bf");
  const tabs = [["facts", "Fakta"], ["issues", "Isu"], ["statutes", "Pasal"], ["elements", "Uji Unsur"], ["conclusion", "Kesimpulan"]];

  const exportMemo = (mode) => {
    if (!data) return;
    const html = memoDocHTML(buildMemoHTML(data, cls));
    if (mode === "word") {
      const blob = new Blob(["\ufeff" + html], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "Memo_Analisa_Hukum.doc";
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } else {
      const ifr = document.createElement("iframe");
      ifr.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
      document.body.appendChild(ifr);
      const doc = ifr.contentWindow.document; doc.open(); doc.write(html); doc.close();
      setTimeout(() => { try { ifr.contentWindow.focus(); ifr.contentWindow.print(); } catch (e) {} setTimeout(() => ifr.remove(), 1500); }, 350);
    }
  };

  return (
    <div className="view-enter page scrollbar">
      <div className="analysis-grid">
        {/* input */}
        <div className="glass rise" style={{ padding: 22, height: "fit-content" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}><Scale size={18} className="gold-text" /><h3 className="serif" style={{ fontSize: 19, margin: 0 }}>Input Kronologi</h3></div>
          <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 14px", lineHeight: 1.5 }}>Tempel kronologi perkara. Engine menjalankan 4 tahap: <span className="emerald-text">Fakta → Isu → Pasal → Uji Unsur</span>.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <select className="field" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Semua Sumber Hukum</option><option value="pidana">Pidana — KUHP</option><option value="korporasi">Korporasi — UU PT</option><option value="tata">Tata Negara — UUD 1945</option><option value="pailit">Kepailitan & PKPU — UU 37/2004</option><option value="siber">Siber / ITE</option><option value="niaga">Niaga — Arbitrase & P2SK</option><option value="acara">Hukum Acara — KUHAP & Rv</option>
            </select>
            <textarea className="field" rows={9} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tempel kronologi lengkap di sini..." />
            <button className="btn-primary" onClick={() => run()} disabled={loading}>{loading ? <><Activity size={16} /> Menjalankan pipeline...</> : <><Zap size={16} /> Jalankan Analisa</>}</button>
            <label style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", fontSize: 12.5, color: "var(--silver)", marginTop: -2 }}>
              <input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} style={{ accentColor: "#1fb37e", width: 15, height: 15 }} />
              <Sparkles size={13} className="gold-text" /> Agen AI (Fakta, Isu &amp; rerank Pasal) — uji unsur tetap deterministik
            </label>
            {useAI && <AiProviderPicker compact />}
            <div>
              <div style={{ fontSize: 11.5, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 9 }}>Skenario contoh</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {Object.keys(SCENARIOS).map((k) => <span key={k} className="chip" onClick={() => { setQ(SCENARIOS[k]); run(SCENARIOS[k]); }}>{k}</span>)}
              </div>
            </div>
          </div>
        </div>

        {/* results */}
        <div className="glass rise" style={{ padding: 22, animationDelay: ".1s", minHeight: 460 }}>
          {!data ? (
            <div style={{ display: "grid", placeItems: "center", height: 380, textAlign: "center", color: "var(--muted)" }}>
              <div><div style={{ width: 56, height: 56, borderRadius: 16, display: "grid", placeItems: "center", margin: "0 auto 16px", background: "rgba(19,133,92,0.1)", border: "1px solid rgba(31,179,126,0.2)" }}><Sparkles size={24} className="emerald-text" /></div><p style={{ fontSize: 14, maxWidth: 300 }}>Tempel kronologi lalu jalankan — hasil tiap tahap muncul di sini.</p></div>
            </div>
          ) : (
            <div className="view-enter">
              {(aiBusy || aiWanted || data.aiStatus) && (
                <div style={{
                  marginBottom: 12, padding: "10px 12px", borderRadius: 9, fontSize: 12, color: "var(--silver)", lineHeight: 1.5,
                  background: aiBusy ? "rgba(216,192,138,0.07)" : data.aiStatus === "ai" ? "rgba(31,179,126,0.08)" : data.aiStatus === "error" ? "rgba(220,68,55,0.08)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${aiBusy ? "rgba(216,192,138,0.25)" : data.aiStatus === "ai" ? "rgba(31,179,126,0.28)" : data.aiStatus === "error" ? "rgba(220,68,55,0.28)" : "var(--line)"}`,
                }}>
                  {aiBusy ? (
                    <><Activity size={13} className="gold-text" style={{ verticalAlign: "middle", marginRight: 6 }} />Memanggil agen AI…</>
                  ) : data.aiStatus === "ai" ? (
                    <>
                      <Sparkles size={13} className="emerald-text" style={{ verticalAlign: "middle", marginRight: 6 }} />
                      <b className="emerald-text">Agen AI aktif</b>
                      {getLastAiMeta() ? ` (${getProviderLabel(getLastAiMeta().provider)} · ${getLastAiMeta().model})` : ""}
                      {data.heurCompare ? ` · Fakta ${data.heurCompare.facts}→${data.fm.facts.length}, Isu ${data.heurCompare.issues}→${data.is.issues.length}` : ""}
                      {data.rsAiReranked ? " · Pasal di-rerank AI" : ""}
                      {" · "}Invarian {data.audit.passed}/{data.audit.total}
                    </>
                  ) : data.aiStatus === "error" ? (
                    <><AlertTriangle size={13} style={{ color: "#ff9a8b", verticalAlign: "middle", marginRight: 6 }} />{formatAiError(data.aiError || getLastAiError(), getAiProvider())} <span style={{ color: "var(--muted)" }}>(hasil heuristik ditampilkan)</span></>
                  ) : data.aiStatus === "fallback" ? (
                    <><Info size={13} className="gold-text" style={{ verticalAlign: "middle", marginRight: 6 }} />{data.aiNote || "AI tidak meningkatkan hasil — pakai heuristik."}</>
                  ) : data.aiStatus === "off" ? (
                    <><ShieldCheck size={13} className="gold-text" style={{ verticalAlign: "middle", marginRight: 6 }} />Heuristik saja (AI dimatikan) · Invarian {data.audit.passed}/{data.audit.total}</>
                  ) : (
                    <><ShieldCheck size={13} className="gold-text" style={{ verticalAlign: "middle", marginRight: 6 }} />Heuristik · Invarian {data.audit.passed}/{data.audit.total}</>
                  )}
                </div>
              )}
              {/* summary strip */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12.5, color: "var(--muted)" }}>
                  <span><b className="emerald-text">{data.fm.facts.length}</b> fakta</span>
                  <span><b className="emerald-text">{data.is.issues.length}</b> isu</span>
                  <span><b className="emerald-text">{data.rs.retrieved.length}</b> pasal</span>
                  <span><b className="emerald-text">{data.etr.tests.length}</b> unsur</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <button className="chip" onClick={() => exportMemo("word")} title="Unduh memo analisa (Word)" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><FileText size={12} /> Memo Word</button>
                  <button className="chip" onClick={() => exportMemo("pdf")} title="Cetak / simpan PDF" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><FileSignature size={12} /> Memo PDF</button>
                  <span className="badge" onClick={() => setShowGuards((s) => !s)} title="Lihat audit invarian" style={{ cursor: "pointer", color: data.audit.passed === data.audit.total ? "#1fb37e" : "#ff9a8b", background: (data.audit.passed === data.audit.total ? "#1fb37e" : "#ff9a8b") + "16", borderColor: (data.audit.passed === data.audit.total ? "#1fb37e" : "#ff9a8b") + "44" }}><CheckCircle2 size={12} /> Invarian {data.audit.passed}/{data.audit.total}</span>
                </div>
              </div>
              {cls && <div style={{ marginBottom: 16 }}><StageChip label={`Klasifikasi: ${cls.label}`} color={cls.color} /></div>}

              {showGuards && (
                <div className="glass view-enter" style={{ padding: 15, marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 11, flexWrap: "wrap" }}>
                    <ShieldCheck size={15} className="emerald-text" />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Audit Invarian Pipeline</span>
                    <span style={{ fontSize: 10.5, color: "var(--muted-2)" }}>— ported dari legalPipeline.validators · {data.audit.passed}/{data.audit.total} lulus</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {data.audit.checks.map((c, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 12 }}>
                        {c.ok
                          ? <CheckCircle2 size={13} style={{ color: "#1fb37e", flexShrink: 0, marginTop: 2 }} />
                          : <AlertTriangle size={13} style={{ color: "#ff9a8b", flexShrink: 0, marginTop: 2 }} />}
                        <span style={{ flex: 1, color: "var(--silver)" }}>{c.label}{!c.ok && c.detail ? <span style={{ color: "#ff9a8b" }}> — {c.detail}</span> : null}</span>
                        <span className="gauge-num" style={{ fontSize: 9.5, color: "var(--muted-2)", flexShrink: 0, marginTop: 1 }}>{c.code}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* tabs */}
              <div style={{ display: "flex", gap: 22, borderBottom: "1px solid var(--line)", paddingBottom: 9, marginBottom: 18, overflowX: "auto" }} className="scrollbar">
                {tabs.map(([id, lb]) => <div key={id} className={`tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>{lb}</div>)}
              </div>

              {tab === "facts" && (
                <div>
                  <div style={{ fontSize: 11.5, letterSpacing: "1px", color: "var(--muted-2)", textTransform: "uppercase", marginBottom: 10 }}>Stage 1 · Fact Matrix</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {data.fm.facts.map((f) => (
                      <div key={f.id} className="glass" style={{ padding: "11px 13px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <span className="gold-text gauge-num" style={{ fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{f.id}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: "var(--silver)", lineHeight: 1.45 }}>{f.statement}</div>
                          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                            <span className="pill" style={{ fontSize: 10.5, color: "var(--muted)", background: "rgba(255,255,255,0.04)", padding: "2px 8px", borderRadius: 6 }}>{f.category}</span>
                            <span className="pill" style={{ fontSize: 10.5, color: certColor(f.certainty), background: certColor(f.certainty) + "14", padding: "2px 8px", borderRadius: 6 }}>{f.certainty}</span>
                            {f.externalLabel && <span className="pill" style={{ fontSize: 10.5, color: "#ff9a8b", background: "rgba(220,68,55,0.1)", padding: "2px 8px", borderRadius: 6 }}>external label</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11.5, letterSpacing: "1px", color: "var(--muted-2)", textTransform: "uppercase", margin: "16px 0 10px" }}>Missing Facts</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {data.fm.missingFacts.map((m) => (
                      <div key={m.id} style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 12.5, color: "var(--muted)" }}><Info size={13} className="gold-text" style={{ flexShrink: 0, marginTop: 2 }} /><span>{m.description} <span style={{ color: "var(--muted-2)" }}>({m.category})</span></span></div>
                    ))}
                  </div>
                </div>
              )}

              {tab === "issues" && (
                <div>
                  <div style={{ fontSize: 11.5, letterSpacing: "1px", color: "var(--muted-2)", textTransform: "uppercase", marginBottom: 10 }}>Stage 2 · Issue Spotting</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {data.is.issues.map((it) => (
                      <div key={it.id} className="glass" style={{ padding: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                          <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
                            <span className="badge" style={{ textTransform: "uppercase", color: catColor(it.category), background: "rgba(255,255,255,0.04)", borderColor: "var(--line)" }}>{it.category}</span>
                            <span className="pill" style={{ fontSize: 10.5, color: certColor(it.derivedCertainty), background: certColor(it.derivedCertainty) + "14", padding: "2px 8px", borderRadius: 6 }}>{it.derivedCertainty}</span>
                          </div>
                          <span className="pill" style={{ color: confColor(it.confidence), background: confColor(it.confidence) + "16", padding: "3px 9px", borderRadius: 7, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{it.confidence}</span>
                        </div>
                        <div style={{ fontSize: 13.5, color: "var(--silver)", margin: "8px 0 4px", lineHeight: 1.45 }}>{it.statement}</div>
                        <div style={{ fontSize: 10.5, color: "var(--muted-2)" }}>↳ {it.factIds.join(", ")}</div>
                      </div>
                    ))}
                  </div>
                  {data.is.emptyCategories.map((c) => (
                    <div key={c} style={{ fontSize: 12, color: "var(--muted-2)", marginTop: 10 }}>No relevant <b style={{ textTransform: "capitalize" }}>{c}</b> issues identified.</div>
                  ))}
                </div>
              )}

              {tab === "statutes" && (
                <div>
                  <div style={{ fontSize: 11.5, letterSpacing: "1px", color: "var(--muted-2)", textTransform: "uppercase", marginBottom: 10 }}>Stage 3 · Statute Retrieval</div>
                  {data.rs.retrieved.length === 0 && <p style={{ fontSize: 13, color: "var(--muted)" }}>Tidak ada pasal relevan ditemukan.</p>}
                  <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                    {data.rs.retrieved.map((r, i) => <PasalCard key={r.id} e={{ l: r.law, p: r.article, b: r.b, t: r.text, rel: r.rel }} i={i} />)}
                  </div>
                  {data.rs.outside.length > 0 && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 12 }}>Di luar index: {data.rs.outside.map((o) => o.v).join(" · ")}</div>}
                </div>
              )}

              {tab === "elements" && (
                <div>
                  <div style={{ fontSize: 11.5, letterSpacing: "1px", color: "var(--muted-2)", textTransform: "uppercase", marginBottom: 10 }}>Stage 4 · Element Testing <span style={{ textTransform: "none" }}>— tanpa vonis</span></div>
                  {data.etr.tests.length === 0 && <p style={{ fontSize: 13, color: "var(--muted)" }}>Belum ada unsur terdefinisi untuk pasal yang diretrieve.</p>}
                  {data.rs.retrieved.filter((s) => data.etr.tests.some((t) => t.article === s.article)).map((s) => (
                    <div key={s.id} style={{ marginBottom: 14 }}>
                      <div className="gold-text serif" style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Pasal {s.article}{s.modernEquivalent ? ` → KUHP 2023 Ps. ${s.modernEquivalent}` : ""}</div>
                      {data.etr.tests.filter((t) => t.article === s.article).map((t) => (
                        <div key={t.id} style={{ padding: "9px 0", borderBottom: "1px solid rgba(216,192,138,0.06)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ flex: 1, fontSize: 13, color: "var(--silver)" }}>{t.element}</span>
                            <span className="pill" style={{ fontSize: 10.5, color: certColor(t.derivedCertainty), background: certColor(t.derivedCertainty) + "14", padding: "2px 8px", borderRadius: 6, flexShrink: 0 }}>{t.derivedCertainty}</span>
                            <span className="pill" style={{ fontSize: 11, fontWeight: 600, color: statusColor(t.status), background: statusColor(t.status) + "18", padding: "3px 10px", borderRadius: 7, flexShrink: 0, minWidth: 120, textAlign: "center", justifyContent: "center" }}>{t.status}</span>
                          </div>
                          <div style={{ fontSize: 10.5, color: "var(--muted-2)", marginTop: 5, lineHeight: 1.5 }}>
                            {t.supportingFactIds.length
                              ? <span>↳ dukung: <span className="emerald-text gauge-num">{t.supportingFactIds.join(", ")}</span></span>
                              : <span style={{ color: "var(--muted-2)" }}>↳ belum ada fakta pendukung</span>}
                            {t.contradictingFactIds.length ? <span> · kontra: <span className="gauge-num" style={{ color: "#ff9a8b" }}>{t.contradictingFactIds.join(", ")}</span></span> : null}
                            {t.missingFactIds && t.missingFactIds.length ? <span> · hilang: <span className="gauge-num gold-text">{t.missingFactIds.join(", ")}</span></span> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {tab === "conclusion" && cls && (() => {
                const score = Math.min(95, 40 + data.rs.retrieved.length * 4 + data.is.issues.length * 3);
                return (
                  <div>
                    <div className="glass" style={{ padding: 16, marginBottom: 16, borderLeft: `3px solid ${cls.color}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                        <span style={{ fontSize: 11, letterSpacing: "1.5px", color: "var(--muted-2)", textTransform: "uppercase" }}>Klasifikasi Perkara</span>
                        <span className="badge" style={{ color: cls.color, background: cls.color + "14", borderColor: cls.color + "55", fontSize: 12.5 }}>{cls.label}</span>
                      </div>
                      <p style={{ fontSize: 13, color: "var(--silver)", margin: "0 0 8px", lineHeight: 1.55 }}>{cls.desc}</p>
                      <div style={{ fontSize: 12.5, color: "var(--muted)" }}><b className="gold-text">Alur proses: </b>{cls.proses}</div>
                    </div>
                    <div style={{ marginBottom: 18 }}>
                      <h4 className="serif" style={{ fontSize: 18, margin: "0 0 11px" }}>Langkah yang Sebaiknya Ditempuh</h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                        {cls.actions.map((a, k) => (
                          <div key={k} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                            <div style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, display: "grid", placeItems: "center", background: "rgba(19,133,92,0.14)", border: "1px solid rgba(31,179,126,0.3)", fontSize: 12, fontWeight: 700, color: "var(--emerald-bright)", marginTop: 1 }}>{k + 1}</div>
                            <span style={{ fontSize: 13.5, color: "var(--silver)", lineHeight: 1.5 }}>{a}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="hairline" style={{ margin: "0 0 18px" }} />
                    <div style={{ display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ position: "relative", height: 150, width: 150 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <RadialBarChart innerRadius="74%" outerRadius="100%" data={[{ v: score, fill: "#1fb37e" }]} startAngle={90} endAngle={-270}><PolarAngleAxis type="number" domain={[0, 100]} tick={false} /><RadialBar background={{ fill: "rgba(255,255,255,0.05)" }} dataKey="v" cornerRadius={20} /></RadialBarChart>
                        </ResponsiveContainer>
                        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}><div style={{ textAlign: "center" }}><div className="gauge-num emerald-text" style={{ fontSize: 30, fontWeight: 700 }}>{score}%</div><div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "1px" }}>KEKUATAN DASAR HUKUM</div></div></div>
                      </div>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <h4 className="serif" style={{ fontSize: 17, margin: "0 0 10px" }}>Matriks Risiko</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                          {[["Dukungan Dasar Hukum", data.rs.retrieved.length >= 4 ? "Kuat" : data.rs.retrieved.length >= 1 ? "Cukup" : "Lemah", data.rs.retrieved.length >= 4 ? "low" : data.rs.retrieved.length >= 1 ? "med" : "high"], ["Kejelasan Unsur", data.etr.tests.some((t) => t.status === "Strong support") ? "Sebagian kuat" : "Menengah", "med"], ["Eksposur Liabilitas", "Perlu Kajian", "med"]].map(([l, v, r]) => (
                            <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13.5 }}><span style={{ color: "var(--silver)" }}>{l}</span><Badge risk={r}>{v}</Badge></div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="glass" style={{ padding: 14, marginTop: 16, background: "linear-gradient(150deg,rgba(216,192,138,0.06),transparent)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><Info size={15} className="gold-text" /><span style={{ fontSize: 13.5, fontWeight: 600 }}>Catatan</span></div>
                      <p style={{ fontSize: 12.5, color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>Hasil indikatif dari engine deterministik (heuristik), bukan vonis dan bukan pengganti pertimbangan advokat. Penalaran naratif penuh memerlukan layer AI tersambung backend.</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- legal research ---------- */
function Research({ seed }) {
  const [q, setQ] = useState(seed && seed.q ? seed.q : "penggelapan");
  const [filter, setFilter] = useState("all");
  const [res, setRes] = useState(() => searchPasal(q, "all"));
  const run = (query, f) => { const t = query != null ? query : q; setRes(searchPasal(t, f != null ? f : filter)); };
  useEffect(() => { if (seed && seed.q) { setQ(seed.q); setRes(searchPasal(seed.q, "all")); } }, [seed]);
  const filters = [["all", "Semua"], ["pidana", "KUHP"], ["korporasi", "UU PT"], ["tata", "UUD 1945"], ["pailit", "Pailit/PKPU"], ["siber", "ITE"], ["niaga", "Arbitrase/P2SK"], ["acara", "KUHAP/Rv"]];
  return (
    <div className="view-enter page scrollbar">
      <div className="glass rise" style={{ padding: 20, marginBottom: 18 }}>
        <div className="glass" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
          <Search size={20} className="gold-text" />
          <input className="field" style={{ border: "none", background: "transparent", padding: 0, fontSize: 15 }} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(); }} placeholder="Cari pasal / undang-undang..." />
          <button className="btn-primary" style={{ padding: "9px 18px" }} onClick={() => run()}>Cari</button>
        </div>
        <div style={{ display: "flex", gap: 9, marginTop: 14, flexWrap: "wrap" }}>
          {filters.map(([id, lb]) => <button key={id} className="btn-ghost" style={id === filter ? { borderColor: "rgba(31,179,126,0.4)", color: "var(--emerald-bright)" } : {}} onClick={() => { setFilter(id); run(null, id); }}>{lb}</button>)}
        </div>
      </div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>Menampilkan <span className="gold-text">{res.length}</span> pasal · diurutkan berdasarkan relevansi kontekstual</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {res.map((e, i) => <PasalCard key={e.l + e.p} e={e} i={i} />)}
        {res.length === 0 && <p style={{ fontSize: 13, color: "var(--muted)" }}>Tidak ada hasil. Coba kata kunci lain.</p>}
      </div>
    </div>
  );
}

/* ===================== SMART DRAFTING — 11 document generators ===================== */
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const idToday = () => { const d = new Date(); const b = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"]; return `${d.getDate()} ${b[d.getMonth()]} ${d.getFullYear()}`; };
const _lines = (s) => String(s == null ? "" : s).split(/\n+/).map((x) => x.trim()).filter(Boolean);
const _ol = (s) => `<ol>${_lines(s).map((x) => `<li style="margin-bottom:5px">${esc(x)}</li>`).join("")}</ol>`;
const _ps = (s) => _lines(s).map((x) => `<p>${esc(x)}</p>`).join("");
const _row = (l, v) => `<tr><td style="width:160px">${esc(l)}</td><td style="width:12px">:</td><td>${esc(v)}</td></tr>`;
const _psl = (n, t) => `<p class="psl">PASAL ${esc(n)}</p><p class="pslt">${esc(t)}</p>`;
const sign2 = (o) => `<table style="width:100%;margin-top:26px;text-align:center;border-collapse:collapse"><tr><td style="width:50%">${esc(o.ll)}</td><td style="width:50%">${esc(o.rl)}</td></tr><tr><td style="height:88px;vertical-align:bottom">${o.lm ? "Meterai<br>Rp10.000<br>" : ""}<b><u>${esc(o.ln)}</u></b>${o.ls ? `<br>${esc(o.ls)}` : ""}</td><td style="height:88px;vertical-align:bottom">${o.rm ? "Meterai<br>Rp10.000<br>" : ""}<b><u>${esc(o.rn)}</u></b>${o.rs ? `<br>${esc(o.rs)}` : ""}</td></tr></table>`;
const docHTML = (inner, title) => `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${esc(title || "Dokumen Hukum")}</title><style>@page{size:A4;margin:2.4cm} body{font-family:'Times New Roman',serif;font-size:12pt;line-height:1.6;color:#000;text-align:justify} h1{text-align:center;font-size:13pt;text-decoration:underline;margin:0 0 4px} .ctr{text-align:center} .rt{text-align:right} .nomor{text-align:center;margin:0 0 14px} table{width:100%;border-collapse:collapse} td{vertical-align:top} ol,ul{padding-left:22px;margin:6px 0} li{margin-bottom:4px} u{text-decoration:underline} .psl{text-align:center;font-weight:bold;margin:16px 0 0;text-transform:uppercase} .pslt{text-align:center;font-weight:bold;margin:0 0 6px} .gt td,.gt th{border:1px solid #555;padding:6px 9px} .mut{font-size:10pt;color:#444} h2{font-size:12pt;border-bottom:1px solid #000;padding-bottom:3px;margin:16px 0 6px}</style></head><body>${inner}</body></html>`;

const KUHPER = [
  { p: "1131", t: "Segala kebendaan debitor, baik bergerak maupun tidak bergerak, menjadi tanggungan untuk seluruh perikatannya." },
  { p: "1132", t: "Kebendaan itu menjadi jaminan bersama bagi para kreditor; hasilnya dibagi menurut perimbangan piutang, kecuali ada alasan sah untuk didahulukan." },
  { p: "1233", t: "Tiap perikatan dilahirkan baik karena persetujuan, maupun karena undang-undang." },
  { p: "1234", t: "Tiap perikatan adalah untuk memberikan sesuatu, untuk berbuat sesuatu, atau untuk tidak berbuat sesuatu." },
  { p: "1243", t: "Penggantian biaya, kerugian, dan bunga karena tak dipenuhinya perikatan diwajibkan setelah debitor dinyatakan lalai namun tetap tidak memenuhinya." },
  { p: "1244", t: "Debitor wajib mengganti rugi bila tak dapat membuktikan tidak terlaksananya perikatan disebabkan hal di luar kuasanya dan tanpa iktikad buruk." },
  { p: "1245", t: "Tiada penggantian biaya dan bunga bila karena keadaan memaksa (overmacht) debitor terhalang memberikan atau berbuat sesuatu." },
  { p: "1266", t: "Syarat batal dianggap selalu dicantumkan dalam perjanjian timbal balik bila salah satu pihak tidak memenuhi kewajibannya; pembatalan dimintakan ke pengadilan." },
  { p: "1267", t: "Pihak yang dirugikan dapat menuntut pemenuhan perjanjian, atau pembatalannya disertai penggantian biaya, kerugian, dan bunga." },
  { p: "1313", t: "Perjanjian adalah perbuatan dengan mana satu orang atau lebih mengikatkan dirinya terhadap satu orang lain atau lebih." },
  { p: "1320", t: "Syarat sah perjanjian: sepakat para pihak, kecakapan, suatu hal tertentu, dan suatu sebab yang halal." },
  { p: "1338", t: "Perjanjian yang dibuat secara sah berlaku sebagai undang-undang bagi para pihak dan harus dilaksanakan dengan iktikad baik." },
  { p: "1365", t: "Tiap perbuatan melanggar hukum yang menimbulkan kerugian mewajibkan pelakunya mengganti kerugian tersebut." },
  { p: "1366", t: "Setiap orang bertanggung jawab atas kerugian yang disebabkan kelalaian atau kurang hati-hatinya." },
  { p: "1457", t: "Jual beli adalah perjanjian dengan mana penjual mengikatkan diri menyerahkan suatu kebendaan dan pembeli membayar harga yang dijanjikan." },
  { p: "1474", t: "Penjual mempunyai dua kewajiban utama: menyerahkan barang dan menanggung (vrijwaring) kebendaan tersebut." },
  { p: "1513", t: "Kewajiban utama pembeli adalah membayar harga pembelian pada waktu dan tempat yang ditetapkan dalam perjanjian." },
  { p: "1851", t: "Perdamaian adalah persetujuan dengan mana para pihak mengakhiri atau mencegah suatu perkara dengan menyerahkan, menjanjikan, atau menahan suatu barang." },
];
const CITE_RULES = [
  { re: /pailit|kepailitan|pkpu|kurator|insolven|harta pailit/i, fam: "pailit" },
  { re: /elektronik|\bite\b|siber|medsos|media sosial|internet|unggah|posting|hoax|berita bohong|ujaran|judi online|pencemaran nama|transmisi/i, fam: "siber" },
  { re: /arbitrase|klausula arbitrase|\bbani\b/i, fam: "niaga" },
  { re: /saham|direksi|komisaris|\brups\b|perseroan|dividen/i, fam: "korporasi" },
  { re: /penyidik|penyitaan|penggeledahan|tersangka|penangkapan|penahanan|acara pidana|kuhap|praperadilan/i, fam: "acara" },
  { re: /pencurian|penggelapan|penipuan|penganiayaan|\bpidana\b|dipidana|tindak pidana/i, fam: "pidana" },
  { re: /konstitusi|hak asasi|\buud\b|undang-undang dasar/i, fam: "tata" },
];
const PERDATA_RE = /wanprestasi|cidera janji|ingkar janji|perjanjian|perikatan|ganti rugi|\butang\b|piutang|jual beli|sewa|hibah|jaminan|melawan hukum|\bpmh\b|perdata|kontrak|kesepakatan/i;
function _kuhperHits(q) {
  const s = String(q || "").toLowerCase();
  const score = (e) => (s.indexOf(e.p) >= 0 ? 3 : 0) + e.t.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 4 && s.indexOf(w) >= 0).length;
  return KUHPER.map((e) => ({ l: "KUHPerdata", p: e.p, t: e.t, _s: score(e) })).filter((e) => e._s > 0).sort((a, b) => b._s - a._s);
}
function _citeItems(query, max) {
  const q = String(query || ""); const out = []; const seen = {};
  const push = (e) => { const k = e.l + "|" + e.p; if (!seen[k]) { seen[k] = 1; out.push({ l: e.l, p: e.p, t: e.t }); } };
  if (PERDATA_RE.test(q)) _kuhperHits(q).slice(0, 4).forEach(push);
  const fams = CITE_RULES.filter((r) => r.re.test(q)).map((r) => r.fam);
  if (typeof searchPasal === "function") {
    try {
      (fams.length ? fams : ["all"]).forEach((fam) => { searchPasal(q, fam).slice(0, 3).forEach(push); });
      if (out.length < 3) searchPasal(q, "all").slice(0, 4).forEach(push);
    } catch (e) {}
  }
  return out.slice(0, max || 6);
}
function _citeLi(h) {
  const t = String(h.t || ""); const sn = esc(t.slice(0, 180)) + (t.length > 180 ? "…" : "");
  const law = h.l === "KUHPerdata" ? "KUHPerdata" : (typeof lawShort === "function" ? lawShort(h.l) : h.l);
  return `<li><b>Pasal ${esc(h.p)} ${esc(law)}</b> — ${sn}</li>`;
}
function citeBlock(query, title) {
  const items = _citeItems(query, 6);
  if (!items.length) return "";
  return `<h2>${esc(title || "RUJUKAN PASAL TERKAIT")}</h2><p class="mut">Dihasilkan otomatis sebagai rujukan awal dari basis data peraturan KNSL — periksa kembali bunyi lengkap &amp; keberlakuannya.</p><ol>${items.map(_citeLi).join("")}</ol>`;
}
function manualCiteBlock(list) {
  if (!list || !list.length) return "";
  return `<h2>RUJUKAN PASAL</h2><ol>${list.map(_citeLi).join("")}</ol>`;
}

/* keep original Surat Kuasa builder intact */
function buildSuratHTML(type, f) {
  const pihakPemberi = f.mewakili === "korporasi"
    ? `Dalam hal ini bertindak dalam jabatannya selaku <b>${esc(f.jabatan)}</b> dari dan oleh karenanya untuk dan atas nama <b>${esc(f.namaPT)}</b>, berkedudukan di ${esc(f.ptAlamat)}, suatu perseroan terbatas yang didirikan berdasarkan Akta Notaris ${esc(f.notaris)} Nomor ${esc(f.aktaNomor)} tanggal ${esc(f.aktaTgl)}, selanjutnya disebut sebagai <b>PEMBERI KUASA</b>.`
    : `Dalam hal ini bertindak untuk dan atas nama diri sendiri, selanjutnya disebut sebagai <b>PEMBERI KUASA</b>.`;
  let khusus = "", kewenangan = [];
  if (type === "litigasi") {
    khusus = `Khusus untuk mewakili, mendampingi, dan membela hak serta kepentingan hukum Pemberi Kuasa selaku <b>${esc(f.kedudukan)}</b> dalam perkara ${esc(f.jenisPerkara)} ${esc(f.nomorPerkara)} pada ${esc(f.pengadilan)}, dalam perkara melawan <b>${esc(f.lawan)}</b>.`;
    kewenangan = ["Menghadap dan menghadiri persidangan di muka Pengadilan, Hakim, Panitera, serta pejabat dan instansi terkait lainnya;","Mengajukan dan/atau menjawab gugatan, membuat dan menandatangani surat-surat, replik/duplik, serta mengajukan dan menanggapi alat bukti dan saksi;","Mengajukan kesimpulan, menerima atau menolak putusan, serta mengajukan upaya hukum banding, kasasi, dan peninjauan kembali;","Mengajukan dan/atau menanggapi permohonan sita jaminan dan pelaksanaan (eksekusi) putusan;","Mengadakan perdamaian (dading) dengan persetujuan tertulis Pemberi Kuasa;","Melakukan segala tindakan hukum lain yang dipandang perlu dan berguna bagi kepentingan Pemberi Kuasa."];
  } else if (type === "korporasi") {
    khusus = `Khusus untuk dan atas nama Pemberi Kuasa ${esc(f.halKorporasi)} dengan ${esc(f.instansiKorporasi)}, sepanjang tidak bertentangan dengan anggaran dasar Perseroan dan peraturan perundang-undangan.`;
    kewenangan = ["Mewakili Pemberi Kuasa dalam perundingan dan kesepakatan terkait maksud kuasa ini;","Membuat, menandatangani, dan menerima dokumen, surat, serta akta yang diperlukan;","Menghadap notaris, pejabat, dan instansi terkait untuk keperluan dimaksud;","Melakukan tindakan administratif dan hukum lain yang diperlukan untuk terlaksananya maksud kuasa ini."];
  } else {
    khusus = `Khusus untuk dan atas nama Pemberi Kuasa ${esc(f.halPengurusan)} pada ${esc(f.instansiPengurusan)}.`;
    kewenangan = ["Menghadap pejabat dan instansi terkait, mengajukan permohonan, serta melengkapi persyaratan;","Membuat, menandatangani, dan menerima dokumen serta surat yang diperlukan;","Membayar biaya resmi yang timbul dan menerima hasil pengurusan;","Melakukan tindakan lain yang diperlukan untuk selesainya pengurusan dimaksud."];
  }
  return `<h1>SURAT KUASA ${type === "pengurusan" ? "" : "KHUSUS"}</h1><p class="nomor">Nomor: ${esc(f.nomor)}</p><p>Yang bertanda tangan di bawah ini:</p><table>${_row("Nama", f.pemberiNama)}${f.mewakili === "korporasi" ? _row("Jabatan", f.jabatan) : _row("No. KTP", f.pemberiKtp)}${_row("Alamat", f.pemberiAlamat)}</table><p>${pihakPemberi}</p><p>Dengan ini memberikan kuasa kepada:</p><table>${_row("Nama", f.penerimaNama)}${_row("Pekerjaan", `${esc(f.penerimaProfesi)} pada ${esc(f.kantor)}`)}${_row("Alamat", f.kantorAlamat)}</table><p>selanjutnya disebut sebagai <b>PENERIMA KUASA</b>.</p><p class="ctr" style="font-weight:bold;letter-spacing:2px">------------------------------ K H U S U S ------------------------------</p><p>${khusus}</p><p>Untuk keperluan tersebut, Penerima Kuasa diberi kewenangan untuk:</p><ol>${kewenangan.map((k) => `<li>${k}</li>`).join("")}</ol><p>Kuasa ini diberikan dengan <b>hak substitusi</b> dan <b>hak retensi</b>, serta berlaku sejak ditandatangani.</p><p class="rt" style="margin-top:24px">${esc(f.kota)}, ${esc(f.tanggal)}</p>${sign2({ ll: "Penerima Kuasa,", ln: f.penerimaNama, rl: "Pemberi Kuasa,", rn: f.pemberiNama, rm: true })}`;
}

/* shared party paragraph for agreements */
const komparisi = (no, p) => p.badan
  ? `${esc(no)}. <b>${esc(p.nama)}</b>, dalam hal ini bertindak selaku ${esc(p.jabatan)} dari dan oleh karenanya untuk dan atas nama <b>${esc(p.badan)}</b>, berkedudukan di ${esc(p.alamat)}, selanjutnya disebut <b>${esc(p.sebut)}</b>.`
  : `${esc(no)}. <b>${esc(p.nama)}</b>, ${p.ktp ? `pemegang KTP No. ${esc(p.ktp)}, ` : ""}beralamat di ${esc(p.alamat)}, selanjutnya disebut <b>${esc(p.sebut)}</b>.`;

/* ---- 2. GUGATAN ---- */
function buildGugatan(f) {
  return `<p>${esc(f.kota)}, ${esc(f.tanggal)}</p><p>Kepada Yth.<br>Ketua ${esc(f.pengadilan)}<br>di ${esc(f.kotaPengadilan)}</p><p><b>Perihal: ${esc(f.perihal)}</b></p><p>Dengan hormat,</p><p>Yang bertanda tangan di bawah ini, ${esc(f.kuasa)}, Advokat pada ${esc(f.kantor)}, beralamat di ${esc(f.kantorAlamat)}, berdasarkan Surat Kuasa Khusus tertanggal ${esc(f.tglKuasa)}, bertindak untuk dan atas nama:</p><p><b>${esc(f.penggugat)}</b>, beralamat di ${esc(f.penggugatAlamat)} — selanjutnya disebut <b>PENGGUGAT</b>;</p><p>Dengan ini mengajukan gugatan terhadap:</p><p><b>${esc(f.tergugat)}</b>, beralamat di ${esc(f.tergugatAlamat)} — selanjutnya disebut <b>TERGUGAT</b>;</p><p>Adapun dalil-dalil gugatan adalah sebagai berikut.</p><h2>DUDUK PERKARA (POSITA)</h2>${_ol(f.posita)}<h2>DASAR HUKUM</h2>${_ol(f.dasarHukum)}${f.autocite === "yes" ? citeBlock(`${f.perihal} ${f.posita} ${f.dasarHukum}`, "RUJUKAN PASAL TERKAIT") : ""}<h2>PETITUM</h2><p>Berdasarkan hal-hal tersebut di atas, Penggugat mohon kepada Majelis Hakim yang memeriksa perkara ini untuk berkenan memutus:</p><p style="font-weight:bold;margin:8px 0 2px">PRIMAIR:</p>${_ol(f.petitum)}<p style="font-weight:bold;margin:8px 0 2px">SUBSIDAIR:</p><p>Apabila Majelis Hakim berpendapat lain, mohon putusan yang seadil-adilnya (<i>ex aequo et bono</i>).</p><p style="margin-top:18px">Hormat kami,<br>Kuasa Hukum Penggugat,</p><div style="height:70px"></div><p><b><u>${esc(f.kuasa)}</u></b><br>${esc(f.kantor)}</p>`;
}

/* ---- 3. SOMASI ---- */
function buildSomasi(f) {
  return `<p class="rt">${esc(f.kota)}, ${esc(f.tanggal)}</p><p>Nomor&nbsp;&nbsp;: ${esc(f.nomor)}<br>Hal&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: <b>SOMASI / TEGURAN HUKUM (${esc(f.tahap)})</b></p><p>Kepada Yth.<br><b>${esc(f.penerima)}</b><br>${esc(f.penerimaAlamat)}</p><p>Dengan hormat,</p><p>Kami yang bertanda tangan di bawah ini, ${esc(f.pengirim)}${f.pengirimBadan ? ` selaku ${esc(f.pengirimJabatan)} ${esc(f.pengirimBadan)}` : ""}, dengan ini menyampaikan teguran hukum (somasi) sehubungan dengan ${esc(f.dasar)}.</p>${_ps(f.uraian)}<p>Sehubungan dengan hal tersebut, kami menuntut Saudara untuk:</p>${_ol(f.tuntutan)}<p>Tuntutan tersebut wajib Saudara penuhi dalam jangka waktu <b>${esc(f.tenggang)} (${esc(f.tenggang)}) hari kalender</b> sejak surat ini diterima. Apabila Saudara lalai, kami akan menempuh upaya hukum yang diperlukan, baik perdata maupun pidana, sesuai peraturan perundang-undangan, dan segala biaya serta akibat yang timbul menjadi tanggung jawab Saudara.</p><p>Demikian somasi ini kami sampaikan untuk diperhatikan dan dilaksanakan sebagaimana mestinya.</p><p style="margin-top:18px">Hormat kami,</p><div style="height:70px"></div><p><b><u>${esc(f.pengirim)}</u></b>${f.pengirimJabatan ? `<br>${esc(f.pengirimJabatan)}` : ""}</p>`;
}

/* ---- 4. NDA ---- */
function buildNDA(f) {
  return `<h1>PERJANJIAN KERAHASIAAN</h1><p class="nomor">(NON-DISCLOSURE AGREEMENT)</p><p>Perjanjian Kerahasiaan ini ("Perjanjian") dibuat dan ditandatangani di ${esc(f.kota)} pada tanggal ${esc(f.tanggal)}, oleh dan antara:</p><p>${komparisi(1, { nama: f.p1nama, jabatan: f.p1jabatan, badan: f.p1badan, alamat: f.p1alamat, sebut: "PIHAK PERTAMA" })}</p><p>${komparisi(2, { nama: f.p2nama, jabatan: f.p2jabatan, badan: f.p2badan, alamat: f.p2alamat, sebut: "PIHAK KEDUA" })}</p><p>Para Pihak sepakat mengikatkan diri dalam Perjanjian dengan ketentuan sebagai berikut.</p>${_psl(1, "Definisi Informasi Rahasia")}<p>Informasi Rahasia adalah seluruh informasi, data, dokumen, dan keterangan dalam bentuk apa pun yang diungkapkan oleh satu Pihak ("Pihak Pengungkap") kepada Pihak lain ("Pihak Penerima") sehubungan dengan ${esc(f.tujuan)}, baik secara lisan, tertulis, maupun elektronik, yang ditandai rahasia atau yang menurut sifatnya patut dianggap rahasia.</p>${_psl(2, "Kewajiban Kerahasiaan")}<ol><li>Pihak Penerima wajib menjaga kerahasiaan Informasi Rahasia dan hanya menggunakannya untuk keperluan ${esc(f.tujuan)};</li><li>Pihak Penerima dilarang mengungkapkan Informasi Rahasia kepada pihak ketiga tanpa persetujuan tertulis Pihak Pengungkap;</li><li>Pihak Penerima menerapkan pengamanan yang wajar terhadap Informasi Rahasia.</li></ol>${_psl(3, "Pengecualian")}<p>Kewajiban kerahasiaan tidak berlaku atas informasi yang: (a) telah menjadi milik publik bukan karena kelalaian Pihak Penerima; (b) telah dimiliki secara sah sebelum pengungkapan; atau (c) wajib diungkapkan berdasarkan ketentuan hukum atau perintah pejabat berwenang.</p>${_psl(4, "Jangka Waktu")}<p>Kewajiban kerahasiaan berlaku selama Perjanjian dan tetap mengikat selama <b>${esc(f.jangka)} tahun</b> setelah Perjanjian berakhir.</p>${_psl(5, "Pengembalian Informasi")}<p>Atas permintaan Pihak Pengungkap atau berakhirnya Perjanjian, Pihak Penerima wajib mengembalikan atau memusnahkan seluruh Informasi Rahasia beserta salinannya.</p>${_psl(6, "Ganti Rugi")}<p>Pihak yang melanggar bertanggung jawab atas seluruh kerugian yang timbul dan Pihak Pengungkap berhak menuntut ganti rugi serta upaya hukum lain yang tersedia.</p>${_psl(7, "Hukum yang Berlaku & Penyelesaian Sengketa")}<p>Perjanjian tunduk pada hukum Negara Republik Indonesia. Setiap sengketa diselesaikan secara musyawarah, dan apabila tidak tercapai, melalui ${esc(f.forum)}.</p>${_psl(8, "Penutup")}<p>Perjanjian dibuat dalam 2 (dua) rangkap bermeterai cukup, masing-masing mempunyai kekuatan hukum yang sama.</p>${sign2({ ll: "PIHAK PERTAMA,", ln: f.p1nama, lm: true, rl: "PIHAK KEDUA,", rn: f.p2nama, rm: true })}`;
}

/* ---- 5. PERJANJIAN KERJA ---- */
function buildKerja(f) {
  const pkwt = f.jenis === "PKWT";
  return `<h1>PERJANJIAN KERJA ${pkwt ? "WAKTU TERTENTU (PKWT)" : "WAKTU TIDAK TERTENTU (PKWTT)"}</h1><p class="nomor">Nomor: ${esc(f.nomor)}</p><p>Perjanjian Kerja ini dibuat di ${esc(f.kota)} pada tanggal ${esc(f.tanggal)}, antara:</p><p>${komparisi(1, { nama: f.pemberiNama, jabatan: f.pemberiJabatan, badan: f.perusahaan, alamat: f.perusahaanAlamat, sebut: "PENGUSAHA" })}</p><p>${komparisi(2, { nama: f.pekerjaNama, ktp: f.pekerjaKtp, alamat: f.pekerjaAlamat, sebut: "PEKERJA" })}</p><p>Para Pihak sepakat mengadakan Perjanjian Kerja dengan ketentuan sebagai berikut.</p>${_psl(1, "Jabatan & Penempatan")}<p>Pekerja diterima untuk jabatan <b>${esc(f.posisi)}</b> dengan penempatan di ${esc(f.penempatan)} dan melaksanakan tugas sesuai pengarahan Pengusaha.</p>${_psl(2, pkwt ? "Jangka Waktu" : "Masa Percobaan")}<p>${pkwt ? `Perjanjian berlaku untuk jangka waktu <b>${esc(f.jangka)}</b> terhitung sejak ${esc(f.mulai)} dan dapat diperpanjang sesuai kesepakatan dan ketentuan perundang-undangan.` : `Hubungan kerja berlaku untuk waktu tidak tertentu terhitung sejak ${esc(f.mulai)} dengan masa percobaan paling lama <b>${esc(f.percobaan)}</b>.`}</p>${_psl(3, "Pengupahan")}<p>Pengusaha membayar upah sebesar <b>Rp${esc(f.gaji)}</b> per bulan, dibayarkan setiap akhir bulan, beserta ${esc(f.tunjangan)}, serta hak atas jaminan sosial sesuai peraturan perundang-undangan.</p>${_psl(4, "Waktu Kerja")}<p>Waktu kerja ${esc(f.jamKerja)}, sesuai ketentuan waktu kerja dan waktu istirahat yang berlaku.</p>${_psl(5, "Hak & Kewajiban")}<ol><li>Pekerja wajib melaksanakan pekerjaan dengan iktikad baik, tertib, dan mematuhi peraturan perusahaan;</li><li>Pengusaha wajib membayar upah dan memenuhi hak Pekerja tepat waktu;</li><li>Pekerja berhak atas cuti dan istirahat sesuai peraturan perundang-undangan.</li></ol>${_psl(6, "Kerahasiaan")}<p>Pekerja wajib menjaga kerahasiaan data dan informasi perusahaan selama dan setelah hubungan kerja berakhir.</p>${_psl(7, "Pengakhiran Hubungan Kerja")}<p>Pengakhiran hubungan kerja dilakukan sesuai ketentuan peraturan perundang-undangan di bidang ketenagakerjaan, termasuk hak atas kompensasi yang timbul karenanya.</p>${_psl(8, "Penyelesaian Perselisihan")}<p>Perselisihan diselesaikan secara musyawarah; apabila tidak tercapai, melalui mekanisme penyelesaian perselisihan hubungan industrial sesuai peraturan perundang-undangan.</p>${_psl(9, "Penutup")}<p>Perjanjian dibuat dalam 2 (dua) rangkap bermeterai cukup dengan kekuatan hukum yang sama.</p>${sign2({ ll: "PENGUSAHA,", ln: f.pemberiNama, ls: f.pemberiJabatan, rl: "PEKERJA,", rn: f.pekerjaNama, rm: true })}`;
}

/* ---- 6. PKS ---- */
function buildPKS(f) {
  return `<h1>PERJANJIAN KERJA SAMA</h1><p class="nomor">Tentang<br>${esc(f.judul)}<br>Nomor: ${esc(f.nomor)}</p><p>Perjanjian Kerja Sama ini ("Perjanjian") dibuat di ${esc(f.kota)} pada tanggal ${esc(f.tanggal)}, antara:</p><p>${komparisi(1, { nama: f.p1nama, jabatan: f.p1jabatan, badan: f.p1badan, alamat: f.p1alamat, sebut: "PIHAK PERTAMA" })}</p><p>${komparisi(2, { nama: f.p2nama, jabatan: f.p2jabatan, badan: f.p2badan, alamat: f.p2alamat, sebut: "PIHAK KEDUA" })}</p><p>Para Pihak terlebih dahulu menerangkan hal-hal sebagai berikut, dan sepakat mengikatkan diri dengan ketentuan di bawah ini.</p>${_psl(1, "Maksud & Tujuan")}<p>Para Pihak sepakat bekerja sama dalam rangka ${esc(f.tujuan)}.</p>${_psl(2, "Ruang Lingkup")}${_ol(f.ruangLingkup)}${_psl(3, "Hak & Kewajiban Para Pihak")}<p><b>Pihak Pertama:</b></p>${_ol(f.hak1)}<p><b>Pihak Kedua:</b></p>${_ol(f.hak2)}${_psl(4, "Jangka Waktu")}<p>Perjanjian berlaku selama <b>${esc(f.jangka)}</b> sejak ditandatangani dan dapat diperpanjang atas kesepakatan tertulis Para Pihak.</p>${_psl(5, "Pembiayaan")}<p>${esc(f.pembiayaan)}</p>${_psl(6, "Kerahasiaan")}<p>Para Pihak wajib menjaga kerahasiaan informasi yang diperoleh selama kerja sama.</p>${_psl(7, "Keadaan Memaksa (Force Majeure)")}<p>Para Pihak dibebaskan dari tanggung jawab atas keterlambatan/kegagalan akibat keadaan memaksa di luar kemampuan yang wajar, dengan pemberitahuan dalam waktu yang patut.</p>${_psl(8, "Penyelesaian Sengketa")}<p>Sengketa diselesaikan secara musyawarah; apabila tidak tercapai, melalui ${esc(f.forum)}, dan tunduk pada hukum Negara Republik Indonesia.</p>${_psl(9, "Penutup")}<p>Perjanjian dibuat dalam 2 (dua) rangkap bermeterai cukup dengan kekuatan hukum yang sama.</p>${sign2({ ll: "PIHAK PERTAMA,", ln: f.p1nama, ls: f.p1jabatan, lm: true, rl: "PIHAK KEDUA,", rn: f.p2nama, rs: f.p2jabatan, rm: true })}`;
}

/* ---- 7. TERM SHEET ---- */
function buildTermSheet(f) {
  const r = (l, v) => `<tr><td style="width:34%;font-weight:bold">${esc(l)}</td><td>${esc(v)}</td></tr>`;
  return `<h1>TERM SHEET</h1><p class="nomor">${esc(f.judul)}<br>Tanggal: ${esc(f.tanggal)}</p><p>Dokumen ini memuat pokok-pokok indikatif syarat dan ketentuan ("Term Sheet") sehubungan dengan rencana ${esc(f.judul)} antara ${esc(f.investor)} ("Investor") dan ${esc(f.perusahaan)} ("Perusahaan").</p><table class="gt">${r("Para Pihak", `${f.investor} (Investor); ${f.perusahaan} (Perusahaan)`)}${r("Jenis Instrumen", f.instrumen)}${r("Nilai Investasi", `Rp${f.nilai}`)}${r("Valuasi (Pre-Money)", `Rp${f.valuasi}`)}${r("Kepemilikan Pasca-Investasi", `${f.persen}%`)}${r("Penggunaan Dana", f.penggunaan)}${r("Kondisi Pendahuluan", f.kondisi)}${r("Eksklusivitas", `${f.eksklusivitas} hari sejak penandatanganan`)}${r("Kerahasiaan", "Mengikat bagi Para Pihak")}${r("Hukum yang Berlaku", "Negara Republik Indonesia")}</table><p style="margin-top:12px"><b>Sifat Mengikat.</b> Kecuali ketentuan mengenai Eksklusivitas, Kerahasiaan, dan Hukum yang Berlaku, Term Sheet ini bersifat <b>tidak mengikat</b> dan merupakan dasar negosiasi menuju perjanjian definitif.</p>${sign2({ ll: "INVESTOR,", ln: f.investor, rl: "PERUSAHAAN,", rn: f.perusahaan })}`;
}

/* ---- 8. MOU ---- */
function buildMoU(f) {
  return `<h1>NOTA KESEPAHAMAN</h1><p class="nomor">(MEMORANDUM OF UNDERSTANDING)<br>Tentang ${esc(f.judul)}<br>Nomor: ${esc(f.nomor)}</p><p>Nota Kesepahaman ini ("Nota") dibuat di ${esc(f.kota)} pada tanggal ${esc(f.tanggal)}, antara:</p><p>${komparisi(1, { nama: f.p1nama, jabatan: f.p1jabatan, badan: f.p1badan, alamat: f.p1alamat, sebut: "PIHAK PERTAMA" })}</p><p>${komparisi(2, { nama: f.p2nama, jabatan: f.p2jabatan, badan: f.p2badan, alamat: f.p2alamat, sebut: "PIHAK KEDUA" })}</p>${_psl(1, "Maksud & Tujuan")}<p>Para Pihak sepakat menjalin kesepahaman dalam rangka ${esc(f.tujuan)}.</p>${_psl(2, "Ruang Lingkup")}${_ol(f.ruangLingkup)}${_psl(3, "Jangka Waktu")}<p>Nota berlaku selama <b>${esc(f.jangka)}</b> sejak ditandatangani dan dapat diperpanjang atas kesepakatan Para Pihak.</p>${_psl(4, "Sifat Nota")}<p>Nota ini bersifat <b>tidak mengikat secara hukum</b> dan akan ditindaklanjuti dengan perjanjian kerja sama tersendiri, kecuali kewajiban kerahasiaan yang tetap mengikat Para Pihak.</p>${_psl(5, "Tindak Lanjut")}<p>${esc(f.tindakLanjut)}</p>${_psl(6, "Penutup")}<p>Nota dibuat dalam 2 (dua) rangkap, masing-masing mempunyai kekuatan yang sama.</p>${sign2({ ll: "PIHAK PERTAMA,", ln: f.p1nama, ls: f.p1jabatan, rl: "PIHAK KEDUA,", rn: f.p2nama, rs: f.p2jabatan })}`;
}

/* ---- 9. KONTRAK VENDOR ---- */
function buildVendor(f) {
  return `<h1>PERJANJIAN PENGADAAN ${esc(f.objekJenis).toUpperCase()}</h1><p class="nomor">Nomor: ${esc(f.nomor)}</p><p>Perjanjian ini dibuat di ${esc(f.kota)} pada tanggal ${esc(f.tanggal)}, antara:</p><p>${komparisi(1, { nama: f.p1nama, jabatan: f.p1jabatan, badan: f.p1badan, alamat: f.p1alamat, sebut: "PEMBERI KERJA" })}</p><p>${komparisi(2, { nama: f.p2nama, jabatan: f.p2jabatan, badan: f.p2badan, alamat: f.p2alamat, sebut: "PENYEDIA" })}</p>${_psl(1, "Objek Perjanjian")}<p>Penyedia menyediakan ${esc(f.objek)} dengan spesifikasi: ${esc(f.spesifikasi)}.</p>${_psl(2, "Harga & Pembayaran")}<p>Nilai perjanjian sebesar <b>Rp${esc(f.nilai)}</b> (termasuk pajak sesuai ketentuan), dibayar dengan cara: ${esc(f.pembayaran)}.</p>${_psl(3, "Jangka Waktu & Penyerahan")}<p>Penyerahan dilakukan paling lambat ${esc(f.penyerahan)} di lokasi yang disepakati Para Pihak.</p>${_psl(4, "Jaminan Mutu")}<p>Penyedia menjamin mutu dan memberikan garansi selama ${esc(f.garansi)} terhadap cacat/kerusakan yang bukan akibat kelalaian Pemberi Kerja.</p>${_psl(5, "Denda Keterlambatan")}<p>Atas keterlambatan, Penyedia dikenai denda <b>${esc(f.denda)}% per hari</b> dari nilai yang terlambat, setinggi-tingginya 5% dari nilai perjanjian.</p>${_psl(6, "Kewajiban Para Pihak")}<ol><li>Penyedia menyerahkan objek sesuai spesifikasi, mutu, dan waktu;</li><li>Pemberi Kerja melakukan pembayaran tepat waktu sesuai termin;</li><li>Para Pihak saling memberikan informasi yang diperlukan.</li></ol>${_psl(7, "Keadaan Memaksa (Force Majeure)")}<p>Para Pihak dibebaskan dari tanggung jawab atas kegagalan akibat keadaan memaksa, dengan pemberitahuan dalam waktu yang patut.</p>${_psl(8, "Pengakhiran")}<p>Perjanjian dapat diakhiri atas kesepakatan, atau secara sepihak apabila salah satu Pihak wanprestasi dan tidak memperbaikinya dalam waktu yang wajar setelah teguran tertulis.</p>${_psl(9, "Penyelesaian Sengketa")}<p>Sengketa diselesaikan secara musyawarah; apabila tidak tercapai, melalui ${esc(f.forum)}, tunduk pada hukum Negara Republik Indonesia.</p>${_psl(10, "Penutup")}<p>Perjanjian dibuat dalam 2 (dua) rangkap bermeterai cukup dengan kekuatan hukum yang sama.</p>${sign2({ ll: "PEMBERI KERJA,", ln: f.p1nama, ls: f.p1jabatan, lm: true, rl: "PENYEDIA,", rn: f.p2nama, rs: f.p2jabatan, rm: true })}`;
}

/* ---- 10. JAWABAN GUGATAN ---- */
function buildJawaban(f) {
  return `<p>${esc(f.kota)}, ${esc(f.tanggal)}</p><p>Kepada Yth.<br>Majelis Hakim Pemeriksa Perkara No. ${esc(f.nomorPerkara)}<br>${esc(f.pengadilan)}<br>di ${esc(f.kotaPengadilan)}</p><p><b>Perihal: Jawaban Tergugat</b></p><p>Dengan hormat,</p><p>Untuk dan atas nama <b>${esc(f.tergugat)}</b> (selanjutnya disebut <b>TERGUGAT</b>), berdasarkan Surat Kuasa Khusus tertanggal ${esc(f.tglKuasa)}, dalam perkara melawan <b>${esc(f.penggugat)}</b> (selanjutnya disebut <b>PENGGUGAT</b>), dengan ini Tergugat menyampaikan Jawaban sebagai berikut.</p><h2>DALAM EKSEPSI</h2>${_ol(f.eksepsi)}<h2>DALAM POKOK PERKARA</h2>${_ol(f.pokok)}${f.autocite === "yes" ? citeBlock(`${f.eksepsi} ${f.pokok}`, "RUJUKAN PASAL TERKAIT") : ""}<h2>PERMOHONAN (PETITUM)</h2><p>Berdasarkan hal-hal tersebut, Tergugat mohon kepada Majelis Hakim untuk memutus:</p>${_ol(f.petitum)}<p>Atau apabila Majelis Hakim berpendapat lain, mohon putusan yang seadil-adilnya (<i>ex aequo et bono</i>).</p><p style="margin-top:18px">Hormat kami,<br>Kuasa Hukum Tergugat,</p><div style="height:70px"></div><p><b><u>${esc(f.kuasa)}</u></b><br>${esc(f.kantor)}</p>`;
}

/* ---- 11. LEGAL OPINION ---- */
function buildLO(f) {
  return `<p class="rt">${esc(f.kota)}, ${esc(f.tanggal)}</p><p><b>STRICTLY PRIVATE & CONFIDENTIAL</b></p><p>Kepada Yth.<br><b>${esc(f.kepada)}</b><br>${esc(f.kepadaAlamat)}</p><p>Nomor&nbsp;: ${esc(f.nomor)}<br>Hal&nbsp;&nbsp;&nbsp;&nbsp;: <b>Pendapat Hukum (Legal Opinion) — ${esc(f.perihal)}</b></p><p>Dengan hormat,</p><p>Sehubungan dengan permintaan Saudara, perkenankan kami, ${esc(f.kantor)}, menyampaikan Pendapat Hukum sebagai berikut.</p><h2>I. LATAR BELAKANG</h2>${_ps(f.latar)}<h2>II. DOKUMEN & DASAR HUKUM</h2>${_ol(f.dasarHukum)}${f.autocite === "yes" ? citeBlock(`${f.perihal} ${f.pertanyaan} ${f.analisis}`, "RUJUKAN PASAL TERKAIT") : ""}<h2>III. POKOK PERTANYAAN HUKUM</h2>${_ol(f.pertanyaan)}<h2>IV. ANALISIS HUKUM</h2>${_ps(f.analisis)}<h2>V. KESIMPULAN</h2>${_ps(f.kesimpulan)}<h2>VI. ASUMSI & PEMBATASAN</h2><p>Pendapat Hukum ini didasarkan pada dokumen dan fakta yang disampaikan kepada kami serta hukum Negara Republik Indonesia yang berlaku pada tanggal ini, dan diberikan semata-mata untuk keperluan Saudara. ${esc(f.asumsi)}</p><p style="margin-top:18px">Hormat kami,<br>${esc(f.kantor)}</p><div style="height:70px"></div><p><b><u>${esc(f.penandatangan)}</u></b><br>${esc(f.jabatanTtd)}</p>`;
}

/* ---- 12. KONTRAK SEWA ---- */
function buildSewa(f) {
  return `<h1>PERJANJIAN SEWA MENYEWA</h1><p class="nomor">Nomor: ${esc(f.nomor)}</p><p>Perjanjian Sewa Menyewa ini ("Perjanjian") dibuat di ${esc(f.kota)} pada tanggal ${esc(f.tanggal)}, antara:</p><p>${komparisi(1, { nama: f.p1nama, jabatan: f.p1jabatan, badan: f.p1badan, alamat: f.p1alamat, sebut: "YANG MENYEWAKAN" })}</p><p>${komparisi(2, { nama: f.p2nama, jabatan: f.p2jabatan, badan: f.p2badan, alamat: f.p2alamat, sebut: "PENYEWA" })}</p><p>Para Pihak sepakat mengikatkan diri dengan ketentuan sebagai berikut.</p>${_psl(1, "Objek Sewa")}<p>Yang Menyewakan menyewakan kepada Penyewa berupa ${esc(f.objek)} yang terletak di ${esc(f.alamatObjek)} ("Objek Sewa").</p>${_psl(2, "Jangka Waktu")}<p>Sewa berlaku selama <b>${esc(f.jangka)}</b>, terhitung sejak ${esc(f.mulai)} sampai dengan ${esc(f.akhir)}, dan dapat diperpanjang atas kesepakatan tertulis Para Pihak.</p>${_psl(3, "Harga Sewa & Pembayaran")}<p>Harga sewa sebesar <b>Rp${esc(f.harga)}</b> (${esc(f.periode)}), dibayar dengan cara: ${esc(f.caraBayar)}.</p>${_psl(4, "Uang Jaminan")}<p>Penyewa menyerahkan uang jaminan (deposit) sebesar <b>Rp${esc(f.deposit)}</b> yang dikembalikan setelah berakhirnya sewa, dikurangi kewajiban yang belum diselesaikan.</p>${_psl(5, "Peruntukan")}<p>Objek Sewa digunakan semata-mata untuk ${esc(f.peruntukan)} dan tidak untuk kegiatan yang melanggar hukum.</p>${_psl(6, "Hak & Kewajiban")}<ol><li>Penyewa menggunakan Objek Sewa secara patut dan menjaga kondisinya;</li><li>Yang Menyewakan menjamin Penyewa menikmati Objek Sewa tanpa gangguan pihak lain;</li><li>Biaya pemakaian (listrik, air, dan sejenisnya) menjadi tanggungan ${esc(f.bebanUtilitas)}.</li></ol>${_psl(7, "Pemeliharaan & Perbaikan")}<p>Perbaikan ringan menjadi tanggung jawab Penyewa, sedangkan perbaikan struktural/berat menjadi tanggung jawab Yang Menyewakan, kecuali kerusakan akibat kelalaian Penyewa.</p>${_psl(8, "Larangan")}<p>Penyewa dilarang mengalihkan atau menyewakan kembali Objek Sewa kepada pihak lain tanpa persetujuan tertulis Yang Menyewakan.</p>${_psl(9, "Pengakhiran & Pengembalian")}<p>Pada berakhirnya sewa, Penyewa mengembalikan Objek Sewa dalam keadaan baik sebagaimana semula, kecuali penyusutan wajar.</p>${_psl(10, "Keadaan Memaksa (Force Majeure)")}<p>Para Pihak dibebaskan dari tanggung jawab atas kegagalan akibat keadaan memaksa di luar kemampuan yang wajar, dengan pemberitahuan dalam waktu yang patut.</p>${_psl(11, "Penyelesaian Sengketa")}<p>Sengketa diselesaikan secara musyawarah; bila tidak tercapai, melalui ${esc(f.forum)}, tunduk pada hukum Negara Republik Indonesia.</p>${_psl(12, "Penutup")}<p>Perjanjian dibuat dalam 2 (dua) rangkap bermeterai cukup dengan kekuatan hukum yang sama.</p>${sign2({ ll: "YANG MENYEWAKAN,", ln: f.p1nama, ls: f.p1jabatan, lm: true, rl: "PENYEWA,", rn: f.p2nama, rs: f.p2jabatan, rm: true })}`;
}

/* ---- 13. PERJANJIAN JUAL BELI ---- */
function buildJualBeli(f) {
  return `<h1>PERJANJIAN JUAL BELI</h1><p class="nomor">Nomor: ${esc(f.nomor)}</p><p>Perjanjian Jual Beli ini ("Perjanjian") dibuat di ${esc(f.kota)} pada tanggal ${esc(f.tanggal)}, antara:</p><p>${komparisi(1, { nama: f.p1nama, jabatan: f.p1jabatan, badan: f.p1badan, alamat: f.p1alamat, sebut: "PENJUAL" })}</p><p>${komparisi(2, { nama: f.p2nama, jabatan: f.p2jabatan, badan: f.p2badan, alamat: f.p2alamat, sebut: "PEMBELI" })}</p><p>Para Pihak sepakat mengikatkan diri dengan ketentuan sebagai berikut.</p>${_psl(1, "Objek & Harga")}<p>Penjual menjual kepada Pembeli berupa ${esc(f.objek)} dengan identitas/spesifikasi: ${esc(f.spesifikasi)} ("Objek"), dengan harga sebesar <b>Rp${esc(f.harga)}</b>.</p>${_psl(2, "Cara Pembayaran")}<p>Pembayaran dilakukan dengan cara: ${esc(f.caraBayar)}.</p>${_psl(3, "Penyerahan")}<p>Penyerahan Objek dilakukan ${esc(f.penyerahan)}.</p>${_psl(4, "Jaminan Penjual")}<p>Penjual menjamin bahwa Objek adalah miliknya yang sah, bebas dari sengketa, sitaan, jaminan/agunan, serta tidak sedang dialihkan kepada pihak lain.</p>${_psl(5, "Peralihan Hak & Risiko")}<p>Hak milik dan risiko atas Objek beralih kepada Pembeli sejak ${esc(f.peralihan)}.</p>${_psl(6, "Biaya & Pajak")}<p>Biaya dan pajak yang timbul atas jual beli ini ditanggung oleh ${esc(f.bebanPajak)} sesuai peraturan perundang-undangan.</p>${_psl(7, "Wanprestasi")}<p>Apabila salah satu Pihak wanprestasi, Pihak lain berhak menuntut pemenuhan dan/atau pembatalan disertai ganti rugi sesuai Pasal 1243 dan 1267 KUHPerdata, setelah pemberian teguran.</p>${_psl(8, "Keadaan Memaksa (Force Majeure)")}<p>Para Pihak dibebaskan dari tanggung jawab atas kegagalan akibat keadaan memaksa, dengan pemberitahuan dalam waktu yang patut.</p>${_psl(9, "Penyelesaian Sengketa")}<p>Sengketa diselesaikan secara musyawarah; bila tidak tercapai, melalui ${esc(f.forum)}, tunduk pada hukum Negara Republik Indonesia.</p>${_psl(10, "Penutup")}<p>Perjanjian dibuat dalam 2 (dua) rangkap bermeterai cukup dengan kekuatan hukum yang sama.</p>${sign2({ ll: "PENJUAL,", ln: f.p1nama, ls: f.p1jabatan, lm: true, rl: "PEMBELI,", rn: f.p2nama, rs: f.p2jabatan, rm: true })}`;
}

/* ---- 14. AKTA PERDAMAIAN ---- */
function buildDamai(f) {
  return `<h1>SURAT PERJANJIAN PERDAMAIAN</h1><p class="nomor">(AKTA PERDAMAIAN)<br>Nomor: ${esc(f.nomor)}</p><p>Pada hari ini, ${esc(f.tanggal)}, bertempat di ${esc(f.kota)}, yang bertanda tangan di bawah ini:</p><p>${komparisi(1, { nama: f.p1nama, jabatan: f.p1jabatan, badan: f.p1badan, alamat: f.p1alamat, sebut: "PIHAK PERTAMA" })}</p><p>${komparisi(2, { nama: f.p2nama, jabatan: f.p2jabatan, badan: f.p2badan, alamat: f.p2alamat, sebut: "PIHAK KEDUA" })}</p><p>Para Pihak terlebih dahulu menerangkan:</p>${_ps(f.latar)}<p>Bahwa untuk mengakhiri perselisihan secara musyawarah, Para Pihak sepakat mengadakan perdamaian berdasarkan Pasal 1851 sampai dengan Pasal 1864 KUHPerdata${f.perkaraNo ? ` sehubungan dengan perkara ${esc(f.perkaraNo)} pada ${esc(f.pengadilan)}` : ""}, dengan ketentuan sebagai berikut.</p>${_psl(1, "Pokok Perdamaian")}${_ol(f.kesepakatan)}${_psl(2, "Pelaksanaan")}<p>${esc(f.pelaksanaan)}</p>${_psl(3, "Pelepasan Hak & Tuntutan")}<p>Dengan ditandatanganinya perdamaian ini, Para Pihak saling melepaskan segala tuntutan, gugatan, dan/atau hak menuntut satu sama lain yang berkaitan dengan pokok perselisihan tersebut${f.perkaraNo ? ", dan sepakat mencabut perkara yang sedang berjalan" : ""}.</p>${_psl(4, "Sifat Final & Mengikat")}<p>Perdamaian ini bersifat final, mengikat, dan berlaku sebagai undang-undang bagi Para Pihak${f.perkaraNo ? ", serta Para Pihak memohon kepada Majelis Hakim agar perdamaian ini dikuatkan dalam Putusan Perdamaian (akta van dading) yang berkekuatan hukum tetap dan dapat dieksekusi sesuai Pasal 130 HIR" : ""}.</p>${_psl(5, "Penutup")}<p>Surat Perjanjian Perdamaian ini dibuat dalam keadaan sadar tanpa paksaan, dalam 2 (dua) rangkap bermeterai cukup dengan kekuatan hukum yang sama.</p>${sign2({ ll: "PIHAK PERTAMA,", ln: f.p1nama, ls: f.p1jabatan, lm: true, rl: "PIHAK KEDUA,", rn: f.p2nama, rs: f.p2jabatan, rm: true })}<table style="width:100%;margin-top:18px;text-align:center;border-collapse:collapse"><tr><td style="font-weight:bold">Saksi-Saksi:</td></tr><tr><td style="height:64px;vertical-align:bottom">1. <u>${esc(f.saksi1)}</u> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2. <u>${esc(f.saksi2)}</u></td></tr></table>`;
}

/* ---- 15. ADDENDUM / AMANDEMEN ---- */
function buildAddendum(f) {
  return `<h1>ADDENDUM PERJANJIAN</h1><p class="nomor">Nomor: ${esc(f.nomor)}</p><p>Addendum (Perubahan) ini ("Addendum") dibuat di ${esc(f.kota)} pada tanggal ${esc(f.tanggal)}, antara:</p><p>${komparisi(1, { nama: f.p1nama, jabatan: f.p1jabatan, badan: f.p1badan, alamat: f.p1alamat, sebut: "PIHAK PERTAMA" })}</p><p>${komparisi(2, { nama: f.p2nama, jabatan: f.p2jabatan, badan: f.p2badan, alamat: f.p2alamat, sebut: "PIHAK KEDUA" })}</p><p>Para Pihak terlebih dahulu menerangkan:</p><ol><li>Bahwa Para Pihak sebelumnya telah menandatangani <b>${esc(f.pokokJudul)}</b> Nomor ${esc(f.pokokNomor)} tanggal ${esc(f.pokokTgl)} ("Perjanjian Pokok");</li><li>Bahwa ${esc(f.latar)};</li><li>Bahwa Para Pihak sepakat mengubah sebagian ketentuan Perjanjian Pokok melalui Addendum ini.</li></ol>${_psl(1, "Perubahan")}<p>Para Pihak sepakat mengubah ketentuan Perjanjian Pokok sebagai berikut:</p>${_ol(f.perubahan)}${_psl(2, "Ketentuan Lain Tetap Berlaku")}<p>Seluruh ketentuan dalam Perjanjian Pokok yang tidak diubah dalam Addendum ini dinyatakan tetap berlaku dan mengikat Para Pihak. Addendum ini merupakan satu kesatuan yang tidak terpisahkan dari Perjanjian Pokok.</p>${_psl(3, "Berlaku Efektif")}<p>Addendum ini berlaku efektif sejak ${esc(f.efektif)}.</p>${_psl(4, "Penutup")}<p>Addendum dibuat dalam 2 (dua) rangkap bermeterai cukup dengan kekuatan hukum yang sama.</p>${sign2({ ll: "PIHAK PERTAMA,", ln: f.p1nama, ls: f.p1jabatan, lm: true, rl: "PIHAK KEDUA,", rn: f.p2nama, rs: f.p2jabatan, rm: true })}`;
}

/* ---- 16. PERJANJIAN PINJAMAN (UTANG-PIUTANG) ---- */
function buildPinjaman(f) {
  const bunga = f.bunga && String(f.bunga) !== "0" ? `Atas pinjaman dikenakan bunga sebesar <b>${esc(f.bunga)}% per ${esc(f.bungaPeriode)}</b> dari pokok pinjaman.` : `Pinjaman ini diberikan tanpa bunga.`;
  const jaminan = f.jaminan ? `Sebagai jaminan pelunasan, Debitur menyerahkan: ${esc(f.jaminan)}.` : `Pinjaman ini diberikan tanpa jaminan kebendaan tersendiri, dan dijamin dengan seluruh harta Debitur, baik bergerak maupun tidak bergerak, sesuai Pasal 1131 KUHPerdata.`;
  return `<h1>PERJANJIAN PINJAM MEMINJAM UANG</h1><p class="nomor">Nomor: ${esc(f.nomor)}</p><p>Perjanjian ini ("Perjanjian") dibuat di ${esc(f.kota)} pada tanggal ${esc(f.tanggal)}, antara:</p><p>${komparisi(1, { nama: f.p1nama, jabatan: f.p1jabatan, badan: f.p1badan, alamat: f.p1alamat, sebut: "KREDITUR" })}</p><p>${komparisi(2, { nama: f.p2nama, jabatan: f.p2jabatan, badan: f.p2badan, alamat: f.p2alamat, sebut: "DEBITUR" })}</p><p>Para Pihak sepakat dengan ketentuan sebagai berikut.</p>${_psl(1, "Jumlah Pinjaman")}<p>Kreditur memberikan pinjaman kepada Debitur sebesar <b>Rp${esc(f.jumlah)}</b> (${esc(f.terbilang)}), yang diterima Debitur secara penuh dan menjadi utang yang wajib dikembalikan.</p>${_psl(2, "Bunga")}<p>${bunga}</p>${_psl(3, "Jangka Waktu & Pembayaran")}<p>Pinjaman wajib dilunasi dalam jangka waktu <b>${esc(f.jangka)}</b>, dengan cara: ${esc(f.caraBayar)}. Pelunasan jatuh tempo selambatnya pada ${esc(f.jatuhTempo)}.</p>${_psl(4, "Jaminan")}<p>${jaminan}</p>${_psl(5, "Kelalaian & Denda")}<p>Atas keterlambatan pembayaran, Debitur dikenai denda sebesar <b>${esc(f.denda)}% per bulan</b> dari jumlah yang tertunggak, dan Kreditur berhak menagih seluruh sisa utang seketika dan sekaligus.</p>${_psl(6, "Pelunasan Dipercepat")}<p>Debitur dapat melunasi sebagian atau seluruh pinjaman sebelum jatuh tempo tanpa dikenai penalti.</p>${_psl(7, "Penyelesaian Sengketa")}<p>Sengketa diselesaikan secara musyawarah; bila tidak tercapai, melalui ${esc(f.forum)}, tunduk pada hukum Negara Republik Indonesia.</p>${_psl(8, "Penutup")}<p>Perjanjian dibuat dalam 2 (dua) rangkap bermeterai cukup dengan kekuatan hukum yang sama.</p>${sign2({ ll: "KREDITUR,", ln: f.p1nama, ls: f.p1jabatan, lm: true, rl: "DEBITUR,", rn: f.p2nama, rs: f.p2jabatan, rm: true })}<table style="width:100%;margin-top:18px;text-align:center;border-collapse:collapse"><tr><td style="font-weight:bold">Saksi-Saksi:</td></tr><tr><td style="height:60px;vertical-align:bottom">1. <u>${esc(f.saksi1)}</u> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2. <u>${esc(f.saksi2)}</u></td></tr></table>`;
}

/* ---------- document registry ---------- */


const _T = idToday();
const DOCS = [
  { id: "gugatan", group: "Litigasi", label: "Gugatan", build: buildGugatan, fields: [
    { k: "perihal", label: "Perihal Gugatan", full: true, def: "Gugatan Wanprestasi" },
    { k: "autocite", label: "Rujukan pasal otomatis", type: "select", options: [{ v: "no", l: "Tidak" }, { v: "yes", l: "Ya — sisipkan rujukan pasal" }], def: "no" },
    { k: "pengadilan", label: "Pengadilan", def: "Pengadilan Negeri Malang" },
    { k: "kotaPengadilan", label: "Kota Pengadilan", def: "Malang" },
    { d: "Penggugat & Kuasa" },
    { k: "penggugat", label: "Nama Penggugat", def: "PT Anugrah Sejahtera" },
    { k: "penggugatAlamat", label: "Alamat Penggugat", full: true, def: "Jl. Soekarno Hatta No. 25, Malang" },
    { k: "kuasa", label: "Nama Kuasa Hukum", def: "Arya Kusuma, S.H., M.H." },
    { k: "kantor", label: "Kantor Hukum", def: "Kantor Hukum KNSL & Partners" },
    { k: "kantorAlamat", label: "Alamat Kantor", def: "Jl. Veteran No. 3, Malang" },
    { k: "tglKuasa", label: "Tanggal Surat Kuasa", def: _T },
    { d: "Tergugat" },
    { k: "tergugat", label: "Nama Tergugat", def: "PT Sinarmas Tbk" },
    { k: "tergugatAlamat", label: "Alamat Tergugat", full: true, def: "Jl. Industri No. 1, Surabaya" },
    { d: "Isi Gugatan (satu poin per baris)" },
    { k: "posita", label: "Posita (duduk perkara)", type: "textarea", full: true, def: "Bahwa Penggugat dan Tergugat terikat Perjanjian Kerja Sama No. 12 tanggal 8 Maret 2024.\nBahwa Tergugat tidak melaksanakan kewajiban pembayaran sebesar Rp1.500.000.000,00 yang telah jatuh tempo.\nBahwa Penggugat telah menyampaikan teguran namun tidak diindahkan, sehingga Tergugat telah wanprestasi." },
    { k: "dasarHukum", label: "Dasar Hukum", type: "textarea", full: true, def: "Pasal 1243 KUHPerdata tentang ganti rugi akibat wanprestasi.\nPasal 1338 KUHPerdata tentang kekuatan mengikat perjanjian." },
    { k: "petitum", label: "Petitum (primair)", type: "textarea", full: true, def: "Mengabulkan gugatan Penggugat untuk seluruhnya.\nMenyatakan Tergugat telah melakukan wanprestasi.\nMenghukum Tergugat membayar ganti rugi sebesar Rp1.500.000.000,00.\nMenghukum Tergugat membayar biaya perkara." },
    { d: "Tempat & Tanggal" },
    { k: "kota", label: "Kota", def: "Malang" }, { k: "tanggal", label: "Tanggal", def: _T },
  ]},

  { id: "jawaban", group: "Litigasi", label: "Jawaban Gugatan", build: buildJawaban, fields: [
    { k: "nomorPerkara", label: "Nomor Perkara", def: "142/Pdt.G/2026/PN.Mlg" },
    { k: "autocite", label: "Rujukan pasal otomatis", type: "select", options: [{ v: "no", l: "Tidak" }, { v: "yes", l: "Ya — sisipkan rujukan pasal" }], def: "no" },
    { k: "pengadilan", label: "Pengadilan", def: "Pengadilan Negeri Malang" },
    { k: "kotaPengadilan", label: "Kota Pengadilan", def: "Malang" },
    { k: "tergugat", label: "Nama Tergugat", def: "PT Sinarmas Tbk" },
    { k: "penggugat", label: "Nama Penggugat", def: "PT Anugrah Sejahtera" },
    { k: "tglKuasa", label: "Tanggal Surat Kuasa", def: _T },
    { d: "Isi Jawaban (satu poin per baris)" },
    { k: "eksepsi", label: "Dalam Eksepsi", type: "textarea", full: true, def: "Eksepsi Kewenangan: Pengadilan tidak berwenang karena perjanjian memuat klausula arbitrase.\nEksepsi Gugatan Kabur (obscuur libel): posita dan petitum tidak bersesuaian." },
    { k: "pokok", label: "Dalam Pokok Perkara", type: "textarea", full: true, def: "Bahwa Tergugat menolak seluruh dalil Penggugat kecuali yang diakui secara tegas.\nBahwa kewajiban pembayaran belum jatuh tempo sehingga tidak terdapat wanprestasi.\nBahwa keterlambatan disebabkan keadaan memaksa di luar kuasa Tergugat." },
    { k: "petitum", label: "Petitum Tergugat", type: "textarea", full: true, def: "Menerima eksepsi Tergugat.\nMenyatakan gugatan Penggugat tidak dapat diterima (niet ontvankelijke verklaard), setidaknya menolak gugatan untuk seluruhnya.\nMenghukum Penggugat membayar biaya perkara." },
    { d: "Kuasa Hukum & Tanggal" },
    { k: "kuasa", label: "Nama Kuasa Hukum", def: "Arya Kusuma, S.H., M.H." },
    { k: "kantor", label: "Kantor Hukum", def: "Kantor Hukum KNSL & Partners" },
    { k: "kota", label: "Kota", def: "Malang" }, { k: "tanggal", label: "Tanggal", def: _T },
  ]},

  { id: "somasi", group: "Litigasi", label: "Somasi", build: buildSomasi, fields: [
    { k: "nomor", label: "Nomor Surat", def: "021/SOM/KNSL/VI/2026" },
    { k: "tahap", label: "Tahap", type: "select", options: [{ v: "Pertama", l: "Somasi I (Pertama)" }, { v: "Kedua", l: "Somasi II (Kedua)" }, { v: "Terakhir", l: "Somasi Terakhir" }], def: "Pertama" },
    { k: "penerima", label: "Ditujukan Kepada", def: "Sdr. Hartono" },
    { k: "penerimaAlamat", label: "Alamat Penerima", full: true, def: "Jl. Kawi No. 18, Malang" },
    { d: "Pengirim" },
    { k: "pengirim", label: "Nama Pengirim/Kuasa", def: "Arya Kusuma, S.H., M.H." },
    { k: "pengirimJabatan", label: "Jabatan", def: "Kuasa Hukum" },
    { k: "pengirimBadan", label: "Atas Nama (badan, opsional)", def: "PT Anugrah Sejahtera" },
    { d: "Isi Somasi" },
    { k: "dasar", label: "Dasar (perjanjian/peristiwa)", full: true, def: "Perjanjian Utang Piutang tanggal 10 Januari 2026 dan tunggakan pembayaran yang telah jatuh tempo" },
    { k: "uraian", label: "Uraian (per baris)", type: "textarea", full: true, def: "Bahwa Saudara memiliki kewajiban membayar utang sebesar Rp250.000.000,00 yang telah jatuh tempo pada 10 Mei 2026.\nBahwa hingga surat ini dibuat, kewajiban tersebut belum Saudara penuhi." },
    { k: "tuntutan", label: "Tuntutan (per baris)", type: "textarea", full: true, def: "Melunasi seluruh utang sebesar Rp250.000.000,00 beserta bunga yang timbul.\nMenyampaikan konfirmasi tertulis atas jadwal pembayaran." },
    { k: "tenggang", label: "Tenggang Waktu (hari)", type: "num", def: "7" },
    { k: "kota", label: "Kota", def: "Malang" }, { k: "tanggal", label: "Tanggal", def: _T },
  ]},

  { id: "suratkuasa", group: "Litigasi", label: "Surat Kuasa", build: (f) => buildSuratHTML(f.sktype, f), fields: [
    { k: "sktype", label: "Jenis Surat Kuasa", type: "select", options: [{ v: "litigasi", l: "Khusus (Litigasi)" }, { v: "korporasi", l: "Korporasi (Perbuatan Hukum)" }, { v: "pengurusan", l: "Pengurusan (Administratif)" }], def: "litigasi" },
    { k: "nomor", label: "Nomor Surat", def: "047/SK/KNSL/VI/2026" },
    { k: "mewakili", label: "Pemberi kuasa bertindak", type: "select", options: [{ v: "korporasi", l: "Atas nama PT (jabatan)" }, { v: "diri", l: "Atas nama pribadi" }], def: "korporasi" },
    { k: "pemberiNama", label: "Nama Pemberi Kuasa", def: "Sutrisno Wijaya" },
    { k: "jabatan", label: "Jabatan", when: (f) => f.mewakili === "korporasi", def: "Direktur Utama" },
    { k: "pemberiKtp", label: "No. KTP", when: (f) => f.mewakili === "diri", def: "3573xxxxxxxxxxxx" },
    { k: "pemberiAlamat", label: "Alamat Pemberi Kuasa", full: true, def: "Jl. Merdeka No. 10, Malang" },
    { k: "namaPT", label: "Nama PT", when: (f) => f.mewakili === "korporasi", def: "PT Anugrah Sejahtera" },
    { k: "ptAlamat", label: "Alamat PT", when: (f) => f.mewakili === "korporasi", def: "Jl. Soekarno Hatta No. 25, Malang" },
    { k: "notaris", label: "Notaris", when: (f) => f.mewakili === "korporasi", def: "Budiarto, S.H., M.Kn." },
    { k: "aktaNomor", label: "No. Akta", when: (f) => f.mewakili === "korporasi", def: "12" },
    { k: "aktaTgl", label: "Tgl Akta", when: (f) => f.mewakili === "korporasi", def: "8 Maret 2018" },
    { d: "Penerima Kuasa" },
    { k: "penerimaNama", label: "Nama Penerima Kuasa", def: "Arya Kusuma, S.H., M.H." },
    { k: "penerimaProfesi", label: "Profesi", def: "Advokat" },
    { k: "kantor", label: "Kantor Hukum", def: "Kantor Hukum KNSL & Partners" },
    { k: "kantorAlamat", label: "Alamat Kantor", def: "Jl. Veteran No. 3, Malang" },
    { d: "Substansi Kuasa" },
    { k: "kedudukan", label: "Kedudukan", when: (f) => f.sktype === "litigasi", def: "Tergugat" },
    { k: "jenisPerkara", label: "Jenis Perkara", when: (f) => f.sktype === "litigasi", def: "Perdata (Wanprestasi)" },
    { k: "nomorPerkara", label: "Nomor Perkara", when: (f) => f.sktype === "litigasi", def: "Nomor 142/Pdt.G/2026/PN.Mlg" },
    { k: "pengadilan", label: "Pengadilan", when: (f) => f.sktype === "litigasi", def: "Pengadilan Negeri Malang" },
    { k: "lawan", label: "Pihak Lawan", full: true, when: (f) => f.sktype === "litigasi", def: "PT Sinarmas Tbk" },
    { k: "halKorporasi", label: "Hal yang dikuasakan", full: true, when: (f) => f.sktype === "korporasi", def: "menandatangani perjanjian kerja sama serta dokumen terkait" },
    { k: "instansiKorporasi", label: "Dengan / di hadapan", full: true, when: (f) => f.sktype === "korporasi", def: "pihak ketiga dan instansi terkait" },
    { k: "halPengurusan", label: "Hal yang diurus", full: true, when: (f) => f.sktype === "pengurusan", def: "mengurus perpanjangan izin usaha" },
    { k: "instansiPengurusan", label: "Instansi", full: true, when: (f) => f.sktype === "pengurusan", def: "Dinas Penanaman Modal dan PTSP" },
    { d: "Tempat & Tanggal" },
    { k: "kota", label: "Kota", def: "Malang" }, { k: "tanggal", label: "Tanggal", def: _T },
  ]},

  { id: "nda", group: "Kontrak", label: "NDA (Kerahasiaan)", build: buildNDA, fields: [
    { k: "tujuan", label: "Tujuan Pengungkapan", full: true, def: "penjajakan kerja sama bisnis dan uji tuntas (due diligence)" },
    { k: "jangka", label: "Masa Kerahasiaan (tahun)", type: "num", def: "3" },
    { k: "forum", label: "Forum Sengketa", def: "Badan Arbitrase Nasional Indonesia (BANI)" },
    { d: "Pihak Pertama" },
    { k: "p1nama", label: "Nama", def: "Sutrisno Wijaya" }, { k: "p1jabatan", label: "Jabatan", def: "Direktur Utama" },
    { k: "p1badan", label: "Badan (kosongkan jika pribadi)", def: "PT Anugrah Sejahtera" }, { k: "p1alamat", label: "Alamat", full: true, def: "Jl. Soekarno Hatta No. 25, Malang" },
    { d: "Pihak Kedua" },
    { k: "p2nama", label: "Nama", def: "Andri Pratama" }, { k: "p2jabatan", label: "Jabatan", def: "Direktur" },
    { k: "p2badan", label: "Badan (kosongkan jika pribadi)", def: "PT Mitra Teknologi" }, { k: "p2alamat", label: "Alamat", full: true, def: "Jl. Gatot Subroto No. 50, Jakarta" },
    { d: "Tempat & Tanggal" }, { k: "kota", label: "Kota", def: "Malang" }, { k: "tanggal", label: "Tanggal", def: _T },
  ]},

  { id: "kerja", group: "Kontrak", label: "Perjanjian Kerja", build: buildKerja, fields: [
    { k: "jenis", label: "Jenis", type: "select", options: [{ v: "PKWT", l: "PKWT (Waktu Tertentu)" }, { v: "PKWTT", l: "PKWTT (Tetap)" }], def: "PKWT" },
    { k: "nomor", label: "Nomor", def: "015/PK/KNSL/VI/2026" },
    { d: "Pengusaha" },
    { k: "perusahaan", label: "Nama Perusahaan", def: "PT Anugrah Sejahtera" }, { k: "perusahaanAlamat", label: "Alamat", full: true, def: "Jl. Soekarno Hatta No. 25, Malang" },
    { k: "pemberiNama", label: "Diwakili (nama)", def: "Sutrisno Wijaya" }, { k: "pemberiJabatan", label: "Jabatan", def: "Direktur Utama" },
    { d: "Pekerja" },
    { k: "pekerjaNama", label: "Nama Pekerja", def: "Dewi Lestari" }, { k: "pekerjaKtp", label: "No. KTP", def: "3573xxxxxxxxxxxx" },
    { k: "pekerjaAlamat", label: "Alamat", full: true, def: "Jl. Ijen No. 7, Malang" },
    { d: "Ketentuan Kerja" },
    { k: "posisi", label: "Jabatan/Posisi", def: "Staf Keuangan" }, { k: "penempatan", label: "Penempatan", def: "Kantor Pusat Malang" },
    { k: "mulai", label: "Mulai Kerja", def: "1 Juli 2026" },
    { k: "jangka", label: "Jangka (PKWT)", when: (f) => f.jenis === "PKWT", def: "12 (dua belas) bulan" },
    { k: "percobaan", label: "Masa Percobaan (PKWTT)", when: (f) => f.jenis === "PKWTT", def: "3 (tiga) bulan" },
    { k: "gaji", label: "Upah / bulan (Rp)", def: "7.500.000,00" },
    { k: "tunjangan", label: "Tunjangan", full: true, def: "tunjangan transportasi dan tunjangan kinerja sesuai kebijakan perusahaan" },
    { k: "jamKerja", label: "Waktu Kerja", full: true, def: "5 (lima) hari kerja, 8 (delapan) jam per hari" },
    { d: "Tempat & Tanggal" }, { k: "kota", label: "Kota", def: "Malang" }, { k: "tanggal", label: "Tanggal", def: _T },
  ]},

  { id: "pks", group: "Kontrak", label: "PKS (Kerja Sama)", build: buildPKS, fields: [
    { k: "judul", label: "Judul Kerja Sama", full: true, def: "Kerja Sama Pemasaran dan Distribusi Produk" },
    { k: "nomor", label: "Nomor", def: "030/PKS/KNSL/VI/2026" },
    { d: "Pihak Pertama" },
    { k: "p1nama", label: "Nama", def: "Sutrisno Wijaya" }, { k: "p1jabatan", label: "Jabatan", def: "Direktur Utama" },
    { k: "p1badan", label: "Badan", def: "PT Anugrah Sejahtera" }, { k: "p1alamat", label: "Alamat", full: true, def: "Jl. Soekarno Hatta No. 25, Malang" },
    { d: "Pihak Kedua" },
    { k: "p2nama", label: "Nama", def: "Andri Pratama" }, { k: "p2jabatan", label: "Jabatan", def: "Direktur" },
    { k: "p2badan", label: "Badan", def: "PT Mitra Teknologi" }, { k: "p2alamat", label: "Alamat", full: true, def: "Jl. Gatot Subroto No. 50, Jakarta" },
    { d: "Substansi" },
    { k: "tujuan", label: "Maksud & Tujuan", full: true, def: "memasarkan dan mendistribusikan produk Pihak Pertama di wilayah Jawa Timur" },
    { k: "ruangLingkup", label: "Ruang Lingkup (per baris)", type: "textarea", full: true, def: "Pemasaran produk melalui jaringan Pihak Kedua.\nPenyediaan dukungan teknis dan pelatihan.\nPelaporan penjualan secara berkala." },
    { k: "hak1", label: "Hak/Kewajiban Pihak Pertama", type: "textarea", full: true, def: "Menyediakan produk sesuai pesanan.\nMemberikan materi pemasaran dan pelatihan." },
    { k: "hak2", label: "Hak/Kewajiban Pihak Kedua", type: "textarea", full: true, def: "Memasarkan produk secara aktif.\nMenyampaikan laporan dan pembayaran tepat waktu." },
    { k: "jangka", label: "Jangka Waktu", def: "2 (dua) tahun" },
    { k: "pembiayaan", label: "Pembiayaan", full: true, def: "Biaya yang timbul ditanggung masing-masing Pihak sesuai porsi pelaksanaan kewajibannya, kecuali disepakati lain secara tertulis." },
    { k: "forum", label: "Forum Sengketa", def: "Pengadilan Negeri Malang" },
    { d: "Tempat & Tanggal" }, { k: "kota", label: "Kota", def: "Malang" }, { k: "tanggal", label: "Tanggal", def: _T },
  ]},

  { id: "vendor", group: "Kontrak", label: "Kontrak Vendor", build: buildVendor, fields: [
    { k: "objekJenis", label: "Jenis Pengadaan", type: "select", options: [{ v: "Barang", l: "Barang" }, { v: "Jasa", l: "Jasa" }], def: "Barang" },
    { k: "nomor", label: "Nomor", def: "040/PBJ/KNSL/VI/2026" },
    { d: "Pemberi Kerja" },
    { k: "p1nama", label: "Nama", def: "Sutrisno Wijaya" }, { k: "p1jabatan", label: "Jabatan", def: "Direktur Utama" },
    { k: "p1badan", label: "Badan", def: "PT Anugrah Sejahtera" }, { k: "p1alamat", label: "Alamat", full: true, def: "Jl. Soekarno Hatta No. 25, Malang" },
    { d: "Penyedia / Vendor" },
    { k: "p2nama", label: "Nama", def: "Budi Santoso" }, { k: "p2jabatan", label: "Jabatan", def: "Direktur" },
    { k: "p2badan", label: "Badan", def: "CV Sumber Makmur" }, { k: "p2alamat", label: "Alamat", full: true, def: "Jl. Raya Karanglo No. 9, Malang" },
    { d: "Objek & Komersial" },
    { k: "objek", label: "Objek (uraian)", full: true, def: "100 unit perangkat komputer beserta instalasi" },
    { k: "spesifikasi", label: "Spesifikasi", full: true, def: "sesuai Lampiran spesifikasi teknis yang disepakati Para Pihak" },
    { k: "nilai", label: "Nilai Kontrak (Rp)", def: "850.000.000,00" },
    { k: "pembayaran", label: "Cara Pembayaran", full: true, def: "uang muka 30% saat penandatanganan dan 70% setelah serah terima diterima baik" },
    { k: "penyerahan", label: "Batas Penyerahan", def: "30 (tiga puluh) hari kerja sejak uang muka diterima" },
    { k: "garansi", label: "Garansi", def: "12 (dua belas) bulan" },
    { k: "denda", label: "Denda Keterlambatan (%/hari)", type: "num", def: "0,1" },
    { k: "forum", label: "Forum Sengketa", def: "Pengadilan Negeri Malang" },
    { d: "Tempat & Tanggal" }, { k: "kota", label: "Kota", def: "Malang" }, { k: "tanggal", label: "Tanggal", def: _T },
  ]},

  { id: "mou", group: "Kontrak", label: "MoU (Nota Kesepahaman)", build: buildMoU, fields: [
    { k: "judul", label: "Judul / Tentang", full: true, def: "Penjajakan Kerja Sama Strategis" },
    { k: "nomor", label: "Nomor", def: "008/MoU/KNSL/VI/2026" },
    { d: "Pihak Pertama" },
    { k: "p1nama", label: "Nama", def: "Sutrisno Wijaya" }, { k: "p1jabatan", label: "Jabatan", def: "Direktur Utama" },
    { k: "p1badan", label: "Badan", def: "PT Anugrah Sejahtera" }, { k: "p1alamat", label: "Alamat", full: true, def: "Jl. Soekarno Hatta No. 25, Malang" },
    { d: "Pihak Kedua" },
    { k: "p2nama", label: "Nama", def: "Andri Pratama" }, { k: "p2jabatan", label: "Jabatan", def: "Direktur" },
    { k: "p2badan", label: "Badan", def: "PT Mitra Teknologi" }, { k: "p2alamat", label: "Alamat", full: true, def: "Jl. Gatot Subroto No. 50, Jakarta" },
    { d: "Substansi" },
    { k: "tujuan", label: "Maksud & Tujuan", full: true, def: "menjajaki potensi kerja sama pengembangan platform digital" },
    { k: "ruangLingkup", label: "Ruang Lingkup (per baris)", type: "textarea", full: true, def: "Pertukaran data dan informasi yang relevan.\nStudi kelayakan bersama.\nPenyusunan rencana kerja sama lanjutan." },
    { k: "jangka", label: "Jangka Waktu", def: "6 (enam) bulan" },
    { k: "tindakLanjut", label: "Tindak Lanjut", full: true, def: "Hasil kesepahaman ini akan dituangkan dalam Perjanjian Kerja Sama tersendiri yang mengikat Para Pihak." },
    { d: "Tempat & Tanggal" }, { k: "kota", label: "Kota", def: "Malang" }, { k: "tanggal", label: "Tanggal", def: _T },
  ]},

  { id: "termsheet", group: "Kontrak", label: "Term Sheet", build: buildTermSheet, fields: [
    { k: "judul", label: "Judul Transaksi", full: true, def: "Investasi Seri A pada PT Anugrah Sejahtera" },
    { k: "investor", label: "Investor", def: "Nusantara Ventures" },
    { k: "perusahaan", label: "Perusahaan", def: "PT Anugrah Sejahtera" },
    { k: "instrumen", label: "Jenis Instrumen", def: "Saham Seri A (preferen)" },
    { k: "nilai", label: "Nilai Investasi (Rp)", def: "10.000.000.000,00" },
    { k: "valuasi", label: "Valuasi Pre-Money (Rp)", def: "40.000.000.000,00" },
    { k: "persen", label: "Kepemilikan (%)", type: "num", def: "20" },
    { k: "penggunaan", label: "Penggunaan Dana", full: true, def: "pengembangan produk, perekrutan, dan ekspansi pasar" },
    { k: "kondisi", label: "Kondisi Pendahuluan", full: true, def: "uji tuntas memuaskan, persetujuan korporasi, dan dokumen definitif" },
    { k: "eksklusivitas", label: "Eksklusivitas (hari)", type: "num", def: "45" },
    { k: "tanggal", label: "Tanggal", def: _T },
  ]},

  { id: "legalopinion", group: "Advisory", label: "Legal Opinion", build: buildLO, fields: [
    { k: "nomor", label: "Nomor", def: "LO-012/KNSL/VI/2026" },
    { k: "perihal", label: "Perihal", full: true, def: "Keabsahan dan Keberlakuan Perjanjian Kerja Sama" },
    { k: "autocite", label: "Rujukan pasal otomatis", type: "select", options: [{ v: "no", l: "Tidak" }, { v: "yes", l: "Ya — sisipkan rujukan pasal" }], def: "no" },
    { k: "kepada", label: "Ditujukan Kepada", def: "Direksi PT Anugrah Sejahtera" },
    { k: "kepadaAlamat", label: "Alamat", full: true, def: "Jl. Soekarno Hatta No. 25, Malang" },
    { k: "kantor", label: "Kantor Hukum", def: "Kantor Hukum KNSL & Partners" },
    { d: "Isi (paragraf/poin per baris)" },
    { k: "latar", label: "Latar Belakang", type: "textarea", full: true, def: "Klien meminta pendapat hukum atas keabsahan Perjanjian Kerja Sama No. 12 tanggal 8 Maret 2024 dan akibat hukum atas dugaan wanprestasi salah satu pihak." },
    { k: "pertanyaan", label: "Pokok Pertanyaan", type: "textarea", full: true, def: "Apakah Perjanjian sah dan mengikat Para Pihak?\nApa akibat hukum dan upaya yang tersedia atas wanprestasi?" },
    { k: "dasarHukum", label: "Dokumen & Dasar Hukum", type: "textarea", full: true, def: "Perjanjian Kerja Sama No. 12 tanggal 8 Maret 2024.\nPasal 1320 KUHPerdata tentang syarat sah perjanjian.\nPasal 1243 dan 1267 KUHPerdata tentang wanprestasi dan ganti rugi." },
    { k: "analisis", label: "Analisis Hukum", type: "textarea", full: true, def: "Perjanjian memenuhi syarat sah Pasal 1320 KUHPerdata sehingga mengikat sebagai undang-undang bagi Para Pihak (Pasal 1338).\nAtas wanprestasi, pihak yang dirugikan berhak menuntut pemenuhan, pembatalan, dan/atau ganti rugi sesuai Pasal 1243 dan 1267 KUHPerdata, didahului pemberian teguran (somasi)." },
    { k: "kesimpulan", label: "Kesimpulan", type: "textarea", full: true, def: "Perjanjian sah dan mengikat.\nKlien dapat menempuh somasi dan, bila perlu, gugatan wanprestasi disertai tuntutan ganti rugi." },
    { k: "asumsi", label: "Asumsi & Pembatasan (tambahan)", full: true, def: "Kami mengasumsikan keaslian seluruh dokumen dan kewenangan para penandatangan." },
    { d: "Penanda Tangan & Tanggal" },
    { k: "penandatangan", label: "Nama Penanda Tangan", def: "Arya Kusuma, S.H., M.H." },
    { k: "jabatanTtd", label: "Jabatan", def: "Managing Partner" },
    { k: "kota", label: "Kota", def: "Malang" }, { k: "tanggal", label: "Tanggal", def: _T },
  ]},
  { id: "sewa", group: "Kontrak", label: "Kontrak Sewa", build: buildSewa, fields: [
    { k: "nomor", label: "Nomor", def: "050/SWA/KNSL/VI/2026" },
    { d: "Yang Menyewakan" },
    { k: "p1nama", label: "Nama", def: "Sutrisno Wijaya" }, { k: "p1jabatan", label: "Jabatan (opsional)", def: "Pemilik" },
    { k: "p1badan", label: "Badan (kosongkan jika pribadi)", def: "" }, { k: "p1alamat", label: "Alamat", full: true, def: "Jl. Merdeka No. 10, Malang" },
    { d: "Penyewa" },
    { k: "p2nama", label: "Nama", def: "Andri Pratama" }, { k: "p2jabatan", label: "Jabatan (opsional)", def: "Direktur" },
    { k: "p2badan", label: "Badan (kosongkan jika pribadi)", def: "PT Mitra Teknologi" }, { k: "p2alamat", label: "Alamat", full: true, def: "Jl. Gatot Subroto No. 50, Jakarta" },
    { d: "Objek & Ketentuan" },
    { k: "objek", label: "Objek Sewa", full: true, def: "1 (satu) unit ruko 2 lantai" },
    { k: "alamatObjek", label: "Alamat Objek", full: true, def: "Jl. Soekarno Hatta No. 25, Malang" },
    { k: "jangka", label: "Jangka Waktu", def: "2 (dua) tahun" },
    { k: "mulai", label: "Mulai", def: "1 Juli 2026" }, { k: "akhir", label: "Berakhir", def: "30 Juni 2028" },
    { k: "harga", label: "Harga Sewa (Rp)", def: "120.000.000,00" }, { k: "periode", label: "Periode", def: "per tahun" },
    { k: "caraBayar", label: "Cara Pembayaran", full: true, def: "dibayar di muka per tahun selambatnya 7 hari sebelum periode sewa berjalan" },
    { k: "deposit", label: "Deposit (Rp)", def: "10.000.000,00" },
    { k: "peruntukan", label: "Peruntukan", full: true, def: "kegiatan usaha kantor dan perdagangan" },
    { k: "bebanUtilitas", label: "Beban utilitas", def: "Penyewa" },
    { k: "forum", label: "Forum Sengketa", def: "Pengadilan Negeri Malang" },
    { d: "Tempat & Tanggal" }, { k: "kota", label: "Kota", def: "Malang" }, { k: "tanggal", label: "Tanggal", def: _T },
  ]},
  { id: "jualbeli", group: "Kontrak", label: "Perjanjian Jual Beli", build: buildJualBeli, fields: [
    { k: "nomor", label: "Nomor", def: "055/JB/KNSL/VI/2026" },
    { d: "Penjual" },
    { k: "p1nama", label: "Nama", def: "Sutrisno Wijaya" }, { k: "p1jabatan", label: "Jabatan (opsional)", def: "Direktur Utama" },
    { k: "p1badan", label: "Badan (kosongkan jika pribadi)", def: "PT Anugrah Sejahtera" }, { k: "p1alamat", label: "Alamat", full: true, def: "Jl. Soekarno Hatta No. 25, Malang" },
    { d: "Pembeli" },
    { k: "p2nama", label: "Nama", def: "Budi Santoso" }, { k: "p2jabatan", label: "Jabatan (opsional)", def: "" },
    { k: "p2badan", label: "Badan (kosongkan jika pribadi)", def: "" }, { k: "p2alamat", label: "Alamat", full: true, def: "Jl. Raya Karanglo No. 9, Malang" },
    { d: "Objek & Komersial" },
    { k: "objek", label: "Objek", full: true, def: "1 (satu) unit kendaraan roda empat" },
    { k: "spesifikasi", label: "Identitas / Spesifikasi", full: true, def: "merek X tahun 2023, Nomor Polisi N 1234 XX, BPKB & STNK atas nama Penjual" },
    { k: "harga", label: "Harga (Rp)", def: "285.000.000,00" },
    { k: "caraBayar", label: "Cara Pembayaran", full: true, def: "lunas seketika dan tunai pada saat penandatanganan" },
    { k: "penyerahan", label: "Penyerahan", full: true, def: "pada saat pembayaran lunas, di lokasi yang disepakati, beserta seluruh dokumen kepemilikan" },
    { k: "peralihan", label: "Peralihan hak & risiko sejak", def: "penyerahan Objek kepada Pembeli" },
    { k: "bebanPajak", label: "Beban biaya & pajak", def: "Pembeli" },
    { k: "forum", label: "Forum Sengketa", def: "Pengadilan Negeri Malang" },
    { d: "Tempat & Tanggal" }, { k: "kota", label: "Kota", def: "Malang" }, { k: "tanggal", label: "Tanggal", def: _T },
  ]},
  { id: "damai", group: "Litigasi", label: "Akta Perdamaian", build: buildDamai, fields: [
    { k: "nomor", label: "Nomor", def: "012/SPP/KNSL/VI/2026" },
    { d: "Pihak Pertama" },
    { k: "p1nama", label: "Nama", def: "Sutrisno Wijaya" }, { k: "p1jabatan", label: "Jabatan (opsional)", def: "Direktur Utama" },
    { k: "p1badan", label: "Badan (kosongkan jika pribadi)", def: "PT Anugrah Sejahtera" }, { k: "p1alamat", label: "Alamat", full: true, def: "Jl. Soekarno Hatta No. 25, Malang" },
    { d: "Pihak Kedua" },
    { k: "p2nama", label: "Nama", def: "PT Sinarmas Tbk" }, { k: "p2jabatan", label: "Jabatan (opsional)", def: "Direktur" },
    { k: "p2badan", label: "Badan (kosongkan jika pribadi)", def: "" }, { k: "p2alamat", label: "Alamat", full: true, def: "Jl. Industri No. 1, Surabaya" },
    { d: "Sengketa & Kesepakatan" },
    { k: "latar", label: "Latar / Pokok Sengketa (per baris)", type: "textarea", full: true, def: "Bahwa Para Pihak berselisih mengenai pelaksanaan Perjanjian Kerja Sama No. 12 tanggal 8 Maret 2024.\nBahwa Pihak Pertama mendalilkan adanya tunggakan pembayaran, sedangkan Pihak Kedua mengajukan keberatan atas perhitungan tersebut." },
    { k: "perkaraNo", label: "Nomor Perkara (opsional)", def: "142/Pdt.G/2026/PN.Mlg" },
    { k: "pengadilan", label: "Pengadilan (jika ada perkara)", def: "Pengadilan Negeri Malang" },
    { k: "kesepakatan", label: "Pokok Perdamaian (per baris)", type: "textarea", full: true, def: "Pihak Kedua membayar kepada Pihak Pertama sebesar Rp1.000.000.000,00 secara bertahap dalam 5 bulan.\nPihak Pertama membebaskan sisa tagihan selebihnya.\nKedua belah pihak melanjutkan kerja sama dengan adendum tersendiri." },
    { k: "pelaksanaan", label: "Pelaksanaan", full: true, def: "Pembayaran dilakukan melalui transfer ke rekening Pihak Pertama paling lambat tanggal 10 setiap bulan, dimulai Juli 2026." },
    { d: "Saksi & Tanggal" },
    { k: "saksi1", label: "Saksi 1", def: "Rudi Hermawan" }, { k: "saksi2", label: "Saksi 2", def: "Sri Wahyuni" },
    { k: "kota", label: "Kota", def: "Malang" }, { k: "tanggal", label: "Tanggal", def: _T },
  ]},
  { id: "addendum", group: "Kontrak", label: "Addendum / Amandemen", build: buildAddendum, fields: [
    { k: "nomor", label: "Nomor", def: "001/ADD/KNSL/VI/2026" },
    { d: "Perjanjian Pokok" },
    { k: "pokokJudul", label: "Judul Perjanjian Pokok", full: true, def: "Perjanjian Kerja Sama" },
    { k: "pokokNomor", label: "Nomor Perjanjian Pokok", def: "030/PKS/KNSL/III/2024" },
    { k: "pokokTgl", label: "Tanggal Perjanjian Pokok", def: "8 Maret 2024" },
    { d: "Pihak Pertama" },
    { k: "p1nama", label: "Nama", def: "Sutrisno Wijaya" }, { k: "p1jabatan", label: "Jabatan (opsional)", def: "Direktur Utama" },
    { k: "p1badan", label: "Badan (kosongkan jika pribadi)", def: "PT Anugrah Sejahtera" }, { k: "p1alamat", label: "Alamat", full: true, def: "Jl. Soekarno Hatta No. 25, Malang" },
    { d: "Pihak Kedua" },
    { k: "p2nama", label: "Nama", def: "Andri Pratama" }, { k: "p2jabatan", label: "Jabatan (opsional)", def: "Direktur" },
    { k: "p2badan", label: "Badan (kosongkan jika pribadi)", def: "PT Mitra Teknologi" }, { k: "p2alamat", label: "Alamat", full: true, def: "Jl. Gatot Subroto No. 50, Jakarta" },
    { d: "Perubahan" },
    { k: "latar", label: "Alasan/Latar Perubahan", full: true, def: "Para Pihak sepakat menyesuaikan nilai dan jangka waktu kerja sama" },
    { k: "perubahan", label: "Perubahan (per baris)", type: "textarea", full: true, def: "Pasal 4 mengenai Jangka Waktu semula 2 (dua) tahun diubah menjadi 3 (tiga) tahun.\nPasal 5 mengenai Pembiayaan ditambah ketentuan mengenai pembagian biaya promosi sebesar 50:50." },
    { k: "efektif", label: "Berlaku Efektif", def: "tanggal penandatanganan Addendum ini" },
    { d: "Tempat & Tanggal" }, { k: "kota", label: "Kota", def: "Malang" }, { k: "tanggal", label: "Tanggal", def: _T },
  ]},
  { id: "pinjaman", group: "Kontrak", label: "Perjanjian Pinjaman (Utang)", build: buildPinjaman, fields: [
    { k: "nomor", label: "Nomor", def: "060/PPU/KNSL/VI/2026" },
    { d: "Kreditur (Pemberi Pinjaman)" },
    { k: "p1nama", label: "Nama", def: "Sutrisno Wijaya" }, { k: "p1jabatan", label: "Jabatan (opsional)", def: "" },
    { k: "p1badan", label: "Badan (kosongkan jika pribadi)", def: "" }, { k: "p1alamat", label: "Alamat", full: true, def: "Jl. Merdeka No. 10, Malang" },
    { d: "Debitur (Penerima Pinjaman)" },
    { k: "p2nama", label: "Nama", def: "Budi Santoso" }, { k: "p2jabatan", label: "Jabatan (opsional)", def: "" },
    { k: "p2badan", label: "Badan (kosongkan jika pribadi)", def: "" }, { k: "p2alamat", label: "Alamat", full: true, def: "Jl. Raya Karanglo No. 9, Malang" },
    { d: "Ketentuan Pinjaman" },
    { k: "jumlah", label: "Jumlah Pinjaman (Rp)", def: "250.000.000,00" },
    { k: "terbilang", label: "Terbilang", full: true, def: "dua ratus lima puluh juta rupiah" },
    { k: "bunga", label: "Bunga (% per periode, 0 = tanpa bunga)", def: "1" },
    { k: "bungaPeriode", label: "Periode Bunga", def: "bulan" },
    { k: "jangka", label: "Jangka Waktu", def: "12 (dua belas) bulan" },
    { k: "caraBayar", label: "Cara Pembayaran", full: true, def: "angsuran tetap setiap bulan paling lambat tanggal 10" },
    { k: "jatuhTempo", label: "Jatuh Tempo", def: "30 Juni 2027" },
    { k: "jaminan", label: "Jaminan (kosongkan jika tanpa jaminan)", full: true, def: "1 (satu) unit kendaraan dengan BPKB atas nama Debitur" },
    { k: "denda", label: "Denda Keterlambatan (%/bulan)", def: "2" },
    { k: "forum", label: "Forum Sengketa", def: "Pengadilan Negeri Malang" },
    { d: "Saksi & Tanggal" },
    { k: "saksi1", label: "Saksi 1", def: "Rudi Hermawan" }, { k: "saksi2", label: "Saksi 2", def: "Sri Wahyuni" },
    { k: "kota", label: "Kota", def: "Malang" }, { k: "tanggal", label: "Tanggal", def: _T },
  ]},
];
const DOC_GROUPS = ["Litigasi", "Kontrak", "Advisory"];

/* ---------- drafting UI ---------- */
function DField({ fl, value, onChange }) {
  if (fl.d) return (
    <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 10, margin: "10px 0 0" }}>
      <div className="hairline" style={{ flex: 1 }} />
      <span style={{ fontSize: 10, letterSpacing: "1.5px", color: "var(--muted-2)", textTransform: "uppercase", whiteSpace: "nowrap" }}>{fl.d}</span>
      <div className="hairline" style={{ flex: 1 }} />
    </div>
  );
  return (
    <label style={{ display: "block", gridColumn: fl.full ? "1 / -1" : "auto" }}>
      <span style={{ fontSize: 11.5, color: "var(--muted)", display: "block", marginBottom: 5 }}>{fl.label}</span>
      {fl.type === "textarea"
        ? <textarea className="field" style={{ minHeight: 80, resize: "vertical" }} value={value} onChange={onChange} />
        : fl.type === "select"
          ? <select className="field" value={value} onChange={onChange}>{fl.options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
          : <input className="field" value={value} onChange={onChange} />}
    </label>
  );
}

const PREVIEW_CSS = ".kdoc h1{text-align:center;font-size:16px;text-decoration:underline;margin:0 0 4px}.kdoc h2{font-size:13px;border-bottom:1px solid #999;padding-bottom:2px;margin:14px 0 6px}.kdoc .psl{text-align:center;font-weight:bold;margin:14px 0 0;text-transform:uppercase}.kdoc .pslt{text-align:center;font-weight:bold;margin:0 0 6px}.kdoc .ctr{text-align:center}.kdoc .rt{text-align:right}.kdoc .nomor{text-align:center;margin:0 0 12px}.kdoc table{width:100%;border-collapse:collapse;margin:4px 0}.kdoc td{vertical-align:top}.kdoc .gt td,.kdoc .gt th{border:1px solid #999;padding:5px 8px}.kdoc ol,.kdoc ul{padding-left:20px}.kdoc li{margin-bottom:4px}";

function Drafting() {
  const defsFor = (d) => d.fields.reduce((a, fl) => { if (fl.k) a[fl.k] = fl.def != null ? fl.def : ""; return a; }, {});
  const [docType, setDocType] = useState("gugatan");
  const [store, setStore] = useState(() => ({ gugatan: defsFor(DOCS[0]) }));
  const doc = DOCS.find((d) => d.id === docType) || DOCS[0];
  const f = store[docType] || defsFor(doc);
  const set = (k) => (e) => { const v = e.target.value; setStore((s) => ({ ...s, [docType]: { ...(s[docType] || defsFor(doc)), [k]: v } })); };
  const changeType = (id) => { setDocType(id); setStore((s) => (s[id] ? s : { ...s, [id]: defsFor(DOCS.find((d) => d.id === id)) })); };
  const [picked, setPicked] = useState({});
  const [pq, setPq] = useState("");
  const pick = picked[docType] || [];
  const pres = pq.trim().length > 1 && typeof searchPasal === "function" ? searchPasal(pq, "all").slice(0, 8) : [];
  const addPasal = (e) => setPicked((s) => { const cur = s[docType] || []; if (cur.some((x) => x.l === e.l && x.p === e.p)) return s; return { ...s, [docType]: [...cur, { l: e.l, p: e.p, t: e.t }] }; });
  const removePasal = (i) => setPicked((s) => ({ ...s, [docType]: (s[docType] || []).filter((_, idx) => idx !== i) }));
  const inner = doc.build(f) + (pick.length ? manualCiteBlock(pick) : "");
  const fname = `${doc.label.replace(/[^A-Za-z0-9]+/g, "_")}_KNSL.doc`;

  const downloadWord = () => {
    const blob = new Blob(["\ufeff" + docHTML(inner, doc.label)], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = fname;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };
  const downloadPDF = () => {
    const html = docHTML(inner, doc.label);
    const ifr = document.createElement("iframe");
    ifr.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    document.body.appendChild(ifr);
    const d = ifr.contentWindow.document; d.open(); d.write(html); d.close();
    setTimeout(() => { try { ifr.contentWindow.focus(); ifr.contentWindow.print(); } catch (e) {} setTimeout(() => ifr.remove(), 1500); }, 350);
  };

  return (
    <div className="view-enter page scrollbar">
      <div className="drafting-grid">
        <div className="glass rise" style={{ padding: 22, height: "fit-content" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}><FileSignature size={18} className="gold-text" /><h3 className="serif" style={{ fontSize: 19, margin: 0 }}>Generator Dokumen Hukum</h3></div>
          <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 14px", lineHeight: 1.5 }}>16 jenis dokumen — pilih jenis, isi data, dokumen tersusun otomatis di samping, lalu unduh Word/PDF.</p>
          <select className="field" value={docType} onChange={(e) => changeType(e.target.value)} style={{ marginBottom: 14 }}>
            {DOC_GROUPS.map((g) => <optgroup key={g} label={g}>{DOCS.filter((d) => d.group === g).map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}</optgroup>)}
          </select>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
            {doc.fields.map((fl, i) => {
              if (fl.d) return <DField key={"d" + i} fl={fl} />;
              if (fl.when && !fl.when(f)) return null;
              return <DField key={fl.k} fl={fl} value={f[fl.k] != null ? f[fl.k] : ""} onChange={set(fl.k)} />;
            })}
          </div>
          <div style={{ marginTop: 16, border: "1px solid var(--line)", borderRadius: 12, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><BookOpen size={15} className="gold-text" /><span style={{ fontSize: 12.5, fontWeight: 600 }}>Sisipkan Pasal (manual)</span></div>
            <input className="field" value={pq} onChange={(e) => setPq(e.target.value)} placeholder="Cari pasal: wanprestasi, kepailitan, ITE, arbitrase..." />
            {pres.length > 0 && (
              <div className="scrollbar" style={{ maxHeight: 170, overflowY: "auto", marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                {pres.map((e, i) => (
                  <button key={i} onClick={() => addPasal(e)} style={{ textAlign: "left", background: "rgba(255,255,255,0.03)", border: "1px solid var(--line)", borderRadius: 9, padding: "8px 10px", color: "var(--text)", cursor: "pointer" }}>
                    <span className="gold-text" style={{ fontWeight: 600, fontSize: 12.5 }}>Pasal {e.p} · {lawShort(e.l)}</span>
                    <span style={{ display: "block", fontSize: 11, color: "var(--muted)", marginTop: 2, lineHeight: 1.4 }}>{String(e.t || "").slice(0, 92)}…</span>
                  </button>
                ))}
              </div>
            )}
            {pick.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                {pick.map((e, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, background: "rgba(31,179,126,0.12)", border: "1px solid rgba(31,179,126,0.35)", borderRadius: 20, padding: "4px 10px" }}>Pasal {e.p} {lawShort(e.l)}<span onClick={() => removePasal(i)} style={{ cursor: "pointer", color: "var(--muted)", fontWeight: 700 }}>×</span></span>
                ))}
              </div>
            )}
            <p style={{ fontSize: 11, color: "var(--muted)", margin: "8px 2px 0", lineHeight: 1.5 }}>Pasal terpilih disisipkan sebagai blok “RUJUKAN PASAL” di akhir dokumen.</p>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={downloadWord}><FileText size={16} /> Unduh Word</button>
            <button className="btn-ghost" onClick={downloadPDF}><FileText size={15} className="gold-text" /> Cetak / PDF</button>
          </div>
        </div>

        <div className="glass rise" style={{ padding: 16, animationDelay: ".1s" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 11.5, letterSpacing: "1.5px", color: "var(--muted-2)", textTransform: "uppercase" }}>Pratinjau · {doc.label}</span>
            <span className="badge badge-low"><CheckCircle2 size={12} /> Otomatis</span>
          </div>
          <div style={{ background: "#f6f3ec", color: "#1a1a1a", borderRadius: 10, padding: "30px 26px", fontFamily: "'Times New Roman', Georgia, serif", fontSize: 13.5, lineHeight: 1.65, textAlign: "justify", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)", maxHeight: 640, overflowY: "auto" }} className="scrollbar" dangerouslySetInnerHTML={{ __html: `<style>${PREVIEW_CSS}</style><div class="kdoc">${inner}</div>` }} />
          <p style={{ fontSize: 11.5, color: "var(--muted)", margin: "12px 2px 0", lineHeight: 1.5 }}>Jika tombol PDF terblokir di sebagian browser, unduh Word lalu simpan sebagai PDF. Meterai & tanda tangan basah tetap diperlukan agar sah. Template bersifat indikatif — sesuaikan dengan kebutuhan perkara.</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- conflict check ---------- */
function Conflict() {
  const [scanned, setScanned] = useState(false);
  return (
    <div className="view-enter page scrollbar" style={{ maxWidth: 820 }}>
      <div className="glass rise" style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}><ShieldCheck size={19} className="gold-text" /><h3 className="serif" style={{ fontSize: 20, margin: 0 }}>Conflict of Interest Check</h3></div>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 18px", lineHeight: 1.6 }}>Pindai basis data klien & lawan untuk mendeteksi benturan kepentingan sebelum menerima klien baru.</p>
        <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
          <input className="field" style={{ flex: 1, minWidth: 200 }} placeholder="Nama calon klien / pihak lawan..." defaultValue="PT Sinarmas Tbk" />
          <button className="btn-primary" onClick={() => setScanned(true)}><ShieldCheck size={16} /> Scan Konflik</button>
        </div>
        {scanned && (
          <div className="view-enter glass" style={{ padding: 18, borderLeft: "2px solid #dc4437", background: "rgba(220,68,55,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8, flexWrap: "wrap" }}><AlertTriangle size={18} style={{ color: "#ff9a8b" }} /><span style={{ fontWeight: 600, fontSize: 14.5 }}>1 Potensi Konflik Terdeteksi</span><Badge risk="high">Tinggi</Badge></div>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>“PT Sinarmas Tbk” tercatat sebagai <strong style={{ color: "var(--silver)" }}>pihak lawan aktif</strong> pada perkara KNSL-2401. Penerimaan klien ini berpotensi melanggar Kode Etik Advokat — diperlukan persetujuan komite etik.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   CONTRACT REVIEW AI — module for KNSL Legal Intelligence
   Self-contained: upload → extract → clause-detect → AI/heuristic
   review → risk engine → dashboard → DOCX/PDF report → storage.
   Matches existing design system, nav, routing & export infra.
   Client-side only (no backend); persistence via window.storage.
   ============================================================ */

/* ---------- clause taxonomy (EN + ID keywords) ---------- */
const CR_TYPES = [
  { id: "termination", label: "Termination / Pengakhiran", base: 2, kw: ["terminat", "pengakhiran", "mengakhiri", "pemutusan", "berakhirnya", "wanprestasi", "default", "breach", "cancel"] },
  { id: "liability", label: "Liability / Tanggung Jawab", base: 3, kw: ["liabilit", "tanggung jawab", "ganti rugi", "kerugian", "damages", "consequential", "limitation of liability", "batas tanggung"] },
  { id: "indemnity", label: "Indemnity / Ganti Rugi", base: 3, kw: ["indemnif", "indemnity", "membebaskan", "mengganti", "hold harmless", "membela"] },
  { id: "confidentiality", label: "Confidentiality / Kerahasiaan", base: 2, kw: ["confidential", "kerahasiaan", "rahasia", "non-disclosure", "nda", "informasi rahasia"] },
  { id: "payment", label: "Payment / Pembayaran", base: 2, kw: ["payment", "pembayaran", "harga", "invoice", "tagihan", "denda keterlambatan", "termin", "uang muka", "fee", "biaya", "ppn", "pajak"] },
  { id: "ip", label: "Intellectual Property / HKI", base: 2, kw: ["intellectual property", "kekayaan intelektual", "hki", "hak cipta", "copyright", "paten", "merek", "trademark", "license", "lisensi"] },
  { id: "governing_law", label: "Governing Law / Hukum yang Berlaku", base: 1, kw: ["governing law", "hukum yang berlaku", "tunduk pada hukum", "yurisdiksi", "jurisdiction"] },
  { id: "dispute", label: "Dispute Resolution / Penyelesaian Sengketa", base: 2, kw: ["dispute", "sengketa", "arbitrase", "arbitration", "bani", "pengadilan", "musyawarah", "mediasi"] },
  { id: "force_majeure", label: "Force Majeure / Keadaan Memaksa", base: 1, kw: ["force majeure", "keadaan memaksa", "keadaan kahar", "overmacht", "bencana", "act of god"] },
  { id: "warranty", label: "Warranty / Jaminan", base: 2, kw: ["warrant", "jaminan", "garansi", "menjamin", "representation", "pernyataan dan jaminan"] },
  { id: "delivery", label: "Delivery / Penyerahan", base: 2, kw: ["delivery", "penyerahan", "pengiriman", "jadwal", "schedule", "tenggat", "spesifikasi", "mutu"] },
  { id: "assignment", label: "Assignment / Pengalihan", base: 1, kw: ["assignment", "pengalihan", "mengalihkan", "novasi", "subkontrak", "subcontract"] },
  { id: "term", label: "Term / Jangka Waktu", base: 1, kw: ["jangka waktu", "term of", "masa berlaku", "perpanjangan", "renewal", "efektif"] },
  { id: "scope", label: "Scope / Ruang Lingkup", base: 1, kw: ["ruang lingkup", "scope of work", "lingkup pekerjaan", "objek perjanjian", "definisi"] },
  { id: "general", label: "General / Umum", base: 1, kw: [] },
];

const CR_RISK = { high: 3, med: 2, low: 1 };
const CR_RISK_LABEL = { high: "Tinggi", med: "Sedang", low: "Rendah" };
const CR_MAX_BYTES = 25 * 1024 * 1024; // 25MB
const CR_ACCEPT = [".pdf", ".docx", ".txt"];

/* ---------- persistence (window.storage with safe fallback) ---------- */
const _crMem = {}; // fallback store if window.storage unavailable
const crHasStore = () => typeof window !== "undefined" && window.storage && typeof window.storage.get === "function";
async function crGet(key) {
  try { if (crHasStore()) { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; } }
  catch (e) { /* key missing or storage error */ }
  return _crMem[key] != null ? _crMem[key] : null;
}
async function crSet(key, value) {
  _crMem[key] = value;
  try { if (crHasStore()) await window.storage.set(key, JSON.stringify(value)); } catch (e) { /* over quota / offline */ }
}
async function crAudit(action, detail) {
  const log = (await crGet("cr:audit")) || [];
  log.unshift({ ts: Date.now(), action, detail: detail || "", actor: "Adv. Arya Kusuma" });
  await crSet("cr:audit", log.slice(0, 500));
}
async function crListIndex() { return (await crGet("cr:index")) || []; }
async function crSaveRecord(rec) {
  await crSet("cr:doc:" + rec.id, rec);
  const idx = await crListIndex();
  const meta = { id: rec.id, name: rec.name, ts: rec.ts, score: rec.risk ? rec.risk.score : null, category: rec.risk ? rec.risk.category : "—", clauses: rec.clauses ? rec.clauses.length : 0 };
  const next = [meta, ...idx.filter((m) => m.id !== rec.id)].slice(0, 100);
  await crSet("cr:index", next);
}
async function crDeleteRecord(id) {
  await crSet("cr:doc:" + id, null);
  await crSet("cr:index", (await crListIndex()).filter((m) => m.id !== id));
  await crAudit("delete_contract", id);
}

/* ---------- dynamic loaders for PDF / OCR parsers (cdnjs) ---------- */
function crLoadScript(src) {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") return reject(new Error("no document"));
    const ex = document.querySelector(`script[data-cr="${src}"]`);
    if (ex) { if (ex.dataset.loaded) return resolve(); ex.addEventListener("load", () => resolve()); ex.addEventListener("error", () => reject(new Error("load failed"))); return; }
    const s = document.createElement("script");
    s.src = src; s.async = true; s.dataset.cr = src;
    s.onload = () => { s.dataset.loaded = "1"; resolve(); };
    s.onerror = () => reject(new Error("Tidak dapat memuat parser dari jaringan: " + src));
    document.head.appendChild(s);
  });
}
const CR_PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const CR_PDFJS_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const CR_TESS = "https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.0/tesseract.min.js";
const CR_MAMMOTH = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";

/* ---------- text extraction ---------- */
function crReadTxt(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => reject(new Error("Gagal membaca berkas teks."));
    r.readAsText(file);
  });
}
async function crReadDocx(file) {
  // Load the browser build of mammoth from CDN (sets window.mammoth) — robust
  // and self-contained, same pattern as the PDF/OCR parsers below.
  if (typeof window === "undefined") throw new Error("Lingkungan tidak mendukung pembacaan DOCX.");
  if (!window.mammoth) {
    try { await crLoadScript(CR_MAMMOTH); } catch (e) { /* fall through to error below */ }
  }
  const mammoth = window.mammoth;
  if (!mammoth || !mammoth.extractRawText) throw new Error("Parser DOCX gagal dimuat dari jaringan. Tempel teks manual.");
  const buf = await file.arrayBuffer();
  const out = await mammoth.extractRawText({ arrayBuffer: buf });
  return out.value || "";
}
async function crReadPdf(file, onProgress) {
  await crLoadScript(CR_PDFJS);
  const pdfjsLib = window.pdfjsLib || window["pdfjs-dist/build/pdf"];
  if (!pdfjsLib) throw new Error("Parser PDF gagal dimuat.");
  try { pdfjsLib.GlobalWorkerOptions.workerSrc = CR_PDFJS_WORKER; } catch (e) {}
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let text = "", chars = 0;
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const line = content.items.map((it) => it.str).join(" ");
    text += line + "\n\n";
    chars += line.length;
    if (onProgress) onProgress(Math.round((p / pdf.numPages) * 100), p, pdf.numPages);
  }
  return { text, pages: pdf.numPages, likelyScanned: chars < pdf.numPages * 40 };
}
async function crOcrPdf(file, lang, onProgress) {
  // best-effort OCR fallback for scanned PDFs: rasterize pages then recognize
  await crLoadScript(CR_PDFJS);
  await crLoadScript(CR_TESS);
  const pdfjsLib = window.pdfjsLib;
  const Tesseract = window.Tesseract;
  if (!pdfjsLib || !Tesseract) throw new Error("OCR engine tidak tersedia.");
  try { pdfjsLib.GlobalWorkerOptions.workerSrc = CR_PDFJS_WORKER; } catch (e) {}
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let text = "";
  const N = Math.min(pdf.numPages, 20); // cap OCR to 20 pages for responsiveness
  for (let p = 1; p <= N; p++) {
    const page = await pdf.getPage(p);
    const vp = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = vp.width; canvas.height = vp.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
    const res = await Tesseract.recognize(canvas, lang || "ind+eng");
    text += (res.data.text || "") + "\n\n";
    if (onProgress) onProgress(Math.round((p / N) * 100), p, N);
  }
  return text;
}

/* ---------- clause detection & classification ---------- */
function crClassify(text) {
  const t = (text || "").toLowerCase();
  let best = "general", bestScore = 0;
  for (const ty of CR_TYPES) {
    if (!ty.kw.length) continue;
    let s = 0;
    for (const k of ty.kw) { if (t.includes(k)) s += k.length > 6 ? 2 : 1; }
    if (s > bestScore) { bestScore = s; best = ty.id; }
  }
  return CR_TYPES.find((x) => x.id === best) || CR_TYPES[CR_TYPES.length - 1];
}
function crSplitClauses(raw) {
  const text = (raw || "").replace(/\r/g, "").replace(/\u00a0/g, " ");
  const lines = text.split("\n");
  // numbering markers: "Pasal 12", "Article 3", "12.", "12.3", "PASAL ...", roman, ALLCAPS headings
  const headRe = /^\s*((pasal|article|clause|bab|section)\s+[0-9ivxlcdm]+|[0-9]+(\.[0-9]+)*\.?|[ivxlcdm]+\.)\b/i;
  const allCaps = /^[A-Z0-9 .,;:&()\/'"-]{8,80}$/;
  const blocks = [];
  let cur = null;
  const push = () => { if (cur && cur.body.trim().length > 2) blocks.push(cur); };
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    const trimmed = ln.trim();
    const isHead = headRe.test(ln) || (allCaps.test(trimmed) && /[A-Z]{4,}/.test(trimmed) && trimmed.split(" ").length <= 9 && !/[a-z]/.test(trimmed));
    if (isHead) {
      push();
      const m = ln.match(headRe);
      cur = { num: m ? m[0].trim().replace(/\.$/, "") : "", heading: trimmed.slice(0, 110), body: "" };
    } else {
      if (!cur) cur = { num: "", heading: "Pembukaan / Preamble", body: "" };
      cur.body += (cur.body ? " " : "") + trimmed;
    }
  }
  push();
  // fallback: if too few blocks, split by blank-line paragraphs
  let result = blocks;
  if (result.length < 3) {
    result = text.split(/\n\s*\n+/).map((p, i) => ({ num: String(i + 1), heading: "", body: p.trim() })).filter((b) => b.body.length > 20);
  }
  return result.slice(0, 120).map((b, i) => {
    const ty = crClassify(b.heading + " " + b.body);
    return { idx: i, num: b.num || String(i + 1), heading: b.heading || ty.label, type: ty.id, typeLabel: ty.label, baseRisk: ty.base, text: b.body.slice(0, 4000) };
  });
}

/* ---------- deterministic heuristic review (always-on fallback) ---------- */
/* ---------- deep clause analysis: reasoning + deficiency + suggested redraft ---------- */
const CR_XLSX = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";

/* Per clause type: WHY it matters, WHICH parts to check (gap if regex absent),
   and a concrete model redraft the user can lift into the contract. */
const CR_CLAUSE_ANALYSIS = {
  force_majeure: {
    reasoning: "Definisi force majeure yang sempit berbahaya bagi pihak yang harus berprestasi: bila peristiwa di luar kendali (mis. pandemi, larangan pemerintah, kelangkaan bahan baku, gangguan logistik) tidak masuk daftar, pihak tersebut tetap dianggap wanprestasi padahal gagal memenuhi kewajiban bukan karena kesalahannya.",
    checks: [
      { re: /(di luar (kekuasaan|kendali)|beyond.*control|termasuk namun tidak terbatas|tidak terbatas pada|dan sebab[- ]sebab lain|dan lain-lain)/i, gap: "Daftar keadaan memaksa bersifat tertutup/terbatas — tidak ada klausul penyapu ('termasuk namun tidak terbatas pada' / 'peristiwa lain di luar kendali wajar Para Pihak'), sehingga peristiwa seperti pandemi, perang, larangan pemerintah, kelangkaan bahan baku, atau gangguan logistik tidak terlindungi." },
      { re: /(pemberitahuan|memberitahukan|notice|notify)/i, gap: "Tidak ada kewajiban pemberitahuan tertulis dalam jangka waktu tertentu beserta bukti pendukung." },
      { re: /(penangguhan|ditangguhkan|perpanjangan waktu|diperpanjang|dibebaskan|tidak dianggap wanprestasi|mengakhiri)/i, gap: "Tidak mengatur akibat hukum: penangguhan kewajiban, perpanjangan jangka waktu, dan hak mengakhiri bila berkepanjangan." },
      { re: /(upaya wajar|mitigasi|meminimalkan|reasonable efforts)/i, gap: "Tidak ada kewajiban melakukan upaya wajar untuk memitigasi dampak." },
    ],
    redraft:
      "(1) Keadaan Memaksa adalah peristiwa di luar kekuasaan dan kendali wajar Para Pihak yang tidak dapat diperkirakan dan dihindari sebelumnya, termasuk namun tidak terbatas pada: bencana alam (gempa bumi, banjir, tanah longsor), kebakaran, wabah/pandemi, perang/huru-hara, pemogokan massal, tindakan atau larangan/kebijakan Pemerintah, kelangkaan bahan baku yang bersifat menyeluruh, serta gangguan logistik/transportasi yang material.\n(2) Pihak yang mengalami Keadaan Memaksa wajib memberitahukan secara tertulis kepada Pihak lainnya selambat-lambatnya 7 (tujuh) hari kalender sejak peristiwa terjadi, disertai bukti yang memadai.\n(3) Selama Keadaan Memaksa berlangsung, pelaksanaan kewajiban yang terdampak ditangguhkan dan jangka waktunya diperpanjang sepanjang durasi Keadaan Memaksa, tanpa Pihak yang terdampak dianggap wanprestasi.\n(4) Para Pihak wajib melakukan upaya wajar untuk memitigasi dampak Keadaan Memaksa.\n(5) Apabila Keadaan Memaksa berlangsung lebih dari 60 (enam puluh) hari berturut-turut, masing-masing Pihak berhak mengakhiri Perjanjian secara tertulis tanpa kewajiban ganti rugi, dengan tetap menyelesaikan kewajiban yang telah timbul sebelumnya.",
  },
  liability: {
    reasoning: "Tanpa batas (cap) dan pengecualian, satu pihak bisa menanggung kerugian yang jauh melampaui nilai kontrak, termasuk kerugian tidak langsung yang sulit diprediksi — eksposur finansial menjadi tidak terkendali.",
    checks: [
      { re: /(batas|cap|maksimum|maksimal|paling banyak|limit)/i, gap: "Tidak ada batas (cap) nilai tanggung jawab — sebaiknya dibatasi sebesar nilai Perjanjian." },
      { re: /(tidak langsung|konsekuensial|consequential|kehilangan keuntungan|loss of profit)/i, gap: "Tidak mengecualikan kerugian tidak langsung/konsekuensial dan kehilangan keuntungan." },
      { re: /(kesengajaan|kelalaian berat|gross negligence|willful)/i, gap: "Tidak ada carve-out: pembatasan seharusnya tidak berlaku untuk kesengajaan/kelalaian berat, pelanggaran kerahasiaan, atau HKI." },
    ],
    redraft:
      "(1) Tanggung jawab masing-masing Pihak atas kerugian yang timbul dari Perjanjian ini dibatasi maksimal sebesar nilai Perjanjian.\n(2) Tidak ada Pihak yang bertanggung jawab atas kerugian tidak langsung, konsekuensial, kehilangan keuntungan, atau kehilangan kesempatan usaha.\n(3) Pembatasan pada ayat (1) dan (2) tidak berlaku terhadap kerugian akibat kesengajaan, kelalaian berat, pelanggaran kerahasiaan, atau pelanggaran Hak Kekayaan Intelektual.",
  },
  termination: {
    reasoning: "Hak mengakhiri secara sepihak tanpa pemberitahuan dan tanpa kesempatan memperbaiki membuat posisi pihak lain rentan: kontrak bisa diputus mendadak sehingga investasi/persiapan yang sudah dikeluarkan hangus.",
    checks: [
      { re: /(pemberitahuan|notice|tertulis sebelum)/i, gap: "Tidak ada kewajiban pemberitahuan tertulis sebelum pengakhiran (notice period)." },
      { re: /(memperbaiki|cure|kesempatan.*perbaik|30 hari|tiga puluh hari)/i, gap: "Tidak ada kesempatan memperbaiki wanprestasi (cure period) sebelum diakhiri." },
      { re: /(kewajiban.*timbul|tetap berlaku|telah timbul|sebelum.*pengakhiran)/i, gap: "Tidak menegaskan kewajiban yang sudah timbul tetap harus diselesaikan setelah pengakhiran." },
    ],
    redraft:
      "(1) Suatu Pihak dapat mengakhiri Perjanjian apabila Pihak lain wanprestasi dan tidak memperbaikinya dalam 30 (tiga puluh) hari kalender sejak pemberitahuan tertulis (cure period).\n(2) Pengakhiran untuk kemudahan (tanpa sebab) hanya dapat dilakukan dengan pemberitahuan tertulis 30 (tiga puluh) hari sebelumnya.\n(3) Pengakhiran tidak menghapus kewajiban yang telah timbul sebelum tanggal efektif pengakhiran.",
  },
  payment: {
    reasoning: "Termin panjang tanpa konsekuensi keterlambatan membebani arus kas pihak pemasok: tidak ada insentif bagi pembeli untuk membayar tepat waktu dan tidak ada hak menahan pasokan bila menunggak.",
    checks: [
      { re: /(\d+\s*hari|jatuh tempo|due)/i, gap: "Tenggat pembayaran tidak dinyatakan tegas (jumlah hari sejak invoice)." },
      { re: /(denda|bunga|penalti|interest|keterlambatan)/i, gap: "Tidak ada denda/bunga keterlambatan — sebaiknya mis. 1% per bulan dari jumlah tertunggak." },
      { re: /(menangguhkan|menahan|suspend|menghentikan pasokan)/i, gap: "Tidak ada hak menangguhkan pasokan bila pembayaran menunggak." },
    ],
    redraft:
      "(1) Pembayaran dilakukan selambat-lambatnya 30 (tiga puluh) hari kalender sejak tanggal invoice yang sah diterima.\n(2) Keterlambatan pembayaran dikenakan denda sebesar 1% (satu persen) per bulan dari jumlah tertunggak, dihitung secara pro rata harian.\n(3) Apabila keterlambatan melebihi 30 (tiga puluh) hari, Pemasok berhak menangguhkan pasokan setelah pemberitahuan tertulis, tanpa dianggap wanprestasi.",
  },
  confidentiality: {
    reasoning: "Tanpa jangka waktu pasca-pengakhiran dan pengecualian yang jelas, kewajiban kerahasiaan bisa dianggap berakhir bersamaan dengan kontrak (informasi sensitif tak lagi terlindungi) atau justru terlalu kabur untuk ditegakkan.",
    checks: [
      { re: /(setelah.*berakhir|pasca|tahun|survive|tetap berlaku)/i, gap: "Tidak ada jangka waktu kerahasiaan yang tetap berlaku setelah Perjanjian berakhir (mis. 3 tahun)." },
      { re: /(pengecualian|tidak termasuk|kecuali|publik|wajib diungkap)/i, gap: "Tidak ada pengecualian (informasi publik, sudah dimiliki sah, atau wajib diungkap berdasarkan hukum)." },
      { re: /(dikembalikan|dimusnahkan|return|destroy)/i, gap: "Tidak mengatur pengembalian/pemusnahan informasi setelah berakhir." },
    ],
    redraft:
      "(1) Para Pihak wajib menjaga kerahasiaan Informasi Rahasia dan hanya menggunakannya untuk pelaksanaan Perjanjian.\n(2) Kewajiban kerahasiaan tetap berlaku selama 3 (tiga) tahun setelah Perjanjian berakhir.\n(3) Tidak termasuk Informasi Rahasia: informasi yang telah menjadi milik publik tanpa pelanggaran, telah dimiliki secara sah sebelumnya, atau wajib diungkapkan berdasarkan hukum/putusan dengan pemberitahuan terlebih dahulu.\n(4) Atas permintaan, Informasi Rahasia dikembalikan atau dimusnahkan setelah Perjanjian berakhir.",
  },
  governing_law: {
    reasoning: "Bila para pihak dan pelaksanaan kontrak berada di Indonesia namun tunduk pada hukum/forum asing, penegakan menjadi mahal, lambat, dan tidak pasti bagi pihak domestik.",
    checks: [
      { re: /(hukum.*indonesia|republik indonesia|hukum negara)/i, gap: "Hukum yang berlaku bukan/atau belum tegas hukum Indonesia (potensi tunduk pada hukum asing)." },
      { re: /(bani|pengadilan negeri|arbitrase.*indonesia|musyawarah)/i, gap: "Forum penyelesaian sengketa belum jelas atau berada di luar negeri." },
    ],
    redraft:
      "Perjanjian ini tunduk pada dan ditafsirkan menurut hukum Negara Republik Indonesia. Setiap perselisihan diselesaikan terlebih dahulu secara musyawarah untuk mufakat; apabila tidak tercapai dalam 30 (tiga puluh) hari, diselesaikan melalui Badan Arbitrase Nasional Indonesia (BANI) / Pengadilan Negeri yang berwenang.",
  },
  indemnity: {
    reasoning: "Indemnity yang dirumuskan luas ('segala kerugian') tanpa batas dan tanpa proporsionalitas dapat memaksa satu pihak menanggung klaim yang sebenarnya bukan kesalahannya.",
    checks: [
      { re: /(pihak ketiga|third party)/i, gap: "Indemnity tidak dibatasi pada klaim pihak ketiga (berpotensi mencakup kerugian antar-para pihak yang sudah diatur klausul tanggung jawab)." },
      { re: /(batas|maksimum|cap|terbukti|diputus)/i, gap: "Tidak ada batas nilai dan tidak disyaratkan kerugian terbukti/diputus final." },
    ],
    redraft:
      "Pihak pemberi ganti rugi membebaskan Pihak penerima dari klaim pihak ketiga yang timbul akibat pelanggaran Perjanjian, kelalaian, atau pelanggaran HKI oleh Pihak pemberi, sebatas kerugian yang terbukti dan diputus final, dengan batas maksimum sebesar nilai Perjanjian, dan tidak mencakup kerugian akibat kesalahan Pihak penerima.",
  },
  delivery: {
    reasoning: "Tanpa spesifikasi mutu, jadwal, mekanisme penerimaan, dan pemulihan atas cacat, sengketa kualitas/keterlambatan sulit diselesaikan secara objektif.",
    checks: [
      { re: /(spesifikasi|mutu|kualitas|standar)/i, gap: "Spesifikasi/standar mutu tidak dirujuk secara tegas." },
      { re: /(jadwal|tenggat|waktu penyerahan|schedule)/i, gap: "Jadwal/tenggat penyerahan tidak dinyatakan." },
      { re: /(penerimaan|pemeriksaan|inspeksi|acceptance|penolakan)/i, gap: "Tidak ada mekanisme pemeriksaan/penerimaan dan hak menolak barang tidak sesuai." },
    ],
    redraft:
      "(1) Barang/jasa diserahkan sesuai spesifikasi dan standar mutu yang disepakati dalam Lampiran, menurut jadwal yang ditentukan.\n(2) Pembeli berhak memeriksa dan menerima/menolak dalam 7 (tujuh) hari sejak penyerahan; barang yang tidak sesuai wajib diperbaiki atau diganti oleh Pemasok tanpa biaya tambahan dalam waktu yang wajar.",
  },
  warranty: {
    reasoning: "Jaminan tanpa ruang lingkup, jangka waktu, dan pemulihan yang jelas menyulitkan penegakan hak bila terjadi cacat.",
    checks: [
      { re: /(jangka|periode|masa.*jaminan|tahun|bulan)/i, gap: "Jangka waktu jaminan tidak dinyatakan." },
      { re: /(perbaikan|penggantian|pemulihan|remedy)/i, gap: "Pemulihan atas pelanggaran jaminan (perbaikan/penggantian) tidak diatur." },
    ],
    redraft:
      "Pemasok menjamin barang bebas dari cacat material dan sesuai spesifikasi selama 12 (dua belas) bulan sejak penyerahan. Atas pelanggaran jaminan, Pemasok wajib memperbaiki atau mengganti tanpa biaya dalam waktu yang wajar.",
  },
};

/** Returns { reasoning, deficiency: string[], redraft } for a clause. */
function crAnalyzeClause(clause) {
  const body = clause.text || "";
  const cfg = CR_CLAUSE_ANALYSIS[clause.type];
  const deficiency = [];
  if (cfg && cfg.checks) for (const ch of cfg.checks) { if (!ch.re.test(body)) deficiency.push(ch.gap); }
  const reasoning = cfg ? cfg.reasoning
    : "Rumusan klausul perlu ditinjau agar hak dan kewajiban Para Pihak serta alokasi risiko dinyatakan tegas, seimbang, dan dapat ditegakkan.";
  const redraft = cfg ? cfg.redraft : "";
  return { reasoning, deficiency, redraft };
}

/* ---------- data-point (key term) extraction ---------- */
function crFirst(re, text) { const m = text.match(re); return m ? (m[1] || m[0]).trim() : ""; }
function crExtractDataPoints(raw) {
  const text = (raw || "").replace(/\s+/g, " ");
  const parties = [];
  const reParty = /\b((?:PT|CV|Perseroan Terbatas|Koperasi|Yayasan|UD)\.?\s+[A-Z][A-Za-z0-9.&'’\- ]{2,40})/g;
  let m; const seen = new Set();
  while ((m = reParty.exec(text)) && parties.length < 4) { const v = m[1].replace(/\s+/g, " ").trim(); if (!seen.has(v.toLowerCase())) { seen.add(v.toLowerCase()); parties.push(v); } }
  const value = crFirst(/((?:Rp\.?|IDR)\s*[\d][\d.,]*\s*(?:miliar|juta|ribu)?)/i, text);
  const payTerm = crFirst(/(?:pembayaran|dibayar|bayar|invoice|tagihan|jatuh tempo)[^.]{0,60}?(\d{1,3})\s*hari/i, text);
  const lateFee = /(denda|bunga)[^.]{0,40}(keterlambatan|terlambat)|keterlambatan[^.]{0,40}(denda|bunga|\d+\s*%)/i.test(text);
  const startDate = crFirst(/(?:berlaku|mulai|efektif|sejak)[^.]{0,30}?(\d{1,2}\s+\w+\s+\d{4}|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i, text);
  const endDate = crFirst(/(?:sampai|hingga|berakhir|s\/d)[^.]{0,30}?(\d{1,2}\s+\w+\s+\d{4}|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i, text);
  const duration = crFirst(/jangka waktu[^.]{0,30}?(\d{1,3}\s*(?:tahun|bulan))/i, text);
  const renew = /(otomatis|secara langsung)?\s*diperpanjang|perpanjangan otomatis|automatically renew|diperpanjang secara/i.test(text);
  const renewNotice = crFirst(/(?:diperpanjang|perpanjangan)[^.]{0,80}?(\d{1,3})\s*hari/i, text);
  const termNotice = crFirst(/(?:mengakhiri|pengakhiran|memutuskan)[^.]{0,80}?pemberitahuan[^.]{0,30}?(\d{1,3})\s*hari/i, text)
    || crFirst(/pemberitahuan[^.]{0,30}?(\d{1,3})\s*hari[^.]{0,40}?(?:mengakhiri|pengakhiran)/i, text);
  const foreignLaw = /(singapore law|english law|laws of (new york|england|singapore)|hukum.*(singapura|inggris|asing))/i.test(text);
  const idLaw = /(hukum.*indonesia|republik indonesia)/i.test(text);
  const forum = /bani/i.test(text) ? "BANI (Arbitrase)" : /arbitrase/i.test(text) ? "Arbitrase" : /pengadilan negeri/i.test(text) ? "Pengadilan Negeri" : "";
  const NA = "Tidak ditemukan — cek manual";
  return [
    { label: "Para pihak", value: parties.length ? parties.join(" — ") : NA, found: parties.length > 0 },
    { label: "Nilai kontrak", value: value || NA, found: !!value },
    { label: "Termin pembayaran", value: payTerm ? payTerm + " hari sejak invoice" : NA, found: !!payTerm },
    { label: "Denda keterlambatan", value: lateFee ? "Diatur" : "Tidak diatur / tidak ditemukan", found: lateFee },
    { label: "Tanggal mulai", value: startDate || NA, found: !!startDate },
    { label: "Tanggal berakhir", value: endDate || NA, found: !!endDate },
    { label: "Jangka waktu", value: duration || NA, found: !!duration },
    { label: "Perpanjangan otomatis", value: renew ? ("Ya" + (renewNotice ? ", notice " + renewNotice + " hari" : "")) : "Tidak / tidak ditemukan", found: renew },
    { label: "Masa pemberitahuan pengakhiran", value: termNotice ? termNotice + " hari" : NA, found: !!termNotice },
    { label: "Hukum yang berlaku", value: foreignLaw ? "Hukum asing (perlu dicermati)" : idLaw ? "Hukum Indonesia" : NA, found: foreignLaw || idLaw },
    { label: "Forum penyelesaian sengketa", value: forum || NA, found: !!forum },
  ];
}
async function crAIDataPoints(text, ctx) {
  return ContractReviewAgent.extractDataPoints(text, ctx);
}
function crMergeDataPoints(heur, aiPoints) {
  if (!aiPoints) return heur;
  return heur.map((d) => {
    const v = aiPoints[d.label];
    if (v && String(v).trim() && String(v).trim() !== "-") return { label: d.label, value: String(v).trim(), found: true };
    return d;
  });
}

/* ---------- Excel export (SheetJS via CDN) with CSV fallback ---------- */
function crCsvCell(v) { const s = String(v == null ? "" : v).replace(/"/g, '""'); return /[",\n]/.test(s) ? '"' + s + '"' : s; }
function crDownload(blob, name) {
  const url = URL.createObjectURL(blob); const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
function crExportCsvFallback(rec) {
  const base = "Tinjauan_Kontrak_" + (rec.name || "kontrak").replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/gi, "_");
  let csv = "DATA POIN KONTRAK\nData Poin,Nilai\n";
  (rec.dataPoints || []).forEach((d) => { csv += crCsvCell(d.label) + "," + crCsvCell(d.value) + "\n"; });
  csv += "\nANALISA KLAUSUL\nNo,Jenis,Risiko,Bagian yang kurang,Saran rumusan pengganti\n";
  rec.clauses.forEach((c) => {
    const rv = c.review;
    csv += [c.num, rv.typeLabel, CR_RISK_LABEL[rv.risk], (rv.deficiency || []).join("; "), (rv.suggestedRedraft || "").replace(/\n/g, " ")].map(crCsvCell).join(",") + "\n";
  });
  crDownload(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }), base + ".csv");
}
async function crExportXlsx(rec) {
  try {
    if (!window.XLSX) await crLoadScript(CR_XLSX);
    const XLSX = window.XLSX;
    if (!XLSX) throw new Error("no xlsx");
    const wb = XLSX.utils.book_new();

    const dpAoa = [["Data Poin", "Nilai"], ...((rec.dataPoints || []).map((d) => [d.label, d.value]))];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dpAoa), "Data Poin");

    const clHead = ["No", "Jenis", "Risiko", "Ringkasan", "Kenapa berisiko", "Bagian yang kurang", "Saran rumusan pengganti", "Kekhawatiran komersial", "Sumber"];
    const clAoa = [clHead, ...rec.clauses.map((c) => {
      const rv = c.review;
      return [c.num, rv.typeLabel, CR_RISK_LABEL[rv.risk], rv.summary, rv.reasoning || "", (rv.deficiency || []).join("\n"), rv.suggestedRedraft || "", rv.commercialConcern || "", rv.source === "ai" ? "AI Counsel" : "Heuristik"];
    })];
    const wsCl = XLSX.utils.aoa_to_sheet(clAoa);
    wsCl["!cols"] = [{ wch: 8 }, { wch: 22 }, { wch: 10 }, { wch: 40 }, { wch: 50 }, { wch: 50 }, { wch: 60 }, { wch: 30 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsCl, "Analisa Klausul");

    const sumAoa = [
      ["Dokumen", rec.name], ["Perspektif", rec.ctx], ["Skor risiko", rec.risk.score], ["Kategori", rec.risk.category],
      ["Risiko tinggi", rec.risk.high], ["Risiko sedang", rec.risk.med], ["Risiko rendah", rec.risk.low], [],
      ["RED FLAG KRITIS"], ...rec.risk.redFlags.map((f) => ["[" + f.num + "] " + f.type, f.concern]), [],
      ["POIN NEGOSIASI"], ...rec.risk.negotiation.map((n) => ["[" + n.num + "] " + n.type, n.ask]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sumAoa), "Ringkasan");

    const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const base = "Tinjauan_Kontrak_" + (rec.name || "kontrak").replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/gi, "_");
    crDownload(new Blob([out], { type: "application/octet-stream" }), base + ".xlsx");
  } catch (e) {
    crExportCsvFallback(rec); // network blocked → still give them a spreadsheet
  }
}

const CR_FLAGS = [
  { re: /(unlimited|tanpa batas|tak terbatas)/i, risk: "high", legal: "Tanggung jawab tanpa batas — eksposur tidak terbatas.", improve: "Tambahkan batas (cap) tanggung jawab sebesar nilai kontrak." },
  { re: /(sole discretion|kebijakan sepihak|sepenuhnya|sewaktu-waktu tanpa)/i, risk: "high", legal: "Diskresi sepihak pihak lawan.", improve: "Wajibkan kriteria objektif & pemberitahuan tertulis." },
  { re: /(terminate.*without|mengakhiri.*tanpa|tanpa pemberitahuan|immediate(ly)? terminat)/i, risk: "high", legal: "Pengakhiran tanpa pemberitahuan / tanpa sebab.", improve: "Syaratkan notice period (mis. 30 hari) & cure period." },
  { re: /(penalty|denda|liquidated damages)/i, risk: "med", legal: "Klausul denda — periksa proporsionalitas.", improve: "Pastikan denda wajar & berkorelasi dengan kerugian nyata." },
  { re: /(indemnif|membebaskan.*dari segala|hold harmless)/i, risk: "med", legal: "Kewajiban indemnity berpotensi luas.", improve: "Batasi indemnity pada klaim pihak ketiga yang terbukti." },
  { re: /(exclusive|eksklusif|tidak dapat dialihkan tanpa)/i, risk: "med", legal: "Pembatasan/eksklusivitas.", improve: "Tinjau dampak komersial eksklusivitas." },
  { re: /(governing law|hukum.*asing|new york|singapore law|english law)/i, risk: "med", legal: "Hukum/forum yang berlaku perlu dicek (potensi asing).", improve: "Utamakan hukum & forum Indonesia bila para pihak domestik." },
];
function crHeuristicOne(clause) {
  const body = clause.text || "";
  let risk = clause.baseRisk >= 3 ? "med" : "low";
  const legal = [], improve = [];
  for (const f of CR_FLAGS) {
    if (f.re.test(body)) {
      if (CR_RISK[f.risk] > CR_RISK[risk]) risk = f.risk;
      legal.push(f.legal); improve.push(f.improve);
    }
  }
  const missing = [];
  if (clause.type === "liability" && !/cap|batas|maksimum|limit/i.test(body)) missing.push("Batas (cap) tanggung jawab.");
  if (clause.type === "termination" && !/notice|pemberitahuan|cure|kesempatan memperbaiki/i.test(body)) missing.push("Notice & cure period.");
  if (clause.type === "confidentiality" && !/jangka|tahun|setelah berakhir|survive/i.test(body)) missing.push("Jangka waktu kerahasiaan pasca-pengakhiran.");
  if (clause.type === "payment" && !/denda|bunga|keterlambatan|jatuh tempo/i.test(body)) missing.push("Konsekuensi keterlambatan / jatuh tempo.");
  if ((clause.type === "general" || clause.type === "scope") && !/force majeure|keadaan memaksa/i.test(body) && body.length > 200) { /* noted at contract level */ }
  if (!legal.length) legal.push("Tidak terdeteksi isu berisiko tinggi secara otomatis; tetap perlu tinjauan manusia.");
  const analysis = crAnalyzeClause(clause);
  // a real structural gap (e.g. force majeure too narrow) lifts a 'low' to 'med'
  if (analysis.deficiency.length > 0 && risk === "low") risk = "med";
  const improvements = [...improve, ...analysis.deficiency.map((d) => "Lengkapi/perluas rumusan: " + d)].slice(0, 4);
  const summary = (clause.heading ? clause.heading + " — " : "") + body.slice(0, 150) + (body.length > 150 ? "…" : "");
  return {
    type: clause.type, typeLabel: clause.typeLabel, summary,
    risk, legalConcern: legal[0],
    reasoning: analysis.reasoning,
    deficiency: analysis.deficiency,
    suggestedRedraft: analysis.deficiency.length > 0 ? analysis.redraft : "",
    commercialConcern: clause.type === "payment" || clause.type === "delivery" ? "Berdampak langsung pada arus kas / kewajiban operasional." : "Tinjau keseimbangan komersial antar pihak.",
    missing, improvements: improvements.length ? improvements : ["Perjelas rumusan & alokasi risiko; selaraskan dengan praktik pasar."],
    source: "heuristic",
  };
}

/* ---------- AI review via KNSL Contract Review Agent ---------- */
async function crAIReviewBatch(clauses, ctx, contractContext) {
  return ContractReviewAgent.reviewClauses(clauses, ctx, contractContext);
}
async function crReview(clauses, ctx, useAI, onProgress, fullText) {
  const out = clauses.map((c) => ({ ...c, review: crHeuristicOne(c) }));
  if (!useAI) { if (onProgress) onProgress(100); return { clauses: out, aiHits: 0, aiError: null }; }
  let contractContext = null;
  let aiHits = 0;
  let lastError = null;
  if (fullText && fullText.trim()) {
    try { contractContext = await ContractReviewAgent.extractContractContext(fullText, ctx); } catch (e) { /* optional */ }
  }
  const B = 3;
  let done = 0;
  for (let i = 0; i < clauses.length; i += B) {
    const batch = clauses.slice(i, i + B);
    try {
      const map = await crAIReviewBatch(batch, ctx, contractContext);
      for (const c of batch) {
        const r = map[c.idx];
        const h = out[c.idx].review;
        if (r && r.risk) {
          aiHits++;
          out[c.idx].review = {
            type: c.type, typeLabel: c.typeLabel, summary: r.summary || h.summary,
            risk: (["high", "med", "low"].includes(r.risk) ? r.risk : h.risk),
            legalConcern: r.legalConcern || h.legalConcern,
            commercialConcern: r.commercialConcern || h.commercialConcern,
            reasoning: r.reasoning || h.reasoning,
            deficiency: Array.isArray(r.deficiency) && r.deficiency.length ? r.deficiency : h.deficiency,
            suggestedRedraft: (typeof r.suggestedRedraft === "string" && r.suggestedRedraft.trim()) ? r.suggestedRedraft.trim() : h.suggestedRedraft,
            missing: Array.isArray(r.missing) ? r.missing : h.missing,
            improvements: Array.isArray(r.improvements) && r.improvements.length ? r.improvements : h.improvements,
            source: "ai",
          };
        }
      }
    } catch (e) { lastError = String(e.message || e); }
    done += batch.length;
    if (onProgress) onProgress(Math.round((done / clauses.length) * 100));
  }
  return { clauses: out, aiHits, aiError: aiHits ? null : (lastError || getLastAiError() || "AI tidak merespons — cek API key / provider.") };
}

/* ---------- risk engine ---------- */
function crRiskEngine(reviewed) {
  if (!reviewed.length) return { score: 0, category: "—", high: 0, med: 0, low: 0, redFlags: [], negotiation: [] };
  let sum = 0;
  const counts = { high: 0, med: 0, low: 0 };
  const redFlags = [], negotiation = [];
  for (const c of reviewed) {
    const r = c.review.risk; counts[r]++;
    sum += CR_RISK[r] * (c.baseRisk || 1);
    if (r === "high") redFlags.push({ num: c.num, type: c.typeLabel, concern: c.review.legalConcern });
    if (r !== "low" && c.review.improvements && c.review.improvements[0]) negotiation.push({ num: c.num, type: c.typeLabel, ask: c.review.improvements[0] });
  }
  const maxPossible = reviewed.reduce((a, c) => a + CR_RISK.high * (c.baseRisk || 1), 0) || 1;
  const score = Math.round((sum / maxPossible) * 100);
  const category = score >= 66 ? "Risiko Tinggi" : score >= 40 ? "Risiko Sedang" : "Risiko Rendah";
  return { score, category, high: counts.high, med: counts.med, low: counts.low, redFlags: redFlags.slice(0, 12), negotiation: negotiation.slice(0, 12) };
}

/* ---------- report builder (DOCX/PDF, reuses print infra) ---------- */
function crEsc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function crReportHTML(rec) {
  const r = rec.risk;
  const blocks = rec.clauses.map((c) => {
    const rv = c.review;
    const defic = (rv.deficiency && rv.deficiency.length) ? `<div class="box amber"><b>Bagian yang kurang / perlu dikoreksi:</b><ul>${rv.deficiency.map((d) => "<li>" + crEsc(d) + "</li>").join("")}</ul></div>` : "";
    const redraft = rv.suggestedRedraft ? `<div class="box green"><b>Saran rumusan pengganti:</b><div class="pre">${crEsc(rv.suggestedRedraft)}</div></div>` : "";
    const missing = (rv.missing && rv.missing.length) ? `<div><b>Proteksi yang hilang:</b> ${rv.missing.map(crEsc).join("; ")}</div>` : "";
    return `<div class="clause">
      <div class="ch"><span class="cn">${crEsc(c.num)}</span> <b>${crEsc(rv.typeLabel)}</b> <span class="risk risk-${rv.risk}">${CR_RISK_LABEL[rv.risk]}</span> <span class="src">${rv.source === "ai" ? "AI Counsel" : "Heuristik"}</span></div>
      <div class="cb"><b>Ringkasan:</b> ${crEsc(rv.summary)}</div>
      ${rv.reasoning ? `<div class="cb"><b>Kenapa berisiko:</b> ${crEsc(rv.reasoning)}</div>` : ""}
      <div class="cb"><b>Kekhawatiran hukum:</b> ${crEsc(rv.legalConcern)} <i>(${crEsc(rv.commercialConcern)})</i></div>
      ${missing}
      ${defic}
      ${redraft}
    </div>`;
  }).join("");
  const dpRows = (rec.dataPoints || []).map((d) => `<tr><td style="width:34%;font-weight:bold">${crEsc(d.label)}</td><td>${crEsc(d.value)}</td></tr>`).join("");
  const flags = r.redFlags.length ? r.redFlags.map((f) => `<li><b>[${crEsc(f.num)}] ${crEsc(f.type)}:</b> ${crEsc(f.concern)}</li>`).join("") : "<li>Tidak ada red flag kritis terdeteksi otomatis.</li>";
  const negs = r.negotiation.length ? r.negotiation.map((n) => `<li><b>[${crEsc(n.num)}] ${crEsc(n.type)}:</b> ${crEsc(n.ask)}</li>`).join("") : "<li>—</li>";
  return `<!doctype html><html><head><meta charset="utf-8"><title>Contract Review Report</title>
  <style>
    @page{size:A4;margin:2cm}
    body{font-family:'Times New Roman',Georgia,serif;color:#111;font-size:12px;line-height:1.5}
    h1{font-size:20px;margin:0 0 2px;letter-spacing:.5px}
    h2{font-size:14px;border-bottom:1.5px solid #0c4a33;padding-bottom:4px;margin:22px 0 10px;color:#0c4a33}
    .sub{color:#666;font-size:11px;margin-bottom:14px}
    .meta td,.dp td{padding:3px 8px 3px 0}
    table.dp{width:100%;border-collapse:collapse;font-size:11px}
    table.dp td{border:1px solid #ddd;padding:5px 8px}
    .scorebox{display:inline-block;border:2px solid #0c4a33;border-radius:8px;padding:10px 18px;text-align:center;margin-right:14px}
    .scorebox .n{font-size:28px;font-weight:bold;color:#0c4a33}
    .risk{font-weight:bold;padding:2px 7px;border-radius:10px;font-size:9.5px;text-transform:uppercase}
    .risk-high{background:#fde2dd;color:#b3261e}.risk-med{background:#fbf2da;color:#9a7a18}.risk-low{background:#dcf3e9;color:#0c6b48}
    .clause{border:1px solid #e2e2e2;border-radius:8px;padding:10px 12px;margin:10px 0;page-break-inside:avoid}
    .ch{font-size:13px;margin-bottom:6px}.cn{font-weight:bold;color:#0c4a33;margin-right:4px}.src{color:#888;font-size:10px;float:right}
    .cb{font-size:11.5px;margin:4px 0}
    .box{margin-top:7px;padding:8px 10px;border-radius:6px;font-size:11px}
    .box ul{margin:4px 0 0 18px;padding:0}
    .amber{background:#fbf4e2;border:1px solid #e6d39a}
    .green{background:#e6f4ee;border:1px solid #b6ddc9}
    .pre{white-space:pre-wrap;margin-top:4px;font-family:'Courier New',monospace;font-size:10.5px;line-height:1.55}
    .disc{margin-top:24px;border-top:1px solid #ccc;padding-top:10px;font-size:10px;color:#666;font-style:italic}
    ul{margin:6px 0 0 18px;padding:0}
  </style></head><body>
  <h1>MEMORANDUM TINJAUAN KONTRAK</h1>
  <div class="sub">KNSL Legal Intelligence · Contract Review AI · ${new Date(rec.ts).toLocaleString("id-ID")}</div>
  <table class="meta">
    <tr><td><b>Dokumen</b></td><td>: ${crEsc(rec.name)}</td></tr>
    <tr><td><b>Perspektif tinjauan</b></td><td>: ${crEsc(rec.ctx || "Pihak peninjau")}</td></tr>
    <tr><td><b>Jumlah klausul</b></td><td>: ${rec.clauses.length}</td></tr>
    <tr><td><b>Mesin</b></td><td>: ${rec.usedAI ? "AI Counsel (Claude) + heuristik" : "Heuristik deterministik"}</td></tr>
  </table>
  <h2>1. Ringkasan Eksekutif</h2>
  <div class="scorebox"><div class="n">${r.score}</div><div style="font-size:9px">SKOR RISIKO</div></div>
  <div class="scorebox"><div class="n" style="font-size:16px">${crEsc(r.category)}</div><div style="font-size:9px">KATEGORI</div></div>
  <div class="scorebox"><div class="n" style="color:#b3261e">${r.high}</div><div style="font-size:9px">RISIKO TINGGI</div></div>
  <div class="scorebox"><div class="n" style="color:#9a7a18">${r.med}</div><div style="font-size:9px">RISIKO SEDANG</div></div>
  <h2>2. Data Poin Kontrak</h2>
  <table class="dp"><tbody>${dpRows || '<tr><td colspan="2">—</td></tr>'}</tbody></table>
  <h2>3. Red Flag Kritis</h2><ul>${flags}</ul>
  <h2>4. Poin Negosiasi</h2><ul>${negs}</ul>
  <h2>5. Analisa Klausul (koreksi & saran rumusan)</h2>
  ${blocks}
  <div class="disc">Dokumen ini dihasilkan oleh mesin tinjauan otomatis sebagai alat bantu triase dan penataan. <b>Bukan nasihat hukum, bukan vonis</b>, dan tidak menggantikan pertimbangan advokat. Verifikasi setiap rumusan terhadap teks kontrak asli dan peraturan yang berlaku.</div>
  </body></html>`;
}
function crExportReport(rec, mode) {
  const html = crReportHTML(rec);
  if (mode === "word") {
    const blob = new Blob(["\ufeff" + html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "Tinjauan_Kontrak_" + rec.name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/gi, "_") + ".doc";
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  } else {
    const ifr = document.createElement("iframe");
    ifr.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    document.body.appendChild(ifr);
    const doc = ifr.contentWindow.document; doc.open(); doc.write(html); doc.close();
    setTimeout(() => { try { ifr.contentWindow.focus(); ifr.contentWindow.print(); } catch (e) {} setTimeout(() => ifr.remove(), 1500); }, 350);
  }
}

/* ============================================================
   UI components
   ============================================================ */
function CrGauge({ score, category }) {
  const color = score >= 66 ? "#dc4437" : score >= 40 ? "#d8c08a" : "#1fb37e";
  const data = [{ name: "risk", value: score, fill: color }];
  return (
    <div style={{ position: "relative", width: "100%", height: 190 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="74%" outerRadius="100%" data={data} startAngle={220} endAngle={-40}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar background={{ fill: "rgba(255,255,255,0.05)" }} dataKey="value" cornerRadius={20} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
        <div>
          <div className="gauge-num serif" style={{ fontSize: 44, fontWeight: 700, lineHeight: 1, color }}>{score}</div>
          <div style={{ fontSize: 11.5, letterSpacing: "1px", color: "var(--muted)", textTransform: "uppercase", marginTop: 4 }}>Skor Risiko</div>
          <div style={{ fontSize: 13, color: "var(--silver)", marginTop: 6, fontWeight: 600 }}>{category}</div>
        </div>
      </div>
    </div>
  );
}

function CrClauseCard({ c, open, onToggle }) {
  const rv = c.review;
  return (
    <div className="glass" style={{ padding: 0, overflow: "hidden", borderLeft: `2px solid ${rv.risk === "high" ? "#dc4437" : rv.risk === "med" ? "#d8c08a" : "#1fb37e"}` }}>
      <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }}>
        <span className="gold-text serif" style={{ fontSize: 14, fontWeight: 700, minWidth: 54 }}>{c.num}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{rv.typeLabel}</div>
          <div style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.heading}</div>
        </div>
        {rv.source === "ai" && <Sparkles size={13} className="gold-text" />}
        <Badge risk={rv.risk}>{CR_RISK_LABEL[rv.risk]}</Badge>
        <ChevronDown size={16} style={{ color: "var(--muted)", transform: open ? "rotate(180deg)" : "none", transition: "transform .3s" }} />
      </div>
      {open && (
        <div className="view-enter" style={{ padding: "0 16px 16px 16px", display: "grid", gap: 10 }}>
          <div className="hairline" />
          <div><div style={{ fontSize: 10.5, letterSpacing: "1px", textTransform: "uppercase", color: "var(--muted-2)", marginBottom: 4 }}>Ringkasan</div><p style={{ margin: 0, fontSize: 13, color: "var(--silver)", lineHeight: 1.6 }}>{rv.summary}</p></div>
          {rv.reasoning && (
            <div><div style={{ fontSize: 10.5, letterSpacing: "1px", textTransform: "uppercase", color: "var(--muted-2)", marginBottom: 4 }}>Kenapa Berisiko</div><p style={{ margin: 0, fontSize: 13, color: "var(--silver)", lineHeight: 1.6 }}>{rv.reasoning}</p></div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><div style={{ fontSize: 10.5, letterSpacing: "1px", textTransform: "uppercase", color: "var(--muted-2)", marginBottom: 4 }}>Kekhawatiran Hukum</div><p style={{ margin: 0, fontSize: 12.5, color: "var(--silver)", lineHeight: 1.55 }}>{rv.legalConcern}</p></div>
            <div><div style={{ fontSize: 10.5, letterSpacing: "1px", textTransform: "uppercase", color: "var(--muted-2)", marginBottom: 4 }}>Kekhawatiran Komersial</div><p style={{ margin: 0, fontSize: 12.5, color: "var(--silver)", lineHeight: 1.55 }}>{rv.commercialConcern}</p></div>
          </div>
          {rv.deficiency && rv.deficiency.length > 0 && (
            <div style={{ padding: 12, borderRadius: 10, background: "rgba(216,192,138,0.06)", border: "1px solid rgba(216,192,138,0.22)" }}>
              <div style={{ fontSize: 10.5, letterSpacing: "1px", textTransform: "uppercase", color: "var(--champagne)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={12} /> Bagian yang Kurang / Perlu Dikoreksi</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>{rv.deficiency.map((m, i) => <li key={i} style={{ fontSize: 12.5, color: "var(--silver)", lineHeight: 1.6, marginBottom: 3 }}>{m}</li>)}</ul>
            </div>
          )}
          {rv.suggestedRedraft && (
            <div style={{ padding: 12, borderRadius: 10, background: "rgba(31,179,126,0.06)", border: "1px solid rgba(31,179,126,0.24)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 10.5, letterSpacing: "1px", textTransform: "uppercase", color: "var(--emerald-bright)", display: "flex", alignItems: "center", gap: 6 }}><FileSignature size={12} /> Saran Rumusan Pengganti</div>
                <span className="chip" onClick={() => { try { navigator.clipboard.writeText(rv.suggestedRedraft); } catch (e) {} }}>Salin</span>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--silver)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{rv.suggestedRedraft}</p>
            </div>
          )}
          {rv.missing && rv.missing.length > 0 && (
            <div><div style={{ fontSize: 10.5, letterSpacing: "1px", textTransform: "uppercase", color: "#ff9a8b", marginBottom: 4 }}>Proteksi yang Hilang</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>{rv.missing.map((m, i) => <li key={i} style={{ fontSize: 12.5, color: "var(--silver)", lineHeight: 1.6 }}>{m}</li>)}</ul></div>
          )}
          <div><div style={{ fontSize: 10.5, letterSpacing: "1px", textTransform: "uppercase", color: "var(--emerald-bright)", marginBottom: 4 }}>Usulan Perbaikan</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>{(rv.improvements || []).map((m, i) => <li key={i} style={{ fontSize: 12.5, color: "var(--silver)", lineHeight: 1.6 }}>{m}</li>)}</ul></div>
        </div>
      )}
    </div>
  );
}

function ContractReview() {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [stage, setStage] = useState("idle"); // idle|extracting|reviewing|done
  const [prog, setProg] = useState(0);
  const [progLabel, setProgLabel] = useState("");
  const [err, setErr] = useState("");
  const [text, setText] = useState("");
  const [useAI, setUseAI] = useState(true);
  const [ctx, setCtx] = useState("Pihak pemasok (supplier)");
  const [rec, setRec] = useState(null);
  const [openIdx, setOpenIdx] = useState(null);
  const [tab, setTab] = useState("summary");
  const [scanned, setScanned] = useState(false);
  const [history, setHistory] = useState([]);
  const [pasteMode, setPasteMode] = useState(false);
  const inputRef = React.useRef(null);

  useEffect(() => { crListIndex().then(setHistory); }, []);
  useEffect(() => {
    try {
      const ik = (typeof window !== "undefined") && window.__KNSL_INTAKE__;
      if (ik && ik.text) { setText(ik.text); setPasteMode(true); setFile({ name: ik.name || "Hasil pindai" }); window.__KNSL_INTAKE__ = null; }
    } catch (e) { /* no intake */ }
  }, []);

  const validate = (f) => {
    const ext = "." + (f.name.split(".").pop() || "").toLowerCase();
    if (!CR_ACCEPT.includes(ext)) return "Format tidak didukung. Gunakan PDF, DOCX, atau TXT.";
    if (f.size > CR_MAX_BYTES) return "Berkas melebihi 25 MB.";
    return "";
  };

  const onFile = async (f) => {
    setErr(""); setScanned(false); setRec(null); setText(""); setOpenIdx(null);
    const v = validate(f); if (v) { setErr(v); return; }
    setFile(f); setStage("extracting"); setProg(0); setProgLabel("Mengekstrak teks…");
    await crAudit("upload_contract", f.name);
    try {
      const ext = "." + (f.name.split(".").pop() || "").toLowerCase();
      let extracted = "";
      if (ext === ".txt") { extracted = await crReadTxt(f); setProg(100); }
      else if (ext === ".docx") { extracted = await crReadDocx(f); setProg(100); }
      else if (ext === ".pdf") {
        const res = await crReadPdf(f, (p) => { setProg(p); setProgLabel(`Mengekstrak PDF…`); });
        extracted = res.text;
        if (res.likelyScanned) setScanned(true);
      }
      if (!extracted.trim()) {
        if (ext === ".pdf") { setScanned(true); setErr("PDF tampak hasil pindaian (tanpa teks). Jalankan OCR atau tempel teks manual."); }
        else setErr("Tidak ada teks yang dapat diekstrak.");
        setStage("idle"); return;
      }
      setText(extracted);
      setStage("idle");
    } catch (e) {
      setErr(e.message || "Gagal mengekstrak teks. Anda dapat menempel teks secara manual.");
      setPasteMode(true); setStage("idle");
    }
  };

  const runOcr = async () => {
    if (!file) return;
    setStage("extracting"); setProg(0); setProgLabel("OCR (best-effort)…"); setErr("");
    try {
      const t = await crOcrPdf(file, "ind+eng", (p, pg, n) => { setProg(p); setProgLabel(`OCR halaman ${pg}/${n}…`); });
      if (!t.trim()) throw new Error("OCR tidak menghasilkan teks.");
      setText(t); setScanned(false); setStage("idle");
      await crAudit("ocr_contract", file.name);
    } catch (e) { setErr(e.message || "OCR gagal. Tempel teks manual."); setPasteMode(true); setStage("idle"); }
  };

  const analyze = async () => {
    if (!text.trim()) { setErr("Tidak ada teks untuk dianalisa."); return; }
    setErr(""); setStage("reviewing"); setProg(0); setProgLabel(useAI ? "Agen AI meninjau klausul…" : "Meninjau klausul…");
    try {
      const clauses = crSplitClauses(text);
      if (!clauses.length) { setErr("Tidak ada klausul terdeteksi."); setStage("idle"); return; }
      const crResult = await crReview(clauses, ctx, useAI, (p) => setProg(p), text);
      const reviewed = crResult.clauses;
      const risk = crRiskEngine(reviewed);
      let dataPoints = crExtractDataPoints(text);
      if (useAI) { try { dataPoints = crMergeDataPoints(dataPoints, await crAIDataPoints(text, ctx)); } catch (e) { /* keep heuristic */ } }
      const aiHits = crResult.aiHits || 0;
      const record = {
        id: "ctr_" + Date.now().toString(36), name: file ? file.name : "Teks tempel", ts: Date.now(),
        ctx, usedAI: aiHits > 0, aiHits, aiError: crResult.aiError,
        clauses: reviewed, risk, dataPoints,
      };
      if (useAI && !aiHits && crResult.aiError) setErr(formatAiError(crResult.aiError, getAiProvider()) + " (hasil heuristik tetap ditampilkan)");
      await crSaveRecord(record);
      await crAudit("analyze_contract", record.name + " · skor " + risk.score);
      persistContractReview(record);
      setRec(record); setHistory(await crListIndex()); setStage("done"); setTab("summary");
    } catch (e) { setErr(e.message || "Analisa gagal."); setStage("idle"); }
  };

  const loadFromHistory = async (id) => {
    const r = await crGet("cr:doc:" + id);
    if (r) { setRec(r); setText(""); setFile({ name: r.name }); setStage("done"); setTab("summary"); setCtx(r.ctx || ctx); }
  };
  const removeHistory = async (id, e) => { e.stopPropagation(); await crDeleteRecord(id); setHistory(await crListIndex()); if (rec && rec.id === id) { setRec(null); setStage("idle"); } };

  const busy = stage === "extracting" || stage === "reviewing";
  const flagged = rec ? rec.clauses.filter((c) => c.review.risk !== "low") : [];

  return (
    <div className="view-enter page scrollbar">
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,360px) 1fr", gap: 20, alignItems: "start" }} className="cr-grid">
        {/* ---- left: upload + controls + history ---- */}
        <div style={{ display: "grid", gap: 16 }}>
          <div className="glass rise" style={{ padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}><FileSearch size={18} className="gold-text" /><h3 className="serif" style={{ fontSize: 19, margin: 0 }}>Tinjauan Kontrak AI</h3></div>
            <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 14px", lineHeight: 1.5 }}>Unggah kontrak (PDF · DOCX · TXT). Engine mengekstrak teks, memecah klausul, lalu menilai risiko per klausul dengan <span className="emerald-text">AI Counsel</span> + heuristik.</p>

            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]); }}
              onClick={() => inputRef.current && inputRef.current.click()}
              style={{ border: `1.5px dashed ${drag ? "var(--emerald-bright)" : "var(--line)"}`, borderRadius: 14, padding: "28px 16px", textAlign: "center", cursor: "pointer", background: drag ? "rgba(31,179,126,0.06)" : "rgba(8,10,9,0.4)", transition: "all .3s" }}>
              <Upload size={26} className={drag ? "emerald-text" : "gold-text"} style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 13.5, color: "var(--silver)", fontWeight: 600 }}>{file ? file.name : "Tarik & lepas berkas, atau klik"}</div>
              <div style={{ fontSize: 11.5, color: "var(--muted-2)", marginTop: 4 }}>PDF · DOCX · TXT · maks 25 MB</div>
              <input ref={inputRef} type="file" accept=".pdf,.docx,.txt" style={{ display: "none" }} onChange={(e) => e.target.files[0] && onFile(e.target.files[0])} />
            </div>

            {busy && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--muted)", marginBottom: 6 }}><span>{progLabel}</span><span>{prog}%</span></div>
                <div style={{ height: 6, borderRadius: 6, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}><div style={{ width: prog + "%", height: "100%", background: "linear-gradient(90deg,var(--champagne),var(--emerald-bright))", transition: "width .3s" }} /></div>
              </div>
            )}

            {err && <div className="view-enter" style={{ marginTop: 12, padding: 11, borderRadius: 10, background: "rgba(220,68,55,0.08)", border: "1px solid rgba(220,68,55,0.28)", fontSize: 12.5, color: "#ff9a8b", display: "flex", gap: 8, alignItems: "flex-start" }}><AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />{err}</div>}

            {scanned && (
              <button className="btn-ghost" style={{ marginTop: 12, width: "100%", justifyContent: "center" }} onClick={runOcr} disabled={busy}><ScanLine size={15} /> Jalankan OCR (PDF pindaian)</button>
            )}

            <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12.5, color: "var(--silver)" }}>Atau tempel teks manual</span>
              <span className="chip" onClick={() => setPasteMode((p) => !p)}>{pasteMode ? "Tutup" : "Buka"}</span>
            </div>
            {pasteMode && <textarea className="field" style={{ marginTop: 10 }} rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="Tempel isi kontrak di sini…" />}

            <div className="hairline" style={{ margin: "16px 0" }} />
            <div style={{ fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", color: "var(--muted-2)", marginBottom: 8 }}>Perspektif Tinjauan</div>
            <select className="field" value={ctx} onChange={(e) => setCtx(e.target.value)}>
              <option>Pihak pemasok (supplier)</option>
              <option>Pihak pembeli / pemberi kerja</option>
              <option>Penyedia jasa</option>
              <option>Penerima jasa</option>
              <option>Pihak peninjau (netral)</option>
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 12, cursor: "pointer", fontSize: 13, color: "var(--silver)" }}>
              <input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} style={{ accentColor: "#1fb37e", width: 16, height: 16 }} />
              <Sparkles size={14} className="gold-text" /> Gunakan Agen AI Contract Review
            </label>
            {useAI && <AiProviderPicker compact />}
            <button className="btn-primary" style={{ marginTop: 14, width: "100%", justifyContent: "center" }} onClick={analyze} disabled={busy || !text.trim()}>
              {stage === "reviewing" ? <><Activity size={16} /> Meninjau…</> : <><Zap size={16} /> Tinjau Kontrak</>}
            </button>
          </div>

          {/* history */}
          <div className="glass rise" style={{ padding: 18, animationDelay: ".08s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><History size={15} className="gold-text" /><span style={{ fontSize: 13.5, fontWeight: 600 }}>Riwayat Tinjauan</span><span style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--muted)" }}>{history.length}</span></div>
            {history.length === 0 && <p style={{ fontSize: 12.5, color: "var(--muted)", margin: 0 }}>Belum ada tinjauan tersimpan.</p>}
            <div style={{ display: "grid", gap: 8 }}>
              {history.map((h) => (
                <div key={h.id} onClick={() => loadFromHistory(h.id)} className="glass" style={{ padding: "10px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, background: rec && rec.id === h.id ? "rgba(31,179,126,0.08)" : undefined }}>
                  <FileText size={15} style={{ color: "var(--muted)", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.name}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{h.clauses} klausul · skor {h.score != null ? h.score : "—"}</div>
                  </div>
                  <Trash2 size={14} style={{ color: "var(--muted-2)", flexShrink: 0 }} onClick={(e) => removeHistory(h.id, e)} />
                </div>
              ))}
            </div>
          </div>

          <div className="glass" style={{ padding: 14, display: "flex", gap: 9, alignItems: "flex-start", background: "linear-gradient(150deg,rgba(216,192,138,0.06),rgba(8,10,9,0.2))" }}>
            <Lock size={14} className="gold-text" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 11.5, color: "var(--muted)", margin: 0, lineHeight: 1.55 }}>Pemrosesan & penyimpanan berlangsung di sisi klien (browser). Setiap aksi dicatat di audit log lokal. Untuk enkripsi at-rest, RBAC server, dan retensi multi-pengguna, perlu lapisan backend (lihat dokumentasi).</p>
          </div>
        </div>

        {/* ---- right: results ---- */}
        <div style={{ minWidth: 0 }}>
          {stage !== "done" || !rec ? (
            <div className="glass rise" style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
              <FileSearch size={40} className="gold-text" style={{ opacity: 0.5, marginBottom: 14 }} />
              <h3 className="serif" style={{ fontSize: 20, margin: "0 0 6px", color: "var(--silver)" }}>Belum ada tinjauan</h3>
              <p style={{ fontSize: 13, margin: 0, maxWidth: 420, marginInline: "auto", lineHeight: 1.6 }}>Unggah atau tempel kontrak di panel kiri, pilih perspektif, lalu jalankan tinjauan untuk melihat ringkasan eksekutif, peta risiko, dan analisa klausul.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 18 }}>
              {/* header + export */}
              <div className="glass rise" style={{ padding: 22 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
                      <h3 className="serif" style={{ fontSize: 21, margin: 0 }}>{rec.name}</h3>
                      {rec.usedAI && <span className="badge badge-low"><Sparkles size={12} /> Agen AI · {rec.aiHits}/{rec.clauses.length} klausul</span>}
                      {!rec.usedAI && rec.aiError && <span className="badge badge-high" style={{ fontSize: 10 }}>Heuristik (AI gagal)</span>}
                    </div>
                    <p style={{ fontSize: 12.5, color: "var(--muted)", margin: 0 }}>{rec.clauses.length} klausul · perspektif: {rec.ctx} · {new Date(rec.ts).toLocaleString("id-ID")}</p>
                    {rec.usedAI && getLastAiMeta() && (
                      <p style={{ fontSize: 11, color: "var(--emerald-bright)", margin: "6px 0 0" }}>
                        Provider: {getProviderLabel(getLastAiMeta().provider)} · {getLastAiMeta().model}
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn-ghost" onClick={() => crExportReport(rec, "word")}><Download size={15} /> DOCX</button>
                    <button className="btn-ghost" onClick={() => crExportReport(rec, "pdf")}><Download size={15} /> PDF</button>
                    <button className="btn-ghost" onClick={() => crExportXlsx(rec)}><Download size={15} /> Excel</button>
                  </div>
                </div>
              </div>

              {/* tabs */}
              <div style={{ display: "flex", gap: 22, borderBottom: "1px solid var(--line)", paddingBottom: 9, overflowX: "auto" }} className="scrollbar">
                {[["summary", "Ringkasan"], ["data", "Data Poin"], ["clauses", `Klausul (${rec.clauses.length})`], ["flags", `Bendera (${flagged.length})`]].map(([k, lbl]) => (
                  <span key={k} className={`tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{lbl}</span>
                ))}
              </div>

              {tab === "summary" && (
                <div className="view-enter" style={{ display: "grid", gap: 18 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 18, alignItems: "center" }} className="cr-sum">
                    <div className="glass" style={{ padding: 18 }}><CrGauge score={rec.risk.score} category={rec.risk.category} /></div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                      <div className="glass" style={{ padding: 18, textAlign: "center" }}><div className="serif" style={{ fontSize: 30, fontWeight: 700, color: "#ff9a8b" }}>{rec.risk.high}</div><div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Risiko Tinggi</div></div>
                      <div className="glass" style={{ padding: 18, textAlign: "center" }}><div className="serif" style={{ fontSize: 30, fontWeight: 700, color: "var(--champagne)" }}>{rec.risk.med}</div><div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Risiko Sedang</div></div>
                      <div className="glass" style={{ padding: 18, textAlign: "center" }}><div className="serif" style={{ fontSize: 30, fontWeight: 700, color: "var(--emerald-bright)" }}>{rec.risk.low}</div><div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Risiko Rendah</div></div>
                    </div>
                  </div>

                  <div className="glass" style={{ padding: 20, borderLeft: "2px solid #dc4437" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><AlertTriangle size={17} style={{ color: "#ff9a8b" }} /><h4 className="serif" style={{ fontSize: 16, margin: 0 }}>Red Flag Kritis</h4></div>
                    {rec.risk.redFlags.length === 0 ? <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>Tidak ada red flag kritis terdeteksi otomatis.</p> :
                      <div style={{ display: "grid", gap: 9 }}>{rec.risk.redFlags.map((f, i) => (
                        <div key={i} style={{ fontSize: 13, color: "var(--silver)", lineHeight: 1.55 }}><span className="gold-text" style={{ fontWeight: 700 }}>[{f.num}] {f.type}:</span> {f.concern}</div>
                      ))}</div>}
                  </div>

                  <div className="glass" style={{ padding: 20, borderLeft: "2px solid var(--emerald-bright)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><TrendingUp size={17} className="emerald-text" /><h4 className="serif" style={{ fontSize: 16, margin: 0 }}>Poin Negosiasi & Rekomendasi</h4></div>
                    {rec.risk.negotiation.length === 0 ? <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>—</p> :
                      <div style={{ display: "grid", gap: 9 }}>{rec.risk.negotiation.map((n, i) => (
                        <div key={i} style={{ fontSize: 13, color: "var(--silver)", lineHeight: 1.55 }}><span className="emerald-text" style={{ fontWeight: 700 }}>[{n.num}] {n.type}:</span> {n.ask}</div>
                      ))}</div>}
                  </div>
                </div>
              )}

              {tab === "data" && (
                <div className="view-enter glass" style={{ padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}><FileText size={16} className="gold-text" /><h4 className="serif" style={{ fontSize: 16, margin: 0 }}>Data Poin Kontrak</h4><span style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--muted)" }}>klik <b>Excel</b> untuk ekspor</span></div>
                  <div style={{ display: "grid", gap: 0 }}>
                    {(rec.dataPoints || []).map((d, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                        <div style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 600 }}>{d.label}</div>
                        <div style={{ fontSize: 13, color: d.found ? "var(--silver)" : "var(--muted-2)", fontStyle: d.found ? "normal" : "italic" }}>{d.value}</div>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 11.5, color: "var(--muted)", margin: "14px 0 0", lineHeight: 1.55 }}>Data poin ditarik otomatis dari teks kontrak{rec.usedAI ? " (heuristik + AI)" : " (heuristik)"}. Yang bertanda <i>tidak ditemukan</i> wajib dicek manual — bisa karena rumusan tidak baku.</p>
                </div>
              )}

              {tab === "clauses" && (
                <div className="view-enter" style={{ display: "grid", gap: 10 }}>
                  {rec.clauses.map((c) => <CrClauseCard key={c.idx} c={c} open={openIdx === c.idx} onToggle={() => setOpenIdx(openIdx === c.idx ? null : c.idx)} />)}
                </div>
              )}

              {tab === "flags" && (
                <div className="view-enter" style={{ display: "grid", gap: 10 }}>
                  {flagged.length === 0 ? <div className="glass" style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>Tidak ada klausul berisiko sedang/tinggi.</div> :
                    flagged.map((c) => <CrClauseCard key={c.idx} c={c} open={openIdx === c.idx} onToggle={() => setOpenIdx(openIdx === c.idx ? null : c.idx)} />)}
                </div>
              )}

              <div className="glass" style={{ padding: 14, display: "flex", gap: 9, alignItems: "flex-start" }}>
                <Info size={14} className="gold-text" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 11.5, color: "var(--muted)", margin: 0, lineHeight: 1.55 }}>Mesin triase otomatis — <b>bukan nasihat hukum, bukan vonis</b>. Setiap temuan harus diverifikasi terhadap teks kontrak asli dan ditinjau advokat.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- root ---------- */
/* ============================================================
   PINDAI DOKUMEN (Intake) — capture images → PDF / OCR text →
   kirim ke Review Kontrak / Analisa Kronologi. Reuses crLoadScript,
   crDownload, crEndpoint pattern, CR_TESS. Client-side only.
   ============================================================ */
const CR_JSPDF = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
const CR_OPENCV = "https://docs.opencv.org/4.7.0/opencv.js";
const CR_JSCANIFY = "https://cdn.jsdelivr.net/gh/ColonelParrot/jscanify@master/src/jscanify.min.js";

function _scanTimeout(promise, ms, msg) {
  return Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error(msg || "Waktu pemrosesan habis.")), ms))]);
}
function _scanLoadImg(dataUrl) {
  return new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error("Gambar tidak terbaca.")); img.src = dataUrl; });
}
// Downscale large phone photos: shrinks base64 (fixes AI request failures),
// speeds up OCR, and keeps PDFs light. Returns a JPEG data URL.
function scanDownscale(dataUrl, maxDim) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || 0, h = img.naturalHeight || 0;
      if (!w || !h) { resolve({ dataUrl, w: 1000, h: 1414 }); return; }
      const scale = Math.min(1, maxDim / Math.max(w, h));
      const nw = Math.max(1, Math.round(w * scale)), nh = Math.max(1, Math.round(h * scale));
      try {
        const c = document.createElement("canvas"); c.width = nw; c.height = nh;
        c.getContext("2d").drawImage(img, 0, 0, nw, nh);
        resolve({ dataUrl: c.toDataURL("image/jpeg", 0.85), w: nw, h: nh });
      } catch (e) { resolve({ dataUrl, w, h }); }
    };
    img.onerror = () => resolve({ dataUrl, w: 1000, h: 1414 });
    img.src = dataUrl;
  });
}

async function scanFileToImage(file) {
  const raw = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result || "")); r.onerror = () => rej(new Error("Gagal membaca gambar.")); r.readAsDataURL(file); });
  const d = await scanDownscale(raw, 2200);
  const id = "img_" + Math.random().toString(36).slice(2);
  return { id, dataUrl: d.dataUrl, orig: d.dataUrl, corrected: false, name: file.name || "halaman", w: d.w, h: d.h };
}

// Lazy-load OpenCV.js (+jscanify) and wait until the WASM runtime is ready.
async function scanLoadCV() {
  if (window.cv && window.cv.Mat && window.jscanify) return;
  if (!window.cv || !window.cv.Mat) {
    await crLoadScript(CR_OPENCV);
    await _scanTimeout(new Promise((resolve, reject) => {
      const t0 = Date.now();
      (function chk() {
        const cv = window.cv;
        if (cv && cv.Mat) return resolve();
        if (cv && typeof cv.then === "function") { cv.then(() => resolve()).catch(() => reject(new Error("OpenCV gagal init."))); return; }
        if (Date.now() - t0 > 40000) return reject(new Error("OpenCV tidak siap (jaringan?)."));
        setTimeout(chk, 200);
      })();
    }), 42000, "OpenCV terlalu lama dimuat.");
  }
  if (!window.jscanify) await crLoadScript(CR_JSCANIFY);
  if (!window.jscanify) throw new Error("Pustaka koreksi (jscanify) gagal dimuat.");
}

// Auto-detect document corners and warp to a flat, cropped page.
async function scanCorrectPage(im) {
  await scanLoadCV();
  const img = await _scanLoadImg(im.dataUrl);
  const scanner = new window.jscanify();
  const portrait = (img.naturalHeight || im.h || 1) >= (img.naturalWidth || im.w || 1);
  const W = portrait ? 1240 : 1754, H = portrait ? 1754 : 1240; // A4-ish @150dpi
  const canvas = scanner.extractPaper(img, W, H);
  if (!canvas || !canvas.toDataURL) throw new Error("Dokumen tidak terdeteksi.");
  return { dataUrl: canvas.toDataURL("image/jpeg", 0.92), w: W, h: H };
}

function _scanDataParts(dataUrl) {
  const m = /^data:([^;]+);base64,(.*)$/.exec(dataUrl || "");
  return m ? { media_type: m[1], data: m[2] } : { media_type: "image/jpeg", data: "" };
}

async function scanBuildPdf(images, name) {
  if (!window.jspdf) await crLoadScript(CR_JSPDF);
  const jsPDFctor = window.jspdf && window.jspdf.jsPDF;
  if (!jsPDFctor) throw new Error("Pustaka PDF gagal dimuat dari jaringan.");
  const doc = new jsPDFctor({ unit: "mm", format: "a4" });
  const PW = 210, PH = 297, M = 8, AW = PW - M * 2, AH = PH - M * 2;
  images.forEach((im, i) => {
    if (i > 0) doc.addPage();
    const aspect = (im.w || 1) / (im.h || 1);
    let w = AW, h = AW / aspect;
    if (h > AH) { h = AH; w = AH * aspect; }
    const x = (PW - w) / 2, y = (PH - h) / 2;
    const fmt = /png/i.test(_scanDataParts(im.dataUrl).media_type) ? "PNG" : "JPEG";
    try { doc.addImage(im.dataUrl, fmt, x, y, w, h); } catch (e) { /* skip unreadable page */ }
  });
  const blob = doc.output("blob");
  crDownload(blob, "Pindai_" + (name || "dokumen").replace(/[^a-z0-9]+/gi, "_") + ".pdf");
}

async function scanOcrAI(images, onProgress) {
  const ep = (typeof window !== "undefined" && window.__CLAUDE_PROXY__) ? window.__CLAUDE_PROXY__ : "https://api.anthropic.com/v1/messages";
  let out = ""; const B = 2; let done = 0;
  for (let i = 0; i < images.length; i += B) {
    const batch = images.slice(i, i + B);
    const content = [];
    batch.forEach((im) => { const p = _scanDataParts(im.dataUrl); if (p.data) content.push({ type: "image", source: { type: "base64", media_type: p.media_type, data: p.data } }); });
    content.push({ type: "text", text: "Transkripsikan SELURUH teks dari gambar dokumen ini apa adanya. Pertahankan struktur (judul, nomor pasal, daftar, paragraf). JANGAN menambah komentar/analisa — keluarkan teks hasil transkripsi saja. Jika ada beberapa gambar, gabungkan berurutan." });
    const body = { model: "claude-sonnet-4-20250514", max_tokens: 1800, messages: [{ role: "user", content }] };
    const resp = await fetch(ep, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!resp.ok) throw new Error("AI OCR HTTP " + resp.status);
    const data = await resp.json();
    out += (data.content || []).map((b) => (b.type === "text" ? b.text : "")).join("") + "\n\n";
    done += batch.length;
    if (onProgress) onProgress(Math.round((done / images.length) * 100));
  }
  return out.trim();
}

async function scanOcrLocal(images, onProgress) {
  await crLoadScript(CR_TESS);
  const T = window.Tesseract;
  if (!T || !T.recognize) throw new Error("OCR lokal gagal dimuat dari jaringan.");
  const N = images.length; let out = "";
  for (let i = 0; i < N; i++) {
    const mk = (lang) => T.recognize(images[i].dataUrl, lang, {
      logger: (m) => { if (m && typeof m.progress === "number" && onProgress) { const base = i / N, span = 1 / N; onProgress(Math.min(99, Math.round((base + m.progress * span) * 100))); } },
    });
    let res;
    try { res = await _scanTimeout(mk("ind+eng"), 120000, "OCR lokal terlalu lama (data bahasa Indonesia gagal dimuat)."); }
    catch (e1) {
      try { res = await _scanTimeout(mk("eng"), 90000, "OCR lokal timeout."); }
      catch (e2) { throw new Error("OCR lokal gagal/timeout. Coba mode AI Vision atau periksa koneksi."); }
    }
    out += (res.data.text || "") + "\n\n";
    if (onProgress) onProgress(Math.round(((i + 1) / N) * 100));
  }
  return out.trim();
}

function scanExportWord(text, name) {
  const body = _esc(text).replace(/\n/g, "<br/>");
  const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${_esc(name || "Dokumen")}</title><style>@page{size:A4;margin:2.4cm}body{font-family:'Times New Roman',serif;font-size:11.5pt;line-height:1.6;color:#000}</style></head><body>${body}</body></html>`;
  crDownload(new Blob(["\ufeff" + html], { type: "application/msword" }), "Pindai_" + (name || "dokumen").replace(/[^a-z0-9]+/gi, "_") + ".doc");
}

function ScanDoc({ onSend }) {
  const [images, setImages] = useState([]);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [prog, setProg] = useState(0);
  const [progLabel, setProgLabel] = useState("");
  const [err, setErr] = useState("");
  const [text, setText] = useState("");
  const [mode, setMode] = useState("ai"); // ai | local
  const camRef = React.useRef(null);
  const galRef = React.useRef(null);

  const addFiles = async (fileList) => {
    setErr("");
    const files = Array.from(fileList || []).filter((f) => /^image\//.test(f.type));
    if (!files.length) { setErr("Pilih berkas gambar (foto dokumen)."); return; }
    try {
      const imgs = await Promise.all(files.map(scanFileToImage));
      setImages((prev) => [...prev, ...imgs].slice(0, 30));
    } catch (e) { setErr(e.message || "Gagal memuat gambar."); }
  };
  const removeImg = (id) => setImages((prev) => prev.filter((x) => x.id !== id));
  const revertImg = (id) => setImages((prev) => prev.map((x) => (x.id === id ? { ...x, dataUrl: x.orig, corrected: false } : x)));
  const autoCorrect = async () => {
    if (!images.length) return;
    setErr(""); setBusy(true); setProg(0); setProgLabel("Memuat mesin koreksi (sekali, agak besar)…");
    try {
      const next = [...images]; let done = 0, fail = 0;
      for (let i = 0; i < next.length; i++) {
        setProgLabel("Mengoreksi halaman " + (i + 1) + "/" + next.length + "…");
        try { const r = await scanCorrectPage(next[i]); next[i] = { ...next[i], dataUrl: r.dataUrl, w: r.w, h: r.h, corrected: true }; }
        catch (e) { fail++; }
        done++; setProg(Math.round((done / next.length) * 100)); setImages([...next]);
      }
      if (fail === next.length) setErr("Koreksi otomatis gagal — dokumen tak terdeteksi atau mesin tak termuat. Pakai latar kontras (dokumen di atas meja gelap), atau lewati langkah ini.");
      else if (fail > 0) setErr(fail + " halaman gagal dikoreksi (dipertahankan apa adanya).");
    } catch (e) { setErr(e.message || "Koreksi otomatis gagal."); }
    setBusy(false);
  };
  const moveImg = (idx, dir) => setImages((prev) => {
    const a = [...prev]; const j = idx + dir; if (j < 0 || j >= a.length) return prev;
    [a[idx], a[j]] = [a[j], a[idx]]; return a;
  });

  const downloadPdf = async () => {
    if (!images.length) return;
    setErr(""); setBusy(true); setProgLabel("Menyusun PDF…"); setProg(50);
    try { await scanBuildPdf(images, "dokumen"); setProg(100); }
    catch (e) { setErr(e.message || "Gagal membuat PDF."); }
    setBusy(false);
  };

  const runOcr = async () => {
    if (!images.length) return;
    setErr(""); setBusy(true); setProg(0);
    try {
      let t = "";
      if (mode === "ai") {
        setProgLabel("OCR AI (vision)…");
        try { t = await scanOcrAI(images, (p) => setProg(p)); }
        catch (e) {
          setProgLabel("AI gagal — beralih ke OCR lokal…"); setProg(0);
          t = await scanOcrLocal(images, (p) => setProg(p));
        }
      } else {
        setProgLabel("OCR lokal (tesseract)…");
        t = await scanOcrLocal(images, (p) => setProg(p));
      }
      if (!t.trim()) throw new Error("Tidak ada teks yang terbaca.");
      setText(t); setProg(100);
    } catch (e) { setErr(e.message || "OCR gagal. Coba mode lain atau foto lebih jelas."); }
    setBusy(false);
  };

  const send = (target) => {
    if (!text.trim()) { setErr("Belum ada teks hasil OCR untuk dikirim."); return; }
    if (onSend) onSend(target, text, "Hasil pindai dokumen");
  };

  return (
    <div className="view-enter page scrollbar">
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,380px) 1fr", gap: 20, alignItems: "start" }} className="cr-grid">
        {/* capture / pages */}
        <div style={{ display: "grid", gap: 16 }}>
          <div className="glass rise" style={{ padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}><ScanLine size={18} className="gold-text" /><h3 className="serif" style={{ fontSize: 19, margin: 0 }}>Pindai Dokumen</h3></div>
            <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 14px", lineHeight: 1.5 }}>Foto / unggah halaman dokumen, susun jadi <span className="emerald-text">PDF</span> atau <span className="emerald-text">teks (OCR)</span>, lalu kirim langsung ke fitur lain.</p>

            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
              style={{ border: `1.5px dashed ${drag ? "var(--emerald-bright)" : "var(--line)"}`, borderRadius: 14, padding: "22px 16px", textAlign: "center", background: drag ? "rgba(31,179,126,0.06)" : "rgba(8,10,9,0.4)", transition: "all .3s" }}>
              <Upload size={24} className={drag ? "emerald-text" : "gold-text"} style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 13, color: "var(--silver)", fontWeight: 600 }}>Tarik & lepas foto, atau:</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 10, flexWrap: "wrap" }}>
                <button className="btn-primary" style={{ padding: "8px 14px" }} onClick={() => camRef.current && camRef.current.click()}><ScanLine size={14} /> Kamera</button>
                <button className="btn-ghost" style={{ padding: "8px 14px" }} onClick={() => galRef.current && galRef.current.click()}><FileText size={14} /> Galeri</button>
              </div>
              <input ref={camRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
              <input ref={galRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
            </div>

            {images.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", color: "var(--muted-2)", marginBottom: 8 }}>{images.length} halaman</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(72px,1fr))", gap: 8 }}>
                  {images.map((im, i) => (
                    <div key={im.id} style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: "1px solid var(--line)", aspectRatio: "3/4" }}>
                      <img src={im.dataUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <span style={{ position: "absolute", top: 3, left: 4, fontSize: 10, fontWeight: 700, color: "#fff", textShadow: "0 1px 3px #000" }}>{i + 1}</span>
                      <div style={{ position: "absolute", inset: "auto 0 0 0", display: "flex", justifyContent: "space-between", padding: "2px 4px", background: "linear-gradient(transparent,rgba(0,0,0,0.6))" }}>
                        <span onClick={() => moveImg(i, -1)} style={{ cursor: "pointer", color: "#fff", fontSize: 12 }}>‹</span>
                        <Trash2 size={12} style={{ cursor: "pointer", color: "#ff9a8b" }} onClick={() => removeImg(im.id)} />
                        <span onClick={() => moveImg(i, 1)} style={{ cursor: "pointer", color: "#fff", fontSize: 12 }}>›</span>
                      </div>
                      {im.corrected && <span title="Sudah dikoreksi — klik untuk pulihkan" onClick={() => revertImg(im.id)} style={{ position: "absolute", top: 3, right: 4, fontSize: 10, fontWeight: 700, color: "#1fb37e", cursor: "pointer", textShadow: "0 1px 3px #000" }}>✓↺</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {busy && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--muted)", marginBottom: 6 }}><span>{progLabel}</span><span>{prog}%</span></div>
                <div style={{ height: 6, borderRadius: 6, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}><div style={{ width: prog + "%", height: "100%", background: "linear-gradient(90deg,var(--champagne),var(--emerald-bright))", transition: "width .3s" }} /></div>
              </div>
            )}
            {err && <div className="view-enter" style={{ marginTop: 12, padding: 11, borderRadius: 10, background: "rgba(220,68,55,0.08)", border: "1px solid rgba(220,68,55,0.28)", fontSize: 12.5, color: "#ff9a8b", display: "flex", gap: 8, alignItems: "flex-start" }}><AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />{err}</div>}

            <div className="hairline" style={{ margin: "16px 0" }} />
            <div style={{ fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", color: "var(--muted-2)", marginBottom: 8 }}>Mesin OCR</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <span className="chip" onClick={() => setMode("ai")} style={mode === "ai" ? { borderColor: "rgba(31,179,126,0.5)", color: "var(--emerald-bright)" } : {}}><Sparkles size={12} /> AI Vision (akurat)</span>
              <span className="chip" onClick={() => setMode("local")} style={mode === "local" ? { borderColor: "rgba(31,179,126,0.5)", color: "var(--emerald-bright)" } : {}}>Lokal (privat)</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn-ghost" onClick={autoCorrect} disabled={busy || !images.length}><ScanLine size={15} /> Auto-crop &amp; Luruskan</button>
              <button className="btn-ghost" onClick={downloadPdf} disabled={busy || !images.length}><Download size={15} /> Unduh PDF</button>
              <button className="btn-primary" onClick={runOcr} disabled={busy || !images.length}><Zap size={15} /> OCR → Teks</button>
            </div>
          </div>

          <div className="glass" style={{ padding: 14, display: "flex", gap: 9, alignItems: "flex-start", background: "linear-gradient(150deg,rgba(216,192,138,0.06),rgba(8,10,9,0.2))" }}>
            <Info size={14} className="gold-text" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 11.5, color: "var(--muted)", margin: 0, lineHeight: 1.55 }}>OCR <b>AI Vision</b> jauh lebih akurat (paham tata letak/tabel) — gambar dikirim ke API. OCR <b>Lokal</b> berjalan di perangkat (privat) namun kurang akurat untuk foto miring/redup.</p>
          </div>
        </div>

        {/* OCR result + handoff */}
        <div className="glass rise" style={{ padding: 22, minHeight: 460, animationDelay: ".08s" }}>
          {!text ? (
            <div style={{ display: "grid", placeItems: "center", height: 380, textAlign: "center", color: "var(--muted)" }}>
              <div><div style={{ width: 56, height: 56, borderRadius: 16, display: "grid", placeItems: "center", margin: "0 auto 16px", background: "rgba(19,133,92,0.1)", border: "1px solid rgba(31,179,126,0.2)" }}><ScanLine size={24} className="emerald-text" /></div><p style={{ fontSize: 14, maxWidth: 320 }}>Tambahkan halaman lalu jalankan <b>OCR → Teks</b>. Hasilnya muncul di sini, bisa diedit dan dikirim ke fitur lain.</p></div>
            </div>
          ) : (
            <div className="view-enter">
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12, flexWrap: "wrap" }}>
                <h3 className="serif" style={{ fontSize: 19, margin: 0 }}>Teks Hasil Pindai</h3>
                <span className="badge badge-low"><CheckCircle2 size={12} /> {text.length.toLocaleString("id-ID")} karakter</span>
                <span style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="btn-ghost" style={{ padding: "7px 12px" }} onClick={() => scanExportWord(text, "dokumen")}><Download size={14} /> Word</button>
                  <button className="btn-ghost" style={{ padding: "7px 12px" }} onClick={() => { try { navigator.clipboard.writeText(text); } catch (e) {} }}>Salin</button>
                </span>
              </div>
              <textarea className="field scrollbar" rows={16} value={text} onChange={(e) => setText(e.target.value)} style={{ fontSize: 13, lineHeight: 1.6 }} />
              <div className="hairline" style={{ margin: "16px 0" }} />
              <div style={{ fontSize: 11, letterSpacing: "1px", textTransform: "uppercase", color: "var(--muted-2)", marginBottom: 10 }}>Kirim teks ini ke</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btn-primary" onClick={() => send("contract")}><FileSearch size={15} /> Review Kontrak AI</button>
                <button className="btn-ghost" onClick={() => send("analysis")}><Scale size={15} /> Analisa Kronologi</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// Layout & App shell: components/layout/, app/App.jsx

export {
  LoginScreen,
  Dashboard,
  Analysis,
  Research,
  Drafting,
  Conflict,
  ContractReview,
  ScanDoc,
};
