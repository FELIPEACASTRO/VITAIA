export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// VITAIA Brand Identity
export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "VITAIA";
export const APP_NAME = "VITAIA";
export const APP_TAGLINE = "A IA da Vida - Inteligência Artificial Médica";
export const APP_VERSION = "1.0.0";

export const APP_LOGO = import.meta.env.VITE_APP_LOGO || "https://placehold.co/128x128/10B981/FFFFFF?text=V";

// VITAIA Color System
export const VITAIA_COLORS = {
  primary: "#10B981",
  primaryDark: "#059669",
  secondary: "#06B6D4",
  tertiary: "#8B5CF6",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#06B6D4",
  bgDark: "#0F172A",
  bgLight: "#FFFFFF",
  bgCard: "#1E293B",
};

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
