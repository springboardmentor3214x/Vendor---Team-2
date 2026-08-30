/**
 * ReportService — Module 10: Reports & Export
 * =============================================
 * Aggregates data from Modules 2–9 mock datasets.
 * Each method mirrors a future FastAPI endpoint signature.
 * Replace method bodies with HTTP calls to connect to real backend.
 *
 * GET /reports/vendor-performance  → getVendorPerformanceReport(filters)
 * GET /reports/procurement         → getProcurementReport(filters)
 * GET /reports/purchase-orders     → getPurchaseOrderReport(filters)
 * GET /reports/compliance          → getComplianceReport(filters)
 * GET /reports/contracts           → getContractReport(filters)
 * GET /reports/executive-summary   → getExecutiveSummaryReport(filters)
 * GET /reports/history             → getRecentReports()
 */

import type {
  ReportFilters, RecentReport,
  VendorPerformanceReportResult, VendorPerformanceRow,
  ProcurementReportResult, ProcurementRow,
  PurchaseOrderReportResult, PurchaseOrderRow,
  ComplianceReportResult, ComplianceRow, ComplianceVendorSummary,
  ContractReportResult, ContractRow,
  ExecutiveSummaryReportResult,
  ReportMeta,
} from '../models/report';

// ─── Utility ─────────────────────────────────────────────────────────────────

const delay = <T>(data: T, ms = 600): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(data), ms));

function isoNow() { return new Date().toISOString(); }

function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function monthLabel(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
}

function inRange(dateStr: string, from: string, to: string): boolean {
  if (!dateStr) return true;
  const d = new Date(dateStr).getTime();
  const f = from ? new Date(from).getTime() : 0;
  const t = to ? new Date(to).getTime() : Infinity;
  return d >= f && d <= t;
}

function resolveRange(filters: Partial<ReportFilters>): { from: string; to: string } {
  if (filters.startDate && filters.endDate) {
    return { from: filters.startDate, to: filters.endDate };
  }
  const preset = filters.datePreset || 'last-6-months';
  const today = new Date();
  let from = '', to = today.toISOString().slice(0, 10);
  if (preset === 'last-30') { from = dateOffset(-30); }
  else if (preset === 'last-quarter') { from = dateOffset(-90); }
  else if (preset === 'last-6-months') { from = dateOffset(-180); }
  else if (preset === 'ytd') {
    from = `${today.getFullYear()}-01-01`;
  } else {
    from = dateOffset(-365);
  }
  return { from, to };
}

// ─── Rich Mock Vendor Master (30 vendors across 6 categories) ────────────────

interface MockVendor {
  id: number; name: string; category: string;
  reliabilityScore: number; deliveryScore: number;
  qualityScore: number; communicationScore: number; complianceScore: number;
  status: string; city: string;
}

