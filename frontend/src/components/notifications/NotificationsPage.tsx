import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Bell, BellRing, CheckCheck, Trash2, Filter, Search,
  ChevronDown, ChevronLeft, ChevronRight, X, RefreshCw,
  AlertTriangle, Clock, FileText, MessageSquare, Package,
  ShieldCheck, Building2, BarChart2, Settings, Mail, Phone,
  Layers, List, ExternalLink, Eye, EyeOff, Calendar,
  CheckSquare, Square, Minus, ArrowUpDown, Info, Zap
} from "lucide-react";
import { notificationService } from "../../services/notificationService";
import { notificationSimulatorService, SIMULATED_EVENT_TYPES } from "../../services/notificationSimulatorService";
import type {
  AppNotification, NotificationFilters,
  NotificationType, NotificationPriority, RelatedModule
} from "../../models/notification";
import type { UserRole } from "../../models/notification";

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_META: Record<string, { color: string; bg: string; border: string; label: string; ring: string }> = {
  HIGH:   { color: "#B71C1C", bg: "#FFF3F3", border: "#FFCDD2", label: "High",   ring: "#B71C1C30" },
  MEDIUM: { color: "#E65100", bg: "#FFF8F0", border: "#FFE0B2", label: "Medium", ring: "#E6510030" },
  LOW:    { color: "#1565C0", bg: "#F0F4FF", border: "#BBDEFB", label: "Low",    ring: "#1565C030" },
};

const MODULE_META: Record<string, { bg: string; fg: string }> = {
  "Vendor Management":      { bg: "#E8F5E9", fg: "#2E7D32" },
  "Procurement":            { bg: "#EEF4FF", fg: "#1565C0" },
  "Performance":            { bg: "#F3E5F5", fg: "#6A1B9A" },
  "Contracts & Compliance": { bg: "#FFF8E1", fg: "#F57F17" },
  "Communication":          { bg: "#E0F7FA", fg: "#006064" },
  "Reports":                { bg: "#F1F8E9", fg: "#33691E" },
  "System":                 { bg: "#F5F5F5", fg: "#424242" },
};

// Module → app tab mapping for "Go to related record"
const MODULE_TAB: Record<string, string> = {
  "Vendor Management":      "vendors",
  "Procurement":            "proc-requests",
  "Performance":            "perf-dashboard",
  "Contracts & Compliance": "cc-repository",
  "Communication":          "comm-messages",
  "Reports":                "reports",
  "System":                 "settings",
};

// Type icon mapping
function TypeIcon({ type, size = 15 }: { type: string; size?: number }) {
  const props = { size };
  switch (type) {
    case "DELIVERY_DELAY":       return <Clock {...props} />;
    case "CONTRACT_EXPIRY":      return <FileText {...props} />;
    case "COMPLIANCE_ALERT":     return <ShieldCheck {...props} />;
    case "VENDOR_APPROVAL":      return <ShieldCheck {...props} />;
    case "VENDOR_REJECTION":     return <X {...props} />;
    case "PROCUREMENT_ALERT":    return <AlertTriangle {...props} />;
    case "PROCUREMENT_REQUEST":  return <FileText {...props} />;
    case "PO_CREATED":           return <Package {...props} />;
    case "INVOICE_APPROVED":     return <CheckCheck {...props} />;
    case "MESSAGE_RECEIVED":     return <MessageSquare {...props} />;
    case "REPORT_GENERATED":     return <BarChart2 {...props} />;
    case "PROFILE_UPDATED":      return <Building2 {...props} />;
    case "PASSWORD_CHANGED":     return <Settings {...props} />;
    default:                     return <Bell {...props} />;
  }
}

const TYPE_LABEL: Record<string, string> = {
  PROCUREMENT_ALERT:   "Procurement Alert",
  DELIVERY_DELAY:      "Delivery Delay",
  VENDOR_APPROVAL:     "Vendor Approval",
  VENDOR_REJECTION:    "Vendor Rejection",
  CONTRACT_EXPIRY:     "Contract Expiry",
  COMPLIANCE_ALERT:    "Compliance Alert",
  INVOICE_APPROVED:    "Invoice Approved",
  PO_CREATED:          "PO Created",
  PROCUREMENT_REQUEST: "Procurement Request",
  MESSAGE_RECEIVED:    "Message Received",
  REPORT_GENERATED:    "Report Generated",
  PROFILE_UPDATED:     "Profile Updated",
  PASSWORD_CHANGED:    "Password Changed",
};

const PAGE_SIZES = [10, 25, 50];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day:"2-digit", month:"short" });
}

function absTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

// ─── Detail Dialog ────────────────────────────────────────────────────────────

