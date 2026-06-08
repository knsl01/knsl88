/** Dashboard data — per-user via window.storage */

export const DASH_METRICS_DEFAULT = [
  { label: "Kasus Aktif", value: "0", suffix: "", delta: "—" },
  { label: "Rata-rata Win-Rate", value: "0", suffix: "%", delta: "—" },
  { label: "Tenggat Minggu Ini", value: "0", suffix: "", delta: "—" },
  { label: "Klien / Perkara", value: "0", suffix: "", delta: "—" },
];

export const DEADLINES_DEFAULT = [];

export const DOCKET_DEFAULT = [];

export const TREND_DEFAULT = () => {
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const now = new Date();
  const out = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ m: months[d.getMonth()], v: 0 });
  }
  return out;
};

async function storageGet(key) {
  if (typeof window === "undefined" || !window.storage) return null;
  const r = await window.storage.get(key);
  return r?.value ?? null;
}

async function storageSet(key, value) {
  if (typeof window === "undefined" || !window.storage) return;
  await window.storage.set(key, JSON.stringify(value));
}

export function computeMetricsFromDocket(docket, deadlines) {
  const active = docket.length;
  const avgRate = active
    ? Math.round(docket.reduce((s, c) => s + (Number(c.rate) || 0), 0) / active)
    : 0;
  const dlCount = deadlines.length;
  return [
    { label: "Kasus Aktif", value: String(active), suffix: "", delta: active ? "live" : "—" },
    { label: "Rata-rata Win-Rate", value: String(avgRate), suffix: "%", delta: avgRate ? `${avgRate}%` : "—" },
    { label: "Tenggat Aktif", value: String(dlCount), suffix: "", delta: dlCount ? `${dlCount}` : "—" },
    { label: "Perkara Docket", value: String(active), suffix: "", delta: "—" },
  ];
}

export async function loadDashboard() {
  try {
    const [m, d, dk, t] = await Promise.all([
      storageGet("dash:metrics"),
      storageGet("dash:deadlines"),
      storageGet("dash:docket"),
      storageGet("dash:trend"),
    ]);
    const deadlines = d ? JSON.parse(d) : [...DEADLINES_DEFAULT];
    const docket = dk ? JSON.parse(dk) : [...DOCKET_DEFAULT];
    const trend = t ? JSON.parse(t) : TREND_DEFAULT();
    let metrics = m ? JSON.parse(m) : null;
    if (!metrics) metrics = computeMetricsFromDocket(docket, deadlines);
    return { metrics, deadlines, docket, trend, metricsManual: !!m };
  } catch {
    const docket = [...DOCKET_DEFAULT];
    const deadlines = [...DEADLINES_DEFAULT];
    return {
      metrics: computeMetricsFromDocket(docket, deadlines),
      deadlines,
      docket,
      trend: TREND_DEFAULT(),
      metricsManual: false,
    };
  }
}

export async function saveDashboard({ metrics, deadlines, docket, trend, metricsManual }) {
  await Promise.all([
    storageSet("dash:metrics", metrics),
    storageSet("dash:deadlines", deadlines),
    storageSet("dash:docket", docket),
    storageSet("dash:trend", trend),
    storageSet("dash:metricsManual", metricsManual ? "1" : "0"),
  ]);
}

export function newDeadline() {
  return { id: "dl_" + Date.now().toString(36), title: "", when: "", risk: "med" };
}

export function newDocketRow() {
  const n = Date.now().toString(36).slice(-4).toUpperCase();
  return { id: "KNSL-" + n, name: "", area: "", stage: "", risk: "med", rate: 50 };
}
