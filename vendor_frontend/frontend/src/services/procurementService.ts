/**
 * ProcurementService
 * ==================
 * All methods return a Promise<T> wrapping mock data today.
 * To switch to real HTTP, replace each method body with:
 *   return fetch(`${API_BASE}/procurement/...`).then(r => r.json())
 * — the method signatures, parameter shapes, and return types
 *   stay 100% identical.
 *
 * Convention mirrors a RESTful service:
 *   GET    /procurement/requests              → getRequests()
 *   GET    /procurement/requests/:id          → getRequestById()
 *   POST   /procurement/requests              → createRequest()
 *   PATCH  /procurement/requests/:id/approve  → approveRequest()
 *   PATCH  /procurement/requests/:id/reject   → rejectRequest()
 *   PATCH  /procurement/requests/:id/vendor   → assignVendor()
 *   GET    /procurement/requests/:id/history  → getStatusHistory()
 *   POST   /procurement/purchase-orders       → createPurchaseOrder()
 *   GET    /procurement/purchase-orders       → getPurchaseOrders()
 *   GET    /procurement/purchase-orders/:id   → getPurchaseOrderById()
 *   PATCH  /procurement/tracking/:poId        → updateTracking()
 *   GET    /procurement/tracking/:poId        → getTracking()
 *   POST   /procurement/invoices              → uploadInvoice()
 *   GET    /procurement/invoices              → getInvoices()
 *   PATCH  /procurement/invoices/:id/pay      → markInvoicePaid()
 */

import type {
  ProcurementRequest,
  ProcurementApproval,
  PurchaseOrder,
  OrderTracking,
  Invoice,
  StatusHistoryEntry,
  ProcurementRequestFilters,
  PaginatedResult,
  ProcurementStatus,
  InvoicePaymentStatus,
  ApprovedVendor,
} from '../models/procurement';
import { performanceService } from './performanceService';

// ─── Mock Dataset ─────────────────────────────────────────────────────────────

