/**
 * NotificationSimulatorService — Module 9: Live Event Simulation Engine
 * ======================================================================
 * Emits realistic business events every 20–45 seconds while the app is running.
 * Designed for demo/evaluation: the service populates the notification store,
 * fires toasts, and *visually simulates* Email/SMS delivery — no real SMTP/Twilio.
 *
 * Usage:
 *   notificationSimulatorService.start(role)   ← call after login
 *   notificationSimulatorService.stop()        ← call on logout
 *   notificationSimulatorService.simulateEvent(type) ← manual demo trigger
 */

import { notificationService } from './notificationService';
import type { NotificationType, RelatedModule, UserRole } from '../models/notification';

// ─── Realistic Business Event Templates ─────────────────────────────────────

interface EventTemplate {
  type: NotificationType;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  relatedModule: RelatedModule;
  generate: () => { title: string; description: string; relatedRecordId: string; userId: string };
}

const VENDOR_NAMES = [
  'SteelCore Industries', 'AquaPure Logistics', 'TechFusion Pvt Ltd',
  'GreenBuild Contractors', 'LogiFreight Solutions', 'DataVault Systems',
  'SwiftSupply Co.', 'PrimeParts Manufacturing', 'NovaPack Industries',
  'SafeShield Equipment', 'ClearPath Analytics', 'MetroLink Freight',
];

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randINR = (minL: number, maxL: number) => {
  const val = (randInt(minL * 10, maxL * 10) / 10).toFixed(1);
  return `₹${val}L`;
};

const PO_NUMS = () => `PO-2026-${String(randInt(100, 999)).padStart(4, '0')}`;
const INV_NUMS = () => `INV-2026-${String(randInt(100, 999))}`;
const CNT_NUMS = () => `CT-2026-${String(randInt(10, 99))}`;
const CERT_NAMES = ['ISO 9001', 'ISO 14001', 'ISO 45001', 'HACCP', 'OHSAS 18001', 'BIS Certification', 'FSSC 22000'];
const PR_NUMS = () => `PR-2026-${String(randInt(100, 999))}`;

