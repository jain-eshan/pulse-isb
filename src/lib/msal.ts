import type { Configuration } from "@azure/msal-browser";
import { PublicClientApplication } from "@azure/msal-browser";

const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID ?? "placeholder",
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID ?? "common"}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const loginRequest = {
  scopes: ["openid", "profile", "email", "User.Read", "Calendars.ReadWrite"],
};

export const graphRequest = {
  scopes: ["Calendars.ReadWrite"],
};

export const ISB_EMAIL_DOMAIN = "isb.edu";

export function isISBEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${ISB_EMAIL_DOMAIN}`);
}
