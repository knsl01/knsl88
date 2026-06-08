import PASAL from "../data/statutes/pasal.json";
import { CaseAnalysisAgent } from "../services/ai/agent.js";

const KUHP_MAP = {
  "263": "391", "285": "473", "310": "433", "338": "458", "340": "459",
  "351": "466", "362": "476", "365": "479", "368": "482", "372": "486", "378": "492",
};

/* klasifikasi ranah hukum + langkah sebagai korban/pihak */
const DOMAINS = {
  pidana: { label: "Ranah Pidana", color: "#1fb37e", desc: "Perbuatan berpotensi memenuhi unsur tindak pidana (KUHP). Negara dapat menuntut pelaku.", proses: "Laporan Polisi → Penyidikan → Penuntutan (JPU) → Pengadilan Negeri." },
  perdata: { label: "Ranah Perdata", color: "#8fb6d6", desc: "Sengketa hak & kewajiban keperdataan (mis. wanprestasi / perbuatan melawan hukum).", proses: "Somasi → Mediasi → Gugatan ke Pengadilan Negeri." },
  korporasi: { label: "Korporasi (UU PT)", color: "#d8c08a", desc: "Terkait tata kelola perseroan, hak pemegang saham, organ Perseroan.", proses: "Mekanisme internal (RUPS/Komisaris) → Gugatan PN / Pengadilan Niaga." },
  campuran: { label: "Pidana & Perdata", color: "#1fb37e", desc: "Dapat ditempuh jalur pidana sekaligus gugatan ganti rugi perdata secara paralel.", proses: "Laporan Pidana + Gugatan/Restitusi Perdata." },
  tata: { label: "Tata Negara / Konstitusi", color: "#8fb6d6", desc: "Menyangkut hak konstitusional warga atau kewenangan lembaga negara.", proses: "Upaya administratif / PTUN / Uji materi ke MK atau MA." },
  lain: { label: "Perlu Kajian Lanjut", color: "#7e8c86", desc: "Belum cukup dasar hukum terindeks untuk mengklasifikasi.", proses: "Konsultasi advokat untuk menentukan ranah hukum." },
};
const ACTIONS = {
  pidana: [
    "Amankan & dokumentasikan bukti: foto, video, struk, kronologi tertulis, dan identitas saksi.",
    "Buat Laporan Polisi di SPKT Polsek/Polres terdekat (atau layanan online kepolisian).",
    "Untuk kasus kekerasan/penganiayaan: minta surat rujukan untuk Visum et Repertum.",
    "Perhatikan delik aduan (mis. penghinaan, perzinaan) — hanya diproses bila korban mengadu, ada tenggat waktu.",
    "Pertimbangkan pendampingan advokat dan ajukan restitusi/ganti rugi atas kerugian.",
  ],
  perdata: [
    "Kumpulkan dokumen perikatan: perjanjian, bukti bayar, korespondensi, dan kronologi.",
    "Kirim somasi/teguran tertulis kepada pihak lawan (lazimnya 1–3 kali).",
    "Tawarkan musyawarah atau mediasi untuk penyelesaian damai.",
    "Bila gagal, ajukan gugatan wanprestasi/PMH ke Pengadilan Negeri domisili tergugat.",
  ],
  korporasi: [
    "Periksa Anggaran Dasar Perseroan & ketentuan UU PT 40/2007 yang relevan.",
    "Tempuh mekanisme internal: RUPS, teguran Dewan Komisaris, atau RUPS Luar Biasa.",
    "Pemegang saham minoritas dapat menempuh hak gugat (derivative suit) ke Pengadilan Negeri.",
    "Untuk insolvensi/utang, pertimbangkan PKPU atau kepailitan ke Pengadilan Niaga.",
  ],
  campuran: [
    "Tempuh dua jalur paralel: Laporan Polisi (pidana) dan gugatan ganti rugi (perdata).",
    "Dokumentasikan bukti untuk kedua proses sekaligus sejak awal.",
    "Pidana untuk menghukum pelaku; perdata untuk memulihkan kerugian materiil.",
    "Gunakan advokat agar strategi kedua jalur tidak saling melemahkan.",
  ],
  tata: [
    "Identifikasi hak konstitusional atau kewenangan lembaga yang terdampak.",
    "Tempuh upaya administratif atau gugatan PTUN sesuai objek sengketa.",
    "Untuk pengujian norma: uji materi UU ke Mahkamah Konstitusi, peraturan di bawah UU ke Mahkamah Agung.",
  ],
  lain: ["Konsultasikan dengan advokat untuk menentukan ranah hukum dan strategi yang tepat."],
};
function classifyDomain(data) {
  const c = { KUHP: 0, PT: 0, UUD: 0 };
  data.results.forEach((r) => { const l = r.l; if (l === "KUHP" || l.indexOf("UU ITE") === 0) c.KUHP++; else if (l.indexOf("UU PT") === 0 || l.indexOf("UU 37/2004") === 0 || l.indexOf("UU 30/1999") === 0 || l.indexOf("UU 4/2023") === 0) c.PT++; else c.UUD++; });
  const hasPerdata = data.outside.some((o) => /KUHPerdata/.test(o.v));
  let dom = "lain";
  if (c.KUHP === 0 && c.PT === 0 && c.UUD === 0) dom = hasPerdata ? "perdata" : "lain";
  else if (c.KUHP >= c.PT && c.KUHP >= c.UUD) dom = hasPerdata ? "campuran" : "pidana";
  else if (c.PT >= c.UUD) dom = "korporasi";
  else dom = "tata";
  return { dom, ...DOMAINS[dom], actions: ACTIONS[dom] };
}

/* ---------- search engine ---------- */
const STOP = new Set("yang dan ke dari pada untuk atau dengan itu ini saya dia mereka ada telah sudah karena maka oleh dalam adalah akan tidak sebuah para nya nya nya".split(" "));
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9\u00c0-\u024f\s]/g, " ").replace(/\s+/g, " ").trim();