const MOCK_VENDORS: MockVendor[] = [
  // IT Vendors
  { id: 1,  name: 'TechCorp Solutions Pvt Ltd',    category: 'IT Vendors',              reliabilityScore: 94, deliveryScore: 96, qualityScore: 92, communicationScore: 95, complianceScore: 98, status: 'Active',    city: 'Pune' },
  { id: 2,  name: 'NovaSec Systems Pvt Ltd',       category: 'IT Vendors',              reliabilityScore: 82, deliveryScore: 84, qualityScore: 80, communicationScore: 85, complianceScore: 88, status: 'Active',    city: 'Mumbai' },
  { id: 3,  name: 'DataBridge Technologies',       category: 'IT Vendors',              reliabilityScore: 78, deliveryScore: 76, qualityScore: 80, communicationScore: 79, complianceScore: 82, status: 'Active',    city: 'Bengaluru' },
  { id: 4,  name: 'CloudAxis Infratech',           category: 'IT Vendors',              reliabilityScore: 71, deliveryScore: 68, qualityScore: 73, communicationScore: 72, complianceScore: 75, status: 'Active',    city: 'Hyderabad' },
  { id: 5,  name: 'SoftSolutions Inc',             category: 'IT Vendors',              reliabilityScore: 55, deliveryScore: 52, qualityScore: 58, communicationScore: 50, complianceScore: 60, status: 'Rejected',  city: 'Mumbai' },
  // Equipment Vendors
  { id: 6,  name: 'EquipMax Machinery Ltd',        category: 'Equipment Vendors',       reliabilityScore: 58, deliveryScore: 52, qualityScore: 60, communicationScore: 48, complianceScore: 62, status: 'Suspended', city: 'Hyderabad' },
  { id: 7,  name: 'PrecisionTech Equipments',      category: 'Equipment Vendors',       reliabilityScore: 85, deliveryScore: 88, qualityScore: 84, communicationScore: 82, complianceScore: 87, status: 'Active',    city: 'Pune' },
  { id: 8,  name: 'HeavyLift Industries',          category: 'Equipment Vendors',       reliabilityScore: 76, deliveryScore: 78, qualityScore: 74, communicationScore: 75, complianceScore: 79, status: 'Active',    city: 'Chennai' },
  { id: 9,  name: 'MechMaster Engineering',        category: 'Equipment Vendors',       reliabilityScore: 69, deliveryScore: 65, qualityScore: 70, communicationScore: 68, complianceScore: 72, status: 'Active',    city: 'Ahmedabad' },
  // Raw Material Suppliers
  { id: 10, name: 'SteelPlus Raw Materials',       category: 'Raw Material Suppliers',  reliabilityScore: 88, deliveryScore: 90, qualityScore: 86, communicationScore: 87, complianceScore: 91, status: 'Active',    city: 'Surat' },
  { id: 11, name: 'CrystalChem Supplies',          category: 'Raw Material Suppliers',  reliabilityScore: 80, deliveryScore: 82, qualityScore: 79, communicationScore: 78, complianceScore: 83, status: 'Active',    city: 'Vadodara' },
  { id: 12, name: 'AgriRaw Commodities',           category: 'Raw Material Suppliers',  reliabilityScore: 73, deliveryScore: 70, qualityScore: 75, communicationScore: 74, complianceScore: 76, status: 'Active',    city: 'Nagpur' },
  { id: 13, name: 'PolymerCore India',             category: 'Raw Material Suppliers',  reliabilityScore: 64, deliveryScore: 60, qualityScore: 68, communicationScore: 62, complianceScore: 67, status: 'Active',    city: 'Jaipur' },
  { id: 14, name: 'BuildRaw Composites',           category: 'Raw Material Suppliers',  reliabilityScore: 45, deliveryScore: 42, qualityScore: 48, communicationScore: 44, complianceScore: 46, status: 'Suspended', city: 'Delhi' },
  // Service Providers
  { id: 15, name: 'Zenith Office Supplies',        category: 'Service Providers',       reliabilityScore: 91, deliveryScore: 93, qualityScore: 90, communicationScore: 92, complianceScore: 95, status: 'Active',    city: 'Chennai' },
  { id: 16, name: 'Infra Build & Civil Co.',       category: 'Service Providers',       reliabilityScore: 86, deliveryScore: 88, qualityScore: 85, communicationScore: 82, complianceScore: 89, status: 'Active',    city: 'Delhi' },
  { id: 17, name: 'BuildRight Construction',       category: 'Service Providers',       reliabilityScore: 63, deliveryScore: 65, qualityScore: 60, communicationScore: 62, complianceScore: 65, status: 'Pending',   city: 'Ahmedabad' },
  { id: 18, name: 'PrintMaster Communications',   category: 'Service Providers',       reliabilityScore: 82, deliveryScore: 84, qualityScore: 82, communicationScore: 80, complianceScore: 85, status: 'Active',    city: 'Pune' },
  { id: 19, name: 'FacilitiesFirst Services',     category: 'Service Providers',       reliabilityScore: 77, deliveryScore: 79, qualityScore: 76, communicationScore: 75, complianceScore: 80, status: 'Active',    city: 'Bengaluru' },
  // Logistics Partners
  { id: 20, name: 'Global Logistics & Freight',   category: 'Logistics Partners',      reliabilityScore: 87, deliveryScore: 88, qualityScore: 84, communicationScore: 84, complianceScore: 92, status: 'Active',    city: 'Bengaluru' },
  { id: 21, name: 'SwiftMove Logistics',           category: 'Logistics Partners',      reliabilityScore: 83, deliveryScore: 85, qualityScore: 82, communicationScore: 82, complianceScore: 86, status: 'Active',    city: 'Mumbai' },
  { id: 22, name: 'QuickShip India',              category: 'Logistics Partners',      reliabilityScore: 74, deliveryScore: 76, qualityScore: 72, communicationScore: 73, complianceScore: 77, status: 'Active',    city: 'Ahmedabad' },
  { id: 23, name: 'CargoLink Pvt Ltd',            category: 'Logistics Partners',      reliabilityScore: 66, deliveryScore: 63, qualityScore: 68, communicationScore: 65, complianceScore: 70, status: 'Active',    city: 'Chennai' },
  { id: 24, name: 'ExpressFreight Solutions',     category: 'Logistics Partners',      reliabilityScore: 59, deliveryScore: 55, qualityScore: 61, communicationScore: 57, complianceScore: 62, status: 'Active',    city: 'Delhi' },
  // Maintenance Vendors
  { id: 25, name: 'SafeGuard Industries',         category: 'Maintenance Vendors',     reliabilityScore: 52, deliveryScore: 50, qualityScore: 54, communicationScore: 48, complianceScore: 55, status: 'Active',    city: 'Kochi' },
  { id: 26, name: 'ProMaint Services',            category: 'Maintenance Vendors',     reliabilityScore: 84, deliveryScore: 86, qualityScore: 83, communicationScore: 82, complianceScore: 87, status: 'Active',    city: 'Pune' },
  { id: 27, name: 'TechServ Maintenance',         category: 'Maintenance Vendors',     reliabilityScore: 79, deliveryScore: 80, qualityScore: 78, communicationScore: 77, complianceScore: 82, status: 'Active',    city: 'Hyderabad' },
  { id: 28, name: 'FixItFast Engineering',        category: 'Maintenance Vendors',     reliabilityScore: 68, deliveryScore: 65, qualityScore: 70, communicationScore: 66, complianceScore: 72, status: 'Active',    city: 'Nashik' },
  { id: 29, name: 'OmniRepair Systems',           category: 'Maintenance Vendors',     reliabilityScore: 61, deliveryScore: 58, qualityScore: 63, communicationScore: 60, complianceScore: 65, status: 'Active',    city: 'Coimbatore' },
  { id: 30, name: 'EliteCare Solutions',          category: 'Maintenance Vendors',     reliabilityScore: 90, deliveryScore: 92, qualityScore: 89, communicationScore: 88, complianceScore: 93, status: 'Active',    city: 'Bengaluru' },
];

// ─── 120 Purchase Orders over last 12 months ─────────────────────────────────

interface MockPO {
  id: string; poNumber: string; vendorId: number; vendorName: string;
  vendorCategory: string; totalCost: number; status: string;
  poDate: string; expectedDeliveryDate: string;
  department: string; paymentStatus: string;
}

function makePOs(): MockPO[] {
  const depts = ['Manufacturing','IT','Logistics','Finance','Operations','Maintenance','Engineering','Facilities','Warehouse','Marketing'];
  const statuses = ['Issued','Issued','Issued','In Transit','In Transit','Fulfilled','Fulfilled','Fulfilled','Delayed','Cancelled','Awaiting Shipment'];
  const payStatuses = ['Paid','Paid','Paid','Pending','Pending','Unpaid','Overdue'];
  const pos: MockPO[] = [];
  let counter = 1;
  for (let monthBack = 11; monthBack >= 0; monthBack--) {
    const poCount = 8 + Math.floor(Math.random() * 5); // 8–12 per month
    for (let i = 0; i < poCount; i++) {
      const vendor = MOCK_VENDORS[(counter + i) % MOCK_VENDORS.length];
      const poDateObj = new Date();
      poDateObj.setMonth(poDateObj.getMonth() - monthBack);
      poDateObj.setDate(1 + (i * 2) % 25);
      const poDate = poDateObj.toISOString().slice(0, 10);
      const delivDate = new Date(poDateObj);
      delivDate.setDate(delivDate.getDate() + 15 + (i % 20));
      const cost = [45000, 95000, 180000, 280000, 480000, 750000, 960000, 1200000, 320000, 620000][i % 10];
      pos.push({
        id: String(counter + i),
        poNumber: `PO-2026-${String(counter + i).padStart(4,'0')}`,
        vendorId: vendor.id,
        vendorName: vendor.name,
        vendorCategory: vendor.category,
        totalCost: cost + (i * 3333),
        status: statuses[(counter + i) % statuses.length],
        poDate,
        expectedDeliveryDate: delivDate.toISOString().slice(0, 10),
        department: depts[(counter + i) % depts.length],
        paymentStatus: payStatuses[(counter + i) % payStatuses.length],
      });
    }
    counter += poCount;
  }
  return pos;
}

