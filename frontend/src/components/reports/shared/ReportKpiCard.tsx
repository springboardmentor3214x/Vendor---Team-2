/** Shared ReportKpiCard — used by all 6 report bodies */
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ReportKpiCardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: 'up' | 'down' | 'neutral';
  valueColor?: string;
  icon?: React.ElementType;
  accentColor?: string;
  wide?: boolean;
}

export function ReportKpiCard({ label, value, sub, trend = 'neutral', valueColor, icon: Icon, accentColor = '#1565C0', wide }: ReportKpiCardProps) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #E4E7EC', borderRadius: 10,
      padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 4,
      gridColumn: wide ? 'span 2' : undefined,
      borderLeft: `3px solid ${accentColor}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
        {Icon && <div style={{ width: 26, height: 26, borderRadius: 6, background: `${accentColor}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={13} color={accentColor} />
        </div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 22, fontWeight: 900, color: valueColor ?? '#111827', lineHeight: 1 }}>{value}</span>
        {trend === 'up'      && <TrendingUp  size={13} color="#2E7D32" />}
        {trend === 'down'    && <TrendingDown size={13} color="#C62828" />}
        {trend === 'neutral' && <Minus        size={13} color="#9CA3AF" />}
      </div>
      {sub && <span style={{ fontSize: 11, color: '#9CA3AF' }}>{sub}</span>}
    </div>
  );
}