const SYN = {
  "pencurian": ["pencurian", "mencuri", "mengambil barang"], "curi": ["pencurian", "mencuri"], "maling": ["pencurian", "mencuri"],
  "begal": ["pencurian", "kekerasan", "ancaman"], "rampok": ["pencurian", "kekerasan"], "perampokan": ["pencurian", "kekerasan"],
  "pembunuhan": ["pembunuhan", "nyawa", "membunuh"], "bunuh": ["pembunuhan", "nyawa"], "membunuh": ["pembunuhan", "nyawa"],
  "penganiayaan": ["penganiayaan", "menganiaya"], "aniaya": ["penganiayaan", "menganiaya"], "pukul": ["penganiayaan"],
  "kekerasan": ["kekerasan", "penganiayaan"], "kdrt": ["penganiayaan", "kekerasan"],
  "penipuan": ["penipuan", "tipu muslihat", "rangkaian kebohongan", "menguntungkan diri"], "tipu": ["penipuan", "tipu muslihat"], "menipu": ["penipuan"],
  "penggelapan": ["penggelapan", "menggelapkan"], "gelapkan": ["penggelapan"],
  "pemerasan": ["pemerasan", "memaksa"], "memeras": ["pemerasan"],
  "pengancaman": ["pengancaman", "ancaman", "mengancam"], "ancam": ["pengancaman", "ancaman"],
  "penadahan": ["penadahan", "menadah"], "tadah": ["penadahan"],
  "perkosaan": ["perkosa", "bersetubuh", "kesusilaan"], "pemerkosaan": ["perkosa", "bersetubuh", "kesusilaan"], "perkosa": ["perkosa", "bersetubuh"],
  "pencabulan": ["cabul", "kesusilaan"], "cabul": ["cabul", "kesusilaan"], "pelecehan": ["cabul", "kesusilaan"],
  "penghinaan": ["penghinaan", "menghina", "menista", "pencemaran"], "pencemaran nama baik": ["penghinaan", "menista", "pencemaran"], "fitnah": ["fitnah", "menista"],
  "pemalsuan": ["pemalsuan", "palsu", "memalsu"], "palsu": ["pemalsuan", "palsu"], "surat palsu": ["pemalsuan surat"], "sumpah palsu": ["sumpah palsu", "keterangan palsu"],
  "perusakan": ["menghancurkan", "merusakkan"], "pengrusakan": ["menghancurkan", "merusakkan"],
  "penculikan": ["kemerdekaan", "merampas kemerdekaan"], "zina": ["zinah", "mukah"], "perzinahan": ["zinah", "mukah"],
  "perseroan": ["perseroan"], "pt": ["perseroan"], "saham": ["saham"], "rups": ["rups"], "direksi": ["direksi"], "komisaris": ["komisaris"],
  "dividen": ["dividen"], "modal": ["modal"], "likuidasi": ["likuidasi", "pembubaran"], "pembubaran": ["pembubaran", "likuidasi"],
  "merger": ["penggabungan"], "penggabungan": ["penggabungan"], "akuisisi": ["pengambilalihan"], "pengambilalihan": ["pengambilalihan"],
  "pemegang saham": ["pemegang saham", "saham"], "anggaran dasar": ["anggaran dasar"], "pailit": ["pailit"], "dewan komisaris": ["komisaris"],
  "presiden": ["presiden"], "dpr": ["dewan perwakilan rakyat"], "mpr": ["majelis permusyawaratan"], "kewarganegaraan": ["warga negara"],
  "kekuasaan kehakiman": ["kehakiman", "mahkamah"], "agama": ["agama", "ketuhanan"], "pendidikan": ["pengajaran"],
};

const OUTSIDE = {
  "korupsi": "UU 31/1999 jo. 20/2001 (Tipikor)", "narkoba": "UU 35/2009 (Narkotika)", "narkotika": "UU 35/2009 (Narkotika)",
  "terorisme": "UU 5/2018 (Terorisme)", "pencucian uang": "UU 8/2010 (TPPU)", "wanprestasi": "KUHPerdata Ps. 1238, 1243 dst.",
  "perjanjian": "KUHPerdata Buku III", "kontrak": "KUHPerdata Buku III", "cerai": "UU Perkawinan / KHI", "ite": "UU 19/2016 (ITE)",
  "ketenagakerjaan": "UU 13/2003 jo. Cipta Kerja", "phk": "UU Ketenagakerjaan / Cipta Kerja",
};

function expandTerms(q) {
  const n = norm(q);
  const terms = new Set(n.split(" ").filter((w) => w.length > 2 && !STOP.has(w)));
  for (const k of Object.keys(SYN)) if (n.includes(k)) SYN[k].forEach((t) => terms.add(t));
  return [...terms];
}
function outsideHits(q) {
  const n = norm(q);
  return Object.keys(OUTSIDE).filter((k) => n.includes(k)).map((k) => ({ k, v: OUTSIDE[k] }));
}
const LAWFAM = {
  pidana: (l) => l === "KUHP",
  korporasi: (l) => l.indexOf("UU PT") === 0,
  tata: (l) => l === "UUD 1945",
  pailit: (l) => l.indexOf("UU 37/2004") === 0,
  acara: (l) => l.indexOf("UU 20/2025") === 0 || l === "RV",
  siber: (l) => l.indexOf("UU ITE") === 0,
  niaga: (l) => l.indexOf("UU 30/1999") === 0 || l.indexOf("UU 4/2023") === 0,
};
function lawInFilter(l, f) { const fn = LAWFAM[f]; return fn ? fn(l) : true; }
function searchPasal(q, filter) {
  const terms = expandTerms(q);
  if (!terms.length) return [];
  const res = [];
  for (const e of PASAL) {
    if (filter && filter !== "all" && !lawInFilter(e.l, filter)) continue;
    const b = norm(e.b), t = norm(e.t);
    let score = 0;
    for (const term of terms) {
      if (b.includes(term)) score += 6;
      const c = t.split(term).length - 1;
      if (c > 0) score += Math.min(c, 3) * 2;
    }
    if (score > 0) res.push({ ...e, score });
  }
  res.sort((a, b) => b.score - a.score);
  const max = res.length ? res[0].score : 1;
  return res.slice(0, 24).map((r) => ({ ...r, rel: Math.round((r.score / max) * 100) }));
}
const LAW_SHORT = { "KUHP": "KUHP", "UUD 1945": "UUD '45", "UU 37/2004": "UU Pailit", "UU ITE 11/2008": "ITE '08", "UU ITE 1/2024": "ITE '24", "UU 30/1999": "Arbitrase", "UU 20/2025": "KUHAP", "UU 4/2023": "P2SK", "RV": "RV" };
const LAW_COLOR = { "KUHP": "#1fb37e", "UUD 1945": "#8fb6d6", "UU 37/2004": "#c98f7f", "UU ITE 11/2008": "#9f8fd6", "UU ITE 1/2024": "#9f8fd6", "UU 30/1999": "#7fc8b0", "UU 20/2025": "#d69f8f", "UU 4/2023": "#b0c87f", "RV": "#8f9fb0" };
const lawShort = (l = "") => LAW_SHORT[l] || (l.indexOf("UU PT") === 0 ? "UU PT" : l);
const lawSlug = (l = "") => l === "KUHP" ? "kuhp" : l === "UUD 1945" ? "uud" : l.replace(/[^A-Za-z0-9]+/g, "").toLowerCase();
const lawColor = (l = "") => LAW_COLOR[l] || (l.indexOf("UU PT") === 0 ? "#d8c08a" : "#8fb6d6");

