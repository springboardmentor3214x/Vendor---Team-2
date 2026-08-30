import React, { useState, useEffect } from 'react';
import {
  MessageSquare, Plus, Search, Filter, ExternalLink, CheckCircle, RotateCcw,
  Paperclip, Send, X, Shield, FileText, Download, UserCheck, AlertCircle
} from 'lucide-react';
import { communicationService } from '../../services/communicationService';
import type { Discussion, DiscussionMessage, SharedFile, SharedFileType, CommEntityType } from '../../models/communication';

const MOCK_ENTITIES = [
  { type: 'Purchase Order' as CommEntityType, number: 'PO-2026-0041', label: 'PO-2026-0041 (Reefer Cold Chain Logistics)' },
  { type: 'Purchase Order' as CommEntityType, number: 'PO-2026-0042', label: 'PO-2026-0042 (Workstation Hardware)' },
  { type: 'Purchase Order' as CommEntityType, number: 'PO-2026-0040', label: 'PO-2026-0040 (Heavy Duty Forklift)' },
  { type: 'Contract' as CommEntityType, number: 'CT-2026-0001', label: 'CT-2026-0001 (TechCorp Master Service Agreement)' },
  { type: 'Contract' as CommEntityType, number: 'CT-2026-0003', label: 'CT-2026-0003 (Zenith Supply Contract)' },
  { type: 'Procurement Request' as CommEntityType, number: 'PR-2026-0003', label: 'PR-2026-0003 (Warehouse C Civil Repair)' },
  { type: 'Procurement Request' as CommEntityType, number: 'PR-2026-0007', label: 'PR-2026-0007 (OHSAS Safety Audit)' },
];

const AVAILABLE_PARTICIPANTS = [
  { userId: 'USR-002', name: 'Rohan Verma', role: 'Procurement Manager' },
  { userId: 'VND-002', name: 'Global Logistics & Freight', role: 'Vendor' },
  { userId: 'USR-003', name: 'Lata Nair', role: 'Finance Officer' },
  { userId: 'USR-004', name: 'Supply Chain Lead', role: 'Supply Chain Manager' },
  { userId: 'USR-001', name: 'Hrithik', role: 'Administrator' },
  { userId: 'VND-001', name: 'TechCorp Solutions Pvt Ltd', role: 'Vendor' },
  { userId: 'VND-010', name: 'SafeGuard Industries', role: 'Vendor' },
];

interface DiscussionsViewProps {
  roleColor: string;
  currentRole: string;
  userName: string;
  onNavigateTab?: (tab: string, entityId?: string) => void;
}

