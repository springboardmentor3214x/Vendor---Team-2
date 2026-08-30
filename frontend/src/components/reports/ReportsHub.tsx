/**
 * ReportsHub — Module 10: Reports & Export
 * Landing page at /reports route.
 */

import { useState, useEffect, useRef } from 'react';
import {
  TrendingUp, ShoppingCart, Receipt, Shield, FileText,
  BarChart2, Clock, CheckCircle, AlertCircle, FileBarChart2,
  ChevronRight, X, RefreshCw,
} from 'lucide-react';
import type {
  ReportType, ReportFilters, RecentReport,
  VendorPerformanceReportResult, ProcurementReportResult,
  PurchaseOrderReportResult, ComplianceReportResult,
  ContractReportResult, ExecutiveSummaryReportResult,
} from '../../models/report';
import { DEFAULT_FILTERS } from '../../models/report';
import { reportService } from '../../services/reportService';
import { ReportFilterPanel } from './ReportFilterPanel';
import { ReportPreview } from './ReportPreview';

type AnyReportResult =
  | VendorPerformanceReportResult | ProcurementReportResult
  | PurchaseOrderReportResult    | ComplianceReportResult
  | ContractReportResult         | ExecutiveSummaryReportResult;

// ─── Report Card Config ───────────────────────────────────────────────────────

interface ReportCard {
  id: ReportType;
  title: string;
  description: string;
  metrics: string[];
  Icon: React.ElementType;
  color: string;
  bg: string;
  allowedRoles: string[];
}

const REPORT_CARDS: ReportCard[] = [
  {
    id: 'vendor-performance',
    title: 'Vendor Performance Report',
    description: 'Reliability scores, delivery rates, quality evaluations, and communication efficiency across your vendor base.',
    metrics: ['Reliability scores (0–100)', 'On-time delivery rate', 'Quality & communication KPIs', 'Risk classification'],
    Icon: TrendingUp, color: '#1565C0', bg: '#EEF4FF',
    allowedRoles: ['Administrator','Procurement Manager','Finance Officer','Auditor','Supply Chain Manager','Vendor'],
  },
  {
    id: 'procurement',
    title: 'Procurement Report',
    description: 'Full lifecycle view of procurement requests — budget utilisation, approval cycle times, and department-wise breakdown.',
    metrics: ['Total requests & budgets', 'Approval/rejection rates', 'Department breakdown', 'Avg processing time'],
    Icon: ShoppingCart, color: '#2E7D32', bg: '#E8F5E9',
    allowedRoles: ['Administrator','Procurement Manager','Finance Officer','Auditor','Supply Chain Manager'],
  },
  {
    id: 'purchase-order',
    title: 'Purchase Order Report',
    description: 'Detailed analysis of PO spend, vendor-wise distribution, monthly trends, and payment status.',
    metrics: ['Total PO value & count', 'Monthly spend trends', 'Fulfillment & delay stats', 'Pending payment exposure'],
    Icon: Receipt, color: '#6A1B9A', bg: '#F3E8FF',
    allowedRoles: ['Administrator','Procurement Manager','Finance Officer','Auditor'],
  },
  {
    id: 'compliance',
    title: 'Compliance Report',
    description: 'Comprehensive compliance posture across all vendors — certifications, regulatory adherence, and non-compliance flags.',
    metrics: ['Overall compliance rate', 'Non-compliant vendors', 'Pending verifications', 'Category breakdown'],
    Icon: Shield, color: '#C62828', bg: '#FFEBEE',
    allowedRoles: ['Administrator','Procurement Manager','Finance Officer','Auditor'],
  },
  {
    id: 'contract',
    title: 'Contract Report',
    description: 'Contract portfolio health, expiry timeline, renewal status, and total contracted value across all vendors.',
    metrics: ['Active vs expired contracts', 'Expiry within 30/60/90 days', 'Total contract value', 'Renewal timelines'],
    Icon: FileText, color: '#E65100', bg: '#FFF3E0',
    allowedRoles: ['Administrator','Procurement Manager','Finance Officer','Auditor'],
  },
  {
    id: 'executive-summary',
    title: 'Executive Summary Report',
    description: 'C-suite ready consolidated view of vendor reliability, procurement spend, compliance posture, and contract health.',
    metrics: ['Vendor portfolio health', 'Procurement & spend KPIs', 'Compliance overview', 'Top performer spotlight'],
    Icon: BarChart2, color: '#006064', bg: '#E0F7FA',
    allowedRoles: ['Administrator','Finance Officer','Auditor'],
  },
];

