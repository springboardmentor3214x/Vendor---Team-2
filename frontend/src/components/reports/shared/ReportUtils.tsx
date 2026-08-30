/** Shared ReportInsights — auto-generated highlights strip */
import { Lightbulb } from 'lucide-react';

interface ReportInsightsProps {
  insights: string[];
  accentColor: string;
}

export function ReportInsights({ insights, accentColor }: ReportInsightsProps) {
  if (!insights.length) return null;
  return (
    <div style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}20`, borderRadius: 10, padding: '14px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        <Lightbulb size={15} color={accentColor} />
        <span style={{ fontSize: 12, fontWeight: 800, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
          Key Insights
        </span>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {insights.map((insight, i) => (
          <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: accentColor, marginTop: 6, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{insight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Section header divider for report sections */
export function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 14 }}>
      <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{title}</span>
      {sub && <span style={{ fontSize: 11, color: '#9CA3AF' }}>{sub}</span>}
    </div>
  );
}

/** Currency formatter */
export function fmtINR(v: number): string {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(1)} L`;
  if (v >= 1000)     return `₹${(v / 1000).toFixed(0)} K`;
  return `₹${v.toLocaleString('en-IN')}`;
}

/** Simple progress bar */
export function ProgressBar({ value, max = 100, color = '#2E7D32', height = 6 }: { value: number; max?: number; color?: string; height?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ background: '#E4E7EC', borderRadius: height, height, overflow: 'hidden', minWidth: 80 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: height, transition: 'width 0.4s ease' }} />
    </div>
  );
}

/** Status chip */
export function StatusChip({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    'Fulfilled':   { bg: '#E8F5E9', color: '#2E7D32' },
    'Compliant':   { bg: '#E8F5E9', color: '#2E7D32' },
    'Active':      { bg: '#E8F5E9', color: '#2E7D32' },
    'Completed':   { bg: '#E8F5E9', color: '#2E7D32' },
    'Approved':    { bg: '#E8F5E9', color: '#2E7D32' },
    'Renewed':     { bg: '#E8F5E9', color: '#2E7D32' },
    'Issued':      { bg: '#EEF4FF', color: '#1565C0' },
    'In Transit':  { bg: '#EEF4FF', color: '#1565C0' },
    'Ordered':     { bg: '#EEF4FF', color: '#1565C0' },
    'Delivered':   { bg: '#E0F7FA', color: '#006064' },
    'Awaiting Shipment': { bg: '#FFF8E1', color: '#F57F17' },
    'Pending':     { bg: '#FFF8E1', color: '#F57F17' },
    'Pending Verification': { bg: '#FFF8E1', color: '#F57F17' },
    'Draft':       { bg: '#F3F4F6', color: '#6B7280' },
    'Delayed':     { bg: '#FFEBEE', color: '#C62828' },
    'Cancelled':   { bg: '#FFEBEE', color: '#C62828' },
    'Expired':     { bg: '#FFEBEE', color: '#C62828' },
    'Non-Compliant': { bg: '#FFEBEE', color: '#C62828' },
    'Terminated':  { bg: '#FFEBEE', color: '#C62828' },
    'Suspended':   { bg: '#FFEBEE', color: '#C62828' },
    'Rejected':    { bg: '#FFEBEE', color: '#C62828' },
    'Low Risk':    { bg: '#E8F5E9', color: '#2E7D32' },
    'Medium Risk': { bg: '#FFF3E0', color: '#E65100' },
    'High Risk':   { bg: '#FFEBEE', color: '#C62828' },
    'Paid':        { bg: '#E8F5E9', color: '#2E7D32' },
    'Unpaid':      { bg: '#FFEBEE', color: '#C62828' },
    'Overdue':     { bg: '#FFEBEE', color: '#C62828' },
    'Expiring Soon': { bg: '#FFF3E0', color: '#E65100' },
  };
  const conf = map[status] ?? { bg: '#F3F4F6', color: '#6B7280' };
  return (
    <span style={{ background: conf.bg, color: conf.color, fontSize: 10, fontWeight: 700, borderRadius: 100, padding: '2px 8px', whiteSpace: 'nowrap', display: 'inline-block' }}>
      {status}
    </span>
  );
}

/** Reliability score badge */
export function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? '#2E7D32' : score >= 60 ? '#E65100' : '#C62828';
  const bg    = score >= 80 ? '#E8F5E9' : score >= 60 ? '#FFF3E0' : '#FFEBEE';
  return (
    <span style={{ background: bg, color, fontSize: 13, fontWeight: 900, borderRadius: 6, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {score}
    </span>
  );
}

/** Urgency day badge for expiry */
export function ExpiryBadge({ days }: { days: number }) {
  if (days < 0) return <StatusChip status="Expired" />;
  if (days <= 30) return <span style={{ background: '#FFEBEE', color: '#C62828', fontSize: 10, fontWeight: 700, borderRadius: 100, padding: '2px 8px' }}>⚠ {days}d</span>;
  if (days <= 90) return <span style={{ background: '#FFF3E0', color: '#E65100', fontSize: 10, fontWeight: 700, borderRadius: 100, padding: '2px 8px' }}>{days}d</span>;
  return <span style={{ background: '#E8F5E9', color: '#2E7D32', fontSize: 10, fontWeight: 700, borderRadius: 100, padding: '2px 8px' }}>{days}d</span>;
}
