import React from "react";

export function LoadingSkeleton({ w = "100%", h = 18, br = 6 }: { w?: string | number; h?: number; br?: number }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: br,
        background: "linear-gradient(90deg, #F3F4F6 25%, #E9EBEE 50%, #F3F4F6 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite",
      }}
    />
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    Pending: ["#FFF3E0", "#E65100"],
    Approved: ["#E8F5E9", "#2E7D32"],
    Ordered: ["#EFF6FF", "#1565C0"],
    Delivered: ["#F3E8FF", "#6A1B9A"],
    Completed: ["#E0F7FA", "#00695C"],
    Cancelled: ["#FFEBEE", "#B71C1C"],
    Issued: ["#EFF6FF", "#1565C0"],
    "In Transit": ["#F3E8FF", "#6A1B9A"],
    Fulfilled: ["#E8F5E9", "#2E7D32"],
    "Awaiting Shipment": ["#FFF8E1", "#F57F17"],
    Delayed: ["#FFEBEE", "#B71C1C"],
    Active: ["#E8F5E9", "#2E7D32"],
    Renewed: ["#EFF6FF", "#1565C0"],
    Draft: ["#F3F4F6", "#667085"],
    Expired: ["#FFEBEE", "#B71C1C"],
    Terminated: ["#FFEBEE", "#C62828"],
    Valid: ["#E8F5E9", "#2E7D32"],
    "Expiring Soon": ["#FFF3E0", "#E65100"],
    Compliant: ["#E8F5E9", "#2E7D32"],
    "Non-Compliant": ["#FFEBEE", "#B71C1C"],
    "Pending Verification": ["#FFF8E1", "#F57F17"],
    "Low Risk": ["#E8F5E9", "#2E7D32"],
    "Medium Risk": ["#FFF3E0", "#E65100"],
    "High Risk": ["#FFEBEE", "#B71C1C"],
    Recommended: ["#E8F5E9", "#2E7D32"],
    Conditional: ["#FFF3E0", "#E65100"],
    "Not Recommended": ["#FFEBEE", "#B71C1C"],
  };

  const [bg, color] = map[status] ?? ["#F3F4F6", "#374151"];
  return (
    <span
      style={{
        background: bg,
        color,
        fontSize: 11,
        fontWeight: 700,
        borderRadius: 100,
        padding: "3px 10px",
        whiteSpace: "nowrap",
        display: "inline-block",
      }}
    >
      {status}
    </span>
  );
}

export function formatINR(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)} L`;
  }
  return `₹${amount.toLocaleString("en-IN")}`;
}