const MOCK_REQUESTS: ProcurementRequest[] = [
  {
    id: 1,
    requestNumber: 'PR-2026-0001',
    requestTitle: 'Developer Workstations – Q3 Refresh',
    departmentName: 'Engineering',
    requestedBy: 2,
    requestedByName: 'Rohan Verma',
    itemName: 'Intel i9 Workstation (32 GB RAM, 1 TB NVMe)',
    productCategory: 'IT Hardware',
    quantity: 8,
    unitOfMeasurement: 'Units',
    estimatedBudget: 960000,
    requiredDeliveryDate: '2026-08-15',
    priority: 'High',
    businessJustification: 'Current workstations are 4 years old and failing CI/CD build pipelines.',
    additionalRemarks: 'Prefer Intel Xeon or i9 generation.',
    status: 'Approved',
    assignedVendorId: 1,
    assignedVendorName: 'TechCorp Solutions Pvt Ltd',
    createdAt: '2026-07-01T09:30:00Z',
    updatedAt: '2026-07-03T11:00:00Z',
  },
  {
    id: 2,
    requestNumber: 'PR-2026-0002',
    requestTitle: 'Reefer Logistics – Mumbai to Pune Cold Chain',
    departmentName: 'Operations',
    requestedBy: 2,
    requestedByName: 'Rohan Verma',
    itemName: 'Refrigerated Cargo Transport (20 ft)',
    productCategory: 'Logistics Services',
    quantity: 2,
    unitOfMeasurement: 'Trips',
    estimatedBudget: 280000,
    requiredDeliveryDate: '2026-07-25',
    priority: 'Critical',
    businessJustification: 'Vaccine batch must reach Pune facility under cold-chain compliance.',
    status: 'Ordered',
    assignedVendorId: 2,
    assignedVendorName: 'Global Logistics & Freight',
    createdAt: '2026-07-02T11:15:00Z',
    updatedAt: '2026-07-05T14:00:00Z',
  },
  {
    id: 3,
    requestNumber: 'PR-2026-0003',
    requestTitle: 'Warehouse C Flooring Repair',
    departmentName: 'Facilities',
    requestedBy: 3,
    requestedByName: 'Lata Nair',
    itemName: 'Epoxy Flooring & Foundation Repair',
    productCategory: 'Civil Works',
    quantity: 1,
    unitOfMeasurement: 'Contract',
    estimatedBudget: 1200000,
    requiredDeliveryDate: '2026-09-01',
    priority: 'Medium',
    businessJustification: 'Warehouse C floor shows structural cracks impacting forklift operations.',
    status: 'Pending',
    createdAt: '2026-07-05T08:00:00Z',
  },
  {
    id: 4,
    requestNumber: 'PR-2026-0004',
    requestTitle: 'Industrial Forklift Replacement',
    departmentName: 'Warehouse',
    requestedBy: 2,
    requestedByName: 'Rohan Verma',
    itemName: 'Electric Forklift – EquipMax X200',
    productCategory: 'Heavy Equipment',
    quantity: 1,
    unitOfMeasurement: 'Units',
    estimatedBudget: 870000,
    requiredDeliveryDate: '2026-07-01',
    priority: 'High',
    businessJustification: 'Primary forklift failed safety inspection; replacement mandatory.',
    status: 'Completed',
    assignedVendorId: 5,
    assignedVendorName: 'EquipMax Machinery Ltd',
    createdAt: '2026-06-10T10:00:00Z',
    updatedAt: '2026-07-05T16:00:00Z',
  },
  {
    id: 5,
    requestNumber: 'PR-2026-0005',
    requestTitle: 'UI/UX Consulting – ERP Portal Redesign',
    departmentName: 'Product',
    requestedBy: 1,
    requestedByName: 'Hrithik (Admin)',
    itemName: 'Design Consulting & Prototyping Services',
    productCategory: 'Professional Services',
    quantity: 1,
    unitOfMeasurement: 'Project',
    estimatedBudget: 320000,
    requiredDeliveryDate: '2026-08-30',
    priority: 'Low',
    businessJustification: 'ERP portal UX is dated; user surveys report 68% frustration score.',
    status: 'Cancelled',
    createdAt: '2026-06-25T14:00:00Z',
    updatedAt: '2026-07-01T09:00:00Z',
  },
  {
    id: 6,
    requestNumber: 'PR-2026-0006',
    requestTitle: 'Figma & Adobe CC Licenses – Annual Renewal',
    departmentName: 'Design',
    requestedBy: 2,
    requestedByName: 'Rohan Verma',
    itemName: 'Software License Bundle (Figma Pro + Adobe CC)',
    productCategory: 'IT Software',
    quantity: 6,
    unitOfMeasurement: 'Licenses',
    estimatedBudget: 90000,
    requiredDeliveryDate: '2026-08-01',
    priority: 'Medium',
    businessJustification: 'Current licenses expire 31 July 2026; renewal required for uninterrupted design ops.',
    status: 'Approved',
    assignedVendorId: 1,
    assignedVendorName: 'TechCorp Solutions Pvt Ltd',
    createdAt: '2026-07-06T10:00:00Z',
    updatedAt: '2026-07-07T08:00:00Z',
  },
  {
    id: 7,
    requestNumber: 'PR-2026-0007',
    requestTitle: 'Safety Equipment – Q3 Site Audit Compliance',
    departmentName: 'Health & Safety',
    requestedBy: 3,
    requestedByName: 'Lata Nair',
    itemName: 'Fire Extinguishers, Safety Helmets, Hi-Vis Vests',
    productCategory: 'Safety Equipment',
    quantity: 50,
    unitOfMeasurement: 'Kits',
    estimatedBudget: 175000,
    requiredDeliveryDate: '2026-07-20',
    priority: 'Critical',
    businessJustification: 'Mandatory before ISO 45001 audit scheduled for 25 July.',
    status: 'Pending',
    createdAt: '2026-07-08T07:30:00Z',
  },
  {
    id: 8,
    requestNumber: 'PR-2026-0008',
    requestTitle: 'Cloud Server Migration – AWS to Azure',
    departmentName: 'IT Infrastructure',
    requestedBy: 1,
    requestedByName: 'Hrithik (Admin)',
    itemName: 'Migration Consulting & Azure Reserved Instances (3 yr)',
    productCategory: 'IT Services',
    quantity: 1,
    unitOfMeasurement: 'Service Contract',
    estimatedBudget: 2400000,
    requiredDeliveryDate: '2026-12-31',
    priority: 'High',
    businessJustification: 'AWS contract renewal is 40% more expensive than equivalent Azure capacity.',
    status: 'Pending',
    createdAt: '2026-07-09T13:00:00Z',
  },
  {
    id: 9,
    requestNumber: 'PR-2026-0009',
    requestTitle: 'Office Furniture – New Pune Branch',
    departmentName: 'Admin',
    requestedBy: 3,
    requestedByName: 'Lata Nair',
    itemName: 'Ergonomic Chairs & Adjustable Desks',
    productCategory: 'Office Furniture',
    quantity: 40,
    unitOfMeasurement: 'Sets',
    estimatedBudget: 600000,
    requiredDeliveryDate: '2026-09-15',
    priority: 'Low',
    businessJustification: 'New Pune office (40 seats) opens October 2026; furniture needed for setup.',
    status: 'Pending',
    createdAt: '2026-07-10T10:00:00Z',
  },
  {
    id: 10,
    requestNumber: 'PR-2026-0010',
    requestTitle: 'CCTV Surveillance Upgrade – All Facilities',
    departmentName: 'Security',
    requestedBy: 1,
    requestedByName: 'Hrithik (Admin)',
    itemName: '4K IP CCTV Cameras + NVR Storage System',
    productCategory: 'Security Systems',
    quantity: 24,
    unitOfMeasurement: 'Units',
    estimatedBudget: 480000,
    requiredDeliveryDate: '2026-08-20',
    priority: 'High',
    businessJustification: 'Existing analogue CCTV does not meet insurance compliance threshold.',
    status: 'Approved',
    assignedVendorId: 1,
    assignedVendorName: 'TechCorp Solutions Pvt Ltd',
    createdAt: '2026-07-11T09:00:00Z',
    updatedAt: '2026-07-12T14:00:00Z',
  },
  {
    id: 11,
    requestNumber: 'PR-2026-0011',
    requestTitle: 'Annual HVAC Maintenance Contract',
    departmentName: 'Facilities',
    requestedBy: 3,
    requestedByName: 'Lata Nair',
    itemName: 'Preventive Maintenance + 24×7 Emergency Response SLA',
    productCategory: 'Maintenance Services',
    quantity: 1,
    unitOfMeasurement: 'Annual Contract',
    estimatedBudget: 380000,
    requiredDeliveryDate: '2026-08-01',
    priority: 'Medium',
    businessJustification: 'Server room HVAC uptime is critical; current vendor contract expires Aug 2026.',
    status: 'Delivered',
    assignedVendorId: 2,
    assignedVendorName: 'Global Logistics & Freight',
    createdAt: '2026-06-28T11:00:00Z',
    updatedAt: '2026-07-15T10:00:00Z',
  },
  {
    id: 12,
    requestNumber: 'PR-2026-0012',
    requestTitle: 'Printed Marketing Materials – Trade Fair',
    departmentName: 'Marketing',
    requestedBy: 2,
    requestedByName: 'Rohan Verma',
    itemName: 'Brochures, Roll-up Banners, Branded Bags',
    productCategory: 'Print & Branding',
    quantity: 500,
    unitOfMeasurement: 'Pcs',
    estimatedBudget: 95000,
    requiredDeliveryDate: '2026-07-22',
    priority: 'Medium',
    businessJustification: 'VendorIQ participating in ProcureTech India Expo on 26 Jul 2026.',
    status: 'Ordered',
    assignedVendorId: 5,
    assignedVendorName: 'EquipMax Machinery Ltd',
    createdAt: '2026-07-07T15:00:00Z',
    updatedAt: '2026-07-09T09:00:00Z',
  },
];