/* ===================== REASONING ENGINE (deterministic, client-side) ===================== */
const CERT_RANK = { uncertain: 0, alleged: 1, asserted: 2 };
const CERT_BY = ["uncertain", "alleged", "asserted"];
const minCert = (facts) => { if (!facts.length) return "asserted"; let m = 2; facts.forEach((f) => { const r = CERT_RANK[f.certainty]; if (r < m) m = r; }); return CERT_BY[m]; };
const certColor = (c) => (c === "asserted" ? "#1fb37e" : c === "alleged" ? "#d8c08a" : "#7e8c86");
const statusColor = (s) => s === "Strong support" ? "#1fb37e" : s === "Moderate–High support" ? "#9fd6bf" : s === "Moderate support" ? "#d8c08a" : s === "Weak support" ? "#c9a96a" : "#7e8c86";
const confColor = (c) => ({ High: "#1fb37e", "Moderate–High": "#9fd6bf", Moderate: "#d8c08a", Low: "#c9a96a", "Not assessable": "#7e8c86" }[c] || "#7e8c86");

const CAT_RULES = [
  ["timeline", /tanggal|pukul|wib|\bhari\b|\bjam\b|\b\d{4}\b|januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|kemudian|setelah|sekitar|menit/i],
  ["financial", /\brp\b|rupiah|\bjuta\b|\bmiliar\b|\bribu\b/i],
  ["transaction", /perjanjian|kontrak|jual beli|utang|piutang|pinjam|membayar|pembayaran|transfer|harga|menyewa|investasi|modal/i],
  ["document", /surat|akta|cctv|rekaman|barang bukti|dokumen|kuitansi|kwitansi|nota|sertifikat|visum/i],
  ["relationship", /hubungan|rekan|teman|sahabat|suami|istri|atasan|mitra|riwayat|kenal|saudara/i],
  ["party", /bernama|korban|pelaku|tersangka|terdakwa|terlapor|saksi|\bpt\b|\bcv\b|perseroan|direktur/i],
  ["action", /./],
];
const detectCat = (s) => { for (const [c, re] of CAT_RULES) if (re.test(s)) return c; return "action"; };
const ALLEGED_RE = /diduga|diperkirakan|kemungkinan|disinyalir|diindikasikan|konon/i;
const EXTLABEL_RE = /menetapkan.*tersangka|sebagai tersangka|menurut (polisi|kepolisian|keterangan)|polisi menyatakan|dinyatakan.*tersangka/i;

function extractFacts(text) {
  const sents = text.replace(/\n+/g, ". ").replace(/([.!?])\s+/g, "$1\u0001").split("\u0001").map((s) => s.trim()).filter((s) => s.length > 12);
  const facts = sents.map((s, i) => ({
    id: `fact_${String(i + 1).padStart(2, "0")}`,
    category: detectCat(s),
    statement: /[.!?]$/.test(s) ? s : s + ".",
    certainty: ALLEGED_RE.test(s) ? "alleged" : "asserted",
    externalLabel: EXTLABEL_RE.test(s) || undefined,
  }));
  const t = norm(text); const missing = []; let mi = 1; const mid = () => `fact_m${mi++}`;
  if (/menusuk|melukai|menganiaya|memukul|kekerasan|tewas|meninggal|membunuh|bacok|tembak/.test(t)) {
    missing.push({ id: mid(), category: "forensic", description: "Hasil visum et repertum / autopsi resmi." });
    missing.push({ id: mid(), category: "forensic", description: "Jumlah & lokasi luka." });
    missing.push({ id: mid(), category: "action", description: "Siapa yang memulai kontak fisik." });
    missing.push({ id: mid(), category: "action", description: "Niat / keadaan batin pelaku." });
  }
  if (/utang|pinjam|perjanjian|kontrak|jual beli|wanprestasi|investasi/.test(t)) {
    missing.push({ id: mid(), category: "financial", description: "Nilai transaksi & status pembayaran." });
    missing.push({ id: mid(), category: "document", description: "Bukti perikatan tertulis (kontrak/kuitansi)." });
  }
  if (/mengambil|mencuri|membawa kabur|menggelapkan/.test(t)) missing.push({ id: mid(), category: "action", description: "Jenis/nilai barang & bukti kepemilikan." });
  if (!missing.length) missing.push({ id: mid(), category: "timeline", description: "Rincian waktu/tempat yang lebih spesifik." });
  return { caseId: "case_live", facts, missingFacts: missing };
}

