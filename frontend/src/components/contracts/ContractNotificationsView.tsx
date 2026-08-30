/**
 * Module 6 · Contract Notifications View
 * Dedicated target for notification bell "View All" with filtering and role gating.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCircle, AlertTriangle, AlertCircle, Filter, X, Eye } from 'lucide-react';
import { contractService } from '../../services/contractService';
import type { ContractNotification, NotificationSeverity, ContractNotificationType } from '../../models/contract';

interface Props {
  roleColor: string;
  currentRole: string;
  userName: string;
  onRefresh?: () => void;
  onNavigateTab?: (tab: string, contractId?: number) => void;
}

const SEVERITY_CONFIG: Record<NotificationSeverity, { bg: string; color: string; icon: typeof AlertCircle }> = {
  Critical: { bg: '#FFEBEE', color: '#B71C1C', icon: AlertCircle },
  Warning:  { bg: '#FFF3E0', color: '#E65100', icon: AlertTriangle },
  Info:     { bg: '#EFF6FF', color: '#1565C0', icon: Bell },
};

const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, padding: 20 };

export function ContractNotificationsView({ roleColor, currentRole, userName, onRefresh, onNavigateTab }: Props) {
  const [notifications, setNotifications] = useState<ContractNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<NotificationSeverity | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<ContractNotificationType | 'All'>('All');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const isAuditor = currentRole === 'Auditor';

  const loadData = useCallback(() => {
    setLoading(true);
    contractService.getNotifications().subscribe(data => {
      // Auditor Security Rule: Filter out internal operational reminders
      let items = data;
      if (isAuditor) {
        items = items.filter(n => n.type === 'Compliance Alert' || n.severity === 'Critical');
      }
      setNotifications(items);
      setLoading(false);
    });
  }, [isAuditor]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = notifications.filter(n => {
    if (severityFilter !== 'All' && n.severity !== severityFilter) return false;
    if (typeFilter !== 'All' && n.type !== typeFilter) return false;
    if (showUnreadOnly && n.read) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = (id: number) => {
    contractService.markNotificationRead(id).subscribe(() => { loadData(); onRefresh?.(); });
  };

  const handleMarkAllRead = () => {
    contractService.markAllRead().subscribe(() => { loadData(); onRefresh?.(); });
  };

  return (
    <div style={{ padding: '24px 28px', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Contract & Compliance Notifications</h1>
          <p style={{ fontSize: 13, color: '#667085', marginTop: 4 }}>
            System-generated alerts for contract expiry, certification renewal, and compliance violations
            {isAuditor && <span style={{ color: '#D97706', marginLeft: 6, fontWeight: 700 }}> (Auditor View: Operational alerts hidden)</span>}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            style={{ padding: '8px 16px', background: `${roleColor}10`, border: `1px solid ${roleColor}30`, color: roleColor, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            Mark All Read ({unreadCount})
          </button>
        )}
      </div>

      {/* KPI ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Critical Alerts', count: notifications.filter(n => n.severity === 'Critical').length, color: '#B71C1C', icon: AlertCircle },
          { label: 'Warnings', count: notifications.filter(n => n.severity === 'Warning').length, color: '#E65100', icon: AlertTriangle },
          { label: 'Unread Bell Alerts', count: unreadCount, color: roleColor, icon: Bell },
        ].map((k, i) => (
          <div key={i} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 14, borderLeft: `4px solid ${k.color}` }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${k.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <k.icon size={18} color={k.color}/>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 2 }}>{k.label}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#111827' }}>{k.count}</div>
            </div>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div style={{ ...cardStyle, marginBottom: 20, padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} color="#667085"/>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#667085' }}>Severity:</span>
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value as any)}
              style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E4E7EC', fontSize: 12, outline: 'none', background: '#fff' }}
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical Only</option>
              <option value="Warning">Warning Only</option>
              <option value="Info">Info Only</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#667085' }}>Alert Type:</span>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E4E7EC', fontSize: 12, outline: 'none', background: '#fff' }}
            >
              <option value="All">All Alert Types</option>
              <option value="Contract Expiry">Contract Expiry</option>
              <option value="Certification Expiry">Certification Expiry</option>
              <option value="Compliance Alert">Compliance Alert</option>
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151', cursor: 'pointer', fontWeight: 600 }}>
            <input type="checkbox" checked={showUnreadOnly} onChange={e => setShowUnreadOnly(e.target.checked)} style={{ cursor: 'pointer' }}/>
            Unread Alerts Only
          </label>

          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9CA3AF' }}>
            Showing {filtered.length} of {notifications.length} alerts
          </span>
        </div>
      </div>

      {/* NOTIFICATIONS LIST */}
      <div style={{ ...cardStyle, overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading notifications...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
            <CheckCircle size={32} color="#2E7D32" style={{ display: 'block', margin: '0 auto 10px' }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>All clear! No notifications match the active filter.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((n, idx) => {
              const cfg = SEVERITY_CONFIG[n.severity];
              const IconComponent = cfg.icon;

              return (
                <div
                  key={n.notificationId}
                  style={{
                    display: 'flex',
                    gap: 16,
                    padding: '16px 20px',
                    borderBottom: idx < filtered.length - 1 ? '1px solid #F1F5F9' : 'none',
                    background: n.read ? '#fff' : `${cfg.bg}40`,
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <IconComponent size={18} color={cfg.color}/>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 100, background: cfg.bg, color: cfg.color, textTransform: 'uppercase' }}>
                        {n.severity}
                      </span>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: '#F1F5F9', color: '#4B5563', fontWeight: 700 }}>
                        {n.type}
                      </span>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: roleColor }}>
                        {n.referenceNumber}
                      </span>
                      {!n.read && (
                        <span style={{ fontSize: 10, fontWeight: 800, background: '#B71C1C', color: '#fff', padding: '1px 6px', borderRadius: 4 }}>NEW</span>
                      )}
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{n.vendorName}</div>

                    <div style={{ fontSize: 12, color: '#4B5563' }}>
                      Expiry Date: <b>{n.expiryDate}</b> ·{' '}
                      {n.remainingDays < 0
                        ? <span style={{ color: '#B71C1C', fontWeight: 800 }}>Expired {Math.abs(n.remainingDays)} days ago</span>
                        : <span style={{ color: n.remainingDays <= 7 ? '#B71C1C' : '#D97706', fontWeight: 800 }}>{n.remainingDays} days remaining</span>
                      }
                    </div>

                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                      Status: {n.renewalStatus} · Auto-generated on {n.createdAt.slice(0, 16).replace('T', ' ')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, marginTop: 4 }}>
                    {!n.read && (
                      <button
                        onClick={() => handleMarkRead(n.notificationId)}
                        style={{ padding: '5px 10px', background: '#fff', border: '1px solid #D1D5DB', color: '#374151', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