const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 1,
    poNumber: 'PO-2026-0042',
    requestId: 1,
    requestNumber: 'PR-2026-0001',
    vendorId: 1,
    vendorName: 'TechCorp Solutions Pvt Ltd',
    productDetails: 'Intel i9 Developer Workstations (32 GB RAM, 1 TB NVMe) × 8',
    quantityOrdered: 8,
    unitPrice: 120000,
    totalCost: 960000,
    taxDetails: 'GST 18% included',
    shippingAddress: 'VendorIQ HQ, Hinjewadi Phase 2, Pune – 411057',
    expectedDeliveryDate: '2026-08-15',
    paymentTerms: 'Net 30',
    poStatus: 'Issued',
    poDate: '2026-07-03',
    createdAt: '2026-07-03T11:00:00Z',
  },
  {
    id: 2,
    poNumber: 'PO-2026-0041',
    requestId: 2,
    requestNumber: 'PR-2026-0002',
    vendorId: 2,
    vendorName: 'Global Logistics & Freight',
    productDetails: 'Refrigerated cargo transport Mumbai → Pune, 2 trips',
    quantityOrdered: 2,
    unitPrice: 140000,
    totalCost: 280000,
    taxDetails: 'GST 5% – Transport (Composite)',
    shippingAddress: 'VendorIQ Cold Storage, Chakan, Pune',
    expectedDeliveryDate: '2026-07-25',
    paymentTerms: 'Net 45',
    poStatus: 'In Transit',
    poDate: '2026-07-05',
    createdAt: '2026-07-05T14:00:00Z',
  },
  {
    id: 3,
    poNumber: 'PO-2026-0040',
    requestId: 4,
    requestNumber: 'PR-2026-0004',
    vendorId: 5,
    vendorName: 'EquipMax Machinery Ltd',
    productDetails: 'Electric Forklift – EquipMax X200 with operator training',
    quantityOrdered: 1,
    unitPrice: 870000,
    totalCost: 870000,
    taxDetails: 'GST 28% – Heavy Equipment',
    shippingAddress: 'VendorIQ Warehouse A, Gaganpahad, Hyderabad',
    expectedDeliveryDate: '2026-07-01',
    paymentTerms: 'Net 60',
    poStatus: 'Fulfilled',
    poDate: '2026-06-12',
    createdAt: '2026-06-12T10:00:00Z',
  },
  {
    id: 4,
    poNumber: 'PO-2026-0039',
    requestId: 6,
    requestNumber: 'PR-2026-0006',
    vendorId: 1,
    vendorName: 'TechCorp Solutions Pvt Ltd',
    productDetails: 'Figma Pro + Adobe CC – 6 annual licenses',
    quantityOrdered: 6,
    unitPrice: 15000,
    totalCost: 90000,
    taxDetails: 'GST 18%',
    expectedDeliveryDate: '2026-08-01',
    paymentTerms: 'Net 30',
    poStatus: 'Issued',
    poDate: '2026-07-07',
    createdAt: '2026-07-07T08:00:00Z',
  },
  {
    id: 5,
    poNumber: 'PO-2026-0038',
    requestId: 10,
    requestNumber: 'PR-2026-0010',
    vendorId: 1,
    vendorName: 'TechCorp Solutions Pvt Ltd',
    productDetails: '4K IP CCTV Cameras (× 24) + NVR 32-channel system',
    quantityOrdered: 24,
    unitPrice: 20000,
    totalCost: 480000,
    taxDetails: 'GST 18%',
    shippingAddress: 'All VendorIQ Facilities (4 locations)',
    expectedDeliveryDate: '2026-08-20',
    paymentTerms: 'Net 30',
    poStatus: 'Issued',
    poDate: '2026-07-12',
    createdAt: '2026-07-12T14:00:00Z',
  },
  {
    id: 6,
    poNumber: 'PO-2026-0037',
    requestId: 12,
    requestNumber: 'PR-2026-0012',
    vendorId: 5,
    vendorName: 'EquipMax Machinery Ltd',
    productDetails: 'Brochures (400 pcs), Roll-up Banners (50), Branded Bags (50)',
    quantityOrdered: 500,
    unitPrice: 190,
    totalCost: 95000,
    taxDetails: 'GST 12% – Print',
    shippingAddress: 'VendorIQ HQ, Pune (Expo pickup)',
    expectedDeliveryDate: '2026-07-22',
    paymentTerms: 'Net 15',
    poStatus: 'In Transit',
    poDate: '2026-07-09',
    createdAt: '2026-07-09T09:00:00Z',
  },
];

