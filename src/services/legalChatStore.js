/** Legal chat history — per-user via window.storage */

const KEY = "legal-chat:messages";

async function storageGet(key) {
  if (typeof window === "undefined" || !window.storage) return null;
  const r = await window.storage.get(key);
  return r?.value ?? null;
}

async function storageSet(key, value) {
  if (typeof window === "undefined" || !window.storage) return;
  await window.storage.set(key, JSON.stringify(value));
}

export function defaultWelcomeMessage() {
  return {
    id: "welcome",
    role: "assistant",
    content:
      "Halo! Saya asisten riset hukum KNSL. Ajukan pertanyaan seputar hukum Indonesia — pidana, perdata, korporasi, ketenagakerjaan, dan lainnya. Saya akan merujuk pada dasar hukum yang relevan.\n\n" +
      "_Catatan: ini bukan nasihat hukum resmi; verifikasi selalu pada teks UU/peraturan dan konsultasikan advokat untuk keputusan konkret._",
    createdAt: Date.now(),
  };
}

export async function loadChatMessages() {
  try {
    const raw = await storageGet(KEY);
    if (!raw) return [defaultWelcomeMessage()];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return [defaultWelcomeMessage()];
    return parsed;
  } catch {
    return [defaultWelcomeMessage()];
  }
}

export async function saveChatMessages(messages) {
  await storageSet(KEY, messages.slice(-50));
}

export async function clearChatMessages() {
  const welcome = [defaultWelcomeMessage()];
  await saveChatMessages(welcome);
  return welcome;
}
