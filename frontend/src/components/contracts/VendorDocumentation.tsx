/**
 * Module 6 · Vendor Documentation Management
 * Browse, version, upload, and manage vendor compliance documents.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Search, Upload, Trash2, RefreshCw, FolderOpen, CheckCircle, X, Eye, Download, FileText, AlertTriangle } from 'lucide-react';
import { contractService } from '../../services/contractService';
import type { VendorDocument, VendorDocumentType } from '../../models/contract';

interface Props { roleColor: string; currentRole: string; userName: string; }
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, padding: 20 };

const DOC_TYPES: VendorDocumentType[] = [
  'GST Certificate',
  'PAN Card',
  'Company Registration',
  'Business License',
  'Bank Details',
  'Insurance',
  'Product Catalog',
  'NDA',
  'Service Agreement',
  'Quality Certificate',
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

const TYPE_COLORS: Record<string, [string, string]> = {
  'GST Certificate':     ['#E8F5E9', '#2E7D32'],
  'PAN Card':            ['#EFF6FF', '#1565C0'],
  'Company Registration':['#F3E5F5', '#6A1B9A'],
  'Business License':    ['#FFF3E0', '#E65100'],
  'Bank Details':        ['#F9FAFB', '#374151'],
  'Insurance':           ['#E0F7FA', '#006064'],
  'Product Catalog':     ['#FEF3C7', '#D97706'],
  'NDA':                 ['#FFEBEE', '#B71C1C'],
  'Service Agreement':   ['#E8F5E9', '#1B5E20'],
  'Quality Certificate': ['#EDE7F6', '#4527A0'],
};

export function VendorDocumentation({ roleColor, currentRole, userName }: Props) {
  const [docs, setDocs] = useState<VendorDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState<number | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<VendorDocumentType | 'All'>('All');

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<VendorDocument | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VendorDocument | null>(null);
  const [previewTarget, setPreviewTarget] = useState<VendorDocument | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Upload Form state
  const [uploadDocType, setUploadDocType] = useState<VendorDocumentType>(DOC_TYPES[0]);
  const [uploadVendorId, setUploadVendorId] = useState<number>(1);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadRemarks, setUploadRemarks] = useState('');

  // Replace Form state
  const [replaceFileName, setReplaceFileName] = useState('');

  const isVendorRole = currentRole === 'Vendor';
  const isReadOnly = currentRole === 'Auditor';
  const canDelete = currentRole === 'Administrator' || currentRole === 'Procurement Manager';

  // If Vendor role, lock selector to TechCorp Solutions (id: 1)
  useEffect(() => {
    if (isVendorRole) {
      setSelectedVendorId(1);
      setUploadVendorId(1);
    }
  }, [isVendorRole]);

  const loadData = useCallback(() => {
    setLoading(true);
    const vendorIdParam = selectedVendorId === 'All' ? undefined : (selectedVendorId as number);
    contractService.getVendorDocuments({ vendorId: vendorIdParam, documentType: typeFilter === 'All' ? undefined : typeFilter, search }).subscribe(data => {
      setDocs(data);
      setLoading(false);
    });
  }, [selectedVendorId, typeFilter, search]);

  useEffect(() => { loadData(); }, [loadData]);

  const showNotification = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // Submit Upload Document
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vendorObj = VENDORS_LIST.find(v => v.id === Number(uploadVendorId));
    const filename = uploadFileName || `${uploadDocType.replace(/\s+/g, '_')}_${new Date().getFullYear()}.pdf`;

    contractService.uploadDocument({
      vendorId: Number(uploadVendorId),
      vendorName: vendorObj?.name || 'Vendor',
      documentType: uploadDocType,
      documentName: filename,
      uploadedBy: userName || 'Procurement User',
      version: 'v1.0',
    }).subscribe(() => {
      setShowUploadModal(false);
      showNotification(`Document '${filename}' uploaded successfully for ${vendorObj?.name}!`);
      loadData();
    });
  };

  // Submit Replace Document
  const handleReplaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replaceTarget) return;

    const newFilename = replaceFileName || `${replaceTarget.documentType.replace(/\s+/g, '_')}_Updated.pdf`;
    contractService.replaceDocument(replaceTarget.documentId, newFilename, userName || 'Procurement User').subscribe(() => {
      setReplaceTarget(null);
      showNotification(`Document updated to new version!`);
      loadData();
    });
  };

  // Submit Delete Document
  const handleConfirmDelete = () => {
    if (!deleteTarget || !canDelete) return;
    contractService.deleteDocument(deleteTarget.documentId).subscribe(() => {
      showNotification(`Document '${deleteTarget.documentName}' deleted.`, false);
      setDeleteTarget(null);
      loadData();
    });
  };

  // Group by Document Type for clean card view
  const byType: Record<string, VendorDocument[]> = {};
  docs.forEach(d => {
    if (!byType[d.documentType]) byType[d.documentType] = [];
    byType[d.documentType].push(d);
  });

  return (
    <div style={{ padding: '24px 28px', fontFamily: 'Inter, sans-serif' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 1200, background: toast.ok ? '#E8F5E9' : '#FFEBEE', border: `1px solid ${toast.ok ? '#2E7D32' : '#B71C1C'}`, borderRadius: 8, padding: '12px 20px', color: toast.ok ? '#2E7D32' : '#B71C1C', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle size={16} /> {toast.msg}
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><X size={14} /></button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Vendor Documentation Repository</h1>
          <p style={{ fontSize: 13, color: '#667085', marginTop: 4 }}>
            Central repository for vendor GST, PAN, licenses, agreements, and version history ({docs.length} files)
          </p>
        </div>
        {!isReadOnly && (
          <button
            onClick={() => setShowUploadModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: roleColor, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            <Upload size={15} /> Upload Document
          </button>
        )}
      </div>

      {/* VENDOR SELECTOR & FILTERS */}
      <div style={{ ...cardStyle, marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 14, alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#667085', textTransform: 'uppercase', marginBottom: 4 }}>Select Vendor Supplier *</label>
            <select
              value={selectedVendorId}
              disabled={isVendorRole}
              onChange={e => setSelectedVendorId(e.target.value === 'All' ? 'All' : Number(e.target.value))}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none', background: isVendorRole ? '#F3F4F6' : '#fff' }}
            >
              {!isVendorRole && <option value="All">All Registered Vendors ({VENDORS_LIST.length})</option>}
              {VENDORS_LIST.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            {isVendorRole && <span style={{ fontSize: 10, color: '#667085', marginTop: 2, display: 'block' }}>🔒 Locked to your assigned vendor profile</span>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#667085', textTransform: 'uppercase', marginBottom: 4 }}>Filter Document Type</label>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none', background: '#fff' }}
            >
              <option value="All">All Document Types</option>
              {DOC_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div style={{ position: 'relative', marginTop: 16 }}>
            <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: 10 }} />
            <input
              type="text"
              placeholder="Search filename or vendor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: 8, border: '1px solid #E4E7EC', outline: 'none', fontSize: 12 }}
            />
          </div>
        </div>
      </div>

      {/* DOCUMENT CARDS GROUPED BY TYPE */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading vendor documents...</div>
      ) : Object.keys(byType).length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
          <FolderOpen size={32} color="#9CA3AF" style={{ display: 'block', margin: '0 auto 10px' }} />
          No vendor documents found for the selected vendor or filter.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {Object.entries(byType).map(([typeTitle, typeDocs]) => {
            const [dbg, dfg] = TYPE_COLORS[typeTitle] || ['#F9FAFB', '#374151'];
            return (
              <div key={typeTitle} style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, borderBottom: '1px solid #F1F5F9', paddingBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 100, background: dbg, color: dfg, textTransform: 'uppercase' }}>
                    {typeTitle}
                  </span>
                  <span style={{ fontSize: 12, color: '#667085' }}>{typeDocs.length} file{typeDocs.length !== 1 ? 's' : ''} on record</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                  {typeDocs.map(d => (
                    <div key={d.documentId} style={{ padding: 14, background: '#F9FAFB', border: '1px solid #E4E7EC', borderRadius: 10, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: `${roleColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={18} color={roleColor} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {d.documentName}
                        </div>
                        <div style={{ fontSize: 11, color: '#374151', marginTop: 2, fontWeight: 600 }}>{d.vendorName}</div>
                        <div style={{ fontSize: 10, color: '#667085', marginTop: 4 }}>
                          <span style={{ fontWeight: 800, color: roleColor }}>{d.version}</span> · Uploaded by {d.uploadedBy} ({d.uploadedAt.slice(0, 10)})
                        </div>

                        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                          <button
                            onClick={() => setPreviewTarget(d)}
                            style={{ padding: '4px 8px', fontSize: 11, fontWeight: 700, color: '#1565C0', background: '#EFF6FF', border: '1px solid #1565C030', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            <Eye size={11} /> View
                          </button>
                          <button
                            onClick={() => alert(`Downloading ${d.documentName}...`)}
                            style={{ padding: '4px 8px', fontSize: 11, fontWeight: 700, color: '#374151', background: '#fff', border: '1px solid #D1D5DB', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            <Download size={11} /> Download
                          </button>
                          {!isReadOnly && (
                            <button
                              onClick={() => setReplaceTarget(d)}
                              style={{ padding: '4px 8px', fontSize: 11, fontWeight: 700, color: roleColor, background: `${roleColor}10`, border: `1px solid ${roleColor}30`, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <RefreshCw size={11} /> Replace
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setDeleteTarget(d)}
                              style={{ padding: '4px 8px', fontSize: 11, fontWeight: 700, color: '#B71C1C', background: '#FFEBEE', border: '1px solid #B71C1C30', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <Trash2 size={11} /> Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #E4E7EC', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Upload size={20} color={roleColor} />
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#111827' }}>Upload Vendor Document</h3>
              </div>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#667085' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Vendor *</label>
                <select
                  disabled={isVendorRole}
                  value={uploadVendorId}
                  onChange={e => setUploadVendorId(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none', background: isVendorRole ? '#F3F4F6' : '#fff' }}
                >
                  {VENDORS_LIST.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Document Type *</label>
                <select
                  value={uploadDocType}
                  onChange={e => setUploadDocType(e.target.value as any)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none' }}
                >
                  {DOC_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Select File (.pdf, .docx, .png) *</label>
                <input
                  type="file"
                  required
                  onChange={e => setUploadFileName(e.target.files?.[0]?.name || '')}
                  style={{ fontSize: 12 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Remarks / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Annual updated GST registration certificate..."
                  value={uploadRemarks}
                  onChange={e => setUploadRemarks(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: roleColor, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Upload File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPLACE DOCUMENT MODAL */}
      {replaceTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #E4E7EC', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RefreshCw size={18} color={roleColor} />
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#111827' }}>Replace Document (Version Up)</h3>
              </div>
              <button onClick={() => setReplaceTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#667085' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleReplaceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#F9FAFB', padding: 12, borderRadius: 8, border: '1px solid #E4E7EC', fontSize: 12 }}>
                <div><b>Document:</b> {replaceTarget.documentName}</div>
                <div><b>Current Version:</b> <span style={{ color: roleColor, fontWeight: 800 }}>{replaceTarget.version}</span></div>
                <div><b>Vendor:</b> {replaceTarget.vendorName}</div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Upload Replacement File (.pdf) *</label>
                <input
                  type="file"
                  required
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
                  style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: roleColor, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Confirm Version Upgrade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FFEBEE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={20} color="#B71C1C" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#111827' }}>Confirm Document Deletion</h3>
                <p style={{ fontSize: 12, color: '#667085', margin: 0 }}>This action permanently removes the compliance file record.</p>
              </div>
            </div>

            <p style={{ fontSize: 13, color: '#374151', background: '#F9FAFB', padding: 12, borderRadius: 8, border: '1px solid #E4E7EC' }}>
              Are you sure you want to delete <b>{deleteTarget.documentName}</b> ({deleteTarget.documentType}) for <b>{deleteTarget.vendorName}</b>?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#B71C1C', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Delete File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 580, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #E4E7EC', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={20} color={roleColor} />
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#111827' }}>Document Viewer: {previewTarget.documentName}</h3>
              </div>
              <button onClick={() => setPreviewTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#667085' }}><X size={18} /></button>
            </div>

            <div style={{ border: '2px dashed #E4E7EC', borderRadius: 12, padding: 30, textAlign: 'center', background: '#F9FAFB', marginBottom: 20 }}>
              <FolderOpen size={48} color={roleColor} style={{ display: 'block', margin: '0 auto 12px' }} />
              <h4 style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: '0 0 6px 0' }}>{previewTarget.documentName}</h4>
              <p style={{ fontSize: 12, color: '#667085', margin: 0 }}>Category: {previewTarget.documentType} · Version: {previewTarget.version}</p>
              <p style={{ fontSize: 12, color: '#374151', marginTop: 8 }}>Vendor: <b>{previewTarget.vendorName}</b></p>
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
                <Download size={14} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