function DetailDialog({
  notification,
  onClose,
  onMarkRead,
  onMarkUnread,
  onDelete,
  onNavigate,
}: {
  notification: AppNotification;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (tab: string) => void;
}) {
  const p = PRIORITY_META[notification.priority];
  const m = MODULE_META[notification.relatedModule] ?? { bg: "#F1F5F9", fg: "#374151" };
  const isUnread = !notification.readStatus;

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "rgba(0,0,0,0.45)", display: "flex",
        alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(2px)",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 16, width: "min(680px,95vw)",
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
        animation: "dialogPop 0.2s ease-out",
      }}>
        {/* Dialog header */}
        <div style={{
          padding: "18px 22px 16px",
          borderBottom: "1px solid #F1F5F9",
          display: "flex", alignItems: "flex-start", gap: 14,
          background: `linear-gradient(135deg, ${p.bg} 0%, #fff 100%)`,
          borderRadius: "16px 16px 0 0",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 11, flexShrink: 0,
            background: p.bg, border: `1.5px solid ${p.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: p.color,
          }}>
            <TypeIcon type={notification.notificationType} size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: "#111827", margin: 0, lineHeight: 1.35 }}>
                {notification.title}
                {isUnread && (
                  <span style={{
                    display: "inline-block", width: 8, height: 8, background: p.color,
                    borderRadius: "50%", verticalAlign: "middle", marginLeft: 8,
                  }} />
                )}
              </h2>
              <button onClick={onClose} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#9CA3AF", padding: 4, display: "flex", flexShrink: 0,
              }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, background: p.bg, color: p.color,
                border: `1px solid ${p.border}`, padding: "2px 8px", borderRadius: 100 }}>
                ● {p.label} Priority
              </span>
              <span style={{ fontSize: 10.5, fontWeight: 700, background: m.bg, color: m.fg,
                padding: "2px 8px", borderRadius: 100 }}>
                {notification.relatedModule}
              </span>
              <span style={{ fontSize: 10.5, background: "#F9FAFB", color: "#6B7280",
                padding: "2px 8px", borderRadius: 100 }}>
                {TYPE_LABEL[notification.notificationType]}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 22px" }}>
          {/* Description */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase",
              letterSpacing: "0.6px", marginBottom: 6 }}>Description</div>
            <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.65, margin: 0 }}>
              {notification.description}
            </p>
          </div>

          {/* Metadata grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            {[
              { label: "Notification ID", value: notification.notificationId },
              { label: "Read Status", value: isUnread ? "⬤ Unread" : "✓ Read" },
              { label: "Sent", value: absTime(notification.timestamp) },
              { label: "Relative", value: relativeTime(notification.timestamp) },
              ...(notification.relatedRecordId ? [{ label: "Related Record", value: notification.relatedRecordId }] : []),
              { label: "Delivery Channels", value: notification.deliveryMethod.join(" · ") },
            ].map((item, i) => (
              <div key={i} style={{
                background: "#F9FAFB", border: "1px solid #F1F5F9",
                borderRadius: 8, padding: "10px 12px",
              }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: "#9CA3AF",
                  textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#111827", fontFamily: "monospace" }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Delivery method icons */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>Delivered via:</span>
            {notification.deliveryMethod.includes("IN_APP") && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11,
                color: "#1565C0", background: "#EEF4FF", padding: "3px 9px", borderRadius: 100 }}>
                <Bell size={10} /> In-App
              </span>
            )}
            {notification.deliveryMethod.includes("EMAIL") && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11,
                color: "#E65100", background: "#FFF8F0", padding: "3px 9px", borderRadius: 100 }}>
                <Mail size={10} /> Email
              </span>
            )}
            {notification.deliveryMethod.includes("SMS") && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11,
                color: "#2E7D32", background: "#E8F5E9", padding: "3px 9px", borderRadius: 100 }}>
                <Phone size={10} /> SMS
              </span>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 16,
            borderTop: "1px solid #F1F5F9" }}>
            {notification.relatedRecordId && (
              <button
                onClick={() => {
                  const tab = MODULE_TAB[notification.relatedModule] ?? "dashboard";
                  onNavigate(tab);
                  onClose();
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "#111827", color: "#fff", border: "none",
                  borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700,
                  cursor: "pointer", fontFamily: "Inter, sans-serif",
                }}
              >
                <ExternalLink size={13} /> Go to Related Record
              </button>
            )}
            {isUnread ? (
              <button onClick={() => { onMarkRead(notification.notificationId); onClose(); }}
                style={{ display: "flex", alignItems: "center", gap: 6, color: "#1565C0",
                  background: "#EEF4FF", border: "1px solid #BBDEFB", borderRadius: 8,
                  padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  fontFamily: "Inter, sans-serif" }}>
                <Eye size={13} /> Mark as Read
              </button>
            ) : (
              <button onClick={() => { onMarkUnread(notification.notificationId); onClose(); }}
                style={{ display: "flex", alignItems: "center", gap: 6, color: "#6B7280",
                  background: "#F9FAFB", border: "1px solid #E4E7EC", borderRadius: 8,
                  padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  fontFamily: "Inter, sans-serif" }}>
                <EyeOff size={13} /> Mark as Unread
              </button>
            )}
            <button onClick={() => { onDelete(notification.notificationId); onClose(); }}
              style={{ display: "flex", alignItems: "center", gap: 6, color: "#C62828",
                background: "#FFEBEE", border: "1px solid #FFCDD2", borderRadius: 8,
                padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                marginLeft: "auto", fontFamily: "Inter, sans-serif" }}>
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Notification Row ─────────────────────────────────────────────────────────

function NotificationRow({
  notification,
  selected,
  onToggleSelect,
  onOpen,
  onMarkRead,
  onMarkUnread,
  onDelete,
}: {
  notification: AppNotification;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onOpen: (n: AppNotification) => void;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const p = PRIORITY_META[notification.priority];
  const m = MODULE_META[notification.relatedModule] ?? { bg: "#F1F5F9", fg: "#374151" };
  const isUnread = !notification.readStatus;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "36px 36px 1fr auto",
        gap: 0,
        alignItems: "center",
        background: selected ? "#EEF4FF" : isUnread ? "#FAFBFF" : (hovered ? "#F9FAFB" : "#fff"),
        borderLeft: `4px solid ${isUnread ? p.color : "transparent"}`,
        borderBottom: "1px solid #F1F5F9",
        transition: "background 0.12s",
        cursor: "default",
        minHeight: 64,
      }}
    >
      {/* Checkbox */}
      <div
        onClick={() => onToggleSelect(notification.notificationId)}
        style={{ display: "flex", alignItems: "center", justifyContent: "center",
          height: "100%", cursor: "pointer", flexShrink: 0 }}
      >
        {selected
          ? <CheckSquare size={15} color="#1565C0" />
          : <Square size={15} color="#D1D5DB" />
        }
      </div>

      {/* Type icon */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexShrink: 0 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7, background: p.bg,
          border: `1px solid ${p.border}`, display: "flex", alignItems: "center",
          justifyContent: "center", color: p.color,
        }}>
          <TypeIcon type={notification.notificationType} size={13} />
        </div>
      </div>

      {/* Content */}
      <div
        onClick={() => onOpen(notification)}
        style={{ padding: "10px 14px 10px 8px", cursor: "pointer", minWidth: 0 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 12.5, fontWeight: isUnread ? 700 : 500,
            color: "#111827", lineHeight: 1.3 }}>
            {notification.title}
          </span>
          {isUnread && (
            <span style={{ width: 6, height: 6, background: p.color,
              borderRadius: "50%", flexShrink: 0 }} />
          )}
        </div>
        <p style={{ fontSize: 11.5, color: "#667085", margin: "0 0 6px 0",
          lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 1,
          WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {notification.description}
        </p>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 9.5, fontWeight: 700, background: m.bg, color: m.fg,
            padding: "1px 7px", borderRadius: 100 }}>
            {notification.relatedModule}
          </span>
          <span style={{ fontSize: 9.5, background: p.bg, color: p.color,
            border: `1px solid ${p.border}`, padding: "1px 7px", borderRadius: 100, fontWeight: 700 }}>
            {p.label}
          </span>
          <span style={{ fontSize: 9.5, background: "#F9FAFB", color: "#9CA3AF",
            padding: "1px 6px", borderRadius: 100 }}>
            {TYPE_LABEL[notification.notificationType]}
          </span>
          {/* Delivery icons */}
          <span style={{ fontSize: 9, color: "#C0C8D5", marginLeft: 2 }}>
            {notification.deliveryMethod.includes("IN_APP") && "🔔 "}
            {notification.deliveryMethod.includes("EMAIL") && "✉ "}
            {notification.deliveryMethod.includes("SMS") && "📱"}
          </span>
          {notification.relatedRecordId && (
            <span style={{ fontSize: 9.5, color: "#9CA3AF", fontFamily: "monospace" }}>
              #{notification.relatedRecordId}
            </span>
          )}
        </div>
      </div>

      {/* Right: timestamp + hover actions */}
      <div style={{ padding: "0 14px 0 6px", display: "flex", flexDirection: "column",
        alignItems: "flex-end", justifyContent: "center", gap: 6, flexShrink: 0 }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10.5, color: "#9CA3AF", whiteSpace: "nowrap" }}>
            {relativeTime(notification.timestamp)}
          </div>
          <div style={{ fontSize: 9.5, color: "#C0C8D5", whiteSpace: "nowrap" }}>
            {absTime(notification.timestamp).split(",")[0]}
          </div>
        </div>
        {hovered && (
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={e => { e.stopPropagation(); onOpen(notification); }}
              title="View details"
              style={{ background: "#F1F5F9", border: "none", borderRadius: 5, padding: "3px 6px",
                cursor: "pointer", display: "flex", color: "#374151" }}>
              <Info size={12} />
            </button>
            {isUnread ? (
              <button
                onClick={e => { e.stopPropagation(); onMarkRead(notification.notificationId); }}
                title="Mark as read"
                style={{ background: "#EEF4FF", border: "none", borderRadius: 5, padding: "3px 6px",
                  cursor: "pointer", display: "flex", color: "#1565C0" }}>
                <Eye size={12} />
              </button>
            ) : (
              <button
                onClick={e => { e.stopPropagation(); onMarkUnread(notification.notificationId); }}
                title="Mark as unread"
                style={{ background: "#F9FAFB", border: "none", borderRadius: 5, padding: "3px 6px",
                  cursor: "pointer", display: "flex", color: "#6B7280" }}>
                <EyeOff size={12} />
              </button>
            )}
            <button
              onClick={e => { e.stopPropagation(); onDelete(notification.notificationId); }}
              title="Delete"
              style={{ background: "#FFEBEE", border: "none", borderRadius: 5, padding: "3px 6px",
                cursor: "pointer", display: "flex", color: "#C62828" }}>
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Priority Group Section ───────────────────────────────────────────────────

function PriorityGroup({
  priority,
  items,
  selectedIds,
  onToggleSelect,
  onOpen,
  onMarkRead,
  onMarkUnread,
  onDelete,
}: {
  priority: NotificationPriority;
  items: AppNotification[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpen: (n: AppNotification) => void;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const p = PRIORITY_META[priority];
  const unread = items.filter(n => !n.readStatus).length;

  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          background: p.bg, border: `1px solid ${p.border}`,
          borderRadius: collapsed ? 10 : "10px 10px 0 0",
          padding: "10px 16px", cursor: "pointer",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: "50%",
          background: p.color, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 800, color: p.color }}>
          {p.label} Priority
        </span>
        <span style={{ fontSize: 11, color: p.color, background: `${p.color}18`,
          padding: "1px 8px", borderRadius: 100, fontWeight: 700 }}>
          {items.length} total
        </span>
        {unread > 0 && (
          <span style={{ fontSize: 11, color: "#fff", background: p.color,
            padding: "1px 8px", borderRadius: 100, fontWeight: 700 }}>
            {unread} unread
          </span>
        )}
        <ChevronDown size={14} color={p.color} style={{
          marginLeft: "auto", transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
          transition: "transform 0.2s",
        }} />
      </button>
      {!collapsed && (
        <div style={{ border: `1px solid ${p.border}`, borderTop: "none",
          borderRadius: "0 0 10px 10px", overflow: "hidden" }}>
          {items.map(n => (
            <NotificationRow
              key={n.notificationId}
              notification={n}
              selected={selectedIds.has(n.notificationId)}
              onToggleSelect={onToggleSelect}
              onOpen={onOpen}
              onMarkRead={onMarkRead}
              onMarkUnread={onMarkUnread}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface NotificationsPageProps {
  activeRole: UserRole;
  roleColor: string;
  userName: string;
  onNavigateTab?: (tab: string) => void;
  onSettings?: () => void;
}

export function NotificationsPage({
  activeRole, roleColor, userName, onNavigateTab, onSettings,
}: NotificationsPageProps) {
  // Demo panel
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoFired, setDemoFired] = useState<string | null>(null);

  const handleDemoFire = (type: NotificationType) => {
    notificationSimulatorService.simulateEvent(type);
    setDemoFired(type);
    setTimeout(() => setDemoFired(null), 1500);
  };

  // Data
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<NotificationPriority | "">("");
  const [filterModule, setFilterModule] = useState<RelatedModule | "">("");
  const [filterType, setFilterType] = useState<NotificationType | "">("");
  const [filterRead, setFilterRead] = useState<"" | "unread" | "read">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // View / Pagination
  const [viewMode, setViewMode] = useState<"all" | "by-priority">("all");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Dialog
  const [detailNotif, setDetailNotif] = useState<AppNotification | null>(null);

  // Toast
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast({ msg: "", type: "success" }), 3200);
  };

  // Live subscription
  useEffect(() => {
    const sub = notificationService.subscribeNotifications(activeRole, items => {
      setNotifications(items);
    });
    return () => sub.unsubscribe();
  }, [activeRole]);

  // Clear selection when data changes
  useEffect(() => { setSelectedIds(new Set()); }, [notifications]);

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return notifications.filter(n => {
      if (filterPriority && n.priority !== filterPriority) return false;
      if (filterType && n.notificationType !== filterType) return false;
      if (filterModule && n.relatedModule !== filterModule) return false;
      if (filterRead === "unread" && n.readStatus) return false;
      if (filterRead === "read" && !n.readStatus) return false;
      if (dateFrom && new Date(n.timestamp) < new Date(dateFrom)) return false;
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (new Date(n.timestamp) > to) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (
          !n.title.toLowerCase().includes(q) &&
          !n.description.toLowerCase().includes(q) &&
          !(n.relatedRecordId ?? "").toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [notifications, filterPriority, filterType, filterModule, filterRead, search, dateFrom, dateTo]);

  const hasFilters = !!(search || filterPriority || filterType || filterModule || filterRead || dateFrom || dateTo);
  const clearFilters = () => {
    setSearch(""); setFilterPriority(""); setFilterType("");
    setFilterModule(""); setFilterRead(""); setDateFrom(""); setDateTo("");
  };

  // Reset to page 1 on filter change
  useEffect(() => setPage(1), [filtered.length]);

  // ── Pagination (list view) ─────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageSlice = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const unreadCount = notifications.filter(n => !n.readStatus).length;
  const highUnread = notifications.filter(n => n.priority === "HIGH" && !n.readStatus).length;
  const medUnread = notifications.filter(n => n.priority === "MEDIUM" && !n.readStatus).length;

  // ── Selection helpers ──────────────────────────────────────────────────────

  const visibleIds = pageSlice.map(n => n.notificationId);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        visibleIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        visibleIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleMarkRead = useCallback((id: string) => {
    notificationService.markAsRead(id).subscribe(() => {});
  }, []);

  const handleMarkUnread = useCallback((id: string) => {
    notificationService.markAsUnread(id).subscribe(() => {});
  }, []);

  const handleDelete = useCallback((id: string) => {
    notificationService.deleteNotification(id).subscribe(() => {
      showToast("Notification deleted.");
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    });
  }, []);

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead(activeRole).subscribe(() => {
      showToast("All notifications marked as read.");
    });
  };

  const handleMarkSelectedRead = () => {
    let count = 0;
    selectedIds.forEach(id => {
      notificationService.markAsRead(id).subscribe(() => { count++; });
    });
    showToast(`${selectedIds.size} notification(s) marked as read.`);
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = () => {
    const ids = Array.from(selectedIds);
    ids.forEach(id => notificationService.deleteNotification(id).subscribe(() => {}));
    showToast(`${ids.length} notification(s) deleted.`);
    setSelectedIds(new Set());
  };

  // ── Priority group data ────────────────────────────────────────────────────

  const byPriority: Record<NotificationPriority, AppNotification[]> = {
    HIGH:   filtered.filter(n => n.priority === "HIGH"),
    MEDIUM: filtered.filter(n => n.priority === "MEDIUM"),
    LOW:    filtered.filter(n => n.priority === "LOW"),
  };

  // ── Styles ────────────────────────────────────────────────────────────────

  const ss = {
    select: {
      border: "1px solid #E4E7EC", borderRadius: 7, padding: "6px 10px",
      fontSize: 12, color: "#374151", background: "#fff", cursor: "pointer",
      fontFamily: "Inter, sans-serif", outline: "none",
    } as React.CSSProperties,
    chip: (active: boolean, color: string) => ({
      padding: "5px 12px", borderRadius: 7, fontSize: 11.5, fontWeight: 600,
      border: active ? `2px solid ${color}` : "2px solid #E4E7EC",
      background: active ? `${color}12` : "#fff",
      color: active ? color : "#6B7280",
      cursor: "pointer", fontFamily: "Inter, sans-serif",
      transition: "all 0.15s",
    } as React.CSSProperties),
  };

  return (
    <div style={{ padding: "22px 28px", fontFamily: "Inter, sans-serif",
      minHeight: "100vh", background: "#F9FAFB" }}>

      {/* Toast */}
      {toast.msg && (
        <div style={{
          position: "fixed", top: 72, right: 24, zIndex: 20000,
          background: toast.type === "error" ? "#C62828" : "#1E293B",
          color: "#fff", padding: "10px 18px", borderRadius: 10,
          fontSize: 12.5, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.22)",
          display: "flex", alignItems: "center", gap: 8,
          animation: "notifSlideIn 0.22s ease-out",
        }}>
          <CheckCheck size={14} /> {toast.msg}
        </div>
      )}

      {/* Detail Dialog */}
      {detailNotif && (
        <DetailDialog
          notification={detailNotif}
          onClose={() => setDetailNotif(null)}
          onMarkRead={id => { handleMarkRead(id); setDetailNotif(null); }}
          onMarkUnread={id => { handleMarkUnread(id); setDetailNotif(null); }}
          onDelete={id => { handleDelete(id); setDetailNotif(null); }}
          onNavigate={tab => { onNavigateTab?.(tab); setDetailNotif(null); }}
        />
      )}

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
            {unreadCount > 0
              ? <BellRing size={22} color={roleColor} />
              : <Bell size={22} color={roleColor} />
            }
            <h1 style={{ fontSize: 21, fontWeight: 900, color: "#111827", margin: 0 }}>
              Notification Centre
            </h1>
            {unreadCount > 0 && (
              <span style={{ background: "#B71C1C", color: "#fff", fontSize: 11,
                fontWeight: 800, padding: "3px 10px", borderRadius: 100 }}>
                {unreadCount} unread
              </span>
            )}
          </div>
          <p style={{ fontSize: 12.5, color: "#9CA3AF", margin: 0 }}>
            {userName} · <strong style={{ color: "#374151" }}>{activeRole}</strong>
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {/* Settings */}
          <button
            onClick={() => onSettings?.()}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#fff", border: "1px solid #E4E7EC", borderRadius: 8,
              padding: "7px 12px", fontSize: 12, fontWeight: 600, color: "#374151",
              cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}
            title="Notification Settings"
          >
            <Settings size={13} /> Settings
          </button>
          {/* Demo Panel Toggle */}
          <button
            onClick={() => setDemoOpen(o => !o)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: demoOpen ? "#FFF8E1" : "#fff",
              border: `1px solid ${demoOpen ? "#F59E0B" : "#E4E7EC"}`,
              borderRadius: 8, padding: "7px 12px",
              fontSize: 12, fontWeight: 600,
              color: demoOpen ? "#B45309" : "#374151",
              cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}
            title="Demo Panel — Fire simulated events"
          >
            <Zap size={13} /> Demo Panel
          </button>
          <button onClick={handleMarkAllRead} disabled={unreadCount === 0}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: unreadCount === 0 ? "#F1F5F9" : roleColor,
              border: "none", borderRadius: 8, padding: "8px 14px",
              fontSize: 12, fontWeight: 700,
              color: unreadCount === 0 ? "#9CA3AF" : "#fff",
              cursor: unreadCount === 0 ? "not-allowed" : "pointer",
              fontFamily: "Inter, sans-serif",
            }}>
            <CheckCheck size={13} /> Mark All Read
          </button>
        </div>
      </div>

      {/* ── Demo Panel ─────────────────────────────────────────────────────────── */}
      {demoOpen && (
        <div style={{
          background: "#FFFBEB",
          border: "1px solid #FCD34D",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Zap size={16} color="#D97706" />
            <span style={{ fontSize: 13, fontWeight: 800, color: "#92400E" }}>Demo Panel — Manual Event Simulator</span>
            <span style={{ fontSize: 11, color: "#B45309", background: "#FDE68A", padding: "2px 8px", borderRadius: 100, fontWeight: 600 }}>
              🎮 Evaluator Mode
            </span>
          </div>
          <p style={{ fontSize: 11.5, color: "#78350F", margin: "0 0 12px 0" }}>
            Click any button to instantly fire a realistic live business event. The notification will appear in the store,
            increment the header badge, and trigger a priority-styled toast (with simulated Email/SMS delivery confirmation).
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {SIMULATED_EVENT_TYPES.map(({ type, label, icon }) => (
              <button
                key={type}
                onClick={() => handleDemoFire(type)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: demoFired === type ? "#D97706" : "#fff",
                  border: `1px solid ${demoFired === type ? "#D97706" : "#E5E7EB"}`,
                  borderRadius: 8, padding: "7px 14px",
                  fontSize: 12, fontWeight: 600,
                  color: demoFired === type ? "#fff" : "#374151",
                  cursor: "pointer",
                  transition: "all 0.18s",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total",       value: notifications.length, color: roleColor,   bg: `${roleColor}12`, icon: <Bell size={16} /> },
          { label: "Unread",      value: unreadCount,          color: "#B71C1C",   bg: "#FFEBEE",        icon: <BellRing size={16} /> },
          { label: "High Unread", value: highUnread,           color: "#E65100",   bg: "#FFF3E0",        icon: <AlertTriangle size={16} /> },
          { label: "Med Unread",  value: medUnread,            color: "#F57F17",   bg: "#FFF8E1",        icon: <Clock size={16} /> },
        ].map((k, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #E4E7EC",
            borderRadius: 12, padding: "14px 16px", display: "flex",
            justifyContent: "space-between", alignItems: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div>
              <div style={{ fontSize: 9.5, fontWeight: 700, color: "#9CA3AF",
                textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>
                {k.label}
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#111827", lineHeight: 1 }}>
                {k.value}
              </div>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: k.bg,
              display: "flex", alignItems: "center", justifyContent: "center", color: k.color }}>
              {k.icon}
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Toolbar ─────────────────────────────────────────────────── */}
      <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12,
        padding: "14px 16px", marginBottom: 16 }}>
        {/* Row 1: Search + selects */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
          <Filter size={13} color="#9CA3AF" />
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "#374151" }}>Filters</span>

          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 180px", maxWidth: 260 }}>
            <Search size={12} color="#9CA3AF" style={{ position: "absolute", left: 9,
              top: "50%", transform: "translateY(-50%)" }} />
            <input type="text" placeholder="Search title, description, record ID…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", border: "1px solid #E4E7EC", borderRadius: 7,
                padding: "6px 10px 6px 27px", fontSize: 11.5, color: "#374151",
                fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value as any)} style={ss.select}>
            <option value="">All Priorities</option>
            <option value="HIGH">🔴 High</option>
            <option value="MEDIUM">🟠 Medium</option>
            <option value="LOW">🔵 Low</option>
          </select>

          <select value={filterRead} onChange={e => setFilterRead(e.target.value as any)} style={ss.select}>
            <option value="">All Status</option>
            <option value="unread">Unread Only</option>
            <option value="read">Read Only</option>
          </select>

          <select value={filterModule} onChange={e => setFilterModule(e.target.value as any)} style={ss.select}>
            <option value="">All Modules</option>
            {["Vendor Management","Procurement","Performance","Contracts & Compliance","Communication","Reports","System"]
              .map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <select value={filterType} onChange={e => setFilterType(e.target.value as any)} style={ss.select}>
            <option value="">All Types</option>
            {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>

          {hasFilters && (
            <button onClick={clearFilters} style={{ display: "flex", alignItems: "center", gap: 4,
              fontSize: 11, fontWeight: 600, color: "#C62828", background: "#FFEBEE",
              border: "1px solid #FFCDD2", borderRadius: 7, padding: "5px 10px",
              cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
              <X size={12} /> Clear
            </button>
          )}

          <span style={{ marginLeft: "auto", fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap" }}>
            Showing <strong style={{ color: "#374151" }}>{filtered.length}</strong> of{" "}
            <strong style={{ color: "#374151" }}>{notifications.length}</strong> notifications
          </span>
        </div>

        {/* Row 2: Date range + view toggle */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <Calendar size={13} color="#9CA3AF" />
          <span style={{ fontSize: 11.5, color: "#6B7280", fontWeight: 600 }}>Date range:</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            style={{ ...ss.select, padding: "5px 9px" }} />
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            min={dateFrom} style={{ ...ss.select, padding: "5px 9px" }} />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(""); setDateTo(""); }}
              style={{ background: "none", border: "none", cursor: "pointer",
                color: "#9CA3AF", display: "flex", padding: 2 }}>
              <X size={13} />
            </button>
          )}

          {/* View toggle */}
          <div style={{ marginLeft: "auto", display: "flex", background: "#F1F5F9",
            borderRadius: 8, padding: 3, gap: 2 }}>
            {([
              { id: "all",         label: "All", icon: <List size={13} /> },
              { id: "by-priority", label: "By Priority", icon: <Layers size={13} /> },
            ] as { id: "all" | "by-priority"; label: string; icon: React.ReactNode }[]).map(v => (
              <button key={v.id} onClick={() => setViewMode(v.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 12px", borderRadius: 6, border: "none",
                  background: viewMode === v.id ? "#fff" : "transparent",
                  color: viewMode === v.id ? "#111827" : "#9CA3AF",
                  fontWeight: viewMode === v.id ? 700 : 500,
                  fontSize: 11.5, cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  boxShadow: viewMode === v.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.15s",
                }}>
                {v.icon} {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bulk Actions Bar ───────────────────────────────────────────────── */}
      {someSelected && (
        <div style={{
          background: "#1E293B", borderRadius: 10, padding: "10px 16px",
          marginBottom: 12, display: "flex", alignItems: "center", gap: 10,
          animation: "notifSlideIn 0.18s ease-out",
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
            {selectedIds.size} selected
          </span>
          <button onClick={handleMarkSelectedRead}
            style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5,
              fontWeight: 600, color: "#93C5FD", background: "none", border: "1px solid #3B82F660",
              borderRadius: 6, padding: "4px 12px", cursor: "pointer",
              fontFamily: "Inter, sans-serif" }}>
            <Eye size={12} /> Mark selected read
          </button>
          <button onClick={handleDeleteSelected}
            style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5,
              fontWeight: 600, color: "#FCA5A5", background: "none", border: "1px solid #EF444460",
              borderRadius: 6, padding: "4px 12px", cursor: "pointer",
              fontFamily: "Inter, sans-serif" }}>
            <Trash2 size={12} /> Delete selected
          </button>
          <button onClick={() => setSelectedIds(new Set())}
            style={{ marginLeft: "auto", background: "none", border: "none",
              cursor: "pointer", color: "#9CA3AF", display: "flex" }}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── Empty State ────────────────────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 14,
          padding: "60px 20px", textAlign: "center" }}>
          <Bell size={48} color="#E4E7EC" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
            No notifications found
          </div>
          <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: hasFilters ? 16 : 0 }}>
            {hasFilters ? "Try adjusting your filters." : "You have no notifications yet."}
          </div>
          {hasFilters && (
            <button onClick={clearFilters} style={{ fontSize: 12, fontWeight: 600,
              color: roleColor, background: "none", border: `1px solid ${roleColor}40`,
              borderRadius: 7, padding: "6px 16px", cursor: "pointer",
              fontFamily: "Inter, sans-serif" }}>
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* ── ALL view: Table + Pagination ─────────────────────────────────── */}
      {filtered.length > 0 && viewMode === "all" && (
        <div>
          {/* Table header */}
          <div style={{ background: "#fff", border: "1px solid #E4E7EC",
            borderRadius: "10px 10px 0 0", borderBottom: "none", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "36px 36px 1fr auto",
              background: "#F9FAFB", borderBottom: "1px solid #E4E7EC",
              padding: "0", alignItems: "center" }}>
              {/* Select-all */}
              <div onClick={toggleSelectAll}
                style={{ display: "flex", alignItems: "center", justifyContent: "center",
                  height: 40, cursor: "pointer" }}>
                {allVisibleSelected
                  ? <CheckSquare size={15} color="#1565C0" />
                  : visibleIds.some(id => selectedIds.has(id))
                    ? <Minus size={15} color="#1565C0" />
                    : <Square size={15} color="#D1D5DB" />
                }
              </div>
              <div />
              <div style={{ display: "flex", alignItems: "center", gap: 6,
                padding: "0 8px", fontSize: 10.5, fontWeight: 700, color: "#9CA3AF",
                textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <ArrowUpDown size={11} /> Notification (newest first)
              </div>
              <div style={{ padding: "0 14px", fontSize: 10.5, fontWeight: 700,
                color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Sent
              </div>
            </div>

            {pageSlice.map(n => (
              <NotificationRow
                key={n.notificationId}
                notification={n}
                selected={selectedIds.has(n.notificationId)}
                onToggleSelect={toggleSelect}
                onOpen={setDetailNotif}
                onMarkRead={handleMarkRead}
                onMarkUnread={handleMarkUnread}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Pagination */}
          <div style={{ background: "#fff", border: "1px solid #E4E7EC",
            borderTop: "none", borderRadius: "0 0 10px 10px",
            padding: "12px 16px", display: "flex", alignItems: "center",
            justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            {/* Left: rows per page */}
            <div style={{ display: "flex", alignItems: "center", gap: 8,
              fontSize: 12, color: "#6B7280" }}>
              <span>Rows per page:</span>
              <select value={pageSize} onChange={e => { setPageSize(+e.target.value); setPage(1); }}
                style={{ ...ss.select, padding: "4px 8px", fontSize: 11.5 }}>
                {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <span style={{ color: "#9CA3AF" }}>
                {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length}
              </span>
            </div>

            {/* Right: page buttons */}
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <button onClick={() => setPage(1)} disabled={safePage === 1}
                style={{ background: "none", border: "1px solid #E4E7EC", borderRadius: 6,
                  padding: "4px 8px", cursor: safePage === 1 ? "not-allowed" : "pointer",
                  color: safePage === 1 ? "#C0C8D5" : "#374151", fontSize: 11 }}>
                «
              </button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                style={{ background: "none", border: "1px solid #E4E7EC", borderRadius: 6,
                  padding: "4px 8px", cursor: safePage === 1 ? "not-allowed" : "pointer",
                  color: safePage === 1 ? "#C0C8D5" : "#374151", display: "flex" }}>
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pg = i + 1;
                if (totalPages > 5) {
                  const start = Math.max(1, Math.min(safePage - 2, totalPages - 4));
                  pg = start + i;
                }
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    style={{
                      background: pg === safePage ? roleColor : "none",
                      color: pg === safePage ? "#fff" : "#374151",
                      border: `1px solid ${pg === safePage ? roleColor : "#E4E7EC"}`,
                      borderRadius: 6, padding: "4px 10px", cursor: "pointer",
                      fontSize: 12, fontWeight: pg === safePage ? 700 : 400,
                      fontFamily: "Inter, sans-serif",
                      minWidth: 32,
                    }}>
                    {pg}
                  </button>
                );
              })}

              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                style={{ background: "none", border: "1px solid #E4E7EC", borderRadius: 6,
                  padding: "4px 8px", cursor: safePage === totalPages ? "not-allowed" : "pointer",
                  color: safePage === totalPages ? "#C0C8D5" : "#374151", display: "flex" }}>
                <ChevronRight size={14} />
              </button>
              <button onClick={() => setPage(totalPages)} disabled={safePage === totalPages}
                style={{ background: "none", border: "1px solid #E4E7EC", borderRadius: 6,
                  padding: "4px 8px", cursor: safePage === totalPages ? "not-allowed" : "pointer",
                  color: safePage === totalPages ? "#C0C8D5" : "#374151", fontSize: 11 }}>
                »
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BY PRIORITY view ──────────────────────────────────────────────── */}
      {filtered.length > 0 && viewMode === "by-priority" && (
        <div>
          {(["HIGH", "MEDIUM", "LOW"] as NotificationPriority[]).map(pri => (
            byPriority[pri].length > 0 && (
              <PriorityGroup
                key={pri}
                priority={pri}
                items={byPriority[pri]}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onOpen={setDetailNotif}
                onMarkRead={handleMarkRead}
                onMarkUnread={handleMarkUnread}
                onDelete={handleDelete}
              />
            )
          ))}
          {/* Total in by-priority mode */}
          <div style={{ textAlign: "right", fontSize: 11, color: "#9CA3AF", marginTop: 8 }}>
            Showing all {filtered.length} filtered notifications (no pagination in grouped view)
          </div>
        </div>
      )}

      <style>{`
        @keyframes notifSlideIn {
          from { opacity:0; transform:translateY(-8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes dialogPop {
          from { opacity:0; transform:scale(0.95) translateY(10px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
