import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, BellRing, CheckCheck, ChevronRight, X } from "lucide-react";
import { notificationService } from "../../services/notificationService";
import type { AppNotification } from "../../models/notification";
import type { UserRole } from "../../models/notification";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

const PRIORITY_DOT: Record<string, { color: string; bg: string; label: string }> = {
  HIGH:   { color: "#B71C1C", bg: "#FFEBEE", label: "High" },
  MEDIUM: { color: "#E65100", bg: "#FFF3E0", label: "Medium" },
  LOW:    { color: "#1565C0", bg: "#EEF4FF", label: "Low" },
};

const MODULE_CHIP_COLORS: Record<string, { bg: string; fg: string }> = {
  "Vendor Management":     { bg: "#E8F5E9", fg: "#2E7D32" },
  "Procurement":           { bg: "#EEF4FF", fg: "#1565C0" },
  "Performance":           { bg: "#F3E5F5", fg: "#6A1B9A" },
  "Contracts & Compliance":{ bg: "#FFF8E1", fg: "#F57F17" },
  "Communication":         { bg: "#E0F7FA", fg: "#006064" },
  "Reports":               { bg: "#F1F8E9", fg: "#33691E" },
  "System":                { bg: "#FAFAFA", fg: "#424242" },
};

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
  MESSAGE_RECEIVED:    "Message",
  REPORT_GENERATED:    "Report Ready",
  PROFILE_UPDATED:     "Profile Updated",
  PASSWORD_CHANGED:    "Password Changed",
};

// ─── NotificationItem ─────────────────────────────────────────────────────────

