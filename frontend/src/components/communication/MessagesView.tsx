import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Send, Paperclip, CheckCheck, Plus, X, FileText, Download,
  Building2, User, ExternalLink, Shield, AlertCircle, Filter
} from 'lucide-react';
import { communicationService } from '../../services/communicationService';
import type { Conversation, Message, SharedFile, SharedFileType, CommEntityType } from '../../models/communication';

// Existing mock data references for related entity dropdown
const MOCK_ENTITIES = [
  { type: 'Purchase Order' as CommEntityType, number: 'PO-2026-0042', label: 'PO-2026-0042 (Workstation Hardware)' },
  { type: 'Purchase Order' as CommEntityType, number: 'PO-2026-0041', label: 'PO-2026-0041 (Reefer Cold Chain)' },
  { type: 'Purchase Order' as CommEntityType, number: 'PO-2026-0040', label: 'PO-2026-0040 (Heavy Equipment)' },
  { type: 'Contract' as CommEntityType, number: 'CT-2026-0001', label: 'CT-2026-0001 (TechCorp Master Service Agreement)' },
  { type: 'Contract' as CommEntityType, number: 'CT-2026-0003', label: 'CT-2026-0003 (Zenith Supply Contract)' },
  { type: 'Contract' as CommEntityType, number: 'CT-2026-0004', label: 'CT-2026-0004 (NovaSec Security Retainer)' },
  { type: 'Procurement Request' as CommEntityType, number: 'PR-2026-0003', label: 'PR-2026-0003 (Warehouse C Civil Repair)' },
  { type: 'Procurement Request' as CommEntityType, number: 'PR-2026-0007', label: 'PR-2026-0007 (OHSAS Safety Audit)' },
  { type: 'Invoice' as CommEntityType, number: 'TX-2026-891', label: 'TX-2026-891 (Forklift Procurement Invoice)' },
];

const MOCK_RECIPIENTS = [
  { id: 'VND-001', name: 'TechCorp Solutions Pvt Ltd', role: 'Vendor' },
  { id: 'VND-002', name: 'Global Logistics & Freight', role: 'Vendor' },
  { id: 'VND-005', name: 'EquipMax Machinery Ltd', role: 'Vendor' },
  { id: 'VND-009', name: 'NovaSec Systems Pvt Ltd', role: 'Vendor' },
  { id: 'VND-004', name: 'Zenith Office Supplies', role: 'Vendor' },
  { id: 'VND-010', name: 'SafeGuard Industries', role: 'Vendor' },
  { id: 'USR-001', name: 'Hrithik', role: 'Administrator' },
  { id: 'USR-002', name: 'Rohan Verma', role: 'Procurement Manager' },
  { id: 'USR-003', name: 'Lata Nair', role: 'Finance Officer' },
  { id: 'USR-004', name: 'Supply Chain Lead', role: 'Supply Chain Manager' },
];

interface MessagesViewProps {
  roleColor: string;
  currentRole: string;
  userName: string;
  onNavigateTab?: (tab: string, entityId?: string) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  roleColor,
  currentRole,
  userName,
  onNavigateTab,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Unread'>('All');
  const [entityFilter, setEntityFilter] = useState<string>('All');
  const [isComposing, setIsComposing] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<SharedFile[]>([]);
  const [previewFile, setPreviewFile] = useState<SharedFile | null>(null);

  // New Conversation Modal State
  const [showNewConvModal, setShowNewConvModal] = useState(false);
  const [newRecipientId, setNewRecipientId] = useState(MOCK_RECIPIENTS[0].id);
  const [newEntityIndex, setNewEntityIndex] = useState<number | ''>('');
  const [newSubject, setNewSubject] = useState('');
  const [newInitialMsg, setNewInitialMsg] = useState('');

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAuditor = currentRole === 'Auditor';

  const mapExtToType = (ext: string): SharedFileType => {
    if (['XLS', 'XLSX', 'CSV'].includes(ext)) return 'Excel';
    if (['DOC', 'DOCX', 'TXT'].includes(ext)) return 'Word';
    if (['PNG', 'JPG', 'JPEG', 'GIF', 'SVG', 'WEBP'].includes(ext)) return 'Image';
    if (['ZIP', 'RAR', '7Z', 'TAR', 'GZ'].includes(ext)) return 'ZIP';
    return 'PDF';
  };

