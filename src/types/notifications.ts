export interface NotificationPreference {
  emailNotificationsEnabled: boolean;
  lastNotificationSentAt: string | null;
  lastNotifiedCalculationId: string | null;
}

export interface ReminderScheduleInfo {
  isEnabled: boolean;
  userEmail: string | null;
  hasCalculation: boolean;
  lastCalculationId: string | null;
  lastCalculationDate: string | null;
  lastCalculationFormattedWIB: string | null;
  targetReminderDate: string | null;
  targetReminderFormattedWIB: string | null;
  isDue: boolean;
  isAlreadySentForThisCycle: boolean;
  statusLabel: string;
}

export interface SendReminderResult {
  userId: string;
  recipientEmail: string;
  calculationId: string;
  status: "sent" | "failed" | "skipped";
  reason?: string;
  messageId?: string;
}

export interface ProcessRemindersReport {
  timestamp: string;
  totalEligibleUsers: number;
  sentCount: number;
  skippedCount: number;
  failedCount: number;
  details: SendReminderResult[];
}
