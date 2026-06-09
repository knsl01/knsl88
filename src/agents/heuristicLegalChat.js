/**
 * Heuristik Chat Hukum — jawaban offline KNSL AI saat semua provider AI
 * gagal / penuh kuota / tidak tersedia. Tanpa LLM: memakai pencarian pasal
 * (pasalSearch: ~2.781 entri + sinonim + rujukan UU di luar korpus).
 */
import { searchPasal, outsideHits, lawShort, norm } from "../services/pasalSearch.js";

const DISCLAIMER =
  "Ini informasi riset hukum, bukan nasihat hukum resmi — konsultasikan advokat untuk keputusan konkret.";

// Kata tanya / pengisi / nama kitab yang menambah noise pada pencarian pasal.
const FILLER = new Set(
  ("apa apakah bagaimana gimana kenapa mengapa kapan siapa dimana mana itu ini " +
    "menurut pasal pasalnya unsur unsur-unsur sanksi hukuman ancaman aturan hukum " +
    "tentang dalam adalah jelaskan sebutkan contoh perbedaan beda dengan untuk dari " +
    "pada bisa dapat tolong saya mau ingin minta yang dan atau ke di nya " +
    "kuhp kuhap kuhperdata kuhper perdata pidana undang uu sebagai secara")
    .split(" ")
);

function lastUserText(messages) {
  const last = [...(messages || [])].reverse().find((m) => m.role === "user");
  return last?.content?.trim() || "";
}

/** Buang kata tanya/pengisi agar pencarian pasal lebih relevan; sisakan istilah hukum. */
function legalKeywords(q) {
  const kept = norm(q)
    .split(" ")
    .filter((w) => w.length > 2 && !FILLER.has(w));
  return kept.join(" ").trim();
}

/**
 * Bangun jawaban heuristik dari basis pasal KNSL (tanpa AI).
 * @param {{ messages: {role:string, content:string}[] }} opts
 * @returns {string} teks markdown siap tampil di chat
 */
export function heuristicLegalChat({ messages }) {
  const q = lastUserText(messages);
  if (!q) return "";

  const keywords = legalKeywords(q) || q;
  const hits = searchPasal(keywords, "all").filter((h) => h.rel >= 35).slice(0, 5);
  const outside = outsideHits(q);

  const lines = [];
  lines.push(
    "**KNSL AI — mode hemat (tanpa AI).** Provider AI sedang penuh/tidak tersedia, jadi jawaban disusun secara heuristik dari basis pasal KNSL (pencocokan kata kunci), bukan analisa AI penuh."
  );

  if (hits.length) {
    lines.push("");
    lines.push("**Pasal yang mungkin relevan:**");
    hits.forEach((h, i) => {
      const snip = String(h.t || "").replace(/\s+/g, " ").trim().slice(0, 240);
      const ell = (h.t || "").length > 240 ? "…" : "";
      lines.push(`${i + 1}. **${lawShort(h.l)} Pasal ${h.p}**${h.b ? ` — ${h.b}` : ""}\n${snip}${ell}`);
    });
  }

  if (outside.length) {
    lines.push("");
    lines.push("**Rujukan UU di luar basis utama:**");
    outside.forEach((o) => lines.push(`- ${o.k}: ${o.v}`));
  }

  if (!hits.length && !outside.length) {
    lines.push("");
    lines.push(
      "Belum ada pasal yang cocok dari kata kunci pertanyaan ini di basis offline. Coba pakai istilah hukum yang lebih spesifik (mis. \"pencurian\", \"wanprestasi\", \"penipuan\", \"PHK\"), atau ulangi saat AI sudah tersedia."
    );
  } else {
    lines.push("");
    lines.push(
      "_Untuk uraian unsur & analisa lengkap, coba lagi saat kuota AI pulih atau ganti **Provider AI** di atas._"
    );
  }

  lines.push("");
  lines.push(`_${DISCLAIMER}_`);
  return lines.join("\n");
}
