/**
 * Module 9 – Notification Module
 * TypeScript interface/model definitions.
 *
 * These mirror the planned backend schema exactly so that
 * swapping the mock NotificationService for real HTTP calls
 * requires zero interface changes.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'PROCUREMENT_ALERT'
  | 'DELIVERY_DELAY'
  | 'VENDOR_APPROVAL'
  | 'VENDOR_REJECTION'
  | 'CONTRACT_EXPIRY'
  | 'COMPLIANCE_ALERT'
  | 'INVOICE_APPROVED'
  | 'PO_CREATED'
  | 'PROCUREMENT_REQUEST'
  | 'MESSAGE_RECEIVED'
  | 'REPORT_GENERATED'
  | 'PROFILE_UPDATED'
  | 'PASSWORD_CHANGED';

export type NotificationPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type DeliveryMethod = 'IN_APP' | 'EMAIL' | 'SMS';

export type RelatedModule =
  | 'Vendor Management'
  | 'Procurement'
  | 'Performance'
  | 'Contracts & Compliance'
  | 'Communication'
  | 'Reports'
  | 'System';

// ─── Core Model ───────────────────────────────────────────────────────────────

/** Mirrors the planned backend `notifications` table */
export interface AppNotification {
  notificationId: string;           // UUID / surrogate key
  userId: string;                   // FK → users.id (role-based in mock)
  notificationType: NotificationType;
  title: string;
  description: string;
  relatedModule: RelatedModule;
  relatedRecordId?: string;         // FK to the affected record (PO/Contract/etc.)
  timestamp: string;                // ISO 8601 datetime string
  priority: NotificationPriority;
  deliveryMethod: DeliveryMethod[]; // one or more channels
  readStatus: boolean;              // false = unread
}

// ─── Filter Params ─────────────────────────────────────────────────────────────

export interface NotificationFilters {
  notificationType?: NotificationType;
  priority?: NotificationPriority;
  relatedModule?: RelatedModule;
  readStatus?: boolean;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

// ─── Notification Settings ──────────────────────────────────────────────────

export type PriorityThreshold = 'ALL' | 'MEDIUM_PLUS' | 'HIGH_ONLY';

export interface CategoryChannelSetting {
  inApp: boolean;
  email: boolean;
  sms: boolean;
}

export interface NotificationSettings {
  muteAll: boolean;
  priorityThreshold: PriorityThreshold;
  categoryChannels: Partial<Record<NotificationType, CategoryChannelSetting>>;
  expiryReminders: {
    days90: boolean;
    days30: boolean;
    days7: boolean;
    days1: boolean;
  };
}

export function defaultNotificationSettings(): NotificationSettings {
  const allTypes: NotificationType[] = [
    'PROCUREMENT_ALERT', 'DELIVERY_DELAY', 'VENDOR_APPROVAL', 'VENDOR_REJECTION',
    'CONTRACT_EXPIRY', 'COMPLIANCE_ALERT', 'INVOICE_APPROVED', 'PO_CREATED',
    'PROCUREMENT_REQUEST', 'MESSAGE_RECEIVED', 'REPORT_GENERATED',
    'PROFILE_UPDATED', 'PASSWORD_CHANGED',
  ];
  const channels: Partial<Record<NotificationType, CategoryChannelSetting>> = {};
  allTypes.forEach(t => {
    channels[t] = { inApp: true, email: true, sms: false };
  });
  // High-priority types get SMS by default
  (['PROCUREMENT_ALERT', 'DELIVERY_DELAY', 'CONTRACT_EXPIRY', 'COMPLIANCE_ALERT'] as NotificationType[]).forEach(t => {
    if (channels[t]) channels[t]!.sms = true;
  });
  return {
    muteAll: false,
    priorityThreshold: 'ALL',
    categoryChannels: channels,
    expiryReminders: { days90: true, days30: true, days7: true, days1: true },
  };
}

// ─── Toast Event (fired from service → React layer) ─────────────────────────

export interface ToastEvent {
  id: string;
  title: string;
  description: string;
  priority: NotificationPriority;
  emailSent: boolean;
  smsSent: boolean;
}

// ─── Role → Notification Type ACL mapping ─────────────────────────────────────
// Determines which notification types are VISIBLE to each role.
// Used by the service for role-aware filtering.

export type UserRole =
  | 'Administrator'
  | 'Procurement Manager'
  | 'Supply Chain Manager'
  | 'Vendor'
  | 'Finance Officer'
  | 'Auditor';

export const ROLE_NOTIFICATION_ACL: Record<UserRole, NotificationType[]> = {
  'Administrator': [
    'PROCUREMENT_ALERT', 'DELIVERY_DELAY', 'VENDOR_APPROVAL', 'VENDOR_REJECTION',
    'CONTRACT_EXPIRY', 'COMPLIANCE_ALERT', 'INVOICE_APPROVED', 'PO_CREATED',
    'PROCUREMENT_REQUEST', 'MESSAGE_RECEIVED', 'REPORT_GENERATED',
    'PROFILE_UPDATED', 'PASSWORD_CHANGED',
  ],
  'Procurement Manager': [
    'PROCUREMENT_ALERT', 'DELIVERY_DELAY', 'CONTRACT_EXPIRY', 'COMPLIANCE_ALERT',
    'PO_CREATED', 'PROCUREMENT_REQUEST', 'MESSAGE_RECEIVED', 'REPORT_GENERATED',
  ],
  'Supply Chain Manager': [
    'DELIVERY_DELAY', 'PO_CREATED', 'MESSAGE_RECEIVED', 'REPORT_GENERATED',
  ],
  'Vendor': [
    'VENDOR_APPROVAL', 'VENDOR_REJECTION', 'PO_CREATED', 'DELIVERY_DELAY',
    'INVOICE_APPROVED', 'MESSAGE_RECEIVED',
  ],
  'Finance Officer': [
    'INVOICE_APPROVED', 'PO_CREATED', 'MESSAGE_RECEIVED', 'REPORT_GENERATED',
  ],
  'Auditor': [
    'CONTRACT_EXPIRY', 'COMPLIANCE_ALERT', 'MESSAGE_RECEIVED',
    'REPORT_GENERATED',
  ],
};
