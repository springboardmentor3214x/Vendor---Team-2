/**
 * NotificationService — Module 9: Notification Module
 * =====================================================
 * Fully in-memory mock service using a BehaviorSubject-style pattern.
 * Seeds 40–50 realistic procurement notifications spread across the last 90 days.
 * Role-aware: filters notifications by the logged-in user's role via ROLE_NOTIFICATION_ACL.
 *
 * All public methods return Observable<T> shaped exactly like future REST responses.
 * To connect to the real backend, replace each method body with an HTTP call —
 * method signatures and return types remain 100% identical.
 */

import type {
  AppNotification,
  NotificationType,
  NotificationPriority,
  NotificationFilters,
  UserRole,
  RelatedModule,
  NotificationSettings,
  ToastEvent,
} from '../models/notification';
import { ROLE_NOTIFICATION_ACL, defaultNotificationSettings } from '../models/notification';

// ─── Lightweight Observable (same pattern as contractService / reliabilityService) ─

class Observable<T> {
  constructor(
    private subscribeFn: (subscriber: { next: (val: T) => void }) => void
  ) {}

  subscribe(next: (val: T) => void): { unsubscribe: () => void } {
    let unsubscribed = false;
    this.subscribeFn({
      next: (val: T) => { if (!unsubscribed) next(val); }
    });
    return { unsubscribe: () => { unsubscribed = true; } };
  }

  toPromise(): Promise<T> {
    return new Promise((resolve) => this.subscribe((val) => resolve(val)));
  }
}

// BehaviorSubject-style class that holds a current value and
// notifies all subscribers whenever the value changes.
class BehaviorSubject<T> {
  private _value: T;
  private _subscribers: Array<(val: T) => void> = [];

  constructor(initialValue: T) {
    this._value = initialValue;
  }

  get value(): T {
    return this._value;
  }

  next(value: T): void {
    this._value = value;
    this._subscribers.forEach(fn => fn(value));
  }

  asObservable(): Observable<T> {
    return new Observable<T>((subscriber) => {
      // Immediately emit current value (BehaviorSubject behaviour)
      subscriber.next(this._value);
      this._subscribers.push(subscriber.next);
    });
  }

  subscribe(next: (val: T) => void): { unsubscribe: () => void } {
    next(this._value);
    this._subscribers.push(next);
    return {
      unsubscribe: () => {
        this._subscribers = this._subscribers.filter(fn => fn !== next);
      }
    };
  }
}

function of<T>(value: T): Observable<T> {
  return new Observable<T>((subscriber) => subscriber.next(value));
}

// ─── Date Utilities ───────────────────────────────────────────────────────────

const NOW = new Date();