const MOCK_TRACKING: OrderTracking[] = [
  {
    id: 1,
    poId: 1,
    poNumber: 'PO-2026-0042',
    vendorName: 'TechCorp Solutions Pvt Ltd',
    dispatchDate: '2026-07-10',
    expectedDeliveryDate: '2026-08-15',
    deliveryStatus: 'In Transit',
    updatedAt: '2026-07-10T08:00:00Z',
  },
  {
    id: 2,
    poId: 2,
    poNumber: 'PO-2026-0041',
    vendorName: 'Global Logistics & Freight',
    dispatchDate: '2026-07-06',
    expectedDeliveryDate: '2026-07-25',
    actualDeliveryDate: undefined,
    deliveryStatus: 'Delayed',
    delayDays: 5,
    remarks: 'Truck breakdown on NH8; replacement vehicle dispatched.',
    updatedAt: '2026-07-15T16:00:00Z',
  },
  {
    id: 3,
    poId: 3,
    poNumber: 'PO-2026-0040',
    vendorName: 'EquipMax Machinery Ltd',
    dispatchDate: '2026-06-28',
    expectedDeliveryDate: '2026-07-01',
    actualDeliveryDate: '2026-07-04',
    deliveryStatus: 'Delayed',
    delayDays: 3,
    remarks: 'Customs clearance documentation delayed.',
    updatedAt: '2026-07-04T14:00:00Z',
  },
  {
    id: 4,
    poId: 4,
    poNumber: 'PO-2026-0039',
    vendorName: 'TechCorp Solutions Pvt Ltd',
    expectedDeliveryDate: '2026-08-01',
    deliveryStatus: 'Awaiting Shipment',
    updatedAt: '2026-07-07T08:00:00Z',
  },
  {
    id: 5,
    poId: 5,
    poNumber: 'PO-2026-0038',
    vendorName: 'TechCorp Solutions Pvt Ltd',
    expectedDeliveryDate: '2026-08-20',
    deliveryStatus: 'Awaiting Shipment',
    updatedAt: '2026-07-12T14:00:00Z',
  },
  {
    id: 6,
    poId: 6,
    poNumber: 'PO-2026-0037',
    vendorName: 'EquipMax Machinery Ltd',
    dispatchDate: '2026-07-11',
    expectedDeliveryDate: '2026-07-22',
    deliveryStatus: 'In Transit',
    updatedAt: '2026-07-11T12:00:00Z',
  },
];

const MOCK_INVOICES: Invoice[] = [
  {
    id: 1,
    invoiceNumber: 'TX-2026-891',
    poId: 1,
    poNumber: 'PO-2026-0042',
    vendorId: 1,
    vendorName: 'TechCorp Solutions Pvt Ltd',
    invoiceDate: '2026-07-10',
    invoiceAmount: 813560,
    taxAmount: 146441,
    totalAmount: 960000,
    dueDate: '2026-08-10',
    paymentStatus: 'Verified',
    createdAt: '2026-07-10T10:00:00Z',
  },
  {
    id: 2,
    invoiceNumber: 'GL-982',
    poId: 2,
    poNumber: 'PO-2026-0041',
    vendorId: 2,
    vendorName: 'Global Logistics & Freight',
    invoiceDate: '2026-07-06',
    invoiceAmount: 266667,
    taxAmount: 13333,
    totalAmount: 280000,
    dueDate: '2026-08-21',
    paymentStatus: 'Pending',
    createdAt: '2026-07-06T11:00:00Z',
  },
  {
    id: 3,
    invoiceNumber: 'EQ-4421',
    poId: 3,
    poNumber: 'PO-2026-0040',
    vendorId: 5,
    vendorName: 'EquipMax Machinery Ltd',
    invoiceDate: '2026-07-04',
    invoiceAmount: 679688,
    taxAmount: 190313,
    totalAmount: 870000,
    dueDate: '2026-09-02',
    paymentStatus: 'Paid',
    verifiedByName: 'Lata Nair',
    createdAt: '2026-07-04T15:00:00Z',
  },
  {
    id: 4,
    invoiceNumber: 'TC-LIC-0091',
    poId: 4,
    poNumber: 'PO-2026-0039',
    vendorId: 1,
    vendorName: 'TechCorp Solutions Pvt Ltd',
    invoiceDate: '2026-07-08',
    invoiceAmount: 76272,
    taxAmount: 13728,
    totalAmount: 90000,
    dueDate: '2026-08-08',
    paymentStatus: 'Approved',
    createdAt: '2026-07-08T09:00:00Z',
  },
  {
    id: 5,
    invoiceNumber: 'TC-CCTV-441',
    poId: 5,
    poNumber: 'PO-2026-0038',
    vendorId: 1,
    vendorName: 'TechCorp Solutions Pvt Ltd',
    invoiceDate: '2026-07-14',
    invoiceAmount: 406780,
    taxAmount: 73220,
    totalAmount: 480000,
    dueDate: '2026-08-14',
    paymentStatus: 'Rejected',
    createdAt: '2026-07-14T10:00:00Z',
  },
];

