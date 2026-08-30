/**
 * ContractService — Module 6: Contract & Compliance Management
 * =============================================================
 * Simulates the future FastAPI backend for contract lifecycle,
 * certification tracking, compliance management, and vendor documents.
 *
 * All public methods return Observable<T> shaped exactly like future REST responses.
 * To connect to the real backend, replace each method body with an HTTP call —
 * method signatures, parameter shapes, and return types remain 100% identical.
 *
 * Expiry Monitoring Engine:
 * Runs on service init and after every contract/certification mutation.
 * Auto-flips statuses (Active → Expired, Valid → Expiring Soon / Expired)
 * and generates ContractNotification entries at 90-day (Info), 30-day (Warning),
 * 7-day and 0-day (Critical) thresholds — mirroring the planned backend cron job.
 */

import type {
  Contract,
  ContractRenewal,
  Certification,
  ComplianceRecord,
  VendorDocument,
  ContractNotification,
  ContractStatus,
  CertificationStatus,
  ContractFilters,
  CertificationFilters,
  DocumentFilters,
  PaginatedContracts,
  ContractSummaryMetrics,
} from '../models/contract';

// ─── Lightweight Observable (same pattern as reliabilityService) ─────────────

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

function of<T>(value: T): Observable<T> {
  return new Observable<T>((subscriber) => subscriber.next(value));
}

// ─── Date Utilities ───────────────────────────────────────────────────────────

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function daysFromToday(dateStr: string): number {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));
}