function daysAgoISO(days: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function hoursAgoISO(hours: number): string {
  const d = new Date(NOW);
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

// ─── ID Generator ────────────────────────────────────────────────────────────

let _nextId = 1;
function genId(): string {
  return `NOTIF-${String(_nextId++).padStart(4, '0')}`;
}

// ─── Seed Dataset — 45 realistic notifications across last 90 days ─────────────

function makeSeed(): AppNotification[] {
  const seed: AppNotification[] = [

    // ── VENDOR APPROVAL / REJECTION ────────────────────────────────────────
    {
      notificationId: genId(),
      userId: 'vendor-001',
      notificationType: 'VENDOR_APPROVAL',
      title: 'Vendor Registration Approved',
      description: 'Your vendor profile for TechCorp Solutions Pvt Ltd has been reviewed and approved by the Administrator. You may now participate in procurement bids.',
      relatedModule: 'Vendor Management',
      relatedRecordId: 'VND-001',
      timestamp: hoursAgoISO(2),
      priority: 'HIGH',
      deliveryMethod: ['IN_APP', 'EMAIL'],
      readStatus: false,
    },
    {
      notificationId: genId(),
      userId: 'vendor-002',
      notificationType: 'VENDOR_APPROVAL',
      title: 'Global Logistics & Freight — Profile Approved',
      description: 'Vendor profile verification complete. All GST, PAN, and compliance documents have been validated. Welcome to the VendorIQ network.',
      relatedModule: 'Vendor Management',
      relatedRecordId: 'VND-002',
      timestamp: daysAgoISO(1),
      priority: 'HIGH',
      deliveryMethod: ['IN_APP', 'EMAIL', 'SMS'],
      readStatus: false,
    },
    {
      notificationId: genId(),
      userId: 'vendor-003',
      notificationType: 'VENDOR_REJECTION',
      title: 'Vendor Registration Rejected',
      description: 'Your vendor application for EquipMax Machinery Ltd has been rejected due to incomplete ISO 9001 certification. Please resubmit with valid documentation.',
      relatedModule: 'Vendor Management',
      relatedRecordId: 'VND-005',
      timestamp: daysAgoISO(3),
      priority: 'HIGH',
      deliveryMethod: ['IN_APP', 'EMAIL'],
      readStatus: false,
    },
    {
      notificationId: genId(),
      userId: 'admin-001',
      notificationType: 'VENDOR_APPROVAL',
      title: 'New Vendor Pending Approval',
      description: 'PrintMaster Communications has submitted a vendor registration request. Compliance documents are attached and ready for review.',
      relatedModule: 'Vendor Management',
      relatedRecordId: 'VND-012',
      timestamp: daysAgoISO(2),
      priority: 'MEDIUM',
      deliveryMethod: ['IN_APP'],
      readStatus: true,
    },

    // ── PROCUREMENT ALERTS ─────────────────────────────────────────────────
    {
      notificationId: genId(),
      userId: 'proc-001',
      notificationType: 'PROCUREMENT_ALERT',
      title: 'Urgent Procurement Request — Critical IT Infrastructure',
      description: 'PR-2026-0041: Network switch replacement for Data Center Node B. Budget ₹18,50,000. Required delivery: 5 business days. Escalated to CRITICAL priority.',
      relatedModule: 'Procurement',
      relatedRecordId: 'PR-2026-0041',
      timestamp: hoursAgoISO(1),
      priority: 'HIGH',
      deliveryMethod: ['IN_APP', 'EMAIL', 'SMS'],
      readStatus: false,
    },
    {
      notificationId: genId(),
      userId: 'proc-001',
      notificationType: 'PROCUREMENT_ALERT',
      title: 'Budget Threshold Exceeded — Q3 IT Procurement',
      description: 'IT Services category has reached 94% of the allocated Q3 budget (₹42,00,000 of ₹45,00,000). Further spend requires CFO approval for overrun.',
      relatedModule: 'Procurement',
      relatedRecordId: 'BUDGET-Q3-IT',
      timestamp: daysAgoISO(1),
      priority: 'HIGH',
      deliveryMethod: ['IN_APP', 'EMAIL'],
      readStatus: false,
    },
    {
      notificationId: genId(),
      userId: 'proc-001',
      notificationType: 'PROCUREMENT_ALERT',
      title: 'SLA Breach Risk — Logistics PO Overdue',
      description: 'PO-2026-0018 (Global Logistics & Freight) is 3 days past the expected delivery date. SLA penalty clause may be triggered if not resolved within 48 hours.',
      relatedModule: 'Procurement',
      relatedRecordId: 'PO-2026-0018',
      timestamp: daysAgoISO(4),
      priority: 'HIGH',
      deliveryMethod: ['IN_APP', 'EMAIL'],
      readStatus: true,
    },
    {
      notificationId: genId(),
      userId: 'proc-001',
      notificationType: 'PROCUREMENT_ALERT',
      title: 'Vendor Quote Variance Alert',
      description: 'For PR-2026-0039 (Office Furniture), vendor quotes show a 32% price variance between Zenith Office Supplies (₹3.2L) and competing vendor (₹2.2L). Review recommended.',
      relatedModule: 'Procurement',
      relatedRecordId: 'PR-2026-0039',
      timestamp: daysAgoISO(5),
      priority: 'MEDIUM',
      deliveryMethod: ['IN_APP'],
      readStatus: true,
    },

    // ── PROCUREMENT REQUESTS ─────────────────────────────────────────────
    {
      notificationId: genId(),
      userId: 'proc-001',
      notificationType: 'PROCUREMENT_REQUEST',
      title: 'New Procurement Request Submitted — Safety Equipment',
      description: 'PR-2026-0042: Site safety equipment (helmets, harnesses, fire extinguishers) for Factory Unit 3. Raised by Facilities team. Estimated budget: ₹4,20,000.',
      relatedModule: 'Procurement',
      relatedRecordId: 'PR-2026-0042',
      timestamp: hoursAgoISO(4),
      priority: 'MEDIUM',
      deliveryMethod: ['IN_APP', 'EMAIL'],
      readStatus: false,
    },
    {
      notificationId: genId(),
      userId: 'proc-001',
      notificationType: 'PROCUREMENT_REQUEST',
      title: 'Procurement Request Requires Your Approval',
      description: 'PR-2026-0040: Cloud server capacity upgrade for the analytics platform. Requested by the Supply Chain team. Budget: ₹22,00,000. Waiting for Procurement Manager sign-off.',
      relatedModule: 'Procurement',
      relatedRecordId: 'PR-2026-0040',
      timestamp: daysAgoISO(2),
      priority: 'HIGH',
      deliveryMethod: ['IN_APP', 'EMAIL', 'SMS'],
      readStatus: false,
    },
    {
      notificationId: genId(),
      userId: 'admin-001',
      notificationType: 'PROCUREMENT_REQUEST',
      title: 'High-Value Procurement Request Escalated',
      description: 'PR-2026-0037: ERP system upgrade (₹85,00,000) has been escalated for executive approval. Submitted by Procurement Manager. SoP requires Administrator sign-off above ₹50L.',
      relatedModule: 'Procurement',
      relatedRecordId: 'PR-2026-0037',
      timestamp: daysAgoISO(6),
      priority: 'HIGH',
      deliveryMethod: ['IN_APP', 'EMAIL'],
      readStatus: true,
    },

    // ── PO CREATED ────────────────────────────────────────────────────────
    {
      notificationId: genId(),
      userId: 'vendor-001',
      notificationType: 'PO_CREATED',
      title: 'New Purchase Order Received — PO-2026-0031',
      description: 'Purchase Order PO-2026-0031 has been issued to TechCorp Solutions for IT Hardware Supply (24 units). Order value: ₹12,48,000. Please confirm acceptance within 48 hours.',
      relatedModule: 'Procurement',
      relatedRecordId: 'PO-2026-0031',
      timestamp: hoursAgoISO(6),
      priority: 'HIGH',
      deliveryMethod: ['IN_APP', 'EMAIL', 'SMS'],
      readStatus: false,
    },
    {
      notificationId: genId(),
      userId: 'proc-001',
      notificationType: 'PO_CREATED',
      title: 'Purchase Order PO-2026-0030 Issued',
      description: 'PO-2026-0030 issued to Global Logistics & Freight for Cold Chain Transport — 15 shipments over 3 months. Total value: ₹6,30,000. Status: Awaiting vendor acknowledgment.',
      relatedModule: 'Procurement',
      relatedRecordId: 'PO-2026-0030',
      timestamp: daysAgoISO(1),
      priority: 'MEDIUM',
      deliveryMethod: ['IN_APP'],
      readStatus: true,
    },
    {
      notificationId: genId(),
      userId: 'finance-001',
      notificationType: 'PO_CREATED',
      title: 'New PO for Finance Review — PO-2026-0029',
      description: 'PO-2026-0029 (EquipMax Machinery — CNC Machine Servicing, ₹9,75,000) has been created and is ready for finance budget allocation and pre-approval.',
      relatedModule: 'Procurement',
      relatedRecordId: 'PO-2026-0029',
      timestamp: daysAgoISO(3),
      priority: 'MEDIUM',
      deliveryMethod: ['IN_APP', 'EMAIL'],
      readStatus: false,
    },
    {
      notificationId: genId(),
      userId: 'scm-001',
      notificationType: 'PO_CREATED',
      title: 'Purchase Order Dispatched — Track PO-2026-0028',
      description: 'PO-2026-0028 (Infra Build & Civil — Site Materials) has been issued. Expected delivery: 14 business days. Please coordinate with warehouse team for receipt.',
      relatedModule: 'Procurement',
      relatedRecordId: 'PO-2026-0028',
      timestamp: daysAgoISO(5),
      priority: 'LOW',
      deliveryMethod: ['IN_APP'],
      readStatus: true,
    },
    {
      notificationId: genId(),
      userId: 'vendor-002',
      notificationType: 'PO_CREATED',
      title: 'Purchase Order PO-2026-0027 — Confirm Delivery Schedule',
      description: 'PO-2026-0027 (Freight Services — 8 domestic routes) has been issued for ₹3,84,000. Please update delivery milestones in the portal within 24 hours.',
      relatedModule: 'Procurement',
      relatedRecordId: 'PO-2026-0027',
      timestamp: daysAgoISO(7),
      priority: 'MEDIUM',
      deliveryMethod: ['IN_APP', 'EMAIL'],
      readStatus: false,
    },

    // ── DELIVERY DELAYS ────────────────────────────────────────────────────
    {
      notificationId: genId(),
      userId: 'proc-001',
      notificationType: 'DELIVERY_DELAY',
      title: 'Delivery Delay Alert — PO-2026-0018 (5 Days)',
      description: 'Global Logistics & Freight has reported a 5-day delay on PO-2026-0018 (Cold Chain Shipment — Batch 7). New ETA: 19 Aug 2026. SLA penalty clause may apply.',
      relatedModule: 'Procurement',
      relatedRecordId: 'PO-2026-0018',
      timestamp: hoursAgoISO(8),
      priority: 'HIGH',
      deliveryMethod: ['IN_APP', 'EMAIL', 'SMS'],
      readStatus: false,
    },
    {
      notificationId: genId(),
      userId: 'scm-001',
      notificationType: 'DELIVERY_DELAY',
      title: 'Warehouse Receipt Delayed — PO-2026-0021',
      description: 'EquipMax Machinery reports manufacturing delay for CNC spare parts (PO-2026-0021). Revised delivery: 22 Aug 2026 (+8 days). Escalated to supply chain for rescheduling.',
      relatedModule: 'Procurement',
      relatedRecordId: 'PO-2026-0021',
      timestamp: daysAgoISO(2),
      priority: 'HIGH',
      deliveryMethod: ['IN_APP', 'EMAIL'],
      readStatus: false,
    },
    {
      notificationId: genId(),
      userId: 'vendor-002',
      notificationType: 'DELIVERY_DELAY',
      title: 'Your Delivery — PO-2026-0017 Flagged as Late',
      description: 'Delivery milestone for PO-2026-0017 (Batch 5 freight) was due 3 days ago. Please update expected delivery date and provide a root cause report to avoid SLA penalty.',
      relatedModule: 'Procurement',
      relatedRecordId: 'PO-2026-0017',
      timestamp: daysAgoISO(3),
      priority: 'HIGH',
      deliveryMethod: ['IN_APP', 'SMS'],
      readStatus: false,
    },
    {
      notificationId: genId(),
      userId: 'scm-001',
      notificationType: 'DELIVERY_DELAY',
      title: 'Partial Delivery Accepted — PO-2026-0022',
      description: 'Only 60% of ordered items (18/30 units) delivered for PO-2026-0022 (SafeGuard Industries — Safety Kits). Balance delivery rescheduled to 25 Aug 2026.',
      relatedModule: 'Procurement',
      relatedRecordId: 'PO-2026-0022',
      timestamp: daysAgoISO(8),
      priority: 'MEDIUM',
      deliveryMethod: ['IN_APP'],
      readStatus: true,
    },

    // ── CONTRACT EXPIRY ────────────────────────────────────────────────────
    {
      notificationId: genId(),
      userId: 'admin-001',
      notificationType: 'CONTRACT_EXPIRY',
      title: '⚠ Contract Expiring in 7 Days — CT-2026-0003',
      description: 'Office Supplies Annual Supply Contract with Zenith Office Supplies expires in 7 days (21 Aug 2026). Contract value: ₹6,50,000. Initiate renewal immediately.',
      relatedModule: 'Contracts & Compliance',
      relatedRecordId: 'CT-2026-0003',
      timestamp: hoursAgoISO(3),
      priority: 'HIGH',
      deliveryMethod: ['IN_APP', 'EMAIL', 'SMS'],
      readStatus: false,
    },
    {
      notificationId: genId(),
      userId: 'proc-001',
      notificationType: 'CONTRACT_EXPIRY',
      title: 'Contract Renewal Required — CT-2026-0002 (30 Days)',
      description: 'Cold Chain Logistics Framework Agreement with Global Logistics & Freight expires in 30 days (14 Sep 2026). Contract value: ₹21,00,000. Please initiate renewal process.',
      relatedModule: 'Contracts & Compliance',
      relatedRecordId: 'CT-2026-0002',
      timestamp: daysAgoISO(1),
      priority: 'HIGH',
      deliveryMethod: ['IN_APP', 'EMAIL'],
      readStatus: false,
    },
    {
      notificationId: genId(),
      userId: 'proc-001',
      notificationType: 'CONTRACT_EXPIRY',
      title: 'Contract Expiry Notice — CT-2026-0001 (90 Days)',
      description: 'Enterprise IT Support contract with TechCorp Solutions expires in 90 days (13 Nov 2026). Value: ₹48,00,000. Early renewal advised to avoid service disruption.',
      relatedModule: 'Contracts & Compliance',
      relatedRecordId: 'CT-2026-0001',
      timestamp: daysAgoISO(2),
      priority: 'MEDIUM',
      deliveryMethod: ['IN_APP'],
      readStatus: true,
    },
    {
      notificationId: genId(),
      userId: 'auditor-001',
      notificationType: 'CONTRACT_EXPIRY',
      title: 'Expired Contract Flagged for Audit — CT-2025-0018',
      description: 'Contract CT-2025-0018 (PrintMaster Communications — Printing Services) expired 15 days ago with no renewal initiated. Flagged for compliance audit review.',
      relatedModule: 'Contracts & Compliance',
      relatedRecordId: 'CT-2025-0018',
      timestamp: daysAgoISO(4),
      priority: 'HIGH',
      deliveryMethod: ['IN_APP', 'EMAIL'],
      readStatus: false,
    },
    {
      notificationId: genId(),
      userId: 'admin-001',
      notificationType: 'CONTRACT_EXPIRY',
      title: 'Contract Expiry Threshold — 1 Day Remaining',
      description: 'CRITICAL: BIS Product Certification (EquipMax Machinery) expires tomorrow. Procurement activity under this contract will be blocked if not renewed.',
      relatedModule: 'Contracts & Compliance',
      relatedRecordId: 'CERT-5',
      timestamp: hoursAgoISO(12),
      priority: 'HIGH',
      deliveryMethod: ['IN_APP', 'EMAIL', 'SMS'],
      readStatus: false,
    },

    // ── COMPLIANCE ALERTS ──────────────────────────────────────────────────
    {
      notificationId: genId(),
      userId: 'proc-001',
      notificationType: 'COMPLIANCE_ALERT',
      title: 'ISO 9001 Certification Expiring — TechCorp Solutions',
      description: 'TechCorp Solutions Pvt Ltd — ISO 9001 Quality Management certificate expires in 25 days. Renewal required to maintain compliance for active procurement contracts.',
      relatedModule: 'Contracts & Compliance',
      relatedRecordId: 'CERT-2',
      timestamp: daysAgoISO(1),
      priority: 'HIGH',
      deliveryMethod: ['IN_APP', 'EMAIL'],
      readStatus: false,
    },
    {
      notificationId: genId(),
      userId: 'auditor-001',
      notificationType: 'COMPLIANCE_ALERT',
      title: 'HACCP Certification Expired — Global Logistics',
      description: 'HACCP Food Safety Certification for Global Logistics & Freight expired 20 days ago. Cold chain shipments may be at regulatory risk. Immediate recertification required.',
      relatedModule: 'Contracts & Compliance',
      relatedRecordId: 'CERT-4',
      timestamp: daysAgoISO(3),
      priority: 'HIGH',
      deliveryMethod: ['IN_APP', 'EMAIL', 'SMS'],
      readStatus: false,
    },
    {
      notificationId: genId(),
      userId: 'proc-001',
      notificationType: 'COMPLIANCE_ALERT',
      title: 'Non-Compliance Flagged — EquipMax Machinery Safety Audit',
      description: 'EquipMax Machinery Ltd failed the safety regulation inspection for hydraulic press units. Corrective Action Plan (CAP) has been raised. PO creation blocked pending resolution.',
      relatedModule: 'Contracts & Compliance',
      relatedRecordId: 'COMPLY-6',
      timestamp: daysAgoISO(5),
      priority: 'HIGH',
      deliveryMethod: ['IN_APP', 'EMAIL'],
      readStatus: true,
    },
    {
      notificationId: genId(),
      userId: 'auditor-001',
      notificationType: 'COMPLIANCE_ALERT',
      title: 'OHSAS 18001 Expired — SafeGuard Industries',
      description: 'OHSAS 18001/ISO 45001 Safety certification for SafeGuard Industries expired 45 days ago. All safety-related procurement approvals suspended pending recertification.',
      relatedModule: 'Contracts & Compliance',
      relatedRecordId: 'CERT-6',
      timestamp: daysAgoISO(7),
      priority: 'HIGH',
      deliveryMethod: ['IN_APP', 'EMAIL'],
      readStatus: false,
    },
    {
      notificationId: genId(),
      userId: 'proc-001',
      notificationType: 'COMPLIANCE_ALERT',
      title: 'ISO 14001 Certification Expiring in 35 Days — Zenith',
      description: 'Zenith Office Supplies ISO 14001 Environmental Management certificate expires in 35 days. Renewal notice sent to vendor. Follow up required if certificate not submitted.',
      relatedModule: 'Contracts & Compliance',
      relatedRecordId: 'CERT-8',
      timestamp: daysAgoISO(10),
      priority: 'MEDIUM',
      deliveryMethod: ['IN_APP'],
      readStatus: true,
    },

    // ── INVOICE APPROVED ───────────────────────────────────────────────────
    {
      notificationId: genId(),
      userId: 'vendor-001',
      notificationType: 'INVOICE_APPROVED',
      title: 'Invoice Approved — INV-2026-0091 (₹12,48,000)',
      description: 'Invoice INV-2026-0091 for PO-2026-0031 (IT Hardware Supply) has been verified and approved by Finance. Payment of ₹12,48,000 scheduled for 28 Aug 2026 (Net 30).',
      relatedModule: 'Procurement',
      relatedRecordId: 'INV-2026-0091',
      timestamp: hoursAgoISO(5),
      priority: 'HIGH',
      deliveryMethod: ['IN_APP', 'EMAIL', 'SMS'],
      readStatus: false,
    },
    {
      notificationId: genId(),
      userId: 'finance-001',
      notificationType: 'INVOICE_APPROVED',
      title: 'Invoice Verified — INV-2026-0088 Ready for Payment',
      description: 'Invoice INV-2026-0088 (Global Logistics — Freight Batch 6, ₹3,84,000) has been verified. Awaiting final CFO sign-off for payment release. All documents in order.',
      relatedModule: 'Procurement',
      relatedRecordId: 'INV-2026-0088',
      timestamp: daysAgoISO(1),
      priority: 'MEDIUM',
      deliveryMethod: ['IN_APP', 'EMAIL'],
      readStatus: false,
    },
    {
      notificationId: genId(),
      userId: 'vendor-002',
      notificationType: 'INVOICE_APPROVED',
      title: 'Payment Disbursed — INV-2026-0081',
      description: 'Invoice INV-2026-0081 for ₹2,94,000 has been fully approved and payment has been disbursed to your registered bank account. Transaction reference: TXN-2026-48821.',
      relatedModule: 'Procurement',
      relatedRecordId: 'INV-2026-0081',
      timestamp: daysAgoISO(4),
      priority: 'MEDIUM',
      deliveryMethod: ['IN_APP', 'EMAIL'],
      readStatus: true,
    },
    {
      notificationId: genId(),
      userId: 'finance-001',
      notificationType: 'INVOICE_APPROVED',
      title: 'Bulk Invoice Batch Approved — 8 Invoices',
      description: 'Bulk approval processed for 8 vendor invoices totalling ₹38,42,000 for the July 2026 cycle. All invoices verified against matching POs. Payment batch scheduled.',
      relatedModule: 'Procurement',
      relatedRecordId: 'BATCH-JUL2026',
      timestamp: daysAgoISO(14),
      priority: 'LOW',
      deliveryMethod: ['IN_APP'],
      readStatus: true,
    },

    // ── MESSAGE RECEIVED ───────────────────────────────────────────────────
    {
      notificationId: genId(),
      userId: 'proc-001',
      notificationType: 'MESSAGE_RECEIVED',
      title: 'Message from TechCorp Solutions — PO Query',
      description: 'TechCorp Solutions: "Regarding PO-2026-0031, we need clarification on the delivery address for Rack Units D11-D15. Are they to be delivered to Data Center A or B?" — Please respond.',
      relatedModule: 'Communication',
      relatedRecordId: 'MSG-00841',
      timestamp: hoursAgoISO(30),
      priority: 'MEDIUM',
      deliveryMethod: ['IN_APP', 'EMAIL'],
      readStatus: false,
    },
    {
      notificationId: genId(),
      userId: 'vendor-001',
      notificationType: 'MESSAGE_RECEIVED',
      title: 'Procurement Team Reply on PO-2026-0031',
      description: 'Procurement Manager: "Delivery to Data Center A, Server Room 3. Please coordinate with security desk for access pass (Ref: SEC-4821)." Message updated in the portal.',
      relatedModule: 'Communication',
      relatedRecordId: 'MSG-00842',
      timestamp: hoursAgoISO(25),
      priority: 'MEDIUM',
      deliveryMethod: ['IN_APP'],
      readStatus: true,
    },
    {
      notificationId: genId(),
      userId: 'scm-001',
      notificationType: 'MESSAGE_RECEIVED',
      title: 'Discussion Thread Update — Warehouse Coordination',
      description: 'Rohan Verma added a comment to the "Q3 Warehouse Capacity Planning" discussion: "EquipMax shipment rescheduled — update your receiving plan accordingly for 22 Aug slot."',
      relatedModule: 'Communication',
      relatedRecordId: 'DISC-00128',
      timestamp: daysAgoISO(2),
      priority: 'LOW',
      deliveryMethod: ['IN_APP'],
      readStatus: false,
    },
    {
      notificationId: genId(),
      userId: 'auditor-001',
      notificationType: 'MESSAGE_RECEIVED',
      title: 'Audit Query from Compliance Team',
      description: 'Compliance Officer Lata Nair: "Please share the vendor compliance audit log for Q2 2026. Required for the statutory audit submission by 30 Aug." Urgent response needed.',
      relatedModule: 'Communication',
      relatedRecordId: 'MSG-00829',
      timestamp: daysAgoISO(3),
      priority: 'HIGH',
      deliveryMethod: ['IN_APP', 'EMAIL'],
      readStatus: false,
    },

    // ── REPORT GENERATED ───────────────────────────────────────────────────
    {
      notificationId: genId(),
      userId: 'admin-001',
      notificationType: 'REPORT_GENERATED',
      title: 'Monthly Procurement Report — July 2026 Ready',
      description: 'The automated July 2026 Procurement Summary Report has been generated. Total spend: ₹2.84 Cr | POs issued: 34 | Vendors active: 12. Download available in Reports section.',
      relatedModule: 'Reports',
      relatedRecordId: 'RPT-2026-JUL',
      timestamp: daysAgoISO(14),
      priority: 'LOW',
      deliveryMethod: ['IN_APP', 'EMAIL'],
      readStatus: true,
    },
    {
      notificationId: genId(),
      userId: 'auditor-001',
      notificationType: 'REPORT_GENERATED',
      title: 'Compliance Audit Report — Q2 2026 Generated',
      description: 'Q2 2026 Vendor Compliance Audit Report is ready. 15 vendors reviewed | 3 non-compliant | 2 certifications expired | 4 pending. Review and sign-off required by 31 Aug.',
      relatedModule: 'Reports',
      relatedRecordId: 'RPT-2026-Q2-AUDIT',
      timestamp: daysAgoISO(10),
      priority: 'MEDIUM',
      deliveryMethod: ['IN_APP', 'EMAIL'],
      readStatus: false,
    },
    {
      notificationId: genId(),
      userId: 'scm-001',
      notificationType: 'REPORT_GENERATED',
      title: 'Vendor Delivery Performance Report — August 2026',
      description: 'August 2026 Delivery Performance Report generated. On-time rate: 87.4% | Delayed shipments: 8 | Average delay: 3.2 days. 2 vendors flagged for performance review.',
      relatedModule: 'Reports',
      relatedRecordId: 'RPT-2026-AUG-DELIVERY',
      timestamp: daysAgoISO(5),
      priority: 'LOW',
      deliveryMethod: ['IN_APP'],
      readStatus: true,
    },
    {
      notificationId: genId(),
      userId: 'finance-001',
      notificationType: 'REPORT_GENERATED',
      title: 'Finance Reconciliation Report — July 2026',
      description: 'July 2026 Invoice & Payment Reconciliation Report ready. Total invoiced: ₹3.12 Cr | Paid: ₹2.87 Cr | Pending: ₹25.4 L | Overdue: ₹8.2 L. Review aging report.',
      relatedModule: 'Reports',
      relatedRecordId: 'RPT-2026-JUL-FIN',
      timestamp: daysAgoISO(14),
      priority: 'MEDIUM',
      deliveryMethod: ['IN_APP', 'EMAIL'],
      readStatus: true,
    },

    // ── PROFILE / SYSTEM ───────────────────────────────────────────────────
    {
      notificationId: genId(),
      userId: 'admin-001',
      notificationType: 'PROFILE_UPDATED',
      title: 'Vendor Profile Modified — TechCorp Solutions',
      description: 'TechCorp Solutions Pvt Ltd updated their company profile: new GST number, updated MSME registration, and 2 new board directors added. Review changes for compliance.',
      relatedModule: 'Vendor Management',
      relatedRecordId: 'VND-001',
      timestamp: daysAgoISO(6),
      priority: 'LOW',
      deliveryMethod: ['IN_APP'],
      readStatus: true,
    },
    {
      notificationId: genId(),
      userId: 'admin-001',
      notificationType: 'PASSWORD_CHANGED',
      title: 'System Alert — Password Changed for Procurement Account',
      description: 'The password for procurement@vendoriq.in was changed at 14:22 IST on 08 Aug 2026 from IP 192.168.1.45. If this was not you, contact the system administrator immediately.',
      relatedModule: 'System',
      relatedRecordId: undefined,
      timestamp: daysAgoISO(6),
      priority: 'HIGH',
      deliveryMethod: ['IN_APP', 'EMAIL', 'SMS'],
      readStatus: true,
    },
    {
      notificationId: genId(),
      userId: 'admin-001',
      notificationType: 'PROFILE_UPDATED',
      title: 'User Profile Update — Contact Details Revised',
      description: 'Rohan Verma (Procurement Manager) updated emergency contact and mobile number in the system profile. Audit log entry created. No role changes detected.',
      relatedModule: 'System',
      relatedRecordId: 'USR-PM-002',
      timestamp: daysAgoISO(20),
      priority: 'LOW',
      deliveryMethod: ['IN_APP'],
      readStatus: true,
    },

    // ── ADDITIONAL CROSS-ROLE REALISTIC ENTRIES ────────────────────────────
    {
      notificationId: genId(),
      userId: 'proc-001',
      notificationType: 'DELIVERY_DELAY',
      title: 'Customs Clearance Delay — PO-2026-0025 (Import Goods)',
      description: 'PO-2026-0025 (Imported precision sensors) is held at Mumbai customs pending Form 15CB documentation. Estimated release: 5–7 days. Coordinate with logistics vendor.',
      relatedModule: 'Procurement',
      relatedRecordId: 'PO-2026-0025',
      timestamp: daysAgoISO(9),
      priority: 'HIGH',
      deliveryMethod: ['IN_APP', 'EMAIL'],
      readStatus: false,
    },
    {
      notificationId: genId(),
      userId: 'scm-001',
      notificationType: 'PO_CREATED',
      title: 'Multi-Vendor PO Bundle Created — Q3 Supplies',
      description: 'Q3 supply bundle (PO-2026-0032 to PO-2026-0036) for 5 vendors totalling ₹28,40,000 has been issued. Delivery schedule uploaded to the order tracking module.',
      relatedModule: 'Procurement',
      relatedRecordId: 'PO-BUNDLE-Q3',
      timestamp: daysAgoISO(12),
      priority: 'MEDIUM',
      deliveryMethod: ['IN_APP'],
      readStatus: true,
    },
    {
      notificationId: genId(),
      userId: 'auditor-001',
      notificationType: 'COMPLIANCE_ALERT',
      title: 'Annual Vendor Compliance Review Due',
      description: '6 vendors are due for their annual compliance review in September 2026. Documents required: GST returns, ISO certificates, safety audits. Please schedule assessments.',
      relatedModule: 'Contracts & Compliance',
      relatedRecordId: 'REVIEW-SEP2026',
      timestamp: daysAgoISO(15),
      priority: 'MEDIUM',
      deliveryMethod: ['IN_APP', 'EMAIL'],
      readStatus: false,
    },
    {
      notificationId: genId(),
      userId: 'finance-001',
      notificationType: 'INVOICE_APPROVED',
      title: 'Invoice Dispute Resolved — INV-2026-0074',
      description: 'Previous dispute on INV-2026-0074 (SafeGuard Industries, ₹1,82,000) has been resolved. Credit note adjusted. Revised invoice approved and queued for payment.',
      relatedModule: 'Procurement',
      relatedRecordId: 'INV-2026-0074',
      timestamp: daysAgoISO(18),
      priority: 'LOW',
      deliveryMethod: ['IN_APP'],
      readStatus: true,
    },
    {
      notificationId: genId(),
      userId: 'vendor-001',
      notificationType: 'MESSAGE_RECEIVED',
      title: 'RFQ Invitation — New Procurement Opportunity',
      description: 'You have been invited to submit a quote for PR-2026-0043 (Web Application Security Testing). Budget: ₹8,50,000. Submission deadline: 20 Aug 2026. See portal for scope.',
      relatedModule: 'Communication',
      relatedRecordId: 'RFQ-2026-043',
      timestamp: daysAgoISO(30),
      priority: 'MEDIUM',
      deliveryMethod: ['IN_APP', 'EMAIL'],
      readStatus: true,
    },
    {
      notificationId: genId(),
      userId: 'proc-001',
      notificationType: 'REPORT_GENERATED',
      title: 'Vendor Scorecard Report — Q2 2026',
      description: 'Q2 2026 Vendor Scorecard Report generated. Top performer: TechCorp Solutions (94.2/100). Lowest: EquipMax Machinery (61.8/100). 2 vendors placed on performance watch.',
      relatedModule: 'Reports',
      relatedRecordId: 'RPT-2026-Q2-SCORECARD',
      timestamp: daysAgoISO(45),
      priority: 'LOW',
      deliveryMethod: ['IN_APP'],
      readStatus: true,
    },
    {
      notificationId: genId(),
      userId: 'proc-001',
      notificationType: 'CONTRACT_EXPIRY',
      title: 'Contract Auto-Expired — CT-2024-0041 (Legacy ERP SLA)',
      description: 'CT-2024-0041 (TechCorp Solutions — Legacy ERP Support) has automatically expired 60 days ago. No renewal initiated. Active services under this contract may be unprotected.',
      relatedModule: 'Contracts & Compliance',
      relatedRecordId: 'CT-2024-0041',
      timestamp: daysAgoISO(60),
      priority: 'MEDIUM',
      deliveryMethod: ['IN_APP', 'EMAIL'],
      readStatus: true,
    },
    {
      notificationId: genId(),
      userId: 'admin-001',
      notificationType: 'VENDOR_APPROVAL',
      title: 'Vendor Re-Activation Request — NovaSec Systems',
      description: 'NovaSec Systems Pvt Ltd has submitted a re-activation request after temporary suspension. New CERT-In certification uploaded. Ready for Administrator review.',
      relatedModule: 'Vendor Management',
      relatedRecordId: 'VND-009',
      timestamp: daysAgoISO(20),
      priority: 'MEDIUM',
      deliveryMethod: ['IN_APP', 'EMAIL'],
      readStatus: true,
    },
    {
      notificationId: genId(),
      userId: 'scm-001',
      notificationType: 'DELIVERY_DELAY',
      title: 'Quality Rejection — Returned Shipment PO-2026-0019',
      description: 'Quality team rejected Batch 3 of PO-2026-0019 (Infra Build materials) — 42 items failed tensile strength test. Vendor notified for replacement. ETA for resupply: 10 days.',
      relatedModule: 'Procurement',
      relatedRecordId: 'PO-2026-0019',
      timestamp: daysAgoISO(22),
      priority: 'HIGH',
      deliveryMethod: ['IN_APP', 'EMAIL'],
      readStatus: true,
    },
  ];

  return seed;
}

// ─── Mutable In-Memory Store ──────────────────────────────────────────────────

let NOTIFICATIONS: AppNotification[] = makeSeed();

// ─── Settings Store (localStorage-backed) ────────────────────────────────────

const SETTINGS_KEY = 'vendoriq_notif_settings';

function _loadSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...defaultNotificationSettings(), ...JSON.parse(raw) };
  } catch {}
  return defaultNotificationSettings();
}

