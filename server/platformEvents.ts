import crypto from "node:crypto";

export type V79PlatformEvent = {
  id: string;
  type: string;
  version: 1;
  occurredAt: string;
  organizationRef: string;
  subjectId?: string;
  correlationId?: string;
  payload?: Record<string, unknown>;
};

const hubUrl = () => String(process.env.V79_HUB_EVENT_URL || "").trim();
const hubSecret = () => String(process.env.V79_HUB_EVENT_SECRET || "").trim();
export const hubOrganizationRef = () => String(process.env.V79_HUB_ORGANIZATION_REF || "").trim();

export function hubEventsConfigured() {
  return Boolean(hubUrl() && hubSecret().length >= 32 && hubOrganizationRef());
}

function signature(body: string, timestamp: string) {
  const bodyHash = crypto.createHash("sha256").update(body).digest("hex");
  const canonical = ["POST", "/api/platform/events", timestamp, bodyHash].join("\n");
  return crypto.createHmac("sha256", hubSecret()).update(canonical).digest("hex");
}

export async function deliverPlatformEvent(event: V79PlatformEvent): Promise<"sent"|"pending"|"failed"|"disabled"> {
  if (!hubEventsConfigured()) return "disabled";
  const body = JSON.stringify(event);
  const timestamp = String(Date.now());
  try {
    const response = await fetch(hubUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-v79-service-id": "website",
        "x-v79-timestamp": timestamp,
        "x-v79-signature": signature(body, timestamp),
      },
      body,
      signal: AbortSignal.timeout(6000),
    });
    if (response.ok) return "sent";
    if (response.status === 409 || response.status === 429 || response.status >= 500) return "pending";
    const detail = await response.json().catch(() => ({}));
    console.error("[V79 Hub Events] Event rejected:", response.status, detail?.error || "unknown error");
    return "failed";
  } catch (error: any) {
    console.warn("[V79 Hub Events] Delivery deferred:", error?.message || error);
    return "pending";
  }
}