function dateOffset(days: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function isoNow(): string {
  return new Date().toISOString();
}

// ─── Vendor Reference Constants (matching existing mock services exactly) ─────

const VENDORS = [
  { id: 1,  name: 'TechCorp Solutions Pvt Ltd',  category: 'IT Vendors' },
  { id: 2,  name: 'Global Logistics & Freight',   category: 'Logistics Partners' },
  { id: 4,  name: 'Zenith Office Supplies',        category: 'Service Providers' },
  { id: 5,  name: 'EquipMax Machinery Ltd',        category: 'Equipment Vendors' },
  { id: 9,  name: 'NovaSec Systems Pvt Ltd',       category: 'IT Vendors' },
  { id: 10, name: 'SafeGuard Industries',          category: 'Maintenance Vendors' },
  { id: 11, name: 'Infra Build & Civil Co.',       category: 'Service Providers' },
  { id: 12, name: 'PrintMaster Communications',    category: 'Service Providers' },
];

// ─── Seed Mock Data ───────────────────────────────────────────────────────────

// 12 contracts covering all 5 statuses with expiry variety
const SEED_CONTRACTS: Contract[] = [
  // ── ACTIVE ────
  {
    contractId: 1,
    contractNumber: 'CT-2026-0001',
    contractTitle: 'Enterprise IT Support & Software Licensing',
    vendorId: 1,
    vendorName: 'TechCorp Solutions Pvt Ltd',
    contractType: 'Service Agreement',
    procurementCategory: 'IT Services',
    startDate: '2026-01-01',
    endDate: dateOffset(92),   // ~90 days → Info alert
    contractValue: 4800000,
    paymentTerms: 'Net 30',
    sla: '99.5% uptime SLA; P1 response within 2 hours',
    warrantyDetails: '12-month warranty on all hardware supplied',
    responsibleManager: 'Rohan Verma',
    status: 'Active',
    documentName: 'CT-2026-0001_TechCorp_SLA_Agreement.pdf',
    linkedProcurementNumbers: ['PR-2026-0001', 'PR-2026-0008'],
    createdAt: '2025-12-20T09:00:00Z',
    daysToExpiry: 92,
  },
  {
    contractId: 2,
    contractNumber: 'CT-2026-0002',
    contractTitle: 'Cold Chain Logistics Framework Agreement',
    vendorId: 2,
    vendorName: 'Global Logistics & Freight',
    contractType: 'Framework Contract',
    procurementCategory: 'Logistics Services',
    startDate: '2026-03-01',
    endDate: dateOffset(31),   // ~30 days → Warning alert
    contractValue: 2100000,
    paymentTerms: 'Net 45',
    sla: 'Delivery within 48h for domestic; 72h for intercity',
    warrantyDetails: 'N/A',
    responsibleManager: 'Lata Nair',
    status: 'Active',
    documentName: 'CT-2026-0002_GlobalLogistics_Framework.pdf',
    linkedProcurementNumbers: ['PR-2026-0002'],
    createdAt: '2026-02-15T10:00:00Z',
    daysToExpiry: 31,
  },
  {
    contractId: 3,
    contractNumber: 'CT-2026-0003',
    contractTitle: 'Office Supplies Annual Supply Contract',
    vendorId: 4,
    vendorName: 'Zenith Office Supplies',
    contractType: 'Supply Agreement',
    procurementCategory: 'General Supplies',
    startDate: '2026-02-01',
    endDate: dateOffset(7),    // ~7 days → Critical alert
    contractValue: 650000,
    paymentTerms: 'On Delivery',
    sla: 'Order fulfillment within 5 business days',
    warrantyDetails: 'Replacement guarantee for defective items within 30 days',
    responsibleManager: 'Hrithik',
    status: 'Active',
    documentName: 'CT-2026-0003_Zenith_Supply_Agreement.pdf',
    linkedProcurementNumbers: [],
    createdAt: '2026-01-25T08:00:00Z',
    daysToExpiry: 7,
  },
  {
    contractId: 4,
    contractNumber: 'CT-2026-0004',
    contractTitle: 'Cybersecurity & SOC Monitoring Services',
    vendorId: 9,
    vendorName: 'NovaSec Systems Pvt Ltd',
    contractType: 'SLA Agreement',
    procurementCategory: 'IT Security',
    startDate: '2026-04-01',
    endDate: dateOffset(180),  // 6 months — long-term active
    contractValue: 3200000,
    paymentTerms: 'Net 30',
    sla: '24x7 SOC monitoring; Critical incident response < 30 min',
    warrantyDetails: 'N/A',
    responsibleManager: 'Rohan Verma',
    status: 'Active',
    documentName: 'CT-2026-0004_NovaSec_SOC_Agreement.pdf',
    linkedProcurementNumbers: [],
    createdAt: '2026-03-20T11:00:00Z',
    daysToExpiry: 180,
  },
  // ── DRAFT ────
  {
    contractId: 5,
    contractNumber: 'CT-2026-0005',
    contractTitle: 'Industrial Machinery Maintenance Contract',
    vendorId: 5,
    vendorName: 'EquipMax Machinery Ltd',
    contractType: 'Maintenance Contract',
    procurementCategory: 'Heavy Equipment',
    startDate: dateOffset(10),
    endDate: dateOffset(375),
    contractValue: 1500000,
    paymentTerms: 'Quarterly',
    sla: 'Preventive maintenance every 3 months; Breakdown resolution < 12h',
    warrantyDetails: '24-month warranty on all replaced parts',
    responsibleManager: 'Lata Nair',
    status: 'Draft',
    documentName: 'CT-2026-0005_EquipMax_Maintenance_Draft.pdf',
    linkedProcurementNumbers: ['PR-2026-0004'],
    createdAt: isoNow(),
    daysToExpiry: 375,
  },
  {
    contractId: 6,
    contractNumber: 'CT-2026-0006',
    contractTitle: 'Site Safety & Compliance Services Agreement',
    vendorId: 10,
    vendorName: 'SafeGuard Industries',
    contractType: 'Service Agreement',
    procurementCategory: 'Safety Equipment',
    startDate: dateOffset(14),
    endDate: dateOffset(380),
    contractValue: 850000,
    paymentTerms: 'Net 15',
    sla: 'Site visit within 24h of escalation; audit reports within 5 days',
    warrantyDetails: 'All safety equipment certified as per IS standards',
    responsibleManager: 'Hrithik',
    status: 'Draft',
    documentName: 'CT-2026-0006_SafeGuard_Safety_Draft.pdf',
    linkedProcurementNumbers: ['PR-2026-0007'],
    createdAt: isoNow(),
    daysToExpiry: 380,
  },
  {
    contractId: 7,
    contractNumber: 'CT-2026-0007',
    contractTitle: 'Civil Infrastructure Framework Agreement',
    vendorId: 11,
    vendorName: 'Infra Build & Civil Co.',
    contractType: 'Framework Contract',
    procurementCategory: 'Civil Works',
    startDate: dateOffset(20),
    endDate: dateOffset(400),
    contractValue: 6500000,
    paymentTerms: 'Milestone-based',
    sla: 'Project milestones as per approved SOW; 10% penalty on delays',
    warrantyDetails: '5-year structural warranty on completed civil works',
    responsibleManager: 'Rohan Verma',
    status: 'Draft',
    documentName: 'CT-2026-0007_InfraBuild_Civil_Framework.pdf',
    linkedProcurementNumbers: ['PR-2026-0003'],
    createdAt: isoNow(),
    daysToExpiry: 400,
  },
  // ── EXPIRED ────
  {
    contractId: 8,
    contractNumber: 'CT-2025-0018',
    contractTitle: 'Printing & Marketing Collateral Supply',
    vendorId: 12,
    vendorName: 'PrintMaster Communications',
    contractType: 'Supply Agreement',
    procurementCategory: 'Marketing Services',
    startDate: '2025-01-01',
    endDate: dateOffset(-15),   // expired 15 days ago
    contractValue: 320000,
    paymentTerms: 'Net 15',
    sla: 'Print jobs delivered within 3 business days',
    warrantyDetails: 'Reprint guarantee for quality defects',
    responsibleManager: 'Lata Nair',
    status: 'Expired',
    documentName: 'CT-2025-0018_PrintMaster_Supply.pdf',
    linkedProcurementNumbers: [],
    createdAt: '2024-12-20T10:00:00Z',
    daysToExpiry: -15,
  },
  {
    contractId: 9,
    contractNumber: 'CT-2024-0041',
    contractTitle: 'Legacy ERP Support & Infrastructure SLA',
    vendorId: 1,
    vendorName: 'TechCorp Solutions Pvt Ltd',
    contractType: 'SLA Agreement',
    procurementCategory: 'IT Services',
    startDate: '2024-01-01',
    endDate: dateOffset(-60),   // expired 60 days ago
    contractValue: 2800000,
    paymentTerms: 'Net 30',
    sla: '99% uptime; Support ticket SLA: 4h for P1',
    warrantyDetails: '12-month hardware warranty',
    responsibleManager: 'Hrithik',
    status: 'Expired',
    documentName: 'CT-2024-0041_TechCorp_ERP_SLA.pdf',
    linkedProcurementNumbers: [],
    createdAt: '2023-12-15T09:00:00Z',
    daysToExpiry: -60,
  },
  // ── RENEWED ────
  {
    contractId: 10,
    contractNumber: 'CT-2026-0008',
    contractTitle: 'Annual Freight & Warehousing Agreement (Renewed)',
    vendorId: 2,
    vendorName: 'Global Logistics & Freight',
    contractType: 'Framework Contract',
    procurementCategory: 'Logistics Services',
    startDate: dateOffset(-30),
    endDate: dateOffset(335),   // renewed for another year
    contractValue: 2400000,
    paymentTerms: 'Net 45',
    sla: 'On-time delivery rate ≥ 95%; Damage claim resolution < 7 days',
    warrantyDetails: 'N/A',
    responsibleManager: 'Rohan Verma',
    status: 'Renewed',
    documentName: 'CT-2026-0008_GlobalLogistics_Renewed.pdf',
    linkedProcurementNumbers: [],
    createdAt: dateOffset(-400).concat('T10:00:00Z'),
    daysToExpiry: 335,
  },
  {
    contractId: 11,
    contractNumber: 'CT-2026-0009',
    contractTitle: 'Software License Renewal — Design Suite',
    vendorId: 1,
    vendorName: 'TechCorp Solutions Pvt Ltd',
    contractType: 'License Agreement',
    procurementCategory: 'IT Software',
    startDate: dateOffset(-10),
    endDate: dateOffset(355),
    contractValue: 540000,
    paymentTerms: 'Annual upfront',
    sla: 'License activation within 24h; 99% platform availability',
    warrantyDetails: 'N/A',
    responsibleManager: 'Hrithik',
    status: 'Renewed',
    documentName: 'CT-2026-0009_TechCorp_License_Renewed.pdf',
    linkedProcurementNumbers: ['PR-2026-0006'],
    createdAt: dateOffset(-380).concat('T08:00:00Z'),
    daysToExpiry: 355,
  },
  // ── TERMINATED ────
  {
    contractId: 12,
    contractNumber: 'CT-2025-0009',
    contractTitle: 'Facility Housekeeping Services Contract',
    vendorId: 10,
    vendorName: 'SafeGuard Industries',
    contractType: 'Service Agreement',
    procurementCategory: 'Facility Services',
    startDate: '2025-01-01',
    endDate: '2025-08-31',
    contractValue: 480000,
    paymentTerms: 'Monthly',
    sla: 'Daily housekeeping; deep cleaning fortnightly',
    warrantyDetails: 'N/A',
    responsibleManager: 'Lata Nair',
    status: 'Terminated',
    documentName: 'CT-2025-0009_SafeGuard_Housekeeping.pdf',
    linkedProcurementNumbers: [],
    createdAt: '2024-12-20T10:00:00Z',
    daysToExpiry: daysFromToday('2025-08-31'),
  },
  {
    contractId: 13,
    contractNumber: 'CT-2024-0033',
    contractTitle: 'Legacy CCTV & Access Control Maintenance',
    vendorId: 9,
    vendorName: 'NovaSec Systems Pvt Ltd',
    contractType: 'Maintenance Contract',
    procurementCategory: 'IT Security',
    startDate: '2024-06-01',
    endDate: '2024-12-31',
    contractValue: 680000,
    paymentTerms: 'Quarterly',
    sla: 'Response to incidents < 2h; Monthly health report',
    warrantyDetails: '6-month warranty on replaced hardware',
    responsibleManager: 'Rohan Verma',
    status: 'Terminated',
    documentName: 'CT-2024-0033_NovaSec_CCTV_Maintenance.pdf',
    linkedProcurementNumbers: [],
    createdAt: '2024-05-20T09:00:00Z',
    daysToExpiry: daysFromToday('2024-12-31'),
  },
];

// 10 certifications — mix of Valid / Expiring Soon / Expired
const SEED_CERTIFICATIONS: Certification[] = [
  {
    certificationId: 1,
    vendorId: 1,
    vendorName: 'TechCorp Solutions Pvt Ltd',
    certificationName: 'ISO 27001 Information Security',
    certificateNumber: 'ISO27001-TC-2024-887',
    issuingAuthority: 'BSI Group India Pvt Ltd',
    issueDate: '2024-06-01',
    expiryDate: dateOffset(180),
    documentName: 'TechCorp_ISO27001_2024.pdf',
    status: 'Valid',
    daysToExpiry: 180,
  },
  {
    certificationId: 2,
    vendorId: 1,
    vendorName: 'TechCorp Solutions Pvt Ltd',
    certificationName: 'ISO 9001 Quality Management',
    certificateNumber: 'ISO9001-TC-2025-112',
    issuingAuthority: 'Bureau Veritas India',
    issueDate: '2025-01-01',
    expiryDate: dateOffset(25),   // Expiring Soon
    documentName: 'TechCorp_ISO9001_2025.pdf',
    status: 'Expiring Soon',
    daysToExpiry: 25,
  },
  {
    certificationId: 3,
    vendorId: 2,
    vendorName: 'Global Logistics & Freight',
    certificationName: 'GST Registration Certificate',
    certificateNumber: 'GSTIN-27ABCFR9876P1ZX',
    issuingAuthority: 'GSTN India',
    issueDate: '2023-04-01',
    expiryDate: dateOffset(290),
    documentName: 'GlobalLogistics_GSTIN_2026.pdf',
    status: 'Valid',
    daysToExpiry: 290,
  },
  {
    certificationId: 4,
    vendorId: 2,
    vendorName: 'Global Logistics & Freight',
    certificationName: 'HACCP Food Safety Certification',
    certificateNumber: 'HACCP-GL-2023-445',
    issuingAuthority: 'FSSAI India',
    issueDate: '2023-03-15',
    expiryDate: dateOffset(-20),  // Expired
    documentName: 'GlobalLogistics_HACCP_2023.pdf',
    status: 'Expired',
    daysToExpiry: -20,
  },
  {
    certificationId: 5,
    vendorId: 5,
    vendorName: 'EquipMax Machinery Ltd',
    certificationName: 'BIS Product Certification (Machinery)',
    certificateNumber: 'BIS-EM-2024-CM/L-5891234',
    issuingAuthority: 'Bureau of Indian Standards',
    issueDate: '2024-03-01',
    expiryDate: dateOffset(5),    // Expiring Soon – critical
    documentName: 'EquipMax_BIS_Certification.pdf',
    status: 'Expiring Soon',
    daysToExpiry: 5,
  },
  {
    certificationId: 6,
    vendorId: 10,
    vendorName: 'SafeGuard Industries',
    certificationName: 'OHSAS 18001 / ISO 45001 Safety',
    certificateNumber: 'OHSAS-SG-2024-9012',
    issuingAuthority: 'DnV GL India',
    issueDate: '2024-08-01',
    expiryDate: dateOffset(-45),  // Expired
    documentName: 'SafeGuard_OHSAS18001_2024.pdf',
    status: 'Expired',
    daysToExpiry: -45,
  },
  {
    certificationId: 7,
    vendorId: 9,
    vendorName: 'NovaSec Systems Pvt Ltd',
    certificationName: 'CERT-In Empanelled Auditor',
    certificateNumber: 'CERTIN-NV-2025-00221',
    issuingAuthority: 'CERT-In (MEITY)',
    issueDate: '2025-02-01',
    expiryDate: dateOffset(200),
    documentName: 'NovaSec_CERTIn_2025.pdf',
    status: 'Valid',
    daysToExpiry: 200,
  },
  {
    certificationId: 8,
    vendorId: 4,
    vendorName: 'Zenith Office Supplies',
    certificationName: 'ISO 14001 Environmental Management',
    certificateNumber: 'ISO14001-ZO-2025-337',
    issuingAuthority: 'SGS India Pvt Ltd',
    issueDate: '2025-01-15',
    expiryDate: dateOffset(35),   // Expiring Soon
    documentName: 'Zenith_ISO14001_2025.pdf',
    status: 'Expiring Soon',
    daysToExpiry: 35,
  },
  {
    certificationId: 9,
    vendorId: 11,
    vendorName: 'Infra Build & Civil Co.',
    certificationName: 'ISO 45001 Occupational Health & Safety',
    certificateNumber: 'ISO45001-IB-2024-619',
    issuingAuthority: 'TUV SUD South Asia',
    issueDate: '2024-11-01',
    expiryDate: dateOffset(365),
    documentName: 'InfraBuild_ISO45001_2024.pdf',
    status: 'Valid',
    daysToExpiry: 365,
  },
  {
    certificationId: 10,
    vendorId: 12,
    vendorName: 'PrintMaster Communications',
    certificationName: 'FSC Chain of Custody (Paper Products)',
    certificateNumber: 'FSC-PM-2025-IND-1283',
    issuingAuthority: 'FSC India',
    issueDate: '2025-04-01',
    expiryDate: dateOffset(330),
    documentName: 'PrintMaster_FSC_CoC_2025.pdf',
    status: 'Valid',
    daysToExpiry: 330,
  },
];

// Compliance records covering all statuses across 6 vendors
const SEED_COMPLIANCE: ComplianceRecord[] = [
  {
    complianceId: 1, vendorId: 1, vendorName: 'TechCorp Solutions Pvt Ltd',
    requirementName: 'GST Registration',
    complianceStatus: 'Compliant',
    lastVerifiedDate: '2026-06-30', verifiedBy: 'Hrithik',
    remarks: 'GSTIN verified against GSTN portal. Active and valid.'
  },
  {
    complianceId: 2, vendorId: 1, vendorName: 'TechCorp Solutions Pvt Ltd',
    requirementName: 'ISO Quality Standards',
    complianceStatus: 'Compliant',
    lastVerifiedDate: '2026-05-15', verifiedBy: 'Rohan Verma',
    remarks: 'ISO 9001 certificate valid until next quarter.'
  },
  {
    complianceId: 3, vendorId: 1, vendorName: 'TechCorp Solutions Pvt Ltd',
    requirementName: 'Cybersecurity Standards',
    complianceStatus: 'Compliant',
    lastVerifiedDate: '2026-07-01', verifiedBy: 'Hrithik',
    remarks: 'Passed CERT-In audit. No vulnerabilities reported.'
  },
  {
    complianceId: 4, vendorId: 2, vendorName: 'Global Logistics & Freight',
    requirementName: 'GST Registration',
    complianceStatus: 'Compliant',
    lastVerifiedDate: '2026-06-01', verifiedBy: 'Lata Nair',
    remarks: 'GSTIN active and all returns filed up to date.'
  },
  {
    complianceId: 5, vendorId: 2, vendorName: 'Global Logistics & Freight',
    requirementName: 'Safety Regulations',
    complianceStatus: 'Pending Verification',
    lastVerifiedDate: '2026-03-01', verifiedBy: 'Lata Nair',
    remarks: 'Annual safety audit pending. Scheduled for next month.'
  },
  {
    complianceId: 6, vendorId: 5, vendorName: 'EquipMax Machinery Ltd',
    requirementName: 'Safety Regulations',
    complianceStatus: 'Non-Compliant',
    lastVerifiedDate: '2026-05-20', verifiedBy: 'Rohan Verma',
    remarks: 'Hydraulic press unit failed safety inspection. CAP raised.'
  },
  {
    complianceId: 7, vendorId: 5, vendorName: 'EquipMax Machinery Ltd',
    requirementName: 'ISO Quality Standards',
    complianceStatus: 'Non-Compliant',
    lastVerifiedDate: '2026-04-10', verifiedBy: 'Hrithik',
    remarks: 'ISO 9001 certificate expired. Recertification postponed.'
  },
  {
    complianceId: 8, vendorId: 10, vendorName: 'SafeGuard Industries',
    requirementName: 'Environmental Compliance',
    complianceStatus: 'Expired',
    lastVerifiedDate: '2025-12-15', verifiedBy: 'Lata Nair',
    remarks: 'ISO 14001 certificate expired. Renewal initiated.'
  },
  {
    complianceId: 9, vendorId: 10, vendorName: 'SafeGuard Industries',
    requirementName: 'GST Registration',
    complianceStatus: 'Compliant',
    lastVerifiedDate: '2026-07-01', verifiedBy: 'Hrithik',
    remarks: 'GST returns filed. No outstanding dues.'
  },
  {
    complianceId: 10, vendorId: 9, vendorName: 'NovaSec Systems Pvt Ltd',
    requirementName: 'Cybersecurity Standards',
    complianceStatus: 'Compliant',
    lastVerifiedDate: '2026-06-20', verifiedBy: 'Rohan Verma',
    remarks: 'Penetration test completed. All critical findings remediated.'
  },
  {
    complianceId: 11, vendorId: 9, vendorName: 'NovaSec Systems Pvt Ltd',
    requirementName: 'GST Registration',
    complianceStatus: 'Compliant',
    lastVerifiedDate: '2026-06-01', verifiedBy: 'Lata Nair',
    remarks: 'GSTIN verified. All returns filed.'
  },
  {
    complianceId: 12, vendorId: 11, vendorName: 'Infra Build & Civil Co.',
    requirementName: 'Safety Regulations',
    complianceStatus: 'Compliant',
    lastVerifiedDate: '2026-06-10', verifiedBy: 'Rohan Verma',
    remarks: 'ISO 45001 certification active. Site safety audit passed.'
  },
  {
    complianceId: 13, vendorId: 11, vendorName: 'Infra Build & Civil Co.',
    requirementName: 'Environmental Compliance',
    complianceStatus: 'Pending Verification',
    lastVerifiedDate: '2026-02-01', verifiedBy: 'Lata Nair',
    remarks: 'Environmental impact assessment report awaited from state body.'
  },
  {
    complianceId: 14, vendorId: 4, vendorName: 'Zenith Office Supplies',
    requirementName: 'GST Registration',
    complianceStatus: 'Compliant',
    lastVerifiedDate: '2026-07-01', verifiedBy: 'Hrithik',
    remarks: 'GSTIN active. Quarterly returns filed.'
  },
  {
    complianceId: 15, vendorId: 12, vendorName: 'PrintMaster Communications',
    requirementName: 'Environmental Compliance',
    complianceStatus: 'Compliant',
    lastVerifiedDate: '2026-05-01', verifiedBy: 'Lata Nair',
    remarks: 'FSC certified. All paper sourced from responsible forests.'
  },
];

// 15+ vendor documents across all document types
const SEED_DOCUMENTS: VendorDocument[] = [
  {
    documentId: 1, vendorId: 1, vendorName: 'TechCorp Solutions Pvt Ltd',
    documentType: 'GST Certificate', documentName: 'TechCorp_GSTIN_2026.pdf',
    uploadedBy: 'Hrithik', uploadedAt: '2026-01-15T10:00:00Z', version: 'v2.0'
  },
  {
    documentId: 2, vendorId: 1, vendorName: 'TechCorp Solutions Pvt Ltd',
    documentType: 'Company Registration', documentName: 'TechCorp_ROC_Certificate.pdf',
    uploadedBy: 'Hrithik', uploadedAt: '2026-01-15T10:05:00Z', version: 'v1.0'
  },
  {
    documentId: 3, vendorId: 1, vendorName: 'TechCorp Solutions Pvt Ltd',
    documentType: 'Quality Certificate', documentName: 'TechCorp_ISO9001_2025.pdf',
    uploadedBy: 'Rohan Verma', uploadedAt: '2026-02-01T09:00:00Z', version: 'v2.1'
  },
  {
    documentId: 4, vendorId: 2, vendorName: 'Global Logistics & Freight',
    documentType: 'GST Certificate', documentName: 'GlobalLogistics_GSTIN_2026.pdf',
    uploadedBy: 'Lata Nair', uploadedAt: '2026-03-01T11:00:00Z', version: 'v1.3'
  },
  {
    documentId: 5, vendorId: 2, vendorName: 'Global Logistics & Freight',
    documentType: 'Insurance', documentName: 'GlobalLogistics_Cargo_Insurance_2026.pdf',
    uploadedBy: 'Lata Nair', uploadedAt: '2026-03-01T11:10:00Z', version: 'v1.0'
  },
  {
    documentId: 6, vendorId: 2, vendorName: 'Global Logistics & Freight',
    documentType: 'Business License', documentName: 'GlobalLogistics_Transport_License.pdf',
    uploadedBy: 'Rohan Verma', uploadedAt: '2026-01-20T14:00:00Z', version: 'v1.0'
  },
  {
    documentId: 7, vendorId: 5, vendorName: 'EquipMax Machinery Ltd',
    documentType: 'PAN Card', documentName: 'EquipMax_PAN_Card.pdf',
    uploadedBy: 'Lata Nair', uploadedAt: '2026-02-10T09:00:00Z', version: 'v1.0'
  },
  {
    documentId: 8, vendorId: 5, vendorName: 'EquipMax Machinery Ltd',
    documentType: 'Product Catalog', documentName: 'EquipMax_Machinery_Catalog_2026.pdf',
    uploadedBy: 'Rohan Verma', uploadedAt: '2026-02-15T10:00:00Z', version: 'v3.2'
  },
  {
    documentId: 9, vendorId: 9, vendorName: 'NovaSec Systems Pvt Ltd',
    documentType: 'NDA', documentName: 'NovaSec_NDA_Executed.pdf',
    uploadedBy: 'Hrithik', uploadedAt: '2026-04-01T08:00:00Z', version: 'v1.0'
  },
  {
    documentId: 10, vendorId: 9, vendorName: 'NovaSec Systems Pvt Ltd',
    documentType: 'Service Agreement', documentName: 'NovaSec_SOC_Service_Agreement.pdf',
    uploadedBy: 'Hrithik', uploadedAt: '2026-04-01T08:30:00Z', version: 'v1.2'
  },
  {
    documentId: 11, vendorId: 10, vendorName: 'SafeGuard Industries',
    documentType: 'GST Certificate', documentName: 'SafeGuard_GSTIN_2026.pdf',
    uploadedBy: 'Lata Nair', uploadedAt: '2026-01-10T09:00:00Z', version: 'v1.1'
  },
  {
    documentId: 12, vendorId: 10, vendorName: 'SafeGuard Industries',
    documentType: 'Insurance', documentName: 'SafeGuard_Liability_Insurance.pdf',
    uploadedBy: 'Lata Nair', uploadedAt: '2026-01-10T09:15:00Z', version: 'v1.0'
  },
  {
    documentId: 13, vendorId: 4, vendorName: 'Zenith Office Supplies',
    documentType: 'Bank Details', documentName: 'Zenith_Bank_Mandate_2026.pdf',
    uploadedBy: 'Hrithik', uploadedAt: '2026-02-01T10:00:00Z', version: 'v1.0'
  },
  {
    documentId: 14, vendorId: 4, vendorName: 'Zenith Office Supplies',
    documentType: 'Product Catalog', documentName: 'Zenith_OfficeSupplies_Catalogue_2026.pdf',
    uploadedBy: 'Hrithik', uploadedAt: '2026-03-15T11:00:00Z', version: 'v4.0'
  },
  {
    documentId: 15, vendorId: 11, vendorName: 'Infra Build & Civil Co.',
    documentType: 'Company Registration', documentName: 'InfraBuild_ROC_Certificate.pdf',
    uploadedBy: 'Rohan Verma', uploadedAt: '2026-01-05T09:00:00Z', version: 'v1.0'
  },
  {
    documentId: 16, vendorId: 12, vendorName: 'PrintMaster Communications',
    documentType: 'GST Certificate', documentName: 'PrintMaster_GSTIN_2026.pdf',
    uploadedBy: 'Lata Nair', uploadedAt: '2026-02-20T10:00:00Z', version: 'v1.2'
  },
  {
    documentId: 17, vendorId: 12, vendorName: 'PrintMaster Communications',
    documentType: 'Quality Certificate', documentName: 'PrintMaster_FSC_CoC_2025.pdf',
    uploadedBy: 'Lata Nair', uploadedAt: '2026-04-05T11:00:00Z', version: 'v1.0'
  },
];

// Contract renewal history for 2 contracts
const SEED_RENEWALS: ContractRenewal[] = [
  {
    renewalId: 1,
    contractId: 10,
    contractNumber: 'CT-2026-0008',
    vendorName: 'Global Logistics & Freight',
    oldEndDate: dateOffset(-30),
    newEndDate: dateOffset(335),
    renewedBy: 'Rohan Verma',
    renewalDate: dateOffset(-30),
    remarks: 'Renewed for FY2026-27. 5% rate increment applied as per clause 8.2.'
  },
  {
    renewalId: 2,
    contractId: 11,
    contractNumber: 'CT-2026-0009',
    vendorName: 'TechCorp Solutions Pvt Ltd',
    oldEndDate: dateOffset(-10),
    newEndDate: dateOffset(355),
    renewedBy: 'Hrithik',
    renewalDate: dateOffset(-10),
    remarks: 'Annual license renewal. Added 2 additional seats per revised headcount.'
  },
];

// ─── Mutable In-Memory Store ─────────────────────────────────────────────────

let CONTRACTS: Contract[] = SEED_CONTRACTS.map(c => ({ ...c }));
let CERTIFICATIONS: Certification[] = SEED_CERTIFICATIONS.map(c => ({ ...c }));
let COMPLIANCE: ComplianceRecord[] = SEED_COMPLIANCE.map(c => ({ ...c }));
let DOCUMENTS: VendorDocument[] = SEED_DOCUMENTS.map(d => ({ ...d }));
let RENEWALS: ContractRenewal[] = SEED_RENEWALS.map(r => ({ ...r }));
let NOTIFICATIONS: ContractNotification[] = [];

let nextContractId = 100;
let nextCertId = 100;
let nextDocId = 100;
let nextNotifId = 1;

// ─── Expiry Monitoring Engine ─────────────────────────────────────────────────
/**
 * Simulates the planned backend daily cron job.
 * Runs on service init and after every write operation.
 * Thresholds → Severity mapping:
 *   ≤ 0 days  → Critical  (already expired)
 *   1–7 days  → Critical
 *   8–30 days → Warning
 *   31-90 days → Info
 */
function runExpiryMonitoring() {
  // Step 1: Recompute daysToExpiry and auto-flip contract statuses.
  CONTRACTS = CONTRACTS.map(contract => {
    const days = daysFromToday(contract.endDate);
    const updatedDays = days;

    let updatedStatus: ContractStatus = contract.status;
    // Only auto-expire Active and Renewed contracts
    if ((contract.status === 'Active' || contract.status === 'Renewed') && days < 0) {
      updatedStatus = 'Expired';
    }

    return { ...contract, daysToExpiry: updatedDays, status: updatedStatus };
  });

  // Step 2: Recompute daysToExpiry and auto-flip certification statuses.
  CERTIFICATIONS = CERTIFICATIONS.map(cert => {
    const days = daysFromToday(cert.expiryDate);
    let status: CertificationStatus = 'Valid';
    if (days < 0) {
      status = 'Expired';
    } else if (days <= 30) {
      status = 'Expiring Soon';
    }
    return { ...cert, daysToExpiry: days, status };
  });

  // Step 3: Generate notifications (deduplicate by referenceNumber + type)
  const existingRefs = new Set(NOTIFICATIONS.map(n => `${n.type}__${n.referenceNumber}`));
  const newNotifs: ContractNotification[] = [];

  // Contract expiry notifications
  CONTRACTS.forEach(contract => {
    if (contract.status === 'Draft' || contract.status === 'Terminated') return;
    const days = contract.daysToExpiry;

    const shouldNotify =
      (days <= 90 && days >= 0 && contract.status !== 'Expired') || days < 0;

    if (!shouldNotify) return;

    const key = `Contract Expiry__${contract.contractNumber}`;
    if (existingRefs.has(key)) return;

    let severity: 'Info' | 'Warning' | 'Critical' = 'Info';
    if (days <= 0) severity = 'Critical';
    else if (days <= 7) severity = 'Critical';
    else if (days <= 30) severity = 'Warning';

    newNotifs.push({
      notificationId: nextNotifId++,
      type: 'Contract Expiry',
      referenceNumber: contract.contractNumber,
      vendorName: contract.vendorName,
      expiryDate: contract.endDate,
      remainingDays: days,
      renewalStatus: days < 0 ? 'Renewal Overdue' : days <= 7 ? 'Renewal Critical' : 'Renewal Pending',
      severity,
      createdAt: isoNow(),
      read: false,
    });
    existingRefs.add(key);
  });

  // Certification expiry notifications
  CERTIFICATIONS.forEach(cert => {
    if (cert.status === 'Valid' && cert.daysToExpiry > 30) return;
    const days = cert.daysToExpiry;
    const key = `Certification Expiry__${cert.certificateNumber}`;
    if (existingRefs.has(key)) return;

    let severity: 'Info' | 'Warning' | 'Critical' = 'Warning';
    if (days <= 0) severity = 'Critical';
    else if (days <= 7) severity = 'Critical';
    else if (days <= 30) severity = 'Warning';

    newNotifs.push({
      notificationId: nextNotifId++,
      type: 'Certification Expiry',
      referenceNumber: cert.certificateNumber,
      vendorName: cert.vendorName,
      expiryDate: cert.expiryDate,
      remainingDays: days,
      renewalStatus: days < 0 ? 'Certificate Expired' : 'Renewal Required',
      severity,
      createdAt: isoNow(),
      read: false,
    });
    existingRefs.add(key);
  });

  // Compliance alert notifications for Non-Compliant and Expired
  COMPLIANCE.forEach(rec => {
    if (rec.complianceStatus !== 'Non-Compliant' && rec.complianceStatus !== 'Expired') return;
    const key = `Compliance Alert__${rec.vendorId}-${rec.requirementName}`;
    if (existingRefs.has(key)) return;

    newNotifs.push({
      notificationId: nextNotifId++,
      type: 'Compliance Alert',
      referenceNumber: `COMP-${rec.complianceId.toString().padStart(4, '0')}`,
      vendorName: rec.vendorName,
      expiryDate: rec.lastVerifiedDate,
      remainingDays: 0,
      renewalStatus: rec.complianceStatus,
      severity: 'Critical',
      createdAt: isoNow(),
      read: false,
    });
    existingRefs.add(key);
  });

  NOTIFICATIONS = [...newNotifs, ...NOTIFICATIONS];
}

// Run on service initialization
runExpiryMonitoring();

// ─── Simulated network delay ──────────────────────────────────────────────────
function delay<T>(value: T, ms = 80): Observable<T> {
  return new Observable<T>((subscriber) => {
    setTimeout(() => subscriber.next(value), ms);
  });
}

// ─── ContractService ─────────────────────────────────────────────────────────

class ContractService {

  // ── Contracts ────────────────────────────────────────────────────────────────

  getContracts(filters: ContractFilters = {}): Observable<PaginatedContracts> {
    let items = [...CONTRACTS];
    if (filters.status && filters.status !== 'All') {
      items = items.filter(c => c.status === filters.status);
    }
    if (filters.contractType && filters.contractType !== 'All') {
      items = items.filter(c => c.contractType === filters.contractType);
    }
    if (filters.vendorId) {
      items = items.filter(c => c.vendorId === filters.vendorId);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(c =>
        c.contractTitle.toLowerCase().includes(q) ||
        c.contractNumber.toLowerCase().includes(q) ||
        c.vendorName.toLowerCase().includes(q)
      );
    }
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 50;
    const total = items.length;
    items = items.slice((page - 1) * pageSize, page * pageSize);
    return delay({ items, total, page, pageSize });
  }

  getContractById(id: number): Observable<Contract | undefined> {
    return delay(CONTRACTS.find(c => c.contractId === id));
  }

  createContract(payload: Omit<Contract, 'contractId' | 'contractNumber' | 'createdAt' | 'daysToExpiry'>): Observable<Contract> {
    const year = new Date().getFullYear();
    const contractId = nextContractId++;
    const contractNumber = `CT-${year}-${contractId.toString().padStart(4, '0')}`;
    const contract: Contract = {
      ...payload,
      contractId,
      contractNumber,
      createdAt: isoNow(),
      daysToExpiry: daysFromToday(payload.endDate),
    };
    CONTRACTS.push(contract);
    runExpiryMonitoring();
    return delay(contract);
  }

  updateContract(id: number, updates: Partial<Contract>): Observable<Contract | undefined> {
    const idx = CONTRACTS.findIndex(c => c.contractId === id);
    if (idx === -1) return delay(undefined);
    CONTRACTS[idx] = { ...CONTRACTS[idx], ...updates };
    runExpiryMonitoring();
    return delay(CONTRACTS[idx]);
  }

  deleteContract(id: number): Observable<{ success: boolean }> {
    CONTRACTS = CONTRACTS.filter(c => c.contractId !== id);
    runExpiryMonitoring();
    return delay({ success: true });
  }

  renewContract(payload: Omit<ContractRenewal, 'renewalId'>): Observable<ContractRenewal> {
    const renewalId = RENEWALS.length + 1;
    const renewal: ContractRenewal = { renewalId, ...payload };
    RENEWALS.push(renewal);

    // Update the contract
    const idx = CONTRACTS.findIndex(c => c.contractId === payload.contractId);
    if (idx !== -1) {
      CONTRACTS[idx] = {
        ...CONTRACTS[idx],
        endDate: payload.newEndDate,
        status: 'Renewed',
        daysToExpiry: daysFromToday(payload.newEndDate),
      };
    }
    runExpiryMonitoring();
    return delay(renewal);
  }

  getExpiringContracts(withinDays = 90): Observable<Contract[]> {
    const items = CONTRACTS.filter(c =>
      (c.status === 'Active' || c.status === 'Renewed') &&
      c.daysToExpiry >= 0 &&
      c.daysToExpiry <= withinDays
    );
    return delay(items);
  }

  getRenewals(contractId?: number): Observable<ContractRenewal[]> {
    const items = contractId ? RENEWALS.filter(r => r.contractId === contractId) : RENEWALS;
    return delay([...items]);
  }

  // ── Certifications ────────────────────────────────────────────────────────────

  getCertifications(filters: CertificationFilters = {}): Observable<Certification[]> {
    let items = [...CERTIFICATIONS];
    if (filters.status && filters.status !== 'All') {
      items = items.filter(c => c.status === filters.status);
    }
    if (filters.vendorId) {
      items = items.filter(c => c.vendorId === filters.vendorId);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(c =>
        c.certificationName.toLowerCase().includes(q) ||
        c.vendorName.toLowerCase().includes(q) ||
        c.certificateNumber.toLowerCase().includes(q)
      );
    }
    return delay(items);
  }

  addCertification(payload: Omit<Certification, 'certificationId' | 'status' | 'daysToExpiry'>): Observable<Certification> {
    const days = daysFromToday(payload.expiryDate);
    let status: CertificationStatus = 'Valid';
    if (days < 0) status = 'Expired';
    else if (days <= 30) status = 'Expiring Soon';

    const cert: Certification = {
      certificationId: nextCertId++,
      ...payload,
      daysToExpiry: days,
      status,
    };
    CERTIFICATIONS.push(cert);
    runExpiryMonitoring();
    return delay(cert);
  }

  updateCertification(id: number, updates: Partial<Certification>): Observable<Certification | undefined> {
    const idx = CERTIFICATIONS.findIndex(c => c.certificationId === id);
    if (idx === -1) return delay(undefined);
    CERTIFICATIONS[idx] = { ...CERTIFICATIONS[idx], ...updates };
    if (updates.expiryDate) {
      const days = daysFromToday(updates.expiryDate);
      CERTIFICATIONS[idx].daysToExpiry = days;
    }
    runExpiryMonitoring();
    return delay(CERTIFICATIONS[idx]);
  }

  replaceCertificate(id: number, newDocumentName: string, newExpiryDate: string): Observable<Certification | undefined> {
    const idx = CERTIFICATIONS.findIndex(c => c.certificationId === id);
    if (idx === -1) return delay(undefined);
    const days = daysFromToday(newExpiryDate);
    let status: CertificationStatus = 'Valid';
    if (days < 0) status = 'Expired';
    else if (days <= 30) status = 'Expiring Soon';
    CERTIFICATIONS[idx] = { ...CERTIFICATIONS[idx], documentName: newDocumentName, expiryDate: newExpiryDate, daysToExpiry: days, status };
    runExpiryMonitoring();
    return delay(CERTIFICATIONS[idx]);
  }

  // ── Compliance ────────────────────────────────────────────────────────────────

  getComplianceRecords(vendorId?: number): Observable<ComplianceRecord[]> {
    const items = vendorId ? COMPLIANCE.filter(c => c.vendorId === vendorId) : [...COMPLIANCE];
    return delay(items);
  }

  updateComplianceStatus(
    id: number,
    status: ComplianceRecord['complianceStatus'],
    verifiedBy: string,
    remarks: string
  ): Observable<ComplianceRecord | undefined> {
    const idx = COMPLIANCE.findIndex(c => c.complianceId === id);
    if (idx === -1) return delay(undefined);
    COMPLIANCE[idx] = {
      ...COMPLIANCE[idx],
      complianceStatus: status,
      lastVerifiedDate: new Date().toISOString().slice(0, 10),
      verifiedBy,
      remarks,
    };
    runExpiryMonitoring();
    return delay(COMPLIANCE[idx]);
  }

  // ── Vendor Documents ──────────────────────────────────────────────────────────

  getVendorDocuments(filters: DocumentFilters = {}): Observable<VendorDocument[]> {
    let items = [...DOCUMENTS];
    if (filters.vendorId) items = items.filter(d => d.vendorId === filters.vendorId);
    if (filters.documentType && filters.documentType !== 'All') {
      items = items.filter(d => d.documentType === filters.documentType);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(d =>
        d.documentName.toLowerCase().includes(q) || d.vendorName.toLowerCase().includes(q)
      );
    }
    return delay(items);
  }

  uploadDocument(payload: Omit<VendorDocument, 'documentId' | 'uploadedAt'>): Observable<VendorDocument> {
    const doc: VendorDocument = {
      documentId: nextDocId++,
      ...payload,
      uploadedAt: isoNow(),
    };
    DOCUMENTS.push(doc);
    return delay(doc);
  }

  replaceDocument(id: number, newDocumentName: string, uploadedBy: string): Observable<VendorDocument | undefined> {
    const idx = DOCUMENTS.findIndex(d => d.documentId === id);
    if (idx === -1) return delay(undefined);
    const currentVersion = DOCUMENTS[idx].version;
    const majorVersion = parseInt(currentVersion.slice(1)) + 1;
    DOCUMENTS[idx] = {
      ...DOCUMENTS[idx],
      documentName: newDocumentName,
      uploadedBy,
      uploadedAt: isoNow(),
      version: `v${majorVersion}.0`,
    };
    return delay(DOCUMENTS[idx]);
  }

  deleteDocument(id: number): Observable<{ success: boolean }> {
    DOCUMENTS = DOCUMENTS.filter(d => d.documentId !== id);
    return delay({ success: true });
  }

  // ── Notifications ─────────────────────────────────────────────────────────────

  getNotifications(): Observable<ContractNotification[]> {
    return delay([...NOTIFICATIONS].sort((a, b) => b.notificationId - a.notificationId));
  }

  getUnreadCount(): Observable<number> {
    return of(NOTIFICATIONS.filter(n => !n.read).length);
  }

  markNotificationRead(id: number): Observable<{ success: boolean }> {
    const idx = NOTIFICATIONS.findIndex(n => n.notificationId === id);
    if (idx !== -1) NOTIFICATIONS[idx].read = true;
    return of({ success: true });
  }

  markAllRead(): Observable<{ success: boolean }> {
    NOTIFICATIONS = NOTIFICATIONS.map(n => ({ ...n, read: true }));
    return of({ success: true });
  }

  /** Synchronously read unread count (for UI badge — no async needed) */
  getUnreadCountSync(): number {
    return NOTIFICATIONS.filter(n => !n.read).length;
  }

  // ── Summary Metrics ───────────────────────────────────────────────────────────

  getContractSummaryMetrics(): Observable<ContractSummaryMetrics> {
    const totalContracts = CONTRACTS.length;
    const activeContracts = CONTRACTS.filter(c => c.status === 'Active' || c.status === 'Renewed').length;
    const expiringContracts = CONTRACTS.filter(c => (c.status === 'Active' || c.status === 'Renewed') && c.daysToExpiry >= 0 && c.daysToExpiry <= 30).length;
    const expiredContracts = CONTRACTS.filter(c => c.status === 'Expired' || c.daysToExpiry < 0).length;

    const totalCertifications = CERTIFICATIONS.length;
    const expiredCertifications = CERTIFICATIONS.filter(c => c.status === 'Expired' || c.daysToExpiry < 0).length;

    const totalComp = COMPLIANCE.length;
    const compliantCount = COMPLIANCE.filter(c => c.complianceStatus === 'Compliant').length;
    const compliancePercentage = totalComp > 0 ? Math.round((compliantCount / totalComp) * 100) : 100;

    return delay({
      totalContracts,
      activeContracts,
      expiringContracts,
      expiredContracts,
      totalCertifications,
      expiredCertifications,
      compliancePercentage,
    });
  }

  /** Synchronously read summary metrics for multi-module dashboard composition */
  getContractSummaryMetricsSync(): ContractSummaryMetrics {
    const totalContracts = CONTRACTS.length;
    const activeContracts = CONTRACTS.filter(c => c.status === 'Active' || c.status === 'Renewed').length;
    const expiringContracts = CONTRACTS.filter(c => (c.status === 'Active' || c.status === 'Renewed') && c.daysToExpiry >= 0 && c.daysToExpiry <= 30).length;
    const expiredContracts = CONTRACTS.filter(c => c.status === 'Expired' || c.daysToExpiry < 0).length;
    const totalCertifications = CERTIFICATIONS.length;
    const expiredCertifications = CERTIFICATIONS.filter(c => c.status === 'Expired' || c.daysToExpiry < 0).length;
    const totalComp = COMPLIANCE.length;
    const compliantCount = COMPLIANCE.filter(c => c.complianceStatus === 'Compliant').length;
    const compliancePercentage = totalComp > 0 ? Math.round((compliantCount / totalComp) * 100) : 100;

    return {
      totalContracts,
      activeContracts,
      expiringContracts,
      expiredContracts,
      totalCertifications,
      expiredCertifications,
      compliancePercentage,
    };
  }
}

export const contractService = new ContractService();

