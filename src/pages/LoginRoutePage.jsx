import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { isSupabaseConfigured } from "../lib/supabase.js";
import LoginPage from "../features/auth/pages/LoginPage.jsx";
import { LoginScreen } from "../KNSLLegalIntelligence.jsx";
import PremiumLogin from "../PremiumLogin.jsx";
import PremiumLoginScene from "../PremiumLoginScene.jsx";
import { DEFAULT_AUTHENTICATED_ROUTE } from "../routes/paths.js";
import "../premium.css";

/** Supabase login UI, or legacy local login when Supabase is not configured.
 *  Both paths are wrapped with the cinematic "Lady Justice" premium scene. */
export default function LoginRoutePage() {
  const navigate = useNavigate();
  const location = useLocation();

  if (!isSupabaseConfigured) {
    // Legacy local login — PremiumLogin renders the scene + exit veil itself.
    return (
      <PremiumLogin
        LoginScreen={LoginScreen}
        onLogin={() => {
          navigate(location.state?.from?.pathname || DEFAULT_AUTHENTICATED_ROUTE, { replace: true });
        }}
      />
    );
  }

  // Supabase login — render the scene behind the two-pane auth shell.
  return (
    <div className="knsl-premium-auth">
      <PremiumLoginScene />
      <LoginPage />
    </div>
  );
}
