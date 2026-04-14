export type ApiResponse<T = unknown> = {
  success?: boolean;
  message?: string;
  data?: T;
  [key: string]: unknown;
};

export type UserProfile = {
  _id?: string;
  email?: string;
  fullName?: string;
  role?: string;
  [key: string]: unknown;
};

export type Doubt = {
  _id?: string;
  title?: string;
  description?: string;
  subject?: string;
  status?: string;
  [key: string]: unknown;
};

export type NotificationItem = {
  _id?: string;
  title?: string;
  message?: string;
  isRead?: boolean;
  createdAt?: string;
  [key: string]: unknown;
};

export type WalletSummary = {
  balance?: number;
  pendingAmount?: number;
  totalWithdrawn?: number;
  [key: string]: unknown;
};
