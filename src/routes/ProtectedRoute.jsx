import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import AuthLoader from "../features/auth/components/AuthLoader.jsx";
import { useIsAuthenticated } from "../hooks/useIsAuthenticated.js";
import { ROUTES } from "./paths.js";

/**
 * Guards authenticated-only routes. Redirects to /login with return URL.
 * Renders child routes via <Outlet /> (React Router layout pattern).
 */
export default function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, loading, recoveryMode } = useIsAuthenticated();

  if (loading) return <AuthLoader />;

  if (recoveryMode) {
    return <Navigate to={ROUTES.RESET_PASSWORD} replace state={{ from: location }} />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