const OFFENSES = [
  { key: /membunuh|pembunuhan|menghilangkan nyawa|merampas nyawa|tewas|meninggal/i, cat: "criminal", seed: "pembunuhan", issue: "Dugaan perbuatan yang mengakibatkan hilangnya nyawa orang lain", ind: [/menusuk|menembak|membacok|memukul|bacok/i, /meninggal|tewas|mati/i, /senjata|pisau|celurit|golok/i] },
  { key: /menganiaya|penganiayaan|memukul|melukai|menusuk/i, cat: "criminal", seed: "penganiayaan", issue: "Dugaan penganiayaan / kekerasan terhadap orang", ind: [/memukul|menusuk|melukai|menganiaya/i, /luka/i] },
  { key: /mencuri|pencurian|maling|mengambil.*(barang|motor|hp|uang|sepeda|dompet)/i, cat: "criminal", seed: "pencurian", issue: "Dugaan pengambilan barang milik orang lain", ind: [/mengambil|mencuri|membawa kabur/i, /milik|barang/i] },
  { key: /menipu|penipuan|\btipu\b|janji palsu|investasi bodong/i, cat: "criminal", seed: "penipuan", issue: "Dugaan penipuan", ind: [/menipu|tipu|bohong|palsu/i, /uang|barang|menyerahkan|transfer/i] },
  { key: /menggelapkan|penggelapan/i, cat: "criminal", seed: "penggelapan", issue: "Dugaan penggelapan", ind: [/menggelapkan|menguasai|dititipkan/i] },
  { key: /mengancam|pengancaman|memeras|pemerasan/i, cat: "criminal", seed: "pemerasan pengancaman", issue: "Dugaan pengancaman / pemerasan", ind: [/mengancam|memaksa|ancaman/i] },
  { key: /menghina|pencemaran nama baik|memfitnah|\bfitnah\b/i, cat: "criminal", seed: "penghinaan", issue: "Dugaan penghinaan / pencemaran nama baik", ind: [/menghina|mencemarkan|fitnah/i] },
  { key: /utang|piutang|wanprestasi|tidak membayar|gagal bayar|belum.*bayar/i, cat: "civil", seed: "", issue: "Sengketa keperdataan (utang / wanprestasi)", ind: [/utang|pinjam|bayar|perjanjian/i] },
  { key: /perjanjian|kontrak|jual beli/i, cat: "civil", seed: "", issue: "Hubungan kontraktual yang dipersengketakan", ind: [/perjanjian|kontrak|sepakat/i] },
  { key: /rups|direksi|komisaris|pemegang saham|\bsaham\b|perseroan|dividen/i, cat: "corporate", seed: "RUPS direksi komisaris saham perseroan", issue: "Isu tata kelola perseroan (UU PT)", ind: [/rups|direksi|komisaris|saham/i] },
  { key: /pailit|kepailitan|pkpu|penundaan kewajiban pembayaran|insolven|kurator|kreditor|debitor|harta pailit/i, cat: "corporate", seed: "kepailitan pkpu pailit utang kreditor debitor kurator", issue: "Dugaan keadaan insolvensi / kepailitan atau PKPU (UU 37/2004)", ind: [/pailit|kepailitan|pkpu/i, /utang|kreditor|debitor|jatuh tempo|tidak.*bayar/i, /kurator|pengadilan niaga|verifikasi/i] },
  { key: /elektronik|medsos|media sosial|internet|whatsapp|facebook|online|unggah|posting|hoax|berita bohong|ujaran|judi online|konten/i, cat: "criminal", seed: "informasi elektronik dokumen elektronik kesusilaan perjudian penghinaan transmisi", issue: "Dugaan tindak pidana siber / ITE (UU ITE)", ind: [/elektronik|online|medsos|internet|unggah|posting|konten/i, /menghina|pencemaran|kesusilaan|judi|hoax|bohong|ancaman/i] },
  { key: /arbitrase|klausula arbitrase|\bbani\b|penyelesaian sengketa.*arbitrase/i, cat: "civil", seed: "arbitrase sengketa perdagangan putusan arbitrase perjanjian", issue: "Penyelesaian sengketa melalui arbitrase (UU 30/1999)", ind: [/arbitrase|arbiter|bani/i, /sengketa|perjanjian|dagang/i] },
];
const PROC_RE = /cctv|saksi|barang bukti|laporan polisi|melapor|tersangka|penyidikan|visum|alat bukti/i;

function spotIssues(fm) {
  const text = fm.facts.map((f) => f.statement).join(" ");
  const issues = []; let n = 1; const seen = new Set();
  const factsFor = (re) => fm.facts.filter((f) => re.test(f.statement)).map((f) => f.id);
  OFFENSES.forEach((o) => {
    if (!o.key.test(text)) return;
    const fids = factsFor(o.key); if (!fids.length) return;
    const hits = o.ind.filter((re) => re.test(text)).length;
    const conf = hits >= 3 ? "High" : hits === 2 ? "Moderate–High" : hits === 1 ? "Moderate" : "Low";
    const refs = fm.facts.filter((f) => fids.includes(f.id));
    issues.push({ id: `issue_${n++}`, category: o.cat, statement: o.issue, confidence: conf, factIds: fids, derivedCertainty: minCert(refs), seed: o.seed });
    seen.add(o.cat);
  });
  if (PROC_RE.test(text)) {
    const fids = factsFor(PROC_RE); const ref = fids.length ? fids : [fm.facts[0]?.id].filter(Boolean);
    issues.push({ id: `issue_${n++}`, category: "procedural", statement: "Kecukupan & keabsahan alat bukti serta proses penanganan perkara", confidence: "Moderate", factIds: ref, derivedCertainty: minCert(fm.facts.filter((f) => ref.includes(f.id))), seed: "" });
    seen.add("procedural");
  }
  return { caseId: fm.caseId, issues, emptyCategories: ["civil", "criminal", "corporate", "procedural"].filter((c) => !seen.has(c)) };
}

