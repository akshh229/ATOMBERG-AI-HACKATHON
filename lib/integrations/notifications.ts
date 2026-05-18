import type { EscalationItem } from "@/lib/domain/escalations";

export type NotificationChannel = "Email" | "Microsoft Teams";

export type NotificationPreview = {
  id: string;
  channel: NotificationChannel;
  recipient: string;
  subject: string;
  body: string;
  deepLink: string;
};

export function buildNotificationPreviews(items: EscalationItem[], appOrigin = "https://alignhq.example.com"): NotificationPreview[] {
  return items.flatMap((item) => {
    const link = new URL(item.deepLink, appOrigin).toString();
    const subject = `${item.kind}: ${item.owner.name}`;
    const body = `${item.reason} Escalation chain: ${item.chain.join(" -> ")}.`;
    const recipients = [item.owner.email, item.manager?.email, item.hr.email].filter(Boolean) as string[];

    return recipients.flatMap((recipient) => [
      {
        id: `${item.id}-email-${recipient}`,
        channel: "Email" as const,
        recipient,
        subject,
        body,
        deepLink: link
      },
      {
        id: `${item.id}-teams-${recipient}`,
        channel: "Microsoft Teams" as const,
        recipient,
        subject,
        body,
        deepLink: link
      }
    ]);
  });
}

export function buildTeamsAdaptiveCard(notification: NotificationPreview) {
  return {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          type: "AdaptiveCard",
          version: "1.5",
          body: [
            { type: "TextBlock", weight: "Bolder", text: notification.subject },
            { type: "TextBlock", wrap: true, text: notification.body }
          ],
          actions: [{ type: "Action.OpenUrl", title: "Open goal sheet", url: notification.deepLink }]
        }
      }
    ]
  };
}