let _settings: NotificationSettings = _loadSettings();
const _settings$ = new BehaviorSubject<NotificationSettings>(_settings);

// ─── Toast event store ────────────────────────────────────────────────────────

type ToastListener = (evt: ToastEvent) => void;
const _toastListeners: ToastListener[] = [];

function _emitToast(evt: ToastEvent) {
  _toastListeners.forEach(fn => fn(evt));
}

// ─── BehaviorSubject stores ───────────────────────────────────────────────────

const _notifications$ = new BehaviorSubject<AppNotification[]>(NOTIFICATIONS);
const _unreadCount$ = new BehaviorSubject<number>(
  NOTIFICATIONS.filter(n => !n.readStatus).length
);

function _recompute() {
  _notifications$.next([...NOTIFICATIONS]);
  _unreadCount$.next(NOTIFICATIONS.filter(n => !n.readStatus).length);
}

// ─── Service Class ────────────────────────────────────────────────────────────

class NotificationService {

  // ── Observables ─────────────────────────────────────────────────────────

  /** Raw stream of all notifications (unfiltered) */
  get notifications$() {
    return _notifications$.asObservable();
  }

  /** Total unread count across all notification types */
  get unreadCount$() {
    return _unreadCount$.asObservable();
  }

  // ── Role-aware reads ─────────────────────────────────────────────────────

