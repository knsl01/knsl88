/** Legal chat history — per-user via window.storage */

import id from "../i18n/locales/id.js";
import en from "../i18n/locales/en.js";

const KEY = "legal-chat:messages";
const LOCALE_KEY = "knsl:locale";

async function storageGet(key) {
  if (typeof window === "undefined" || !window.storage) return null;
  const r = await window.storage.get(key);
  return r?.value ?? null;
}

async function storageSet(key, value) {
  if (typeof window === "undefined" || !window.storage) return;
  await window.storage.set(key, JSON.stringify(value));
}

export function getStoredLocale() {
  try {
    const s = localStorage.getItem(LOCALE_KEY);
    if (s === "en" || s === "id") return s;
  } catch { /* ignore */ }
  return "id";
}

export function buildWelcomeContent(locale = getStoredLocale()) {
  const dict = locale === "en" ? en : id;
  return `${dict.chat.welcome}\n\n_${dict.chat.welcomeNote}_`;
}

export function defaultWelcomeMessage(locale) {
  return {
    id: "welcome",
    role: "assistant",
    content: buildWelcomeContent(locale),
    createdAt: Date.now(),
  };
}

export async function loadChatMessages() {
  const locale = getStoredLocale();
  try {
    const raw = await storageGet(KEY);
    if (!raw) return [defaultWelcomeMessage(locale)];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return [defaultWelcomeMessage(locale)];
    return parsed;
  } catch {
    return [defaultWelcomeMessage(locale)];
  }
}

export async function saveChatMessages(messages) {
  await storageSet(KEY, messages.slice(-50));
}

export async function clearChatMessages(locale = getStoredLocale()) {
  const welcome = [defaultWelcomeMessage(locale)];
  await saveChatMessages(welcome);
  return welcome;
}
