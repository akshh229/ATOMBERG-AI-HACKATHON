import crypto from "node:crypto";
import { buildTeamsAdaptiveCard, type NotificationPreview } from "@/lib/integrations/notifications";

export type DispatchResult = {
  id: string;
  channel: NotificationPreview["channel"];
  recipient: string;
  status: "sent" | "skipped" | "failed";
  message: string;
};

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

function parseAllowlist(raw: string | undefined) {
  return (raw ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function assertAllowedWebhook(url: string, allowlist: string[], channel: NotificationPreview["channel"]) {
  if (allowlist.length === 0) return;
  const hostname = new URL(url).hostname.toLowerCase();
  if (!allowlist.includes(hostname)) {
    throw new Error(`${channel} webhook host is not in allowlist.`);
  }
}

function signatureHeader(payload: string) {
  const secret = process.env.WEBHOOK_HMAC_SECRET;
  if (!secret) return undefined;
  const digest = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `sha256=${digest}`;
}

async function postJson(url: string, body: unknown, token?: string) {
  const payload = JSON.stringify(body);
  const signature = signatureHeader(payload);
  const maxRetries = Number(process.env.DISPATCH_MAX_RETRIES ?? 2);
  let attempt = 0;

  while (true) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Token ${token}` } : {}),
        ...(signature ? { "x-alignhq-signature": signature } : {})
      },
      body: payload
    });

    if (response.ok) return;

    const shouldRetry = RETRYABLE_STATUS.has(response.status) && attempt < maxRetries;
    if (!shouldRetry) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const waitMs = 300 * 2 ** attempt;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    attempt += 1;
  }
}

export async function dispatchNotification(notification: NotificationPreview): Promise<DispatchResult> {
  try {
    if (notification.channel === "Microsoft Teams") {
      const url = process.env.TEAMS_WEBHOOK_URL;
      if (!url) {
        return { ...base(notification), status: "skipped", message: "TEAMS_WEBHOOK_URL is not configured." };
      }

      assertAllowedWebhook(url, parseAllowlist(process.env.TEAMS_WEBHOOK_ALLOWLIST), "Microsoft Teams");
      await postJson(url, buildTeamsAdaptiveCard(notification));
      return { ...base(notification), status: "sent", message: "Teams adaptive card sent." };
    }

    const url = process.env.EMAIL_WEBHOOK_URL;
    if (!url) {
      return { ...base(notification), status: "skipped", message: "EMAIL_WEBHOOK_URL is not configured." };
    }

    assertAllowedWebhook(url, parseAllowlist(process.env.EMAIL_WEBHOOK_ALLOWLIST), "Email");
    await postJson(
      url,
      {
        to: notification.recipient,
        subject: notification.subject,
        text: `${notification.body}\n\nOpen: ${notification.deepLink}`,
        html: `<p>${escapeHtml(notification.body)}</p><p><a href="${notification.deepLink}">Open goal sheet</a></p>`
      },
      process.env.EMAIL_WEBHOOK_TOKEN
    );

    return { ...base(notification), status: "sent", message: "Email webhook sent." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Dispatch failed.";
    console.warn("[dispatch] notification_failed", {
      id: notification.id,
      channel: notification.channel,
      recipient: notification.recipient,
      message
    });

    return {
      ...base(notification),
      status: "failed",
      message
    };
  }
}

function base(notification: NotificationPreview) {
  return {
    id: notification.id,
    channel: notification.channel,
    recipient: notification.recipient
  };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return entities[char];
  });
}
