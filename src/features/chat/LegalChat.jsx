import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, Bot, User, Sparkles, Trash2, Loader2, AlertCircle } from "lucide-react";
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
        content: `Maaf, saya tidak dapat menjawab saat ini.\n\n**Error:** ${errMsg}\n\nCoba ganti provider AI di atas atau periksa API key di pengaturan deploy.`,
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
        <div>
          <h3 className="serif" style={{ fontSize: 18, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={18} className="gold-text" /> Konsultasi Hukum AI
          </h3>
          <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "4px 0 0", lineHeight: 1.45 }}>
            Riset & penjelasan hukum Indonesia · bukan pengganti advokat
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <AiProviderPicker compact />
          <button type="button" className="btn-ghost" onClick={handleClear} title="Hapus riwayat" style={{ padding: "8px 10px" }}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {error && (
        <div className="legal-chat-error" role="alert">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="legal-chat-messages scrollbar">
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

      {!loading && messages.length <= 1 && (
        <div className="legal-chat-suggestions">
          <span style={{ fontSize: 11, color: "var(--muted-2)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Contoh pertanyaan
          </span>
          <div className="legal-chat-chips">
            {SUGGESTED_PROMPTS.map((p) => (
              <button key={p} type="button" className="legal-chat-chip" onClick={() => send(p)}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

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
          placeholder="Tanyakan seputar hukum Indonesia… (Enter kirim, Shift+Enter baris baru)"
          disabled={loading}
        />
        <button type="submit" className="btn-primary legal-chat-send" disabled={loading || !input.trim()}>
          {loading ? <Loader2 size={18} className="legal-chat-spin" /> : <Send size={18} />}
        </button>
      </form>
      {aiNote && (
        <p style={{ fontSize: 11, color: "var(--muted-2)", textAlign: "center", margin: "8px 0 0" }}>{aiNote}</p>
      )}
    </div>
  );
}
