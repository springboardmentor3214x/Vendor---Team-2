/**
 * Module 3 – Procurement Management
 * TypeScript interface/model definitions.
 *
 * These mirror the backend SQLAlchemy schemas exactly so that
 * swapping the mock ProcurementService for real HTTP calls
 * requires zero interface changes.
 */

// ─── Enums ───────────────────────────────────────────────────────────────────

export type ProcurementPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type ProcurementStatus =
  | 'Pending'
  | 'Approved'
  | 'Ordered'
  | 'Delivered'
  | 'Completed'
  | 'Cancelled';

export type ApprovalDecision = 'Approved' | 'Rejected' | 'Sent Back';

/** Approved vendor entry used in the Vendor Assignment screen */
export interface ApprovedVendor {
  id: number;
  vendorCode: string;
  name: string;
  category: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  reliabilityScore: number;   // 0-100
  previousPerformance: 'Excellent' | 'Good' | 'Average' | 'Poor';
  deliveryRating: number;     // 1-5 stars
  status: 'Active' | 'Suspended';
  city: string;
  state: string;
}

export type DeliveryStatus =
  | 'Awaiting Shipment'
  | 'In Transit'
  | 'Delivered'
  | 'Delayed'
  | 'Completed';

export type InvoicePaymentStatus =
  | 'Pending'
  | 'Verified'
  | 'Approved'
  | 'Paid'
  | 'Rejected';

// ─── Core Models ─────────────────────────────────────────────────────────────

/** Mirrors backend `procurement_requests` table */
export interface ProcurementRequest {
  id: number;
  requestNumber: string;          // PR-YYYY-XXXX
  requestTitle: string;
  departmentName: string;
  requestedBy: number;            // FK → users.id
  requestedByName?: string;       // denormalised for display
  itemName: string;
  productCategory: string;
  quantity: number;
  unitOfMeasurement: string;
  estimatedBudget: number;        // in INR
  requiredDeliveryDate: string;   // ISO date string
  priority: ProcurementPriority;
  businessJustification: string;
  additionalRemarks?: string;
  supportingDocumentUrl?: string;
  status: ProcurementStatus;
  assignedVendorId?: number;
  assignedVendorName?: string;    // denormalised for display
  createdAt: string;              // ISO datetime string
  updatedAt?: string;
}

/** Mirrors backend `procurement_approvals` table */
export interface ProcurementApproval {
  id: number;
  requestId: number;
  approvalStatus: ApprovalDecision;
  approvedBy: number;             // FK → users.id
  approvedByName?: string;
  approvalDate: string;
  remarks?: string;
}

/** Mirrors backend `purchase_orders` table */
export interface PurchaseOrder {
  id: number;
  poNumber: string;               // PO-YYYY-XXXX
  requestId: number;
  requestNumber?: string;         // denormalised for display
  vendorId: number;
  vendorName: string;             // denormalised for display
  productDetails: string;
  quantityOrdered: number;
  unitPrice: number;
  totalCost: number;
  taxDetails?: string;
  shippingAddress?: string;
  expectedDeliveryDate?: string;
  paymentTerms?: string;
  poStatus: string;               // Draft | Issued | Fulfilled | Cancelled
  approvedBy?: number;
  approvedByName?: string;
  poDate?: string;
  createdAt: string;
}

/** Mirrors backend `order_tracking` table */
export interface OrderTracking {
  id: number;
  poId: number;
  poNumber?: string;              // denormalised for display
  vendorName?: string;
  dispatchDate?: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  deliveryStatus: DeliveryStatus;
  delayDays?: number;             // computed by backend, null when on-time
  remarks?: string;
  updatedAt: string;
}

/** Mirrors backend `invoices` table */
export interface Invoice {
  id: number;
  invoiceNumber: string;
  poId: number;
  poNumber?: string;              // denormalised for display
  vendorId: number;
  vendorName: string;
  invoiceDate: string;
  invoiceAmount: number;
  taxAmount: number;
  totalAmount: number;
  dueDate?: string;
  paymentStatus: InvoicePaymentStatus;
  invoiceDocumentUrl?: string;
  verifiedBy?: number;
  verifiedByName?: string;
  remarks?: string;
  createdAt: string;
}

/** Mirrors backend `procurement_status_history` table */
export interface StatusHistoryEntry {
  id: number;
  requestId: number;
  oldStatus?: string;
  newStatus: string;
  changedBy: number;
  changedByName?: string;
  changedAt: string;
  remarks?: string;
}

// ─── Pagination & Filter Params ───────────────────────────────────────────────
// Structured to mirror future REST query params exactly.

export interface ProcurementRequestFilters {
  status?: ProcurementStatus;
  priority?: ProcurementPriority;
  departmentName?: string;
  productCategory?: string;
  assignedVendorId?: number;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
