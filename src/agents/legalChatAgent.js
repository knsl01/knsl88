import { callLLM } from "../knslAiAgent.js";

const LEGAL_CHAT_SYSTEM = `Anda adalah asisten riset hukum Indonesia untuk praktisi hukum (advokat, legal officer, mahasiswa hukum).

ATURAN WAJIB:
1. Jawab berdasarkan sistem hukum Indonesia: UUD 1945, KUHP, KUHAP, KUHPerdata, UU materiil (perdata, pidana, korporasi, ketenagakerjaan, ITE, dll.), dan peraturan pelaksana yang relevan.
2. Sebutkan dasar hukum secara eksplisit bila memungkinkan (mis. "Pasal 362 KUHP", "Pasal 1238 KUHPerdata", "UU No. … Tahun …").
3. Bedakan fakta, analisa, dan opini. Jangan memvonis atau menyimpulkan bersalah/tidak pada kasus konkret tanpa bukti lengkap.
4. Jika pertanyaan kurang jelas, ajukan 1–2 klarifikasi singkat sebelum analisa mendalam.
5. Gunakan Bahasa Indonesia yang profesional, terstruktur (poin/bagian bila perlu), dan mudah dipahami.
6. AKHIRI setiap jawaban dengan disclaimer satu baris: "Ini informasi riset hukum, bukan nasihat hukum resmi — konsultasikan advokat untuk keputusan konkret."
7. Jangan mengarang nomor pasal/UU. Jika tidak yakin, katakan ketidakpastian dan sarankan verifikasi pada teks resmi (JDih, Mahkamah Agung).
8. Untuk isu yang berubah (mis. KUHP baru UU 1/2023), sebutkan jika ada padanan atau transisi yang relevan.`;

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
