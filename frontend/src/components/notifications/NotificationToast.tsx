/**
 * NotificationToast — Global live-toast broker
 * Subscribes to notificationService's toast stream and renders
 * priority-styled snackbar toasts in the top-right corner.
 * Email/SMS delivery channels are visually simulated via toast sub-lines.
 */

import { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, AlertTriangle, Info, X, CheckCircle } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import type { ToastEvent, NotificationPriority } from '../../models/notification';

// ─── Priority Styling ────────────────────────────────────────────────────────

const PRIORITY_STYLE: Record<NotificationPriority, {
  bg: string; border: string; titleColor: string; icon: React.ReactNode; duration: number;
}> = {
  HIGH: {
    bg: 'linear-gradient(135deg, #B71C1C 0%, #C62828 100%)',
    border: '#EF5350',
    titleColor: '#fff',
    icon: <AlertTriangle size={16} color="#FFD54F" />,
    duration: 6000,
  },
  MEDIUM: {
    bg: 'linear-gradient(135deg, #E65100 0%, #F57C00 100%)',
    border: '#FF8F00',
    titleColor: '#fff',
    icon: <Bell size={16} color="#FFF9C4" />,
    duration: 4500,
  },
  LOW: {
    bg: 'linear-gradient(135deg, #1E293B 0%, #374151 100%)',
    border: '#4B5563',
    titleColor: '#F9FAFB',
    icon: <Info size={16} color="#93C5FD" />,
    duration: 3500,
  },
};

// ─── Single Toast Item ───────────────────────────────────────────────────────

interface ToastItemProps {
  toast: ToastEvent & { uid: string };
  onDismiss: (uid: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const style = PRIORITY_STYLE[toast.priority];

  return (
    <div
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: 12,
        padding: '12px 16px',
        minWidth: 320,
        maxWidth: 380,
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        animation: 'toastSlideIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated progress bar */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0, height: 3,
        background: 'rgba(255,255,255,0.3)',
        borderRadius: '0 0 12px 12px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: 'rgba(255,255,255,0.7)',
          animation: `toastProgress ${style.duration}ms linear forwards`,
        }} />
      </div>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ marginTop: 1, flexShrink: 0 }}>
          {style.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: style.titleColor,
            lineHeight: 1.3,
            marginBottom: 2,
          }}>
            {toast.title}
          </div>
          <div style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.85)',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {toast.description}
          </div>
        </div>
        <button
          onClick={() => onDismiss(toast.uid)}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            flexShrink: 0,
            marginTop: -2,
          }}
        >
          <X size={12} />
        </button>
      </div>

      {/* Delivery channel simulation row */}
      {(toast.emailSent || toast.smsSent) && (
        <div style={{
          display: 'flex',
          gap: 8,
          paddingTop: 6,
          borderTop: '1px solid rgba(255,255,255,0.2)',
        }}>
          {toast.emailSent && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 10, color: 'rgba(255,255,255,0.8)',
              background: 'rgba(255,255,255,0.1)',
              padding: '2px 7px', borderRadius: 100,
            }}>
              <Mail size={9} />
              <CheckCircle size={9} />
              Email sent to user@vendoriq.in
            </span>
          )}
          {toast.smsSent && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 10, color: 'rgba(255,255,255,0.8)',
              background: 'rgba(255,255,255,0.1)',
              padding: '2px 7px', borderRadius: 100,
            }}>
              <Smartphone size={9} />
              <CheckCircle size={9} />
              SMS via Twilio ✓
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Toast Broker ────────────────────────────────────────────────────────────

interface ActiveToast extends ToastEvent {
  uid: string;
}

export function NotificationToast() {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);

  useEffect(() => {
    const sub = notificationService.subscribeToast((evt) => {
      const uid = `${evt.id}-${Date.now()}`;
      const activeToast: ActiveToast = { ...evt, uid };

      setToasts(prev => {
        // Max 4 stacked toasts
        const next = [activeToast, ...prev].slice(0, 4);
        return next;
      });

      // Auto-dismiss
      const duration = PRIORITY_STYLE[evt.priority]?.duration ?? 4000;
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.uid !== uid));
      }, duration);
    });

    return () => sub.unsubscribe();
  }, []);

  const handleDismiss = (uid: string) => {
    setToasts(prev => prev.filter(t => t.uid !== uid));
  };

  if (toasts.length === 0) return null;

  return (
    <>
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        fontFamily: 'Inter, sans-serif',
      }}>
        {toasts.map(toast => (
          <ToastItem key={toast.uid} toast={toast} onDismiss={handleDismiss} />
        ))}
      </div>

      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(60px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </>
  );
}
