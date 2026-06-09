import { callLLM } from "../knslAiAgent.js";
import { LEGAL_CHAT_SYSTEM } from "./prompts/index.js";

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

export const SUGGESTED_PROMPTS = [
  "Apa unsur-unsur pasal pencurian menurut KUHP?",
  "Bagaimana prosedur gugatan wanprestasi di pengadilan negeri?",
  "Apa perbedaan KDRT dengan kekerasan fisik biasa menurut UU ITE/KDRT?",
  "Kapan perjanjian dianggap batal menurut KUHPerdata?",
];