const MOCK_STATUS_HISTORY: StatusHistoryEntry[] = [
  {
    id: 1,
    requestId: 1,
    oldStatus: undefined,
    newStatus: 'Pending',
    changedBy: 2,
    changedByName: 'Rohan Verma',
    changedAt: '2026-07-01T09:30:00Z',
    remarks: 'Request created',
  },
  {
    id: 2,
    requestId: 1,
    oldStatus: 'Pending',
    newStatus: 'Approved',
    changedBy: 1,
    changedByName: 'Hrithik (Admin)',
    changedAt: '2026-07-03T11:00:00Z',
    remarks: 'Budget approved, vendor assigned.',
  },
  {
    id: 3,
    requestId: 1,
    oldStatus: 'Approved',
    newStatus: 'Ordered',
    changedBy: 2,
    changedByName: 'Rohan Verma',
    changedAt: '2026-07-03T11:30:00Z',
    remarks: 'PO-2026-0042 issued to TechCorp.',
  },
];

// ─── Approved Vendors (for Vendor Assignment) ────────────────────────────────

const MOCK_APPROVED_VENDORS: ApprovedVendor[] = [
  { id: 1, vendorCode: 'VND-001', name: 'TechCorp Solutions Pvt Ltd', category: 'IT Vendors', contactPerson: 'Raj Kumar', contactEmail: 'raj@techcorp.com', contactPhone: '+91 98765 43210', reliabilityScore: 94, previousPerformance: 'Excellent', deliveryRating: 5, status: 'Active', city: 'Pune', state: 'Maharashtra' },
  { id: 2, vendorCode: 'VND-002', name: 'Global Logistics & Freight', category: 'Logistics Partners', contactPerson: 'Priya Sharma', contactEmail: 'priya@globallog.com', contactPhone: '+91 87654 32109', reliabilityScore: 87, previousPerformance: 'Good', deliveryRating: 4, status: 'Active', city: 'Bengaluru', state: 'Karnataka' },
  { id: 3, vendorCode: 'VND-005', name: 'EquipMax Machinery Ltd', category: 'Equipment Vendors', contactPerson: 'Suresh Reddy', contactEmail: 'suresh@equipmax.com', contactPhone: '+91 54321 09876', reliabilityScore: 79, previousPerformance: 'Good', deliveryRating: 4, status: 'Active', city: 'Hyderabad', state: 'Telangana' },
  { id: 4, vendorCode: 'VND-008', name: 'Zenith Office Supplies', category: 'Service Providers', contactPerson: 'Meena Joshi', contactEmail: 'meena@zenithoff.com', contactPhone: '+91 91234 56789', reliabilityScore: 91, previousPerformance: 'Excellent', deliveryRating: 5, status: 'Active', city: 'Chennai', state: 'Tamil Nadu' },
  { id: 5, vendorCode: 'VND-009', name: 'NovaSec Systems Pvt Ltd', category: 'IT Vendors', contactPerson: 'Amit Desai', contactEmail: 'amit@novasec.in', contactPhone: '+91 80123 45678', reliabilityScore: 82, previousPerformance: 'Good', deliveryRating: 4, status: 'Active', city: 'Mumbai', state: 'Maharashtra' },
  { id: 6, vendorCode: 'VND-010', name: 'SafeGuard Industries', category: 'Maintenance Vendors', contactPerson: 'Kavya Nair', contactEmail: 'kavya@safeguard.co.in', contactPhone: '+91 73456 78901', reliabilityScore: 76, previousPerformance: 'Average', deliveryRating: 3, status: 'Active', city: 'Kochi', state: 'Kerala' },
  { id: 7, vendorCode: 'VND-011', name: 'Infra Build & Civil Co.', category: 'Service Providers', contactPerson: 'Deepak Singh', contactEmail: 'deepak@ibcc.com', contactPhone: '+91 62345 67890', reliabilityScore: 88, previousPerformance: 'Excellent', deliveryRating: 4, status: 'Active', city: 'Delhi', state: 'Delhi' },
  { id: 8, vendorCode: 'VND-012', name: 'PrintMaster Communications', category: 'Service Providers', contactPerson: 'Sunita Rao', contactEmail: 'sunita@printmaster.in', contactPhone: '+91 98012 34560', reliabilityScore: 85, previousPerformance: 'Good', deliveryRating: 4, status: 'Active', city: 'Pune', state: 'Maharashtra' },
];

