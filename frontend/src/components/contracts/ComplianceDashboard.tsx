/**
 * Module 6 · Compliance Dashboard
 * Circular progress gauge, status doughnut, alert banner, and verification modal.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { ShieldCheck, CheckCircle, AlertTriangle, Clock, X, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Edit3 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { contractService } from '../../services/contractService';
import type { ComplianceRecord, ComplianceStatus } from '../../models/contract';

interface Props { roleColor: string; currentRole: string; userName: string; }
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, padding: 20 };
const tblHeaderStyle: React.CSSProperties = { padding: '10px 14px', fontSize: 10, fontWeight: 700, color: '#667085', borderBottom: '1px solid #E4E7EC', textTransform: 'uppercase', whiteSpace: 'nowrap' };

const STATUS_CONFIG: Record<ComplianceStatus, { bg: string; fg: string; icon: typeof CheckCircle }> = {
  'Compliant':             { bg: '#E8F5E9', fg: '#2E7D32', icon: CheckCircle },
  'Pending Verification':  { bg: '#FEF3C7', fg: '#D97706', icon: Clock },
  'Non-Compliant':         { bg: '#FFEBEE', fg: '#B71C1C', icon: AlertTriangle },
  'Expired':               { bg: '#FFF3E0', fg: '#E65100', icon: AlertTriangle },
};

export function ComplianceDashboard({ roleColor, currentRole, userName }: Props) {
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ComplianceStatus | 'All'>('All');
  const [vendorFilter, setVendorFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<'complianceStatus' | 'lastVerifiedDate' | 'vendorName'>('complianceStatus');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modal State
  const [verifyTarget, setVerifyTarget] = useState<ComplianceRecord | null>(null);
  const [newStatus, setNewStatus] = useState<ComplianceStatus>('Compliant');
  const [verifyRemarks, setVerifyRemarks] = useState('');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const isReadOnly = currentRole === 'Auditor' || currentRole === 'Vendor';

  const loadData = useCallback(() => {
    setLoading(true);
    contractService.getComplianceRecords().subscribe(data => {
      setRecords(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const showNotification = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSort = (field: 'complianceStatus' | 'lastVerifiedDate' | 'vendorName') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Instant Inline Status Change
  const handleInstantStatusChange = (complianceId: number, targetStatus: ComplianceStatus, vendorName: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const verifier = userName || 'Procurement Verifier';
    const remark = `Status updated to ${targetStatus}`;

    // 1. Instant reactive local state update
    setRecords(prev => prev.map(r => r.complianceId === complianceId ? {
      ...r,
      complianceStatus: targetStatus,
      lastVerifiedDate: today,
      verifiedBy: verifier,
      remarks: r.remarks || remark
    } : r));

    const isCritical = targetStatus === 'Non-Compliant' || targetStatus === 'Expired';
    showNotification(
      `Instant Update: Status changed to '${targetStatus}' for ${vendorName}. Score recalculated instantly!`,
      !isCritical
    );

    // 2. Sync in background to service
    contractService.updateComplianceStatus(complianceId, targetStatus, verifier, remark).subscribe(() => {});
  };

  // Submit Verification Modal
  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyTarget || !verifyRemarks) return;

    const targetId = verifyTarget.complianceId;
    const targetVendor = verifyTarget.vendorName;
    const today = new Date().toISOString().slice(0, 10);
    const verifier = userName || 'Procurement Verifier';

    // 1. Instant local state update
    setRecords(prev => prev.map(r => r.complianceId === targetId ? {
      ...r,
      complianceStatus: newStatus,
      lastVerifiedDate: today,
      verifiedBy: verifier,
      remarks: verifyRemarks
    } : r));

    setVerifyTarget(null);

    const isCritical = newStatus === 'Non-Compliant' || newStatus === 'Expired';
    showNotification(
      `Compliance status updated to '${newStatus}' for ${targetVendor}. Score recalculated instantly!`,
      !isCritical
    );

    // 2. Sync to service
    contractService.updateComplianceStatus(targetId, newStatus, verifier, verifyRemarks).subscribe(() => {});
  };

  // KPI calculations
  const totalRecords = records.length;
  const compliantCount = records.filter(r => r.complianceStatus === 'Compliant').length;
  const pendingCount = records.filter(r => r.complianceStatus === 'Pending Verification').length;
  const nonCompliantCount = records.filter(r => r.complianceStatus === 'Non-Compliant').length;
  const expiredCount = records.filter(r => r.complianceStatus === 'Expired').length;

  const compliancePercentage = totalRecords > 0 ? Math.round((compliantCount / totalRecords) * 100) : 100;

  // Pie chart data
  const pieData = [
    { name: 'Compliant', value: compliantCount, color: '#2E7D32' },
    { name: 'Pending', value: pendingCount, color: '#D97706' },
    { name: 'Non-Compliant', value: nonCompliantCount, color: '#B71C1C' },
    { name: 'Expired', value: expiredCount, color: '#E65100' },
  ].filter(d => d.value > 0);

  // Attention required non-compliant vendors list
  const attentionRequired = records.filter(r => r.complianceStatus === 'Non-Compliant' || r.complianceStatus === 'Expired');

  // Unique vendors for dropdown
  const uniqueVendors = Array.from(new Set(records.map(r => r.vendorName)));

  // Filtered & Sorted table items
  let processed = records.filter(r => {
    if (statusFilter !== 'All' && r.complianceStatus !== statusFilter) return false;
    if (vendorFilter !== 'All' && r.vendorName !== vendorFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.requirementName.toLowerCase().includes(q) ||
        r.vendorName.toLowerCase().includes(q) ||
        r.remarks.toLowerCase().includes(q)
      );
    }
    return true;
  });

  processed.sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    return sortOrder === 'asc' ? (valA as string).localeCompare(valB as string) : (valB as string).localeCompare(valA as string);
  });

  const totalPages = Math.ceil(processed.length / pageSize) || 1;
  const paginated = processed.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div style={{ padding: '24px 28px', fontFamily: 'Inter, sans-serif' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 1200, background: toast.ok ? '#E8F5E9' : '#FFEBEE', border: `1px solid ${toast.ok ? '#2E7D32' : '#B71C1C'}`, borderRadius: 8, padding: '12px 20px', color: toast.ok ? '#2E7D32' : '#B71C1C', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle size={16} /> {toast.msg}
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><X size={14} /></button>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Vendor Compliance Management</h1>
        <p style={{ fontSize: 13, color: '#667085', marginTop: 4 }}>
          Regulatory, quality, environmental, and cybersecurity compliance verification tracking
        </p>
      </div>

      {/* OVERALL COMPLIANCE SCORE & DOUGHNUT CHART */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: 16, marginBottom: 20 }}>
        {/* Large Circular Gauge */}
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #111827 0%, #1F2937 100%)', color: '#fff' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
            Overall Compliance Score
          </div>
          <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="140" height="140" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#374151" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke={compliancePercentage >= 80 ? '#10B981' : compliancePercentage >= 60 ? '#F59E0B' : '#EF4444'}
                strokeWidth="10"
                strokeDasharray={`${(compliancePercentage / 100) * 314} 314`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#fff' }}>{compliancePercentage}%</div>
              <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>Compliant</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#D1D5DB', marginTop: 12 }}>
            <b>{compliantCount}</b> of <b>{totalRecords}</b> standards verified
          </div>
        </div>

        {/* Status Doughnut Breakdown & KPIs */}
        <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 160, height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Compliant', count: compliantCount, color: '#2E7D32', bg: '#E8F5E9' },
              { label: 'Pending', count: pendingCount, color: '#D97706', bg: '#FEF3C7' },
              { label: 'Non-Compliant', count: nonCompliantCount, color: '#B71C1C', bg: '#FFEBEE' },
              { label: 'Expired', count: expiredCount, color: '#E65100', bg: '#FFF3E0' },
            ].map((k, i) => (
              <div key={i} style={{ padding: '10px 14px', borderRadius: 8, background: k.bg, borderLeft: `3px solid ${k.color}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: k.color, textTransform: 'uppercase' }}>{k.label}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#111827', marginTop: 2 }}>{k.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ATTENTION REQUIRED ALERT BANNER */}
      {attentionRequired.length > 0 && (
        <div style={{ background: '#FFF5F5', border: '1px solid #FFCDD2', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <AlertTriangle size={20} color="#B71C1C" style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#B71C1C' }}>
              Attention Required — {attentionRequired.length} Non-Compliant / Expired Record{attentionRequired.length !== 1 ? 's' : ''} Detected
            </div>
            <div style={{ fontSize: 12, color: '#374151', marginTop: 4 }}>
              The following vendors require immediate re-verification or audit correction:
              <span style={{ fontWeight: 700, marginLeft: 6 }}>
                {attentionRequired.map(a => `${a.vendorName} (${a.requirementName})`).join('; ')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* FILTERS BAR */}
      <div style={{ ...cardStyle, marginBottom: 20, padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: 10 }} />
            <input
              type="text"
              placeholder="Search requirement name, vendor, or remarks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: 8, border: '1px solid #E4E7EC', outline: 'none', fontSize: 12 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} color="#667085" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#667085' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E4E7EC', fontSize: 12, outline: 'none', background: '#fff' }}
            >
              <option value="All">All Compliance Statuses ({totalRecords})</option>
              <option value="Compliant">Compliant ({compliantCount})</option>
              <option value="Pending Verification">Pending Verification ({pendingCount})</option>
              <option value="Non-Compliant">Non-Compliant ({nonCompliantCount})</option>
              <option value="Expired">Expired ({expiredCount})</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#667085' }}>Vendor:</span>
            <select
              value={vendorFilter}
              onChange={e => setVendorFilter(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E4E7EC', fontSize: 12, outline: 'none', background: '#fff' }}
            >
              <option value="All">All Vendors</option>
              {uniqueVendors.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* COMPLIANCE TABLE */}
      <div style={{ ...cardStyle, marginBottom: 24, overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E4E7EC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: roleColor, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Compliance Requirements Verification Registry ({processed.length})
          </h3>
          <span style={{ fontSize: 12, color: '#667085' }}>Showing {paginated.length} of {processed.length} entries</span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading compliance records...</div>
        ) : paginated.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>No compliance requirements match current filter.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                <th style={tblHeaderStyle}>Requirement Standard</th>
                <th onClick={() => handleSort('vendorName')} style={{ ...tblHeaderStyle, cursor: 'pointer' }}>
                  Vendor Name <ArrowUpDown size={11} style={{ display: 'inline', marginLeft: 4 }} />
                </th>
                <th onClick={() => handleSort('complianceStatus')} style={{ ...tblHeaderStyle, cursor: 'pointer' }}>
                  Compliance Status <ArrowUpDown size={11} style={{ display: 'inline', marginLeft: 4 }} />
                </th>
                <th onClick={() => handleSort('lastVerifiedDate')} style={{ ...tblHeaderStyle, cursor: 'pointer' }}>
                  Last Verified <ArrowUpDown size={11} style={{ display: 'inline', marginLeft: 4 }} />
                </th>
                <th style={tblHeaderStyle}>Verified By</th>
                <th style={tblHeaderStyle}>Auditor Remarks</th>
                <th style={{ ...tblHeaderStyle, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(r => {
                const cfg = STATUS_CONFIG[r.complianceStatus];
                const IconComponent = cfg.icon;

                return (
                  <tr key={r.complianceId} style={{ borderBottom: '1px solid #F1F5F9', background: r.complianceStatus === 'Non-Compliant' ? '#FFF5F5' : 'transparent' }}>
                    <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: '#111827' }}>
                      {r.requirementName}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#374151', fontWeight: 600 }}>
                      {r.vendorName}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {!isReadOnly ? (
                        <select
                          value={r.complianceStatus}
                          onChange={e => handleInstantStatusChange(r.complianceId, e.target.value as ComplianceStatus, r.vendorName)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 100,
                            border: `1px solid ${cfg.fg}`,
                            background: cfg.bg,
                            color: cfg.fg,
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          <option value="Compliant">✓ Compliant</option>
                          <option value="Pending Verification">⏳ Pending Verification</option>
                          <option value="Non-Compliant">⚠️ Non-Compliant</option>
                          <option value="Expired">❌ Expired</option>
                        </select>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 100, background: cfg.bg, color: cfg.fg, textTransform: 'uppercase' }}>
                          <IconComponent size={11} /> {r.complianceStatus}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#374151' }}>{r.lastVerifiedDate}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#667085' }}>{r.verifiedBy}</td>
                    <td style={{ padding: '12px 14px', fontSize: 11, color: '#6B7280', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.remarks || '—'}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      {!isReadOnly ? (
                        <button
                          onClick={() => {
                            setVerifyTarget(r);
                            setNewStatus(r.complianceStatus);
                            setVerifyRemarks(r.remarks);
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: `${roleColor}10`, border: `1px solid ${roleColor}30`, color: roleColor, borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                        >
                          <Edit3 size={11} /> Verify Status
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: '#9CA3AF' }}>Read-only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* PAGINATION */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #E4E7EC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9FAFB' }}>
          <span style={{ fontSize: 12, color: '#667085' }}>Page {page} of {totalPages}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #E4E7EC', background: page <= 1 ? '#F3F4F6' : '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: 12 }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #E4E7EC', background: page >= totalPages ? '#F3F4F6' : '#fff', cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontSize: 12 }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* VERIFY COMPLIANCE MODAL */}
      {verifyTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #E4E7EC', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={20} color={roleColor} />
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#111827' }}>Verify Compliance Status</h3>
              </div>
              <button onClick={() => setVerifyTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#667085' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#F9FAFB', padding: 12, borderRadius: 8, border: '1px solid #E4E7EC', fontSize: 12 }}>
                <div><b>Requirement:</b> {verifyTarget.requirementName}</div>
                <div><b>Vendor:</b> {verifyTarget.vendorName}</div>
                <div><b>Current Verified Date:</b> {verifyTarget.lastVerifiedDate}</div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Select New Compliance Status *</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as ComplianceStatus)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none' }}
                >
                  <option value="Compliant">✓ Compliant</option>
                  <option value="Pending Verification">⏳ Pending Verification</option>
                  <option value="Non-Compliant">⚠️ Non-Compliant (Generates Bell Alert)</option>
                  <option value="Expired">❌ Expired (Generates Bell Alert)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Mandatory Verification Remarks *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="State audit findings, license numbers verified, or reasons for non-compliance..."
                  value={verifyRemarks}
                  onChange={e => setVerifyRemarks(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ fontSize: 11, color: '#667085', background: '#EFF6FF', padding: 10, borderRadius: 6 }}>
                Verified by: <b>{userName || 'Procurement Manager'}</b> on <b>{new Date().toISOString().slice(0, 10)}</b>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setVerifyTarget(null)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: roleColor, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
