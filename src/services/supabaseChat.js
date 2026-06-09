/**
 * Legal chat persistence — Supabase conversations + messages.
 */

import { supabase, isSupabaseConfigured } from "../lib/supabase.js";

const CONV_META_KEY = "knsl:chat-conversation-id";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isCloudChatEnabled() {
  return isSupabaseConfigured && !!supabase;
}

function getStoredConversationId() {
  try {
    return localStorage.getItem(CONV_META_KEY) || null;
  } catch {
    return null;
  }
}

function setStoredConversationId(id) {
  try {
    if (id) localStorage.setItem(CONV_META_KEY, id);
    else localStorage.removeItem(CONV_META_KEY);
  } catch { /* ignore */ }
}

function toUiMessage(row) {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    agentId: row.metadata?.agentId,
  };
}

async function requireUser() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function getOrCreateConversation(userId, title = "Chat hukum") {
  const existing = getStoredConversationId();
  if (existing) {
    const { data } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", existing)
      .eq("user_id", userId)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_id: userId, title, metadata: { source: "legal_chat" } })
    .select("id")
    .single();

  if (error) throw error;
  setStoredConversationId(data.id);
  return data.id;
}

export async function loadCloudChatMessages() {
  const user = await requireUser();
  if (!user) return null;

  const convId = await getOrCreateConversation(user.id);
  const { data, error } = await supabase
    .from("messages")
    .select("id, role, content, metadata, created_at")
    .eq("conversation_id", convId)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) throw error;
  return (data || []).map(toUiMessage);
}

/**
 * Append new messages to cloud thread (idempotent for UUID ids).
 * Mutates message ids from local `m_*` to UUID when inserted.
 */
export async function saveCloudChatMessages(messages, { title } = {}) {
  const user = await requireUser();
  if (!user) return null;

  const convId = await getOrCreateConversation(user.id, title || "Chat hukum");
  const persistable = messages.filter((m) => m.id !== "welcome" && m.role && m.content);

  if (title) {
    await supabase.from("conversations").update({ title: title.slice(0, 120) }).eq("id", convId);
  }

  for (const m of persistable) {
    if (UUID_RE.test(String(m.id))) continue;

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: convId,
        user_id: user.id,
        role: m.role,
        content: m.content,
        metadata: { agentId: m.agentId || null },
      })
      .select("id")
      .single();

    if (!error && data?.id) m.id = data.id;
  }

  await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
  return convId;
}

export async function clearCloudChat() {
  const user = await requireUser();
  if (!user) return;

  const convId = getStoredConversationId();
  if (convId) {
    await supabase.from("messages").delete().eq("conversation_id", convId);
    await supabase.from("conversations").delete().eq("id", convId).eq("user_id", user.id);
  }
  setStoredConversationId(null);
}
