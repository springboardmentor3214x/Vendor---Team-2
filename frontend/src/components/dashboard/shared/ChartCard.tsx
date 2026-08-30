import React from "react";
import { LoadingSkeleton } from "./DashboardUtils";

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyText?: string;
  height?: number;
}

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  loading = false,
  empty = false,
  emptyText = "No data available for the selected filters",
  height = 260,
}: ChartCardProps) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E4E7EC",
        borderRadius: 12,
        padding: 20,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>{title}</h3>
          {subtitle && <p style={{ fontSize: 12, color: "#667085", margin: "2px 0 0 0" }}>{subtitle}</p>}
        </div>
        {action}
      </div>

      {loading ? (
        <div style={{ height, display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
          <LoadingSkeleton h={height * 0.7} />
          <LoadingSkeleton w="60%" h={14} />
        </div>
      ) : empty ? (
        <div
          style={{
            height,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#F9FAFB",
            borderRadius: 8,
            border: "1px dashed #E4E7EC",
            color: "#667085",
            fontSize: 13,
          }}
        >
          <span>{emptyText}</span>
        </div>
      ) : (
        <div style={{ height, width: "100%" }}>{children}</div>
      )}
    </div>
  );
}
