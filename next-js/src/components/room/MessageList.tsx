import type { RoomChatMessage } from "@/src/hooks/useRoomChat";
import { MessageListItem } from "./MessageListItem";

export type MessageListProps = {
  messages: RoomChatMessage[];
  userId: string | undefined;
  variant?: "default" | "meeting";
};

export function MessageList({ messages, userId, variant = "default" }: MessageListProps) {
  return (
    <ul className={variant === "meeting" ? "meet-msg-list" : "flex flex-col gap-2"}>
      {messages.map((entry) => (
        <MessageListItem
          key={`${entry.sentAt}-${entry.senderUserId}-${entry.message.slice(0, 20)}`}
          entry={entry}
          userId={userId}
          variant={variant}
        />
      ))}
    </ul>
  );
}