const MOCK_POS: MockPO[] = makePOs();

// ─── Procurement Requests ─────────────────────────────────────────────────────

interface MockReq {
  id: string; title: string; department: string; category: string;
  status: string; priority: string; budget: number;
  vendorName: string; createdAt: string; updatedAt?: string;
}

const DEPARTMENTS = ['Manufacturing','IT','Logistics','Finance','Operations','Maintenance','Engineering','Facilities','Warehouse','Marketing','Product','Security','Admin','Health & Safety','Design'];
const PR_STATUSES = ['Pending','Approved','Ordered','Delivered','Completed','Cancelled'];
const PRIORITIES = ['Low','Medium','High','Critical'];

const MOCK_REQS: MockReq[] = Array.from({ length: 60 }, (_, i) => {
  const vendor = MOCK_VENDORS[i % MOCK_VENDORS.length];
  const d = new Date();
  d.setMonth(d.getMonth() - Math.floor(i / 6));
  d.setDate(1 + (i % 25));
  return {
    id: `PR-2026-${String(i + 1).padStart(4, '0')}`,
    title: `Procurement Request #${i + 1} — ${vendor.category}`,
    department: DEPARTMENTS[i % DEPARTMENTS.length],
    category: vendor.category,
    status: PR_STATUSES[i % PR_STATUSES.length],
    priority: PRIORITIES[i % PRIORITIES.length],
    budget: 80000 + i * 25000,
    vendorName: PR_STATUSES[i % PR_STATUSES.length] !== 'Pending' ? vendor.name : '',
    createdAt: d.toISOString(),
    updatedAt: PR_STATUSES[i % PR_STATUSES.length] !== 'Pending' ? new Date(d.getTime() + 3 * 86400000).toISOString() : undefined,
  };
});

// ─── Compliance Records ───────────────────────────────────────────────────────

interface MockCompliance {
  vendorId: number; vendorName: string; category: string;
  requirementName: string; status: string;
  lastVerifiedDate: string; verifiedBy: string; remarks: string;
}

const COMPLIANCE_REQS = ['GST Registration','ISO Quality Standards','Safety Regulations','Environmental Compliance','Cybersecurity Standards','Labour Compliance','Tax Audit','MSME Registration'];
const COMPLIANCE_STATUSES = ['Compliant','Compliant','Compliant','Non-Compliant','Pending Verification','Expired'];
const VERIFIERS = ['Hrithik','Rohan Verma','Lata Nair','Priya Sharma'];

const MOCK_COMPLIANCE: MockCompliance[] = MOCK_VENDORS.flatMap((v, vi) =>
  COMPLIANCE_REQS.slice(0, 2 + (vi % 4)).map((req, ri) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (vi + ri) % 8);
    return {
      vendorId: v.id,
      vendorName: v.name,
      category: v.category,
      requirementName: req,
      status: COMPLIANCE_STATUSES[(vi + ri) % COMPLIANCE_STATUSES.length],
      lastVerifiedDate: d.toISOString().slice(0, 10),
      verifiedBy: VERIFIERS[(vi + ri) % VERIFIERS.length],
      remarks: `Verified by ${VERIFIERS[(vi + ri) % VERIFIERS.length]} on portal.`,
    };
  })
);

// ─── Contract Records ─────────────────────────────────────────────────────────

interface MockContract {
  contractId: number; contractNumber: string; contractTitle: string;
  vendorName: string; category: string; status: string;
  startDate: string; endDate: string; contractValue: number;
  daysToExpiry: number; responsibleManager: string;
}

function makeDaysOffset(days: number): { date: string; days: number } {
  return { date: dateOffset(days), days };
}

const CONTRACT_STATUSES: string[] = ['Active','Active','Active','Active','Expired','Expired','Renewed','Terminated','Draft'];

const MOCK_CONTRACTS_DATA: MockContract[] = MOCK_VENDORS.slice(0, 20).map((v, i) => {
  const expOffset = [-120, -60, -15, 7, 30, 60, 92, 180, 335, 400][(i) % 10];
  const { date: endDate, days } = makeDaysOffset(expOffset);
  const startDate = dateOffset(expOffset - 365);
  return {
    contractId: i + 1,
    contractNumber: `CT-2026-${String(i + 1).padStart(4, '0')}`,
    contractTitle: `${v.category} Services Agreement — ${v.name.split(' ')[0]}`,
    vendorName: v.name,
    category: v.category,
    status: CONTRACT_STATUSES[i % CONTRACT_STATUSES.length],
    startDate,
    endDate,
    contractValue: [480000, 650000, 850000, 1200000, 1500000, 2100000, 2400000, 3200000, 4800000, 6500000][i % 10],
    daysToExpiry: days,
    responsibleManager: VERIFIERS[i % VERIFIERS.length],
  };
});

// ─── History Store ────────────────────────────────────────────────────────────

