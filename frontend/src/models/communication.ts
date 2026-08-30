/**
 * Module 7: Communication Module
 * ================================
 * TypeScript models for vendor-facing messaging, internal discussions,
 * file sharing, communication history, activity audit logging,
 * and in-app notifications.
 *
 * Frontend-only mock structures. Swapping in real HTTP/REST API calls
 * requires editing only communicationService.ts — these interfaces remain unchanged.
 */

// ─── Shared entity reference types ───────────────────────────────────────────

export type CommEntityType =
  | 'Vendor'
  | 'Procurement Request'
  | 'Purchase Order'
  | 'Contract'
  | 'Invoice'
  | 'Delivery'
  | 'Compliance'
  | 'Discussion';

// ─── Message ─────────────────────────────────────────────────────────────────

export interface Message {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  receiverId: string;
  receiverName: string;
  receiverRole: string;
  content: string;
  timestamp: string;               // ISO datetime
  readStatus: boolean;             // true = read by receiver
  relatedEntityType: CommEntityType | null;
  relatedEntityNumber: string | null; // e.g. 'PO-2026-0003', 'CT-2026-0001'
  attachmentIds: string[];          // fileIds from SharedFile store
}

// ─── Conversation ─────────────────────────────────────────────────────────────

export interface ConversationParticipant {
  userId: string;
  userName: string;
  userRole: string;
}

export interface Conversation {
  conversationId: string;
  participants: ConversationParticipant[];
  subject: string;
  relatedEntityType: CommEntityType | null;
  relatedEntityNumber: string | null;
  lastMessagePreview: string;
  lastMessageTime: string;         // ISO datetime
  unreadCount: number;             // unread for the current viewer
  vendorConversation: boolean;     // true if a vendor is a participant
}

// ─── Discussion ───────────────────────────────────────────────────────────────

export type DiscussionStatus = 'Open' | 'Resolved' | 'Closed';

export interface DiscussionMessage {
  messageId: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: string;              // ISO datetime
  attachmentIds: string[];
}

export interface Discussion {
  discussionId: string;
  title: string;
  createdBy: string;
  createdByRole: string;
  createdAt: string;              // ISO datetime
  status: DiscussionStatus;
  relatedEntityType: CommEntityType | null;
  relatedEntityNumber: string | null;
  participants: Array<{ userId: string; name: string; role: string }>;
  messages: DiscussionMessage[];  // threaded replies; first entry is the opening post
}

// ─── Shared File ──────────────────────────────────────────────────────────────

export type SharedFileType = 'PDF' | 'Excel' | 'Word' | 'Image' | 'ZIP';

export interface SharedFile {
  fileId: string;
  fileName: string;
  fileType: SharedFileType;
  fileSizeLabel: string;          // e.g. '1.2 MB', '340 KB'
  uploadedBy: string;
  uploadedByRole: string;
  uploadedAt: string;             // ISO datetime
  relatedEntityType: CommEntityType;
  relatedEntityNumber: string;    // e.g. 'PO-2026-0003', 'CT-2026-0001'
  description: string;
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

export type ActivityLogAction =
  | 'Message Sent'
  | 'Message Viewed'
  | 'Discussion Created'
  | 'Discussion Reply'
  | 'File Uploaded'
  | 'File Downloaded'
  | 'Document Accessed';

export interface ActivityLog {
  logId: string;
  userId: string;
  userName: string;
  userRole: string;
  action: ActivityLogAction;
  timestamp: string;              // ISO datetime
  moduleName: string;             // e.g. 'Messages', 'Discussions', 'File Sharing'
  relatedEntityType: CommEntityType | null;
  relatedEntityNumber: string | null;
  ipAddress: string;              // mock value e.g. '192.168.3.54'
}

// ─── Comm Notification ───────────────────────────────────────────────────────
/**
 * These in-app notifications simulate the future backend EMAIL notifications
 * that will be triggered by the real CommunicationService (FastAPI) endpoints.
 *
 * Backend plan:
 *   - POST /api/v1/messages/send          → triggers email to receiver
 *   - POST /api/v1/discussions/{id}/reply → triggers email to all participants
 *   - POST /api/v1/files/upload           → triggers email to entity stakeholders
 *   - Nightly cron: pending discussion alerts → email to all assigned managers
 */

export type CommNotificationType =
  | 'New Message'
  | 'Discussion Reply'
  | 'File Shared'
  | 'Pending Discussion';

export interface CommNotification {
  notificationId: string;
  type: CommNotificationType;
  summary: string;                // e.g. 'TechCorp replied to your message about PO-2026-0003'
  fromUser: string;               // sender name
  relatedEntityNumber: string | null;
  createdAt: string;              // ISO datetime
  read: boolean;
}

// ─── Service filter/pagination types ──────────────────────────────────────────

export interface ConversationFilters {
  search?: string;
  vendorOnly?: boolean;
  relatedEntityType?: CommEntityType;
  relatedEntityNumber?: string;
}

export interface DiscussionFilters {
  status?: DiscussionStatus | 'All';
  relatedEntityType?: CommEntityType;
  relatedEntityNumber?: string;
  search?: string;
}

export interface FileFilters {
  relatedEntityType?: CommEntityType;
  relatedEntityNumber?: string;
  fileType?: SharedFileType | 'All';
  search?: string;
}

export interface ActivityLogFilters {
  userId?: string;
  action?: ActivityLogAction | 'All';
  moduleName?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedActivityLogs {
  items: ActivityLog[];
  total: number;
  page: number;
  pageSize: number;
}