function retrieveStatutes(is, fm, filter) {
  const seeds = [...new Set(is.issues.map((i) => i.seed).filter(Boolean))];
  const merged = new Map();
  seeds.forEach((seed) => {
    searchPasal(seed, filter).slice(0, 4).forEach((h) => {
      const key = h.l + h.p;
      if (!merged.has(key) || merged.get(key).rel < h.rel) merged.set(key, h);
    });
  });
  const hits = [...merged.values()].sort((a, b) => b.rel - a.rel).slice(0, 6);
  const outsideQ = fm.facts.map((f) => f.statement).join(" ") + (is.issues.some((i) => i.category === "civil") ? " wanprestasi perjanjian" : "");
  return {
    caseId: fm.caseId, maxResults: 8, outside: outsideHits(outsideQ),
    retrieved: hits.map((h) => {
      const fids = fm.facts.filter((f) => norm(h.b).split(" ").some((w) => w.length > 4 && norm(f.statement).includes(w))).slice(0, 3).map((f) => f.id);
      const sf = fids.length ? fids : fm.facts.slice(0, 1).map((f) => f.id);
      return { id: `${lawSlug(h.l)}_${h.p}`, law: h.l, article: h.p, modernEquivalent: h.l === "KUHP" ? KUHP_MAP[h.p] : undefined, text: h.t, b: h.b, rel: h.rel, reasonRetrieved: `Relevansi faktual dengan ${h.b || lawShort(h.l)} (skor ${h.rel}%).`, relevance: h.rel > 70 ? "High" : h.rel > 45 ? "Moderate–High" : h.rel > 25 ? "Moderate" : "Low", factIds: sf, derivedCertainty: minCert(fm.facts.filter((f) => sf.includes(f.id))) };
    }),
  };
}

const ELEMENTS = {
  "338": [["Barang siapa", /pelaku|tersangka|terdakwa|bernama/i], ["Dengan sengaja", /sengaja|berkali-kali|beberapa kali|membawa.*(pisau|senjata)/i], ["Merampas nyawa orang lain", /meninggal|tewas|mati|nyawa/i]],
  "340": [["Barang siapa", /pelaku|tersangka/i], ["Dengan rencana terlebih dahulu", /menghadang|kembali|merencanakan|menunggu|sebelumnya telah dibawa|sebelumnya dibawa/i], ["Dengan sengaja", /sengaja|berkali-kali|beberapa kali/i], ["Merampas nyawa orang lain", /meninggal|tewas|mati/i]],
  "351": [["Barang siapa", /pelaku|tersangka/i], ["Penganiayaan (menimbulkan luka/sakit)", /menusuk|memukul|melukai|menganiaya|luka/i], ["Akibat (luka berat/mati)", /meninggal|luka berat|mati|tewas/i]],
  "362": [["Barang siapa", /pelaku|tersangka|terlapor/i], ["Mengambil suatu barang", /mengambil|mencuri|membawa kabur/i], ["Milik orang lain", /milik|kepunyaan|korban/i], ["Maksud memiliki melawan hukum", /tanpa izin|melawan hukum|memiliki/i]],
  "378": [["Barang siapa", /pelaku|terlapor/i], ["Tipu muslihat / rangkaian kebohongan", /tipu|bohong|palsu|memperdaya/i], ["Menggerakkan menyerahkan barang", /menyerahkan|memberikan|transfer|membayar/i], ["Menguntungkan diri melawan hukum", /keuntungan|menguntungkan/i]],
  "372": [["Barang siapa", /pelaku|terlapor/i], ["Memiliki melawan hukum", /menggelapkan|memiliki|menguasai/i], ["Barang ada dalam kekuasaannya", /dititipkan|dipercayakan|dipinjamkan|dalam kekuasaan/i]],
};
const CONTRA = { "Dengan sengaja": /perkelahian|adu mulut|membela diri|spontan/i, "Dengan rencana terlebih dahulu": /perkelahian|adu mulut|spontan|emosi/i };

function testElements(rs, fm) {
  const tests = [];
  rs.retrieved.forEach((s) => {
    const defs = ELEMENTS[s.article]; if (!defs) return;
    defs.forEach((d, i) => {
      const [el, cue] = d;
      const sup = fm.facts.filter((f) => cue.test(f.statement));
      const cre = CONTRA[el]; const contra = cre ? fm.facts.filter((f) => cre.test(f.statement)) : [];
      let status;
      if (/barang siapa/i.test(el)) status = sup.length ? "Strong support" : "Not enough facts";
      else if (!sup.length) status = "Not enough facts";
      else if (contra.length) status = "Weak support";
      else if (sup.length >= 2) status = "Moderate–High support";
      else status = "Moderate support";
      const allExt = sup.length > 0 && sup.every((f) => f.externalLabel);
      if (allExt && (status === "Strong support" || status === "Moderate–High support")) status = "Weak support";
      const used = [...sup, ...contra];
      tests.push({ id: `${s.id}__${i}`, article: s.article, element: el, supportingFactIds: sup.map((f) => f.id), contradictingFactIds: contra.map((f) => f.id), status, derivedCertainty: minCert(used.length ? used : [{ certainty: "uncertain" }]) });
    });
  });
  return { caseId: fm.caseId, tests };
}

/* ===================== INVARIANT AUDIT =====================
   Faithful, NON-throwing port of legalPipeline.validators.ts. The TS validators
   THROW (fail loud) for the test harness; here we collect a structured per-invariant
   report so the dashboard can surface exactly which guarantees held — with the same
   error codes. This is the bridge that wires the verified contract into the live UI. */
const STATUTE_RE = /\bpasal\s*\d+/i;
const VERDICT_RE = /\b(terbukti|bersalah|divonis|dijatuhi|memenuhi seluruh unsur|dapat dipidana|pasal yang tepat|vonis)\b/i;
const _rank = (c) => (CERT_RANK[c] != null ? CERT_RANK[c] : 0);
const _ceiling = (factIds, byId) => {
  const refs = factIds.map((id) => byId[id]).filter(Boolean);
  if (!refs.length) return "uncertain";
  let m = 2; refs.forEach((f) => { if (_rank(f.certainty) < m) m = _rank(f.certainty); });
  return CERT_BY[m];
};

