/**
 * NotificationSettingsPage — Module 9: Notification Settings
 * ===========================================================
 * Material-styled form page for configuring:
 *  • Per-category delivery channel toggles (In-App / Email / SMS)
 *  • Priority threshold filter (All / Medium+ / High only)
 *  • Mute-all master toggle
 *  • Contract-expiry reminder day checkboxes (90 / 30 / 7 / 1 day)
 * Persists to localStorage via notificationService.saveSettings()
 */

import { useState, useEffect } from 'react';
import {
  Settings, Bell, BellOff, Mail, Smartphone, ChevronLeft,
  Save, RotateCcw, Check, Info, Truck, ShoppingCart, FileText,
  MessageSquare, BarChart2, Building2, ShieldCheck, Receipt,
  Package, Gavel
} from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import type { NotificationSettings, NotificationType, UserRole } from '../../models/notification';
import { defaultNotificationSettings } from '../../models/notification';

// ─── Category Row Metadata ───────────────────────────────────────────────────

interface CategoryMeta {
  label: string;
  types: NotificationType[];
  icon: React.ReactNode;
  description: string;
  colorBg: string;
  colorFg: string;
}

const CATEGORY_ROWS: CategoryMeta[] = [
  {
    label: 'Procurement Alerts',
    types: ['PROCUREMENT_ALERT', 'PROCUREMENT_REQUEST'],
    icon: <ShoppingCart size={15} />,
    description: 'Budget threshold breaches, SLA violations, pending approvals',
    colorBg: '#EEF4FF',
    colorFg: '#1565C0',
  },
  {
    label: 'Delivery Delays',
    types: ['DELIVERY_DELAY'],
    icon: <Truck size={15} />,
    description: 'Late shipments, customs holds, quality rejections',
    colorBg: '#FFF8E1',
    colorFg: '#E65100',
  },
  {
    label: 'Vendor Approvals',
    types: ['VENDOR_APPROVAL', 'VENDOR_REJECTION'],
    icon: <Building2 size={15} />,
    description: 'New vendor registration approvals and rejection notices',
    colorBg: '#E8F5E9',
    colorFg: '#2E7D32',
  },
  {
    label: 'Contract Expiry',
    types: ['CONTRACT_EXPIRY'],
    icon: <Gavel size={15} />,
    description: 'Upcoming contract renewals and expiry warnings',
    colorBg: '#FFF8E1',
    colorFg: '#F57F17',
  },
  {
    label: 'Compliance Alerts',
    types: ['COMPLIANCE_ALERT'],
    icon: <ShieldCheck size={15} />,
    description: 'ISO/HACCP/safety certification expiry, failed audits',
    colorBg: '#FFEBEE',
    colorFg: '#B71C1C',
  },
  {
    label: 'Invoices & Payments',
    types: ['INVOICE_APPROVED', 'PO_CREATED'],
    icon: <Receipt size={15} />,
    description: 'Invoice approvals, payment disbursements, PO creation',
    colorBg: '#F3E5F5',
    colorFg: '#6A1B9A',
  },
  {
    label: 'Messages',
    types: ['MESSAGE_RECEIVED'],
    icon: <MessageSquare size={15} />,
    description: 'Direct messages from vendors and team members',
    colorBg: '#E0F7FA',
    colorFg: '#006064',
  },
  {
    label: 'Reports & System',
    types: ['REPORT_GENERATED', 'PROFILE_UPDATED', 'PASSWORD_CHANGED'],
    icon: <BarChart2 size={15} />,
    description: 'Auto-generated reports, profile changes, system alerts',
    colorBg: '#F1F8E9',
    colorFg: '#33691E',
  },
];

// ─── Toggle Component ────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 42,
        height: 24,
        borderRadius: 12,
        background: checked && !disabled ? '#1565C0' : disabled ? '#E5E7EB' : '#D1D5DB',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
        border: `1px solid ${checked && !disabled ? '#1565C0' : '#D1D5DB'}`,
      }}
    >
      <div style={{
        position: 'absolute',
        top: 2,
        left: checked ? 18 : 2,
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: disabled ? '#9CA3AF' : '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left 0.2s',
      }} />
    </div>
  );
}

// ─── Checkbox Component ──────────────────────────────────────────────────────

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          border: `2px solid ${checked ? '#1565C0' : '#D1D5DB'}`,
          background: checked ? '#1565C0' : '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        {checked && <Check size={11} color="#fff" strokeWidth={3} />}
      </div>
      <span style={{ fontSize: 13, color: '#374151', fontWeight: checked ? 600 : 400 }}>{label}</span>
    </label>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

interface NotificationSettingsPageProps {
  activeRole: UserRole;
  roleColor: string;
  userName: string;
  onBack: () => void;
}

