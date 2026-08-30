import React, { useState, useEffect } from 'react';
import { FileText, Upload, Search, Download, Trash2, Eye, LayoutGrid, Table as TableIcon, Filter, AlertTriangle, CheckCircle, FileCode, Image as ImageIcon, Archive, FileSpreadsheet, Paperclip, X } from 'lucide-react';
import { communicationService } from '../../services/communicationService';
import type { SharedFile, SharedFileType, CommEntityType } from '../../models/communication';

interface FileSharingViewProps {
  roleColor: string;
  currentRole: string;
  userName: string;
  onNavigateTab?: (tab: string, entityId?: string) => void;
}

export const FileSharingView: React.FC<FileSharingViewProps> = ({
  roleColor,
  currentRole,
  userName,
  onNavigateTab,
}) => {
  const isAdmin = currentRole === 'Administrator';
  const isVendor = currentRole === 'Vendor';

  const [files, setFiles] = useState<SharedFile[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchTerm, setSearchTerm] = useState('');

  // Filters
  const [filterFileType, setFilterFileType] = useState<SharedFileType | 'All'>('All');
  const [filterEntityType, setFilterEntityType] = useState<CommEntityType | 'All'>('All');

  // Sorting & Pagination
  const [sortField, setSortField] = useState<'uploadedAt' | 'fileName' | 'fileSizeLabel'>('uploadedAt');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<SharedFile | null>(null);
  const [deleteFileTarget, setDeleteFileTarget] = useState<SharedFile | null>(null);

  // Upload Form state
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileType, setUploadFileType] = useState<SharedFileType>('PDF');
  const [uploadEntityType, setUploadEntityType] = useState<CommEntityType>('Purchase Order');
  const [uploadEntityNum, setUploadEntityNum] = useState('PO-2026-0041');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [selectedSimulatedFile, setSelectedSimulatedFile] = useState<File | null>(null);

  useEffect(() => {
    loadFiles();
  }, [searchTerm, filterFileType, filterEntityType]);

  const loadFiles = () => {
    communicationService
      .getFiles({
        search: searchTerm,
        fileType: filterFileType,
        relatedEntityType: filterEntityType === 'All' ? undefined : filterEntityType,
      })
      .subscribe(data => {
        let result = [...data];
        if (isVendor) {
          result = result.filter(
            f =>
              f.uploadedBy.toLowerCase().includes(userName.toLowerCase()) ||
              f.relatedEntityNumber.toLowerCase().includes(userName.toLowerCase())
          );
        }
        setFiles(result);
      });
  };

  // Sorting
  const sortedFiles = [...files].sort((a, b) => {
    if (sortField === 'fileName') {
      return sortAsc ? a.fileName.localeCompare(b.fileName) : b.fileName.localeCompare(a.fileName);
    }
    if (sortField === 'uploadedAt') {
      return sortAsc
        ? new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
        : new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedFiles.length / pageSize) || 1;
  const paginatedFiles = sortedFiles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Action Handlers
  const handleDownload = (file: SharedFile) => {
    communicationService.downloadFile(file.fileId, 'USR-001', userName, currentRole).subscribe(() => {
      // Simulate browser trigger
      const dummyContent = `Mock download content for ${file.fileName}\nUploaded By: ${file.uploadedBy}\nRelated Record: ${file.relatedEntityNumber}`;
      const blob = new Blob([dummyContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteFileTarget) return;
    communicationService.deleteFile(deleteFileTarget.fileId, 'USR-001', userName, currentRole).subscribe(() => {
      setDeleteFileTarget(null);
      loadFiles();
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
      const validExts = ['.pdf', '.xlsx', '.docx', '.png', '.jpg', '.jpeg', '.zip'];

      if (!validExts.includes(ext)) {
        setUploadError('Invalid file type! Allowed formats: .pdf, .xlsx, .docx, .png, .jpg, .zip');
        setSelectedSimulatedFile(null);
        return;
      }
      if (f.size > 25 * 1024 * 1024) {
        setUploadError('File exceeds maximum allowed size of 25 MB.');
        setSelectedSimulatedFile(null);
        return;
      }

      setSelectedSimulatedFile(f);
      setUploadFileName(f.name);

      // Set file type category
      if (ext === '.pdf') setUploadFileType('PDF');
      else if (ext === '.xlsx') setUploadFileType('Excel');
      else if (ext === '.docx') setUploadFileType('Word');
      else if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') setUploadFileType('Image');
      else if (ext === '.zip') setUploadFileType('ZIP');
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileName.trim()) {
      setUploadError('Please select or specify a file name.');
      return;
    }
    if (!uploadEntityNum.trim()) {
      setUploadError('Linked Record Reference is REQUIRED.');
      return;
    }

    const fileSizeStr = selectedSimulatedFile
      ? (selectedSimulatedFile.size / (1024 * 1024)).toFixed(1) + ' MB'
      : '2.1 MB';

    communicationService
      .uploadFile(
        uploadFileName,
        uploadFileType,
        fileSizeStr,
        userName,
        currentRole,
        uploadEntityType,
        uploadEntityNum,
        uploadDescription
      )
      .subscribe(() => {
        setShowUploadModal(false);
        setUploadFileName('');
        setUploadDescription('');
        setUploadError('');
        setSelectedSimulatedFile(null);
        loadFiles();
      });
  };

  // Icon Helper
  const renderTypeIcon = (type: SharedFileType) => {
    switch (type) {
      case 'PDF':
        return <FileText size={18} color="#DC2626" />;
      case 'Excel':
        return <FileSpreadsheet size={18} color="#16A34A" />;
      case 'Word':
        return <FileCode size={18} color="#2563EB" />;
      case 'Image':
        return <ImageIcon size={18} color="#D97706" />;
      case 'ZIP':
        return <Archive size={18} color="#9333EA" />;
      default:
        return <Paperclip size={18} color="#64748B" />;
    }
  };

  // Summary counts
  const totalCount = files.length;
  const pdfCount = files.filter(f => f.fileType === 'PDF').length;
  const excelCount = files.filter(f => f.fileType === 'Excel').length;
  const wordCount = files.filter(f => f.fileType === 'Word').length;
  const imageCount = files.filter(f => f.fileType === 'Image').length;
  const zipCount = files.filter(f => f.fileType === 'ZIP').length;

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>Shared File Repository</h2>
          <p style={{ fontSize: 13, color: '#667085', margin: '4px 0 0 0' }}>
            Central repository for technical specifications, shipping logs, invoices, contracts, and compliance certifications.
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          style={{
            padding: '10px 18px',
            background: roleColor,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
          }}
        >
          <Upload size={15} /> Upload Shared File
        </button>
      </div>

      {/* Summary Chips Strip */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#667085' }}>Total Files:</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{totalCount}</span>
        </div>
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={14} color="#DC2626" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#991B1B' }}>PDF ({pdfCount})</span>
        </div>
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileSpreadsheet size={14} color="#16A34A" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#166534' }}>Excel ({excelCount})</span>
        </div>
        <div style={{ background: '#EFF6FF', border: '1px solid #93C5FD', borderRadius: 10, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileCode size={14} color="#2563EB" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#1E40AF' }}>Word ({wordCount})</span>
        </div>
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ImageIcon size={14} color="#D97706" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#92400E' }}>Images ({imageCount})</span>
        </div>
        <div style={{ background: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: 10, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Archive size={14} color="#9333EA" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#6B21A8' }}>ZIP ({zipCount})</span>
        </div>
      </div>

      {/* Filter and View Control Bar */}
      <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 240 }}>
              <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: 10 }} />
              <input
                type="text"
                placeholder="Search file name, record..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                style={{ width: '100%', padding: '7px 12px 7px 32px', fontSize: 12, border: '1px solid #E4E7EC', borderRadius: 6, outline: 'none' }}
              />
            </div>

            <select
              value={filterFileType}
              onChange={e => { setFilterFileType(e.target.value as any); setCurrentPage(1); }}
              style={{ padding: '7px 12px', fontSize: 12, border: '1px solid #E4E7EC', borderRadius: 6, outline: 'none', background: '#fff' }}
            >
              <option value="All">All File Formats</option>
              <option value="PDF">PDF</option>
              <option value="Excel">Excel</option>
              <option value="Word">Word</option>
              <option value="Image">Image</option>
              <option value="ZIP">ZIP</option>
            </select>

            <select
              value={filterEntityType}
              onChange={e => { setFilterEntityType(e.target.value as any); setCurrentPage(1); }}
              style={{ padding: '7px 12px', fontSize: 12, border: '1px solid #E4E7EC', borderRadius: 6, outline: 'none', background: '#fff' }}
            >
              <option value="All">All Linked Entity Types</option>
              <option value="Purchase Order">Purchase Order</option>
              <option value="Contract">Contract</option>
              <option value="Procurement Request">Procurement Request</option>
              <option value="Vendor">Vendor</option>
              <option value="Discussion">Discussion</option>
            </select>
          </div>

          {/* Table / Grid Mode Toggle */}
          <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 6, padding: 2 }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: 4,
                background: viewMode === 'table' ? '#fff' : 'transparent',
                color: viewMode === 'table' ? roleColor : '#64748B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <TableIcon size={14} /> Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: 4,
                background: viewMode === 'grid' ? '#fff' : 'transparent',
                color: viewMode === 'grid' ? roleColor : '#64748B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <LayoutGrid size={14} /> Grid
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'table' ? (
        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#667085', borderBottom: '1px solid #E4E7EC', textTransform: 'uppercase' }}>Format</th>
                <th
                  onClick={() => { setSortField('fileName'); setSortAsc(!sortAsc); }}
                  style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#667085', borderBottom: '1px solid #E4E7EC', textTransform: 'uppercase', cursor: 'pointer' }}
                >
                  File Name {sortField === 'fileName' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#667085', borderBottom: '1px solid #E4E7EC', textTransform: 'uppercase' }}>Size</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#667085', borderBottom: '1px solid #E4E7EC', textTransform: 'uppercase' }}>Uploaded By</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#667085', borderBottom: '1px solid #E4E7EC', textTransform: 'uppercase' }}>Linked Record</th>
                <th
                  onClick={() => { setSortField('uploadedAt'); setSortAsc(!sortAsc); }}
                  style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#667085', borderBottom: '1px solid #E4E7EC', textTransform: 'uppercase', cursor: 'pointer' }}
                >
                  Uploaded At {sortField === 'uploadedAt' ? (sortAsc ? '▲' : '▼') : ''}
                </th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#667085', borderBottom: '1px solid #E4E7EC', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFiles.map(f => (
                <tr key={f.fileId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 16px' }}>{renderTypeIcon(f.fileType)}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#111827' }}>
                    {f.fileName}
                    <div style={{ fontSize: 11, color: '#667085', fontWeight: 400, marginTop: 2 }}>{f.description}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#667085' }}>{f.fileSizeLabel}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12 }}>
                    <b>{f.uploadedBy}</b>{' '}
                    <span style={{ padding: '2px 6px', borderRadius: 4, background: '#F1F5F9', color: '#475569', fontSize: 10, fontWeight: 600 }}>{f.uploadedByRole}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12 }}>
                    <span
                      onClick={() => {
                        if (onNavigateTab) {
                          if (f.relatedEntityType === 'Purchase Order') onNavigateTab('purchase-orders');
                          else if (f.relatedEntityType === 'Contract') onNavigateTab('contracts');
                          else if (f.relatedEntityType === 'Procurement Request') onNavigateTab('proc-requests');
                        }
                      }}
                      style={{ cursor: 'pointer', padding: '2px 8px', borderRadius: 6, background: '#EFF6FF', color: '#1E40AF', fontSize: 11, fontWeight: 700 }}
                    >
                      {f.relatedEntityNumber}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 11, color: '#9CA3AF' }}>{new Date(f.uploadedAt).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setPreviewFile(f)}
                        style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#fff', color: '#475569', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <Eye size={12} /> Preview
                      </button>
                      <button
                        onClick={() => handleDownload(f)}
                        style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${roleColor}`, background: '#fff', color: roleColor, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <Download size={12} /> Download
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => setDeleteFileTarget(f)}
                          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedFiles.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 30, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                    No files found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {paginatedFiles.map(f => (
            <div key={f.fileId} style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {renderTypeIcon(f.fileType)}
                  </div>
                  <span style={{ padding: '2px 8px', borderRadius: 6, background: '#EFF6FF', color: '#1E40AF', fontSize: 11, fontWeight: 700 }}>
                    {f.relatedEntityNumber}
                  </span>
                </div>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: '#111827', margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.fileName}</h4>
                <p style={{ fontSize: 11, color: '#667085', margin: '0 0 12px 0', minHeight: 32, lineHeight: 1.4 }}>{f.description}</p>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9CA3AF', marginBottom: 12, borderTop: '1px solid #F1F5F9', paddingTop: 8 }}>
                  <span>By: <b>{f.uploadedBy}</b></span>
                  <span>{f.fileSizeLabel}</span>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setPreviewFile(f)}
                    style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: '1px solid #CBD5E1', background: '#fff', color: '#475569', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                  >
                    <Eye size={12} /> Preview
                  </button>
                  <button
                    onClick={() => handleDownload(f)}
                    style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: `1px solid ${roleColor}`, background: '#fff', color: roleColor, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                  >
                    <Download size={12} /> Download
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => setDeleteFileTarget(f)}
                      style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <span style={{ fontSize: 12, color: '#667085' }}>
          Showing {paginatedFiles.length} of {sortedFiles.length} shared documents
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #E4E7EC', background: '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
          >
            Previous
          </button>
          <span style={{ fontSize: 12, display: 'flex', alignItems: 'center', padding: '0 8px', color: '#374151' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #E4E7EC', background: '#fff', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}
          >
            Next
          </button>
        </div>
      </div>

      {/* Upload File Modal Dialog */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 500, boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#111827' }}>Upload Shared Document</h3>
              <button onClick={() => setShowUploadModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            {uploadError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '8px 12px', borderRadius: 6, fontSize: 12, marginBottom: 14 }}>
                ⚠️ {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>
                  Select Local File (accepts .pdf, .xlsx, .docx, .png, .jpg, .zip &lt;25MB)
                </label>
                <input
                  type="file"
                  accept=".pdf,.xlsx,.docx,.png,.jpg,.jpeg,.zip"
                  onChange={handleFileSelect}
                  style={{ width: '100%', fontSize: 12, border: '1px solid #CBD5E1', padding: 6, borderRadius: 6 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>File Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Revised_Shipment_Plan_August2026.pdf"
                  value={uploadFileName}
                  onChange={e => setUploadFileName(e.target.value)}
                  style={{ width: '100%', padding: 8, fontSize: 12, border: '1px solid #E4E7EC', borderRadius: 6 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>File Format</label>
                  <select
                    value={uploadFileType}
                    onChange={e => setUploadFileType(e.target.value as any)}
                    style={{ width: '100%', padding: 8, fontSize: 12, border: '1px solid #E4E7EC', borderRadius: 6, background: '#fff' }}
                  >
                    <option value="PDF">PDF</option>
                    <option value="Excel">Excel</option>
                    <option value="Word">Word</option>
                    <option value="Image">Image</option>
                    <option value="ZIP">ZIP</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Linked Entity Type *</label>
                  <select
                    value={uploadEntityType}
                    onChange={e => setUploadEntityType(e.target.value as any)}
                    style={{ width: '100%', padding: 8, fontSize: 12, border: '1px solid #E4E7EC', borderRadius: 6, background: '#fff' }}
                  >
                    <option value="Purchase Order">Purchase Order</option>
                    <option value="Contract">Contract</option>
                    <option value="Procurement Request">Procurement Request</option>
                    <option value="Vendor">Vendor</option>
                    <option value="Discussion">Discussion</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Linked Reference Number * (REQUIRED)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PO-2026-0041, CT-2026-0001"
                  value={uploadEntityNum}
                  onChange={e => setUploadEntityNum(e.target.value)}
                  style={{ width: '100%', padding: 8, fontSize: 12, border: '1px solid #E4E7EC', borderRadius: 6 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Description / Purpose</label>
                <textarea
                  rows={2}
                  placeholder="Provide brief summary for stakeholders..."
                  value={uploadDescription}
                  onChange={e => setUploadDescription(e.target.value)}
                  style={{ width: '100%', padding: 8, fontSize: 12, border: '1px solid #E4E7EC', borderRadius: 6 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  style={{ padding: '8px 14px', background: '#F1F5F9', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', background: roleColor, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Upload & Notify Stakeholders
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Preview Viewer Modal */}
      {previewFile && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}>
          <div style={{ background: '#fff', borderRadius: 12, width: 640, overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '16px 20px', background: '#F8FAFC', borderBottom: '1px solid #E4E7EC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {renderTypeIcon(previewFile.fileType)}
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: '#111827' }}>{previewFile.fileName}</h4>
                  <span style={{ fontSize: 11, color: '#64748B' }}>Linked to {previewFile.relatedEntityNumber} ({previewFile.relatedEntityType})</span>
                </div>
              </div>
              <button onClick={() => setPreviewFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 24 }}>
              {previewFile.fileType === 'PDF' || previewFile.fileType === 'Image' ? (
                <div style={{ background: '#F1F5F9', border: '2px dashed #CBD5E1', borderRadius: 8, padding: 30, textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 8 }}>📄</div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>Mock Document Render Preview</h4>
                  <p style={{ fontSize: 12, color: '#64748B', maxWidth: 400, margin: '6px auto 16px' }}>
                    Document content rendered from local storage for high resolution client inspection.
                  </p>
                  <div style={{ background: '#fff', border: '1px solid #E2E8F0', padding: 12, borderRadius: 6, fontSize: 11, color: '#334155', textAlign: 'left' }}>
                    <b>Document Header:</b> {previewFile.fileName}<br />
                    <b>Author / Uploader:</b> {previewFile.uploadedBy} ({previewFile.uploadedByRole})<br />
                    <b>Context Note:</b> {previewFile.description}
                  </div>
                </div>
              ) : (
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 20 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>File Metadata Card</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
                    <div><b>Format:</b> {previewFile.fileType}</div>
                    <div><b>Size:</b> {previewFile.fileSizeLabel}</div>
                    <div><b>Uploaded By:</b> {previewFile.uploadedBy}</div>
                    <div><b>Role:</b> {previewFile.uploadedByRole}</div>
                    <div><b>Uploaded At:</b> {new Date(previewFile.uploadedAt).toLocaleString()}</div>
                    <div><b>Entity Link:</b> {previewFile.relatedEntityNumber}</div>
                  </div>
                  <p style={{ fontSize: 12, color: '#475569', marginTop: 14, background: '#fff', padding: 10, borderRadius: 6, border: '1px solid #E2E8F0' }}>
                    {previewFile.description}
                  </p>
                </div>
              )}
            </div>

            <div style={{ padding: '14px 20px', background: '#F8FAFC', borderTop: '1px solid #E4E7EC', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setPreviewFile(null)} style={{ padding: '8px 14px', background: '#E2E8F0', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Close Preview
              </button>
              <button onClick={() => { handleDownload(previewFile); setPreviewFile(null); }} style={{ padding: '8px 16px', background: roleColor, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Download size={13} /> Download File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteFileTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 420, boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#DC2626', marginBottom: 12 }}>
              <AlertTriangle size={20} />
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Confirm File Deletion</h3>
            </div>
            <p style={{ fontSize: 13, color: '#374151', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete <b>{deleteFileTarget.fileName}</b> linked to <b>{deleteFileTarget.relatedEntityNumber}</b>? This operation will be logged in the activity audit trail.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setDeleteFileTarget(null)} style={{ padding: '8px 14px', background: '#F1F5F9', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} style={{ padding: '8px 16px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