function auditPipeline(fm, is, rs, etr) {
  const checks = [];
  const add = (code, label, ok, detail = "") => checks.push({ code, label, ok, detail });
  const byId = Object.fromEntries(fm.facts.map((f) => [f.id, f]));
  const missingIds = new Set(fm.missingFacts.map((m) => m.id));
  const retrievedArticles = new Set(rs.retrieved.map((s) => s.article));

  /* Stage 1 — Fakta */
  const seen = new Set(); let dup = null;
  for (const f of fm.facts) { if (seen.has(f.id)) dup = f.id; seen.add(f.id); }
  add("DUP_FACT", "Stage 1 · Tidak ada factId ganda", !dup, dup ? `Duplikat ${dup}` : "");
  const sf = fm.facts.find((f) => STATUTE_RE.test(f.statement));
  add("STATUTE_IN_FACTS", "Stage 1 · Fakta tidak menyebut pasal", !sf, sf ? `${sf.id} menyebut pasal` : "");

  /* Stage 2 — Isu */
  const iNoTrace = is.issues.find((i) => !i.factIds.length || i.factIds.some((id) => !byId[id]));
  add("ISSUE_NO_TRACE", "Stage 2 · Setiap isu tertaut ke fakta valid", !iNoTrace, iNoTrace ? `${iNoTrace.id} tanpa jejak` : "");
  const iRaised = is.issues.find((i) => _rank(i.derivedCertainty) > _rank(_ceiling(i.factIds, byId)));
  add("UNCERTAINTY_RAISED", "Stage 2 · Kepastian isu ≤ plafon faktanya", !iRaised, iRaised ? `${iRaised.id}: '${iRaised.derivedCertainty}' > '${_ceiling(iRaised.factIds, byId)}'` : "");
  const iStat = is.issues.find((i) => STATUTE_RE.test(`${i.statement} ${i.reason || ""}`));
  add("STATUTE_IN_ISSUE", "Stage 2 · Isu tidak menyebut pasal (prematur)", !iStat, iStat ? `${iStat.id} menyebut pasal` : "");

  /* Stage 3 — Pasal */
  add("RETRIEVAL_OVERFLOW", "Stage 3 · Retrieval ≤ maxResults", rs.retrieved.length <= rs.maxResults, `${rs.retrieved.length}/${rs.maxResults}`);
  const sNoTrace = rs.retrieved.find((s) => !s.factIds.length || s.factIds.some((id) => !byId[id]));
  add("STATUTE_NO_TRACE", "Stage 3 · Setiap pasal tertaut ke fakta valid", !sNoTrace, sNoTrace ? `${sNoTrace.id} tanpa jejak` : "");
  const sRaised = rs.retrieved.find((s) => _rank(s.derivedCertainty) > _rank(_ceiling(s.factIds, byId)));
  add("UNCERTAINTY_RAISED", "Stage 3 · Kepastian pasal ≤ plafon faktanya", !sRaised, sRaised ? `${sRaised.id}: '${sRaised.derivedCertainty}' melebihi plafon` : "");

  /* Stage 4 — Uji Unsur */
  const eStat = etr.tests.find((t) => !retrievedArticles.has(t.article));
  add("ELEMENT_BAD_STATUTE", "Stage 4 · Unsur hanya atas pasal yang diretrieve", !eStat, eStat ? `${eStat.id} → pasal ${eStat.article} tak diretrieve` : "");
  const eFact = etr.tests.find((t) => [...t.supportingFactIds, ...t.contradictingFactIds].some((id) => !byId[id]));
  add("ELEMENT_BAD_FACT", "Stage 4 · Referensi fakta valid", !eFact, eFact ? `${eFact.id} menyebut fakta tak dikenal` : "");
  const eMiss = etr.tests.find((t) => (t.missingFactIds || []).some((id) => !missingIds.has(id)));
  add("ELEMENT_BAD_MISSING", "Stage 4 · Referensi missing-fact valid", !eMiss, eMiss ? `${eMiss.id} menyebut missing-fact tak dikenal` : "");
  const eRaised = etr.tests.find((t) => _rank(t.derivedCertainty) > _rank(_ceiling([...t.supportingFactIds, ...t.contradictingFactIds], byId)));
  add("UNCERTAINTY_RAISED", "Stage 4 · Kepastian unsur ≤ plafon faktanya", !eRaised, eRaised ? `${eRaised.id} melebihi plafon` : "");
  const leak = etr.tests.find((t) => VERDICT_RE.test(`${t.element} ${t.note || ""}`));
  add("VERDICT_LEAK", "Stage 4 · Tidak menghasilkan vonis", !leak, leak ? `${leak.id} memuat bahasa vonis` : "");
  const ext = etr.tests.find((t) => {
    const strong = t.status === "Strong support" || t.status === "Moderate–High support";
    return strong && t.supportingFactIds.length > 0 && t.supportingFactIds.every((id) => byId[id] && byId[id].externalLabel === true);
  });
  add("EXTERNAL_LABEL_LEAK", "Stage 4 · Dukungan kuat ≠ semata label eksternal", !ext, ext ? `${ext.id} bersandar pada label eksternal` : "");

  return { checks, passed: checks.filter((c) => c.ok).length, total: checks.length };
}

/* ===================== AI REASONING LAYER (Stage 1–2) =====================
   The heuristic engine matches keywords; this layer adds understanding to the
   two brittle stages — fact extraction (actors, negation, certainty) and issue
   spotting (implied issues, correct category). Crucially, it stays SAFE:
     • Statute retrieval (Stage 3) & element testing (Stage 4) remain the
       DETERMINISTIC, grounded engines — the model never invents pasal.
     • Every derivedCertainty is RECOMPUTED here (minCert), so the uncertainty
       invariant holds by construction, whatever the model returns.
     • Pasal references are stripped from facts/issues (STATUTE_IN_* invariants).
     • The same auditPipeline() validates the result; if the model output is
       malformed or regresses the audit, we fall back to the heuristic engine.
   ========================================================================== */
const _AI_FACT_CATS = ["party", "timeline", "transaction", "document", "action", "financial", "relationship"];
const _AI_CAT_MAP = { pihak: "party", waktu: "timeline", kronologi: "timeline", transaksi: "transaction", dokumen: "document", perbuatan: "action", tindakan: "action", keuangan: "financial", finansial: "financial", hubungan: "relationship" };
const _AI_ISSUE_CATS = ["civil", "criminal", "corporate", "procedural"];
const _AI_CONF = ["High", "Moderate–High", "Moderate", "Low", "Not assessable"];
const _aiNormCat = (c) => { c = String(c || "").toLowerCase().trim(); return _AI_FACT_CATS.includes(c) ? c : (_AI_CAT_MAP[c] || "action"); };
const _aiStripPasal = (s) => String(s == null ? "" : s).replace(/\bpasal\s*\d+[a-z]?/ig, "").replace(/\bpsl\.?\s*\d+/ig, "").replace(/\s{2,}/g, " ").trim();

