import React from "react";
import { Navigate } from "react-router-dom";
import AuthLoader from "../features/auth/components/AuthLoader.jsx";
import { useIsAuthenticated } from "../hooks/useIsAuthenticated.js";
import { DEFAULT_AUTHENTICATED_ROUTE, ROUTES } from "./paths.js";

/** `/` → /app when logged in, otherwise /login */
export default function RootRedirect() {
  const { isAuthenticated, loading, recoveryMode } = useIsAuthenticated();

  if (loading) return <AuthLoader />;

  if (recoveryMode) return <Navigate to={ROUTES.RESET_PASSWORD} replace />;

  return (
    <Navigate
      to={isAuthenticated ? DEFAULT_AUTHENTICATED_ROUTE : ROUTES.LOGIN}
      replace
    />
  );
}