  /** Get notifications visible to the given role, sorted newest-first */
  getNotifications(role: UserRole): Observable<AppNotification[]> {
    const allowedTypes = ROLE_NOTIFICATION_ACL[role] ?? [];
    const filtered = NOTIFICATIONS
      .filter(n => allowedTypes.includes(n.notificationType as NotificationType))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return of(filtered);
  }

  /** Unread count for the given role */
  getUnreadCount(role: UserRole): Observable<number> {
    const allowedTypes = ROLE_NOTIFICATION_ACL[role] ?? [];
    const count = NOTIFICATIONS.filter(
      n => allowedTypes.includes(n.notificationType as NotificationType) && !n.readStatus
    ).length;
    return of(count);
  }

  /** Subscribe to live unread count (BehaviorSubject — emits on every change) */
  subscribeUnreadCount(role: UserRole, next: (count: number) => void): { unsubscribe: () => void } {
    // Recompute role-filtered count
    const computeRoleCount = () => {
      const allowedTypes = ROLE_NOTIFICATION_ACL[role] ?? [];
      return NOTIFICATIONS.filter(
        n => allowedTypes.includes(n.notificationType as NotificationType) && !n.readStatus
      ).length;
    };

    next(computeRoleCount());

    // Attach a listener to the main subject
    const internalNext = () => next(computeRoleCount());
    _notifications$.subscribe(internalNext);

    return { unsubscribe: () => { /* simplified — for full impl track subscriber */ } };
  }