const EVENT_TEMPLATES: EventTemplate[] = [
  // ── VENDOR APPROVAL ───────────────────────────────────────────────────────
  {
    type: 'VENDOR_APPROVAL',
    priority: 'HIGH',
    relatedModule: 'Vendor Management',
    generate: () => {
      const vendor = pick(VENDOR_NAMES);
      const id = `VND-SIM-${randInt(10, 99)}`;
      return {
        title: `Vendor Registration Approved — ${vendor}`,
        description: `${vendor} vendor profile has been reviewed and approved by the Administrator. All compliance documents validated. The vendor may now participate in procurement bids.`,
        relatedRecordId: id,
        userId: 'vendor-sim',
      };
    },
  },

  // ── VENDOR REJECTION ─────────────────────────────────────────────────────
  {
    type: 'VENDOR_REJECTION',
    priority: 'HIGH',
    relatedModule: 'Vendor Management',
    generate: () => {
      const vendor = pick(VENDOR_NAMES);
      const id = `VND-SIM-${randInt(10, 99)}`;
      return {
        title: `Vendor Application Rejected — ${vendor}`,
        description: `Registration for ${vendor} has been rejected due to incomplete ${pick(['ISO 9001 certification', 'GST documentation', 'PAN verification', 'MSME registration', 'bank details'])}. Vendor has been notified to resubmit.`,
        relatedRecordId: id,
        userId: 'vendor-sim',
      };
    },
  },

  // ── PO CREATED ───────────────────────────────────────────────────────────
  {
    type: 'PO_CREATED',
    priority: 'MEDIUM',
    relatedModule: 'Procurement',
    generate: () => {
      const vendor = pick(VENDOR_NAMES);
      const poId = PO_NUMS();
      const amount = randINR(1, 25);
      return {
        title: `New Purchase Order Issued — ${poId}`,
        description: `Purchase Order ${poId} has been issued to ${vendor} for ${amount}. Order value covers ${pick(['IT Hardware', 'Logistics Services', 'Raw Materials', 'Equipment Maintenance', 'Professional Services', 'Office Supplies'])}. Please confirm acceptance within 48 hours.`,
        relatedRecordId: poId,
        userId: 'proc-sim',
      };
    },
  },

  // ── DELIVERY DELAY ───────────────────────────────────────────────────────
  {
    type: 'DELIVERY_DELAY',
    priority: 'HIGH',
    relatedModule: 'Procurement',
    generate: () => {
      const vendor = pick(VENDOR_NAMES);
      const poId = PO_NUMS();
      const days = randInt(1, 7);
      return {
        title: `Delivery Delay — ${poId} (${days} day${days > 1 ? 's' : ''} overdue)`,
        description: `${vendor} has reported a ${days}-day delay on ${poId} due to ${pick(['supply chain disruptions', 'customs clearance issues', 'manufacturing backlog', 'transportation delays', 'quality hold at vendor site'])}. SLA penalty clause may apply. Supply chain team notified.`,
        relatedRecordId: poId,
        userId: 'scm-sim',
      };
    },
  },

  // ── CONTRACT EXPIRY ──────────────────────────────────────────────────────
  {
    type: 'CONTRACT_EXPIRY',
    priority: 'HIGH',
    relatedModule: 'Contracts & Compliance',
    generate: () => {
      const vendor = pick(VENDOR_NAMES);
      const cntId = CNT_NUMS();
      const days = pick([30, 14, 7, 3]);
      return {
        title: `⚠ Contract Expiring in ${days} Days — ${cntId}`,
        description: `The supply contract with ${vendor} (${cntId}) expires in ${days} days. Contract value covers ${pick(['Infrastructure Services', 'Annual Maintenance', 'Logistics Framework', 'IT Support SLA', 'Raw Material Supply'])}. Initiate renewal process immediately to avoid service disruption.`,
        relatedRecordId: cntId,
        userId: 'admin-sim',
      };
    },
  },

  // ── COMPLIANCE ALERT ─────────────────────────────────────────────────────
  {
    type: 'COMPLIANCE_ALERT',
    priority: 'HIGH',
    relatedModule: 'Contracts & Compliance',
    generate: () => {
      const vendor = pick(VENDOR_NAMES);
      const cert = pick(CERT_NAMES);
      const days = pick([15, 25, 35, 45]);
      const certId = `CERT-SIM-${randInt(1, 20)}`;
      return {
        title: `${cert} Certificate Expiring — ${vendor}`,
        description: `${vendor}'s ${cert} certification expires in ${days} days (${certId}). Renewal is required to maintain compliance for active procurement contracts. Vendor has been notified. Follow up required.`,
        relatedRecordId: certId,
        userId: 'auditor-sim',
      };
    },
  },

  // ── INVOICE APPROVED ─────────────────────────────────────────────────────
  {
    type: 'INVOICE_APPROVED',
    priority: 'MEDIUM',
    relatedModule: 'Procurement',
    generate: () => {
      const vendor = pick(VENDOR_NAMES);
      const invId = INV_NUMS();
      const amount = randINR(0.5, 15);
      return {
        title: `Invoice Approved — ${invId} (${amount})`,
        description: `Invoice ${invId} from ${vendor} for ${amount} has been verified and approved by Finance. Payment scheduled for Net 30. Transaction will appear in the next payment batch.`,
        relatedRecordId: invId,
        userId: 'finance-sim',
      };
    },
  },

  // ── PROCUREMENT ALERT ────────────────────────────────────────────────────
  {
    type: 'PROCUREMENT_ALERT',
    priority: 'HIGH',
    relatedModule: 'Procurement',
    generate: () => {
      const prId = PR_NUMS();
      const amount = randINR(5, 50);
      return {
        title: `Urgent Procurement Alert — ${prId}`,
        description: `${pick(['Budget threshold exceeded', 'SLA violation detected', 'Vendor price variance flagged', 'Critical stock shortage detected', 'High-value request escalated'])} for ${prId}. Estimated value: ${amount}. Immediate attention required from Procurement Manager.`,
        relatedRecordId: prId,
        userId: 'proc-sim',
      };
    },
  },

  // ── PROCUREMENT REQUEST ──────────────────────────────────────────────────
  {
    type: 'PROCUREMENT_REQUEST',
    priority: 'MEDIUM',
    relatedModule: 'Procurement',
    generate: () => {
      const prId = PR_NUMS();
      const amount = randINR(1, 30);
      return {
        title: `New Procurement Request — ${prId}`,
        description: `A new procurement request (${prId}) for ${pick(['Office Supplies', 'Safety Equipment', 'IT Hardware', 'Facility Maintenance', 'Professional Services'])} has been submitted. Budget: ${amount}. Awaiting Procurement Manager approval.`,
        relatedRecordId: prId,
        userId: 'proc-sim',
      };
    },
  },

  // ── MESSAGE RECEIVED ─────────────────────────────────────────────────────
  {
    type: 'MESSAGE_RECEIVED',
    priority: 'LOW',
    relatedModule: 'Communication',
    generate: () => {
      const vendor = pick(VENDOR_NAMES);
      const msgId = `MSG-SIM-${randInt(1000, 9999)}`;
      return {
        title: `Message from ${vendor}`,
        description: `${vendor}: "${pick(['We have updated our delivery schedule for the latest PO.', 'Please confirm the delivery address at your earliest convenience.', 'Invoice has been raised and documents uploaded to portal.', 'We require clarification on the technical specifications before proceeding.', 'Our team is ready to begin — please share access credentials.'])}"`,
        relatedRecordId: msgId,
        userId: 'proc-sim',
      };
    },
  },

  // ── REPORT GENERATED ─────────────────────────────────────────────────────
  {
    type: 'REPORT_GENERATED',
    priority: 'LOW',
    relatedModule: 'Reports',
    generate: () => {
      const rptId = `RPT-SIM-${randInt(100, 999)}`;
      return {
        title: `${pick(['Monthly Procurement Report', 'Vendor Performance Scorecard', 'Compliance Audit Summary', 'Finance Reconciliation Report', 'Delivery Performance Report'])} Ready`,
        description: `An automated report (${rptId}) has been generated and is available in the Reports section. Key highlights: ${pick(['3 vendors flagged for SLA breach', 'spend 12% above forecast', 'on-time delivery rate 89.2%', '4 compliance documents expiring soon', '₹2.4Cr total spend processed'])}.`,
        relatedRecordId: rptId,
        userId: 'admin-sim',
      };
    },
  },
];