export const DiscussionsView: React.FC<DiscussionsViewProps> = ({
  roleColor,
  currentRole,
  userName,
  onNavigateTab,
}) => {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [entityFilter, setEntityFilter] = useState<string>('All');
  const [myDiscussionsOnly, setMyDiscussionsOnly] = useState(false);

  // New Discussion Modal
  const [showStartModal, setShowStartModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newEntityIdx, setNewEntityIdx] = useState<number | ''>(0); // Required entity
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([
    'USR-002', 'VND-002', 'USR-003', 'USR-004'
  ]);
  const [newOpeningMsg, setNewOpeningMsg] = useState('');

  // Reply Composer
  const [replyText, setReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<SharedFile[]>([]);
  const [previewFile, setPreviewFile] = useState<SharedFile | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isAuditor = currentRole === 'Auditor';

  const mapExtToType = (ext: string): SharedFileType => {
    if (['XLS', 'XLSX', 'CSV'].includes(ext)) return 'Excel';
    if (['DOC', 'DOCX', 'TXT'].includes(ext)) return 'Word';
    if (['PNG', 'JPG', 'JPEG', 'GIF', 'SVG', 'WEBP'].includes(ext)) return 'Image';
    if (['ZIP', 'RAR', '7Z', 'TAR', 'GZ'].includes(ext)) return 'ZIP';
    return 'PDF';
  };

  const handleReplyFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedDiscussion) return;
    Array.from(files).forEach(file => {
      const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const newFile: SharedFile = {
        fileId: `FILE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        fileName: file.name,
        fileType: mapExtToType(ext),
        fileSizeLabel: `${sizeMb} MB`,
        uploadedBy: userName,
        uploadedByRole: currentRole,
        uploadedAt: new Date().toISOString(),
        relatedEntityType: selectedDiscussion.relatedEntityType || 'Purchase Order',
        relatedEntityNumber: selectedDiscussion.relatedEntityNumber || 'PO-2026-0041',
        description: `Attached document: ${file.name}`,
      };
      setReplyAttachments(prev => [...prev, newFile]);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    loadDiscussions();
  }, [searchTerm, statusFilter, entityFilter, myDiscussionsOnly]);

  const loadDiscussions = () => {
    communicationService.getDiscussions({ search: searchTerm }).subscribe(data => {
      let filtered = [...data];

      if (statusFilter !== 'All') {
        filtered = filtered.filter(d => d.status === statusFilter);
      }

      if (entityFilter !== 'All') {
        filtered = filtered.filter(d => d.relatedEntityType === entityFilter);
      }

      if (myDiscussionsOnly) {
        filtered = filtered.filter(d =>
          d.createdBy === userName || d.participants.some(p => p.name === userName || p.role === currentRole)
        );
      }

      setDiscussions(filtered);

      if (filtered.length > 0 && (!selectedDiscussion || !filtered.some(d => d.discussionId === selectedDiscussion.discussionId))) {
        setSelectedDiscussion(filtered[0]);
      }
    });
  };

  const handleStartDiscussion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newOpeningMsg.trim() || newEntityIdx === '') return;

    const entity = MOCK_ENTITIES[newEntityIdx as number];
    const parts = AVAILABLE_PARTICIPANTS.filter(p => selectedParticipants.includes(p.userId));

    communicationService
      .createDiscussion(newTitle, userName, currentRole, entity.type, entity.number, parts, newOpeningMsg)
      .subscribe(newDisc => {
        setShowStartModal(false);
        setNewTitle('');
        setNewOpeningMsg('');
        loadDiscussions();
        setSelectedDiscussion(newDisc);
      });
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuditor || (!replyText.trim() && replyAttachments.length === 0) || !selectedDiscussion) return;

    const attIds = replyAttachments.map(a => a.fileId);
    const textToSend = replyText || (replyAttachments.length > 0 ? `[Attached ${replyAttachments.length} file(s): ${replyAttachments.map(f => f.fileName).join(', ')}]` : '');
    setReplyText('');
    setReplyAttachments([]);

    communicationService
      .replyToDiscussion(selectedDiscussion.discussionId, userName, currentRole, textToSend, attIds)
      .subscribe(newPost => {
        setSelectedDiscussion(prev => prev ? { ...prev, messages: [...prev.messages, newPost] } : null);
        loadDiscussions();
      });
  };

  const handleToggleStatus = () => {
    if (!selectedDiscussion) return;
    const newStatus = selectedDiscussion.status === 'Resolved' ? 'Open' : 'Resolved';
    communicationService
      .updateDiscussionStatus(selectedDiscussion.discussionId, newStatus)
      .subscribe(() => {
        setSelectedDiscussion(prev => prev ? { ...prev, status: newStatus } : null);
        loadDiscussions();
      });
  };

  const handleEntityChipClick = (type: CommEntityType | null, number: string | null) => {
    if (!onNavigateTab || !type || !number) return;
    if (type === 'Purchase Order') onNavigateTab('purchase-orders', number);
    else if (type === 'Contract') onNavigateTab('cc-repository', number);
    else if (type === 'Procurement Request') onNavigateTab('proc-requests', number);
    else if (type === 'Invoice') onNavigateTab('proc-invoices', number);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Open') return { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' };
    if (status === 'Resolved') return { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' };
    return { bg: '#F3F4F6', color: '#4B5563', border: '#E5E7EB' };
  };

  return (
    <div style={{ padding: '24px 28px', height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}>
      {/* Hidden File Input for replies */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleReplyFileSelect}
        style={{ display: 'none' }}
        multiple
      />

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>Procurement Discussions</h2>
          <p style={{ fontSize: 13, color: '#667085', margin: '4px 0 0 0' }}>
            Multi-stakeholder collaboration threads bound strictly to procurement records.
          </p>
        </div>
        {!isAuditor && (
          <button
            onClick={() => setShowStartModal(true)}
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
              gap: 6,
              boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
            }}
          >
            <Plus size={15} /> Start Discussion
          </button>
        )}
      </div>

      {/* Main Content Layout */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '400px 1fr', background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        
        {/* LEFT PANE: Discussions List */}
        <div style={{ borderRight: '1px solid #E4E7EC', display: 'flex', flexDirection: 'column', minHeight: 0, background: '#F8FAFC' }}>
          
          {/* Filter Bar */}
          <div style={{ padding: 14, borderBottom: '1px solid #E4E7EC', background: '#fff', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: 10 }} />
              <input
                type="text"
                placeholder="Search discussions by title or PO..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '6px 10px 6px 32px', fontSize: 12, border: '1px solid #E4E7EC', borderRadius: 6, outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: '4px 8px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: '1px solid #CBD5E1', background: '#fff' }}
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="Resolved">Resolved</option>
              </select>

              <select
                value={entityFilter}
                onChange={e => setEntityFilter(e.target.value)}
                style={{ padding: '4px 8px', fontSize: 11, fontWeight: 600, borderRadius: 6, border: '1px solid #CBD5E1', background: '#fff' }}
              >
                <option value="All">All Types</option>
                <option value="Purchase Order">Purchase Orders</option>
                <option value="Contract">Contracts</option>
                <option value="Procurement Request">Requests</option>
              </select>

              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={myDiscussionsOnly}
                  onChange={e => setMyDiscussionsOnly(e.target.checked)}
                />
                Mine
              </label>
            </div>
          </div>

          {/* List Items */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {discussions.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No discussions found</div>
            ) : (
              discussions.map(d => {
                const isSel = selectedDiscussion?.discussionId === d.discussionId;
                const sBadge = getStatusBadge(d.status);
                return (
                  <div
                    key={d.discussionId}
                    onClick={() => setSelectedDiscussion(d)}
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid #F1F5F9',
                      cursor: 'pointer',
                      background: isSel ? `${roleColor}12` : 'transparent',
                      borderLeft: `4px solid ${isSel ? roleColor : 'transparent'}`,
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, background: '#EFF6FF', color: '#1E40AF', fontWeight: 700, borderRadius: 4, padding: '1px 6px' }}>
                        {d.relatedEntityNumber}
                      </span>

                      <span style={{ fontSize: 10, background: sBadge.bg, color: sBadge.color, border: `1px solid ${sBadge.border}`, fontWeight: 700, borderRadius: 100, padding: '1px 8px' }}>
                        {d.status}
                      </span>
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 750, color: '#111827', marginBottom: 6, lineHeight: 1.3 }}>
                      {d.title}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#64748B' }}>
                      <span>By {d.createdBy} ({d.createdByRole})</span>
                      <span>{d.messages.length} posts</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: Discussion Detail */}
        {selectedDiscussion ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
            
            {/* Detail Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #E4E7EC', background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#111827' }}>{selectedDiscussion.title}</h3>
                    <span style={{ fontSize: 11, background: getStatusBadge(selectedDiscussion.status).bg, color: getStatusBadge(selectedDiscussion.status).color, border: `1px solid ${getStatusBadge(selectedDiscussion.status).border}`, fontWeight: 700, borderRadius: 100, padding: '2px 10px' }}>
                      {selectedDiscussion.status}
                    </span>
                    <button
                      onClick={() => handleEntityChipClick(selectedDiscussion.relatedEntityType, selectedDiscussion.relatedEntityNumber)}
                      style={{
                        background: '#EFF6FF',
                        color: '#1E40AF',
                        border: '1px solid #BFDBFE',
                        borderRadius: 100,
                        padding: '2px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      title="Click to view bound record details"
                    >
                      {selectedDiscussion.relatedEntityType}: {selectedDiscussion.relatedEntityNumber} <ExternalLink size={11} />
                    </button>
                  </div>
                </div>

                {!isAuditor && (
                  <button
                    onClick={handleToggleStatus}
                    style={{
                      padding: '6px 12px',
                      background: selectedDiscussion.status === 'Resolved' ? '#FFFBEB' : '#ECFDF5',
                      color: selectedDiscussion.status === 'Resolved' ? '#B45309' : '#047857',
                      border: `1px solid ${selectedDiscussion.status === 'Resolved' ? '#FDE68A' : '#A7F3D0'}`,
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {selectedDiscussion.status === 'Resolved' ? <RotateCcw size={13} /> : <CheckCircle size={13} />}
                    {selectedDiscussion.status === 'Resolved' ? 'Reopen Discussion' : 'Mark Resolved'}
                  </button>
                )}
              </div>

              {/* Participants Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Participants:</span>
                {selectedDiscussion.participants.map((p, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: 11,
                      background: '#F1F5F9',
                      color: '#334155',
                      border: '1px solid #E2E8F0',
                      borderRadius: 100,
                      padding: '2px 8px',
                      fontWeight: 600,
                    }}
                    title={`${p.name} (${p.role})`}
                  >
                    {p.name} · <span style={{ color: roleColor }}>{p.role}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Post Thread */}
            <div style={{ flex: 1, minHeight: 0, padding: '20px 24px', overflowY: 'auto', background: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {selectedDiscussion.messages.map((post, idx) => (
                <div key={post.messageId || idx} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{post.senderName}</span>
                      <span style={{ fontSize: 10, background: '#E2E8F0', color: '#334155', fontWeight: 700, borderRadius: 4, padding: '1px 6px' }}>
                        {post.senderRole}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>
                      {new Date(post.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {post.content}
                  </div>

                  {post.attachmentIds && post.attachmentIds.length > 0 && (
                    <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {post.attachmentIds.map(attId => (
                        <button
                          key={attId}
                          onClick={() =>
                            setPreviewFile({
                              fileId: attId,
                              fileName: 'Revised_Shipment_Plan_PO41.PDF',
                              fileType: 'PDF',
                              fileSizeLabel: '1.4 MB',
                              uploadedBy: post.senderName,
                              uploadedByRole: post.senderRole,
                              uploadedAt: post.timestamp,
                              relatedEntityType: selectedDiscussion.relatedEntityType || 'Purchase Order',
                              relatedEntityNumber: selectedDiscussion.relatedEntityNumber || 'PO-2026-0041',
                              description: 'Revised cold chain transit plan & GPS route checkpoints.',
                            })
                          }
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 10px',
                            background: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            borderRadius: 6,
                            color: '#1E40AF',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          <Paperclip size={12} /> {attId} <FileText size={12} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Reply Composer */}
            {isAuditor ? (
              <div style={{ padding: '14px 20px', background: '#FEF2F2', borderTop: '1px solid #FCA5A5', color: '#991B1B', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <Shield size={16} /> Auditor Access: Read-only mode active. Discussion replies disabled for Audit compliance.
              </div>
            ) : (
              <div style={{ padding: '14px 20px', borderTop: '1px solid #E4E7EC', background: '#fff', flexShrink: 0 }}>
                {replyAttachments.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    {replyAttachments.map((f, i) => (
                      <span key={i} style={{ fontSize: 11, background: '#F1F5F9', padding: '2px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Paperclip size={11} /> {f.fileName}
                        <X size={12} style={{ cursor: 'pointer' }} onClick={() => setReplyAttachments(prev => prev.filter((_, idx) => idx !== i))} />
                      </span>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSendReply} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <textarea
                    rows={2}
                    placeholder="Post a reply to this discussion..."
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    style={{ flex: 1, padding: '10px 14px', fontSize: 13, border: '1px solid #CBD5E1', borderRadius: 8, outline: 'none', resize: 'none', fontFamily: 'inherit' }}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ padding: '10px 12px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: 8, cursor: 'pointer', color: '#475569' }}
                    title="Attach document from device"
                  >
                    <Paperclip size={16} />
                  </button>

                  <button
                    type="submit"
                    style={{
                      padding: '10px 20px',
                      background: roleColor,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Send size={15} /> Post Reply
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>
            Select a discussion from the left list to view thread details.
          </div>
        )}
      </div>

      {/* Start Discussion Dialog */}
      {showStartModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 540, boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Start New Discussion</h3>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setShowStartModal(false)} />
            </div>

            <form onSubmit={handleStartDiscussion} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PO-2026-0041 Delivery Realignment & SLA Terms"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  style={{ width: '100%', padding: 8, fontSize: 12, border: '1px solid #CBD5E1', borderRadius: 6, marginTop: 4 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>
                  Related Business Record <span style={{ color: '#B71C1C' }}>* (Required)</span>
                </label>
                <select
                  required
                  value={newEntityIdx}
                  onChange={e => setNewEntityIdx(e.target.value === '' ? '' : Number(e.target.value))}
                  style={{ width: '100%', padding: 8, fontSize: 12, border: '1px solid #CBD5E1', borderRadius: 6, marginTop: 4 }}
                >
                  {MOCK_ENTITIES.map((ent, idx) => (
                    <option key={idx} value={idx}>
                      {ent.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>Select Stakeholder Participants</label>
                <div style={{ border: '1px solid #CBD5E1', borderRadius: 6, padding: 10, marginTop: 4, maxHeight: 130, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {AVAILABLE_PARTICIPANTS.map(p => (
                    <label key={p.userId} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#334155', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(p.userId)}
                        onChange={e => {
                          if (e.target.checked) setSelectedParticipants(prev => [...prev, p.userId]);
                          else setSelectedParticipants(prev => prev.filter(id => id !== p.userId));
                        }}
                      />
                      <span><b>{p.name}</b> ({p.role})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>Opening Statement / Agenda</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Outline the topic, issue, or objective for this discussion..."
                  value={newOpeningMsg}
                  onChange={e => setNewOpeningMsg(e.target.value)}
                  style={{ width: '100%', padding: 8, fontSize: 12, border: '1px solid #CBD5E1', borderRadius: 6, marginTop: 4 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowStartModal(false)}
                  style={{ padding: '8px 14px', background: '#F1F5F9', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', background: roleColor, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Start Discussion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewFile && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 440, boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileText size={18} color="#1E40AF" /> {previewFile.fileName}
              </h3>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setPreviewFile(null)} />
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div><b>Type:</b> {previewFile.fileType} | <b>Size:</b> {previewFile.fileSizeLabel}</div>
              <div><b>Uploaded By:</b> {previewFile.uploadedBy} ({previewFile.uploadedByRole})</div>
              <div><b>Linked Entity:</b> {previewFile.relatedEntityNumber}</div>
              <div style={{ color: '#475569', marginTop: 4 }}>{previewFile.description}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setPreviewFile(null)}
                style={{ padding: '8px 14px', background: '#F1F5F9', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert(`Downloading ${previewFile.fileName}...`);
                  setPreviewFile(null);
                }}
                style={{ padding: '8px 16px', background: roleColor, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Download size={14} /> Download File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
