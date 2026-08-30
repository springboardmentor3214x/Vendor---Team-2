/** Executive Summary Report Body */
import { Users, TrendingUp, DollarSign, Shield, FileText, Truck, AlertTriangle } from 'lucide-react';
import {
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { ExecutiveSummaryReportResult } from '../../../models/report';
import { ReportKpiCard } from '../shared/ReportKpiCard';
import { ReportInsights, SectionHeader, fmtINR, ScoreBadge } from '../shared/ReportUtils';

const RISK_COLORS = { 'Low Risk': '#2E7D32', 'Medium Risk': '#E65100', 'High Risk': '#C62828' };
const COLOR = '#006064';

interface Props { data: ExecutiveSummaryReportResult; }

function KpiSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ background: '#F8FAFC', padding: '10px 16px', borderBottom: '1px solid #E4E7EC' }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{title}</span>
      </div>
      <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

interface StatProps { label: string; value: string; color?: string; }
function Stat({ label, value, color }: StatProps) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: color ?? '#111827' }}>{value}</div>
      <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{label}</div>
    </div>
  );
}

interface Props { data: ExecutiveSummaryReportResult; }

export function ExecutiveSummaryReportBody({ data }: Props) {
  const { vendorKPIs, procurementKPIs, poKPIs, contractKPIs, complianceKPIs,
    topVendors, riskSummary, monthlyTrend, insights } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '20px 0' }}>
      {/* Top-level KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <ReportKpiCard label="Active Vendors" value={String(vendorKPIs.activeVendors)} sub={`of ${vendorKPIs.totalVendors} registered`} icon={Users} accentColor={COLOR} trend="neutral" />
        <ReportKpiCard label="Procurement Spend" value={fmtINR(poKPIs.totalSpend)} sub="total PO value" icon={DollarSign} accentColor="#6A1B9A" trend="neutral" />
        <ReportKpiCard label="Compliance Rate" value={`${complianceKPIs.overallComplianceRate}%`} sub="overall" icon={Shield} accentColor={complianceKPIs.overallComplianceRate >= 80 ? '#2E7D32' : '#C62828'}
          trend={complianceKPIs.overallComplianceRate >= 80 ? 'up' : 'down'}
          valueColor={complianceKPIs.overallComplianceRate >= 80 ? '#2E7D32' : '#C62828'} />
        <ReportKpiCard label="Contracts Expiring (30d)" value={String(contractKPIs.expiringIn30Days)} sub="urgent renewals" icon={FileText} accentColor="#E65100"
          trend={contractKPIs.expiringIn30Days > 0 ? 'down' : 'up'}
          valueColor={contractKPIs.expiringIn30Days > 0 ? '#E65100' : '#2E7D32'} />
      </div>

      {/* Domain KPI sections */}
      <KpiSection title="Vendor Portfolio">
        <Stat label="Total Vendors" value={String(vendorKPIs.totalVendors)} />
        <Stat label="Avg Reliability" value={String(vendorKPIs.avgReliabilityScore)}
          color={vendorKPIs.avgReliabilityScore >= 75 ? '#2E7D32' : '#E65100'} />
        <Stat label="High Risk" value={String(vendorKPIs.highRiskVendors)}
          color={vendorKPIs.highRiskVendors > 0 ? '#C62828' : '#2E7D32'} />
        <Stat label="New This Period" value={String(vendorKPIs.newVendorsThisPeriod)} color="#1565C0" />
      </KpiSection>

      <KpiSection title="Procurement Activity">
        <Stat label="Total Requests" value={String(procurementKPIs.totalRequests)} />
        <Stat label="Total Budget" value={fmtINR(procurementKPIs.totalBudget)} />
        <Stat label="Completion Rate" value={`${procurementKPIs.completionRate}%`}
          color={procurementKPIs.completionRate >= 60 ? '#2E7D32' : '#E65100'} />
        <Stat label="Avg Approval" value={`${procurementKPIs.avgApprovalDays}d`} />
      </KpiSection>

      <KpiSection title="Purchase Orders">
        <Stat label="Total POs" value={String(poKPIs.totalPOs)} />
        <Stat label="On-Time Delivery" value={`${poKPIs.onTimeDeliveryRate}%`}
          color={poKPIs.onTimeDeliveryRate >= 80 ? '#2E7D32' : '#C62828'} />
        <Stat label="Delayed Orders" value={String(poKPIs.delayedCount)}
          color={poKPIs.delayedCount > 0 ? '#C62828' : '#2E7D32'} />
        <Stat label="Pending Payment" value={fmtINR(poKPIs.pendingPaymentValue)} color="#E65100" />
      </KpiSection>

      <KpiSection title="Contracts & Compliance">
        <Stat label="Active Contracts" value={String(contractKPIs.totalContracts)} />
        <Stat label="Portfolio Value" value={fmtINR(contractKPIs.totalContractValue)} />
        <Stat label="Non-Compliant Vendors" value={String(complianceKPIs.nonCompliantVendors)}
          color={complianceKPIs.nonCompliantVendors > 0 ? '#C62828' : '#2E7D32'} />
        <Stat label="Pending Reviews" value={String(complianceKPIs.pendingVerifications)}
          color={complianceKPIs.pendingVerifications > 0 ? '#E65100' : '#2E7D32'} />
      </KpiSection>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
        {/* Risk Distribution Donut */}
        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, padding: '16px 18px' }}>
          <SectionHeader title="Vendor Risk Distribution" />
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={riskSummary} dataKey="count" nameKey="level" cx="50%" cy="50%"
                innerRadius={45} outerRadius={68} paddingAngle={3}
                label={({ level, count }: { level: string; count: number }) => `${count}`}>
                {riskSummary.map((entry, i) => (
                  <Cell key={i} fill={RISK_COLORS[entry.level as keyof typeof RISK_COLORS]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 6 }}>
            {riskSummary.map(r => (
              <div key={r.level} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: RISK_COLORS[r.level as keyof typeof RISK_COLORS] }} />
                  <span style={{ fontSize: 11, color: '#374151' }}>{r.level}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: RISK_COLORS[r.level as keyof typeof RISK_COLORS] }}>{r.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend */}
        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, padding: '16px 18px' }}>
          <SectionHeader title="Monthly Procurement Trend" />
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={monthlyTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="requests" stroke="#1565C0" strokeWidth={2} dot={{ r: 2 }} name="Requests" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top 5 Vendors */}
        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10, padding: '16px 18px' }}>
          <SectionHeader title="Top 5 Vendors" sub="By reliability score" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            {topVendors.map((v, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', width: 16 }}>#{i + 1}</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{v.vendorName.split(' ').slice(0, 2).join(' ')}</div>
                    <div style={{ fontSize: 9, color: '#9CA3AF' }}>{v.category.split(' ')[0]}</div>
                  </div>
                </div>
                <ScoreBadge score={v.score} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delayed deliveries large KPI */}
      {poKPIs.delayedCount > 0 && (
        <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#C62828', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#C62828' }}>
              {poKPIs.delayedCount} Delayed Purchase Order{poKPIs.delayedCount > 1 ? 's' : ''} — Immediate Action Required
            </div>
            <div style={{ fontSize: 12, color: '#B71C1C', marginTop: 2 }}>
              Review delayed deliveries with vendor managers. Cross-reference with on-time delivery rates in the full PO report.
            </div>
          </div>
        </div>
      )}

      <ReportInsights insights={insights} accentColor={COLOR} />
    </div>
  );
}
