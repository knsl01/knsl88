/** Legal chat history — cloud (Supabase) + local fallback */

import id from "../i18n/locales/id.js";
import en from "../i18n/locales/en.js";
import {
  isCloudChatEnabled,
  loadCloudChatMessages,
  saveCloudChatMessages,
  clearCloudChat,
} from "./supabaseChat.js";

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

async function loadLocalMessages() {
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

export async function loadChatMessages() {
  const locale = getStoredLocale();
  const welcome = defaultWelcomeMessage(locale);

  if (isCloudChatEnabled()) {
    try {
      const cloud = await loadCloudChatMessages();
      if (cloud && cloud.length) return [welcome, ...cloud.filter((m) => m.role !== "system")];
      if (cloud && cloud.length === 0) return [welcome];
    } catch {
      /* fallback local */
    }
  }

  return loadLocalMessages();
}

export async function saveChatMessages(messages) {
  const trimmed = messages.slice(-50);

  if (isCloudChatEnabled()) {
    try {
      const lastUser = [...trimmed].reverse().find((m) => m.role === "user");
      await saveCloudChatMessages(trimmed, {
        title: lastUser?.content?.slice(0, 80) || "Chat hukum",
      });
    } catch {
      /* continue local backup */
    }
  }

  await storageSet(KEY, trimmed);
}

export async function clearChatMessages(locale = getStoredLocale()) {
  if (isCloudChatEnabled()) {
    try {
      await clearCloudChat();
    } catch { /* ignore */ }
  }

  const welcome = [defaultWelcomeMessage(locale)];
  await storageSet(KEY, welcome);
  return welcome;
}

export function isChatCloudSyncActive() {
  return isCloudChatEnabled();
}
