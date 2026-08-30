/** Contract Report Body */
import { useState } from 'react';
import { FileText, DollarSign, AlertTriangle, RefreshCw } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line,
} from 'recharts';
import type { ContractReportResult, ContractRow } from '../../../models/report';
import { ReportKpiCard } from '../shared/ReportKpiCard';
import { ReportTable, type ColDef } from '../shared/ReportTable';
import { ReportInsights, SectionHeader, StatusChip, ExpiryBadge, fmtINR } from '../shared/ReportUtils';

const COLOR = '#E65100';
const STATUS_COLORS: Record<string, string> = {
  Active: '#2E7D32', Expired: '#C62828', Renewed: '#1565C0',
  Terminated: '#9C27B0', Draft: '#9CA3AF',
};

type CRow = ContractRow & Record<string, unknown>;
type ExpiryWindow = 'all' | '30' | '60' | '90';

interface Props { data: ContractReportResult; onReset?: () => void; }

export function ContractReportBody({ data, onReset }: Props) {
  const { summary, byStatus, byCategory, expiryTimeline, expiringByMonth, insights, rows } = data;
  const [expiryWindow, setExpiryWindow] = useState<ExpiryWindow>('all');

  const filteredRows: CRow[] = (rows as CRow[]).filter(r => {
    if (expiryWindow === '30') return r.daysToExpiry >= 0 && r.daysToExpiry <= 30;
    if (expiryWindow === '60') return r.daysToExpiry >= 0 && r.daysToExpiry <= 60;
    if (expiryWindow === '90') return r.daysToExpiry >= 0 && r.daysToExpiry <= 90;
    return true;
  });

  const urgencyRowStyle = (r: CRow): React.CSSProperties => {
    if (r.daysToExpiry < 0)  return { background: '#FFF5F5', borderLeft: '3px solid #C62828' };
    if (r.daysToExpiry <= 30) return { background: '#FFF9F5', borderLeft: '3px solid #E65100' };
    return {};
  };

  const columns: ColDef<CRow>[] = [
    { key: 'contractNumber', header: 'Contract #', sortable: true, width: '130px',
      render: r => <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: COLOR }}>{r.contractNumber}</span> },
    { key: 'contractTitle', header: 'Title', sortable: true,
      render: r => <span style={{ fontWeight: 600, fontSize: 12 }}>{r.contractTitle}</span> },
    { key: 'vendorName', header: 'Vendor', sortable: true,
      render: r => <span style={{ fontSize: 11 }}>{r.vendorName}</span> },
    { key: 'category', header: 'Category', sortable: true,
      render: r => <span style={{ fontSize: 10, color: '#6B7280' }}>{r.category}</span> },
    { key: 'contractValue', header: 'Value', sortable: true, align: 'right',
      render: r => <span style={{ fontWeight: 700 }}>{fmtINR(r.contractValue)}</span>,
      total: rows => <span>{fmtINR(rows.reduce((s, r) => s + r.contractValue, 0))}</span> },
    { key: 'startDate', header: 'Start Date', sortable: true,
      render: r => <span style={{ fontSize: 11 }}>{new Date(r.startDate).toLocaleDateString('en-IN')}</span> },
    { key: 'endDate', header: 'End Date', sortable: true,
      render: r => <span style={{ fontSize: 11 }}>{new Date(r.endDate).toLocaleDateString('en-IN')}</span> },
    { key: 'daysToExpiry', header: 'Expires In', sortable: true, align: 'center',
      render: r => <ExpiryBadge days={r.daysToExpiry} /> },
    { key: 'status', header: 'Status', sortable: true,
      render: r => <StatusChip status={r.status} /> },
    { key: 'responsibleManager', header: 'Manager', sortable: true,
      render: r => <span style={{ fontSize: 11 }}>{r.responsibleManager}</span> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '20px 0' }}>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <ReportKpiCard label="Total Active Contracts" value={String(summary.activeCount)} sub={`of ${summary.totalContracts} total`} icon={FileText} accentColor="#2E7D32" trend="neutral" valueColor="#2E7D32" />
        <ReportKpiCard label="Total Contract Value" value={fmtINR(summary.totalValue)} sub="portfolio value" icon={DollarSign} accentColor={COLOR} trend="neutral" />
        <ReportKpiCard label="Expiring in 30 Days" value={String(summary.expiringIn30Days)} sub="urgent renewals" icon={AlertTriangle} accentColor="#C62828"
          trend={summary.expiringIn30Days > 0 ? 'down' : 'up'}
          valueColor={summary.expiringIn30Days > 0 ? '#C62828' : '#2E7D32'} />
        <ReportKpiCard label="Renewal Rate" value={`${summary.renewalRate}%`} sub="renewed vs expired" icon={RefreshCw} accentColor="#1565C0"
          trend={summary.renewalRate >= 60 ? 'up' : 'down'} />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Value by Category */}
        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, padding: '16px 18px' }}>
          <SectionHeader title="Contract Value by Category" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byCategory} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="category" tick={{ fontSize: 9 }} tickFormatter={v => v.split(' ')[0]} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmtINR(v)} />
              <Tooltip formatter={(v: number) => fmtINR(v)} />
              <Bar dataKey="value" fill={COLOR} radius={[4, 4, 0, 0]} maxBarSize={36} name="Contract Value">
                {byCategory.map((_e, i) => <Cell key={i} fill={[COLOR, '#1565C0', '#2E7D32', '#6A1B9A', '#006064', '#C62828'][i % 6]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expiring by Month */}
        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, padding: '16px 18px' }}>
          <SectionHeader title="Contracts Expiring by Month" sub="Next 6 months" />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={expiringByMonth} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#C62828" strokeWidth={2} dot={{ r: 4, fill: '#C62828' }} name="Expiring" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expiry status summary */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {expiryTimeline.map(t => (
          <div key={t.window} style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 8, padding: '10px 14px', textAlign: 'center', minWidth: 90 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: t.window === '< 30 days' ? '#C62828' : t.window === 'Expired' ? '#9C27B0' : '#374151' }}>{t.count}</div>
            <div style={{ fontSize: 10, color: '#9CA3AF' }}>{t.window}</div>
          </div>
        ))}
      </div>

      {/* Expiry Quick-filter */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Expiry View:</span>
        {([['all', 'All Contracts'], ['30', '⚠ Within 30 Days'], ['60', 'Within 60 Days'], ['90', 'Within 90 Days']] as [ExpiryWindow, string][]).map(([w, label]) => (
          <button key={w} onClick={() => setExpiryWindow(w)}
            style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid',
              borderColor: expiryWindow === w ? COLOR : '#E4E7EC',
              background: expiryWindow === w ? `${COLOR}15` : '#fff',
              color: expiryWindow === w ? COLOR : '#6B7280',
            }}>{label}</button>
        ))}
        <span style={{ fontSize: 11, color: '#9CA3AF' }}>{filteredRows.length} contracts</span>
      </div>

      {/* Contract Table */}
      <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, padding: '16px 18px' }}>
        <SectionHeader title="Contract Detail" sub="Red/amber row accents indicate urgent expiry" />

        {/* By Status summary */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {byStatus.map(s => (
            <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8FAFC', border: '1px solid #E4E7EC', borderRadius: 6, padding: '4px 10px' }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: STATUS_COLORS[s.status] ?? '#9CA3AF' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{s.status}: {s.count}</span>
              <span style={{ fontSize: 10, color: '#9CA3AF' }}>({fmtINR(s.value)})</span>
            </div>
          ))}
        </div>

        <ReportTable
          columns={columns}
          rows={filteredRows}
          accentColor={COLOR}
          searchable
          searchPlaceholder="Search contracts…"
          defaultSortKey="daysToExpiry"
          defaultSortDir="asc"
          pageSize={10}
          rowClassName={urgencyRowStyle}
          onReset={onReset}
        />
      </div>

      <ReportInsights insights={insights} accentColor={COLOR} />
    </div>
  );
}
