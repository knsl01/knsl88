import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";

/**
 * Routes between auth pages. Recovery mode from AuthContext or URL hash.
 */
export default function AuthRouter() {
  const { recoveryMode } = useAuth();
  const [page, setPage] = useState("login");

  useEffect(() => {
    if (recoveryMode) {
      setPage("reset");
      return;
    }
    const hash = window.location.hash || "";
    const search = new URLSearchParams(window.location.search);
    if (hash.includes("type=recovery") || search.get("type") === "recovery") {
      setPage("reset");
    }
  }, [recoveryMode]);

  const navigate = (next) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  switch (page) {
    case "signup":
      return <SignupPage onNavigate={navigate} />;
    case "forgot":
      return <ForgotPasswordPage onNavigate={navigate} />;
    case "reset":
      return <ResetPasswordPage onNavigate={navigate} />;
    default:
      return <LoginPage onNavigate={navigate} />;
  }
}
