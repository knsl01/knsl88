/**
 * KNSL statute retrieval — shared by Research UI, RAG research agent, drafting cites.
 */

import { PASAL } from "../data/pasalCorpus.js";
import { LAW_META, FILTER_GROUPS, familyOf } from "../data/lawRegistry.js";

export { PASAL };

const STOP = new Set("yang dan ke dari pada untuk atau dengan itu ini saya dia mereka ada telah sudah karena maka oleh dalam adalah akan tidak sebuah para nya nya nya".split(" "));
export const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9\u00c0-\u024f\s]/g, " ").replace(/\s+/g, " ").trim();

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

export function outsideHits(q) {
  const n = norm(q);
  return Object.keys(OUTSIDE).filter((k) => n.includes(k)).map((k) => ({ k, v: OUTSIDE[k] }));
}

function lawInFilter(l, f) {
  if (!f || f === "all") return true;
  return familyOf(l) === f;
}

/**
 * Filter options for the "Sumber Hukum" dropdown — only families that actually
 * have at least one pasal in the corpus, so the list grows as laws are added.
 */
const PRESENT_FAMILIES = new Set(PASAL.map((e) => familyOf(e.l)).filter(Boolean));
export const FILTER_OPTIONS = [
  { key: "all", label: "Semua Sumber Hukum" },
  ...FILTER_GROUPS.filter((g) => PRESENT_FAMILIES.has(g.key)),
];

/** @returns {Array<{l,p,b,t,score?,rel?}>} */
export function searchPasal(q, filter = "all") {
  const terms = expandTerms(q);
  if (!terms.length) return [];
  const res = [];
  for (const e of PASAL) {
    if (filter && filter !== "all" && !lawInFilter(e.l, filter)) continue;
    const b = norm(e.b);
    const t = norm(e.t);
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

export const lawShort = (l = "") => (LAW_META[l] && LAW_META[l].short) || (l.indexOf("UU PT") === 0 ? "UU PT" : l);
export const lawSlug = (l = "") => (l === "KUHP" ? "kuhp" : l === "UUD 1945" ? "uud" : l.replace(/[^A-Za-z0-9]+/g, "").toLowerCase());
export const lawColor = (l = "") => (LAW_META[l] && LAW_META[l].color) || (l.indexOf("UU PT") === 0 ? "#d8c08a" : "#8fb6d6");

/** Format retrieved statutes for RAG prompt injection. */
export function formatPasalForRag(hits, max = 12) {
  return (hits || []).slice(0, max).map((e, i) => {
    const snip = String(e.t || "").slice(0, 320);
    return `[${i + 1}] ${e.l} Pasal ${e.p}${e.b ? ` — ${e.b}` : ""}\n${snip}`;
  }).join("\n\n");
}
