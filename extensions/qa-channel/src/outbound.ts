// Qa Channel plugin module implements outbound behavior.
import path from "node:path";
import { resolveQaChannelAccount } from "./accounts.js";
import { buildQaTarget, resolveQaTargetThread, sendQaBusMessage } from "./bus-client.js";
import type { CoreConfig } from "./types.js";

function qaMediaPathname(mediaUrl: string): string {
  try {
    return new URL(mediaUrl).pathname;
  } catch {
    return mediaUrl.split(/[?#]/u, 1)[0] ?? mediaUrl;
  }
}

function qaMediaKind(mediaPathname: string): "image" | "video" | "audio" | "file" {
  const extension = path.extname(mediaPathname).toLowerCase();
  if ([".gif", ".jpeg", ".jpg", ".png", ".webp"].includes(extension)) {
    return "image";
  }
  if ([".m4a", ".mp3", ".ogg", ".opus", ".wav"].includes(extension)) {
    return "audio";
  }
  if ([".mov", ".mp4", ".webm"].includes(extension)) {
    return "video";
  }
  return "file";
}

function qaMediaMimeType(kind: ReturnType<typeof qaMediaKind>): string {
  return kind === "image"
    ? "image/*"
    : kind === "audio"
      ? "audio/*"
      : kind === "video"
        ? "video/*"
        : "application/octet-stream";
}

export async function sendQaChannelText(params: {
  cfg: CoreConfig;
  accountId?: string | null;
  to: string;
  text: string;
  threadId?: string | number | null;
  replyToId?: string | number | null;
}) {
  const account = resolveQaChannelAccount({ cfg: params.cfg, accountId: params.accountId });
  const resolved = resolveQaTargetThread({ target: params.to, threadId: params.threadId });
  const parsed = resolved.target;
  const { message } = await sendQaBusMessage({
    baseUrl: account.baseUrl,
    accountId: account.accountId,
    to: buildQaTarget({
      chatType: parsed.chatType,
      conversationId: parsed.conversationId,
      threadId: resolved.threadId,
    }),
    text: params.text,
    senderId: account.botUserId,
    senderName: account.botDisplayName,
    threadId: resolved.threadId,
    replyToId: params.replyToId == null ? undefined : String(params.replyToId),
  });
  return {
    to: params.to,
    messageId: message.id,
  };
}

export async function sendQaChannelMedia(params: {
  cfg: CoreConfig;
  accountId?: string | null;
  to: string;
  text: string;
  mediaUrl: string;
  threadId?: string | number | null;
  replyToId?: string | number | null;
}) {
  const account = resolveQaChannelAccount({ cfg: params.cfg, accountId: params.accountId });
  const resolved = resolveQaTargetThread({ target: params.to, threadId: params.threadId });
  const parsed = resolved.target;
  const mediaPathname = qaMediaPathname(params.mediaUrl);
  const kind = qaMediaKind(mediaPathname);
  const { message } = await sendQaBusMessage({
    baseUrl: account.baseUrl,
    accountId: account.accountId,
    to: buildQaTarget({
      chatType: parsed.chatType,
      conversationId: parsed.conversationId,
      threadId: resolved.threadId,
    }),
    text: params.text,
    senderId: account.botUserId,
    senderName: account.botDisplayName,
    threadId: resolved.threadId,
    replyToId: params.replyToId == null ? undefined : String(params.replyToId),
    attachments: [
      {
        id: params.mediaUrl,
        kind,
        mimeType: qaMediaMimeType(kind),
        fileName: path.basename(mediaPathname) || "attachment",
        url: params.mediaUrl,
      },
    ],
  });
  return { to: params.to, messageId: message.id };
}
