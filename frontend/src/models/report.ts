/**
 * Report Models — Module 10: Reports & Export
 * =============================================
 * Type definitions for all report-related interfaces, filter shapes,
 * and result structures. Mirrors the future FastAPI response schemas
 * so backend swap requires only service-layer changes.
 */

// ─── Report Type Enum ────────────────────────────────────────────────────────

export type ReportType =
  | 'vendor-performance'
  | 'procurement'
  | 'purchase-order'
  | 'compliance'
  | 'contract'
  | 'executive-summary';

// ─── Filter Definitions ──────────────────────────────────────────────────────

export type DatePreset = 'last-30' | 'last-quarter' | 'last-6-months' | 'ytd' | 'custom';

export type VendorCategory =
  | 'Raw Material Suppliers'
  | 'Equipment Vendors'
  | 'IT Vendors'
  | 'Service Providers'
  | 'Logistics Partners'
  | 'Maintenance Vendors';

export type DepartmentName =
  | 'Manufacturing'
  | 'IT'
  | 'Logistics'
  | 'Finance'
  | 'Operations'
  | 'Maintenance'
  | 'Engineering'
  | 'Facilities'
  | 'Warehouse'
  | 'Product'
  | 'Marketing'
  | 'Security'
  | 'Admin'
  | 'Health & Safety'
  | 'Design';

export type ProcurementStatus =
  | 'Pending'
  | 'Approved'
  | 'Ordered'
  | 'Delivered'
  | 'Completed'
  | 'Cancelled';

export type POStatus =
  | 'Draft'
  | 'Issued'
  | 'In Transit'
  | 'Fulfilled'
  | 'Delayed'
  | 'Cancelled'
  | 'Awaiting Shipment';

export type ContractStatusFilter =
  | 'Active'
  | 'Expiring Soon'
  | 'Expired'
  | 'Renewed'
  | 'Terminated'
  | 'Draft';

export type ComplianceStatusFilter =
  | 'Compliant'
  | 'Non-Compliant'
  | 'Pending Verification'
  | 'Expired';

/** Universal filters object accepted by all report service methods */
export interface ReportFilters {
  reportType: ReportType;
  datePreset?: DatePreset;
  startDate?: string;   // ISO date string: YYYY-MM-DD
  endDate?: string;     // ISO date string: YYYY-MM-DD
  vendorCategory?: VendorCategory | '';
  departments?: DepartmentName[];
  procurementStatus?: ProcurementStatus | '';
  vendorName?: string;
  poStatus?: POStatus | '';
  contractStatus?: ContractStatusFilter | '';
  complianceStatus?: ComplianceStatusFilter | '';
  reliabilityScoreMin?: number;
  reliabilityScoreMax?: number;
}

export const DEFAULT_FILTERS: Omit<ReportFilters, 'reportType'> = {
  datePreset: 'last-6-months',
  startDate: '',
  endDate: '',
  vendorCategory: '',
  departments: [],
  procurementStatus: '',
  vendorName: '',
  poStatus: '',
  contractStatus: '',
  complianceStatus: '',
  reliabilityScoreMin: 0,
  reliabilityScoreMax: 100,
};

// ─── Applied Filter Chip ─────────────────────────────────────────────────────

export interface AppliedFilterChip {
  key: keyof ReportFilters;
  label: string;
  value: string;
}

// ─── Report Card Metadata ────────────────────────────────────────────────────

export interface ReportConfig {
  id: ReportType;
  title: string;
  description: string;
  keyMetrics: string[];
  icon: string;           // Lucide icon name
  color: string;          // Accent color hex
  bg: string;             // Card background tint
  /** Which roles can see this report type */
  allowedRoles: string[];
  /** Context-aware filter keys shown for this report */
  applicableFilters: Array<keyof ReportFilters>;
}

// ─── Recently Generated Report History ─────────────────────────────────────

export type ReportHistoryStatus = 'Completed' | 'Processing' | 'Failed';

export interface RecentReport {
  id: string;
  reportType: ReportType;
  reportTitle: string;
  generatedBy: string;
  generatedAt: string;    // ISO datetime string
  filters: Partial<ReportFilters>;
  status: ReportHistoryStatus;
  recordCount: number;
  fileSizeKB?: number;
}

// ─── Report Result Wrappers ──────────────────────────────────────────────────

export interface ReportMeta {
  reportType: ReportType;
  title: string;
  generatedAt: string;
  filters: ReportFilters;
  recordCount: number;
  dateRange: { from: string; to: string };
}

// ─── Vendor Performance Report ───────────────────────────────────────────────

export interface VendorPerformanceRow {
  vendorId: number;
  vendorName: string;
  category: string;
  reliabilityScore: number;
  deliveryScore: number;
  qualityScore: number;
  communicationScore: number;
  complianceScore: number;
  totalPOs: number;
  onTimeDeliveryRate: number;
  avgResponseTimeHours: number;
  riskLevel: 'Low Risk' | 'Medium Risk' | 'High Risk';
}

