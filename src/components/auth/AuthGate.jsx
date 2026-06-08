import React from "react";
import { Activity } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import AuthScreen from "./AuthScreen.jsx";
import { STYLES } from "../../theme.jsx";

/** Protected route: requires Supabase session when configured. */
export default function AuthGate({ children }) {
  const { isSupabase, loading, user } = useAuth();

  if (!isSupabase) return children;

  if (loading) {
    return (
      <div className="knsl">
        <style>{STYLES}</style>
        <div className="login-screen">
          <Activity size={32} className="emerald-text" style={{ animation: "spin 1s linear infinite" }} />
          <p style={{ color: "var(--muted)", marginTop: 16, fontSize: 14 }}>Memuat sesi…</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return children;
}
