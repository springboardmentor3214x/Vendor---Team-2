/**
 * Module 6 · Certification Management
 * Tracks vendor certifications with auto-computed status, modals, and history tracking.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Award, AlertTriangle, CheckCircle, Clock, X, Eye, Download, RefreshCw, Filter, ArrowUpDown, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { contractService } from '../../services/contractService';
import type { Certification, CertificationStatus } from '../../models/contract';

interface Props { roleColor: string; currentRole: string; userName: string; }

const COMMON_CERTS = [
  'ISO 9001:2015 Quality Management System',
  'ISO 27001:2022 Information Security',
  'ISO 14001 Environmental Management',
  'GST Registration Certificate',
  'MSME / Udyam Registration',
  'Business Operation License',
  'Fire & Safety Compliance Certificate',
  'FSSAI Food Safety License',
  'CERT-In Security Audit Certificate',
  'CMMI Level 5 Certification',
];

const VENDORS_LIST = [
  { id: 1, name: 'TechCorp Solutions Pvt Ltd' },
  { id: 2, name: 'Global Logistics & Freight' },
  { id: 4, name: 'Zenith Office Supplies' },
  { id: 5, name: 'EquipMax Machinery Ltd' },
  { id: 9, name: 'NovaSec Systems Pvt Ltd' },
  { id: 10, name: 'SafeGuard Industries' },
  { id: 11, name: 'Infra Build & Civil Co.' },
  { id: 12, name: 'PrintMaster Communications' },
];

const STATUS_COLORS: Record<CertificationStatus, [string, string]> = {
  'Valid':          ['#E8F5E9', '#2E7D32'],
  'Expiring Soon':  ['#FEF3C7', '#D97706'],
  'Expired':        ['#FFEBEE', '#B71C1C'],
};

const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, padding: 20 };
const tblHeaderStyle: React.CSSProperties = { padding: '10px 14px', fontSize: 10, fontWeight: 700, color: '#667085', borderBottom: '1px solid #E4E7EC', textTransform: 'uppercase', whiteSpace: 'nowrap' };

export function CertificationManagement({ roleColor, currentRole, userName }: Props) {
  const [certs, setCerts] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CertificationStatus | 'All'>('All');
  const [vendorFilter, setVendorFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<'daysToExpiry' | 'expiryDate' | 'vendorName'>('daysToExpiry');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<Certification | null>(null);
  const [previewTarget, setPreviewTarget] = useState<Certification | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Add Form state
  const [addCertName, setAddCertName] = useState(COMMON_CERTS[0]);
  const [customCertName, setCustomCertName] = useState('');
  const [addCertNum, setAddCertNum] = useState('');
  const [addIssuer, setAddIssuer] = useState('');
  const [addVendorId, setAddVendorId] = useState(1);
  const [addIssueDate, setAddIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [addExpiryDate, setAddExpiryDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [addFileName, setAddFileName] = useState('');

  // Replace Form state
  const [replaceExpiryDate, setReplaceExpiryDate] = useState('');
  const [replaceFileName, setReplaceFileName] = useState('');

  const isReadOnly = currentRole === 'Auditor';

  const loadData = useCallback(() => {
    setLoading(true);
    contractService.getCertifications().subscribe(data => {
      setCerts(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleSort = (field: 'daysToExpiry' | 'expiryDate' | 'vendorName') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Submit New Certification
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (addExpiryDate <= addIssueDate) {
      alert('Expiry date must be after the issue date.');
      return;
    }
    const finalCertName = addCertName === 'Custom' ? customCertName : addCertName;
    const vendorObj = VENDORS_LIST.find(v => v.id === Number(addVendorId));

    contractService.addCertification({
      vendorId: Number(addVendorId),
      vendorName: vendorObj?.name || 'Vendor',
      certificationName: finalCertName,
      certificateNumber: addCertNum || `CERT-${Math.floor(100000 + Math.random() * 900000)}`,
      issuingAuthority: addIssuer || 'ISO Registrar',
      issueDate: addIssueDate,
      expiryDate: addExpiryDate,
      documentName: addFileName || `${finalCertName.replace(/\s+/g, '_')}_Document.pdf`,
    }).subscribe(() => {
      setShowAddModal(false);
      showNotification(`Certification '${finalCertName}' added successfully!`);
      loadData();
    });
  };

  // Submit Replace Certificate
  const handleReplaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replaceTarget || !replaceExpiryDate) return;

    const docName = replaceFileName || `${replaceTarget.certificationName.replace(/\s+/g, '_')}_Renewed.pdf`;
    contractService.replaceCertificate(replaceTarget.certificationId, docName, replaceExpiryDate).subscribe(() => {
      setReplaceTarget(null);
      showNotification(`Certificate '${replaceTarget.certificateNumber}' replaced & renewed!`);
      loadData();
    });
  };

  // Summary counts
  const totalCount = certs.length;
  const validCount = certs.filter(c => c.status === 'Valid').length;
  const soonCount = certs.filter(c => c.status === 'Expiring Soon').length;
  const expiredCount = certs.filter(c => c.status === 'Expired').length;

  // Unique vendors for filter
  const uniqueVendors = Array.from(new Set(certs.map(c => c.vendorName)));

  // Filtered & Sorted items
  let processed = certs.filter(c => {
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (vendorFilter !== 'All' && c.vendorName !== vendorFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.certificationName.toLowerCase().includes(q) ||
        c.certificateNumber.toLowerCase().includes(q) ||
        c.vendorName.toLowerCase().includes(q) ||
        c.issuingAuthority.toLowerCase().includes(q)
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

  return (
    <div style={{ padding: '24px 28px', fontFamily: 'Inter, sans-serif' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 1200, background: '#E8F5E9', border: '1px solid #2E7D32', borderRadius: 8, padding: '12px 20px', color: '#2E7D32', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle size={16} /> {toast}
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><X size={14} /></button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Certification Management</h1>
          <p style={{ fontSize: 13, color: '#667085', marginTop: 4 }}>
            ISO, GST, CERT-In and vendor quality certifications with auto-derived status
          </p>
        </div>
        {!isReadOnly && (
          <button
            onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: roleColor, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            <Plus size={15} /> Add Certification
          </button>
        )}
      </div>

      {/* SUMMARY CHIPS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Certifications', count: totalCount, color: '#1565C0', bg: '#EFF6FF', key: 'All' },
          { label: 'Valid Certifications', count: validCount, color: '#2E7D32', bg: '#E8F5E9', key: 'Valid' },
          { label: 'Expiring Soon (≤30d)', count: soonCount, color: '#D97706', bg: '#FEF3C7', key: 'Expiring Soon' },
          { label: 'Expired',               count: expiredCount, color: '#B71C1C', bg: '#FFEBEE', key: 'Expired' },
        ].map((k, i) => (
          <div
            key={i}
            onClick={() => setStatusFilter(k.key as any)}
            style={{
              ...cardStyle,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              borderLeft: `4px solid ${k.color}`,
              cursor: 'pointer',
              background: statusFilter === k.key ? `${k.color}08` : '#fff',
              boxShadow: statusFilter === k.key ? `0 0 0 2px ${k.color}40` : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Award size={18} color={k.color} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#667085', textTransform: 'uppercase', marginBottom: 2 }}>{k.label}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: k.color }}>{k.count}</div>
            </div>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div style={{ ...cardStyle, marginBottom: 20, padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: 10 }} />
            <input
              type="text"
              placeholder="Search certification name, cert #, vendor, or authority..."
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
              <option value="All">All Statuses ({totalCount})</option>
              <option value="Valid">Valid ({validCount})</option>
              <option value="Expiring Soon">Expiring Soon ({soonCount})</option>
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

      {/* CERTIFICATION TABLE */}
      <div style={{ ...cardStyle, marginBottom: 24, overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E4E7EC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: roleColor, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Vendor Certifications Registry ({processed.length})
          </h3>
          <span style={{ fontSize: 12, color: '#667085' }}>Showing {paginated.length} of {processed.length} entries</span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading certifications...</div>
        ) : paginated.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>No certifications match current filter criteria.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                <th style={tblHeaderStyle}>Certification Name</th>
                <th style={tblHeaderStyle}>Cert Number</th>
                <th onClick={() => handleSort('vendorName')} style={{ ...tblHeaderStyle, cursor: 'pointer' }}>
                  Vendor Name <ArrowUpDown size={11} style={{ display: 'inline', marginLeft: 4 }} />
                </th>
                <th style={tblHeaderStyle}>Issuing Authority</th>
                <th style={tblHeaderStyle}>Issue Date</th>
                <th onClick={() => handleSort('expiryDate')} style={{ ...tblHeaderStyle, cursor: 'pointer' }}>
                  Expiry Date <ArrowUpDown size={11} style={{ display: 'inline', marginLeft: 4 }} />
                </th>
                <th onClick={() => handleSort('daysToExpiry')} style={{ ...tblHeaderStyle, cursor: 'pointer' }}>
                  Status Chip <ArrowUpDown size={11} style={{ display: 'inline', marginLeft: 4 }} />
                </th>
                <th style={tblHeaderStyle}>Document</th>
                <th style={{ ...tblHeaderStyle, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(c => {
                const [sbg, sfg] = STATUS_COLORS[c.status];
                const isExpired = c.status === 'Expired' || c.daysToExpiry < 0;

                return (
                  <tr key={c.certificationId} style={{ borderBottom: '1px solid #F1F5F9', background: isExpired ? '#FFF5F5' : 'transparent' }}>
                    <td style={{ padding: '12px 14px', fontSize: 12, fontWeight: 700, color: '#111827', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.certificationName}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 11, fontFamily: 'monospace', color: roleColor, fontWeight: 700 }}>
                      {c.certificateNumber}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#374151', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.vendorName}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 11, color: '#667085', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.issuingAuthority}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#374151' }}>{c.issueDate}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#374151' }}>{c.expiryDate}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 100, background: sbg, color: sfg, textTransform: 'uppercase' }}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button
                          onClick={() => setPreviewTarget(c)}
                          style={{ background: 'none', border: 'none', color: '#1565C0', cursor: 'pointer' }}
                          title="Preview Certificate Document"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => alert(`Downloading ${c.documentName}...`)}
                          style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer' }}
                          title="Download Document File"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        {!isReadOnly && isExpired && (
                          <button
                            onClick={() => {
                              setReplaceTarget(c);
                              setReplaceExpiryDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#FFEBEE', border: '1px solid #B71C1C40', color: '#B71C1C', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                          >
                            <RefreshCw size={11} /> Replace Expired
                          </button>
                        )}
                        {!isReadOnly && !isExpired && (
                          <button
                            onClick={() => alert(`Editing certification ${c.certificateNumber}...`)}
                            style={{ padding: '4px 8px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 11, color: '#374151', cursor: 'pointer' }}
                          >
                            Update
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

      {/* ADD CERTIFICATION MODAL */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #E4E7EC', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Award size={20} color={roleColor} />
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#111827' }}>Add Vendor Certification</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#667085' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Vendor *</label>
                <select
                  value={addVendorId}
                  onChange={e => setAddVendorId(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none' }}
                >
                  {VENDORS_LIST.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Certification Type / Standard *</label>
                <select
                  value={addCertName}
                  onChange={e => setAddCertName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none' }}
                >
                  {COMMON_CERTS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="Custom">+ Other (Enter Custom Standard)</option>
                </select>
                {addCertName === 'Custom' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter custom certification standard..."
                    value={customCertName}
                    onChange={e => setCustomCertName(e.target.value)}
                    style={{ width: '100%', marginTop: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none' }}
                  />
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Certificate Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ISO-9001-9982"
                    value={addCertNum}
                    onChange={e => setAddCertNum(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Issuing Authority *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TUV SUD / BSI Registrar"
                    value={addIssuer}
                    onChange={e => setAddIssuer(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Issue Date *</label>
                  <input
                    type="date"
                    required
                    value={addIssueDate}
                    onChange={e => setAddIssueDate(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={addExpiryDate}
                    onChange={e => setAddExpiryDate(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Attach Certificate Document (.pdf / .png)</label>
                <input
                  type="file"
                  onChange={e => setAddFileName(e.target.files?.[0]?.name || '')}
                  style={{ fontSize: 12 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: roleColor, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Certification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPLACE EXPIRED CERTIFICATE MODAL */}
      {replaceTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #E4E7EC', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RefreshCw size={18} color="#B71C1C" />
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#111827' }}>Replace Expired Certificate</h3>
              </div>
              <button onClick={() => setReplaceTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#667085' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleReplaceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#FFEBEE', padding: 12, borderRadius: 8, border: '1px solid #B71C1C40', fontSize: 12, color: '#B71C1C' }}>
                <div><b>Cert Number:</b> {replaceTarget.certificateNumber}</div>
                <div><b>Standard:</b> {replaceTarget.certificationName} ({replaceTarget.vendorName})</div>
                <div><b>Previous Expiry:</b> {replaceTarget.expiryDate} (Expired)</div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>New Expiry Date *</label>
                <input
                  type="date"
                  required
                  value={replaceExpiryDate}
                  onChange={e => setReplaceExpiryDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Upload New Certificate File (.pdf)</label>
                <input
                  type="file"
                  onChange={e => setReplaceFileName(e.target.files?.[0]?.name || '')}
                  style={{ fontSize: 12 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setReplaceTarget(null)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#B71C1C', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Replace & Renew Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW CERTIFICATE MODAL */}
      {previewTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 600, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #E4E7EC', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={20} color={roleColor} />
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#111827' }}>Document Preview: {previewTarget.certificateNumber}</h3>
              </div>
              <button onClick={() => setPreviewTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#667085' }}><X size={18} /></button>
            </div>

            <div style={{ border: '2px dashed #E4E7EC', borderRadius: 12, padding: 30, textAlign: 'center', background: '#F9FAFB', marginBottom: 20 }}>
              <Award size={48} color={roleColor} style={{ display: 'block', margin: '0 auto 12px' }} />
              <h4 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 6px 0' }}>{previewTarget.certificationName}</h4>
              <p style={{ fontSize: 12, color: '#667085', margin: 0 }}>Certificate ID: {previewTarget.certificateNumber}</p>
              <p style={{ fontSize: 12, color: '#374151', marginTop: 8 }}>Issued by <b>{previewTarget.issuingAuthority}</b> to <b>{previewTarget.vendorName}</b></p>
              <div style={{ marginTop: 16, fontSize: 11, color: '#9CA3AF' }}>File Attachment: {previewTarget.documentName}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setPreviewTarget(null)}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Close Preview
              </button>
              <button
                onClick={() => alert(`Downloading ${previewTarget.documentName}...`)}
                style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: roleColor, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Download size={14} /> Download Certificate PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