export interface VendorPerformanceReportResult {
  meta: ReportMeta;
  summary: {
    totalVendors: number;
    avgReliabilityScore: number;
    avgQualityScore: number;
    topPerformer: string;
    highRiskCount: number;
    onTimeDeliveryAvg: number;
  };
  topByReliability: { vendorName: string; reliabilityScore: number; category: string }[];
  deliveryComparison: { vendorName: string; onTime: number; delayed: number }[];
  insights: string[];
  rows: VendorPerformanceRow[];
}

// ─── Procurement Report ──────────────────────────────────────────────────────

export interface ProcurementRow {
  requestId: string;
  requestTitle: string;
  department: string;
  category: string;
  status: string;
  priority: string;
  estimatedBudget: number;
  assignedVendor: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProcurementReportResult {
  meta: ReportMeta;
  summary: {
    totalRequests: number;
    totalBudget: number;
    approvedCount: number;
    pendingCount: number;
    cancelledCount: number;
    completedCount: number;
    avgProcessingDays: number;
  };
  byDepartment: { department: string; count: number; approved: number; rejected: number; budget: number; avgDays: number }[];
  byStatus: { status: string; count: number; percentage: number }[];
  byMonth: { month: string; requests: number; completed: number; spend: number }[];
  insights: string[];
  rows: ProcurementRow[];
}

// ─── Purchase Order Report ───────────────────────────────────────────────────

export interface PurchaseOrderRow {
  poId: string;
  poNumber: string;
  vendorName: string;
  vendorCategory: string;
  totalCost: number;
  status: string;
  poDate: string;
  expectedDeliveryDate: string;
  department: string;
  paymentStatus: string;
}

export interface PurchaseOrderReportResult {
  meta: ReportMeta;
  summary: {
    totalPOs: number;
    totalValue: number;
    avgOrderValue: number;
    fulfilledCount: number;
    delayedCount: number;
    cancelledCount: number;
    pendingPaymentValue: number;
  };
  byMonth: { month: string; count: number; value: number }[];
  byVendor: { vendorName: string; count: number; value: number }[];
  byStatus: { status: string; count: number; value: number }[];
  insights: string[];
  rows: PurchaseOrderRow[];
}

// ─── Compliance Report ───────────────────────────────────────────────────────

export interface ComplianceRow {
  vendorId: number;
  vendorName: string;
  category: string;
  requirementName: string;
  status: string;
  lastVerifiedDate: string;
  verifiedBy: string;
  remarks: string;
}

export interface ComplianceVendorSummary {
  vendorId: number;
  vendorName: string;
  category: string;
  totalChecks: number;
  compliantCount: number;
  complianceRate: number;
  hasExpired: boolean;
  hasMissing: boolean;
  pendingCount: number;
}

export interface ComplianceReportResult {
  meta: ReportMeta;
  summary: {
    totalRecords: number;
    compliantCount: number;
    nonCompliantCount: number;
    pendingCount: number;
    expiredCount: number;
    complianceRate: number;
    compliantVendors: number;
    totalVendors: number;
  };
  byStatus: { status: string; count: number; percentage: number }[];
  byCategory: { category: string; compliant: number; nonCompliant: number; total: number }[];
  byVendor: ComplianceVendorSummary[];
  insights: string[];
  rows: ComplianceRow[];
}

// ─── Contract Report ─────────────────────────────────────────────────────────

export interface ContractRow {
  contractId: number;
  contractNumber: string;
  contractTitle: string;
  vendorName: string;
  category: string;
  status: string;
  startDate: string;
  endDate: string;
  contractValue: number;
  daysToExpiry: number;
  responsibleManager: string;
}

export interface ContractReportResult {
  meta: ReportMeta;
  summary: {
    totalContracts: number;
    totalValue: number;
    activeCount: number;
    expiredCount: number;
    expiringIn30Days: number;
    expiringIn90Days: number;
    avgContractValue: number;
    renewalRate: number;
  };
  byStatus: { status: string; count: number; value: number }[];
  byCategory: { category: string; count: number; value: number }[];
  expiryTimeline: { window: string; count: number }[];
  expiringByMonth: { month: string; count: number }[];
  insights: string[];
  rows: ContractRow[];
}

// ─── Executive Summary Report ────────────────────────────────────────────────

export interface ExecutiveSummaryReportResult {
  meta: ReportMeta;
  vendorKPIs: {
    totalVendors: number;
    activeVendors: number;
    avgReliabilityScore: number;
    highRiskVendors: number;
    newVendorsThisPeriod: number;
  };
  procurementKPIs: {
    totalRequests: number;
    totalBudget: number;
    avgApprovalDays: number;
    completionRate: number;
  };
  poKPIs: {
    totalPOs: number;
    totalSpend: number;
    onTimeDeliveryRate: number;
    pendingPaymentValue: number;
    delayedCount: number;
  };
  contractKPIs: {
    totalContracts: number;
    totalContractValue: number;
    expiringIn30Days: number;
    renewalRate: number;
  };
  complianceKPIs: {
    overallComplianceRate: number;
    nonCompliantVendors: number;
    pendingVerifications: number;
  };
  topVendors: { vendorName: string; score: number; category: string }[];
  riskSummary: { level: string; count: number; color: string }[];
  monthlyTrend: { month: string; requests: number; spend: number }[];
  insights: string[];
}