// ─── Role visibility ──────────────────────────────────────────────────────────

function getVisibleCards(role: string, vendorName?: string): ReportCard[] {
  return REPORT_CARDS.filter(card => {
    if (!card.allowedRoles.includes(role)) return false;
    // Vendors: only their own performance report
    if (role === 'Vendor') return card.id === 'vendor-performance';
    return true;
  });
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RecentReport['status'] }) {
  const conf = {
    Completed:  { bg: '#E8F5E9', color: '#2E7D32', icon: <CheckCircle size={11} /> },
    Processing: { bg: '#FFF3E0', color: '#E65100', icon: <RefreshCw size={11} style={{ animation: 'rh-spin 1s linear infinite' }} /> },
    Failed:     { bg: '#FFEBEE', color: '#C62828', icon: <AlertCircle size={11} /> },
  }[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: conf.bg, color: conf.color, fontSize: 10, fontWeight: 700, borderRadius: 100, padding: '2px 8px' }}>
      {conf.icon} {status}
    </span>
  );
}

// ─── Format helpers ───────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function describeFilters(f: Partial<ReportFilters>): string {
  const parts: string[] = [];
  if (f.datePreset && f.datePreset !== 'last-6-months') {
    const labels: Record<string, string> = { 'last-30': 'Last 30d', 'last-quarter': 'Last Quarter', 'ytd': 'YTD', 'custom': 'Custom' };
    parts.push(labels[f.datePreset] ?? f.datePreset);
  }
  if (f.vendorCategory) parts.push(f.vendorCategory);
  if (f.vendorName) parts.push(f.vendorName);
  if (f.complianceStatus) parts.push(f.complianceStatus);
  if (f.contractStatus) parts.push(f.contractStatus);
  return parts.join(' · ') || 'Default';
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ReportsHubProps {
  currentRole: string;
  roleColor: string;
  userName: string;
  userVendorName?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ReportsHub({ currentRole, roleColor, userName, userVendorName }: ReportsHubProps) {
  const [activeCard, setActiveCard]   = useState<ReportType | null>(null);
  const [isLoading, setIsLoading]       = useState(false);
  const [result, setResult]             = useState<AnyReportResult | null>(null);
  const [history, setHistory]           = useState<RecentReport[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Persist last-used filters per report type during session
  const filtersRef = useRef<Partial<Record<ReportType, ReportFilters>>>({});

  const visibleCards = getVisibleCards(currentRole, userVendorName);

  useEffect(() => {
    reportService.getRecentReports().then(h => { setHistory(h); setHistoryLoading(false); });

    // Handle deep-linking via route query params (e.g. /reports?type=contract&window=30)
    const searchParams = new URLSearchParams(window.location.search);
    const typeParam = searchParams.get('type') as ReportType | null;
    const categoryParam = searchParams.get('category');
    const statusParam = searchParams.get('status');
    const windowParam = searchParams.get('window');

    if (typeParam && REPORT_CARDS.some(c => c.id === typeParam)) {
      const initialFilters: ReportFilters = {
        ...DEFAULT_FILTERS,
        reportType: typeParam,
      };
      if (categoryParam) initialFilters.vendorCategory = categoryParam as ReportFilters['vendorCategory'];
      if (typeParam === 'contract' && windowParam === '30') initialFilters.contractStatus = 'Expiring Soon';
      else if (typeParam === 'procurement' && statusParam) initialFilters.procurementStatus = statusParam as ReportFilters['procurementStatus'];
      else if (typeParam === 'compliance' && statusParam) initialFilters.complianceStatus = statusParam as ReportFilters['complianceStatus'];

      filtersRef.current[typeParam] = initialFilters;
      setActiveCard(typeParam);
      handleGenerate(initialFilters);
    }
  }, []);

  const getFiltersForType = (type: ReportType): ReportFilters => ({
    ...DEFAULT_FILTERS,
    reportType: type,
    ...(filtersRef.current[type] ?? {}),
  });

  const handleSelectCard = (type: ReportType) => {
    setActiveCard(type);
    setResult(null);
  };

  const handleGenerate = async (filters: ReportFilters) => {
    setIsLoading(true);
    setResult(null);
    filtersRef.current[filters.reportType] = filters;

    try {
      let res: AnyReportResult;
      switch (filters.reportType) {
        case 'vendor-performance': res = await reportService.getVendorPerformanceReport(filters); break;
        case 'procurement':        res = await reportService.getProcurementReport(filters); break;
        case 'purchase-order':     res = await reportService.getPurchaseOrderReport(filters); break;
        case 'compliance':         res = await reportService.getComplianceReport(filters); break;
        case 'contract':           res = await reportService.getContractReport(filters); break;
        case 'executive-summary':  res = await reportService.getExecutiveSummaryReport(filters); break;
        default: throw new Error('Unknown report type');
      }
      setResult(res);

      // Save to history
      const card = REPORT_CARDS.find(c => c.id === filters.reportType);
      await reportService.saveReportHistory({
        reportType: filters.reportType,
        reportTitle: card?.title ?? filters.reportType,
        generatedBy: userName,
        generatedAt: new Date().toISOString(),
        filters,
        status: 'Completed',
        recordCount: (res as { meta: { recordCount: number } }).meta.recordCount,
        fileSizeKB: 40 + Math.floor(Math.random() * 120),
      });
      const refreshed = await reportService.getRecentReports();
      setHistory(refreshed);
    } catch (_e) {
      // silent fail in mock env
    } finally {
      setIsLoading(false);
    }
  };

  const activeCardConfig = activeCard ? REPORT_CARDS.find(c => c.id === activeCard) : null;

  const pill = (bg: string, color: string, text: string) => (
    <span style={{ background: bg, color, fontSize: 10, fontWeight: 700, borderRadius: 100, padding: '2px 8px' }}>{text}</span>
  );

  return (
    <div style={{ padding: '24px 28px', fontFamily: 'Inter, sans-serif', minHeight: '100vh', background: '#F9FAFB' }}>
      <style>{`@keyframes rh-spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: roleColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileBarChart2 size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827' }}>Reports & Export</h1>
            <p style={{ margin: 0, fontSize: 13, color: '#9CA3AF' }}>Generate intelligence reports across procurement, vendors, compliance, and contracts</p>
          </div>
        </div>
      </div>

      {/* ── Two-column layout when a card is active ───────────────────── */}
      {activeCard ? (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'start' }}>

          {/* Left: Filter Panel */}
          <div style={{ position: 'sticky', top: 80 }}>
            {/* Back to hub link */}
            <button onClick={() => { setActiveCard(null); setResult(null); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6B7280', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: 12, padding: 0 }}>
              <X size={13} /> Close and return to hub
            </button>

            {activeCardConfig && (
              <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E4E7EC', padding: '14px 16px', marginBottom: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: activeCardConfig.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <activeCardConfig.Icon size={18} color={activeCardConfig.color} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{activeCardConfig.title}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{activeCardConfig.description}</div>
                </div>
              </div>
            )}

            <ReportFilterPanel
              reportType={activeCard}
              roleColor={roleColor}
              initialFilters={getFiltersForType(activeCard)}
              isLoading={isLoading}
              onGenerate={handleGenerate}
              onClose={() => { setActiveCard(null); setResult(null); }}
            />
          </div>

          {/* Right: Preview / Empty State */}
          <div>
            {isLoading && (
              <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, border: `3px solid ${roleColor}30`, borderTopColor: roleColor, borderRadius: '50%', animation: 'rh-spin 0.8s linear infinite' }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Generating Report…</div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>Aggregating data across modules, applying filters</div>
              </div>
            )}
            {!isLoading && result && activeCard && (
              <ReportPreview
                reportType={activeCard}
                reportTitle={activeCardConfig?.title ?? activeCard}
                filters={filtersRef.current[activeCard] ?? getFiltersForType(activeCard)}
                result={result}
                roleColor={roleColor}
                currentRole={currentRole}
                userName={userName}
                onReset={() => handleGenerate(getFiltersForType(activeCard!))}
              />
            )}
            {!isLoading && !result && (
              <div style={{ background: '#fff', border: '2px dashed #E4E7EC', borderRadius: 12, padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                {activeCardConfig && <activeCardConfig.Icon size={40} color={activeCardConfig.color} />}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Configure your filters</div>
                  <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4, maxWidth: 360 }}>
                    Select your date range and apply any additional filters, then click <b>Generate Report</b> to see live results.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* ── Report Cards Grid ──────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 28 }}>
            {visibleCards.map(card => (
              <div key={card.id}
                style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s, transform 0.15s', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = ''; (e.currentTarget as HTMLDivElement).style.transform = ''; }}
              >
                {/* Card header */}
                <div style={{ background: card.bg, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `3px solid ${card.color}20` }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 8px ${card.color}30` }}>
                    <card.Icon size={20} color={card.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{card.title}</div>
                    <div style={{ fontSize: 10, color: card.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      {card.id.replace(/-/g, ' ')}
                    </div>
                  </div>
                </div>

                {/* Card body */}
                <div style={{ padding: '14px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>{card.description}</p>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 6 }}>Key Metrics</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {card.metrics.map((m, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#374151' }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: card.color, flexShrink: 0 }} />{m}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card footer */}
                <div style={{ padding: '12px 20px', borderTop: '1px solid #F1F5F9' }}>
                  <button
                    onClick={() => handleSelectCard(card.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: card.color, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    Generate Report <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Recent Reports Table ─────────────────────────────────── */}
          <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #E4E7EC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} color={roleColor} />
                <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>Recently Generated Reports</span>
              </div>
              {pill('#F3F4F6', '#6B7280', `${history.length} reports`)}
            </div>

            {historyLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Loading history…</div>
            ) : history.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                No reports generated yet. Use a report card above to generate your first report.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB' }}>
                      {['Report Name','Generated By','Date & Time','Filters Applied','Records','Status'].map((h, i) => (
                        <th key={i} style={{ padding: '10px 16px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #E4E7EC', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(r => {
                      const card = REPORT_CARDS.find(c => c.id === r.reportType);
                      return (
                        <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#FAFBFF')}
                          onMouseLeave={e => (e.currentTarget.style.background = '')}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {card && (
                                <div style={{ width: 28, height: 28, borderRadius: 7, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <card.Icon size={14} color={card.color} />
                                </div>
                              )}
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{r.reportTitle}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 12, color: '#374151' }}>{r.generatedBy}</td>
                          <td style={{ padding: '12px 16px', fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{fmtDate(r.generatedAt)}</td>
                          <td style={{ padding: '12px 16px', fontSize: 11, color: '#6B7280', maxWidth: 220 }}>
                            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{describeFilters(r.filters)}</span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 12, color: '#374151', fontWeight: 600 }}>{r.recordCount.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '12px 16px' }}><StatusBadge status={r.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