export function NotificationSettingsPage({
  activeRole,
  roleColor,
  userName,
  onBack,
}: NotificationSettingsPageProps) {
  const [settings, setSettings] = useState<NotificationSettings>(() => notificationService.getSettings());
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Subscribe to live changes from the service
  useEffect(() => {
    const sub = notificationService.subscribeSettings(s => {
      setSettings({ ...s });
    });
    return () => sub.unsubscribe();
  }, []);

  const mutate = (fn: (draft: NotificationSettings) => void): void => {
    setSettings(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as NotificationSettings;
      fn(next);
      setDirty(true);
      return next;
    });
  };

  // Get aggregated channel setting for a category (all types must share same value)
  const getCategoryChannel = (types: NotificationType[], channel: 'inApp' | 'email' | 'sms'): boolean => {
    // Return true if ALL types in the category have the channel enabled
    return types.every(type => settings.categoryChannels[type]?.[channel] ?? true);
  };

  const setCategoryChannel = (types: NotificationType[], channel: 'inApp' | 'email' | 'sms', value: boolean) => {
    mutate(draft => {
      types.forEach(type => {
        if (!draft.categoryChannels[type]) {
          draft.categoryChannels[type] = { inApp: true, email: true, sms: false };
        }
        draft.categoryChannels[type]![channel] = value;
      });
    });
  };

  const handleSave = () => {
    notificationService.saveSettings(settings);
    setSaved(true);
    setDirty(false);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    const defaults = defaultNotificationSettings();
    setSettings(defaults);
    setDirty(true);
  };

  const isMuted = settings.muteAll;

  return (
    <div style={{ padding: '24px 28px', fontFamily: 'Inter, sans-serif', minHeight: '100vh', background: '#F9FAFB' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <button
            onClick={onBack}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, color: '#6B7280', fontWeight: 600,
              fontFamily: 'Inter, sans-serif', padding: '0 0 8px 0',
            }}
          >
            <ChevronLeft size={16} /> Back to Notification Center
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Settings size={22} color={roleColor} />
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>
              Notification Settings
            </h1>
          </div>
          <p style={{ fontSize: 13, color: '#667085', margin: 0 }}>
            Configure per-category delivery preferences for <strong>{userName}</strong> ({activeRole})
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {saved && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 700, color: '#16A34A',
              background: '#DCFCE7', padding: '6px 12px', borderRadius: 8,
              border: '1px solid #86EFAC',
            }}>
              <Check size={14} /> Settings saved!
            </span>
          )}
          <button
            onClick={handleReset}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#fff', border: '1px solid #D1D5DB', borderRadius: 8,
              padding: '8px 14px', fontSize: 12, fontWeight: 600, color: '#374151',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={13} /> Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: dirty ? roleColor : '#9CA3AF',
              border: 'none', borderRadius: 8,
              padding: '8px 18px', fontSize: 12, fontWeight: 700, color: '#fff',
              cursor: dirty ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s',
            }}
          >
            <Save size={13} /> Save Settings
          </button>
        </div>
      </div>

      {/* ── Section 1: Master Controls ────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20,
      }}>
        {/* Mute All Toggle */}
        <div style={{
          background: isMuted ? '#FFEBEE' : '#fff',
          border: `1px solid ${isMuted ? '#FFCDD2' : '#E4E7EC'}`,
          borderRadius: 12, padding: '18px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          transition: 'all 0.2s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: isMuted ? '#FFCDD2' : '#EEF4FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isMuted ? <BellOff size={20} color="#B71C1C" /> : <Bell size={20} color="#1565C0" />}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 2 }}>
                {isMuted ? '🔕 All Notifications Muted' : '🔔 Notifications Active'}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>
                {isMuted ? 'No notifications will be shown or sent.' : 'Notifications are enabled. Manage below.'}
              </div>
            </div>
          </div>
          <Toggle
            checked={isMuted}
            onChange={v => mutate(d => { d.muteAll = v; })}
          />
        </div>

        {/* Priority Threshold */}
        <div style={{
          background: '#fff',
          border: '1px solid #E4E7EC',
          borderRadius: 12, padding: '18px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Package size={16} color={roleColor} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Priority Threshold</span>
          </div>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 12px 0' }}>
            Filter which priority levels generate notifications for your profile.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {([
              { value: 'ALL',          label: '🟢 All Notifications (Low, Medium, High)' },
              { value: 'MEDIUM_PLUS',  label: '🟠 Medium and High Priority only' },
              { value: 'HIGH_ONLY',    label: '🔴 High Priority alerts only' },
            ] as { value: 'ALL' | 'MEDIUM_PLUS' | 'HIGH_ONLY'; label: string }[]).map(opt => (
              <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <div
                  onClick={() => mutate(d => { d.priorityThreshold = opt.value; })}
                  style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: `2px solid ${settings.priorityThreshold === opt.value ? roleColor : '#D1D5DB'}`,
                    background: settings.priorityThreshold === opt.value ? roleColor : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {settings.priorityThreshold === opt.value && (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
                  )}
                </div>
                <span style={{ fontSize: 12.5, color: '#374151', fontWeight: settings.priorityThreshold === opt.value ? 700 : 400 }}>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 2: Per-Category Channel Grid ─────────────────────────── */}
      <div style={{
        background: '#fff',
        border: '1px solid #E4E7EC',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 20,
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2.2fr 1fr 1fr 1fr',
          background: '#F9FAFB',
          borderBottom: '1px solid #E4E7EC',
          padding: '12px 20px',
          gap: 12,
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Notification Category
            </div>
          </div>
          {[
            { icon: <Bell size={14} />, label: 'In-App', sublabel: 'Bell + dropdown' },
            { icon: <Mail size={14} />, label: 'Email', sublabel: 'Simulated' },
            { icon: <Smartphone size={14} />, label: 'SMS', sublabel: 'Simulated' },
          ].map((col) => (
            <div key={col.label} style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#374151', marginBottom: 2 }}>
                {col.icon}
                <span style={{ fontSize: 11, fontWeight: 700 }}>{col.label}</span>
              </div>
              <div style={{ fontSize: 9.5, color: '#9CA3AF' }}>{col.sublabel}</div>
            </div>
          ))}
        </div>

        {/* Category rows */}
        {CATEGORY_ROWS.map((cat, idx) => {
          const inApp = getCategoryChannel(cat.types, 'inApp');
          const email = getCategoryChannel(cat.types, 'email');
          const sms   = getCategoryChannel(cat.types, 'sms');

          return (
            <div
              key={cat.label}
              style={{
                display: 'grid',
                gridTemplateColumns: '2.2fr 1fr 1fr 1fr',
                padding: '14px 20px',
                gap: 12,
                alignItems: 'center',
                borderBottom: idx < CATEGORY_ROWS.length - 1 ? '1px solid #F3F4F6' : 'none',
                background: isMuted ? '#FAFAFA' : '#fff',
                opacity: isMuted ? 0.5 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {/* Category label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: cat.colorBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: cat.colorFg, flexShrink: 0,
                }}>
                  {cat.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 1 }}>{cat.label}</div>
                  <div style={{ fontSize: 10.5, color: '#6B7280' }}>{cat.description}</div>
                </div>
              </div>

              {/* In-App toggle */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Toggle
                  checked={inApp}
                  onChange={v => setCategoryChannel(cat.types, 'inApp', v)}
                  disabled={isMuted}
                />
              </div>

              {/* Email toggle */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Toggle
                  checked={email}
                  onChange={v => setCategoryChannel(cat.types, 'email', v)}
                  disabled={isMuted}
                />
              </div>

              {/* SMS toggle */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Toggle
                  checked={sms}
                  onChange={v => setCategoryChannel(cat.types, 'sms', v)}
                  disabled={isMuted}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Section 3: Contract Expiry Reminders ─────────────────────────── */}
      <div style={{
        background: '#fff',
        border: '1px solid #E4E7EC',
        borderRadius: 12,
        padding: '20px',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Gavel size={18} color={roleColor} />
          <h2 style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: 0 }}>
            Contract Expiry Reminders
          </h2>
        </div>
        <p style={{ fontSize: 12.5, color: '#6B7280', margin: '0 0 16px 0' }}>
          Configure which reminder intervals trigger contract expiry notifications. The background scheduler
          checks contracts on app startup and sends the appropriate alerts.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {([
            { key: 'days90', label: '90 days before', desc: 'Early renewal warning', color: '#22C55E' },
            { key: 'days30', label: '30 days before', desc: 'Standard reminder',    color: '#F59E0B' },
            { key: 'days7',  label: '7 days before',  desc: 'Urgent renewal',       color: '#EF4444' },
            { key: 'days1',  label: '1 day before',   desc: 'Critical — last chance', color: '#B91C1C' },
          ] as { key: keyof NotificationSettings['expiryReminders']; label: string; desc: string; color: string }[]).map(rm => (
            <div
              key={rm.key}
              style={{
                border: `1px solid ${settings.expiryReminders[rm.key] ? rm.color + '40' : '#E5E7EB'}`,
                borderRadius: 10,
                padding: '14px 16px',
                background: settings.expiryReminders[rm.key] ? rm.color + '08' : '#FAFAFA',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onClick={() => mutate(d => { d.expiryReminders[rm.key] = !d.expiryReminders[rm.key]; })}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: settings.expiryReminders[rm.key] ? rm.color : '#D1D5DB',
                  marginTop: 2,
                }} />
                <div
                  style={{
                    width: 18, height: 18, borderRadius: 4,
                    border: `2px solid ${settings.expiryReminders[rm.key] ? rm.color : '#D1D5DB'}`,
                    background: settings.expiryReminders[rm.key] ? rm.color : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {settings.expiryReminders[rm.key] && <Check size={11} color="#fff" strokeWidth={3} />}
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{rm.label}</div>
              <div style={{ fontSize: 11, color: '#6B7280' }}>{rm.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Banner */}
      <div style={{
        background: '#EEF4FF',
        border: '1px solid #BBDEFB',
        borderRadius: 10,
        padding: '12px 16px',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
      }}>
        <Info size={16} color="#1565C0" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: '#1565C0', margin: 0, lineHeight: 1.5 }}>
          <strong>Frontend Simulation Note:</strong> Email and SMS delivery in this demo are visually simulated
          — no actual messages are sent. In production, these channels would trigger real SMTP/Twilio API calls
          from the backend notification scheduler. Settings are persisted in <code>localStorage</code> and
          respected by the live simulator and cross-module notification triggers.
        </p>
      </div>
    </div>
  );
}
