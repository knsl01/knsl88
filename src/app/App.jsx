import React, { useState } from "react";
import { CheckCircle2, Settings } from "lucide-react";
import { STYLES } from "../theme.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { isSupabaseConfigured } from "../config/env.js";
import { getPageMeta } from "./navigation.js";
import { Sidebar } from "../components/layout/Sidebar.jsx";
import { Topbar } from "../components/layout/Topbar.jsx";
import { MobileTabBar } from "../components/layout/MobileTabBar.jsx";
import ProfilePanel from "../features/auth/ProfilePanel.jsx";
import {
  LoginScreen,
  Dashboard,
  Analysis,
  Drafting,
  Research,
  ScanDoc,
  ContractReview,
  Conflict,
} from "../features/legacy/KNSLFeatures.jsx";
import { getStoredUser, clearStoredUser } from "../features/auth/local/storage.js";

export default function App() {
  const { isSupabase, user: supaUser, signOut } = useAuth();
  const [localUser, setLocalUser] = useState(() => {
    if (isSupabaseConfigured) return null;
    const u = getStoredUser();
    if (u && typeof window !== "undefined") window.__KNSL_USER_ID__ = u.id;
    return u;
  });
  const user = isSupabase ? supaUser : localUser;
  const [active, setActive] = useState("dashboard");
  const [dashEditing, setDashEditing] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [seed, setSeed] = useState(null);

  const logout = async () => {
    if (isSupabase) await signOut();
    else {
      clearStoredUser();
      setLocalUser(null);
    }
  };

  if (!isSupabase && !user) {
    return <LoginScreen onLogin={setLocalUser} />;
  }

  const [title, subtitle] = getPageMeta(active);

  const globalSearch = (q) => {
    setSeed({ q, n: Date.now() });
    setActive("analysis");
    setNavOpen(false);
  };

  const sendIntake = (target, text, name) => {
    if (target === "contract") {
      if (typeof window !== "undefined") window.__KNSL_INTAKE__ = { text, name };
      setActive("contract");
    } else if (target === "analysis") {
      setSeed({ q: text, n: Date.now() });
      setActive("analysis");
    }
    setNavOpen(false);
  };

  return (
    <div className="knsl">
      <style>{STYLES}</style>
      <div className="shell">
        {navOpen && <div className="backdrop" onClick={() => setNavOpen(false)} />}
        <Sidebar
          active={active}
          setActive={setActive}
          open={navOpen}
          onClose={() => setNavOpen(false)}
          user={user}
          onLogout={logout}
        />
        <main className="main">
          <Topbar
            title={title}
            subtitle={subtitle}
            onMenu={() => setNavOpen(true)}
            onGlobalSearch={globalSearch}
            action={
              active === "dashboard" ? (
                <div
                  className="glass glass-hover"
                  onClick={() => setDashEditing((e) => !e)}
                  title={dashEditing ? "Simpan data" : "Edit data"}
                  style={{
                    width: 44,
                    height: 44,
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                    borderRadius: 14,
                    color: dashEditing ? "var(--emerald-bright)" : "var(--silver)",
                  }}
                >
                  {dashEditing ? <CheckCircle2 size={18} /> : <Settings size={18} />}
                </div>
              ) : null
            }
          />
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            {active === "dashboard" && <Dashboard editing={dashEditing} setEditing={setDashEditing} />}
            {active === "analysis" && <Analysis seed={seed} />}
            {active === "drafting" && <Drafting />}
            {active === "research" && <Research seed={seed} />}
            {active === "scan" && <ScanDoc onSend={sendIntake} />}
            {active === "contract" && <ContractReview />}
            {active === "conflict" && <Conflict />}
            {active === "profile" && <ProfilePanel />}
          </div>
        </main>
      </div>
      <MobileTabBar active={active} setActive={setActive} />
    </div>
  );
}
