export type IncomingDoubt = {
  doubtId: string;
  subject: string;
  description?: string;
  status?: string;
  createdAt?: string;
  is_scheduled?: boolean;
  scheduled_date?: string;
  scheduled_time?: string;
};

export function incomingDoubtFromPayload(payload: Record<string, unknown>): IncomingDoubt {
  return {
    doubtId: String(payload.doubtId ?? ""),
    subject: String(payload.subject ?? "New doubt"),
    description: payload.description != null ? String(payload.description) : undefined,
    status: payload.status != null ? String(payload.status) : undefined,
    createdAt: payload.createdAt != null ? String(payload.createdAt) : undefined,
    is_scheduled: Boolean(payload.is_scheduled),
    scheduled_date:
      payload.scheduled_date != null ? String(payload.scheduled_date) : undefined,
    scheduled_time:
      payload.scheduled_time != null ? String(payload.scheduled_time) : undefined,
  };
}