  /** Subscribe to live notifications stream for a role */
  subscribeNotifications(role: UserRole, next: (items: AppNotification[]) => void): { unsubscribe: () => void } {
    const allowedTypes = ROLE_NOTIFICATION_ACL[role] ?? [];
    const applyFilter = (all: AppNotification[]) => {
      const filtered = all
        .filter(n => allowedTypes.includes(n.notificationType as NotificationType))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      next(filtered);
    };

    return _notifications$.subscribe(applyFilter);
  }

  // ── Filtered queries ─────────────────────────────────────────────────────

  getByFilter(role: UserRole, filters: NotificationFilters): Observable<AppNotification[]> {
    const allowedTypes = ROLE_NOTIFICATION_ACL[role] ?? [];
    let result = NOTIFICATIONS.filter(n =>
      allowedTypes.includes(n.notificationType as NotificationType)
    );

    if (filters.notificationType) {
      result = result.filter(n => n.notificationType === filters.notificationType);
    }
    if (filters.priority) {
      result = result.filter(n => n.priority === filters.priority);
    }
    if (filters.relatedModule) {
      result = result.filter(n => n.relatedModule === filters.relatedModule);
    }
    if (filters.readStatus !== undefined) {
      result = result.filter(n => n.readStatus === filters.readStatus);
    }
    if (filters.fromDate) {
      result = result.filter(n => new Date(n.timestamp) >= new Date(filters.fromDate!));
    }
    if (filters.toDate) {
      result = result.filter(n => new Date(n.timestamp) <= new Date(filters.toDate!));
    }

    result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? result.length;
    const paginated = result.slice((page - 1) * pageSize, page * pageSize);

    return of(paginated);
  }

