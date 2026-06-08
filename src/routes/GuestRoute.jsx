import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import AuthLoader from "../features/auth/components/AuthLoader.jsx";
import { useIsAuthenticated } from "../hooks/useIsAuthenticated.js";
import { DEFAULT_AUTHENTICATED_ROUTE } from "./paths.js";

/**
 * Guards public auth routes (login, signup). Redirects authenticated users away.
 */
export default function GuestRoute() {
  const location = useLocation();
  const { isAuthenticated, loading, recoveryMode } = useIsAuthenticated();

  if (loading) return <AuthLoader />;

  if (recoveryMode) {
    return <Navigate to="/reset-password" replace />;
  }

  if (isAuthenticated) {
    const redirectTo = location.state?.from?.pathname || DEFAULT_AUTHENTICATED_ROUTE;
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
