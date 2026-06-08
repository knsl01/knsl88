import React from "react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import AuthRouter from "./AuthRouter.jsx";
import AuthLoader from "./components/AuthLoader.jsx";

/** Protected route: requires Supabase session when configured. */
export default function AuthGate({ children }) {
  const { isSupabase, loading, user, recoveryMode } = useAuth();

  if (!isSupabase) return children;

  if (loading) return <AuthLoader />;

  if (recoveryMode) return <AuthRouter />;

  if (!user) return <AuthRouter />;

  return children;
}
