/**
 * @deprecated Use `src/routes/ProtectedRoute.jsx` + React Router (`AppRoutes`) instead.
 */
import React from "react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import AuthRouter from "./AuthRouter.jsx";
import AuthLoader from "./components/AuthLoader.jsx";

/** Legacy gate — wraps children when authenticated (pre–React Router). */
export default function AuthGate({ children }) {
  const { isSupabase, loading, user, recoveryMode } = useAuth();

  if (!isSupabase) return children;

  if (loading) return <AuthLoader />;

  if (recoveryMode) return <AuthRouter />;

  if (!user) return <AuthRouter />;

  return children;
}
