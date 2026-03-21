export const supportEntryPoints = [
  { key: "chat", title: "Chat orqali murojaat", icon: "chat-attach", emphasis: "high" },
  { key: "document-report", title: "Hujjat bilan xabar yuborish", icon: "support-report-doc", emphasis: "medium" },
  { key: "video-report", title: "Video bilan holatni ko‘rsatish", icon: "support-video-report", emphasis: "medium" },
  { key: "reports", title: "Murojaatlar tarixi", icon: "support-reports", emphasis: "low" }
];

export const supportComposerPatterns = {
  attachments: ["camera", "card", "fine", "location", "media", "ride"],
  jumpAction: "latest-message",
  escalationStates: ["new", "review", "resolved"]
};

export function buildSupportSurface({ unread = 0, hasOpenTicket = false } = {}) {
  return {
    headline: hasOpenTicket ? "Faol murojaatingiz bor" : "Yordam markazi tayyor",
    priority: unread > 0 ? "attention" : "default",
    unread
  };
}
