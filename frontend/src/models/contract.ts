/**
 * Module 6: Contract & Compliance Management
 * Data structures for contracts, certifications, compliance records,
 * vendor documents, renewals, and contract notifications.
 *
 * Frontend-only mock structures. Swapping in real HTTP/REST API calls
 * requires editing only contractService.ts — these interfaces remain unchanged.
 */

// ── Contract ─────────────────────────────────────────────────────────────────

export type ContractStatus = 'Draft' | 'Active' | 'Expired' | 'Renewed' | 'Terminated';
export type ContractType =
  | 'Fixed Price'
  | 'Time & Materials'
  | 'Service Agreement'
  | 'Supply Agreement'
  | 'AMC'
  | 'NDA'
  | 'Maintenance Contract'
  | 'License Agreement'
  | 'Framework Contract'
  | 'SLA Agreement';

export interface Contract {
  contractId: number;
  contractNumber: string;        // format: CT-YYYY-XXXX
  contractTitle: string;
  vendorId: number;
  vendorName: string;
  contractType: ContractType;
  procurementCategory: string;
  startDate: string;             // ISO date string
  endDate: string;               // ISO date string
  contractValue: number;         // in INR
  paymentTerms: string;
  sla: string;                   // SLA description
  warrantyDetails: string;
  responsibleManager: string;
  status: ContractStatus;
  documentName: string;
  linkedProcurementNumbers: string[];
  createdAt: string;             // ISO datetime string
  daysToExpiry: number;          // computed: negative = already expired
}

// ── Contract Renewal ──────────────────────────────────────────────────────────

export interface ContractRenewal {
  renewalId: number;
  contractId: number;
  contractNumber: string;
  vendorName: string;
  oldEndDate: string;
  newEndDate: string;
  renewedBy: string;
  renewalDate: string;
  remarks: string;
}

// ── Certification ─────────────────────────────────────────────────────────────

export type CertificationStatus = 'Valid' | 'Expiring Soon' | 'Expired';

export interface Certification {
  certificationId: number;
  vendorId: number;
  vendorName: string;
  certificationName: string;
  certificateNumber: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  documentName: string;
  status: CertificationStatus;
  daysToExpiry: number;          // computed: negative = already expired
}

// ── Compliance Record ─────────────────────────────────────────────────────────

export type ComplianceStatus =
  | 'Compliant'
  | 'Pending Verification'
  | 'Non-Compliant'
  | 'Expired';

export interface ComplianceRecord {
  complianceId: number;
  vendorId: number;
  vendorName: string;
  requirementName: string;       // e.g. 'GST Registration', 'ISO Quality Standards'
  complianceStatus: ComplianceStatus;
  lastVerifiedDate: string;
  verifiedBy: string;
  remarks: string;
}

// ── Vendor Document ───────────────────────────────────────────────────────────

export type VendorDocumentType =
  | 'GST Certificate'
  | 'PAN Card'
  | 'Company Registration'
  | 'Business License'
  | 'Bank Details'
  | 'Insurance'
  | 'Product Catalog'
  | 'NDA'
  | 'Service Agreement'
  | 'Quality Certificate';

export interface VendorDocument {
  documentId: number;
  vendorId: number;
  vendorName: string;
  documentType: VendorDocumentType;
  documentName: string;
  uploadedBy: string;
  uploadedAt: string;            // ISO datetime string
  version: string;               // e.g. 'v1.0', 'v2.3'
}

// ── Contract Notification ─────────────────────────────────────────────────────

export type ContractNotificationType =
  | 'Contract Expiry'
  | 'Certification Expiry'
  | 'Compliance Alert';

export type NotificationSeverity = 'Info' | 'Warning' | 'Critical';

export interface ContractNotification {
  notificationId: number;
  type: ContractNotificationType;
  /** Contract number or certificate number */
  referenceNumber: string;
  vendorName: string;
  expiryDate: string;
  remainingDays: number;         // negative = already expired
  renewalStatus: string;         // e.g. 'Renewal Pending', 'Auto-Flagged', 'Renewed'
  severity: NotificationSeverity;
  createdAt: string;             // ISO datetime string
  read: boolean;
}

// ── Service Filter/Pagination types ──────────────────────────────────────────

export interface ContractFilters {
  status?: ContractStatus | 'All';
  contractType?: ContractType | 'All';
  vendorId?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CertificationFilters {
  status?: CertificationStatus | 'All';
  vendorId?: number;
  search?: string;
}

export interface DocumentFilters {
  vendorId?: number;
  documentType?: VendorDocumentType | 'All';
  search?: string;
}

export interface PaginatedContracts {
  items: Contract[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ContractSummaryMetrics {
  totalContracts: number;
  activeContracts: number;
  expiringContracts: number;
  expiredContracts: number;
  totalCertifications: number;
  expiredCertifications: number;
  compliancePercentage: number;
}

