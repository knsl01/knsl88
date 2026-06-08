import React, { useState, useEffect, useRef } from "react";
import {
  Briefcase, TrendingUp, Clock, Users, Activity, CalendarDays,
  ArrowUpRight, History, Plus, Trash2, CheckCircle2, RefreshCw,
} from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import {
  loadDashboard, saveDashboard, computeMetricsFromDocket,
  newDeadline, newDocketRow, TREND_DEFAULT,
} from "../../services/dashboardStore.js";
import DashboardWelcome from "./DashboardWelcome.jsx";

const ICONS = [Briefcase, TrendingUp, Clock, Users];

function Badge({ risk, children }) {
  const cls = risk === "high" ? "badge-high" : risk === "med" ? "badge-med" : "badge-low";
  return <span className={`badge ${cls}`}>{children}</span>;
}
const riskLabel = (r) => (r === "high" ? "Tinggi" : r === "med" ? "Menengah" : "Rendah");

function Metric({ icon: Icon, label, value, suffix, delta, i, editing, onChange }) {
  const inp = {
    width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(31,179,126,0.35)", borderRadius: 10, color: "var(--text)",
    padding: "8px 10px", fontFamily: "inherit", marginTop: 6, outline: "none",
  };
  return (
    <div className="glass glass-hover rise" style={{ padding: 22, animationDelay: `${i * 0.07}s` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, display: "grid", placeItems: "center", background: "rgba(19,133,92,0.12)", border: "1px solid rgba(31,179,126,0.2)" }}>
          <Icon size={19} className="emerald-text" strokeWidth={1.8} />
        </div>
        {editing ? (
          <input value={delta} onChange={(e) => onChange("delta", e.target.value)} placeholder="Δ" style={{ ...inp, width: 74, marginTop: 0, textAlign: "center", fontSize: 12 }} />
        ) : (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, color: "var(--emerald-bright)", fontWeight: 600 }}>
            <ArrowUpRight size={13} />{delta}
          </span>
        )}
      </div>
      {editing ? (
        <>
          <input value={value} onChange={(e) => onChange("value", e.target.value)} inputMode="numeric" placeholder="Angka" style={{ ...inp, fontSize: 22, fontWeight: 700 }} />
          <input value={label} onChange={(e) => onChange("label", e.target.value)} placeholder="Label" style={{ ...inp, fontSize: 13 }} />
        </>
      ) : (
        <>
          <div className="gauge-num" style={{ fontSize: 30, fontWeight: 700, marginTop: 16, lineHeight: 1 }}>
            {value}<span style={{ fontSize: 15, color: "var(--muted)", fontWeight: 500 }}>{suffix}</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 7 }}>{label}</div>
        </>
      )}
    </div>
  );
}