const MOCK_HISTORY: RecentReport[] = [
  { id: 'RH-001', reportType: 'executive-summary',  reportTitle: 'Executive Summary — Q2 2026',            generatedBy: 'Hrithik', generatedAt: dateOffset(-2) + 'T10:30:00Z', filters: { datePreset: 'last-quarter' }, status: 'Completed', recordCount: 30, fileSizeKB: 148 },
  { id: 'RH-002', reportType: 'vendor-performance', reportTitle: 'Vendor Performance — IT Vendors',        generatedBy: 'Rohan Verma', generatedAt: dateOffset(-5) + 'T09:15:00Z', filters: { vendorCategory: 'IT Vendors', datePreset: 'last-6-months' }, status: 'Completed', recordCount: 5, fileSizeKB: 64 },
  { id: 'RH-003', reportType: 'procurement',        reportTitle: 'Procurement Report — YTD',               generatedBy: 'Lata Nair', generatedAt: dateOffset(-8) + 'T14:00:00Z', filters: { datePreset: 'ytd' }, status: 'Completed', recordCount: 60, fileSizeKB: 92 },
  { id: 'RH-004', reportType: 'compliance',         reportTitle: 'Compliance Report — All Vendors',        generatedBy: 'Priya Sharma', generatedAt: dateOffset(-12) + 'T11:45:00Z', filters: { complianceStatus: 'Non-Compliant' }, status: 'Completed', recordCount: 18, fileSizeKB: 56 },
  { id: 'RH-005', reportType: 'contract',           reportTitle: 'Contract Expiry Report — 30d Window',    generatedBy: 'Hrithik', generatedAt: dateOffset(-15) + 'T08:00:00Z', filters: { contractStatus: 'Expiring Soon' }, status: 'Completed', recordCount: 8, fileSizeKB: 44 },
  { id: 'RH-006', reportType: 'purchase-order',     reportTitle: 'PO Report — Last 30 Days',               generatedBy: 'Rohan Verma', generatedAt: dateOffset(-18) + 'T16:30:00Z', filters: { datePreset: 'last-30' }, status: 'Completed', recordCount: 35, fileSizeKB: 78 },
];

// ─── Helper: Build ReportMeta ─────────────────────────────────────────────────

function buildMeta(filters: ReportFilters, title: string, count: number): ReportMeta {
  const { from, to } = resolveRange(filters);
  return {
    reportType: filters.reportType,
    title,
    generatedAt: isoNow(),
    filters,
    recordCount: count,
    dateRange: { from, to },
  };
}

// ─── ReportService ────────────────────────────────────────────────────────────

