/**
 * Module 6 · Contract Renewal Dashboard
 * Full lifecycle view for contracts expiring within 90 days or already expired.
 */

import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle, RefreshCw, AlertTriangle, Search, Filter, Eye, ArrowUpDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { contractService } from '../../services/contractService';
import type { Contract, ContractRenewal } from '../../models/contract';

interface Props {
  roleColor: string;
  currentRole: string;
  userName: string;
  onNavigateTab?: (tab: string, contractId?: number) => void;
}

const toINR = (v: number) => `₹${v.toLocaleString('en-IN')}`;
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, padding: 20 };

export function RenewalDashboard({ roleColor, currentRole, userName, onNavigateTab }: Props) {
  const [allContracts, setAllContracts] = useState<Contract[]>([]);
  const [renewals, setRenewals] = useState<ContractRenewal[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [windowFilter, setWindowFilter] = useState<'All' | '90' | '30' | '7' | 'Expired'>('All');
  const [vendorFilter, setVendorFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<'daysToExpiry' | 'contractValue' | 'endDate'>('daysToExpiry');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Renewal Modal
  const [renewTarget, setRenewTarget] = useState<Contract | null>(null);
  const [renewEndDate, setRenewEndDate] = useState('');
  const [renewRemarks, setRenewRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const isReadOnly = currentRole === 'Auditor' || currentRole === 'Vendor';

  const loadData = () => {
    setLoading(true);
    Promise.all([
      contractService.getContracts({ pageSize: 200 }).toPromise(),
      contractService.getRenewals().toPromise(),
    ]).then(([res, ren]) => {
      // Filter to contracts expiring within 90 days or already expired
      const filtered = (res?.items || []).filter(c => 
        (c.status === 'Active' || c.status === 'Renewed' || c.status === 'Expired') &&
        (c.daysToExpiry <= 90 || c.status === 'Expired')
      );
      setAllContracts(filtered);
      setRenewals(ren || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSort = (field: 'daysToExpiry' | 'contractValue' | 'endDate') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Open Renew Modal
  const openRenewModal = (c: Contract) => {
    setRenewTarget(c);
    const currEnd = new Date(c.endDate);
    currEnd.setFullYear(currEnd.getFullYear() + 1);
    setRenewEndDate(currEnd.toISOString().slice(0, 10));
    setRenewRemarks('');
  };

  const handleConfirmRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewTarget || !renewEndDate) return;
    setSubmitting(true);

    contractService.renewContract({
      contractId: renewTarget.contractId,
      contractNumber: renewTarget.contractNumber,
      vendorName: renewTarget.vendorName,
      oldEndDate: renewTarget.endDate,
      newEndDate: renewEndDate,
      renewedBy: userName || 'Procurement Manager',
      renewalDate: new Date().toISOString().slice(0, 10),
      remarks: renewRemarks,
    }).subscribe(() => {
      setSubmitting(false);
      setRenewTarget(null);
      setToastMessage(`Contract ${renewTarget.contractNumber} successfully renewed to ${renewEndDate}!`);
      setTimeout(() => setToastMessage(''), 4000);
      loadData();
      if (onNavigateTab) {
        contractService.getUnreadCount().subscribe(() => {});
      }
    });
  };

  // KPI Calculations
  const count90 = allContracts.filter(c => c.daysToExpiry > 30 && c.daysToExpiry <= 90).length;
  const count30 = allContracts.filter(c => c.daysToExpiry > 7 && c.daysToExpiry <= 30).length;
  const count7  = allContracts.filter(c => c.daysToExpiry >= 0 && c.daysToExpiry <= 7).length;
  const countExpired = allContracts.filter(c => c.daysToExpiry < 0 || c.status === 'Expired').length;

  // Vendors list for filter dropdown
  const uniqueVendors = Array.from(new Set(allContracts.map(c => c.vendorName)));

  // Filtered & Sorted items
  let processed = allContracts.filter(c => {
    if (windowFilter === '90' && !(c.daysToExpiry > 30 && c.daysToExpiry <= 90)) return false;
    if (windowFilter === '30' && !(c.daysToExpiry > 7 && c.daysToExpiry <= 30)) return false;
    if (windowFilter === '7' && !(c.daysToExpiry >= 0 && c.daysToExpiry <= 7)) return false;
    if (windowFilter === 'Expired' && !(c.daysToExpiry < 0 || c.status === 'Expired')) return false;

    if (vendorFilter !== 'All' && c.vendorName !== vendorFilter) return false;

    if (search) {
      const q = search.toLowerCase();
      return (
        c.contractNumber.toLowerCase().includes(q) ||
        c.contractTitle.toLowerCase().includes(q) ||
        c.vendorName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  processed.sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (typeof valA === 'string') {
      return sortOrder === 'asc' ? (valA as string).localeCompare(valB as string) : (valB as string).localeCompare(valA as string);
    }
    return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
  });

  const totalPages = Math.ceil(processed.length / pageSize) || 1;
  const paginated = processed.slice((page - 1) * pageSize, page * pageSize);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading renewal dashboard…</div>;
  }

  return (
    <div style={{ padding: '24px 28px', fontFamily: 'Inter, sans-serif' }}>
      {toastMessage && (
        <div style={{ background: '#E8F5E9', border: '1px solid #2E7D32', color: '#2E7D32', padding: '12px 18px', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>✓ {toastMessage}</span>
          <button onClick={() => setToastMessage('')} style={{ background: 'none', border: 'none', color: '#2E7D32', cursor: 'pointer', fontWeight: 800 }}>✕</button>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Contract Renewal Dashboard</h1>
        <p style={{ fontSize: 13, color: '#667085', marginTop: 4 }}>
          Live monitoring of agreements requiring extension, renegotiation, or expiry intervention
        </p>
      </div>

      {/* 4 SUMMARY CARDS WITH COLOR ESCALATION (Blue -> Amber -> Orange -> Red) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Expiring in 90 Days', count: count90, color: '#1565C0', bg: '#EFF6FF', key: '90' },
          { label: 'Expiring in 30 Days', count: count30, color: '#D97706', bg: '#FEF3C7', key: '30' },
          { label: 'Expiring in 7 Days',  count: count7,  color: '#E65100', bg: '#FFF3E0', key: '7'  },
          { label: 'Already Expired',     count: countExpired, color: '#B71C1C', bg: '#FFEBEE', key: 'Expired' },
        ].map((k, i) => {
          const isSelected = windowFilter === k.key;
          return (
            <div
              key={i}
              onClick={() => setWindowFilter(windowFilter === k.key ? 'All' : k.key as any)}
              style={{
                ...cardStyle,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                borderLeft: `4px solid ${k.color}`,
                cursor: 'pointer',
                background: isSelected ? `${k.color}08` : '#fff',
                boxShadow: isSelected ? `0 0 0 2px ${k.color}40` : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ width: 42, height: 42, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Clock size={20} color={k.color} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#667085', textTransform: 'uppercase', marginBottom: 2 }}>{k.label}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: k.color }}>{k.count}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FILTER & SEARCH BAR */}
      <div style={{ ...cardStyle, marginBottom: 20, padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: 10 }} />
            <input
              type="text"
              placeholder="Search contract number, title, or vendor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: 8, border: '1px solid #E4E7EC', outline: 'none', fontSize: 12 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} color="#667085" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#667085' }}>Expiry Window:</span>
            <select
              value={windowFilter}
              onChange={e => setWindowFilter(e.target.value as any)}
              style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E4E7EC', fontSize: 12, outline: 'none', background: '#fff' }}
            >
              <option value="All">All Expiry Windows ({allContracts.length})</option>
              <option value="90">90 Days Window ({count90})</option>
              <option value="30">30 Days Window ({count30})</option>
              <option value="7">7 Days Window ({count7})</option>
              <option value="Expired">Already Expired ({countExpired})</option>
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

      {/* MATERIAL TABLE OF EXPIRING / EXPIRED CONTRACTS */}
      <div style={{ ...cardStyle, marginBottom: 24, overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E4E7EC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: roleColor, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Expiring & Expired Contracts Registry ({processed.length})
          </h3>
          <span style={{ fontSize: 12, color: '#667085' }}>Showing {paginated.length} of {processed.length} entries</span>
        </div>

        {paginated.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: 13 }}>
            <CheckCircle size={28} color="#2E7D32" style={{ display: 'block', margin: '0 auto 10px' }} />
            No expiring contracts found matching the active filters.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                <th style={tblHeaderStyle}>Contract #</th>
                <th style={tblHeaderStyle}>Agreement Scope & Title</th>
                <th style={tblHeaderStyle}>Vendor / Supplier</th>
                <th onClick={() => handleSort('endDate')} style={{ ...tblHeaderStyle, cursor: 'pointer' }}>
                  End Date <ArrowUpDown size={11} style={{ display: 'inline', marginLeft: 4 }} />
                </th>
                <th onClick={() => handleSort('daysToExpiry')} style={{ ...tblHeaderStyle, cursor: 'pointer' }}>
                  Remaining Days <ArrowUpDown size={11} style={{ display: 'inline', marginLeft: 4 }} />
                </th>
                <th onClick={() => handleSort('contractValue')} style={{ ...tblHeaderStyle, cursor: 'pointer' }}>
                  Value (₹) <ArrowUpDown size={11} style={{ display: 'inline', marginLeft: 4 }} />
                </th>
                <th style={tblHeaderStyle}>Renewal Status</th>
                <th style={{ ...tblHeaderStyle, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(c => {
                const isExpired = c.daysToExpiry < 0 || c.status === 'Expired';
                const isCritical = c.daysToExpiry >= 0 && c.daysToExpiry <= 7;
                const isWarning  = c.daysToExpiry > 7 && c.daysToExpiry <= 30;

                const daysFormatted = isExpired
                  ? `Expired ${Math.abs(c.daysToExpiry)} days ago`
                  : `${c.daysToExpiry} days left`;

                const chipBg = isExpired ? '#FFEBEE' : isCritical ? '#FFF3E0' : isWarning ? '#FEF3C7' : '#EFF6FF';
                const chipFg = isExpired ? '#B71C1C' : isCritical ? '#E65100' : isWarning ? '#D97706' : '#1565C0';

                return (
                  <tr
                    key={c.contractId}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      background: isExpired ? '#FFF5F5' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: roleColor, fontWeight: 700 }}>
                      {c.contractNumber}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#111827', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.contractTitle}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#374151', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.vendorName}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#374151' }}>
                      {c.endDate}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 900, color: chipFg }}>
                      {daysFormatted}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#111827' }}>
                      {toINR(c.contractValue)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 100, background: chipBg, color: chipFg, textTransform: 'uppercase' }}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        {onNavigateTab && (
                          <button
                            onClick={() => onNavigateTab('cc-repository', c.contractId)}
                            style={{ padding: '5px 8px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 6, color: '#374151', cursor: 'pointer' }}
                            title="View Details"
                          >
                            <Eye size={13} />
                          </button>
                        )}
                        {!isReadOnly && (
                          <button
                            onClick={() => openRenewModal(c)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: `${roleColor}10`, border: `1px solid ${roleColor}30`, color: roleColor, borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                          >
                            <RefreshCw size={11} /> Renew
                          </button>
                        )}
                      </div>
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

      {/* RENEWAL HISTORY AUDIT */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: roleColor, margin: '0 0 14px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Executed Renewal History Log
        </h3>
        {renewals.length === 0 ? (
          <p style={{ color: '#9CA3AF', fontSize: 13 }}>No contract renewals recorded yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {renewals.map(r => (
              <div key={r.renewalId} style={{ display: 'flex', gap: 16, padding: '12px 16px', background: '#F9FAFB', borderRadius: 10, alignItems: 'center', borderLeft: `3px solid ${roleColor}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, fontFamily: 'monospace', color: roleColor }}>{r.contractNumber}</span>
                    <span style={{ fontSize: 12, color: '#111827', fontWeight: 700 }}>{r.vendorName}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#4B5563' }}>
                    Extended validity: <b>{r.oldEndDate}</b> → <b style={{ color: '#2E7D32' }}>{r.newEndDate}</b> · Authorized by <b>{r.renewedBy}</b> on {r.renewalDate}
                  </div>
                  {r.remarks && <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4, fontStyle: 'italic' }}>"{r.remarks}"</div>}
                </div>
                <CheckCircle size={20} color="#2E7D32" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RENEWAL MODAL DIALOG */}
      {renewTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #E4E7EC', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RefreshCw size={18} color={roleColor} />
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#111827' }}>Renew Contract Agreement</h3>
              </div>
              <button onClick={() => setRenewTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#667085' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleConfirmRenewal} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#F9FAFB', padding: 12, borderRadius: 8, border: '1px solid #E4E7EC', fontSize: 12 }}>
                <div><b>Contract:</b> {renewTarget.contractNumber} — {renewTarget.contractTitle}</div>
                <div><b>Vendor:</b> {renewTarget.vendorName}</div>
                <div><b>Current End Date:</b> {renewTarget.endDate}</div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6 }}>New Expiry / End Date *</label>
                <input
                  type="date"
                  required
                  value={renewEndDate}
                  onChange={e => setRenewEndDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Renewal Justification / Remarks *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Annual SLA extension approved with 5% rate escalation..."
                  value={renewRemarks}
                  onChange={e => setRenewRemarks(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setRenewTarget(null)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: roleColor, color: '#fff', fontSize: 13, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer' }}
                >
                  {submitting ? 'Processing...' : 'Confirm Renewal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const tblHeaderStyle: React.CSSProperties = {
  padding: '10px 16px',
  fontSize: 10,
  fontWeight: 700,
  color: '#667085',
  borderBottom: '1px solid #E4E7EC',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
};