export default function Dashboard({ editing, userName, onOpenChat, onOpenAnalysis }) {
  const [metrics, setMetrics] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [docket, setDocket] = useState([]);
  const [trend, setTrend] = useState(TREND_DEFAULT());
  const [metricsManual, setMetricsManual] = useState(false);
  const [toast, setToast] = useState("");
  const [ready, setReady] = useState(false);
  const prevEditing = useRef(false);

  useEffect(() => {
    let alive = true;
    loadDashboard().then((data) => {
      if (!alive) return;
      setMetrics(data.metrics.map((m, i) => ({ ...m, icon: ICONS[i] || Briefcase })));
      setDeadlines(data.deadlines);
      setDocket(data.docket);
      setTrend(data.trend);
      setMetricsManual(data.metricsManual);
      setReady(true);
    });
    return () => { alive = false; };
  }, []);

  const refreshMetrics = () => {
    const computed = computeMetricsFromDocket(docket, deadlines);
    setMetrics(computed.map((m, i) => ({ ...m, icon: ICONS[i] || Briefcase })));
    setMetricsManual(false);
  };

  const persist = async (payload) => {
    await saveDashboard(payload);
    setToast("Data dasbor disimpan.");
    setTimeout(() => setToast(""), 4000);
  };

  useEffect(() => {
    if (!ready) return;
    if (prevEditing.current && !editing) {
      const m = metricsManual ? metrics : computeMetricsFromDocket(docket, deadlines).map((x, i) => ({ ...x, icon: ICONS[i] || Briefcase }));
      if (!metricsManual) setMetrics(m);
      persist({
        metrics: m.map(({ label, value, suffix, delta }) => ({ label, value, suffix, delta })),
        deadlines,
        docket,
        trend,
        metricsManual,
      });
    }
    prevEditing.current = editing;
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateMetric = (idx, field, val) => {
    setMetricsManual(true);
    setMetrics((ms) => ms.map((m, j) => (j === idx ? { ...m, [field]: val } : m)));
  };

  const fieldInp = {
    width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(216,192,138,0.2)", borderRadius: 10, color: "var(--text)",
    padding: "8px 10px", fontFamily: "inherit", fontSize: 13, outline: "none",
  };

  if (!ready) {
    return (
      <div className="view-enter page scrollbar" style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
        Memuat dasbor…
      </div>
    );
  }

  return (
    <div className="view-enter page scrollbar">
      {toast && (
        <div className="profile-toast profile-toast-success" style={{ marginBottom: 14 }} role="status">
          <CheckCircle2 size={18} /> {toast}
        </div>
      )}

      {!editing && (
        <DashboardWelcome
          userName={userName}
          onOpenChat={onOpenChat}
          onOpenAnalysis={onOpenAnalysis}
        />
      )}

      {editing && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.4 }}>
            Mode edit — isi data perkara & tenggat Anda. Tekan ✓ di header untuk simpan.
          </span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="btn-ghost" onClick={refreshMetrics} style={{ fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <RefreshCw size={14} /> Hitung ulang metrik
            </button>
          </div>
        </div>
      )}

      <div className="metric-grid">
        {metrics.map((m, idx) => (
          <Metric key={idx} i={idx} icon={m.icon} label={m.label} value={m.value}
            suffix={m.suffix} delta={m.delta} editing={editing}
            onChange={(field, val) => updateMetric(idx, field, val)} />
        ))}
      </div>

      <div className="two-col">
        <div className="glass glass-hover rise" style={{ padding: 24, animationDelay: ".25s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div>
              <h3 className="serif" style={{ fontSize: 19, margin: 0 }}>Analitik Perkara</h3>
              <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "4px 0 0" }}>Volume kasus · 6 bulan (edit di mode ✓)</p>
            </div>
            <span className="badge badge-low"><Activity size={12} /> live</span>
          </div>
          {editing && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 14 }}>
              {trend.map((row, i) => (
                <div key={i}>
                  <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 4 }}>{row.m}</div>
                  <input className="field" type="number" min="0" value={row.v}
                    onChange={(e) => setTrend((t) => t.map((r, j) => j === i ? { ...r, v: Number(e.target.value) || 0 } : r))}
                    style={{ padding: "8px", fontSize: 14 }} />
                </div>
              ))}
            </div>
          )}
          <div style={{ height: 210, marginTop: 18 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 8, right: 6, left: -22, bottom: 0 }}>
                <defs><linearGradient id="em" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1fb37e" stopOpacity={0.5} /><stop offset="100%" stopColor="#1fb37e" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(216,192,138,0.08)" vertical={false} />
                <XAxis dataKey="m" stroke="#5c6863" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis stroke="#5c6863" tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#101413", border: "1px solid rgba(216,192,138,0.2)", borderRadius: 12, color: "#eef2ef", fontSize: 13 }} />
                <Area type="monotone" dataKey="v" stroke="#1fb37e" strokeWidth={2.5} fill="url(#em)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass glass-hover rise" style={{ padding: 24, animationDelay: ".32s" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <CalendarDays size={18} className="gold-text" />
              <h3 className="serif" style={{ fontSize: 19, margin: 0 }}>Kalender Litigasi</h3>
            </div>
            {editing && (
              <button type="button" className="btn-ghost" style={{ fontSize: 12, padding: "6px 10px" }}
                onClick={() => setDeadlines((d) => [...d, newDeadline()])}>
                <Plus size={14} /> Tambah
              </button>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {deadlines.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>Belum ada tenggat. Aktifkan mode edit (✓) lalu tambah.</p>
            )}
            {deadlines.map((d, i) => (
              <div key={d.id || i} className="clause-flag" style={{ borderColor: d.risk === "high" ? "#dc4437" : d.risk === "med" ? "#d8c08a" : "#1fb37e", position: "relative" }}>
                {editing ? (
                  <div style={{ display: "grid", gap: 8 }}>
                    <input style={fieldInp} placeholder="Judul tenggat" value={d.title} onChange={(e) => setDeadlines((dl) => dl.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} />
                    <input style={fieldInp} placeholder="Waktu (mis. Besok · 09:00)" value={d.when} onChange={(e) => setDeadlines((dl) => dl.map((x, j) => j === i ? { ...x, when: e.target.value } : x))} />
                    <select style={fieldInp} value={d.risk} onChange={(e) => setDeadlines((dl) => dl.map((x, j) => j === i ? { ...x, risk: e.target.value } : x))}>
                      <option value="high">Prioritas tinggi</option>
                      <option value="med">Menengah</option>
                      <option value="low">Rendah</option>
                    </select>
                    <button type="button" className="btn-ghost" style={{ fontSize: 12, color: "#ff9a8b", justifyContent: "center" }}
                      onClick={() => setDeadlines((dl) => dl.filter((_, j) => j !== i))}>
                      <Trash2 size={14} /> Hapus
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 13.5, fontWeight: 500, lineHeight: 1.4 }}>{d.title || "—"}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
                      <Clock size={12} style={{ color: "var(--muted)" }} />
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>{d.when || "—"}</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass rise" style={{ padding: 24, marginTop: 18, animationDelay: ".4s" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 8, flexWrap: "wrap" }}>
          <h3 className="serif" style={{ fontSize: 19, margin: 0 }}>Daftar Perkara Berjalan</h3>
          {editing && (
            <button type="button" className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setDocket((d) => [...d, newDocketRow()])}>
              <Plus size={14} /> Tambah perkara
            </button>
          )}
        </div>
        {docket.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--muted)" }}>Belum ada perkara. Mode edit → Tambah perkara.</p>
        ) : (
          <div className="tablewrap scrollbar">
            <div className="docket-row" style={{ fontSize: 11, letterSpacing: "1px", color: "var(--muted-2)", textTransform: "uppercase", paddingBottom: 12 }}>
              <span>No.</span><span>Perkara</span><span>Bidang</span><span>Tahap</span><span>Win-Rate</span><span>Status</span>
            </div>
            <div className="hairline" />
            {docket.map((c, i) => (
              <div key={c.id || i} className="docket-row" style={{ padding: "14px 0", borderBottom: "1px solid rgba(216,192,138,0.06)", alignItems: editing ? "start" : "center" }}>
                {editing ? (
                  <>
                    <input style={fieldInp} value={c.id} onChange={(e) => setDocket((d) => d.map((x, j) => j === i ? { ...x, id: e.target.value } : x))} />
                    <input style={fieldInp} value={c.name} placeholder="Nama perkara" onChange={(e) => setDocket((d) => d.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                    <input style={fieldInp} value={c.area} onChange={(e) => setDocket((d) => d.map((x, j) => j === i ? { ...x, area: e.target.value } : x))} />
                    <input style={fieldInp} value={c.stage} onChange={(e) => setDocket((d) => d.map((x, j) => j === i ? { ...x, stage: e.target.value } : x))} />
                    <input style={fieldInp} type="number" min="0" max="100" value={c.rate} onChange={(e) => setDocket((d) => d.map((x, j) => j === i ? { ...x, rate: Number(e.target.value) || 0 } : x))} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <select style={fieldInp} value={c.risk} onChange={(e) => setDocket((d) => d.map((x, j) => j === i ? { ...x, risk: e.target.value } : x))}>
                        <option value="high">Tinggi</option>
                        <option value="med">Menengah</option>
                        <option value="low">Rendah</option>
                      </select>
                      <button type="button" className="btn-ghost" style={{ fontSize: 11, color: "#ff9a8b", padding: "6px" }}
                        onClick={() => setDocket((d) => d.filter((_, j) => j !== i))}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="gold-text" style={{ fontSize: 12.5, fontWeight: 600 }}>{c.id}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 500 }}>{c.name}</span>
                    <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{c.area}</span>
                    <span style={{ fontSize: 12.5, color: "var(--silver)" }}>{c.stage}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 5, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                        <div style={{ width: `${c.rate}%`, height: "100%", background: c.rate > 65 ? "linear-gradient(90deg,#13855c,#1fb37e)" : c.rate > 50 ? "linear-gradient(90deg,#b89a52,#d8c08a)" : "linear-gradient(90deg,#a83b30,#dc4437)" }} />
                      </div>
                      <span className="gauge-num" style={{ fontSize: 12.5, fontWeight: 600 }}>{c.rate}%</span>
                    </div>
                    <Badge risk={c.risk}>{riskLabel(c.risk)}</Badge>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
