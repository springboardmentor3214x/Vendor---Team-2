/** Vendor Performance Report Body */
import { TrendingUp, Star, Truck, AlertTriangle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from 'recharts';
import type { VendorPerformanceReportResult } from '../../../models/report';
import { ReportKpiCard } from '../shared/ReportKpiCard';
import { ReportTable, type ColDef } from '../shared/ReportTable';
import { ReportInsights, SectionHeader, ScoreBadge, StatusChip, ProgressBar } from '../shared/ReportUtils';

const COLOR = '#1565C0';

interface Props { data: VendorPerformanceReportResult; onReset?: () => void; }

export function VendorPerformanceReportBody({ data, onReset }: Props) {
  const { summary, topByReliability, deliveryComparison, insights, rows } = data;

  type Row = (typeof rows)[number] & Record<string, unknown>;
  const tableRows = rows as Row[];

  const columns: ColDef<Row>[] = [
    { key: 'vendorName', header: 'Vendor Name', sortable: true, width: '200px',
      render: r => <span style={{ fontWeight: 600, color: '#111827', fontSize: 12 }}>{r.vendorName}</span> },
    { key: 'category', header: 'Category', sortable: true,
      render: r => <span style={{ fontSize: 11, color: '#6B7280' }}>{r.category}</span> },
    { key: 'totalPOs', header: 'POs', sortable: true, align: 'right',
      render: r => <span style={{ fontWeight: 700 }}>{r.totalPOs}</span>,
      total: rows => <span>{rows.reduce((s, r) => s + r.totalPOs, 0)}</span> },
    { key: 'onTimeDeliveryRate', header: 'On-Time %', sortable: true, align: 'right',
      render: r => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontWeight: 700, color: r.onTimeDeliveryRate >= 80 ? '#2E7D32' : r.onTimeDeliveryRate >= 60 ? '#E65100' : '#C62828' }}>{r.onTimeDeliveryRate}%</span>
          <ProgressBar value={r.onTimeDeliveryRate} color={r.onTimeDeliveryRate >= 80 ? '#2E7D32' : r.onTimeDeliveryRate >= 60 ? '#E65100' : '#C62828'} />
        </div>
      )},
    { key: 'qualityScore', header: 'Quality', sortable: true, align: 'right',
      render: r => (
        <div style={{ display: 'flex', gap: 2 }}>
          {[1,2,3,4,5].map(s => <Star key={s} size={10} fill={r.qualityScore/20 >= s ? '#F59E0B' : 'none'} color="#F59E0B" />)}
        </div>
      )},
    { key: 'avgResponseTimeHours', header: 'Avg Response', sortable: true, align: 'right',
      render: r => <span>{r.avgResponseTimeHours.toFixed(1)}h</span> },
    { key: 'communicationScore', header: 'Communication', sortable: true, align: 'right',
      render: r => <ProgressBar value={r.communicationScore} color="#1565C0" height={5} /> },
    { key: 'complianceScore', header: 'Compliance', sortable: true, align: 'right',
      render: r => <span style={{ fontWeight: 600 }}>{r.complianceScore}%</span> },
    { key: 'reliabilityScore', header: 'Reliability Score', sortable: true, align: 'right',
      render: r => <ScoreBadge score={r.reliabilityScore} /> },
    { key: 'riskLevel', header: 'Risk', sortable: true,
      render: r => <StatusChip status={r.riskLevel} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '20px 0' }}>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <ReportKpiCard label="Vendors Evaluated" value={String(summary.totalVendors)} sub="in filtered scope" icon={TrendingUp} accentColor={COLOR} trend="neutral" />
        <ReportKpiCard label="Avg On-Time Delivery" value={`${summary.onTimeDeliveryAvg}%`} sub="across all vendors" icon={Truck} accentColor={COLOR}
          trend={summary.onTimeDeliveryAvg >= 80 ? 'up' : 'down'}
          valueColor={summary.onTimeDeliveryAvg >= 80 ? '#2E7D32' : '#C62828'} />
        <ReportKpiCard label="Avg Quality Rating" value={`${summary.avgQualityScore}`} sub="out of 100" icon={Star} accentColor={COLOR}
          trend={summary.avgQualityScore >= 80 ? 'up' : 'neutral'} />
        <ReportKpiCard label="High Risk Vendors" value={String(summary.highRiskCount)} sub="require attention" icon={AlertTriangle} accentColor="#C62828"
          trend={summary.highRiskCount > 0 ? 'down' : 'up'}
          valueColor={summary.highRiskCount > 0 ? '#C62828' : '#2E7D32'} />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Top 10 by Reliability */}
        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, padding: '16px 18px' }}>
          <SectionHeader title="Top Vendors by Reliability Score" sub="Ranked highest to lowest" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topByReliability} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="vendorName" tick={{ fontSize: 9 }} width={90}
                tickFormatter={v => v.split(' ')[0]} />
              <Tooltip formatter={(v: number) => [`${v}/100`, 'Score']} />
              <Bar dataKey="reliabilityScore" radius={[0, 4, 4, 0]} maxBarSize={18}>
                {topByReliability.map((entry, i) => (
                  <Cell key={i} fill={entry.reliabilityScore >= 80 ? '#2E7D32' : entry.reliabilityScore >= 60 ? '#E65100' : '#C62828'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* On-Time vs Delayed */}
        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, padding: '16px 18px' }}>
          <SectionHeader title="On-Time vs Delayed Deliveries" sub="Per vendor (top 10)" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deliveryComparison} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
              <YAxis type="category" dataKey="vendorName" tick={{ fontSize: 9 }} width={70} />
              <Tooltip formatter={(v: number, name: string) => [`${v}%`, name === 'onTime' ? 'On-Time' : 'Delayed']} />
              <Legend formatter={(v) => v === 'onTime' ? 'On-Time' : 'Delayed'} iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="onTime"   stackId="a" fill="#2E7D32" radius={[0, 0, 0, 0]} maxBarSize={14} />
              <Bar dataKey="delayed"  stackId="a" fill="#FFCDD2" radius={[0, 4, 4, 0]} maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Table */}
      <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, padding: '16px 18px' }}>
        <SectionHeader title="Vendor Performance Detail" sub={`${rows.length} vendor(s) — sorted by reliability score`} />
        <ReportTable
          columns={columns}
          rows={tableRows}
          accentColor={COLOR}
          searchable
          searchPlaceholder="Search vendors…"
          defaultSortKey="reliabilityScore"
          defaultSortDir="desc"
          onReset={onReset}
        />
      </div>

      {/* Insights */}
      <ReportInsights insights={insights} accentColor={COLOR} />
    </div>
  );
}
