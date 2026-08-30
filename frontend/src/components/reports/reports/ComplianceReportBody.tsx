/** Compliance Report Body */
import { useState } from 'react';
import { Shield, CheckCircle, AlertCircle, Clock, FileX } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ComplianceReportResult, ComplianceVendorSummary } from '../../../models/report';
import { ReportKpiCard } from '../shared/ReportKpiCard';
import { ReportTable, type ColDef } from '../shared/ReportTable';
import { ReportInsights, SectionHeader, StatusChip, ProgressBar } from '../shared/ReportUtils';

const COLOR = '#C62828';
const STATUS_COLORS: Record<string, string> = {
  Compliant: '#2E7D32', 'Non-Compliant': '#C62828',
  'Pending Verification': '#E65100', Expired: '#9C27B0',
};

type VendorSummaryRow = ComplianceVendorSummary & Record<string, unknown>;

interface Props { data: ComplianceReportResult; onReset?: () => void; }

export function ComplianceReportBody({ data, onReset }: Props) {
  const { summary, byStatus, byCategory, byVendor, insights } = data;
  const [quickFilter, setQuickFilter] = useState<'all' | 'expired' | 'missing'>('all');

  const filteredVendors: VendorSummaryRow[] = (byVendor as VendorSummaryRow[]).filter(v => {
    if (quickFilter === 'expired') return v.hasExpired;
    if (quickFilter === 'missing') return v.hasMissing;
    return true;
  });

  const vendorCols: ColDef<VendorSummaryRow>[] = [
    { key: 'vendorName', header: 'Vendor Name', sortable: true,
      render: r => <span style={{ fontWeight: 600 }}>{r.vendorName}</span> },
    { key: 'category', header: 'Category', sortable: true,
      render: r => <span style={{ fontSize: 11, color: '#6B7280' }}>{r.category}</span> },
    { key: 'totalChecks', header: 'Total Checks', sortable: true, align: 'right' },
    { key: 'compliantCount', header: 'Compliant', align: 'right', sortable: true,
      render: r => <span style={{ color: '#2E7D32', fontWeight: 700 }}>{r.compliantCount}</span> },
    { key: 'pendingCount', header: 'Pending', align: 'right', sortable: true,
      render: r => r.pendingCount > 0 ? <span style={{ color: '#E65100', fontWeight: 700 }}>{r.pendingCount}</span> : <span style={{ color: '#9CA3AF' }}>0</span> },
    { key: 'hasExpired', header: 'Expired Cert', align: 'center', sortable: true,
      render: r => r.hasExpired ? <AlertCircle size={14} color="#C62828" /> : <CheckCircle size={14} color="#2E7D32" /> },
    { key: 'hasMissing', header: 'Missing Docs', align: 'center', sortable: true,
      render: r => r.hasMissing ? <FileX size={14} color="#C62828" /> : <CheckCircle size={14} color="#2E7D32" /> },
    { key: 'complianceRate', header: 'Compliance %', sortable: true, width: '130px',
      render: r => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <StatusChip status={r.complianceRate === 100 ? 'Compliant' : r.complianceRate >= 60 ? 'Pending Verification' : 'Non-Compliant'} />
            <span style={{ fontSize: 11, fontWeight: 700 }}>{r.complianceRate}%</span>
          </div>
          <ProgressBar value={r.complianceRate} color={r.complianceRate >= 80 ? '#2E7D32' : r.complianceRate >= 50 ? '#E65100' : '#C62828'} />
        </div>
      )},
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '20px 0' }}>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <ReportKpiCard label="Overall Compliance %" value={`${summary.complianceRate}%`} sub={`${summary.compliantVendors} of ${summary.totalVendors} vendors fully compliant`}
          icon={Shield} accentColor={summary.complianceRate >= 80 ? '#2E7D32' : COLOR}
          trend={summary.complianceRate >= 80 ? 'up' : 'down'}
          valueColor={summary.complianceRate >= 80 ? '#2E7D32' : COLOR} />
        <ReportKpiCard label="Compliant Records" value={String(summary.compliantCount)} sub="fully verified" icon={CheckCircle} accentColor="#2E7D32" trend="up" valueColor="#2E7D32" />
        <ReportKpiCard label="Expired Certs" value={String(summary.expiredCount)} sub="require renewal" icon={AlertCircle} accentColor="#9C27B0"
          trend={summary.expiredCount > 0 ? 'down' : 'neutral'}
          valueColor={summary.expiredCount > 0 ? '#9C27B0' : '#111827'} />
        <ReportKpiCard label="Pending Verifications" value={String(summary.pendingCount)} sub="awaiting review" icon={Clock} accentColor="#E65100"
          trend={summary.pendingCount > 0 ? 'down' : 'neutral'}
          valueColor={summary.pendingCount > 0 ? '#E65100' : '#111827'} />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, padding: '16px 18px' }}>
          <SectionHeader title="Compliance Status Distribution" />
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%"
                innerRadius={50} outerRadius={75} paddingAngle={3}
                label={({ status, percentage }: { status: string; percentage: number }) => `${percentage}%`}>
                {byStatus.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.status] ?? '#9CA3AF'} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number, name: string) => [v, name]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {byStatus.map(s => (
              <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: STATUS_COLORS[s.status] ?? '#9CA3AF' }} />
                <span style={{ color: '#374151' }}>{s.status} ({s.count})</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, padding: '16px 18px' }}>
          <SectionHeader title="Compliance by Category" sub="Compliant vs Non-Compliant" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byCategory} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 9 }} width={100} tickFormatter={v => v.split(' ')[0]} />
              <Tooltip />
              <Bar dataKey="compliant"    fill="#2E7D32" maxBarSize={14} name="Compliant" stackId="a" />
              <Bar dataKey="nonCompliant" fill="#C62828" maxBarSize={14} name="Non-Compliant" stackId="a" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick-filter bar */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Quick Filter:</span>
        {(['all', 'expired', 'missing'] as const).map(f => (
          <button key={f} onClick={() => setQuickFilter(f)}
            style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid',
              borderColor: quickFilter === f ? COLOR : '#E4E7EC',
              background: quickFilter === f ? `${COLOR}12` : '#fff',
              color: quickFilter === f ? COLOR : '#6B7280',
            }}>
            {f === 'all' ? 'All Vendors' : f === 'expired' ? '⚠ Expired Certifications' : '🔴 Missing Documents'}
          </button>
        ))}
        <span style={{ fontSize: 11, color: '#9CA3AF' }}>{filteredVendors.length} vendors</span>
      </div>

      {/* Vendor Compliance Table */}
      <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, padding: '16px 18px' }}>
        <SectionHeader title="Vendor Compliance Summary" sub="Per-vendor compliance rates and document status" />
        <ReportTable
          columns={vendorCols}
          rows={filteredVendors}
          accentColor={COLOR}
          searchable
          searchPlaceholder="Search vendor…"
          defaultSortKey="complianceRate"
          defaultSortDir="asc"
          pageSize={12}
          onReset={onReset}
        />
      </div>

      <ReportInsights insights={insights} accentColor={COLOR} />
    </div>
  );
}
