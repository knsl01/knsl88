import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { isSupabaseConfigured } from "../lib/supabase.js";
import LoginPage from "../features/auth/pages/LoginPage.jsx";
import { LoginScreen } from "../KNSLLegalIntelligence.jsx";
import { DEFAULT_AUTHENTICATED_ROUTE } from "../routes/paths.js";

/** Supabase login UI, or legacy local login when Supabase is not configured */
export default function LoginRoutePage() {
  const navigate = useNavigate();
  const location = useLocation();

  if (!isSupabaseConfigured) {
    return (
      <LoginScreen
        onLogin={() => {
          navigate(location.state?.from?.pathname || DEFAULT_AUTHENTICATED_ROUTE, { replace: true });
        }}
      />
    );
  }

  return <LoginPage />;
}