  // ── Mutations ───────────────────────────────────────────────────────────

  markAsRead(notificationId: string): Observable<void> {
    NOTIFICATIONS = NOTIFICATIONS.map(n =>
      n.notificationId === notificationId ? { ...n, readStatus: true } : n
    );
    _recompute();
    return of(undefined as unknown as void);
  }

  markAllAsRead(role: UserRole): Observable<void> {
    const allowedTypes = ROLE_NOTIFICATION_ACL[role] ?? [];
    NOTIFICATIONS = NOTIFICATIONS.map(n =>
      allowedTypes.includes(n.notificationType as NotificationType)
        ? { ...n, readStatus: true }
        : n
    );
    _recompute();
    return of(undefined as unknown as void);
  }

  // ── Settings Management ─────────────────────────────────────────────────

  getSettings(): NotificationSettings {
    return _settings;
  }

  saveSettings(s: NotificationSettings): void {
    _settings = { ...s };
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
    _settings$.next(_settings);
  }

  subscribeSettings(next: (s: NotificationSettings) => void): { unsubscribe: () => void } {
    return _settings$.subscribe(next);
  }

  // ── Toast subscription ──────────────────────────────────────────────────

  subscribeToast(cb: (evt: ToastEvent) => void): { unsubscribe: () => void } {
    _toastListeners.push(cb);
    return { unsubscribe: () => {
      const idx = _toastListeners.indexOf(cb);
      if (idx >= 0) _toastListeners.splice(idx, 1);
    }};
  }