async function aiAnalyzeChronology(text, hint) {
  return CaseAnalysisAgent.analyzeChronology(text, hint || {});
}

/* Assemble live-shape fm/is from raw AI output, recomputing certainties and
   sanitizing, then reuse the deterministic grounded Stage 3–4 + audit. */
function buildFromAI(text, filter, raw) {
  if (!raw || !Array.isArray(raw.facts) || !raw.facts.length) return null;
  const facts = [];
  raw.facts.forEach((f, i) => {
    const statement = _aiStripPasal(f && f.statement);
    if (!statement || statement.length < 3) return;
    const cert = ["asserted", "alleged", "uncertain"].includes(f.certainty) ? f.certainty : "asserted";
    facts.push({
      id: `fact_${String(facts.length + 1).padStart(2, "0")}`,
      _srcIndex: i,
      category: _aiNormCat(f.category),
      statement: /[.!?]$/.test(statement) ? statement : statement + ".",
      certainty: cert,
      externalLabel: f.externalLabel === true ? true : undefined,
    });
  });
  if (!facts.length) return null;
  const byIndex = {}; facts.forEach((f) => { byIndex[f._srcIndex] = f.id; });

  let mi = 1; const missingFacts = (Array.isArray(raw.missingFacts) ? raw.missingFacts : [])
    .map((m) => ({ id: `fact_m${mi++}`, category: String((m && m.category) || "action"), description: _aiStripPasal(m && m.description) || "Detail tambahan diperlukan.", neededFor: m && m.neededFor ? String(m.neededFor) : undefined }))
    .filter((m) => m.description);
  if (!missingFacts.length) missingFacts.push({ id: "fact_m1", category: "timeline", description: "Rincian waktu/tempat yang lebih spesifik." });

  const fm = { caseId: "case_live", facts: facts.map(({ _srcIndex, ...f }) => f), missingFacts };

  const seen = new Set(); let n = 1;
  const issues = (Array.isArray(raw.issues) ? raw.issues : []).map((it) => {
    const category = _AI_ISSUE_CATS.includes(it && it.category) ? it.category : null;
    if (!category) return null;
    const statement = _aiStripPasal(it && it.statement);
    if (!statement) return null;
    let factIds = (Array.isArray(it.factIndexes) ? it.factIndexes : []).map((ix) => byIndex[ix]).filter(Boolean);
    factIds = [...new Set(factIds)];
    if (!factIds.length) factIds = [fm.facts[0].id]; // keep traceability invariant
    const refs = fm.facts.filter((f) => factIds.includes(f.id));
    seen.add(category);
    return {
      id: `issue_${n++}`, category, statement,
      confidence: _AI_CONF.includes(it.confidence) ? it.confidence : "Moderate",
      factIds, derivedCertainty: minCert(refs), // RECOMPUTED — invariant safe
      seed: String((it.seedKeywords || "")).trim(),
    };
  }).filter(Boolean);
  if (!issues.length) return null; // nothing useful → let caller fall back

  const is = { caseId: fm.caseId, issues, emptyCategories: _AI_ISSUE_CATS.filter((c) => !seen.has(c)) };

  // Stage 3 & 4 stay deterministic + grounded; Stage 3 seeds come from AI issues.
  const rs = retrieveStatutes(is, fm, filter);
  const etr = testElements(rs, fm);
  const audit = auditPipeline(fm, is, rs, etr);
  return { fm, is, rs, etr, audit, passed: audit.passed, source: "ai" };
}

/* Always returns a valid pipeline result. Heuristic is the floor; AI upgrades when audit OK. */
async function aiRunPipeline(text, filter) {
  const heur = runPipeline(text, filter);
  heur.source = "heuristic";
  heur.aiStatus = "heuristic";
  try {
    const hint = {
      heuristicFacts: heur.fm.facts.map((f) => f.statement),
      heuristicIssues: heur.is.issues.map((i) => i.statement),
    };
    const raw = await aiAnalyzeChronology(text, hint);
    let built = buildFromAI(text, filter, raw);
    if (!built || !built.fm.facts.length || !built.is.issues.length) {
      heur.aiStatus = "fallback";
      heur.aiNote = "AI tidak menghasilkan fakta/isu valid — pakai heuristik.";
      return heur;
    }

    try {
      const reranked = await CaseAnalysisAgent.rerankStatutes(built.rs, built.fm.facts, built.is.issues);
      if (reranked) {
        built.rs = reranked;
        built.etr = testElements(built.rs, built.fm);
        built.audit = auditPipeline(built.fm, built.is, built.rs, built.etr);
        built.passed = built.audit.passed;
        built.rsAiReranked = true;
      }
    } catch (e) { /* rerank optional */ }

    if (built.audit.passed >= heur.audit.passed) {
      built.source = "ai";
      built.aiStatus = "ai";
      built.heurCompare = {
        facts: heur.fm.facts.length,
        issues: heur.is.issues.length,
        audit: heur.audit.passed,
      };
      return built;
    }
    heur.aiStatus = "fallback";
    heur.aiNote = `AI audit ${built.audit.passed}/${built.audit.total} < heuristik ${heur.audit.passed}/${heur.audit.total} — pakai heuristik.`;
    return heur;
  } catch (e) {
    heur.aiStatus = "error";
    heur.aiError = String(e.message || e);
    return heur;
  }
}

function runPipeline(text, filter) {
  const fm = extractFacts(text);
  const is = spotIssues(fm);
  const rs = retrieveStatutes(is, fm, filter);
  const etr = testElements(rs, fm);
  const audit = auditPipeline(fm, is, rs, etr);
  return { fm, is, rs, etr, audit, passed: audit.passed };
}

