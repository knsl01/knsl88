/**
 * KNSL law registry — single source of truth for every statute source in the
 * corpus: badge label, badge color, and the filter family it belongs to.
 *
 * `family` is the dropdown filter key. `LAW_META` is keyed by the EXACT `l`
 * value stored in pasalCorpus.js. When ingesting a new UU, register it here
 * first (scripts/ingest-uu.mjs reads canonical codes from this file) so the
 * pipeline, badges, and filters pick it up automatically.
 */

export const LAW_META = {
  // ---- already indexed ----
  KUHP: { short: "KUHP", color: "#1fb37e", family: "pidana" },
  "UU PT No.40/2007": { short: "UU PT", color: "#d8c08a", family: "korporasi" },
  "UUD 1945": { short: "UUD '45", color: "#8fb6d6", family: "tata" },
  "UU 37/2004": { short: "UU Pailit", color: "#c98f7f", family: "pailit" },
  "UU ITE 11/2008": { short: "ITE '08", color: "#9f8fd6", family: "siber" },
  "UU ITE 1/2024": { short: "ITE '24", color: "#9f8fd6", family: "siber" },
  "UU 30/1999": { short: "Arbitrase", color: "#7fc8b0", family: "niaga" },
  "UU 4/2023": { short: "P2SK", color: "#b0c87f", family: "niaga" },
  "UU 20/2025": { short: "KUHAP", color: "#d69f8f", family: "acara" },
  RV: { short: "RV", color: "#8f9fb0", family: "acara" },

  // ---- to be populated via ingest (text pasted from official JDIH) ----
  "UU 31/1999 jo. 20/2001": { short: "Tipikor", color: "#e0b341", family: "korupsi" },
  "UU 35/2009": { short: "Narkotika", color: "#cf6f6f", family: "narkotika" },
  "UU 8/2010": { short: "TPPU", color: "#b88fd6", family: "tppu" },
  "UU 13/2003": { short: "Naker", color: "#7fb6c8", family: "naker" },
  "UU 6/2023": { short: "Cipta Kerja", color: "#9fc87f", family: "ciptaker" },
  "UU 24/2003": { short: "UU MK", color: "#8fa8d6", family: "konstitusi" },
  "UU 25/2007": { short: "Penanaman Modal", color: "#c8b07f", family: "investasi" },
  "UU 7/2021": { short: "HPP (Pajak)", color: "#a0c87f", family: "pajak" },
  "UU 20/2003": { short: "Sisdiknas", color: "#7fc8a8", family: "pendidikan" },
  "UU 12/2012": { short: "Dikti", color: "#7fc8a8", family: "pendidikan" },
  "UU 17/2023": { short: "Kesehatan", color: "#6fc8b0", family: "kesehatan" },
  "UU 20/2023": { short: "ASN", color: "#8f9fd6", family: "asn" },
  "UU 23/2014": { short: "Pemda", color: "#b0a8d6", family: "asn" },
  "UU 39/1999": { short: "HAM", color: "#d69fb0", family: "ham" },
  "UU 35/2014": { short: "Perlindungan Anak", color: "#d6a8c8", family: "ham" },
  "UU 11/2009": { short: "Kesejahteraan Sosial", color: "#c89fb0", family: "ham" },
  "UU 10/1998": { short: "Perbankan", color: "#7fb0c8", family: "perbankan" },
  "UU 23/1999": { short: "Bank Indonesia", color: "#6f9fc8", family: "moneter" },
  "UU 3/2004": { short: "Perubahan BI", color: "#6f9fc8", family: "moneter" },
  "UU 49/2009": { short: "Peradilan Umum", color: "#c8a86f", family: "peradilan" },
  "UU 50/2009": { short: "Peradilan Agama", color: "#c8946f", family: "peradilan" },
  "UU 21/2011": { short: "OJK", color: "#6fb0b8", family: "moneter" },
  "UU 7/2014": { short: "Perdagangan", color: "#a8c87f", family: "dagang" },
  "PerBPJS Kes 3/2024": { short: "BPJS Kesehatan", color: "#7fc89f", family: "jamsos" },
  "PerBPJS TK 1/2023": { short: "BPJS TK", color: "#7fc8b8", family: "jamsos" },
};

/**
 * Filter families in dropdown display order. Only families that have at least
 * one pasal in the corpus are shown (computed in pasalSearch). `label` is what
 * the user sees in the "Sumber Hukum" dropdown.
 */
export const FILTER_GROUPS = [
  { key: "pidana", label: "Pidana — KUHP" },
  { key: "korupsi", label: "Antikorupsi — UU Tipikor" },
  { key: "narkotika", label: "Narkotika — UU 35/2009" },
  { key: "tppu", label: "Pencucian Uang — UU TPPU" },
  { key: "korporasi", label: "Korporasi — UU PT" },
  { key: "investasi", label: "Penanaman Modal — UU 25/2007" },
  { key: "pajak", label: "Perpajakan — UU HPP" },
  { key: "ciptaker", label: "Cipta Kerja — UU 6/2023" },
  { key: "naker", label: "Ketenagakerjaan — UU 13/2003" },
  { key: "tata", label: "Tata Negara — UUD 1945" },
  { key: "konstitusi", label: "Konstitusi — UU MK" },
  { key: "asn", label: "Pemerintahan & ASN" },
  { key: "pendidikan", label: "Pendidikan — Sisdiknas & Dikti" },
  { key: "kesehatan", label: "Kesehatan — UU 17/2023" },
  { key: "ham", label: "HAM & Sosial" },
  { key: "pailit", label: "Kepailitan & PKPU — UU 37/2004" },
  { key: "perbankan", label: "Perbankan — UU 7/1992 jo. 10/1998" },
  { key: "moneter", label: "Moneter & Jasa Keuangan — BI, OJK" },
  { key: "jamsos", label: "Jaminan Sosial — BPJS" },
  { key: "siber", label: "Siber / ITE" },
  { key: "niaga", label: "Niaga — Arbitrase & P2SK" },
  { key: "dagang", label: "Perdagangan — UU 7/2014" },
  { key: "acara", label: "Hukum Acara — KUHAP & Rv" },
  { key: "peradilan", label: "Lembaga Peradilan — Umum & Agama" },
];

export const familyOf = (l = "") => (LAW_META[l] ? LAW_META[l].family : null);
