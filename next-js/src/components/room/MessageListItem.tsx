import type { RoomChatMessage } from "@/src/hooks/useRoomChat";

export type MessageListItemProps = {
  entry: RoomChatMessage;
  userId: string | undefined;
  variant?: "default" | "meeting";
};

export function MessageListItem({ entry, userId, variant = "default" }: MessageListItemProps) {
  const isOwnMessage = Boolean(userId && entry.senderUserId === userId);
  const senderLabel = isOwnMessage ? "You" : entry.sender.username;

  if (variant === "meeting") {
    return (
      <li className={`meet-msg ${isOwnMessage ? "meet-msg--own" : "meet-msg--other"}`}>
        <span className="meet-msg__label">{senderLabel}</span>
        <p className="meet-msg__bubble">{entry.message}</p>
      </li>
    );
  }

  return (
    <li className="text-xs">
      <span className="font-medium text-indigo-300">{senderLabel}</span>
      <span className="text-slate-500"> · </span>
      <span className="text-slate-200">{entry.message}</span>
    </li>
  );
}
