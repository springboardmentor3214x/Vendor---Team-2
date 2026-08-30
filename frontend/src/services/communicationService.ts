/**
 * CommunicationService — Module 7: Communication Module
 * =======================================================
 * Injectable mock service for internal discussions, vendor messaging,
 * file sharing, activity logging, and notification simulation.
 *
 * All methods return Observables shaped like future FastAPI/REST responses.
 * A teammate can swap in real HTTP calls by editing only this service file.
 */

import type {
  Message,
  Conversation,
  Discussion,
  DiscussionMessage,
  SharedFile,
  ActivityLog,
  CommNotification,
  CommEntityType,
  ConversationFilters,
  DiscussionFilters,
  FileFilters,
  ActivityLogFilters,
  PaginatedActivityLogs,
} from '../models/communication';

// ─── Lightweight Observable implementation ───────────────────────────────────

class Observable<T> {
  constructor(private subscribeFn: (subscriber: { next: (val: T) => void }) => void) {}

  subscribe(next: (val: T) => void): { unsubscribe: () => void } {
    let unsubscribed = false;
    this.subscribeFn({
      next: (val: T) => {
        if (!unsubscribed) next(val);
      },
    });
    return { unsubscribe: () => { unsubscribed = true; } };
  }

  toPromise(): Promise<T> {
    return new Promise((resolve) => this.subscribe((val) => resolve(val)));
  }
}

function of<T>(value: T): Observable<T> {
  return new Observable<T>((subscriber) => subscriber.next(value));
}