// ─── Simulator Service Class ─────────────────────────────────────────────────

class NotificationSimulatorService {
  private _intervalId: ReturnType<typeof setTimeout> | null = null;
  private _activeRole: UserRole = 'Administrator';
  private _isRunning = false;

  /** Start live simulation. Call after user logs in. */
  start(role: UserRole): void {
    this._activeRole = role;
    if (this._isRunning) return;
    this._isRunning = true;
    this._scheduleNext();
  }

  /** Stop simulation. Call on logout. */
  stop(): void {
    this._isRunning = false;
    if (this._intervalId) {
      clearTimeout(this._intervalId);
      this._intervalId = null;
    }
  }

  /** Update role without restarting */
  setRole(role: UserRole): void {
    this._activeRole = role;
  }

  /** Manually fire a specific event type (for demo panel) */
  simulateEvent(type: NotificationType): void {
    const template = EVENT_TEMPLATES.find(t => t.type === type) ?? EVENT_TEMPLATES[0];
    this._fireEvent(template);
  }

  /** Fire a random event from the pool */
  simulateRandom(): void {
    const template = pick(EVENT_TEMPLATES);
    this._fireEvent(template);
  }

  /** Run startup scheduler checks for contracts and overdue POs */
  runStartupChecks(
    contracts: Array<{ id: string; vendorName: string; endDate: string; title: string; value: number }>,
    orders: Array<{ id: string; vendorName: string; deliveryDate?: string; status: string }>
  ): void {
    const now = new Date();

    // Check contracts for upcoming expiry
    contracts.forEach(contract => {
      const expiry = new Date(contract.endDate);
      const daysLeft = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const settings = notificationService.getSettings();

      const shouldAlert =
        (daysLeft <= 90 && daysLeft > 30 && settings.expiryReminders.days90) ||
        (daysLeft <= 30 && daysLeft > 7  && settings.expiryReminders.days30) ||
        (daysLeft <= 7  && daysLeft > 1  && settings.expiryReminders.days7)  ||
        (daysLeft <= 1  && daysLeft >= 0 && settings.expiryReminders.days1);

      if (shouldAlert && daysLeft >= 0) {
        const priority = daysLeft <= 7 ? 'HIGH' : daysLeft <= 30 ? 'HIGH' : 'MEDIUM';
        notificationService.addNotification({
          notificationType: 'CONTRACT_EXPIRY',
          title: `⚠ Contract Expiring in ${daysLeft} Days — ${contract.id}`,
          description: `${contract.title} with ${contract.vendorName} (${contract.id}) expires in ${daysLeft} days. Contract value: ₹${(contract.value / 100000).toFixed(1)}L. Initiate renewal to avoid service disruption.`,
          relatedModule: 'Contracts & Compliance',
          relatedRecordId: contract.id,
          userId: 'scheduler',
          priority,
          deliveryMethod: ['IN_APP', 'EMAIL'],
        }, { skipToast: true });
      }
    });

    // Check POs for overdue deliveries
    orders.forEach(order => {
      if (!order.deliveryDate) return;
      if (order.status === 'Completed' || order.status === 'Rejected') return;
      const delivery = new Date(order.deliveryDate);
      const daysOverdue = Math.floor((now.getTime() - delivery.getTime()) / (1000 * 60 * 60 * 24));
      if (daysOverdue > 0) {
        notificationService.addNotification({
          notificationType: 'DELIVERY_DELAY',
          title: `Delivery Overdue — ${order.id} (${daysOverdue}d late)`,
          description: `Purchase Order ${order.id} from ${order.vendorName} was expected on ${order.deliveryDate} but has not yet been delivered (${daysOverdue} days overdue). SLA review initiated.`,
          relatedModule: 'Procurement',
          relatedRecordId: order.id,
          userId: 'scheduler',
          priority: daysOverdue >= 3 ? 'HIGH' : 'MEDIUM',
          deliveryMethod: ['IN_APP'],
        }, { skipToast: true });
      }
    });
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  private _scheduleNext(): void {
    if (!this._isRunning) return;
    const delay = randInt(20_000, 45_000); // 20–45 seconds
    this._intervalId = setTimeout(() => {
      if (this._isRunning) {
        this.simulateRandom();
        this._scheduleNext();
      }
    }, delay);
  }

  private _fireEvent(template: EventTemplate): void {
    const { title, description, relatedRecordId, userId } = template.generate();
    notificationService.addNotification({
      notificationType: template.type,
      title,
      description,
      relatedModule: template.relatedModule,
      relatedRecordId,
      userId,
      priority: template.priority,
      deliveryMethod: ['IN_APP'],
    });
  }
}

export const notificationSimulatorService = new NotificationSimulatorService();
export type { NotificationSimulatorService };

// Export event types for the demo panel
export const SIMULATED_EVENT_TYPES: { type: NotificationType; label: string; icon: string }[] = [
  { type: 'VENDOR_APPROVAL',     label: 'Vendor Approved',      icon: '✅' },
  { type: 'VENDOR_REJECTION',    label: 'Vendor Rejected',       icon: '❌' },
  { type: 'PO_CREATED',          label: 'PO Created',            icon: '📦' },
  { type: 'DELIVERY_DELAY',      label: 'Delivery Delayed',      icon: '🚛' },
  { type: 'CONTRACT_EXPIRY',     label: 'Contract Expiry',       icon: '⚠️' },
  { type: 'COMPLIANCE_ALERT',    label: 'Compliance Alert',      icon: '🛡️' },
  { type: 'INVOICE_APPROVED',    label: 'Invoice Approved',      icon: '🧾' },
  { type: 'PROCUREMENT_ALERT',   label: 'Procurement Alert',     icon: '🔔' },
  { type: 'PROCUREMENT_REQUEST', label: 'Procurement Request',   icon: '📋' },
  { type: 'MESSAGE_RECEIVED',    label: 'Message Received',      icon: '💬' },
  { type: 'REPORT_GENERATED',    label: 'Report Generated',      icon: '📊' },
];