// ─── Utility ─────────────────────────────────────────────────────────────────

/** Simulates async network latency in dev mode */
const delay = <T>(data: T, ms = 200): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(data), ms));

// ─── Service ─────────────────────────────────────────────────────────────────

export const procurementService = {
  // ── Procurement Requests ──────────────────────────────────────────────────

  /** GET /procurement/requests (with optional pagination + filters) */
  getRequests(
    filters: ProcurementRequestFilters = {}
  ): Promise<PaginatedResult<ProcurementRequest>> {
    const { status, priority, departmentName, productCategory, assignedVendorId, page = 1, pageSize = 10 } = filters;
    let items = [...MOCK_REQUESTS];
    if (status)           items = items.filter(r => r.status === status);
    if (priority)         items = items.filter(r => r.priority === priority);
    if (departmentName)   items = items.filter(r => r.departmentName.includes(departmentName));
    if (productCategory)  items = items.filter(r => r.productCategory.includes(productCategory));
    if (assignedVendorId) items = items.filter(r => r.assignedVendorId === assignedVendorId);

    const total = items.length;
    const start = (page - 1) * pageSize;
    return delay({
      items: items.slice(start, start + pageSize),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  },

  /** GET /procurement/requests/:id */
  getRequestById(id: number): Promise<ProcurementRequest | null> {
    return delay(MOCK_REQUESTS.find(r => r.id === id) ?? null);
  },

  /** POST /procurement/requests — backend sets requestNumber, createdAt */
  createRequest(
    payload: Omit<ProcurementRequest, 'id' | 'requestNumber' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<ProcurementRequest> {
    const next: ProcurementRequest = {
      ...payload,
      id: MOCK_REQUESTS.length + 1,
      requestNumber: `PR-2026-${String(MOCK_REQUESTS.length + 1).padStart(4, '0')}`,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    MOCK_REQUESTS.push(next);
    return delay(next);
  },

  /** PATCH /procurement/requests/:id */
  updateRequest(
    id: number,
    updates: Partial<ProcurementRequest>
  ): Promise<ProcurementRequest | null> {
    const req = MOCK_REQUESTS.find(r => r.id === id);
    if (req) {
      Object.assign(req, updates);
      req.updatedAt = new Date().toISOString();
    }
    return delay(req ?? null);
  },

  /** DELETE /procurement/requests/:id */
  deleteRequest(id: number): Promise<boolean> {
    const idx = MOCK_REQUESTS.findIndex(r => r.id === id);
    if (idx !== -1) {
      MOCK_REQUESTS.splice(idx, 1);
      return delay(true);
    }
    return delay(false);
  },

  /** PATCH /procurement/requests/:id/approve */
  approveRequest(
    id: number,
    approvedByUserId: number,
    approvedByName: string,
    remarks?: string
  ): Promise<ProcurementApproval> {
    const req = MOCK_REQUESTS.find(r => r.id === id);
    const oldStatus = req?.status;
    if (req) req.status = 'Approved';
    MOCK_STATUS_HISTORY.push({
      id: Date.now(),
      requestId: id,
      oldStatus,
      newStatus: 'Approved',
      changedBy: approvedByUserId,
      changedByName: approvedByName,
      changedAt: new Date().toISOString(),
      remarks: remarks || 'Approved by reviewer.',
    });
    return delay({
      id: Date.now(),
      requestId: id,
      approvalStatus: 'Approved',
      approvedBy: approvedByUserId,
      approvedByName,
      approvalDate: new Date().toISOString(),
      remarks,
    });
  },

  /** PATCH /procurement/requests/:id/reject */
  rejectRequest(
    id: number,
    approvedByUserId: number,
    approvedByName: string,
    remarks?: string
  ): Promise<ProcurementApproval> {
    const req = MOCK_REQUESTS.find(r => r.id === id);
    const oldStatus = req?.status;
    if (req) req.status = 'Cancelled';
    MOCK_STATUS_HISTORY.push({
      id: Date.now(),
      requestId: id,
      oldStatus,
      newStatus: 'Cancelled',
      changedBy: approvedByUserId,
      changedByName: approvedByName,
      changedAt: new Date().toISOString(),
      remarks: remarks || 'Rejected by reviewer.',
    });
    return delay({
      id: Date.now(),
      requestId: id,
      approvalStatus: 'Rejected',
      approvedBy: approvedByUserId,
      approvedByName,
      approvalDate: new Date().toISOString(),
      remarks,
    });
  },

  /** PATCH /procurement/requests/:id/sendback */
  sendBackRequest(
    id: number,
    userId: number,
    userName: string,
    remarks: string
  ): Promise<ProcurementApproval> {
    const req = MOCK_REQUESTS.find(r => r.id === id);
    const oldStatus = req?.status;
    if (req) req.status = 'Pending';
    MOCK_STATUS_HISTORY.push({
      id: Date.now(),
      requestId: id,
      oldStatus,
      newStatus: 'Pending',
      changedBy: userId,
      changedByName: userName,
      changedAt: new Date().toISOString(),
      remarks,
    });
    return delay({
      id: Date.now(),
      requestId: id,
      approvalStatus: 'Sent Back',
      approvedBy: userId,
      approvedByName: userName,
      approvalDate: new Date().toISOString(),
      remarks,
    });
  },

  /** PATCH /procurement/requests/:id/vendor */
  assignVendor(
    requestId: number,
    vendorId: number,
    vendorName: string
  ): Promise<ProcurementRequest | null> {
    const req = MOCK_REQUESTS.find(r => r.id === requestId);
    if (req) {
      req.assignedVendorId = vendorId;
      req.assignedVendorName = vendorName;
    }
    return delay(req ?? null);
  },

  /** GET /procurement/requests/:id/history */
  getStatusHistory(requestId: number): Promise<StatusHistoryEntry[]> {
    return delay(MOCK_STATUS_HISTORY.filter(h => h.requestId === requestId));
  },

  // ── Purchase Orders ───────────────────────────────────────────────────────

  /** GET /procurement/purchase-orders */
  getPurchaseOrders(
    filters: { vendorId?: number; poStatus?: string; page?: number; pageSize?: number } = {}
  ): Promise<PaginatedResult<PurchaseOrder>> {
    let items = [...MOCK_PURCHASE_ORDERS];
    if (filters.vendorId)  items = items.filter(p => p.vendorId === filters.vendorId);
    if (filters.poStatus)  items = items.filter(p => p.poStatus === filters.poStatus);
    const page     = filters.page     ?? 1;
    const pageSize = filters.pageSize ?? 10;
    const total    = items.length;
    const start    = (page - 1) * pageSize;
    return delay({
      items: items.slice(start, start + pageSize),
      total, page, pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  },

  /** GET /procurement/purchase-orders/:id */
  getPurchaseOrderById(id: number): Promise<PurchaseOrder | null> {
    return delay(MOCK_PURCHASE_ORDERS.find(p => p.id === id) ?? null);
  },

  /** POST /procurement/purchase-orders — backend sets poNumber */
  createPurchaseOrder(
    payload: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt'>
  ): Promise<PurchaseOrder> {
    const po: PurchaseOrder = {
      ...payload,
      id: MOCK_PURCHASE_ORDERS.length + 1,
      poNumber: `PO-2026-${String(MOCK_PURCHASE_ORDERS.length + 37).padStart(4, '0')}`,
      createdAt: new Date().toISOString(),
    };
    MOCK_PURCHASE_ORDERS.push(po);
    const req = MOCK_REQUESTS.find(r => r.id === payload.requestId);
    const oldStatus = req?.status;
    if (req) {
      req.status = 'Ordered';
      req.updatedAt = new Date().toISOString();
    }
    // Auto-create tracking record
    MOCK_TRACKING.push({
      id: MOCK_TRACKING.length + 1,
      poId: po.id,
      poNumber: po.poNumber,
      vendorName: po.vendorName,
      expectedDeliveryDate: po.expectedDeliveryDate,
      deliveryStatus: 'Awaiting Shipment',
      updatedAt: new Date().toISOString(),
    });
    // Push status history
    if (req) {
      MOCK_STATUS_HISTORY.push({
        id: Date.now(),
        requestId: payload.requestId,
        oldStatus,
        newStatus: 'Ordered',
        changedBy: payload.approvedBy ?? 1,
        changedByName: payload.approvedByName ?? 'System',
        changedAt: new Date().toISOString(),
        remarks: `Purchase Order ${po.poNumber} issued.`,
      });
    }
    return delay(po);
  },

  /** PATCH /procurement/purchase-orders/:id */
  updatePurchaseOrder(
    id: number,
    updates: Partial<PurchaseOrder>
  ): Promise<PurchaseOrder | null> {
    const po = MOCK_PURCHASE_ORDERS.find(p => p.id === id);
    if (po) Object.assign(po, updates);
    return delay(po ?? null);
  },

  // ── Order Tracking ────────────────────────────────────────────────────────

  /** GET /procurement/tracking/:poId */
  getTracking(poId: number): Promise<OrderTracking | null> {
    return delay(MOCK_TRACKING.find(t => t.poId === poId) ?? null);
  },

  /** GET /procurement/tracking (all records) */
  getAllTracking(): Promise<OrderTracking[]> {
    return delay([...MOCK_TRACKING]);
  },

  /** PATCH /procurement/tracking/:poId */
  updateTracking(
    poId: number,
    updates: Partial<OrderTracking>
  ): Promise<OrderTracking | null> {
    const record = MOCK_TRACKING.find(t => t.poId === poId);
    if (record) {
      Object.assign(record, updates);
      record.updatedAt = new Date().toISOString();
      // compute delay_days if expected date available
      if (record.expectedDeliveryDate) {
        const exp = new Date(record.expectedDeliveryDate).getTime();
        const act = record.actualDeliveryDate ? new Date(record.actualDeliveryDate).getTime() : Date.now();
        if (act > exp) {
          record.delayDays = Math.round((act - exp) / 86_400_000);
        } else {
          record.delayDays = undefined;
        }
      }
      // If status becomes Delivered, cascade to request
      if (updates.deliveryStatus === 'Delivered') {
        const po = MOCK_PURCHASE_ORDERS.find(p => p.id === record.poId);
        if (po) {
          const req = MOCK_REQUESTS.find(r => r.id === po.requestId);
          if (req && req.status !== 'Delivered') {
            const oldStatus = req.status;
            req.status = 'Delivered';
            req.updatedAt = new Date().toISOString();
            MOCK_STATUS_HISTORY.push({
              id: Date.now(),
              requestId: req.id,
              oldStatus,
              newStatus: 'Delivered',
              changedBy: 1,
              changedByName: 'System',
              changedAt: new Date().toISOString(),
              remarks: `Shipment for PO ${po.poNumber} marked as Delivered. Sourcing request updated to Delivered.`
            });
          }
        }
      }
    }
    return delay(record ?? null);
  },

  // ── Invoices ──────────────────────────────────────────────────────────────

  /** GET /procurement/invoices */
  getInvoices(
    filters: { poId?: number; paymentStatus?: InvoicePaymentStatus; vendorId?: number } = {}
  ): Promise<Invoice[]> {
    let items = [...MOCK_INVOICES];
    if (filters.poId)          items = items.filter(i => i.poId === filters.poId);
    if (filters.paymentStatus) items = items.filter(i => i.paymentStatus === filters.paymentStatus);
    if (filters.vendorId)      items = items.filter(i => i.vendorId === filters.vendorId);
    return delay(items);
  },

  /** POST /procurement/invoices */
  uploadInvoice(
    payload: Omit<Invoice, 'id' | 'createdAt'>
  ): Promise<Invoice> {
    const inv: Invoice = {
      ...payload,
      id: MOCK_INVOICES.length + 1,
      createdAt: new Date().toISOString(),
    };
    MOCK_INVOICES.push(inv);
    return delay(inv);
  },

  /** PATCH /procurement/invoices/:id/verify */
  verifyInvoice(id: number, verifiedByUserId: number, name: string): Promise<Invoice | null> {
    const inv = MOCK_INVOICES.find(i => i.id === id);
    if (inv) {
      inv.paymentStatus = 'Verified';
      inv.verifiedBy    = verifiedByUserId;
      inv.verifiedByName = name;
    }
    return delay(inv ?? null);
  },

  /** PATCH /procurement/invoices/:id/approve */
  approveInvoice(id: number): Promise<Invoice | null> {
    const inv = MOCK_INVOICES.find(i => i.id === id);
    if (inv) inv.paymentStatus = 'Approved';
    return delay(inv ?? null);
  },

  /** PATCH /procurement/invoices/:id/pay */
  markInvoicePaid(id: number): Promise<Invoice | null> {
    const inv = MOCK_INVOICES.find(i => i.id === id);
    if (inv) {
      inv.paymentStatus = 'Paid';
      const po = MOCK_PURCHASE_ORDERS.find(p => p.id === inv.poId);
      if (po) {
        const req = MOCK_REQUESTS.find(r => r.id === po.requestId);
        if (req && req.status !== 'Completed') {
          const oldStatus = req.status;
          req.status = 'Completed';
          req.updatedAt = new Date().toISOString();
          MOCK_STATUS_HISTORY.push({
            id: Date.now(),
            requestId: req.id,
            oldStatus,
            newStatus: 'Completed',
            changedBy: 1,
            changedByName: 'System',
            changedAt: new Date().toISOString(),
            remarks: `Invoice ${inv.invoiceNumber} paid. Sourcing request updated to Completed.`
          });
        }
      }
    }
    return delay(inv ?? null);
  },

  /** PATCH /procurement/invoices/:id/reject */
  rejectInvoice(id: number, reason?: string): Promise<Invoice | null> {
    const inv = MOCK_INVOICES.find(i => i.id === id);
    if (inv) {
      inv.paymentStatus = 'Rejected';
      inv.remarks = reason;
    }
    return delay(inv ?? null);
  },

  /** GET /procurement/requests/history (global status history) */
  getAllStatusHistory(): Promise<StatusHistoryEntry[]> {
    return delay(
      [...MOCK_STATUS_HISTORY].sort(
        (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
      )
    );
  },

  // ── Approved Vendors ──────────────────────────────────────────────────────

  /** GET /procurement/approved-vendors */
  getApprovedVendors(): Promise<ApprovedVendor[]> {
    return performanceService.getMetrics().then(metricsList => {
      const updated = MOCK_APPROVED_VENDORS.map(v => {
        const vMetrics = metricsList.find(m => m.vendorName.toLowerCase().includes(v.name.toLowerCase()));
        if (vMetrics) {
          const overall = vMetrics.overallPerformanceScore;
          const prevPerf = overall >= 90 ? 'Excellent' : overall >= 80 ? 'Good' : overall >= 70 ? 'Average' : 'Poor';
          const stars = Math.max(1, Math.min(5, Math.round(vMetrics.onTimeDeliveryRate / 20)));
          return {
            ...v,
            reliabilityScore: overall,
            previousPerformance: prevPerf as any,
            deliveryRating: stars
          };
        }
        return v;
      });
      return updated;
    });
  },
};
