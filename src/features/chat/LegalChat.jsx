import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, Bot, Trash2, Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { SUGGESTED_PROMPTS } from "../../agents/legalChatAgent.js";
import { dispatchKnslChatAgent } from "../../agents/chatDispatcher.js";
import { effectiveKnslAgentId, getKnslAgentLabel } from "../../knslAiAgents.js";
import { AGENT_IDS } from "../../agents/registry.js";
import {
  loadChatMessages,
  saveChatMessages,
  clearChatMessages,
  buildWelcomeContent,
  isChatCloudSyncActive,
} from "../../services/legalChatStore.js";
import AiProviderPicker from "../../AiProviderPicker.jsx";
import KnslAgentPicker from "../../KnslAgentPicker.jsx";
import { resolveAiProvider, getAiProvider } from "../../aiProviders.js";
import { getLastAiMeta, getLastAiError, getProviderLabel } from "../../aiProviders.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useLocalUser } from "../../hooks/useLocalUser.js";
import { isSupabaseConfigured } from "../../lib/supabase.js";
import UserAvatar from "../../components/profile/UserAvatar.jsx";
import { useI18n } from "../../i18n/I18nContext.jsx";

function msgId() {
  return "m_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
}

function formatContent(text) {
  return String(text || "")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\_(.+?)\_/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

function ChatBubble({ message, user }) {
  const isUser = message.role === "user";
  return (
    <div className={`legal-chat-row ${isUser ? "legal-chat-row-user" : ""}`}>
      <div className={`legal-chat-avatar-wrap ${isUser ? "legal-chat-avatar-user" : ""}`}>
        {isUser ? (
          <UserAvatar user={user} size={32} />
        ) : (
          <div className="legal-chat-avatar legal-chat-avatar-bot">
            <Bot size={16} strokeWidth={1.8} />
          </div>
        )}
      </div>
      <div className={`legal-chat-bubble glass ${isUser ? "legal-chat-bubble-user" : ""}`}>
        <div
          className="legal-chat-text"
          dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
        />
      </div>
    </div>
  );
}

export default function LegalChat() {
  const { locale, t } = useI18n();
  const { user: supaUser } = useAuth();
  const localUser = useLocalUser();
  const user = isSupabaseConfigured ? supaUser : localUser;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [aiNote, setAiNote] = useState("");
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const messagesRef = useRef(null);
  const stickToBottomRef = useRef(true);
  const inputRef = useRef(null);
  const prevLenRef = useRef(0);

  useEffect(() => {
    let alive = true;
    loadChatMessages().then((msgs) => {
      if (alive) {
        setMessages(msgs);
        setReady(true);
        stickToBottomRef.current = true;
      }
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    setMessages((msgs) => {
      if (msgs.length === 1 && msgs[0]?.id === "welcome") {
        const content = buildWelcomeContent(locale);
        if (msgs[0].content === content) return msgs;
        return [{ ...msgs[0], content }];
      }
      return msgs;
    });
  }, [locale]);

  const scrollToBottom = useCallback((behavior = "auto") => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    if (!ready) return;
    const el = messagesRef.current;
    if (!el) return;

    const onScroll = () => {
      const gap = el.scrollHeight - el.scrollTop - el.clientHeight;
      stickToBottomRef.current = gap < 100;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const grew = messages.length > prevLenRef.current;
    prevLenRef.current = messages.length;

    if (stickToBottomRef.current || grew) {
      requestAnimationFrame(() => scrollToBottom(grew ? "smooth" : "auto"));
    }
  }, [messages, loading, ready, scrollToBottom]);

  const persist = useCallback(async (msgs) => {
    await saveChatMessages(msgs);
  }, []);

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setError("");
    setAiNote("");
    setInput("");
    stickToBottomRef.current = true;

    const userMsg = { id: msgId(), role: "user", content: q, createdAt: Date.now() };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);

    try {
      const agentId = effectiveKnslAgentId(AGENT_IDS.CHAT);
      const { text: reply } = await dispatchKnslChatAgent({
        agentId,
        messages: next,
        provider: resolveAiProvider(),
      });
      const assistantMsg = {
        id: msgId(),
        role: "assistant",
        content: reply,
        createdAt: Date.now(),
        agentId,
      };
      const updated = [...next, assistantMsg];
      setMessages(updated);
      await persist(updated);
      const meta = getLastAiMeta();
      let note = "";
      if (meta?.provider) {
        note = t("chat.answeredVia", {
          provider: getProviderLabel(meta.provider),
          model: meta.model ? ` · ${meta.model}` : "",
        });
      }
      note += t("chat.answeredViaAgent", { agent: getKnslAgentLabel(agentId, locale) });
      if (note) setAiNote(note);
    } catch (e) {
      const errMsg = getLastAiError() || e.message || t("chat.errorContact");
      setError(errMsg);
      const errAssistant = {
        id: msgId(),
        role: "assistant",
        content: t("chat.errorSorry", { error: errMsg }),
        createdAt: Date.now(),
      };
      const updated = [...next, errAssistant];
      setMessages(updated);
      await persist(updated);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClear = async () => {
    if (!window.confirm(t("chat.clearConfirm"))) return;
    const fresh = await clearChatMessages(locale);
    setMessages(fresh);
    setError("");
    setAiNote("");
    stickToBottomRef.current = true;
  };

  if (!ready) {
    return (
      <div className="view-enter page scrollbar" style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
        {t("chat.loading")}
      </div>
    );
  }

  return (
    <div className="view-enter legal-chat-page">
      <div className="legal-chat-header glass">
        <p className="legal-chat-disclaimer legal-chat-intro">
          {t("chat.disclaimer")}
          {isChatCloudSyncActive() && (
            <span style={{ display: "block", marginTop: 4, color: "var(--emerald-bright)", fontSize: 11 }}>
              {t("chat.cloudSync")}
            </span>
          )}
        </p>

        <div className="legal-chat-toolbar legal-chat-toolbar--desktop legal-chat-toolbar-pickers">
          <KnslAgentPicker compact showEnableToggle defaultEnabled />
          <AiProviderPicker compact />
          <button type="button" className="legal-chat-clear-btn" onClick={handleClear} title={t("chat.clearHistory")} aria-label={t("chat.clearHistory")}>
            <Trash2 size={15} />
          </button>
        </div>

        <div className="legal-chat-toolbar legal-chat-toolbar--mobile">
          <KnslAgentPicker minimal showEnableToggle defaultEnabled />
          <AiProviderPicker minimal />
          <button
            type="button"
            className="legal-chat-settings-toggle"
            onClick={() => setAiPanelOpen((o) => !o)}
            aria-expanded={aiPanelOpen}
            aria-label={t("chat.aiProviderDetail")}
          >
            {aiPanelOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button type="button" className="legal-chat-clear-btn" onClick={handleClear} title={t("chat.clearHistory")} aria-label={t("chat.clearHistory")}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {aiPanelOpen && (
        <div className="legal-chat-ai-panel glass">
          <KnslAgentPicker compact showEnableToggle defaultEnabled />
          <AiProviderPicker compact />
        </div>
      )}

      {error && (
        <div className="legal-chat-error" role="alert">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div ref={messagesRef} className="legal-chat-messages scrollbar">
        {!loading && messages.length <= 1 && (
          <div className="legal-chat-suggestions legal-chat-suggestions-inline">
            <span className="legal-chat-suggestions-label">{t("chat.examples")}</span>
            <div className="legal-chat-chips">
              {SUGGESTED_PROMPTS.map((p) => (
                <button key={p} type="button" className="legal-chat-chip" onClick={() => send(p)}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} user={user} />
        ))}
        {loading && (
          <div className="legal-chat-row">
            <div className="legal-chat-avatar-wrap">
              <div className="legal-chat-avatar legal-chat-avatar-bot">
                <Bot size={16} />
              </div>
            </div>
            <div className="legal-chat-bubble glass legal-chat-typing">
              <Loader2 size={16} className="legal-chat-spin" /> {t("chat.typing")}
            </div>
          </div>
        )}
      </div>

      <form
        className="legal-chat-composer glass"
        onSubmit={(e) => { e.preventDefault(); send(); }}
      >
        {aiNote && <p className="legal-chat-footnote legal-chat-footnote-inline">{aiNote}</p>}
        <div className="legal-chat-composer-row">
          <textarea
            ref={inputRef}
            className="field legal-chat-input"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={t("chat.placeholder")}
            disabled={loading}
          />
          <button type="submit" className="btn-primary legal-chat-send" disabled={loading || !input.trim()}>
            {loading ? <Loader2 size={18} className="legal-chat-spin" /> : <Send size={18} />}
          </button>
        </div>
      </form>
      {aiNote && <p className="legal-chat-footnote legal-chat-footnote-desktop">{aiNote}</p>}
    </div>
  );
}