export const reportService = {

  /** GET /reports/vendor-performance */
  getVendorPerformanceReport(filters: ReportFilters): Promise<VendorPerformanceReportResult> {
    const { from, to } = resolveRange(filters);

    let vendors = [...MOCK_VENDORS];
    if (filters.vendorCategory) vendors = vendors.filter(v => v.category === filters.vendorCategory);
    if (filters.vendorName)     vendors = vendors.filter(v => v.name.toLowerCase().includes(filters.vendorName!.toLowerCase()));
    if (filters.reliabilityScoreMin !== undefined) vendors = vendors.filter(v => v.reliabilityScore >= (filters.reliabilityScoreMin ?? 0));
    if (filters.reliabilityScoreMax !== undefined) vendors = vendors.filter(v => v.reliabilityScore <= (filters.reliabilityScoreMax ?? 100));

    const rows: VendorPerformanceRow[] = vendors.map(v => {
      const vPOs = MOCK_POS.filter(p => p.vendorId === v.id && inRange(p.poDate, from, to));
      const onTime = vPOs.filter(p => p.status === 'Fulfilled' || p.status === 'In Transit').length;
      return {
        vendorId: v.id,
        vendorName: v.name,
        category: v.category,
        reliabilityScore: v.reliabilityScore,
        deliveryScore: v.deliveryScore,
        qualityScore: v.qualityScore,
        communicationScore: v.communicationScore,
        complianceScore: v.complianceScore,
        totalPOs: vPOs.length,
        onTimeDeliveryRate: vPOs.length ? Math.round((onTime / vPOs.length) * 100) : v.deliveryScore,
        avgResponseTimeHours: 8 + (100 - v.communicationScore) * 0.5,
        riskLevel: v.reliabilityScore >= 75 ? 'Low Risk' : v.reliabilityScore >= 50 ? 'Medium Risk' : 'High Risk',
      };
    });

    rows.sort((a, b) => b.reliabilityScore - a.reliabilityScore);

    const avgScore = rows.length ? Math.round(rows.reduce((s, r) => s + r.reliabilityScore, 0) / rows.length) : 0;
    const avgQuality = rows.length ? Math.round(rows.reduce((s, r) => s + r.qualityScore, 0) / rows.length) : 0;
    const worstDelivery = [...rows].sort((a,b) => a.onTimeDeliveryRate - b.onTimeDeliveryRate)[0];

    const insights: string[] = [];
    if (rows[0]) insights.push(`Top performer: ${rows[0].vendorName} with a reliability score of ${rows[0].reliabilityScore}/100.`);
    if (worstDelivery && worstDelivery.onTimeDeliveryRate < 70) insights.push(`${worstDelivery.vendorName} has the lowest on-time delivery rate at ${worstDelivery.onTimeDeliveryRate}% — review required.`);
    const highRisk = rows.filter(r => r.riskLevel === 'High Risk');
    if (highRisk.length) insights.push(`${highRisk.length} vendor(s) classified as High Risk: ${highRisk.map(v => v.vendorName).join(', ')}.`);
    if (avgScore >= 80) insights.push(`Overall vendor portfolio health is strong with an average reliability score of ${avgScore}.`);
    else if (avgScore < 60) insights.push(`Average reliability score of ${avgScore} is below target. Vendor performance improvement plans recommended.`);

    const result: VendorPerformanceReportResult = {
      meta: buildMeta(filters, 'Vendor Performance Report', rows.length),
      summary: {
        totalVendors: rows.length,
        avgReliabilityScore: avgScore,
        avgQualityScore: avgQuality,
        topPerformer: rows[0]?.vendorName ?? '—',
        highRiskCount: rows.filter(r => r.riskLevel === 'High Risk').length,
        onTimeDeliveryAvg: rows.length ? Math.round(rows.reduce((s, r) => s + r.onTimeDeliveryRate, 0) / rows.length) : 0,
      },
      topByReliability: rows.slice(0, 10).map(r => ({ vendorName: r.vendorName, reliabilityScore: r.reliabilityScore, category: r.category })),
      deliveryComparison: rows.slice(0, 10).map(r => ({
        vendorName: r.vendorName.split(' ')[0],
        onTime: r.onTimeDeliveryRate,
        delayed: 100 - r.onTimeDeliveryRate,
      })),
      insights,
      rows,
    };
    return delay(result);
  },

  /** GET /reports/procurement */
  getProcurementReport(filters: ReportFilters): Promise<ProcurementReportResult> {
    const { from, to } = resolveRange(filters);
    let reqs = MOCK_REQS.filter(r => inRange(r.createdAt, from, to));
    if (filters.procurementStatus) reqs = reqs.filter(r => r.status === filters.procurementStatus);
    if (filters.departments?.length) reqs = reqs.filter(r => filters.departments!.includes(r.department as never));
    if (filters.vendorName)         reqs = reqs.filter(r => r.vendorName.toLowerCase().includes(filters.vendorName!.toLowerCase()));
    if (filters.vendorCategory)     reqs = reqs.filter(r => r.category === filters.vendorCategory);

    const rows: ProcurementRow[] = reqs.map(r => ({
      requestId: r.id, requestTitle: r.title, department: r.department,
      category: r.category, status: r.status, priority: r.priority,
      estimatedBudget: r.budget, assignedVendor: r.vendorName,
      createdAt: r.createdAt, updatedAt: r.updatedAt,
    }));

    const totalBudget = rows.reduce((s, r) => s + r.estimatedBudget, 0);
    const deptMap = new Map<string, { count: number; approved: number; rejected: number; budget: number; totalDays: number }>();
    rows.forEach(r => {
      const cur = deptMap.get(r.department) ?? { count: 0, approved: 0, rejected: 0, budget: 0, totalDays: 0 };
      deptMap.set(r.department, {
        count: cur.count + 1,
        approved: cur.approved + (r.status === 'Approved' || r.status === 'Ordered' || r.status === 'Completed' ? 1 : 0),
        rejected: cur.rejected + (r.status === 'Cancelled' ? 1 : 0),
        budget: cur.budget + r.estimatedBudget,
        totalDays: cur.totalDays + (r.updatedAt ? Math.round((new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime()) / 86400000) : 4),
      });
    });

    const statusCounts: Record<string, number> = {};
    rows.forEach(r => { statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1; });

    // Monthly breakdown
    const monthlyMap = new Map<string, { requests: number; completed: number; spend: number }>();
    rows.forEach(r => {
      const m = monthLabel(r.createdAt);
      const cur = monthlyMap.get(m) ?? { requests: 0, completed: 0, spend: 0 };
      monthlyMap.set(m, {
        requests: cur.requests + 1,
        completed: cur.completed + (r.status === 'Completed' ? 1 : 0),
        spend: cur.spend + r.estimatedBudget,
      });
    });

    // Insights
    const deptArr = Array.from(deptMap.entries());
    const topSpendDept = deptArr.sort((a,b) => b[1].budget - a[1].budget)[0];
    const slowestDept = deptArr.sort((a,b) => (b[1].totalDays/b[1].count) - (a[1].totalDays/a[1].count))[0];
    const insights: string[] = [];
    if (topSpendDept) insights.push(`${topSpendDept[0]} is the highest-spending department with ₹${(topSpendDept[1].budget/100000).toFixed(1)}L in procurement requests.`);
    if (slowestDept) insights.push(`${slowestDept[0]} has the longest average approval time at ${Math.round(slowestDept[1].totalDays/slowestDept[1].count)} days — potential bottleneck.`);
    const cancelRate = rows.length ? Math.round(((statusCounts['Cancelled'] ?? 0) / rows.length) * 100) : 0;
    if (cancelRate > 10) insights.push(`Cancellation rate is ${cancelRate}% — review procurement approval workflows.`);
    if (rows.length) insights.push(`${statusCounts['Completed'] ?? 0} of ${rows.length} requests (${Math.round(((statusCounts['Completed'] ?? 0)/rows.length)*100)}%) have been completed in this period.`);

    return delay({
      meta: buildMeta(filters, 'Procurement Report', rows.length),
      summary: {
        totalRequests: rows.length,
        totalBudget,
        approvedCount: statusCounts['Approved'] ?? 0,
        pendingCount: statusCounts['Pending'] ?? 0,
        cancelledCount: statusCounts['Cancelled'] ?? 0,
        completedCount: statusCounts['Completed'] ?? 0,
        avgProcessingDays: 4.2,
      },
      byDepartment: Array.from(deptMap.entries()).map(([department, v]) => ({
        department, count: v.count, approved: v.approved, rejected: v.rejected,
        budget: v.budget, avgDays: Math.round(v.totalDays / v.count),
      })),
      byStatus: Object.entries(statusCounts).map(([status, count]) => ({
        status, count, percentage: rows.length ? Math.round((count / rows.length) * 100) : 0,
      })),
      byMonth: Array.from(monthlyMap.entries()).map(([month, v]) => ({ month, ...v })),
      insights,
      rows,
    });
  },

  /** GET /reports/purchase-orders */
  getPurchaseOrderReport(filters: ReportFilters): Promise<PurchaseOrderReportResult> {
    const { from, to } = resolveRange(filters);
    let pos = MOCK_POS.filter(p => inRange(p.poDate, from, to));
    if (filters.vendorCategory) pos = pos.filter(p => p.vendorCategory === filters.vendorCategory);
    if (filters.vendorName)     pos = pos.filter(p => p.vendorName.toLowerCase().includes(filters.vendorName!.toLowerCase()));
    if (filters.poStatus)       pos = pos.filter(p => p.status === filters.poStatus);
    if (filters.departments?.length) pos = pos.filter(p => filters.departments!.includes(p.department as never));

    const rows: PurchaseOrderRow[] = pos.map(p => ({
      poId: p.id, poNumber: p.poNumber, vendorName: p.vendorName,
      vendorCategory: p.vendorCategory, totalCost: p.totalCost,
      status: p.status, poDate: p.poDate,
      expectedDeliveryDate: p.expectedDeliveryDate,
      department: p.department, paymentStatus: p.paymentStatus,
    }));

    const totalValue = rows.reduce((s, r) => s + r.totalCost, 0);

    const monthMap = new Map<string, { count: number; value: number }>();
    rows.forEach(r => {
      const m = monthLabel(r.poDate);
      const cur = monthMap.get(m) ?? { count: 0, value: 0 };
      monthMap.set(m, { count: cur.count + 1, value: cur.value + r.totalCost });
    });

    const vendorMap = new Map<string, { count: number; value: number }>();
    rows.forEach(r => {
      const cur = vendorMap.get(r.vendorName) ?? { count: 0, value: 0 };
      vendorMap.set(r.vendorName, { count: cur.count + 1, value: cur.value + r.totalCost });
    });

    // Status-wise value breakdown
    const statusValueMap = new Map<string, { count: number; value: number }>();
    rows.forEach(r => {
      const cur = statusValueMap.get(r.status) ?? { count: 0, value: 0 };
      statusValueMap.set(r.status, { count: cur.count + 1, value: cur.value + r.totalCost });
    });

    const delayedCount = rows.filter(r => r.status === 'Delayed').length;
    const cancelledCount = rows.filter(r => r.status === 'Cancelled').length;
    const topVendorByValue = Array.from(vendorMap.entries()).sort((a,b) => b[1].value - a[1].value)[0];

    const insights: string[] = [];
    if (topVendorByValue) insights.push(`${topVendorByValue[0]} is the top vendor by order value with ₹${(topVendorByValue[1].value/100000).toFixed(1)}L across ${topVendorByValue[1].count} POs.`);
    if (delayedCount > 0) insights.push(`${delayedCount} purchase order(s) are currently delayed — immediate follow-up recommended.`);
    if (cancelledCount > 0) insights.push(`${cancelledCount} PO(s) were cancelled in this period; review vendor reliability and supply chain constraints.`);
    const pendingPaymentValue = rows.filter(r => r.paymentStatus === 'Pending' || r.paymentStatus === 'Unpaid').reduce((s,r) => s + r.totalCost, 0);
    if (pendingPaymentValue > 0) insights.push(`Outstanding payment exposure stands at ₹${(pendingPaymentValue/100000).toFixed(1)}L — expedite invoice clearance.`);

    return delay({
      meta: buildMeta(filters, 'Purchase Order Report', rows.length),
      summary: {
        totalPOs: rows.length,
        totalValue,
        avgOrderValue: rows.length ? Math.round(totalValue / rows.length) : 0,
        fulfilledCount: rows.filter(r => r.status === 'Fulfilled').length,
        delayedCount,
        cancelledCount,
        pendingPaymentValue,
      },
      byMonth: Array.from(monthMap.entries()).map(([month, v]) => ({ month, ...v })),
      byVendor: Array.from(vendorMap.entries()).sort((a, b) => b[1].value - a[1].value).slice(0, 10).map(([vendorName, v]) => ({ vendorName, ...v })),
      byStatus: Array.from(statusValueMap.entries()).map(([status, v]) => ({ status, ...v })),
      insights,
      rows,
    });
  },

  /** GET /reports/compliance */
  getComplianceReport(filters: ReportFilters): Promise<ComplianceReportResult> {
    const { from, to } = resolveRange(filters);
    let recs = MOCK_COMPLIANCE.filter(r => inRange(r.lastVerifiedDate, from, to));
    if (filters.vendorCategory)    recs = recs.filter(r => r.category === filters.vendorCategory);
    if (filters.vendorName)        recs = recs.filter(r => r.vendorName.toLowerCase().includes(filters.vendorName!.toLowerCase()));
    if (filters.complianceStatus)  recs = recs.filter(r => r.status === filters.complianceStatus);

    const rows: ComplianceRow[] = recs.map(r => ({ ...r, vendorId: r.vendorId }));

    const statusCounts: Record<string, number> = {};
    rows.forEach(r => { statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1; });

    const catMap = new Map<string, { compliant: number; nonCompliant: number; total: number }>();
    rows.forEach(r => {
      const cur = catMap.get(r.category) ?? { compliant: 0, nonCompliant: 0, total: 0 };
      catMap.set(r.category, {
        compliant: cur.compliant + (r.status === 'Compliant' ? 1 : 0),
        nonCompliant: cur.nonCompliant + (r.status === 'Non-Compliant' ? 1 : 0),
        total: cur.total + 1,
      });
    });

    // Per-vendor summary
    const vendorCompMap = new Map<number, { name: string; category: string; total: number; compliant: number; expired: boolean; missing: boolean; pending: number }>();
    rows.forEach(r => {
      const cur = vendorCompMap.get(r.vendorId) ?? { name: r.vendorName, category: r.category, total: 0, compliant: 0, expired: false, missing: false, pending: 0 };
      vendorCompMap.set(r.vendorId, {
        ...cur,
        total: cur.total + 1,
        compliant: cur.compliant + (r.status === 'Compliant' ? 1 : 0),
        expired: cur.expired || r.status === 'Expired',
        missing: cur.missing || r.status === 'Non-Compliant',
        pending: cur.pending + (r.status === 'Pending Verification' ? 1 : 0),
      });
    });

    const byVendor: ComplianceVendorSummary[] = Array.from(vendorCompMap.entries()).map(([vendorId, v]) => ({
      vendorId,
      vendorName: v.name,
      category: v.category,
      totalChecks: v.total,
      compliantCount: v.compliant,
      complianceRate: v.total ? Math.round((v.compliant / v.total) * 100) : 0,
      hasExpired: v.expired,
      hasMissing: v.missing,
      pendingCount: v.pending,
    })).sort((a, b) => a.complianceRate - b.complianceRate);

    const compliantVendors = byVendor.filter(v => v.complianceRate === 100).length;
    const nonCompliant = byVendor.filter(v => v.hasMissing || v.hasExpired);
    const compliantCount = statusCounts['Compliant'] ?? 0;

    const insights: string[] = [];
    if (byVendor.length) {
      const worstVendor = byVendor[0];
      if (worstVendor.complianceRate < 100) insights.push(`${worstVendor.vendorName} has the lowest compliance rate at ${worstVendor.complianceRate}% — immediate action required.`);
    }
    if (nonCompliant.length) insights.push(`${nonCompliant.length} vendor(s) have missing or expired compliance documents.`);
    const overallRate = rows.length ? Math.round((compliantCount / rows.length) * 100) : 0;
    if (overallRate >= 80) insights.push(`Overall compliance rate of ${overallRate}% is within acceptable thresholds.`);
    else insights.push(`Overall compliance rate of ${overallRate}% is below the 80% benchmark — escalation recommended.`);
    if (statusCounts['Pending Verification']) insights.push(`${statusCounts['Pending Verification']} record(s) pending verification — assign reviewers promptly.`);

    return delay({
      meta: buildMeta(filters, 'Compliance Report', rows.length),
      summary: {
        totalRecords: rows.length,
        compliantCount,
        nonCompliantCount: statusCounts['Non-Compliant'] ?? 0,
        pendingCount: statusCounts['Pending Verification'] ?? 0,
        expiredCount: statusCounts['Expired'] ?? 0,
        complianceRate: overallRate,
        compliantVendors,
        totalVendors: byVendor.length,
      },
      byStatus: Object.entries(statusCounts).map(([status, count]) => ({
        status, count, percentage: rows.length ? Math.round((count / rows.length) * 100) : 0,
      })),
      byCategory: Array.from(catMap.entries()).map(([category, v]) => ({ category, ...v })),
      byVendor,
      insights,
      rows,
    });
  },

  /** GET /reports/contracts */
  getContractReport(filters: ReportFilters): Promise<ContractReportResult> {
    let contracts = [...MOCK_CONTRACTS_DATA];
    if (filters.vendorCategory)  contracts = contracts.filter(c => c.category === filters.vendorCategory);
    if (filters.vendorName)      contracts = contracts.filter(c => c.vendorName.toLowerCase().includes(filters.vendorName!.toLowerCase()));
    if (filters.contractStatus) {
      const cs = filters.contractStatus;
      if (cs === 'Expiring Soon') contracts = contracts.filter(c => c.daysToExpiry >= 0 && c.daysToExpiry <= 90);
      else contracts = contracts.filter(c => c.status === cs);
    }
    const { from, to } = resolveRange(filters);
    contracts = contracts.filter(c => inRange(c.startDate, from, to) || inRange(c.endDate, from, to));

    const rows: ContractRow[] = contracts.map(c => ({ ...c }));

    const totalValue = rows.reduce((s, r) => s + r.contractValue, 0);
    const statusCounts: Record<string, { count: number; value: number }> = {};
    rows.forEach(r => {
      const cur = statusCounts[r.status] ?? { count: 0, value: 0 };
      statusCounts[r.status] = { count: cur.count + 1, value: cur.value + r.contractValue };
    });

    // By category
    const catMap = new Map<string, { count: number; value: number }>();
    rows.forEach(r => {
      const cur = catMap.get(r.category) ?? { count: 0, value: 0 };
      catMap.set(r.category, { count: cur.count + 1, value: cur.value + r.contractValue });
    });

    // Expiring by month (next 6 months)
    const expiringByMonth: { month: string; count: number }[] = [];
    for (let m = 0; m < 6; m++) {
      const d = new Date();
      d.setMonth(d.getMonth() + m);
      const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
      const count = rows.filter(r => {
        const end = new Date(r.endDate);
        return end.getMonth() === d.getMonth() && end.getFullYear() === d.getFullYear();
      }).length;
      expiringByMonth.push({ month: label, count });
    }

    const renewedCount = rows.filter(r => r.status === 'Renewed').length;
    const terminatedCount = rows.filter(r => r.status === 'Terminated').length;
    const renewalRate = (rows.length - terminatedCount) > 0 ? Math.round((renewedCount / (rows.length - terminatedCount)) * 100) : 0;

    const expiringUrgent = rows.filter(r => r.daysToExpiry >= 0 && r.daysToExpiry <= 30);
    const insights: string[] = [];
    if (expiringUrgent.length) insights.push(`${expiringUrgent.length} contract(s) expiring within 30 days: ${expiringUrgent.map(r => r.vendorName.split(' ')[0]).join(', ')}.`);
    const highestValue = [...rows].sort((a,b) => b.contractValue - a.contractValue)[0];
    if (highestValue) insights.push(`Highest-value contract is with ${highestValue.vendorName} at ₹${(highestValue.contractValue/100000).toFixed(1)}L.`);
    if (renewalRate > 0) insights.push(`Contract renewal rate stands at ${renewalRate}% for the current portfolio.`);
    if (rows.filter(r => r.status === 'Expired').length > 0) insights.push(`${rows.filter(r => r.status === 'Expired').length} contract(s) have expired without renewal — legal review advised.`);

    return delay({
      meta: buildMeta(filters, 'Contract Report', rows.length),
      summary: {
        totalContracts: rows.length,
        totalValue,
        activeCount: rows.filter(r => r.status === 'Active').length,
        expiredCount: rows.filter(r => r.status === 'Expired').length,
        expiringIn30Days: rows.filter(r => r.daysToExpiry >= 0 && r.daysToExpiry <= 30).length,
        expiringIn90Days: rows.filter(r => r.daysToExpiry >= 0 && r.daysToExpiry <= 90).length,
        avgContractValue: rows.length ? Math.round(totalValue / rows.length) : 0,
        renewalRate,
      },
      byStatus: Object.entries(statusCounts).map(([status, v]) => ({ status, ...v })),
      byCategory: Array.from(catMap.entries()).map(([category, v]) => ({ category, ...v })),
      expiryTimeline: [
        { window: '< 30 days', count: rows.filter(r => r.daysToExpiry >= 0 && r.daysToExpiry <= 30).length },
        { window: '31–60 days', count: rows.filter(r => r.daysToExpiry > 30 && r.daysToExpiry <= 60).length },
        { window: '61–90 days', count: rows.filter(r => r.daysToExpiry > 60 && r.daysToExpiry <= 90).length },
        { window: '> 90 days',  count: rows.filter(r => r.daysToExpiry > 90).length },
        { window: 'Expired',    count: rows.filter(r => r.daysToExpiry < 0).length },
      ],
      expiringByMonth,
      insights,
      rows,
    });
  },

  /** GET /reports/executive-summary */
  getExecutiveSummaryReport(filters: ReportFilters): Promise<ExecutiveSummaryReportResult> {
    const { from, to } = resolveRange(filters);
    const periodPOs = MOCK_POS.filter(p => inRange(p.poDate, from, to));
    const periodReqs = MOCK_REQS.filter(r => inRange(r.createdAt, from, to));
    const activeVendors = MOCK_VENDORS.filter(v => v.status === 'Active');
    const allCompliance = MOCK_COMPLIANCE.filter(r => inRange(r.lastVerifiedDate, from, to));
    const compliant = allCompliance.filter(r => r.status === 'Compliant').length;

    // Monthly trend (last 6 months)
    const monthlyTrend: { month: string; requests: number; spend: number }[] = [];
    for (let mb = 5; mb >= 0; mb--) {
      const d = new Date();
      d.setMonth(d.getMonth() - mb);
      const ml = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
      const monthReqs = periodReqs.filter(r => monthLabel(r.createdAt) === ml);
      const monthPOs  = periodPOs.filter(p => monthLabel(p.poDate) === ml);
      monthlyTrend.push({ month: ml, requests: monthReqs.length, spend: monthPOs.reduce((s,p) => s+p.totalCost, 0) });
    }

    const delayedCount = periodPOs.filter(p => p.status === 'Delayed').length;
    const avgScore = Math.round(activeVendors.reduce((s, v) => s + v.reliabilityScore, 0) / (activeVendors.length || 1));
    const completionRate = periodReqs.length ? Math.round((periodReqs.filter(r => r.status === 'Completed').length / periodReqs.length) * 100) : 0;
    const overallCompliance = allCompliance.length ? Math.round((compliant / allCompliance.length) * 100) : 0;

    const insights: string[] = [];
    const topVendor = [...MOCK_VENDORS].sort((a, b) => b.reliabilityScore - a.reliabilityScore)[0];
    if (topVendor) insights.push(`${topVendor.name} is the top-performing vendor with a reliability score of ${topVendor.reliabilityScore}/100.`);
    if (MOCK_VENDORS.filter(v => v.reliabilityScore < 50).length > 0) insights.push(`${MOCK_VENDORS.filter(v => v.reliabilityScore < 50).length} vendor(s) classified as high-risk — immediate performance review recommended.`);
    if (MOCK_CONTRACTS_DATA.filter(c => c.daysToExpiry >= 0 && c.daysToExpiry <= 30).length > 0) insights.push(`${MOCK_CONTRACTS_DATA.filter(c => c.daysToExpiry >= 0 && c.daysToExpiry <= 30).length} contract(s) expiring within 30 days — renewal actions required.`);
    if (completionRate < 50) insights.push(`Procurement completion rate is ${completionRate}% — consider streamlining approval workflows.`);
    else insights.push(`Procurement completion rate is ${completionRate}% — on track for the period.`);

    return delay({
      meta: buildMeta(filters, 'Executive Summary Report', MOCK_VENDORS.length),
      vendorKPIs: {
        totalVendors: MOCK_VENDORS.length,
        activeVendors: activeVendors.length,
        avgReliabilityScore: avgScore,
        highRiskVendors: MOCK_VENDORS.filter(v => v.reliabilityScore < 50).length,
        newVendorsThisPeriod: 3,
      },
      procurementKPIs: {
        totalRequests: periodReqs.length,
        totalBudget: periodReqs.reduce((s, r) => s + r.budget, 0),
        avgApprovalDays: 4.2,
        completionRate,
      },
      poKPIs: {
        totalPOs: periodPOs.length,
        totalSpend: periodPOs.reduce((s, p) => s + p.totalCost, 0),
        onTimeDeliveryRate: periodPOs.length ? Math.round((periodPOs.filter(p => p.status === 'Fulfilled').length / periodPOs.length) * 100) : 0,
        pendingPaymentValue: periodPOs.filter(p => p.paymentStatus === 'Pending' || p.paymentStatus === 'Unpaid').reduce((s, p) => s + p.totalCost, 0),
        delayedCount,
      },
      contractKPIs: {
        totalContracts: MOCK_CONTRACTS_DATA.length,
        totalContractValue: MOCK_CONTRACTS_DATA.reduce((s, c) => s + c.contractValue, 0),
        expiringIn30Days: MOCK_CONTRACTS_DATA.filter(c => c.daysToExpiry >= 0 && c.daysToExpiry <= 30).length,
        renewalRate: 72,
      },
      complianceKPIs: {
        overallComplianceRate: overallCompliance,
        nonCompliantVendors: new Set(allCompliance.filter(r => r.status === 'Non-Compliant').map(r => r.vendorId)).size,
        pendingVerifications: allCompliance.filter(r => r.status === 'Pending Verification').length,
      },
      topVendors: [...MOCK_VENDORS].sort((a, b) => b.reliabilityScore - a.reliabilityScore).slice(0, 5).map(v => ({
        vendorName: v.name, score: v.reliabilityScore, category: v.category,
      })),
      riskSummary: [
        { level: 'Low Risk',    count: MOCK_VENDORS.filter(v => v.reliabilityScore >= 75).length, color: '#2E7D32' },
        { level: 'Medium Risk', count: MOCK_VENDORS.filter(v => v.reliabilityScore >= 50 && v.reliabilityScore < 75).length, color: '#E65100' },
        { level: 'High Risk',   count: MOCK_VENDORS.filter(v => v.reliabilityScore < 50).length, color: '#C62828' },
      ],
      monthlyTrend,
      insights,
    });
  },

  /** GET /reports/history */
  getRecentReports(): Promise<RecentReport[]> {
    return delay([...MOCK_HISTORY]);
  },

  /** POST /reports/history — save a generated report entry */
  saveReportHistory(entry: Omit<RecentReport, 'id'>): Promise<RecentReport> {
    const saved: RecentReport = { ...entry, id: `RH-${String(MOCK_HISTORY.length + 1).padStart(3, '0')}` };
    MOCK_HISTORY.unshift(saved);
    return delay(saved, 100);
  },
};