  const handleFileAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedConv) return;
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
        relatedEntityType: selectedConv.relatedEntityType || 'Purchase Order',
        relatedEntityNumber: selectedConv.relatedEntityNumber || 'PO-2026-0042',
        description: `Attached document: ${file.name}`,
      };
      setAttachedFiles(prev => [...prev, newFile]);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    loadConversations();
  }, [searchTerm, statusFilter, entityFilter, currentRole]);

  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv.conversationId);
    }
  }, [selectedConv?.conversationId]);

  const loadConversations = () => {
    communicationService.getConversations({ search: searchTerm }).subscribe(data => {
      let filtered = [...data];

      // Role isolation rule
      if (currentRole === 'Vendor') {
        filtered = filtered.filter(c => c.vendorConversation);
      } else if (currentRole !== 'Administrator') {
        filtered = filtered.filter(c =>
          c.participants.some(p => p.userName === userName || p.userRole === currentRole)
        );
      }

      // Unread filter
      if (statusFilter === 'Unread') {
        filtered = filtered.filter(c => c.unreadCount > 0);
      }

      // Entity filter
      if (entityFilter !== 'All') {
        filtered = filtered.filter(c => c.relatedEntityType === entityFilter);
      }

      // Sort by lastMessageTime descending
      filtered.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

      setConversations(filtered);

      if (filtered.length > 0 && (!selectedConv || !filtered.some(c => c.conversationId === selectedConv.conversationId))) {
        selectConversation(filtered[0]);
      }
    });
  };

  const loadMessages = (convId: string) => {
    communicationService.getMessages(convId, 'USR-001').subscribe(msgs => {
      setMessages(msgs);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
  };

  const selectConversation = (conv: Conversation) => {
    setSelectedConv(conv);
    communicationService.markConversationRead(conv.conversationId).subscribe(() => {
      setConversations(prev =>
        prev.map(c => (c.conversationId === conv.conversationId ? { ...c, unreadCount: 0 } : c))
      );
    });
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isAuditor || (!newMessage.trim() && attachedFiles.length === 0) || !selectedConv) return;

    const attachmentIds = attachedFiles.map(f => f.fileId);
    const contentToSend = newMessage || (attachedFiles.length > 0 ? `[Attached ${attachedFiles.length} file(s): ${attachedFiles.map(f => f.fileName).join(', ')}]` : '');
    setNewMessage('');
    setAttachedFiles([]);

    communicationService
      .sendMessage(selectedConv.conversationId, 'USR-001', userName, currentRole, contentToSend, attachmentIds)
      .subscribe(msg => {
        setMessages(prev => [...prev, msg]);
        loadConversations();
        setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCreateNewConversation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newInitialMsg.trim()) return;

    const recipient = MOCK_RECIPIENTS.find(r => r.id === newRecipientId) || MOCK_RECIPIENTS[0];
    const selectedEntity = newEntityIndex !== '' ? MOCK_ENTITIES[newEntityIndex as number] : null;

    const participants = [
      { userId: 'USR-001', userName, userRole: currentRole },
      { userId: recipient.id, userName: recipient.name, userRole: recipient.role },
    ];

    communicationService
      .startConversation(
        newSubject,
        selectedEntity?.type || null,
        selectedEntity?.number || null,
        participants,
        newInitialMsg
      )
      .subscribe(newConv => {
        setShowNewConvModal(false);
        setNewSubject('');
        setNewInitialMsg('');
        setNewEntityIndex('');
        loadConversations();
        selectConversation(newConv);
      });
  };

  const handleEntityChipClick = (type: CommEntityType | null, number: string | null) => {
    if (!onNavigateTab || !type || !number) return;
    if (type === 'Purchase Order') onNavigateTab('purchase-orders', number);
    else if (type === 'Contract') onNavigateTab('cc-repository', number);
    else if (type === 'Procurement Request') onNavigateTab('proc-requests', number);
    else if (type === 'Invoice') onNavigateTab('proc-invoices', number);
    else if (type === 'Vendor') onNavigateTab('vendors', number);
  };

  const formatRelativeTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24));
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((acc: { dateLabel: string; msgs: Message[] }[], msg) => {
    const dateStr = new Date(msg.timestamp).toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const lastGroup = acc[acc.length - 1];
    if (lastGroup && lastGroup.dateLabel === dateStr) {
      lastGroup.msgs.push(msg);
    } else {
      acc.push({ dateLabel: dateStr, msgs: [msg] });
    }
    return acc;
  }, []);

  const otherParticipant = selectedConv?.participants.find(p => p.userName !== userName) || selectedConv?.participants[0];

  return (
    <div style={{ padding: '24px 28px', height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}>
      {/* Hidden File Input for individual attachments */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileAttachmentSelect}
        style={{ display: 'none' }}
        multiple
      />

      {/* Page Title & Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>Vendor & Internal Messaging</h2>
          <p style={{ fontSize: 13, color: '#667085', margin: '4px 0 0 0' }}>
            Direct messaging channel linked to POs, contracts, invoices, and supplier inquiries.
          </p>
        </div>
        {!isAuditor && (
          <button
            onClick={() => setShowNewConvModal(true)}
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
            <Plus size={15} /> New Message
          </button>
        )}
      </div>

      {/* Main Dual-Pane Workspace */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '360px 1fr', background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        
        {/* LEFT PANE: Conversation List */}
        <div style={{ borderRight: '1px solid #E4E7EC', display: 'flex', flexDirection: 'column', minHeight: 0, background: '#F8FAFC' }}>
          
          {/* Search & Filters */}
          <div style={{ padding: 14, borderBottom: '1px solid #E4E7EC', background: '#fff', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: 10 }} />
              <input
                type="text"
                placeholder="Search conversations, subject, or contacts..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '6px 10px 6px 32px', fontSize: 12, border: '1px solid #E4E7EC', borderRadius: 6, outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
              {(['All', 'Unread'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  style={{
                    padding: '3px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 100,
                    border: '1px solid #E4E7EC',
                    background: statusFilter === f ? roleColor : '#F1F5F9',
                    color: statusFilter === f ? '#fff' : '#475569',
                    cursor: 'pointer',
                  }}
                >
                  {f}
                </button>
              ))}

              <select
                value={entityFilter}
                onChange={e => setEntityFilter(e.target.value)}
                style={{ padding: '3px 8px', fontSize: 11, fontWeight: 600, borderRadius: 100, border: '1px solid #E4E7EC', background: '#F1F5F9', color: '#475569', cursor: 'pointer', outline: 'none' }}
              >
                <option value="All">All Types</option>
                <option value="Purchase Order">POs</option>
                <option value="Contract">Contracts</option>
                <option value="Procurement Request">Requests</option>
                <option value="Invoice">Invoices</option>
              </select>
            </div>
          </div>

          {/* Conversations List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>No conversations found</div>
            ) : (
              conversations.map(c => {
                const isSel = selectedConv?.conversationId === c.conversationId;
                const other = c.participants.find(p => p.userName !== userName) || c.participants[0];
                return (
                  <div
                    key={c.conversationId}
                    onClick={() => selectConversation(c)}
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid #F1F5F9',
                      cursor: 'pointer',
                      background: isSel ? `${roleColor}12` : 'transparent',
                      borderLeft: `4px solid ${isSel ? roleColor : 'transparent'}`,
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 750, color: '#111827' }}>{other.userName}</span>
                        <span style={{ fontSize: 10, background: '#E2E8F0', color: '#475569', borderRadius: 4, padding: '1px 5px', fontWeight: 600 }}>
                          {other.userRole}
                        </span>
                      </div>
                      <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 500 }}>
                        {formatRelativeTime(c.lastMessageTime)}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.subject}
                    </div>

                    <div style={{ fontSize: 11, color: '#64748B', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.lastMessagePreview}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {c.relatedEntityNumber ? (
                        <span style={{ fontSize: 10, background: '#EFF6FF', color: '#1D4ED8', fontWeight: 700, borderRadius: 4, padding: '1px 6px' }}>
                          {c.relatedEntityNumber}
                        </span>
                      ) : <span />}

                      {c.unreadCount > 0 && (
                        <span style={{ background: '#B71C1C', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 100, padding: '1px 7px' }}>
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: Active Chat Thread */}
        {selectedConv ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            {/* Header */}
            <div style={{ padding: '14px 24px', borderBottom: '1px solid #E4E7EC', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#111827' }}>{selectedConv.subject}</h3>
                  {selectedConv.relatedEntityNumber && (
                    <button
                      onClick={() => handleEntityChipClick(selectedConv.relatedEntityType, selectedConv.relatedEntityNumber)}
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
                      title={`Click to navigate to ${selectedConv.relatedEntityType} details`}
                    >
                      {selectedConv.relatedEntityType}: {selectedConv.relatedEntityNumber} <ExternalLink size={11} />
                    </button>
                  )}
                </div>
                <span style={{ fontSize: 11, color: '#64748B', marginTop: 2, display: 'inline-block' }}>
                  Conversation between <b>{selectedConv.participants.map(p => `${p.userName} (${p.userRole})`).join(', ')}</b>
                </span>
              </div>
            </div>

            {/* Message Thread */}
            <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto', background: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {groupedMessages.map((group, gIdx) => (
                <React.Fragment key={gIdx}>
                  {/* Date Separator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
                    <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {group.dateLabel}
                    </span>
                    <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
                  </div>

                  {/* Messages in Group */}
                  {group.msgs.map(m => {
                    const isMe = m.senderRole === currentRole || m.senderName === userName;
                    return (
                      <div key={m.messageId} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '72%' }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#64748B', marginBottom: 3, textAlign: isMe ? 'right' : 'left' }}>
                          {m.senderName} <span style={{ fontSize: 9, color: '#94A3B8' }}>({m.senderRole})</span>
                        </div>

                        <div
                          style={{
                            padding: '12px 16px',
                            borderRadius: 14,
                            background: isMe ? roleColor : '#fff',
                            color: isMe ? '#fff' : '#0F172A',
                            border: isMe ? 'none' : '1px solid #E2E8F0',
                            fontSize: 13,
                            lineHeight: 1.5,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            wordBreak: 'break-word',
                          }}
                        >
                          {m.content}

                          {/* Message Attachments */}
                          {m.attachmentIds && m.attachmentIds.length > 0 && (
                            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {m.attachmentIds.map(attId => (
                                <button
                                  key={attId}
                                  onClick={() =>
                                    setPreviewFile({
                                      fileId: attId,
                                      fileName: attId === 'FILE-001' ? 'TechCorp_SpecSheet.pdf' : attId === 'FILE-002' ? 'Benchmark_Report.pdf' : 'Attachment_Doc.PDF',
                                      fileType: 'PDF',
                                      fileSizeLabel: '1.8 MB',
                                      uploadedBy: m.senderName,
                                      uploadedByRole: m.senderRole,
                                      uploadedAt: m.timestamp,
                                      relatedEntityType: m.relatedEntityType || 'Purchase Order',
                                      relatedEntityNumber: m.relatedEntityNumber || 'PO-2026-0042',
                                      description: 'Attached document sent during message thread.',
                                    })
                                  }
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '4px 10px',
                                    borderRadius: 6,
                                    background: isMe ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                                    color: isMe ? '#fff' : '#1E293B',
                                    border: 'none',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Paperclip size={12} /> {attId} <FileText size={12} />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 3, textAlign: isMe ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: 4, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                          <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMe && <CheckCheck size={13} color={m.readStatus ? '#3B82F6' : '#94A3B8'} />}
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
              <div ref={chatBottomRef} />
            </div>

            {/* Composer Bar */}
            {isAuditor ? (
              <div style={{ padding: '14px 20px', background: '#FEF2F2', borderTop: '1px solid #FCA5A5', color: '#991B1B', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={16} /> Auditor Access: Read-only mode active. Messaging is disabled for Audit compliance.
              </div>
            ) : (
              <div style={{ padding: '14px 20px', borderTop: '1px solid #E4E7EC', background: '#fff' }}>
                {attachedFiles.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                    {attachedFiles.map((f, i) => (
                      <span key={i} style={{ fontSize: 11, background: '#F1F5F9', color: '#334155', padding: '2px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Paperclip size={11} /> {f.fileName}
                        <X size={12} style={{ cursor: 'pointer' }} onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))} />
                      </span>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSend} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <textarea
                    rows={2}
                    placeholder="Type a message (Enter to send, Shift+Enter for newline)..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={() => setIsComposing(false)}
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
                    <Send size={15} /> Send
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>
            Select a conversation from the left list to open the chat thread.
          </div>
        )}
      </div>

      {/* New Conversation Dialog */}
      {showNewConvModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 520, boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Start New Conversation</h3>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setShowNewConvModal(false)} />
            </div>

            <form onSubmit={handleCreateNewConversation} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>Recipient</label>
                <select
                  value={newRecipientId}
                  onChange={e => setNewRecipientId(e.target.value)}
                  style={{ width: '100%', padding: 8, fontSize: 12, border: '1px solid #CBD5E1', borderRadius: 6, marginTop: 4 }}
                >
                  {MOCK_RECIPIENTS.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>Related Business Entity (Optional)</label>
                <select
                  value={newEntityIndex}
                  onChange={e => setNewEntityIndex(e.target.value === '' ? '' : Number(e.target.value))}
                  style={{ width: '100%', padding: 8, fontSize: 12, border: '1px solid #CBD5E1', borderRadius: 6, marginTop: 4 }}
                >
                  <option value="">-- None --</option>
                  {MOCK_ENTITIES.map((ent, idx) => (
                    <option key={idx} value={idx}>
                      {ent.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clarification on Delivery SLA for PO-2026-0042"
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  style={{ width: '100%', padding: 8, fontSize: 12, border: '1px solid #CBD5E1', borderRadius: 6, marginTop: 4 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>Initial Message</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Type your initial message to recipient..."
                  value={newInitialMsg}
                  onChange={e => setNewInitialMsg(e.target.value)}
                  style={{ width: '100%', padding: 8, fontSize: 12, border: '1px solid #CBD5E1', borderRadius: 6, marginTop: 4 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowNewConvModal(false)}
                  style={{ padding: '8px 14px', background: '#F1F5F9', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', background: roleColor, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Start Conversation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Attachment Preview Modal */}
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
