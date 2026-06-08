import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import App from "../KNSLLegalIntelligence.jsx";
import LoginRoutePage from "../pages/LoginRoutePage.jsx";
import SignupPage from "../features/auth/pages/SignupPage.jsx";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "../features/auth/pages/ResetPasswordPage.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import GuestRoute from "./GuestRoute.jsx";
import RootRedirect from "./RootRedirect.jsx";
import { ROUTES } from "./paths.js";

/**
 * Application route tree.
 * - Guest routes: login, signup, password recovery
 * - Protected routes: dashboard, workspace, settings, app (+ nested /app/:section)
 */
export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.HOME} element={<RootRedirect />} />

        <Route element={<GuestRoute />}>
          <Route path={ROUTES.LOGIN} element={<LoginRoutePage />} />
          <Route path={ROUTES.SIGNUP} element={<SignupPage />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        </Route>

        {/* Reset password: allowed while in recovery even if session exists */}
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.DASHBOARD} element={<App />} />
          <Route path={ROUTES.WORKSPACE} element={<App />} />
          <Route path={ROUTES.SETTINGS} element={<App />} />
          <Route path={ROUTES.APP} element={<App />} />
          <Route path={`${ROUTES.APP}/:section`} element={<App />} />
        </Route>

        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
