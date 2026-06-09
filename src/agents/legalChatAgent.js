import { callLLM } from "../knslAiAgent.js";
import { LEGAL_CHAT_SYSTEM } from "./prompts/index.js";
import { searchPasal, outsideHits } from "../services/pasalSearch.js";

const MAX_HISTORY = 12;

function formatConversation(messages) {
  const recent = messages.slice(-MAX_HISTORY);
  return recent
    .map((m) => {
      const label = m.role === "user" ? "PENGGUNA" : "ASISTEN";
      return `[${label}]\n${m.content}`;
    })
    .join("\n\n---\n\n");
}

/**
 * @param {{ messages: { role: 'user'|'assistant', content: string }[], provider?: string }} opts
 */
export async function askLegalChat({ messages, provider }) {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser?.content?.trim()) throw new Error("Pertanyaan kosong.");

  const history = messages.filter((m) => m !== lastUser);
  let user = "";
  if (history.length) {
    user += "RIWAYAT PERCAKAPAN (konteks):\n" + formatConversation(history) + "\n\n";
  }
  user += "PERTANYAAN BARU:\n" + lastUser.content.trim();

  const text = await callLLM({
    system: LEGAL_CHAT_SYSTEM,
    user,
    maxTokens: 2200,
    provider,
  });

  return String(text).trim();
}

export function buildHeuristicChatReply(query, reason = "") {
  const hits = searchPasal(query, "all").slice(0, 6);
  const outside = outsideHits(query).slice(0, 4);
  const lines = [
    "**Mode heuristik offline**",
    "",
    "AI cloud belum tersambung, jadi saya tampilkan rujukan awal dari indeks KNSL yang bisa dicek manual.",
  ];

  if (reason) {
    lines.push("", `**Status AI:** ${reason}`);
  }

  if (hits.length) {
    lines.push("", "**Rujukan pasal terdekat:**");
    hits.forEach((h, i) => {
      const title = h.b ? ` — ${h.b}` : "";
      const snippet = String(h.t || "").replace(/\s+/g, " ").slice(0, 220);
      lines.push(`${i + 1}. **${h.l} Pasal ${h.p}${title}** _(relevansi ${h.rel || 0}%)_`);
      lines.push(`   ${snippet}${snippet.length >= 220 ? "…" : ""}`);
    });
  } else {
    lines.push("", "**Rujukan pasal terdekat:** belum ada kecocokan kuat di indeks lokal.");
  }

  if (outside.length) {
    lines.push("", "**Petunjuk referensi di luar indeks lokal:**");
    outside.forEach((o) => lines.push(`- ${o.k}: ${o.v}`));
  }

  lines.push(
    "",
    "**Langkah praktis:** gunakan rujukan ini sebagai titik awal, lalu verifikasi teks peraturan terbaru dan fakta kasus.",
    "",
    "_Ini informasi riset hukum awal, bukan nasihat hukum resmi._"
  );

  return lines.join("\n");
}

export const SUGGESTED_PROMPTS = [
  "Apa unsur-unsur pasal pencurian menurut KUHP?",
  "Bagaimana prosedur gugatan wanprestasi di pengadilan negeri?",
  "Apa perbedaan KDRT dengan kekerasan fisik biasa menurut UU ITE/KDRT?",
  "Kapan perjanjian dianggap batal menurut KUHPerdata?",
];
