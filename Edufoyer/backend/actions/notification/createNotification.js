import Notification from '../../models/Notification.js';

export async function createNotification({
  userId,
  doubtId,
  messageType,
  content,
}) {
  if (!userId || !messageType || !content) {
    console.error("Missing required fields for creating notification:", {
      userId,
      messageType,
      content,
    });
    return;
  }

  try {
    await Notification.create({
      user_id: userId,
      doubt_id: doubtId ?? undefined,
      message_type: messageType,
      content: content,
    });
    console.log(`Notification created for user ${userId}: ${content}`);
  } catch (error) {
    console.error(`Failed to create notification for user ${userId}:`, error);
  }
}
