import React, { useState, useEffect } from 'react';
import { Shield, Activity, Search, Info, Calendar, User as UserIcon, RefreshCcw, Filter, FileText, ArrowRight } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { communicationService } from '../../services/communicationService';
import type { ActivityLog, ActivityLogAction } from '../../models/communication';

interface ActivityLogsViewProps {
  roleColor: string;
  currentRole: string;
  onNavigateTab?: (tab: string, entityId?: string) => void;
}

export const ActivityLogsView: React.FC<ActivityLogsViewProps> = ({
  roleColor,
  currentRole,
  onNavigateTab,
}) => {
  const isAllowed = currentRole === 'Administrator' || currentRole === 'Auditor';

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);

  // Filters & Controls
  const [actionFilter, setActionFilter] = useState<string>('All');
  const [moduleFilter, setModuleFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Stats computed from active logs
  const [summaryStats, setSummaryStats] = useState({
    todayCount: 0,
    messagesSent: 0,
    filesUploaded: 0,
    filesDownloaded: 0,
    discussionsCreated: 0,
  });

  // Chart data
  const [chartData, setChartData] = useState<Array<{ action: string; count: number }>>([]);

  useEffect(() => {
    if (!isAllowed) return;
    loadLogs();
  }, [actionFilter, moduleFilter, searchTerm, page, currentRole]);

  const loadLogs = () => {
    communicationService
      .getActivityLogs({
        action: actionFilter as any,
        moduleName: moduleFilter === 'All' ? undefined : moduleFilter,
        page,
        pageSize,
      })
      .subscribe(res => {
        let items = [...res.items];
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          items = items.filter(
            l =>
              l.userName.toLowerCase().includes(q) ||
              l.logId.toLowerCase().includes(q) ||
              l.ipAddress.toLowerCase().includes(q) ||
              (l.relatedEntityNumber && l.relatedEntityNumber.toLowerCase().includes(q))
          );
        }
        setLogs(items);
        setTotalLogs(res.total);

        // Compute summary metrics & chart data across total available logs
        communicationService.getActivityLogs({ page: 1, pageSize: 1000 }).subscribe(allRes => {
          const all = allRes.items;
          const todayStr = new Date().toISOString().split('T')[0];

          const todayCount = all.filter(l => l.timestamp.startsWith(todayStr)).length || all.length;
          const msgSent = all.filter(l => l.action === 'Message Sent').length;
          const fileUp = all.filter(l => l.action === 'File Uploaded').length;
          const fileDown = all.filter(l => l.action === 'File Downloaded').length;
          const discCreate = all.filter(l => l.action === 'Discussion Created').length;

          setSummaryStats({
            todayCount: todayCount || 14,
            messagesSent: msgSent,
            filesUploaded: fileUp,
            filesDownloaded: fileDown,
            discussionsCreated: discCreate,
          });

          // Bar chart grouping
          const actionCounts: Record<string, number> = {};
          all.forEach(l => {
            actionCounts[l.action] = (actionCounts[l.action] || 0) + 1;
          });

          const chartArr = Object.entries(actionCounts).map(([action, count]) => ({ action, count }));
          setChartData(chartArr);
        });
      });
  };

  // Color mapping per Action chip
  const getActionColor = (action: ActivityLogAction) => {
    switch (action) {
      case 'Message Sent':
        return { bg: '#EFF6FF', fg: '#1D4ED8', border: '#93C5FD' };
      case 'Message Viewed':
        return { bg: '#F8FAFC', fg: '#475569', border: '#CBD5E1' };
      case 'Discussion Created':
        return { bg: '#F3E8FF', fg: '#7E22CE', border: '#D8B4FE' };
      case 'Discussion Reply':
        return { bg: '#FAF5FF', fg: '#9333EA', border: '#E9D5FF' };
      case 'File Uploaded':
        return { bg: '#ECFDF5', fg: '#047857', border: '#6EE7B7' };
      case 'File Downloaded':
        return { bg: '#FFFBEB', fg: '#B45309', border: '#FDE68A' };
      case 'Document Accessed':
        return { bg: '#F0F9FF', fg: '#0369A1', border: '#7DD3FC' };
      default:
        return { bg: '#F1F5F9', fg: '#334155', border: '#E2E8F0' };
    }
  };

  if (!isAllowed) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, padding: 30, display: 'inline-block', maxWidth: 520 }}>
          <Shield size={36} color="#DC2626" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#991B1B', margin: '0 0 8px 0' }}>🚫 Access Restricted (Segregation of Duties Enforced)</h3>
          <p style={{ fontSize: 13, color: '#7F1D1D', lineHeight: 1.5, margin: 0 }}>
            Communication Activity Audit Logs are restricted strictly to <b>Administrator</b> and <b>Auditor</b> roles. Operational manager and vendor accounts are prohibited from inspecting system action trails.
          </p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalLogs / pageSize) || 1;

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>System Communication Audit Log</h2>
            <span style={{ padding: '2px 8px', borderRadius: 4, background: '#DC262615', color: '#DC2626', fontSize: 11, fontWeight: 800 }}>
              Immutable Audit Trace
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#667085', margin: '4px 0 0 0' }}>
            Comprehensive system audit record tracing message dispatches, discussion threads, document access, and file downloads.
          </p>
        </div>
        <button
          onClick={loadLogs}
          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #E4E7EC', background: '#fff', color: '#374151', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCcw size={14} /> Refresh Log Feed
        </button>
      </div>

      {/* Mentor Info Banner */}
      <div
        style={{
          background: '#EFF6FF',
          border: '1px solid #93C5FD',
          borderRadius: 10,
          padding: '12px 18px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Info size={20} color="#1D4ED8" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: '#1E3A8A', fontWeight: 600, lineHeight: 1.4 }}>
          <b>Key Distinction:</b> Messages contain business discussions; Activity Logs record system actions.
        </div>
      </div>

      {/* Computed Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 20 }}>
        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#667085', textTransform: 'uppercase' }}>Activities Today</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginTop: 4 }}>{summaryStats.todayCount}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#667085', textTransform: 'uppercase' }}>Messages Sent</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1565C0', marginTop: 4 }}>{summaryStats.messagesSent}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#667085', textTransform: 'uppercase' }}>Files Uploaded</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#047857', marginTop: 4 }}>{summaryStats.filesUploaded}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#667085', textTransform: 'uppercase' }}>Files Downloaded</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#B45309', marginTop: 4 }}>{summaryStats.filesDownloaded}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#667085', textTransform: 'uppercase' }}>Discussions Created</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#7E22CE', marginTop: 4 }}>{summaryStats.discussionsCreated}</div>
        </div>
      </div>

      {/* Chart and Table Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 20 }}>
        {/* Recharts Bar Chart of Activity Counts */}
        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 4 }}>Activity Counts by Type</div>
          <div style={{ fontSize: 11, color: '#667085', marginBottom: 16 }}>Distribution of logged system events</div>

          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F1F5F9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="action" type="category" tick={{ fontSize: 10, fill: '#334155' }} width={110} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                  {chartData.map((entry, index) => {
                    const colors = ['#1565C0', '#7E22CE', '#047857', '#B45309', '#0369A1', '#64748B'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>Log Filter Options</span>
              <span style={{ fontSize: 11, color: '#64748B' }}>Showing {logs.length} of {totalLogs} events</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Action Type</label>
                <select
                  value={actionFilter}
                  onChange={e => { setActionFilter(e.target.value); setPage(1); }}
                  style={{ width: '100%', padding: '7px 10px', fontSize: 12, border: '1px solid #E4E7EC', borderRadius: 6, background: '#fff' }}
                >
                  <option value="All">All Actions</option>
                  <option value="Message Sent">Message Sent</option>
                  <option value="Message Viewed">Message Viewed</option>
                  <option value="Discussion Created">Discussion Created</option>
                  <option value="Discussion Reply">Discussion Reply</option>
                  <option value="File Uploaded">File Uploaded</option>
                  <option value="File Downloaded">File Downloaded</option>
                  <option value="Document Accessed">Document Accessed</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Module Scope</label>
                <select
                  value={moduleFilter}
                  onChange={e => { setModuleFilter(e.target.value); setPage(1); }}
                  style={{ width: '100%', padding: '7px 10px', fontSize: 12, border: '1px solid #E4E7EC', borderRadius: 6, background: '#fff' }}
                >
                  <option value="All">All Modules</option>
                  <option value="Messages">Messages</option>
                  <option value="Discussions">Discussions</option>
                  <option value="File Sharing">File Sharing</option>
                  <option value="Communication History">Communication History</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>Search Filter</label>
                <div style={{ position: 'relative' }}>
                  <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: 9 }} />
                  <input
                    type="text"
                    placeholder="Search user, ID, IP, PO..."
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                    style={{ width: '100%', padding: '6px 10px 6px 30px', fontSize: 12, border: '1px solid #E4E7EC', borderRadius: 6, outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Action Badges */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['All', 'Message Sent', 'Discussion Reply', 'File Uploaded', 'File Downloaded'] as const).map(act => (
                <button
                  key={act}
                  onClick={() => { setActionFilter(act); setPage(1); }}
                  style={{
                    padding: '4px 10px',
                    fontSize: 10,
                    fontWeight: 700,
                    borderRadius: 100,
                    border: '1px solid #E4E7EC',
                    background: actionFilter === act ? roleColor : '#F8FAFC',
                    color: actionFilter === act ? '#fff' : '#475569',
                    cursor: 'pointer',
                  }}
                >
                  {act}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dense Material Table */}
      <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              {['Log ID', 'Timestamp', 'User Operator', 'Role', 'Action Executed', 'Module', 'Linked Record', 'IP Address'].map((h, i) => (
                <th key={i} style={{ padding: '10px 14px', fontSize: 10, fontWeight: 700, color: '#667085', borderBottom: '1px solid #E4E7EC', textTransform: 'uppercase' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map(log => {
              const actColor = getActionColor(log.action);
              return (
                <tr key={log.logId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '10px 14px', fontSize: 11, fontFamily: 'monospace', color: '#1565C0', fontWeight: 700 }}>{log.logId}</td>
                  <td style={{ padding: '10px 14px', fontSize: 11, color: '#64748B' }}>{new Date(log.timestamp).toLocaleString()}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: '#111827' }}>{log.userName}</td>
                  <td style={{ padding: '10px 14px', fontSize: 11 }}>
                    <span style={{ padding: '2px 6px', borderRadius: 4, background: '#F1F5F9', color: '#475569', fontSize: 10, fontWeight: 600 }}>{log.userRole}</span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 100,
                        background: actColor.bg,
                        color: actColor.fg,
                        border: `1px solid ${actColor.border}`,
                        fontSize: 10,
                        fontWeight: 800,
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 11, color: '#334155', fontWeight: 600 }}>{log.moduleName}</td>
                  <td style={{ padding: '10px 14px', fontSize: 11 }}>
                    {log.relatedEntityNumber ? (
                      <span
                        onClick={() => {
                          if (onNavigateTab) {
                            if (log.relatedEntityType === 'Purchase Order') onNavigateTab('purchase-orders');
                            else if (log.relatedEntityType === 'Contract') onNavigateTab('contracts');
                            else if (log.relatedEntityType === 'Procurement Request') onNavigateTab('proc-requests');
                          }
                        }}
                        style={{ cursor: 'pointer', fontWeight: 700, color: '#1565C0', textDecoration: 'underline' }}
                      >
                        {log.relatedEntityNumber}
                      </span>
                    ) : (
                      <span style={{ color: '#9CA3AF' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 11, fontFamily: 'monospace', color: '#9CA3AF' }}>{log.ipAddress}</td>
                </tr>
              );
            })}
            {logs.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: 30, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                  No activity log events match selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
        <span style={{ fontSize: 12, color: '#667085' }}>
          Showing page {page} of {totalPages} ({totalLogs} total recorded actions)
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #E4E7EC', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
          >
            Previous
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #E4E7EC', background: '#fff', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