/* ===================== CASE-MEMO EXPORT ===================== */
const _esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const memoDocHTML = (inner) =>
  `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Memo Analisa Hukum</title><style>@page{size:A4;margin:2.4cm} body{font-family:'Times New Roman',serif;font-size:11.5pt;line-height:1.55;color:#000;text-align:left} h1{text-align:center;font-size:14pt;margin:0 0 2px} h2{font-size:12pt;border-bottom:1px solid #000;padding-bottom:3px;margin:18px 0 8px} .sub{text-align:center;font-size:10pt;color:#444;margin:0 0 4px} table{width:100%;border-collapse:collapse;font-size:10pt;margin:6px 0} th,td{border:1px solid #999;padding:5px 7px;vertical-align:top;text-align:left} th{background:#f0f0f0} .ok{color:#0a7a4f} .bad{color:#b00020} .mut{color:#555;font-size:9.5pt} .tag{font-family:monospace;font-size:8.5pt;color:#555} .note{border:1px solid #999;background:#fafafa;padding:9px 11px;font-size:9.5pt;color:#333;margin-top:10px}</style></head><body>${inner}</body></html>`;

function buildMemoHTML(data, cls) {
  const { fm, is, rs, etr, audit } = data;
  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const factsRows = fm.facts.map((f) => `<tr><td class="tag">${_esc(f.id)}</td><td>${_esc(f.statement)}</td><td>${_esc(f.category)}</td><td>${_esc(f.certainty)}${f.externalLabel ? " <span class='mut'>(label eksternal)</span>" : ""}</td></tr>`).join("");
  const missRows = fm.missingFacts.map((m) => `<li>${_esc(m.description)} <span class="mut">(${_esc(m.category)})</span></li>`).join("");
  const issueRows = is.issues.map((i) => `<tr><td>${_esc(i.statement)}</td><td>${_esc(i.category)}</td><td>${_esc(i.confidence)}</td><td>${_esc(i.derivedCertainty)}</td><td class="tag">${_esc(i.factIds.join(", "))}</td></tr>`).join("");
  const statRows = rs.retrieved.map((s) => `<tr><td>${_esc(s.law)} Pasal ${_esc(s.article)}${s.modernEquivalent ? ` → KUHP 2023 Ps. ${_esc(s.modernEquivalent)}` : ""}</td><td>${_esc(s.relevance)} (${_esc(s.rel)}%)</td><td class="tag">${_esc(s.factIds.join(", "))}</td></tr>`).join("");
  const elBlocks = rs.retrieved.filter((s) => etr.tests.some((t) => t.article === s.article)).map((s) => {
    const rows = etr.tests.filter((t) => t.article === s.article).map((t) => {
      const trace = [
        t.supportingFactIds.length ? `dukung: ${t.supportingFactIds.join(", ")}` : "",
        t.contradictingFactIds.length ? `kontra: ${t.contradictingFactIds.join(", ")}` : "",
        (t.missingFactIds && t.missingFactIds.length) ? `hilang: ${t.missingFactIds.join(", ")}` : "",
      ].filter(Boolean).join(" · ") || "—";
      return `<tr><td>${_esc(t.element)}</td><td>${_esc(t.status)}</td><td>${_esc(t.derivedCertainty)}</td><td class="tag">${_esc(trace)}</td></tr>`;
    }).join("");
    return `<p style="margin:10px 0 2px"><b>Pasal ${_esc(s.article)}${s.modernEquivalent ? ` → KUHP 2023 Ps. ${_esc(s.modernEquivalent)}` : ""}</b></p><table><tr><th>Unsur</th><th>Tingkat dukungan</th><th>Kepastian</th><th>Jejak fakta</th></tr>${rows}</table>`;
  }).join("");
  const auditRows = audit.checks.map((c) => `<tr><td class="${c.ok ? "ok" : "bad"}">${c.ok ? "LULUS" : "GAGAL"}</td><td>${_esc(c.label)}</td><td class="tag">${_esc(c.code)}</td><td class="mut">${_esc(c.detail)}</td></tr>`).join("");
  return `
    <h1>MEMORANDUM ANALISA HUKUM</h1>
    <p class="sub">KNSL Legal Intelligence · dihasilkan ${_esc(today)}</p>
    <p class="sub">Klasifikasi: ${_esc(cls ? cls.label : "—")}</p>
    <h2>I. Ringkasan</h2>
    <p>${_esc(cls ? cls.desc : "")}</p>
    <p><b>Alur proses: </b>${_esc(cls ? cls.proses : "")}</p>
    <h2>II. Matriks Fakta (Stage 1)</h2>
    <table><tr><th>ID</th><th>Pernyataan</th><th>Kategori</th><th>Kepastian</th></tr>${factsRows}</table>
    <p class="mut" style="margin-top:6px"><b>Fakta yang masih kurang:</b></p><ul class="mut">${missRows}</ul>
    <h2>III. Isu Hukum (Stage 2)</h2>
    <table><tr><th>Isu</th><th>Ranah</th><th>Keyakinan</th><th>Kepastian</th><th>Jejak fakta</th></tr>${issueRows}</table>
    <h2>IV. Dasar Hukum Diretrieve (Stage 3)</h2>
    <table><tr><th>Pasal</th><th>Relevansi</th><th>Jejak fakta</th></tr>${statRows}</table>
    <h2>V. Pengujian Unsur (Stage 4)</h2>
    ${elBlocks || "<p class='mut'>Belum ada unsur terdefinisi untuk pasal yang diretrieve.</p>"}
    <h2>VI. Audit Invarian Pipeline (${audit.passed}/${audit.total} lulus)</h2>
    <table><tr><th>Status</th><th>Invarian</th><th>Kode</th><th>Detail</th></tr>${auditRows}</table>
    <div class="note"><b>Catatan.</b> Memo ini dihasilkan oleh engine deterministik (heuristik) dengan jejak fakta yang dapat ditelusuri pada tiap klaim. Dokumen ini <b>bukan vonis</b>, bukan pendapat hukum final, dan bukan pengganti pertimbangan advokat. Setiap unsur dilaporkan sebagai tingkat dukungan, bukan kesimpulan bersalah/tidak.</div>`;
}
export { KUHP_MAP, DOMAINS, ACTIONS, classifyDomain, searchPasal, lawShort, lawSlug, lawColor, extractFacts, spotIssues, retrieveStatutes, testElements, auditPipeline, buildFromAI, aiRunPipeline, runPipeline, buildMemoHTML, memoDocHTML };
export { default as PASAL } from "../data/statutes/pasal.json";