  // ── Notification Add (settings-aware) ───────────────────────────────────

  addNotification(
    notification: Omit<AppNotification, 'notificationId' | 'timestamp' | 'readStatus'>,
    opts?: { skipToast?: boolean }
  ): Observable<AppNotification> {
    // Respect muteAll
    if (_settings.muteAll) return of({ ...notification, notificationId: 'muted', timestamp: '', readStatus: true });

    // Respect priorityThreshold
    const threshold = _settings.priorityThreshold;
    if (threshold === 'HIGH_ONLY' && notification.priority !== 'HIGH') {
      return of({ ...notification, notificationId: 'filtered', timestamp: '', readStatus: true });
    }
    if (threshold === 'MEDIUM_PLUS' && notification.priority === 'LOW') {
      return of({ ...notification, notificationId: 'filtered', timestamp: '', readStatus: true });
    }

    // Determine active channels from settings
    const channelCfg = _settings.categoryChannels[notification.notificationType];
    const emailSent = channelCfg ? channelCfg.email : true;
    const smsSent   = channelCfg ? channelCfg.sms   : false;
    const inApp     = channelCfg ? channelCfg.inApp  : true;
    if (!inApp) return of({ ...notification, notificationId: 'filtered', timestamp: '', readStatus: true });

    // Build delivery method list based on settings
    const deliveryMethod: AppNotification['deliveryMethod'] = ['IN_APP'];
    if (emailSent) deliveryMethod.push('EMAIL');
    if (smsSent)   deliveryMethod.push('SMS');

    const newNotif: AppNotification = {
      ...notification,
      deliveryMethod,
      notificationId: genId(),
      timestamp: new Date().toISOString(),
      readStatus: false,
    };
    NOTIFICATIONS = [newNotif, ...NOTIFICATIONS];
    _recompute();

    // Emit toast event
    if (!opts?.skipToast) {
      _emitToast({
        id: newNotif.notificationId,
        title: newNotif.title,
        description: newNotif.description,
        priority: newNotif.priority,
        emailSent,
        smsSent,
      });
    }

    return of(newNotif);
  }

