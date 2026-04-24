import type { Session } from "../types";
import { msalInstance, graphRequest } from "./msal";

export async function getGraphToken(): Promise<string | null> {
  await msalInstance.initialize();
  const accounts = msalInstance.getAllAccounts();
  if (!accounts.length) return null;
  try {
    const res = await msalInstance.acquireTokenSilent({ ...graphRequest, account: accounts[0] });
    return res.accessToken;
  } catch {
    try {
      const res = await msalInstance.acquireTokenPopup(graphRequest);
      return res.accessToken;
    } catch {
      return null;
    }
  }
}

export async function sendCalendarInvite(session: Session): Promise<boolean> {
  const token = await getGraphToken();
  if (!token) return false;
  const end = session.ends_at
    ?? new Date(new Date(session.starts_at).getTime() + 60 * 60 * 1000).toISOString();
  const res = await fetch("https://graph.microsoft.com/v1.0/me/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      subject: `Pulse: ${session.title}`,
      body: { contentType: "HTML", content: session.description ?? "" },
      start: { dateTime: session.starts_at, timeZone: "Asia/Kolkata" },
      end: { dateTime: end, timeZone: "Asia/Kolkata" },
      location: { displayName: session.venue ?? "" },
      reminderMinutesBeforeStart: 30,
      isReminderOn: true,
    }),
  });
  return res.ok;
}
