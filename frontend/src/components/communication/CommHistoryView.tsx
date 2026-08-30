import React, { useState, useEffect } from 'react';
import { Search, FileText, MessageSquare, MessageCircle, Paperclip, Calendar, User, ArrowRight, ShieldAlert, Filter, Clock } from 'lucide-react';
import { communicationService } from '../../services/communicationService';
import type { Message, Discussion as DiscussionType, SharedFile, CommEntityType } from '../../models/communication';

interface CommHistoryViewProps {
  roleColor: string;
  currentRole: string;
  userName: string;
  onNavigateTab?: (tab: string, entityId?: string) => void;
}

export type TimelineItemType = 'message' | 'discussion' | 'file';

export interface TimelineItem {
  id: string;
  type: TimelineItemType;
  timestamp: string;
  title: string;
  senderName: string;
  senderRole: string;
  content: string;
  relatedEntityType: CommEntityType | null;
  relatedEntityNumber: string | null;
  metadata?: {
    fileType?: string;
    fileSize?: string;
    status?: string;
    conversationId?: string;
    discussionId?: string;
    fileId?: string;
  };
}

export const CommHistoryView: React.FC<CommHistoryViewProps> = ({
  roleColor,
  currentRole,
  userName,
  onNavigateTab,
}) => {
  const isVendor = currentRole === 'Vendor';

  // Toggle mode: 'vendor' vs 'record'
  const [lookupMode, setLookupMode] = useState<'vendor' | 'record'>('record');

  // Options for dropdowns
  const [vendorOptions, setVendorOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [recordOptions, setRecordOptions] = useState<Array<{ number: string; type: CommEntityType }>>([]);

  // Selected values
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [selectedRecord, setSelectedRecord] = useState<string>('PO-2026-0041');

  // Timeline & raw data
  const [rawHistory, setRawHistory] = useState<{
    messages: Message[];
    discussions: DiscussionType[];
    files: SharedFile[];
  }>({ messages: [], discussions: [], files: [] });

  const [filterType, setFilterType] = useState<'All' | 'message' | 'discussion' | 'file'>('All');
  const [timelineSearch, setTimelineSearch] = useState('');

  // Load dropdown options
  useEffect(() => {
    communicationService.getAllLookupVendors().subscribe(list => {
      setVendorOptions(list);
      if (isVendor) {
        // Find matching vendor
        const match = list.find(v => v.name.toLowerCase().includes(userName.toLowerCase()) || userName.toLowerCase().includes(v.name.toLowerCase()));
        if (match) {
          setSelectedVendor(match.name);
          setLookupMode('vendor');
        } else if (list.length > 0) {
          setSelectedVendor(list[0].name);
        }
      } else if (list.length > 0 && !selectedVendor) {
        setSelectedVendor(list[0].name);
      }
    });

    communicationService.getAllLookupRecords().subscribe(recs => {
      setRecordOptions(recs);
    });
  }, [currentRole, userName]);

  // Perform query whenever lookup mode or selection changes
  useEffect(() => {
    const queryKey = lookupMode === 'vendor' ? selectedVendor : selectedRecord;
    if (!queryKey) return;

    communicationService.getCommunicationHistory(queryKey).subscribe(data => {
      setRawHistory(data);
    });
  }, [lookupMode, selectedVendor, selectedRecord]);

  // Combine and sort timeline
  const buildTimelineItems = (): TimelineItem[] => {
    const items: TimelineItem[] = [];

    // Add Direct Messages
    rawHistory.messages.forEach(m => {
      items.push({
        id: m.messageId,
        type: 'message',
        timestamp: m.timestamp,
        title: `Message: ${m.senderName} → ${m.receiverName}`,
        senderName: m.senderName,
        senderRole: m.senderRole,
        content: m.content,
        relatedEntityType: m.relatedEntityType,
        relatedEntityNumber: m.relatedEntityNumber,
        metadata: { conversationId: m.conversationId },
      });
    });

    // Add Discussions and threaded messages
    rawHistory.discussions.forEach(d => {
      // Main discussion creation
      items.push({
        id: d.discussionId,
        type: 'discussion',
        timestamp: d.createdAt,
        title: `Discussion Started: "${d.title}"`,
        senderName: d.createdBy,
        senderRole: d.createdByRole,
        content: d.messages[0]?.content || 'Thread initialized.',
        relatedEntityType: d.relatedEntityType,
        relatedEntityNumber: d.relatedEntityNumber,
        metadata: { status: d.status, discussionId: d.discussionId },
      });

      // Replies
      d.messages.slice(1).forEach(m => {
        items.push({
          id: m.messageId,
          type: 'discussion',
          timestamp: m.timestamp,
          title: `Discussion Reply on "${d.title}"`,
          senderName: m.senderName,
          senderRole: m.senderRole,
          content: m.content,
          relatedEntityType: d.relatedEntityType,
          relatedEntityNumber: d.relatedEntityNumber,
          metadata: { status: d.status, discussionId: d.discussionId },
        });
      });
    });

    // Add Shared Files
    rawHistory.files.forEach(f => {
      items.push({
        id: f.fileId,
        type: 'file',
        timestamp: f.uploadedAt,
        title: `Document Uploaded: ${f.fileName}`,
        senderName: f.uploadedBy,
        senderRole: f.uploadedByRole,
        content: f.description || `Shared ${f.fileType} file (${f.fileSizeLabel})`,
        relatedEntityType: f.relatedEntityType,
        relatedEntityNumber: f.relatedEntityNumber,
        metadata: { fileType: f.fileType, fileSize: f.fileSizeLabel, fileId: f.fileId },
      });
    });

    // Sort chronologically descending (newest first)
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return items;
  };

  const timeline = buildTimelineItems().filter(item => {
    if (filterType !== 'All' && item.type !== filterType) return false;
    if (timelineSearch) {
      const q = timelineSearch.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        item.senderName.toLowerCase().includes(q) ||
        (item.relatedEntityNumber && item.relatedEntityNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Calculate top KPI stats
  const totalMessages = rawHistory.messages.length;
  const totalDiscussions = rawHistory.discussions.length;
  const filesExchanged = rawHistory.files.length;
  
  const allTimestamps = [
    ...rawHistory.messages.map(m => m.timestamp),
    ...rawHistory.discussions.map(d => d.createdAt),
    ...rawHistory.files.map(f => f.uploadedAt),
  ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const lastContactDate = allTimestamps.length > 0 ? new Date(allTimestamps[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>Communication Audit & Dispute History</h2>
          {(currentRole === 'Auditor' || currentRole === 'Administrator') && (
            <span style={{ padding: '3px 10px', borderRadius: 100, background: `${roleColor}15`, color: roleColor, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <ShieldAlert size={12} /> Read-Only Dispute Audit Mode
            </span>
          )}
        </div>
        <p style={{ fontSize: 13, color: '#667085', margin: '4px 0 0 0' }}>
          Unified chronological audit trail aggregating direct messages, multi-stakeholder discussions, and file transfers.
        </p>
      </div>

      {/* Lookup Controls Header Card */}
      <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Toggle buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Lookup Mode:</span>
            <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 8, padding: 3 }}>
              <button
                disabled={isVendor}
                onClick={() => setLookupMode('record')}
                style={{
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: 6,
                  background: lookupMode === 'record' ? '#fff' : 'transparent',
                  color: lookupMode === 'record' ? roleColor : '#667085',
                  boxShadow: lookupMode === 'record' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: isVendor ? 'not-allowed' : 'pointer',
                }}
              >
                By Record (PO/Contract/PR/INV)
              </button>
              <button
                onClick={() => setLookupMode('vendor')}
                style={{
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: 6,
                  background: lookupMode === 'vendor' ? '#fff' : 'transparent',
                  color: lookupMode === 'vendor' ? roleColor : '#667085',
                  boxShadow: lookupMode === 'vendor' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer',
                }}
              >
                By Vendor Profile
              </button>
            </div>
          </div>

          {/* Search Dropdowns */}
          <div style={{ display: 'flex', gap: 12, flex: 1, maxWidth: 500 }}>
            {lookupMode === 'record' ? (
              <div style={{ flex: 1 }}>
                <select
                  value={selectedRecord}
                  onChange={e => setSelectedRecord(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: 13,
                    fontWeight: 600,
                    border: '1px solid #E4E7EC',
                    borderRadius: 8,
                    outline: 'none',
                    background: '#fff',
                  }}
                >
                  <option value="">-- Select Record Number --</option>
                  {recordOptions.map(r => (
                    <option key={r.number} value={r.number}>
                      {r.number} ({r.type})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div style={{ flex: 1 }}>
                <select
                  disabled={isVendor}
                  value={selectedVendor}
                  onChange={e => setSelectedVendor(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: 13,
                    fontWeight: 600,
                    border: '1px solid #E4E7EC',
                    borderRadius: 8,
                    outline: 'none',
                    background: isVendor ? '#F8FAFC' : '#fff',
                  }}
                >
                  <option value="">-- Select Vendor --</option>
                  {vendorOptions.map(v => (
                    <option key={v.id} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#667085', textTransform: 'uppercase', marginBottom: 6 }}>Total Messages</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>{totalMessages}</div>
          <div style={{ fontSize: 11, color: '#1565C0', fontWeight: 600, marginTop: 4 }}>Direct dialogue exchanges</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#667085', textTransform: 'uppercase', marginBottom: 6 }}>Total Discussions</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>{totalDiscussions}</div>
          <div style={{ fontSize: 11, color: '#6A1B9A', fontWeight: 600, marginTop: 4 }}>Multi-party threads</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#667085', textTransform: 'uppercase', marginBottom: 6 }}>Files Exchanged</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>{filesExchanged}</div>
          <div style={{ fontSize: 11, color: '#2E7D32', fontWeight: 600, marginTop: 4 }}>Attached specs & logs</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#667085', textTransform: 'uppercase', marginBottom: 6 }}>Last Contact Date</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>{lastContactDate}</div>
          <div style={{ fontSize: 11, color: '#667085', fontWeight: 600, marginTop: 4 }}>Most recent event</div>
        </div>
      </div>

      {/* Filter and Timeline Container */}
      <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, padding: 20 }}>
        {/* Sub-header Filter Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['All', 'message', 'discussion', 'file'] as const).map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 6,
                  border: '1px solid #E4E7EC',
                  background: filterType === t ? roleColor : '#fff',
                  color: filterType === t ? '#fff' : '#374151',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {t === 'All' ? 'All Types' : `${t}s`}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: 280 }}>
            <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: 10 }} />
            <input
              type="text"
              placeholder="Search timeline content..."
              value={timelineSearch}
              onChange={e => setTimelineSearch(e.target.value)}
              style={{ width: '100%', padding: '7px 12px 7px 32px', fontSize: 12, border: '1px solid #E4E7EC', borderRadius: 6, outline: 'none' }}
            />
          </div>
        </div>

        {/* Vertical Timeline */}
        {timeline.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF' }}>
            <Clock size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.5 }} />
            <div style={{ fontSize: 14, fontWeight: 700 }}>No communication activity found</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Try selecting a different record or clearing search filters.</div>
          </div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: 24 }}>
            {/* Timeline Line */}
            <div style={{ position: 'absolute', left: 11, top: 10, bottom: 10, width: 2, background: '#E4E7EC' }} />

            {timeline.map((item, idx) => {
              const itemDate = new Date(item.timestamp).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={item.id + '_' + idx} style={{ position: 'relative', marginBottom: 24, paddingLeft: 14 }}>
                  {/* Timeline Dot Icon */}
                  <div
                    style={{
                      position: 'absolute',
                      left: -24,
                      top: 2,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: item.type === 'message' ? '#1565C0' : item.type === 'discussion' ? '#6A1B9A' : '#2E7D32',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      boxShadow: '0 0 0 4px #fff',
                    }}
                  >
                    {item.type === 'message' && <MessageSquare size={12} />}
                    {item.type === 'discussion' && <MessageCircle size={12} />}
                    {item.type === 'file' && <Paperclip size={12} />}
                  </div>

                  {/* Card Content */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E4E7EC', borderRadius: 10, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              background: item.type === 'message' ? '#EFF6FF' : item.type === 'discussion' ? '#F3E8FF' : '#E8F5E9',
                              color: item.type === 'message' ? '#1E40AF' : item.type === 'discussion' ? '#6B21A8' : '#166534',
                            }}
                          >
                            {item.type}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>{item.title}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#667085', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <User size={12} color="#9CA3AF" />
                          <b>{item.senderName}</b>
                          <span style={{ padding: '1px 6px', borderRadius: 4, background: '#E2E8F0', fontSize: 10 }}>{item.senderRole}</span>
                          {item.relatedEntityNumber && (
                            <>
                              <span>•</span>
                              <span style={{ fontWeight: 700, color: '#1565C0' }}>{item.relatedEntityNumber}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} />
                        {itemDate}
                      </div>
                    </div>

                    <div style={{ fontSize: 12, color: '#374151', margin: '10px 0 12px 0', lineHeight: 1.5, background: '#fff', padding: 10, borderRadius: 6, border: '1px solid #E2E8F0' }}>
                      {item.content}
                    </div>

                    {/* View Link / Deep Link */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => {
                          if (onNavigateTab) {
                            if (item.type === 'message') onNavigateTab('comm-messages');
                            else if (item.type === 'discussion') onNavigateTab('comm-discussions');
                            else if (item.type === 'file') onNavigateTab('comm-files');
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: roleColor,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        View Details <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
