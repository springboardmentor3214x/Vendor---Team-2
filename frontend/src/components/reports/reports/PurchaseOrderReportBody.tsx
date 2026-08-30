/** Purchase Order Report Body */
import { Receipt, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { PurchaseOrderReportResult } from '../../../models/report';
import { ReportKpiCard } from '../shared/ReportKpiCard';
import { ReportTable, type ColDef } from '../shared/ReportTable';
import { ReportInsights, SectionHeader, StatusChip, fmtINR } from '../shared/ReportUtils';

const COLOR = '#6A1B9A';
const STATUS_COLORS: Record<string, string> = {
  Fulfilled: '#2E7D32', Issued: '#1565C0', 'In Transit': '#006064',
  'Awaiting Shipment': '#F59E0B', Delayed: '#C62828', Cancelled: '#9CA3AF', Draft: '#D1D5DB',
};

type PORow = { poId: string; poNumber: string; vendorName: string; vendorCategory: string;
  totalCost: number; status: string; poDate: string; expectedDeliveryDate: string;
  department: string; paymentStatus: string } & Record<string, unknown>;

interface Props { data: PurchaseOrderReportResult; onReset?: () => void; }

export function PurchaseOrderReportBody({ data, onReset }: Props) {
  const { summary, byMonth, byStatus, insights } = data;

  const columns: ColDef<PORow>[] = [
    { key: 'poNumber', header: 'PO Number', sortable: true, width: '130px',
      render: r => <span style={{ fontWeight: 700, color: '#1565C0', fontFamily: 'monospace', fontSize: 11 }}>{r.poNumber}</span> },
    { key: 'vendorName', header: 'Vendor', sortable: true,
      render: r => <div><div style={{ fontWeight: 600, fontSize: 12 }}>{r.vendorName}</div><div style={{ fontSize: 10, color: '#9CA3AF' }}>{r.vendorCategory}</div></div> },
    { key: 'department', header: 'Department', sortable: true,
      render: r => <span style={{ fontSize: 11, color: '#6B7280' }}>{r.department}</span> },
    { key: 'poDate', header: 'PO Date', sortable: true,
      render: r => <span style={{ fontSize: 11 }}>{new Date(r.poDate).toLocaleDateString('en-IN')}</span> },
    { key: 'expectedDeliveryDate', header: 'Expected Delivery', sortable: true,
      render: r => <span style={{ fontSize: 11 }}>{new Date(r.expectedDeliveryDate).toLocaleDateString('en-IN')}</span> },
    { key: 'totalCost', header: 'Order Value', sortable: true, align: 'right',
      render: r => <span style={{ fontWeight: 700 }}>{fmtINR(r.totalCost)}</span>,
      total: rows => <span>{fmtINR(rows.reduce((s, r) => s + r.totalCost, 0))}</span> },
    { key: 'status', header: 'Status', sortable: true,
      render: r => <StatusChip status={r.status} /> },
    { key: 'paymentStatus', header: 'Payment', sortable: true,
      render: r => <StatusChip status={r.paymentStatus} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '20px 0' }}>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        <ReportKpiCard label="Total POs" value={String(summary.totalPOs)} sub="in period" icon={Receipt} accentColor={COLOR} trend="neutral" />
        <ReportKpiCard label="Total Order Value" value={fmtINR(summary.totalValue)} sub="cumulative" accentColor={COLOR} trend="neutral" />
        <ReportKpiCard label="Fulfilled" value={String(summary.fulfilledCount)} sub="completed orders" icon={CheckCircle} accentColor="#2E7D32" trend="up" valueColor="#2E7D32" />
        <ReportKpiCard label="Delayed" value={String(summary.delayedCount)} sub="require follow-up" icon={AlertTriangle} accentColor="#C62828"
          trend={summary.delayedCount > 0 ? 'down' : 'neutral'}
          valueColor={summary.delayedCount > 0 ? '#C62828' : '#111827'} />
        <ReportKpiCard label="Pending Payment" value={fmtINR(summary.pendingPaymentValue)} sub="outstanding exposure" icon={Clock} accentColor="#E65100"
          trend={summary.pendingPaymentValue > 1000000 ? 'down' : 'neutral'}
          valueColor={summary.pendingPaymentValue > 1000000 ? '#C62828' : '#111827'} />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Monthly Value Trend */}
        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, padding: '16px 18px' }}>
          <SectionHeader title="Monthly PO Value Trend" sub="Cumulative order value per month" />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={byMonth} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="poValueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLOR} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmtINR(v)} />
              <Tooltip formatter={(v: number) => fmtINR(v)} />
              <Area type="monotone" dataKey="value" stroke={COLOR} strokeWidth={2}
                fill="url(#poValueGrad)" name="Order Value" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status donut */}
        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, padding: '16px 18px' }}>
          <SectionHeader title="PO Status Distribution" />
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%"
                innerRadius={45} outerRadius={70} paddingAngle={2}>
                {byStatus.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.status] ?? '#9CA3AF'} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number, name: string) => [v + ' POs', name]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {byStatus.map(s => (
              <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#6B7280' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: STATUS_COLORS[s.status] ?? '#9CA3AF' }} />
                {s.status} ({s.count})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PO Table */}
      <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, padding: '16px 18px' }}>
        <SectionHeader title="Purchase Order Detail" sub={`${data.rows.length} orders — sortable by all columns`} />
        <ReportTable
          columns={columns}
          rows={data.rows as PORow[]}
          accentColor={COLOR}
          searchable
          searchPlaceholder="Search by PO number, vendor, department…"
          defaultSortKey="poDate"
          defaultSortDir="desc"
          pageSize={12}
          onReset={onReset}
          rowClassName={r => r.status === 'Delayed' ? { background: '#FFF5F5' } as React.CSSProperties : {}}
        />
      </div>

      <ReportInsights insights={insights} accentColor={COLOR} />
    </div>
  );
}
