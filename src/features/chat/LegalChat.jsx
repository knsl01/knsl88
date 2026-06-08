import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, Bot, User, Trash2, Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { askLegalChat, SUGGESTED_PROMPTS } from "../../agents/legalChatAgent.js";
import { loadChatMessages, saveChatMessages, clearChatMessages } from "../../services/legalChatStore.js";
import AiProviderPicker from "../../AiProviderPicker.jsx";
import { getLastAiMeta, getLastAiError, getProviderLabel } from "../../aiProviders.js";

function msgId() {
  return "m_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
}

function formatContent(text) {
  return String(text || "")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\_(.+?)\_/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

function ChatBubble({ message }) {
  const isUser = message.role === "user";
  const Icon = isUser ? User : Bot;
  return (
    <div className={`legal-chat-row ${isUser ? "legal-chat-row-user" : ""}`}>
      <div className={`legal-chat-avatar ${isUser ? "legal-chat-avatar-user" : ""}`}>
        <Icon size={16} strokeWidth={1.8} />
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
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [aiNote, setAiNote] = useState("");
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    let alive = true;
    loadChatMessages().then((msgs) => {
      if (alive) {
        setMessages(msgs);
        setReady(true);
      }
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const persist = useCallback(async (msgs) => {
    await saveChatMessages(msgs);
  }, []);

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setError("");
    setAiNote("");
    setInput("");

    const userMsg = { id: msgId(), role: "user", content: q, createdAt: Date.now() };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);

    try {
      const reply = await askLegalChat({ messages: next });
      const assistantMsg = {
        id: msgId(),
        role: "assistant",
        content: reply,
        createdAt: Date.now(),
      };
      const updated = [...next, assistantMsg];
      setMessages(updated);
      await persist(updated);
      const meta = getLastAiMeta();
      if (meta?.provider) {
        setAiNote(`Dijawab via ${getProviderLabel(meta.provider)}${meta.model ? ` · ${meta.model}` : ""}`);
      }
    } catch (e) {
      const errMsg = getLastAiError() || e.message || "Gagal menghubungi AI.";
      setError(errMsg);
      const errAssistant = {
        id: msgId(),
        role: "assistant",
        content: `Maaf, saya tidak dapat menjawab saat ini.\n\n**Error:** ${errMsg}\n\nCoba ganti provider AI atau periksa API key di pengaturan deploy.`,
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
    if (!window.confirm("Hapus riwayat chat dan mulai percakapan baru?")) return;
    const fresh = await clearChatMessages();
    setMessages(fresh);
    setError("");
    setAiNote("");
  };

  if (!ready) {
    return (
      <div className="view-enter page scrollbar" style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
        Memuat chat hukum…
      </div>
    );
  }

  return (
    <div className="view-enter legal-chat-page">
      <div className="legal-chat-header glass">
        <p className="legal-chat-disclaimer legal-chat-intro">
          Riset hukum Indonesia · bukan pengganti advokat
        </p>

        <div className="legal-chat-toolbar legal-chat-toolbar--desktop">
          <AiProviderPicker compact />
          <button type="button" className="legal-chat-clear-btn" onClick={handleClear} title="Hapus riwayat" aria-label="Hapus riwayat">
            <Trash2 size={15} />
          </button>
        </div>

        <div className="legal-chat-toolbar legal-chat-toolbar--mobile">
          <AiProviderPicker minimal />
          <button
            type="button"
            className="legal-chat-settings-toggle"
            onClick={() => setAiPanelOpen((o) => !o)}
            aria-expanded={aiPanelOpen}
            aria-label="Detail provider AI"
          >
            {aiPanelOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button type="button" className="legal-chat-clear-btn" onClick={handleClear} title="Hapus riwayat" aria-label="Hapus riwayat">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {aiPanelOpen && (
        <div className="legal-chat-ai-panel glass">
          <AiProviderPicker compact />
        </div>
      )}

      {error && (
        <div className="legal-chat-error" role="alert">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="legal-chat-messages scrollbar">
        {!loading && messages.length <= 1 && (
          <div className="legal-chat-suggestions legal-chat-suggestions-inline">
            <span className="legal-chat-suggestions-label">Contoh pertanyaan</span>
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
          <ChatBubble key={m.id} message={m} />
        ))}
        {loading && (
          <div className="legal-chat-row">
            <div className="legal-chat-avatar"><Bot size={16} /></div>
            <div className="legal-chat-bubble glass legal-chat-typing">
              <Loader2 size={16} className="legal-chat-spin" /> Menyusun jawaban hukum…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="legal-chat-composer glass"
        onSubmit={(e) => { e.preventDefault(); send(); }}
      >
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
          placeholder="Tanyakan seputar hukum Indonesia…"
          disabled={loading}
        />
        <button type="submit" className="btn-primary legal-chat-send" disabled={loading || !input.trim()}>
          {loading ? <Loader2 size={18} className="legal-chat-spin" /> : <Send size={18} />}
        </button>
      </form>
      {aiNote && <p className="legal-chat-footnote">{aiNote}</p>}
    </div>
  );
}