function NotificationItem({
  notification,
  onMarkRead,
  onClose,
}: {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
  onClose: () => void;
}) {
  const pDot = PRIORITY_DOT[notification.priority];
  const modChip = MODULE_CHIP_COLORS[notification.relatedModule] ?? { bg: "#F1F5F9", fg: "#374151" };
  const isUnread = !notification.readStatus;

  return (
    <div
      onClick={() => { onMarkRead(notification.notificationId); onClose(); }}
      style={{
        display: "flex",
        gap: 11,
        padding: "12px 16px",
        cursor: "pointer",
        background: isUnread ? "#FAFBFF" : "#fff",
        borderLeft: isUnread ? `3px solid ${pDot.color}` : "3px solid transparent",
        borderBottom: "1px solid #F1F5F9",
        transition: "background 0.15s",
        position: "relative",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.background = "#F5F7FF";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.background = isUnread ? "#FAFBFF" : "#fff";
      }}
    >
      {/* Priority dot */}
      <div style={{
        width: 9,
        height: 9,
        borderRadius: "50%",
        background: pDot.color,
        marginTop: 5,
        flexShrink: 0,
        boxShadow: isUnread ? `0 0 0 3px ${pDot.bg}` : "none",
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title + timestamp row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 3 }}>
          <span style={{
            fontSize: 12.5,
            fontWeight: isUnread ? 700 : 500,
            color: "#111827",
            lineHeight: "1.35",
            flex: 1,
          }}>
            {notification.title}
          </span>
          <span style={{ fontSize: 10, color: "#9CA3AF", whiteSpace: "nowrap", flexShrink: 0, marginTop: 1 }}>
            {relativeTime(notification.timestamp)}
          </span>
        </div>

        {/* Description */}
        <p style={{
          fontSize: 11.5,
          color: "#667085",
          margin: "0 0 6px 0",
          lineHeight: "1.45",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {notification.description}
        </p>

        {/* Module chip + type badge */}
        <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{
            fontSize: 9.5,
            fontWeight: 700,
            background: modChip.bg,
            color: modChip.fg,
            padding: "2px 7px",
            borderRadius: 100,
            letterSpacing: "0.3px",
          }}>
            {notification.relatedModule}
          </span>
          <span style={{
            fontSize: 9.5,
            color: "#9CA3AF",
            background: "#F9FAFB",
            padding: "2px 6px",
            borderRadius: 100,
          }}>
            {TYPE_LABEL[notification.notificationType] ?? notification.notificationType}
          </span>
          {isUnread && (
            <span style={{
              fontSize: 9,
              fontWeight: 800,
              color: pDot.color,
              background: pDot.bg,
              padding: "1px 6px",
              borderRadius: 100,
              marginLeft: "auto",
            }}>
              NEW
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── NotificationBell ─────────────────────────────────────────────────────────

interface NotificationBellProps {
  activeRole: UserRole;
  roleColor: string;
  onViewAll: () => void;
}

export function NotificationBell({ activeRole, roleColor, onViewAll }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  // Subscribe to live data
  useEffect(() => {
    const sub = notificationService.subscribeNotifications(activeRole, (items) => {
      setNotifications(items);
      setUnreadCount(items.filter(n => !n.readStatus).length);
    });
    return () => sub.unsubscribe();
  }, [activeRole]);

  // Close on outside click
  const handleOutsideClick = useCallback((e: MouseEvent) => {
    if (
      panelRef.current && !panelRef.current.contains(e.target as Node) &&
      bellRef.current && !bellRef.current.contains(e.target as Node)
    ) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open, handleOutsideClick]);

  const handleMarkRead = (id: string) => {
    notificationService.markAsRead(id).subscribe(() => {});
  };

  const handleMarkAll = () => {
    setMarkingAll(true);
    notificationService.markAllAsRead(activeRole).subscribe(() => {
      setMarkingAll(false);
    });
  };

  const recent6 = notifications.slice(0, 6);
  const badgeCount = unreadCount > 99 ? "99+" : unreadCount;

  return (
    <div style={{ position: "relative" }}>
      {/* Bell Button */}
      <button
        ref={bellRef}
        id="notification-bell-btn"
        onClick={() => setOpen(o => !o)}
        title={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
        style={{
          background: open ? `${roleColor}12` : "none",
          border: `1px solid ${open ? roleColor + "40" : "#E4E7EC"}`,
          borderRadius: "50%",
          width: 34,
          height: 34,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          position: "relative",
          transition: "all 0.18s",
          outline: "none",
        }}
      >
        {unreadCount > 0
          ? <BellRing size={15} color={open ? roleColor : "#E65100"} style={{ animation: "ring 1.8s ease-in-out infinite" }} />
          : <Bell size={15} color={open ? roleColor : "#667085"} />
        }
        {/* Badge */}
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: -5,
            right: -5,
            minWidth: 17,
            height: 17,
            background: "#B71C1C",
            borderRadius: 10,
            border: "2px solid #fff",
            fontSize: 9,
            fontWeight: 800,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
            padding: "0 3px",
            fontFamily: "Inter, sans-serif",
          }}>
            {badgeCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          ref={panelRef}
          id="notification-dropdown-panel"
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: 380,
            background: "#fff",
            border: "1px solid #E4E7EC",
            borderRadius: 14,
            boxShadow: "0 12px 40px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.06)",
            zIndex: 9999,
            overflow: "hidden",
            animation: "notifSlideIn 0.2s ease-out",
          }}
        >
          {/* Header */}
          <div style={{
            padding: "14px 16px 12px",
            borderBottom: "1px solid #F1F5F9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "linear-gradient(135deg, #FAFBFF 0%, #fff 100%)",
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>Notifications</span>
                {unreadCount > 0 && (
                  <span style={{
                    background: "#B71C1C",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "2px 7px",
                    borderRadius: 100,
                    lineHeight: 1.4,
                  }}>
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                Role: {activeRole}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, color: "#9CA3AF", display: "flex" }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Notification list */}
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {recent6.length === 0 ? (
              <div style={{ padding: "36px 20px", textAlign: "center", color: "#9CA3AF" }}>
                <Bell size={32} color="#D1D5DB" style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 13, fontWeight: 600 }}>No notifications</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>You're all caught up!</div>
              </div>
            ) : (
              recent6.map(n => (
                <NotificationItem
                  key={n.notificationId}
                  notification={n}
                  onMarkRead={handleMarkRead}
                  onClose={() => setOpen(false)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: "10px 16px",
            borderTop: "1px solid #F1F5F9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#FAFAFA",
            gap: 8,
          }}>
            <button
              onClick={handleMarkAll}
              disabled={unreadCount === 0 || markingAll}
              id="mark-all-read-btn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: "none",
                border: "1px solid #E4E7EC",
                borderRadius: 7,
                padding: "5px 10px",
                fontSize: 11,
                fontWeight: 600,
                color: unreadCount === 0 ? "#C0C8D5" : "#374151",
                cursor: unreadCount === 0 ? "not-allowed" : "pointer",
                transition: "all 0.15s",
                fontFamily: "Inter, sans-serif",
              }}
            >
              <CheckCheck size={13} />
              {markingAll ? "Clearing..." : "Mark all read"}
            </button>

            <button
              onClick={() => { setOpen(false); onViewAll(); }}
              id="view-all-notifications-btn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: roleColor,
                border: "none",
                borderRadius: 7,
                padding: "5px 12px",
                fontSize: 11,
                fontWeight: 700,
                color: "#fff",
                cursor: "pointer",
                transition: "opacity 0.15s",
                fontFamily: "Inter, sans-serif",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = "1"}
            >
              View all &nbsp;<ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* CSS animations */}
      <style>{`
        @keyframes ring {
          0%, 100% { transform: rotate(0deg); }
          10% { transform: rotate(12deg); }
          20% { transform: rotate(-10deg); }
          30% { transform: rotate(10deg); }
          40% { transform: rotate(-8deg); }
          50% { transform: rotate(0deg); }
        }
        @keyframes notifSlideIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
