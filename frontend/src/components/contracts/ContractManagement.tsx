/**
 * Module 6: Contract & Compliance Management
 * Orchestrator component — routes to sub-views based on activeTab and internal viewMode.
 * Pattern matches VendorPerformance.tsx and VendorReliability.tsx.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { FileText, RefreshCw, Award, FolderOpen, ShieldCheck, Bell, X, CheckCircle, AlertTriangle, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import { contractService } from '../../services/contractService';
import { ContractRepository } from './ContractRepository';
import { ContractForm } from './ContractForm';
import { ContractDetails } from './ContractDetails';
import { RenewalDashboard } from './RenewalDashboard';
import { CertificationManagement } from './CertificationManagement';
import { VendorDocumentation } from './VendorDocumentation';
import { ComplianceDashboard } from './ComplianceDashboard';
import { ContractNotificationsView } from './ContractNotificationsView';
import type { ContractNotification, Contract } from '../../models/contract';

interface Props {
  activeTab: string;
  roleColor: string;
  currentRole: string;
  userName: string;
  onNavigateTab?: (tab: string) => void;
}

const SEVERITY_CONFIG = {
  Critical: { bg: '#FFEBEE', color: '#B71C1C', icon: AlertCircle },
  Warning:  { bg: '#FFF3E0', color: '#E65100', icon: AlertTriangle },
  Info:     { bg: '#EFF6FF', color: '#1565C0', icon: Bell },
};

export function ContractManagement({ activeTab, roleColor, currentRole, userName, onNavigateTab }: Props) {
  const [notifications, setNotifications] = useState<ContractNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);

  // Sub-view navigation state for Contract Repository workflow
  const [viewMode, setViewMode] = useState<'list' | 'new' | 'edit' | 'details'>('list');
  const [selectedContractId, setSelectedContractId] = useState<number | undefined>(undefined);

  // Reset internal viewMode to 'list' if sidebar activeTab changes
  useEffect(() => {
    setViewMode('list');
    setSelectedContractId(undefined);
  }, [activeTab]);

  const refreshNotifications = useCallback(() => {
    contractService.getNotifications().subscribe((notifs) => {
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.read).length);
    });
  }, []);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Close bell on outside click
  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#cc-bell-panel') && !target.closest('#cc-bell-btn')) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bellOpen]);

  const handleMarkRead = (id: number) => {
    contractService.markNotificationRead(id).subscribe(() => refreshNotifications());
  };

  const handleMarkAllRead = () => {
    contractService.markAllRead().subscribe(() => {
      setBellOpen(false);
      refreshNotifications();
    });
  };

  const commonProps = { roleColor, currentRole, userName };

  const renderContent = () => {
    switch (activeTab) {
      case 'cc-repository': {
        if (viewMode === 'new') {
          return (
            <ContractForm
              {...commonProps}
              onCancel={() => setViewMode('list')}
              onSaveSuccess={(c: Contract) => {
                setSelectedContractId(c.contractId);
                setViewMode('details');
                refreshNotifications();
              }}
            />
          );
        }
        if (viewMode === 'edit' && selectedContractId) {
          return (
            <ContractForm
              {...commonProps}
              contractId={selectedContractId}
              onCancel={() => setViewMode('details')}
              onSaveSuccess={(c: Contract) => {
                setSelectedContractId(c.contractId);
                setViewMode('details');
                refreshNotifications();
              }}
            />
          );
        }
        if (viewMode === 'details' && selectedContractId) {
          return (
            <ContractDetails
              {...commonProps}
              contractId={selectedContractId}
              onBack={() => setViewMode('list')}
              onEdit={() => setViewMode('edit')}
            />
          );
        }

        return (
          <ContractRepository
            {...commonProps}
            onSelectContract={(id) => {
              setSelectedContractId(id);
              setViewMode('details');
            }}
            onNewContract={() => {
              setSelectedContractId(undefined);
              setViewMode('new');
            }}
            onEditContract={(id) => {
              setSelectedContractId(id);
              setViewMode('edit');
            }}
          />
        );
      }
      case 'cc-renewals':       return <RenewalDashboard {...commonProps} />;
      case 'cc-certifications': return <CertificationManagement {...commonProps} />;
      case 'cc-documents':      return <VendorDocumentation {...commonProps} />;
      case 'cc-compliance':     return <ComplianceDashboard {...commonProps} />;
      case 'cc-notifications':  return <ContractNotificationsView {...commonProps} onRefresh={refreshNotifications} />;
      default: {
        return (
          <ContractRepository
            {...commonProps}
            onSelectContract={(id) => {
              setSelectedContractId(id);
              setViewMode('details');
            }}
            onNewContract={() => {
              setSelectedContractId(undefined);
              setViewMode('new');
            }}
            onEditContract={(id) => {
              setSelectedContractId(id);
              setViewMode('edit');
            }}
          />
        );
      }
    }
  };

  const previewNotifs = notifications.slice(0, 5);

  return (
    <div style={{ position: 'relative', fontFamily: 'Inter, sans-serif' }}>
      {/* Module top-bar with internal bell for quick access */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '8px 28px 0',
          gap: 8,
        }}
      >
        <div style={{ position: 'relative' }}>
          <button
            id="cc-bell-btn"
            onClick={() => setBellOpen((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              border: `1px solid ${unreadCount > 0 ? '#E65100' : '#E4E7EC'}`,
              background: unreadCount > 0 ? '#FFF3E0' : '#fff',
              color: unreadCount > 0 ? '#E65100' : '#374151',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
            title="Contract & Compliance Notifications"
          >
            <Bell size={14} />
            Alerts
            {unreadCount > 0 && (
              <span
                style={{
                  background: '#B71C1C',
                  color: '#fff',
                  borderRadius: 100,
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '1px 6px',
                  lineHeight: '15px',
                  minWidth: 18,
                  textAlign: 'center',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Bell Dropdown Panel */}
          {bellOpen && (
            <div
              id="cc-bell-panel"
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                zIndex: 200,
                background: '#fff',
                border: '1px solid #E4E7EC',
                borderRadius: 12,
                width: 380,
                boxShadow: '0 16px 40px rgba(0,0,0,0.14)',
                overflow: 'hidden',
              }}
            >
              {/* Panel Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderBottom: '1px solid #E4E7EC',
                  background: '#FAFAFA',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>Contract Alerts</div>
                  <div style={{ fontSize: 11, color: '#667085' }}>
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: roleColor,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px 8px',
                      }}
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setBellOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Notification items */}
              <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                {previewNotifs.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                    <CheckCircle size={24} style={{ marginBottom: 8, color: '#2E7D32' }} />
                    <div>All clear — no active alerts</div>
                  </div>
                ) : (
                  previewNotifs.map((n) => {
                    const cfg = SEVERITY_CONFIG[n.severity];
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={n.notificationId}
                        style={{
                          display: 'flex',
                          gap: 10,
                          padding: '12px 16px',
                          borderBottom: '1px solid #F1F5F9',
                          background: n.read ? 'transparent' : `${cfg.bg}60`,
                          cursor: 'pointer',
                        }}
                        onClick={() => handleMarkRead(n.notificationId)}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            flexShrink: 0,
                            background: cfg.bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon size={16} color={cfg.color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: 100,
                                background: cfg.bg,
                                color: cfg.color,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {n.severity.toUpperCase()}
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                color: '#9CA3AF',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {n.type}
                            </span>
                            {!n.read && (
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#B71C1C', flexShrink: 0 }} />
                            )}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 1 }}>
                            {n.vendorName}
                          </div>
                          <div style={{ fontSize: 11, color: '#667085' }}>
                            {n.referenceNumber} ·{' '}
                            {n.remainingDays < 0
                              ? `Expired ${Math.abs(n.remainingDays)} days ago`
                              : `${n.remainingDays} days remaining`}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: '10px 16px', borderTop: '1px solid #E4E7EC', background: '#FAFAFA' }}>
                <button
                  onClick={() => {
                    setBellOpen(false);
                    onNavigateTab?.('cc-notifications');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    width: '100%',
                    padding: '8px',
                    borderRadius: 8,
                    border: `1px solid ${roleColor}30`,
                    background: `${roleColor}08`,
                    color: roleColor,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <ExternalLink size={13} />
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sub-content Render */}
      {renderContent()}
    </div>
  );
}
