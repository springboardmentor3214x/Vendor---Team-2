/** Procurement Report Body */
import { ShoppingCart, CheckCircle, Clock, XCircle, DollarSign } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { ProcurementReportResult } from '../../../models/report';
import { ReportKpiCard } from '../shared/ReportKpiCard';
import { ReportTable, type ColDef } from '../shared/ReportTable';
import { ReportInsights, SectionHeader, StatusChip, fmtINR } from '../shared/ReportUtils';

const COLOR = '#2E7D32';
const STATUS_COLORS: Record<string, string> = {
  Completed: '#2E7D32', Approved: '#1565C0', Ordered: '#006064',
  Delivered: '#4CAF50', Pending: '#F59E0B', Cancelled: '#C62828',
};

interface Props { data: ProcurementReportResult; onReset?: () => void; }

export function ProcurementReportBody({ data, onReset }: Props) {
  const { summary, byDepartment, byStatus, byMonth, insights } = data;

  // Department table
  type DeptRow = (typeof byDepartment)[number] & Record<string, unknown>;
  const deptCols: ColDef<DeptRow>[] = [
    { key: 'department', header: 'Department', sortable: true,
      render: r => <span style={{ fontWeight: 600 }}>{r.department}</span> },
    { key: 'count', header: 'Requests', sortable: true, align: 'right',
      total: rows => <span>{rows.reduce((s, r) => s + r.count, 0)}</span> },
    { key: 'approved', header: 'Approved', sortable: true, align: 'right',
      render: r => <span style={{ color: '#2E7D32', fontWeight: 700 }}>{r.approved}</span>,
      total: rows => <span style={{ color: '#2E7D32' }}>{rows.reduce((s, r) => s + r.approved, 0)}</span> },
    { key: 'rejected', header: 'Cancelled', sortable: true, align: 'right',
      render: r => <span style={{ color: '#C62828', fontWeight: 700 }}>{r.rejected}</span>,
      total: rows => <span style={{ color: '#C62828' }}>{rows.reduce((s, r) => s + r.rejected, 0)}</span> },
    { key: 'avgDays', header: 'Avg Approval', sortable: true, align: 'right',
      render: r => <span>{r.avgDays}d</span> },
    { key: 'budget', header: 'Total Spend', sortable: true, align: 'right',
      render: r => <span style={{ fontWeight: 700 }}>{fmtINR(r.budget)}</span>,
      total: rows => <span>{fmtINR(rows.reduce((s, r) => s + r.budget, 0))}</span> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '20px 0' }}>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        <ReportKpiCard label="Total Requests" value={String(summary.totalRequests)} sub="submitted in period" icon={ShoppingCart} accentColor={COLOR} trend="neutral" />
        <ReportKpiCard label="Approved" value={String(summary.approvedCount)} sub="approved requests" icon={CheckCircle} accentColor="#1565C0" trend="up" valueColor="#1565C0" />
        <ReportKpiCard label="Completed" value={String(summary.completedCount)} sub="fully processed" icon={CheckCircle} accentColor="#2E7D32" trend="up" valueColor="#2E7D32" />
        <ReportKpiCard label="Avg Processing" value={`${summary.avgProcessingDays}d`} sub="approval cycle time" icon={Clock} accentColor="#E65100" trend="neutral" />
        <ReportKpiCard label="Total Expenditure" value={fmtINR(summary.totalBudget)} sub="estimated budget" icon={DollarSign} accentColor="#6A1B9A" trend="neutral" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Monthly Trend */}
        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, padding: '16px 18px' }}>
          <SectionHeader title="Monthly Procurement Trend" sub="Requests submitted vs completed" />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={byMonth} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="requests"  stroke="#1565C0" strokeWidth={2} dot={{ r: 3 }} name="Requests" />
              <Line type="monotone" dataKey="completed" stroke="#2E7D32" strokeWidth={2} dot={{ r: 3 }} name="Completed" strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status Donut */}
        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, padding: '16px 18px' }}>
          <SectionHeader title="Status Distribution" />
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%"
                innerRadius={50} outerRadius={75} paddingAngle={2}
                label={({ status, percentage }: { status: string; percentage: number }) => `${status}: ${percentage}%`}
                labelLine={false}>
                {byStatus.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.status] ?? '#9CA3AF'} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number, name: string) => [v, name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department bar */}
      <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, padding: '16px 18px' }}>
        <SectionHeader title="Expenditure by Department" sub="Total estimated budget per department" />
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={[...byDepartment].sort((a, b) => b.budget - a.budget).slice(0, 10)} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="department" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmtINR(v)} />
            <Tooltip formatter={(v: number) => fmtINR(v)} />
            <Bar dataKey="budget" fill={COLOR} radius={[4, 4, 0, 0]} maxBarSize={32} name="Budget" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Department table */}
      <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, padding: '16px 18px' }}>
        <SectionHeader title="Department-wise Procurement Summary" sub={`${byDepartment.length} departments`} />
        <ReportTable
          columns={deptCols}
          rows={byDepartment as DeptRow[]}
          accentColor={COLOR}
          defaultSortKey="budget"
          defaultSortDir="desc"
          onReset={onReset}
          pageSize={10}
        />
      </div>

      {/* Status distribution sub-table */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {byStatus.map(s => (
          <div key={s.status} style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <StatusChip status={s.status} />
              <div style={{ fontSize: 18, fontWeight: 900, color: '#111827', marginTop: 4 }}>{s.count}</div>
              <div style={{ fontSize: 10, color: '#9CA3AF' }}>{s.percentage}% of total</div>
            </div>
          </div>
        ))}
      </div>

      <ReportInsights insights={insights} accentColor={COLOR} />
    </div>
  );
}