  markAsUnread(notificationId: string): Observable<void> {
    NOTIFICATIONS = NOTIFICATIONS.map(n =>
      n.notificationId === notificationId ? { ...n, readStatus: false } : n
    );
    _recompute();
    return of(undefined as unknown as void);
  }

  toggleReadStatus(notificationId: string): Observable<void> {
    NOTIFICATIONS = NOTIFICATIONS.map(n =>
      n.notificationId === notificationId ? { ...n, readStatus: !n.readStatus } : n
    );
    _recompute();
    return of(undefined as unknown as void);
  }

  markSelectedAsRead(ids: string[]): Observable<void> {
    const idSet = new Set(ids);
    NOTIFICATIONS = NOTIFICATIONS.map(n =>
      idSet.has(n.notificationId) ? { ...n, readStatus: true } : n
    );
    _recompute();
    return of(undefined as unknown as void);
  }

  deleteMultiple(ids: string[]): Observable<void> {
    const idSet = new Set(ids);
    NOTIFICATIONS = NOTIFICATIONS.filter(n => !idSet.has(n.notificationId));
    _recompute();
    return of(undefined as unknown as void);
  }

  deleteNotification(notificationId: string): Observable<void> {
    NOTIFICATIONS = NOTIFICATIONS.filter(n => n.notificationId !== notificationId);
    _recompute();
    return of(undefined as unknown as void);
  }
}

export const notificationService = new NotificationService();
export type { NotificationService };
