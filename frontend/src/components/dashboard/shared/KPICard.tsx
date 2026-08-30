import React from "react";
import { LoadingSkeleton } from "./DashboardUtils";

export interface KPICardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: React.ElementType;
  iconColor?: string;
  accentColor?: string;
  badgeText?: string;
  badgeColor?: string;
  badgeBg?: string;
  onClick?: () => void;
  loading?: boolean;
}

export function KPICard({
  title,
  value,
  subtext,
  icon: Icon,
  iconColor = "#1565C0",
  accentColor = "#1565C0",
  badgeText,
  badgeColor,
  badgeBg,
  onClick,
  loading = false,
}: KPICardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        border: "1px solid #E4E7EC",
        borderTop: `4px solid ${accentColor}`,
        borderRadius: 12,
        padding: 20,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: 120,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {title}
          </span>
          {loading ? (
            <div style={{ marginTop: 8 }}>
              <LoadingSkeleton w={80} h={32} />
            </div>
          ) : (
            <div style={{ fontSize: 30, fontWeight: 800, color: "#111827", marginTop: 4, lineHeight: 1.1 }}>
              {value}
            </div>
          )}
        </div>
        {Icon && (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `${iconColor}12`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon size={20} color={iconColor} />
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
        {subtext && <span style={{ fontSize: 12, color: "#667085" }}>{subtext}</span>}
        {badgeText && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              background: badgeBg || `${accentColor}15`,
              color: badgeColor || accentColor,
              borderRadius: 100,
              padding: "2px 8px",
            }}
          >
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
}
