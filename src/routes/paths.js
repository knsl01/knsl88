/** Central route definitions — single source of truth */

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  DASHBOARD: "/dashboard",
  WORKSPACE: "/workspace",
  SETTINGS: "/settings",
  APP: "/app",
};

/** Default landing page after successful login */
export const DEFAULT_AUTHENTICATED_ROUTE = ROUTES.APP;

/** Paths that require authentication */
export const PROTECTED_PATHS = [
  ROUTES.DASHBOARD,
  ROUTES.WORKSPACE,
  ROUTES.SETTINGS,
  ROUTES.APP,
];

const APP_SECTIONS = new Set([
  "dashboard",
  "analysis",
  "drafting",
  "research",
  "contract",
  "scan",
  "conflict",
  "profile",
  "chat",
]);

/** Map sidebar / feature id → URL */
export const ACTIVE_TO_ROUTE = {
  dashboard: ROUTES.DASHBOARD,
  analysis: ROUTES.WORKSPACE,
  profile: ROUTES.SETTINGS,
  drafting: `${ROUTES.APP}/drafting`,
  research: `${ROUTES.APP}/research`,
  contract: `${ROUTES.APP}/contract`,
  scan: `${ROUTES.APP}/scan`,
  conflict: `${ROUTES.APP}/conflict`,
  chat: `${ROUTES.APP}/chat`,
};

/** Map current URL → active feature id in the workspace shell */
export function routeToActive(pathname) {
  if (pathname === ROUTES.DASHBOARD || pathname === ROUTES.APP) return "dashboard";
  if (pathname === ROUTES.WORKSPACE) return "analysis";
  if (pathname === ROUTES.SETTINGS) return "profile";

  const match = pathname.match(/^\/app\/([^/]+)/);
  if (match && APP_SECTIONS.has(match[1])) return match[1];

  return "dashboard";
}

export function isProtectedPath(pathname) {
  return (
    PROTECTED_PATHS.some((p) => pathname === p) ||
    pathname.startsWith(`${ROUTES.APP}/`)
  );
}

export function isGuestPath(pathname) {
  return (
    pathname === ROUTES.LOGIN ||
    pathname === ROUTES.SIGNUP ||
    pathname === ROUTES.FORGOT_PASSWORD ||
    pathname === ROUTES.RESET_PASSWORD
  );
}
