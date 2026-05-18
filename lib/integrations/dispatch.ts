import { buildTeamsAdaptiveCard, type NotificationPreview } from "@/lib/integrations/notifications";

export type DispatchResult = {
  id: string;
  channel: NotificationPreview["channel"];
  recipient: string;
  status: "sent" | "skipped" | "failed";
  message: string;
};

async function postJson(url: string, body: unknown, token?: string) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
}

export async function dispatchNotification(notification: NotificationPreview): Promise<DispatchResult> {
  try {
    if (notification.channel === "Microsoft Teams") {
      const url = process.env.TEAMS_WEBHOOK_URL;
      if (!url) {
        return { ...base(notification), status: "skipped", message: "TEAMS_WEBHOOK_URL is not configured." };
      }

      await postJson(url, buildTeamsAdaptiveCard(notification));
      return { ...base(notification), status: "sent", message: "Teams adaptive card sent." };
    }

    const url = process.env.EMAIL_WEBHOOK_URL;
    if (!url) {
      return { ...base(notification), status: "skipped", message: "EMAIL_WEBHOOK_URL is not configured." };
    }

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
    return {
      ...base(notification),
      status: "failed",
      message: error instanceof Error ? error.message : "Dispatch failed."
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