function delay<T>(value: T, ms = 80): Observable<T> {
  return new Observable<T>((subscriber) => {
    setTimeout(() => subscriber.next(value), ms);
  });
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

const SEED_CONVERSATIONS: Conversation[] = [
  {
    conversationId: 'CONV-2026-001',
    participants: [
      { userId: 'USR-001', userName: 'Hrithik', userRole: 'Administrator' },
      { userId: 'VND-001', userName: 'TechCorp Solutions Pvt Ltd', userRole: 'Vendor' },
    ],
    subject: 'Quotation Clarification for Developer Workstations',
    relatedEntityType: 'Purchase Order',
    relatedEntityNumber: 'PO-2026-0042',
    lastMessagePreview: 'We have updated the specs for the NVMe drives as requested.',
    lastMessageTime: '2026-08-05T14:30:00Z',
    unreadCount: 1,
    vendorConversation: true,
  },
  {
    conversationId: 'CONV-2026-002',
    participants: [
      { userId: 'USR-002', userName: 'Rohan Verma', userRole: 'Procurement Manager' },
      { userId: 'VND-002', userName: 'Global Logistics & Freight', userRole: 'Vendor' },
    ],
    subject: 'Delivery Schedule Adjustment - Mumbai to Pune Cold Chain',
    relatedEntityType: 'Purchase Order',
    relatedEntityNumber: 'PO-2026-0041',
    lastMessagePreview: 'Truck breakdown on NH8; replacement vehicle dispatched.',
    lastMessageTime: '2026-08-04T11:15:00Z',
    unreadCount: 0,
    vendorConversation: true,
  },
  {
    conversationId: 'CONV-2026-003',
    participants: [
      { userId: 'USR-003', userName: 'Lata Nair', userRole: 'Finance Officer' },
      { userId: 'VND-005', userName: 'EquipMax Machinery Ltd', userRole: 'Vendor' },
    ],
    subject: 'Payment Verification for Forklift Invoice TX-2026-891',
    relatedEntityType: 'Invoice',
    relatedEntityNumber: 'TX-2026-891',
    lastMessagePreview: 'Tax breakdown verified. Payment scheduled for Net 30 release.',
    lastMessageTime: '2026-08-03T09:45:00Z',
    unreadCount: 0,
    vendorConversation: true,
  },
  {
    conversationId: 'CONV-2026-004',
    participants: [
      { userId: 'USR-001', userName: 'Hrithik', userRole: 'Administrator' },
      { userId: 'VND-009', userName: 'NovaSec Systems Pvt Ltd', userRole: 'Vendor' },
    ],
    subject: 'ISO 27001 Documentation Request & Penetration Audit',
    relatedEntityType: 'Contract',
    relatedEntityNumber: 'CT-2026-0004',
    lastMessagePreview: 'Shared updated SOC 2 Type II report for compliance verification.',
    lastMessageTime: '2026-08-02T16:20:00Z',
    unreadCount: 2,
    vendorConversation: true,
  },
  {
    conversationId: 'CONV-2026-005',
    participants: [
      { userId: 'USR-002', userName: 'Rohan Verma', userRole: 'Procurement Manager' },
      { userId: 'VND-004', userName: 'Zenith Office Supplies', userRole: 'Vendor' },
    ],
    subject: 'Annual Supply Contract SLA Terms Discussion',
    relatedEntityType: 'Contract',
    relatedEntityNumber: 'CT-2026-0003',
    lastMessagePreview: 'Draft terms reviewed by legal team; agreement signed.',
    lastMessageTime: '2026-08-01T10:00:00Z',
    unreadCount: 0,
    vendorConversation: true,
  },
  {
    conversationId: 'CONV-2026-006',
    participants: [
      { userId: 'USR-002', userName: 'Rohan Verma', userRole: 'Procurement Manager' },
      { userId: 'VND-010', userName: 'SafeGuard Industries', userRole: 'Vendor' },
    ],
    subject: 'OHSAS Safety Certification Expiry Notice',
    relatedEntityType: 'Compliance',
    relatedEntityNumber: 'PR-2026-0007',
    lastMessagePreview: 'Please provide valid audit renewal certificate by end of week.',
    lastMessageTime: '2026-07-31T15:30:00Z',
    unreadCount: 0,
    vendorConversation: true,
  },
  {
    conversationId: 'CONV-2026-007',
    participants: [
      { userId: 'USR-001', userName: 'Hrithik', userRole: 'Administrator' },
      { userId: 'VND-011', userName: 'Infra Build & Civil Co.', userRole: 'Vendor' },
    ],
    subject: 'Warehouse C Foundation Repair Site Visit Update',
    relatedEntityType: 'Procurement Request',
    relatedEntityNumber: 'PR-2026-0003',
    lastMessagePreview: 'Civil engineers will conduct structural inspection on Monday.',
    lastMessageTime: '2026-07-29T12:00:00Z',
    unreadCount: 0,
    vendorConversation: true,
  },
  {
    conversationId: 'CONV-2026-008',
    participants: [
      { userId: 'USR-002', userName: 'Rohan Verma', userRole: 'Procurement Manager' },
      { userId: 'VND-012', userName: 'PrintMaster Communications', userRole: 'Vendor' },
    ],
    subject: 'Trade Fair Marketing Collateral Proofs',
    relatedEntityType: 'Purchase Order',
    relatedEntityNumber: 'PO-2026-0037',
    lastMessagePreview: 'High-res print proofs approved for production run.',
    lastMessageTime: '2026-07-28T17:10:00Z',
    unreadCount: 0,
    vendorConversation: true,
  },
];

const SEED_MESSAGES: Message[] = [
  // Conversation 1 (PO-2026-0042)
  {
    messageId: 'MSG-101',
    conversationId: 'CONV-2026-001',
    senderId: 'USR-001',
    senderName: 'Hrithik',
    senderRole: 'Administrator',
    receiverId: 'VND-001',
    receiverName: 'TechCorp Solutions Pvt Ltd',
    receiverRole: 'Vendor',
    content: 'Hi TechCorp team, please confirm if the 32GB RAM units in PO-2026-0042 are dual-channel DDR5.',
    timestamp: '2026-08-05T10:00:00Z',
    readStatus: true,
    relatedEntityType: 'Purchase Order',
    relatedEntityNumber: 'PO-2026-0042',
    attachmentIds: [],
  },
  {
    messageId: 'MSG-102',
    conversationId: 'CONV-2026-001',
    senderId: 'VND-001',
    senderName: 'TechCorp Solutions Pvt Ltd',
    senderRole: 'Vendor',
    receiverId: 'USR-001',
    receiverName: 'Hrithik',
    receiverRole: 'Administrator',
    content: 'Yes, all 8 workstations feature dual-channel DDR5 5600MHz modules with ECC support.',
    timestamp: '2026-08-05T10:30:00Z',
    readStatus: true,
    relatedEntityType: 'Purchase Order',
    relatedEntityNumber: 'PO-2026-0042',
    attachmentIds: ['FILE-001'],
  },
  {
    messageId: 'MSG-103',
    conversationId: 'CONV-2026-001',
    senderId: 'USR-001',
    senderName: 'Hrithik',
    senderRole: 'Administrator',
    receiverId: 'VND-001',
    receiverName: 'TechCorp Solutions Pvt Ltd',
    receiverRole: 'Vendor',
    content: 'Excellent. Can you upload the updated spec sheet with NVMe speeds?',
    timestamp: '2026-08-05T11:00:00Z',
    readStatus: true,
    relatedEntityType: 'Purchase Order',
    relatedEntityNumber: 'PO-2026-0042',
    attachmentIds: [],
  },
  {
    messageId: 'MSG-104',
    conversationId: 'CONV-2026-001',
    senderId: 'VND-001',
    senderName: 'TechCorp Solutions Pvt Ltd',
    senderRole: 'Vendor',
    receiverId: 'USR-001',
    receiverName: 'Hrithik',
    receiverRole: 'Administrator',
    content: 'We have updated the specs for the NVMe drives as requested.',
    timestamp: '2026-08-05T14:30:00Z',
    readStatus: false,
    relatedEntityType: 'Purchase Order',
    relatedEntityNumber: 'PO-2026-0042',
    attachmentIds: ['FILE-002'],
  },

  // Conversation 2 (PO-2026-0041)
  {
    messageId: 'MSG-201',
    conversationId: 'CONV-2026-002',
    senderId: 'USR-002',
    senderName: 'Rohan Verma',
    senderRole: 'Procurement Manager',
    receiverId: 'VND-002',
    receiverName: 'Global Logistics & Freight',
    receiverRole: 'Vendor',
    content: 'Tracking shows a 5-day delay for reefer transport on PO-2026-0041. Please clarify.',
    timestamp: '2026-08-04T09:00:00Z',
    readStatus: true,
    relatedEntityType: 'Purchase Order',
    relatedEntityNumber: 'PO-2026-0041',
    attachmentIds: [],
  },
  {
    messageId: 'MSG-202',
    conversationId: 'CONV-2026-002',
    senderId: 'VND-002',
    senderName: 'Global Logistics & Freight',
    senderRole: 'Vendor',
    receiverId: 'USR-002',
    receiverName: 'Rohan Verma',
    receiverRole: 'Procurement Manager',
    content: 'Truck breakdown on NH8; replacement vehicle dispatched.',
    timestamp: '2026-08-04T11:15:00Z',
    readStatus: true,
    relatedEntityType: 'Purchase Order',
    relatedEntityNumber: 'PO-2026-0041',
    attachmentIds: ['FILE-003'],
  },

  // Conversation 3 (Invoice TX-2026-891)
  {
    messageId: 'MSG-301',
    conversationId: 'CONV-2026-003',
    senderId: 'USR-003',
    senderName: 'Lata Nair',
    senderRole: 'Finance Officer',
    receiverId: 'VND-005',
    receiverName: 'EquipMax Machinery Ltd',
    receiverRole: 'Vendor',
    content: 'Invoice TX-2026-891 breakdown submitted. Verifying GST calculations.',
    timestamp: '2026-08-03T08:30:00Z',
    readStatus: true,
    relatedEntityType: 'Invoice',
    relatedEntityNumber: 'TX-2026-891',
    attachmentIds: [],
  },
  {
    messageId: 'MSG-302',
    conversationId: 'CONV-2026-003',
    senderId: 'VND-005',
    senderName: 'EquipMax Machinery Ltd',
    senderRole: 'Vendor',
    receiverId: 'USR-003',
    receiverName: 'Lata Nair',
    receiverRole: 'Finance Officer',
    content: 'Tax breakdown verified. Payment scheduled for Net 30 release.',
    timestamp: '2026-08-03T09:45:00Z',
    readStatus: true,
    relatedEntityType: 'Invoice',
    relatedEntityNumber: 'TX-2026-891',
    attachmentIds: [],
  },

  // Conversation 4 (CT-2026-0004)
  {
    messageId: 'MSG-401',
    conversationId: 'CONV-2026-004',
    senderId: 'VND-009',
    senderName: 'NovaSec Systems Pvt Ltd',
    senderRole: 'Vendor',
    receiverId: 'USR-001',
    receiverName: 'Hrithik',
    receiverRole: 'Administrator',
    content: 'Shared updated SOC 2 Type II report for compliance verification.',
    timestamp: '2026-08-02T16:20:00Z',
    readStatus: false,
    relatedEntityType: 'Contract',
    relatedEntityNumber: 'CT-2026-0004',
    attachmentIds: ['FILE-004'],
  },
];

const SEED_DISCUSSIONS: Discussion[] = [
  {
    discussionId: 'DISC-2026-001',
    title: 'PO-2026-0041 Delivery Date Realignment & Cold Chain SLA',
    createdBy: 'Rohan Verma',
    createdByRole: 'Procurement Manager',
    createdAt: '2026-08-03T10:00:00Z',
    status: 'Open',
    relatedEntityType: 'Purchase Order',
    relatedEntityNumber: 'PO-2026-0041',
    participants: [
      { userId: 'USR-002', name: 'Rohan Verma', role: 'Procurement Manager' },
      { userId: 'VND-002', name: 'Global Logistics & Freight', role: 'Vendor' },
      { userId: 'USR-003', name: 'Lata Nair', role: 'Finance Officer' },
      { userId: 'USR-004', name: 'Supply Chain Lead', role: 'Supply Chain Manager' },
    ],
    messages: [
      {
        messageId: 'DMSG-101',
        senderName: 'Rohan Verma',
        senderRole: 'Procurement Manager',
        content: 'Due to the NH8 breakdown delay on PO-2026-0041, we need an agreed revised delivery schedule and SLA penalty waiver approval.',
        timestamp: '2026-08-03T10:00:00Z',
        attachmentIds: [],
      },
      {
        messageId: 'DMSG-102',
        senderName: 'Global Logistics & Freight',
        senderRole: 'Vendor',
        content: 'Replacement reefer truck is en route. We propose a revised delivery schedule for 25th Aug 08:00 AM.',
        timestamp: '2026-08-03T11:30:00Z',
        attachmentIds: ['FILE-003'],
      },
      {
        messageId: 'DMSG-103',
        senderName: 'Supply Chain Lead',
        senderRole: 'Supply Chain Manager',
        content: 'Warehouse team confirmed dock slot reserved for 25th morning at Receiving Dock 4.',
        timestamp: '2026-08-03T14:10:00Z',
        attachmentIds: [],
      },
      {
        messageId: 'DMSG-104',
        senderName: 'Lata Nair',
        senderRole: 'Finance Officer',
        content: 'Finance team verified: payment terms remain Net 30 with no additional freight surcharges applicable for this delay.',
        timestamp: '2026-08-03T15:45:00Z',
        attachmentIds: [],
      },
      {
        messageId: 'DMSG-105',
        senderName: 'Global Logistics & Freight',
        senderRole: 'Vendor',
        content: 'Thank you all. Uploaded the revised shipment plan PDF with GPS route checkpoints for your records.',
        timestamp: '2026-08-03T16:30:00Z',
        attachmentIds: ['FILE-003'],
      },
    ],
  },
  {
    discussionId: 'DISC-2026-002',
    title: 'Contract CT-2026-0001 Renewal Terms & IP Ownership Scope',
    createdBy: 'Hrithik',
    createdByRole: 'Administrator',
    createdAt: '2026-07-28T14:00:00Z',
    status: 'Resolved',
    relatedEntityType: 'Contract',
    relatedEntityNumber: 'CT-2026-0001',
    participants: [
      { userId: 'USR-001', name: 'Hrithik', role: 'Administrator' },
      { userId: 'VND-001', name: 'TechCorp Solutions Pvt Ltd', role: 'Vendor' },
      { userId: 'USR-002', name: 'Rohan Verma', role: 'Procurement Manager' },
    ],
    messages: [
      {
        messageId: 'DMSG-201',
        senderName: 'Hrithik',
        senderRole: 'Administrator',
        content: 'Clarifying IP ownership clauses in Section 8 of the renewed agreement.',
        timestamp: '2026-07-28T14:00:00Z',
        attachmentIds: [],
      },
      {
        messageId: 'DMSG-202',
        senderName: 'TechCorp Solutions Pvt Ltd',
        senderRole: 'Vendor',
        content: 'Confirmed, custom code modules created for VendorIQ remain 100% client IP.',
        timestamp: '2026-07-29T09:15:00Z',
        attachmentIds: [],
      },
      {
        messageId: 'DMSG-203',
        senderName: 'Hrithik',
        senderRole: 'Administrator',
        content: 'Resolution agreed. Marking discussion as Resolved.',
        timestamp: '2026-07-29T10:00:00Z',
        attachmentIds: [],
      },
    ],
  },
  {
    discussionId: 'DISC-2026-003',
    title: 'PR-2026-0003 Warehouse C Foundation Structural Assessment',
    createdBy: 'Lata Nair',
    createdByRole: 'Finance Officer',
    createdAt: '2026-07-20T09:00:00Z',
    status: 'Open',
    relatedEntityType: 'Procurement Request',
    relatedEntityNumber: 'PR-2026-0003',
    participants: [
      { userId: 'USR-003', name: 'Lata Nair', role: 'Finance Officer' },
      { userId: 'VND-011', name: 'Infra Build & Civil Co.', role: 'Vendor' },
      { userId: 'USR-001', name: 'Hrithik', role: 'Administrator' },
    ],
    messages: [
      {
        messageId: 'DMSG-301',
        senderName: 'Lata Nair',
        senderRole: 'Finance Officer',
        content: 'Requesting preliminary estimate breakdown before budget allocation.',
        timestamp: '2026-07-20T09:00:00Z',
        attachmentIds: [],
      },
      {
        messageId: 'DMSG-302',
        senderName: 'Infra Build & Civil Co.',
        senderRole: 'Vendor',
        content: 'BoQ draft prepared and uploaded for review.',
        timestamp: '2026-07-21T11:00:00Z',
        attachmentIds: ['FILE-005'],
      },
    ],
  },
  {
    discussionId: 'DISC-2026-004',
    title: 'ISO 45001 Compliance Audit Readiness Check',
    createdBy: 'Rohan Verma',
    createdByRole: 'Procurement Manager',
    createdAt: '2026-07-15T11:00:00Z',
    status: 'Open',
    relatedEntityType: 'Compliance',
    relatedEntityNumber: 'PR-2026-0007',
    participants: [
      { userId: 'USR-002', name: 'Rohan Verma', role: 'Procurement Manager' },
      { userId: 'VND-010', name: 'SafeGuard Industries', role: 'Vendor' },
      { userId: 'USR-005', name: 'Auditor User', role: 'Auditor' },
    ],
    messages: [
      {
        messageId: 'DMSG-401',
        senderName: 'Rohan Verma',
        senderRole: 'Procurement Manager',
        content: 'Reviewing safety compliance documents ahead of upcoming site audit.',
        timestamp: '2026-07-15T11:00:00Z',
        attachmentIds: [],
      },
    ],
  },
];

const SEED_FILES: SharedFile[] = [
  {
    fileId: 'FILE-001',
    fileName: 'TechCorp_Workstation_SpecSheet_v2.pdf',
    fileType: 'PDF',
    fileSizeLabel: '2.4 MB',
    uploadedBy: 'TechCorp Solutions Pvt Ltd',
    uploadedByRole: 'Vendor',
    uploadedAt: '2026-08-05T10:30:00Z',
    relatedEntityType: 'Purchase Order',
    relatedEntityNumber: 'PO-2026-0042',
    description: 'Hardware specification sheet for i9 Workstations with dual-channel DDR5.',
  },
  {
    fileId: 'FILE-002',
    fileName: 'NVMe_PCIe4_Performance_Benchmark.pdf',
    fileType: 'PDF',
    fileSizeLabel: '1.8 MB',
    uploadedBy: 'TechCorp Solutions Pvt Ltd',
    uploadedByRole: 'Vendor',
    uploadedAt: '2026-08-05T14:30:00Z',
    relatedEntityType: 'Purchase Order',
    relatedEntityNumber: 'PO-2026-0042',
    description: 'Read/Write benchmark results for 1TB NVMe drives.',
  },
  {
    fileId: 'FILE-003',
    fileName: 'Reefer_Transit_Telemetry_Log.Excel',
    fileType: 'Excel',
    fileSizeLabel: '450 KB',
    uploadedBy: 'Global Logistics & Freight',
    uploadedByRole: 'Vendor',
    uploadedAt: '2026-08-04T11:15:00Z',
    relatedEntityType: 'Purchase Order',
    relatedEntityNumber: 'PO-2026-0041',
    description: 'Temperature and GPS telemetry log during transport.',
  },
  {
    fileId: 'FILE-004',
    fileName: 'NovaSec_SOC2_TypeII_Audit_Report.PDF',
    fileType: 'PDF',
    fileSizeLabel: '5.1 MB',
    uploadedBy: 'NovaSec Systems Pvt Ltd',
    uploadedByRole: 'Vendor',
    uploadedAt: '2026-08-02T16:20:00Z',
    relatedEntityType: 'Contract',
    relatedEntityNumber: 'CT-2026-0004',
    description: 'Independent SOC 2 Type II compliance audit attestation.',
  },
  {
    fileId: 'FILE-005',
    fileName: 'WarehouseC_Civil_BoQ_Estimate.Excel',
    fileType: 'Excel',
    fileSizeLabel: '890 KB',
    uploadedBy: 'Infra Build & Civil Co.',
    uploadedByRole: 'Vendor',
    uploadedAt: '2026-07-21T11:00:00Z',
    relatedEntityType: 'Discussion',
    relatedEntityNumber: 'DISC-2026-003',
    description: 'Bill of Quantities for foundation repair.',
  },
  {
    fileId: 'FILE-006',
    fileName: 'Forklift_EquipMax_Warranty_Certificate.PDF',
    fileType: 'PDF',
    fileSizeLabel: '1.1 MB',
    uploadedBy: 'EquipMax Machinery Ltd',
    uploadedByRole: 'Vendor',
    uploadedAt: '2026-07-15T09:00:00Z',
    relatedEntityType: 'Purchase Order',
    relatedEntityNumber: 'PO-2026-0040',
    description: 'Official 24-month warranty certificate.',
  },
  {
    fileId: 'FILE-007',
    fileName: 'Zenith_Annual_Supply_SLA_Signed.PDF',
    fileType: 'PDF',
    fileSizeLabel: '3.2 MB',
    uploadedBy: 'Rohan Verma',
    uploadedByRole: 'Procurement Manager',
    uploadedAt: '2026-08-01T10:00:00Z',
    relatedEntityType: 'Contract',
    relatedEntityNumber: 'CT-2026-0003',
    description: 'Executed SLA agreement for office supplies.',
  },
  {
    fileId: 'FILE-008',
    fileName: 'SafeGuard_Safety_Audit_Checklist.Word',
    fileType: 'Word',
    fileSizeLabel: '670 KB',
    uploadedBy: 'SafeGuard Industries',
    uploadedByRole: 'Vendor',
    uploadedAt: '2026-07-31T15:30:00Z',
    relatedEntityType: 'Procurement Request',
    relatedEntityNumber: 'PR-2026-0007',
    description: 'Draft safety audit checklist.',
  },
  {
    fileId: 'FILE-009',
    fileName: 'PrintMaster_TradeFair_Banner_Proof.Image',
    fileType: 'Image',
    fileSizeLabel: '14.5 MB',
    uploadedBy: 'PrintMaster Communications',
    uploadedByRole: 'Vendor',
    uploadedAt: '2026-07-28T17:10:00Z',
    relatedEntityType: 'Purchase Order',
    relatedEntityNumber: 'PO-2026-0037',
    description: 'High resolution artwork proof.',
  },
  {
    fileId: 'FILE-010',
    fileName: 'VendorIQ_Security_Guidelines_2026.ZIP',
    fileType: 'ZIP',
    fileSizeLabel: '18.2 MB',
    uploadedBy: 'Hrithik',
    uploadedByRole: 'Administrator',
    uploadedAt: '2026-07-25T14:00:00Z',
    relatedEntityType: 'Vendor',
    relatedEntityNumber: 'VND-001',
    description: 'Archive of IT security compliance policies for vendors.',
  },
  {
    fileId: 'FILE-011',
    fileName: 'GST_Compliance_Return_Q2_2026.PDF',
    fileType: 'PDF',
    fileSizeLabel: '950 KB',
    uploadedBy: 'TechCorp Solutions Pvt Ltd',
    uploadedByRole: 'Vendor',
    uploadedAt: '2026-07-20T10:00:00Z',
    relatedEntityType: 'Vendor',
    relatedEntityNumber: 'VND-001',
    description: 'Filed GST return acknowledgment.',
  },
  {
    fileId: 'FILE-012',
    fileName: 'Site_Inspection_Photos_WarehouseC.ZIP',
    fileType: 'ZIP',
    fileSizeLabel: '22.0 MB',
    uploadedBy: 'Infra Build & Civil Co.',
    uploadedByRole: 'Vendor',
    uploadedAt: '2026-07-18T16:00:00Z',
    relatedEntityType: 'Procurement Request',
    relatedEntityNumber: 'PR-2026-0003',
    description: 'Photographic evidence of floor cracks.',
  },
];

const SEED_ACTIVITY_LOGS: ActivityLog[] = [
  {
    logId: 'LOG-1001',
    userId: 'USR-001',
    userName: 'Hrithik',
    userRole: 'Administrator',
    action: 'Message Sent',
    timestamp: '2026-08-05T10:00:00Z',
    moduleName: 'Messages',
    relatedEntityType: 'Purchase Order',
    relatedEntityNumber: 'PO-2026-0042',
    ipAddress: '192.168.1.15',
  },
  {
    logId: 'LOG-1002',
    userId: 'VND-001',
    userName: 'TechCorp Solutions Pvt Ltd',
    userRole: 'Vendor',
    action: 'File Uploaded',
    timestamp: '2026-08-05T10:30:00Z',
    moduleName: 'File Sharing',
    relatedEntityType: 'Purchase Order',
    relatedEntityNumber: 'PO-2026-0042',
    ipAddress: '192.168.4.88',
  },
  {
    logId: 'LOG-1003',
    userId: 'USR-001',
    userName: 'Hrithik',
    userRole: 'Administrator',
    action: 'Message Viewed',
    timestamp: '2026-08-05T11:00:00Z',
    moduleName: 'Messages',
    relatedEntityType: 'Purchase Order',
    relatedEntityNumber: 'PO-2026-0042',
    ipAddress: '192.168.1.15',
  },
  {
    logId: 'LOG-1004',
    userId: 'USR-002',
    userName: 'Rohan Verma',
    userRole: 'Procurement Manager',
    action: 'Discussion Created',
    timestamp: '2026-08-03T10:00:00Z',
    moduleName: 'Discussions',
    relatedEntityType: 'Purchase Order',
    relatedEntityNumber: 'PO-2026-0041',
    ipAddress: '192.168.1.22',
  },
  {
    logId: 'LOG-1005',
    userId: 'VND-002',
    userName: 'Global Logistics & Freight',
    userRole: 'Vendor',
    action: 'Discussion Reply',
    timestamp: '2026-08-03T11:30:00Z',
    moduleName: 'Discussions',
    relatedEntityType: 'Purchase Order',
    relatedEntityNumber: 'PO-2026-0041',
    ipAddress: '192.168.3.40',
  },
  {
    logId: 'LOG-1006',
    userId: 'USR-003',
    userName: 'Lata Nair',
    userRole: 'Finance Officer',
    action: 'Document Accessed',
    timestamp: '2026-08-03T09:45:00Z',
    moduleName: 'File Sharing',
    relatedEntityType: 'Invoice',
    relatedEntityNumber: 'TX-2026-891',
    ipAddress: '192.168.1.18',
  },
  {
    logId: 'LOG-1007',
    userId: 'VND-009',
    userName: 'NovaSec Systems Pvt Ltd',
    userRole: 'Vendor',
    action: 'File Uploaded',
    timestamp: '2026-08-02T16:20:00Z',
    moduleName: 'File Sharing',
    relatedEntityType: 'Contract',
    relatedEntityNumber: 'CT-2026-0004',
    ipAddress: '192.168.5.12',
  },
  {
    logId: 'LOG-1008',
    userId: 'USR-002',
    userName: 'Rohan Verma',
    userRole: 'Procurement Manager',
    action: 'File Downloaded',
    timestamp: '2026-08-01T10:05:00Z',
    moduleName: 'File Sharing',
    relatedEntityType: 'Contract',
    relatedEntityNumber: 'CT-2026-0003',
    ipAddress: '192.168.1.22',
  },
];

// Populate additional mock log entries to reach 30+ logs
for (let i = 9; i <= 35; i++) {
  const users = [
    { id: 'USR-001', name: 'Hrithik', role: 'Administrator' },
    { id: 'USR-002', name: 'Rohan Verma', role: 'Procurement Manager' },
    { id: 'USR-003', name: 'Lata Nair', role: 'Finance Officer' },
    { id: 'VND-001', name: 'TechCorp Solutions Pvt Ltd', role: 'Vendor' },
    { id: 'VND-002', name: 'Global Logistics & Freight', role: 'Vendor' },
  ];
  const actions: ActivityLog['action'][] = [
    'Message Sent',
    'Message Viewed',
    'Discussion Reply',
    'File Uploaded',
    'File Downloaded',
    'Document Accessed',
  ];
  const u = users[i % users.length];
  SEED_ACTIVITY_LOGS.push({
    logId: `LOG-${1000 + i}`,
    userId: u.id,
    userName: u.name,
    userRole: u.role,
    action: actions[i % actions.length],
    timestamp: new Date(Date.now() - i * 3600000 * 5).toISOString(),
    moduleName: i % 2 === 0 ? 'Messages' : 'Discussions',
    relatedEntityType: i % 3 === 0 ? 'Purchase Order' : i % 3 === 1 ? 'Contract' : 'Vendor',
    relatedEntityNumber: i % 3 === 0 ? 'PO-2026-0042' : i % 3 === 1 ? 'CT-2026-0001' : 'VND-001',
    ipAddress: `192.168.${i % 5}.${10 + (i % 80)}`,
  });
}

const SEED_COMM_NOTIFICATIONS: CommNotification[] = [
  {
    notificationId: 'CNOT-001',
    type: 'New Message',
    summary: 'TechCorp Solutions Pvt Ltd replied regarding PO-2026-0042.',
    fromUser: 'TechCorp Solutions Pvt Ltd',
    relatedEntityNumber: 'PO-2026-0042',
    createdAt: '2026-08-05T14:30:00Z',
    read: false,
  },
  {
    notificationId: 'CNOT-002',
    type: 'Discussion Reply',
    summary: 'Global Logistics posted a delivery update on PO-2026-0041.',
    fromUser: 'Global Logistics & Freight',
    relatedEntityNumber: 'PO-2026-0041',
    createdAt: '2026-08-03T11:30:00Z',
    read: false,
  },
  {
    notificationId: 'CNOT-003',
    type: 'File Shared',
    summary: 'NovaSec Systems uploaded SOC 2 Type II report for CT-2026-0004.',
    fromUser: 'NovaSec Systems Pvt Ltd',
    relatedEntityNumber: 'CT-2026-0004',
    createdAt: '2026-08-02T16:20:00Z',
    read: true,
  },
  {
    notificationId: 'CNOT-004',
    type: 'Pending Discussion',
    summary: 'ISO 45001 Compliance Audit readiness discussion requires your input.',
    fromUser: 'Rohan Verma',
    relatedEntityNumber: 'PR-2026-0007',
    createdAt: '2026-07-15T11:00:00Z',
    read: false,
  },
];

// ─── Mutable State Stores ───────────────────────────────────────────────────

let CONVERSATIONS: Conversation[] = [...SEED_CONVERSATIONS];
let MESSAGES: Message[] = [...SEED_MESSAGES];
let DISCUSSIONS: Discussion[] = [...SEED_DISCUSSIONS];
let SHARED_FILES: SharedFile[] = [...SEED_FILES];
let ACTIVITY_LOGS: ActivityLog[] = [...SEED_ACTIVITY_LOGS];
let COMM_NOTIFICATIONS: CommNotification[] = [...SEED_COMM_NOTIFICATIONS];

let nextMsgId = 500;
let nextDiscMsgId = 500;
let nextLogId = 2000;
let nextNotifId = 100;
let nextFileId = 100;

// ─── CommunicationService Implementation ────────────────────────────────────

class CommunicationService {
  // ── Helper Logging & Simulation Engine ──────────────────────────────────────

  private logActivity(
    userId: string,
    userName: string,
    userRole: string,
    action: ActivityLog['action'],
    moduleName: string,
    relatedEntityType: CommEntityType | null,
    relatedEntityNumber: string | null
  ) {
    const entry: ActivityLog = {
      logId: `LOG-${nextLogId++}`,
      userId,
      userName,
      userRole,
      action,
      timestamp: new Date().toISOString(),
      moduleName,
      relatedEntityType,
      relatedEntityNumber,
      ipAddress: `192.168.1.${Math.floor(10 + Math.random() * 80)}`,
    };
    ACTIVITY_LOGS.unshift(entry);
  }

  private generateNotification(
    type: CommNotification['type'],
    summary: string,
    fromUser: string,
    relatedEntityNumber: string | null
  ) {
    const notif: CommNotification = {
      notificationId: `CNOT-${nextNotifId++}`,
      type,
      summary,
      fromUser,
      relatedEntityNumber,
      createdAt: new Date().toISOString(),
      read: false,
    };
    COMM_NOTIFICATIONS.unshift(notif);
  }

  // ── Conversations & Messages ────────────────────────────────────────────────

  getConversations(filters: ConversationFilters = {}): Observable<Conversation[]> {
    let items = [...CONVERSATIONS];
    if (filters.vendorOnly) {
      items = items.filter((c) => c.vendorConversation);
    }
    if (filters.relatedEntityType) {
      items = items.filter((c) => c.relatedEntityType === filters.relatedEntityType);
    }
    if (filters.relatedEntityNumber) {
      items = items.filter((c) => c.relatedEntityNumber === filters.relatedEntityNumber);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (c) =>
          c.subject.toLowerCase().includes(q) ||
          c.lastMessagePreview.toLowerCase().includes(q) ||
          c.participants.some((p) => p.userName.toLowerCase().includes(q))
      );
    }
    return delay(items);
  }

  getMessages(conversationId: string, currentUserId = 'USR-001'): Observable<Message[]> {
    const msgs = MESSAGES.filter((m) => m.conversationId === conversationId);
    const conv = CONVERSATIONS.find((c) => c.conversationId === conversationId);

    // Auto-log message viewing
    if (conv) {
      this.logActivity(
        currentUserId,
        'Hrithik',
        'Administrator',
        'Message Viewed',
        'Messages',
        conv.relatedEntityType,
        conv.relatedEntityNumber
      );
    }

    return delay(msgs);
  }

  sendMessage(
    conversationId: string,
    senderId: string,
    senderName: string,
    senderRole: string,
    content: string,
    attachmentIds: string[] = []
  ): Observable<Message> {
    const conv = CONVERSATIONS.find((c) => c.conversationId === conversationId);
    const receiver = conv?.participants.find((p) => p.userId !== senderId) || {
      userId: 'VND-001',
      userName: 'TechCorp Solutions Pvt Ltd',
      userRole: 'Vendor',
    };

    const newMsg: Message = {
      messageId: `MSG-${nextMsgId++}`,
      conversationId,
      senderId,
      senderName,
      senderRole,
      receiverId: receiver.userId,
      receiverName: receiver.userName,
      receiverRole: receiver.userRole,
      content,
      timestamp: new Date().toISOString(),
      readStatus: false,
      relatedEntityType: conv?.relatedEntityType || null,
      relatedEntityNumber: conv?.relatedEntityNumber || null,
      attachmentIds,
    };

    MESSAGES.push(newMsg);

    // Update conversation preview
    if (conv) {
      conv.lastMessagePreview = content;
      conv.lastMessageTime = newMsg.timestamp;
      conv.unreadCount += 1;
    }

    // Auto-log activity & notification
    this.logActivity(
      senderId,
      senderName,
      senderRole,
      'Message Sent',
      'Messages',
      conv?.relatedEntityType || null,
      conv?.relatedEntityNumber || null
    );

    this.generateNotification(
      'New Message',
      `${senderName} sent a new message regarding ${conv?.relatedEntityNumber || conv?.subject}.`,
      senderName,
      conv?.relatedEntityNumber || null
    );

    // Simulate Vendor Auto-Reply after 7 seconds if sender is an internal user and vendor is present
    if (senderRole !== 'Vendor' && conv?.vendorConversation) {
      setTimeout(() => {
        const vendorParticipant = conv.participants.find((p) => p.userRole === 'Vendor') || {
          userId: 'VND-001',
          userName: receiver.userName,
          userRole: 'Vendor',
        };

        const autoReply: Message = {
          messageId: `MSG-${nextMsgId++}`,
          conversationId,
          senderId: vendorParticipant.userId,
          senderName: vendorParticipant.userName,
          senderRole: 'Vendor',
          receiverId: senderId,
          receiverName: senderName,
          receiverRole: senderRole,
          content: `Acknowledged! Thank you for the update regarding ${conv.relatedEntityNumber || 'this matter'}. Our team is reviewing this item.`,
          timestamp: new Date().toISOString(),
          readStatus: false,
          relatedEntityType: conv.relatedEntityType,
          relatedEntityNumber: conv.relatedEntityNumber,
          attachmentIds: [],
        };

        MESSAGES.push(autoReply);
        conv.lastMessagePreview = autoReply.content;
        conv.lastMessageTime = autoReply.timestamp;
        conv.unreadCount += 1;

        this.generateNotification(
          'New Message',
          `${vendorParticipant.userName} replied to your message about ${conv.relatedEntityNumber || conv.subject}.`,
          vendorParticipant.userName,
          conv.relatedEntityNumber
        );
      }, 7000);
    }

    return delay(newMsg);
  }

  markConversationRead(conversationId: string): Observable<boolean> {
    const conv = CONVERSATIONS.find((c) => c.conversationId === conversationId);
    if (conv) {
      conv.unreadCount = 0;
    }
    MESSAGES.filter((m) => m.conversationId === conversationId).forEach(
      (m) => (m.readStatus = true)
    );
    return of(true);
  }

  startConversation(
    subject: string,
    relatedEntityType: CommEntityType | null,
    relatedEntityNumber: string | null,
    participants: { userId: string; userName: string; userRole: string }[],
    initialMessage: string
  ): Observable<Conversation> {
    const convId = `CONV-2026-${String(CONVERSATIONS.length + 1).padStart(3, '0')}`;
    const newConv: Conversation = {
      conversationId: convId,
      participants,
      subject,
      relatedEntityType,
      relatedEntityNumber,
      lastMessagePreview: initialMessage,
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
      vendorConversation: participants.some((p) => p.userRole === 'Vendor'),
    };
    CONVERSATIONS.unshift(newConv);

    const firstMsg: Message = {
      messageId: `MSG-${nextMsgId++}`,
      conversationId: convId,
      senderId: participants[0].userId,
      senderName: participants[0].userName,
      senderRole: participants[0].userRole,
      receiverId: participants[1]?.userId || 'VND-001',
      receiverName: participants[1]?.userName || 'TechCorp',
      receiverRole: participants[1]?.userRole || 'Vendor',
      content: initialMessage,
      timestamp: new Date().toISOString(),
      readStatus: true,
      relatedEntityType,
      relatedEntityNumber,
      attachmentIds: [],
    };
    MESSAGES.push(firstMsg);

    this.logActivity(
      participants[0].userId,
      participants[0].userName,
      participants[0].userRole,
      'Message Sent',
      'Messages',
      relatedEntityType,
      relatedEntityNumber
    );

    return delay(newConv);
  }

  // ── Discussions ─────────────────────────────────────────────────────────────

  getDiscussions(filters: DiscussionFilters = {}): Observable<Discussion[]> {
    let items = [...DISCUSSIONS];
    if (filters.status && filters.status !== 'All') {
      items = items.filter((d) => d.status === filters.status);
    }
    if (filters.relatedEntityType) {
      items = items.filter((d) => d.relatedEntityType === filters.relatedEntityType);
    }
    if (filters.relatedEntityNumber) {
      items = items.filter((d) => d.relatedEntityNumber === filters.relatedEntityNumber);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.createdBy.toLowerCase().includes(q) ||
          d.messages.some((m) => m.content.toLowerCase().includes(q))
      );
    }
    return delay(items);
  }

  getDiscussionById(id: string): Observable<Discussion | undefined> {
    return delay(DISCUSSIONS.find((d) => d.discussionId === id));
  }

  createDiscussion(
    title: string,
    createdBy: string,
    createdByRole: string,
    relatedEntityType: CommEntityType | null,
    relatedEntityNumber: string | null,
    participants: { userId: string; name: string; role: string }[],
    initialPostContent: string
  ): Observable<Discussion> {
    const discId = `DISC-2026-${String(DISCUSSIONS.length + 1).padStart(3, '0')}`;
    const newDisc: Discussion = {
      discussionId: discId,
      title,
      createdBy,
      createdByRole,
      createdAt: new Date().toISOString(),
      status: 'Open',
      relatedEntityType,
      relatedEntityNumber,
      participants,
      messages: [
        {
          messageId: `DMSG-${nextDiscMsgId++}`,
          senderName: createdBy,
          senderRole: createdByRole,
          content: initialPostContent,
          timestamp: new Date().toISOString(),
          attachmentIds: [],
        },
      ],
    };
    DISCUSSIONS.unshift(newDisc);

    this.logActivity(
      'USR-001',
      createdBy,
      createdByRole,
      'Discussion Created',
      'Discussions',
      relatedEntityType,
      relatedEntityNumber
    );

    this.generateNotification(
      'Pending Discussion',
      `New discussion created: "${title}" linked to ${relatedEntityNumber || 'platform'}.`,
      createdBy,
      relatedEntityNumber
    );

    return delay(newDisc);
  }

  replyToDiscussion(
    discussionId: string,
    senderName: string,
    senderRole: string,
    content: string,
    attachmentIds: string[] = []
  ): Observable<DiscussionMessage> {
    const disc = DISCUSSIONS.find((d) => d.discussionId === discussionId);
    const reply: DiscussionMessage = {
      messageId: `DMSG-${nextDiscMsgId++}`,
      senderName,
      senderRole,
      content,
      timestamp: new Date().toISOString(),
      attachmentIds,
    };

    if (disc) {
      disc.messages.push(reply);

      this.logActivity(
        'USR-001',
        senderName,
        senderRole,
        'Discussion Reply',
        'Discussions',
        disc.relatedEntityType,
        disc.relatedEntityNumber
      );

      this.generateNotification(
        'Discussion Reply',
        `${senderName} posted a reply on "${disc.title}".`,
        senderName,
        disc.relatedEntityNumber
      );
    }

    return delay(reply);
  }

  updateDiscussionStatus(
    discussionId: string,
    status: Discussion['status']
  ): Observable<boolean> {
    const disc = DISCUSSIONS.find((d) => d.discussionId === discussionId);
    if (disc) {
      disc.status = status;
      return of(true);
    }
    return of(false);
  }

  // ── Files ───────────────────────────────────────────────────────────────────

  getFiles(filters: FileFilters = {}): Observable<SharedFile[]> {
    let items = [...SHARED_FILES];
    if (filters.fileType && filters.fileType !== 'All') {
      items = items.filter((f) => f.fileType === filters.fileType);
    }
    if (filters.relatedEntityType) {
      items = items.filter((f) => f.relatedEntityType === filters.relatedEntityType);
    }
    if (filters.relatedEntityNumber) {
      items = items.filter((f) => f.relatedEntityNumber === filters.relatedEntityNumber);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (f) =>
          f.fileName.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.uploadedBy.toLowerCase().includes(q)
      );
    }
    return delay(items);
  }

  uploadFile(
    fileName: string,
    fileType: SharedFile['fileType'],
    fileSizeLabel: string,
    uploadedBy: string,
    uploadedByRole: string,
    relatedEntityType: CommEntityType,
    relatedEntityNumber: string,
    description: string
  ): Observable<SharedFile> {
    const fileId = `FILE-${String(nextFileId++).padStart(3, '0')}`;
    const newFile: SharedFile = {
      fileId,
      fileName,
      fileType,
      fileSizeLabel,
      uploadedBy,
      uploadedByRole,
      uploadedAt: new Date().toISOString(),
      relatedEntityType,
      relatedEntityNumber,
      description,
    };
    SHARED_FILES.unshift(newFile);

    this.logActivity(
      'USR-001',
      uploadedBy,
      uploadedByRole,
      'File Uploaded',
      'File Sharing',
      relatedEntityType,
      relatedEntityNumber
    );

    this.generateNotification(
      'File Shared',
      `${uploadedBy} uploaded document ${fileName} for ${relatedEntityNumber}.`,
      uploadedBy,
      relatedEntityNumber
    );

    return delay(newFile);
  }

  deleteFile(fileId: string, currentUserId = 'USR-001', userName = 'Hrithik', userRole = 'Administrator'): Observable<boolean> {
    const file = SHARED_FILES.find((f) => f.fileId === fileId);
    if (file) {
      SHARED_FILES = SHARED_FILES.filter((f) => f.fileId !== fileId);
      this.logActivity(
        currentUserId,
        userName,
        userRole,
        'Document Accessed',
        'File Sharing',
        file.relatedEntityType,
        file.relatedEntityNumber
      );
      return delay(true);
    }
    return delay(false);
  }

  downloadFile(fileId: string, currentUserId = 'USR-001', userName = 'Hrithik', userRole = 'Administrator'): Observable<boolean> {
    const file = SHARED_FILES.find((f) => f.fileId === fileId);
    if (file) {
      this.logActivity(
        currentUserId,
        userName,
        userRole,
        'File Downloaded',
        'File Sharing',
        file.relatedEntityType,
        file.relatedEntityNumber
      );
      return delay(true);
    }
    return delay(false);
  }

  getCommunicationHistory(entityRef: string): Observable<{
    messages: Message[];
    discussions: Discussion[];
    files: SharedFile[];
  }> {
    const q = entityRef.trim().toLowerCase();
    const msgs = MESSAGES.filter(
      (m) =>
        (m.relatedEntityNumber && m.relatedEntityNumber.toLowerCase() === q) ||
        m.senderName.toLowerCase().includes(q) ||
        m.receiverName.toLowerCase().includes(q) ||
        m.conversationId.toLowerCase() === q
    );
    const discs = DISCUSSIONS.filter(
      (d) =>
        (d.relatedEntityNumber && d.relatedEntityNumber.toLowerCase() === q) ||
        d.createdBy.toLowerCase().includes(q) ||
        d.participants.some((p) => p.name.toLowerCase().includes(q))
    );
    const files = SHARED_FILES.filter(
      (f) =>
        (f.relatedEntityNumber && f.relatedEntityNumber.toLowerCase() === q) ||
        f.uploadedBy.toLowerCase().includes(q)
    );

    // Log document access
    this.logActivity(
      'USR-001',
      'Hrithik',
      'Administrator',
      'Document Accessed',
      'Communication History',
      null,
      entityRef
    );

    return delay({ messages: msgs, discussions: discs, files });
  }

  getAllLookupVendors(): Observable<Array<{ id: string; name: string }>> {
    const vendorMap = new Map<string, string>();
    CONVERSATIONS.forEach((c) => {
      c.participants.forEach((p) => {
        if (p.userRole === 'Vendor') {
          vendorMap.set(p.userId, p.userName);
        }
      });
    });
    SHARED_FILES.forEach((f) => {
      if (f.uploadedByRole === 'Vendor') {
        vendorMap.set(f.uploadedBy, f.uploadedBy);
      }
    });
    DISCUSSIONS.forEach((d) => {
      d.participants.forEach((p) => {
        if (p.role === 'Vendor') {
          vendorMap.set(p.name, p.name);
        }
      });
    });
    const list = Array.from(vendorMap.entries()).map(([id, name]) => ({ id, name }));
    return of(list);
  }

  getAllLookupRecords(): Observable<Array<{ number: string; type: CommEntityType }>> {
    const recordMap = new Map<string, CommEntityType>();
    CONVERSATIONS.forEach((c) => {
      if (c.relatedEntityNumber && c.relatedEntityType) {
        recordMap.set(c.relatedEntityNumber, c.relatedEntityType);
      }
    });
    DISCUSSIONS.forEach((d) => {
      if (d.relatedEntityNumber && d.relatedEntityType) {
        recordMap.set(d.relatedEntityNumber, d.relatedEntityType);
      }
    });
    SHARED_FILES.forEach((f) => {
      if (f.relatedEntityNumber && f.relatedEntityType) {
        recordMap.set(f.relatedEntityNumber, f.relatedEntityType);
      }
    });
    const list = Array.from(recordMap.entries()).map(([number, type]) => ({ number, type }));
    return of(list);
  }

  // ── Activity Logs ────────────────────────────────────────────────────────────

  getActivityLogs(filters: ActivityLogFilters = {}): Observable<PaginatedActivityLogs> {
    let items = [...ACTIVITY_LOGS];
    if (filters.action && filters.action !== 'All') {
      items = items.filter((l) => l.action === filters.action);
    }
    if (filters.moduleName) {
      items = items.filter((l) => l.moduleName === filters.moduleName);
    }
    if (filters.userId) {
      items = items.filter((l) => l.userId === filters.userId);
    }

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 15;
    const total = items.length;
    const paginated = items.slice((page - 1) * pageSize, page * pageSize);

    return delay({ items: paginated, total, page, pageSize });
  }

  // ── Notifications ────────────────────────────────────────────────────────────

  getNotifications(): Observable<CommNotification[]> {
    return delay([...COMM_NOTIFICATIONS]);
  }

  getUnreadNotificationCount(): Observable<number> {
    return of(COMM_NOTIFICATIONS.filter((n) => !n.read).length);
  }

  markNotificationRead(id: string): Observable<boolean> {
    const n = COMM_NOTIFICATIONS.find((not) => not.notificationId === id);
    if (n) {
      n.read = true;
      return of(true);
    }
    return of(false);
  }
}

export const communicationService = new CommunicationService();
