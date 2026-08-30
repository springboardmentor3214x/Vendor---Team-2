// mock data and types
export function formatIndianNumber(num: number): string {
  if (num === undefined || num === null) return "0";
  const parts = num.toString().split(".");
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? "." + parts[1] : "";
  
  const lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== "") {
    integerPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
  } else {
    integerPart = lastThree;
  }
  return integerPart + decimalPart;
}

export function toINR(value: number): string {
  if (value === undefined || value === null) return "₹0";
  return `₹${formatIndianNumber(Math.round(value))}`;
}

export function toINRCompact(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`;
  if (value >= 100000)   return `₹${(value / 100000).toFixed(1)} L`;
  if (value >= 1000)     return `₹${(value / 1000).toFixed(1)} K`;
  return `₹${formatIndianNumber(value)}`;
}

export type Role = "Administrator" | "Procurement Manager" | "Supply Chain Manager" | "Vendor" | "Finance Officer" | "Auditor";

export type VendorCategory = "Raw Material Suppliers" | "Equipment Vendors" | "IT Vendors" | "Service Providers" | "Logistics Partners" | "Maintenance Vendors";

export type VendorStatus = "Active" | "Pending" | "Inactive" | "Suspended" | "Rejected";
export type ApprovalStatus = "Approved" | "Pending" | "Rejected";

export interface VendorContact {
  name: string;
  designation: string;
  email: string;
  phone: string;
  altPhone?: string;
}

export interface VendorDocument {
  id: string;
  name: string;
  type: string; // "GST", "PAN", "ISO", "Other"
  fileUrl: string;
  uploadDate: string;
  size: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  contacts: VendorContact[];
  email: string;
  phone: string;
  gstNumber: string;
  panNumber: string;
  registrationNumber: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  website?: string;
  description?: string;
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  paymentTerms: string; // "Net 15", "Net 30", "Net 45", "Net 60"
  status: VendorStatus;
  approvalStatus: ApprovalStatus;
  documents: VendorDocument[];
  auditInfo: {
    createdBy: string;
    createdDate: string;
    lastUpdatedBy?: string;
    lastUpdatedDate?: string;
    approvedBy?: string;
    approvedDate?: string;
  };
}

export interface PurchaseOrder {
  id: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  status: "Draft" | "Pending" | "Approved" | "Rejected" | "Completed";
  date: string;
  category: string;
  items: { description: string; qty: number; unitPrice: number }[];
  deliveryDate?: string;
  paymentStatus: "Unpaid" | "Partial" | "Paid";
}

export interface Contract {
  id: string;
  vendorId: string;
  vendorName: string;
  title: string;
  startDate: string;
  endDate: string;
  value: number;
  status: "Active" | "Expired" | "Under Review" | "Terminated";
  documentUrl?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  details: string;
  ipAddress: string;
}

export interface Invoice {
  id: string;
  poId: string;
  vendorName: string;
  amount: number;
  dueDate: string;
  status: "Pending Approval" | "Paid" | "Overdue";
  invoiceNum: string;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "info" | "warning" | "success" | "danger";
}

// Raw data
export const INITIAL_VENDORS: Vendor[] = [
  {
    id: "VND-001",
    name: "TechCorp Solutions Pvt Ltd",
    category: "IT Vendors",
    contacts: [
      { name: "Raj Kumar", designation: "Enterprise Sales Director", email: "raj@techcorp.com", phone: "+91 98765 43210" },
      { name: "Sanjay Sen", designation: "Account Support Lead", email: "sanjay.s@techcorp.com", phone: "+91 98765 43211" }
    ],
    email: "contact@techcorp.com",
    phone: "+91 98765 43200",
    gstNumber: "27AAAAA1111A1Z1",
    panNumber: "AAAAA1111A",
    registrationNumber: "U72200MH2018PTC123456",
    address: {
      line1: "Building 4, Tech Park",
      line2: "Hinjewadi Phase 2",
      city: "Pune",
      state: "Maharashtra",
      country: "India",
      pincode: "411057"
    },
    website: "https://www.techcorp.com",
    description: "Enterprise IT support, cloud integrations, and software licenses reseller.",
    bankDetails: {
      accountNumber: "918020038827110",
      ifscCode: "UTIB0000010",
      bankName: "Axis Bank"
    },
    paymentTerms: "Net 30",
    status: "Active",
    approvalStatus: "Approved",
    documents: [
      { id: "doc-1", name: "TechCorp_GST_Certificate.pdf", type: "GST", fileUrl: "#", uploadDate: "2026-01-10", size: "1.2 MB" },
      { id: "doc-2", name: "TechCorp_PAN_Card.pdf", type: "PAN", fileUrl: "#", uploadDate: "2026-01-10", size: "450 KB" }
    ],
    auditInfo: {
      createdBy: "Hrithik (Administrator)",
      createdDate: "2026-01-10 10:30",
      approvedBy: "Priya Sharma (Auditor)",
      approvedDate: "2026-01-11 14:20"
    }
  },
  {
    id: "VND-002",
    name: "Global Logistics & Freight",
    category: "Logistics Partners",
    contacts: [
      { name: "Priya Sharma", designation: "Head of Logistics Operations", email: "priya@globallog.com", phone: "+91 87654 32109" }
    ],
    email: "support@globallog.com",
    phone: "+91 87654 32100",
    gstNumber: "29BBBBB2222B2Z2",
    panNumber: "BBBBB2222B",
    registrationNumber: "U60230KA2020PTC234567",
    address: {
      line1: "12 Logistics Hub",
      line2: "Outer Ring Road",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      pincode: "560048"
    },
    website: "https://www.globallog.com",
    description: "Third-party logistics, warehousing, cold-chain operations, and distribution.",
    bankDetails: {
      accountNumber: "000210200001928",
      ifscCode: "HDFC0000002",
      bankName: "HDFC Bank"
    },
    paymentTerms: "Net 45",
    status: "Active",
    approvalStatus: "Approved",
    documents: [
      { id: "doc-3", name: "GlobalLog_GST.png", type: "GST", fileUrl: "#", uploadDate: "2026-02-15", size: "850 KB" }
    ],
    auditInfo: {
      createdBy: "Procurement Bot",
      createdDate: "2026-02-15 08:00",
      approvedBy: "Hrithik (Administrator)",
      approvedDate: "2026-02-15 11:30"
    }
  },
  {
    id: "VND-003",
    name: "BuildRight Construction Pvt Ltd",
    category: "Service Providers",
    contacts: [
      { name: "Ankit Patel", designation: "Civil Works Exec", email: "ankit@buildright.com", phone: "+91 76543 21098" }
    ],
    email: "info@buildright.com",
    phone: "+91 76543 21090",
    gstNumber: "24CCCCC3333C3Z3",
    panNumber: "CCCCC3333C",
    registrationNumber: "U45201GJ2015PTC345678",
    address: {
      line1: "45 Industrial Area",
      city: "Ahmedabad",
      state: "Gujarat",
      country: "India",
      pincode: "380009"
    },
    bankDetails: {
      accountNumber: "50200007891234",
      ifscCode: "HDFC0000053",
      bankName: "HDFC Bank"
    },
    paymentTerms: "Net 15",
    status: "Pending",
    approvalStatus: "Pending",
    documents: [
      { id: "doc-4", name: "BuildRight_GST.pdf", type: "GST", fileUrl: "#", uploadDate: "2026-06-25", size: "2.1 MB" },
      { id: "doc-5", name: "BuildRight_CoReg.pdf", type: "Other", fileUrl: "#", uploadDate: "2026-06-25", size: "3.4 MB" }
    ],
    auditInfo: {
      createdBy: "Ankit Patel (Vendor Self Registry)",
      createdDate: "2026-06-25 15:45"
    }
  },
  {
    id: "VND-004",
    name: "SoftSolutions Inc",
    category: "IT Vendors",
    contacts: [
      { name: "Neha Gupta", designation: "Account Executive", email: "neha@softsoln.com", phone: "+91 65432 10987" }
    ],
    email: "sales@softsoln.com",
    phone: "+91 65432 10980",
    gstNumber: "27DDDDD4444D4Z4",
    panNumber: "DDDDD4444D",
    registrationNumber: "U72900MH2021PTC456789",
    address: {
      line1: "Unit 301, Infinite Loop Rd",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      pincode: "400001"
    },
    bankDetails: {
      accountNumber: "000910400039281",
      ifscCode: "ICIC0000009",
      bankName: "ICICI Bank"
    },
    paymentTerms: "Net 30",
    status: "Rejected",
    approvalStatus: "Rejected",
    documents: [],
    auditInfo: {
      createdBy: "Hrithik (Administrator)",
      createdDate: "2026-03-01 12:00",
      approvedBy: "Priya Sharma (Auditor)",
      approvedDate: "2026-03-03 10:00"
    }
  },
  {
    id: "VND-005",
    name: "EquipMax Machinery Ltd",
    category: "Equipment Vendors",
    contacts: [
      { name: "Suresh Reddy", designation: "Procurement Manager", email: "suresh@equipmax.com", phone: "+91 54321 09876" }
    ],
    email: "info@equipmax.com",
    phone: "+91 54321 09870",
    gstNumber: "36EEEEE5555E5Z5",
    panNumber: "EEEEE5555E",
    registrationNumber: "U29100TG2017PLC567890",
    address: {
      line1: "Gaganpahad Industrial Area",
      city: "Hyderabad",
      state: "Telangana",
      country: "India",
      pincode: "500052"
    },
    bankDetails: {
      accountNumber: "10928374656",
      ifscCode: "SBIN0000301",
      bankName: "State Bank of India"
    },
    paymentTerms: "Net 60",
    status: "Suspended",
    approvalStatus: "Approved",
    documents: [],
    auditInfo: {
      createdBy: "Procurement Bot",
      createdDate: "2026-04-10 09:00",
      approvedBy: "Hrithik (Administrator)",
      approvedDate: "2026-04-11 16:30"
    }
  }
];

export const INITIAL_ORDERS: PurchaseOrder[] = [
  {
    id: "PO-2026-0042",
    vendorId: "VND-001",
    vendorName: "TechCorp Solutions Pvt Ltd",
    amount: 450000,
    status: "Approved",
    date: "2026-07-01",
    category: "IT Services",
    items: [
      { description: "Developer Workstations (Intel i9 / 32GB RAM)", qty: 3, unitPrice: 120000 },
      { description: "Figma Professional Licenses Annual renewal", qty: 6, unitPrice: 15000 }
    ],
    deliveryDate: "2026-07-15",
    paymentStatus: "Unpaid"
  },
  {
    id: "PO-2026-0041",
    vendorId: "VND-002",
    vendorName: "Global Logistics & Freight",
    amount: 280000,
    status: "Pending",
    date: "2026-06-30",
    category: "Logistics Partners",
    items: [
      { description: "Reefer shipment packaging and transport (Mumbai to Pune)", qty: 2, unitPrice: 140000 }
    ],
    paymentStatus: "Unpaid"
  },
  {
    id: "PO-2026-0040",
    vendorId: "VND-003",
    vendorName: "BuildRight Construction Pvt Ltd",
    amount: 1200000,
    status: "Draft",
    date: "2026-06-28",
    category: "Service Providers",
    items: [
      { description: "Foundation repair and flooring layout at Warehouse C", qty: 1, unitPrice: 1200000 }
    ],
    paymentStatus: "Unpaid"
  },
  {
    id: "PO-2026-0039",
    vendorId: "VND-004",
    vendorName: "SoftSolutions Inc",
    amount: 320000,
    status: "Rejected",
    date: "2026-06-25",
    category: "IT Vendors",
    items: [
      { description: "Custom UI Integration and design consulting", qty: 1, unitPrice: 320000 }
    ],
    paymentStatus: "Unpaid"
  },
  {
    id: "PO-2026-0038",
    vendorId: "VND-005",
    vendorName: "EquipMax Machinery Ltd",
    amount: 870000,
    status: "Completed",
    date: "2026-06-22",
    category: "Equipment Vendors",
    items: [
      { description: "Industrial Forklift Model X200", qty: 1, unitPrice: 870000 }
    ],
    deliveryDate: "2026-07-01",
    paymentStatus: "Paid"
  }
];

export const INITIAL_CONTRACTS: Contract[] = [
  { id: "CON-2026-001", vendorId: "VND-001", vendorName: "TechCorp Solutions Pvt Ltd", title: "IT Infrastructure Support SLA", startDate: "2026-01-01", endDate: "2027-01-01", value: 1800000, status: "Active" },
  { id: "CON-2026-002", vendorId: "VND-002", vendorName: "Global Logistics & Freight", title: "National Cargo & Distribution Agreement", startDate: "2026-02-15", endDate: "2027-02-15", value: 4500000, status: "Active" },
  { id: "CON-2026-003", vendorId: "VND-005", vendorName: "EquipMax Machinery Ltd", title: "Leased Machinery Maintenance & Repair", startDate: "2026-04-10", endDate: "2026-10-10", value: 1200000, status: "Active" }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: "AUD-001", timestamp: "2026-07-07 10:45", user: "Hrithik", role: "Administrator", action: "Vendor Created", details: "Created new vendor profile: VND-003 (BuildRight)", ipAddress: "192.168.1.45" },
  { id: "AUD-002", timestamp: "2026-07-06 14:20", user: "Rohan V", role: "Procurement Manager", action: "PO Released", details: "Generated PO-2026-0042 value ₹4.5 L for TechCorp", ipAddress: "192.168.1.18" },
  { id: "AUD-003", timestamp: "2026-07-05 16:10", user: "Lata Nair", role: "Finance Officer", action: "Payment Successful", details: "Processed vendor payout ₹8.7 L to EquipMax", ipAddress: "192.168.1.92" },
  { id: "AUD-004", timestamp: "2026-07-04 11:30", user: "Priya Sharma", role: "Auditor", action: "Document Approval", details: "Approved GST documents for TechCorp Solutions", ipAddress: "192.168.3.11" }
];

export const INITIAL_INVOICES: Invoice[] = [
  { id: "INV-001", poId: "PO-2026-0042", vendorName: "TechCorp Solutions Pvt Ltd", amount: 450000, dueDate: "2026-08-01", status: "Pending Approval", invoiceNum: "TX-2026-891" },
  { id: "INV-002", poId: "PO-2026-0038", vendorName: "EquipMax Machinery Ltd", amount: 870000, dueDate: "2026-07-22", status: "Paid", invoiceNum: "EQ-4421" },
  { id: "INV-003", poId: "PO-2026-0041", vendorName: "Global Logistics & Freight", amount: 280000, dueDate: "2026-08-15", status: "Pending Approval", invoiceNum: "GL-982" }
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: "not-1", title: "New Vendor Application", description: "BuildRight Construction Pvt Ltd submitted full registry details.", time: "1 hour ago", read: false, type: "info" },
  { id: "not-2", title: "PO Pending Approval", description: "PO-2026-0041 (Global Logistics) is waiting for Finance Officer authorization.", time: "3 hours ago", read: false, type: "warning" },
  { id: "not-3", title: "SLA Alert", description: "EquipMax machinery response latency exceeds contract limits.", time: "Yesterday", read: true, type: "danger" }
];
