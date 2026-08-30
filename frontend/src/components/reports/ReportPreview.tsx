import { useState, useRef } from 'react';
import { Download, Share2, Printer, Calendar, Filter, FileSpreadsheet, FileText, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import type {
  ReportType, ReportFilters,
  VendorPerformanceReportResult, ProcurementReportResult,
  PurchaseOrderReportResult, ComplianceReportResult,
  ContractReportResult, ExecutiveSummaryReportResult,
} from '../../models/report';
import { VendorPerformanceReportBody } from './reports/VendorPerformanceReportBody';
import { ProcurementReportBody }       from './reports/ProcurementReportBody';
import { PurchaseOrderReportBody }     from './reports/PurchaseOrderReportBody';
import { ComplianceReportBody }        from './reports/ComplianceReportBody';
import { ContractReportBody }          from './reports/ContractReportBody';
import { ExecutiveSummaryReportBody }  from './reports/ExecutiveSummaryReportBody';
import { exportReportToPdf }           from '../../utils/reportPdfExporter';
import { exportReportToExcel }         from '../../utils/reportExcelExporter';
import { notificationService }         from '../../services/notificationService';
import { reportService }               from '../../services/reportService';

type AnyReportResult =
  | VendorPerformanceReportResult | ProcurementReportResult
  | PurchaseOrderReportResult     | ComplianceReportResult
  | ContractReportResult          | ExecutiveSummaryReportResult;

interface ReportPreviewProps {
  reportType: ReportType;
  reportTitle: string;
  filters: ReportFilters;
  result: AnyReportResult;
  roleColor: string;
  currentRole?: string;
  userName?: string;
  onReset?: () => void;
}

function describeFilters(filters: ReportFilters): string {
  const parts: string[] = [];
  if (filters.vendorCategory) parts.push(filters.vendorCategory);
  if (filters.vendorName)     parts.push(`Vendor: ${filters.vendorName}`);
  if (filters.procurementStatus) parts.push(`PR: ${filters.procurementStatus}`);
  if (filters.poStatus)       parts.push(`PO: ${filters.poStatus}`);
  if (filters.contractStatus) parts.push(`Contract: ${filters.contractStatus}`);
  if (filters.complianceStatus) parts.push(`Compliance: ${filters.complianceStatus}`);
  if (filters.departments?.length) parts.push(`Depts: ${filters.departments.join(', ')}`);
  if ((filters.reliabilityScoreMin ?? 0) > 0 || (filters.reliabilityScoreMax ?? 100) < 100)
    parts.push(`Score: ${filters.reliabilityScoreMin ?? 0}–${filters.reliabilityScoreMax ?? 100}`);
  return parts.length ? parts.join(' · ') : 'Default (last 6 months, all vendors)';
}

const PRESET_LABELS: Record<string, string> = {
  'last-30': 'Last 30 Days', 'last-quarter': 'Last Quarter',
  'last-6-months': 'Last 6 Months', 'ytd': 'Year-to-Date', 'custom': 'Custom Range',
};

export function ReportPreview({
  reportType, reportTitle, filters, result, roleColor,
  currentRole = 'Administrator', userName = 'Hrithik', onReset
}: ReportPreviewProps) {
  const [exportingFormat, setExportingFormat] = useState<'pdf' | 'excel' | null>(null);
  const [toastMessage, setToastMessage]       = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const now = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  const { meta } = result as { meta: { dateRange: { from: string; to: string }; recordCount: number } };
  const recordCount = meta?.recordCount ?? 0;
  const isDisabled = recordCount === 0;

  // Role export check
  const isVendor = currentRole === 'Vendor';
  const isExportAllowed = !isVendor || reportType === 'vendor-performance';

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleExportPdf = async () => {
    if (isDisabled || !isExportAllowed || exportingFormat) return;
    setExportingFormat('pdf');
    try {
      const filename = await exportReportToPdf(
        reportType,
        reportTitle,
        filters,
        result,
        userName,
        bodyRef.current
      );

      // Trigger In-App Notification
      notificationService.addNotification({
        userId: isVendor ? 'vendor-001' : 'admin-001',
        notificationType: 'REPORT_GENERATED',
        title: `Report Exported — ${reportTitle}`,
        description: `Your ${reportTitle} has been generated and downloaded as ${filename}.`,
        relatedModule: 'Reports',
        priority: 'LOW',
        deliveryMethod: ['IN_APP'],
      });

      // Save to recent reports history
      await reportService.saveReportHistory({
        reportType,
        reportTitle,
        generatedBy: userName,
        generatedAt: new Date().toISOString(),
        filters,
        status: 'Completed',
        recordCount,
        fileSizeKB: Math.floor(80 + Math.random() * 120),
      });

      showToast(`Exported ${filename} successfully!`, 'success');
    } catch (err) {
      showToast('Failed to generate PDF. Please retry.', 'error');
    } finally {
      setExportingFormat(null);
    }
  };

  const handleExportExcel = async () => {
    if (isDisabled || !isExportAllowed || exportingFormat) return;
    setExportingFormat('excel');
    try {
      const filename = exportReportToExcel(
        reportType,
        reportTitle,
        filters,
        result,
        userName
      );

      // Trigger In-App Notification
      notificationService.addNotification({
        userId: isVendor ? 'vendor-001' : 'admin-001',
        notificationType: 'REPORT_GENERATED',
        title: `Excel Report Generated — ${reportTitle}`,
        description: `Your ${reportTitle} dataset has been exported as ${filename}.`,
        relatedModule: 'Reports',
        priority: 'LOW',
        deliveryMethod: ['IN_APP'],
      });

      // Save to recent reports history
      await reportService.saveReportHistory({
        reportType,
        reportTitle,
        generatedBy: userName,
        generatedAt: new Date().toISOString(),
        filters,
        status: 'Completed',
        recordCount,
        fileSizeKB: Math.floor(35 + Math.random() * 60),
      });

      showToast(`Exported ${filename} successfully!`, 'success');
    } catch (err) {
      showToast('Failed to export Excel file. Please retry.', 'error');
    } finally {
      setExportingFormat(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const url = `${window.location.origin}/reports?type=${reportType}`;
    navigator.clipboard.writeText(url);
    showToast('Report link copied to clipboard!', 'success');
  };

  const dateLabel = filters.datePreset === 'custom'
    ? `${filters.startDate} → ${filters.endDate}`
    : PRESET_LABELS[filters.datePreset ?? 'last-6-months'];

  function renderBody() {
    switch (reportType) {
      case 'vendor-performance':
        return <VendorPerformanceReportBody data={result as VendorPerformanceReportResult} onReset={onReset} />;
      case 'procurement':
        return <ProcurementReportBody data={result as ProcurementReportResult} onReset={onReset} />;
      case 'purchase-order':
        return <PurchaseOrderReportBody data={result as PurchaseOrderReportResult} onReset={onReset} />;
      case 'compliance':
        return <ComplianceReportBody data={result as ComplianceReportResult} onReset={onReset} />;
      case 'contract':
        return <ContractReportBody data={result as ContractReportResult} onReset={onReset} />;
      case 'executive-summary':
        return <ExecutiveSummaryReportBody data={result as ExecutiveSummaryReportResult} />;
      default:
        return null;
    }
  }

  return (
    <div className="report-preview-container" style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 12, overflow: 'hidden', border: '1px solid #E4E7EC', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', position: 'relative' }}>
      <style>{`@keyframes rp-spin { to { transform: rotate(360deg); } }`}</style>

      {/* Toast Overlay */}
      {toastMessage && (
        <div style={{
          position: 'absolute', top: 16, right: 16, zIndex: 100,
          background: toastMessage.type === 'success' ? '#10B981' : '#EF4444',
          color: '#fff', padding: '10px 18px', borderRadius: 8,
          fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
        }}>
          {toastMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toastMessage.text}
        </div>
      )}

      {/* ── Report Header Bar ──────────────────────────────────────────────── */}
      <div style={{ background: `linear-gradient(135deg, ${roleColor} 0%, ${roleColor}cc 100%)`, padding: '18px 24px', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 16 }}>📊</span>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: '-0.2px' }}>{reportTitle}</h2>
                <div style={{ fontSize: 11, opacity: 0.8 }}>VendorIQ Enterprise · {dateLabel}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, opacity: 0.85, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={10} /> Generated: {now}
              </span>
              <span>Records: {recordCount}</span>
              <span>Period: {meta.dateRange.from} → {meta.dateRange.to}</span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="no-print" style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {/* Export PDF */}
            <button
              onClick={handleExportPdf}
              disabled={isDisabled || !isExportAllowed || exportingFormat !== null}
              title={!isExportAllowed ? 'Export restricted for vendor role' : isDisabled ? 'No data to export' : 'Export professional PDF report'}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: isDisabled || !isExportAllowed ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.25)',
                border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: 7, padding: '7px 13px', fontSize: 12, fontWeight: 700, color: '#fff',
                cursor: isDisabled || !isExportAllowed ? 'not-allowed' : 'pointer',
                opacity: isDisabled || !isExportAllowed ? 0.5 : 1,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!isDisabled && isExportAllowed) e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; }}
              onMouseLeave={e => { if (!isDisabled && isExportAllowed) e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
            >
              {exportingFormat === 'pdf' ? (
                <RefreshCw size={13} style={{ animation: 'rp-spin 0.8s linear infinite' }} />
              ) : (
                <FileText size={13} />
              )}
              {exportingFormat === 'pdf' ? 'Generating PDF…' : 'Export PDF'}
            </button>

            {/* Export Excel */}
            <button
              onClick={handleExportExcel}
              disabled={isDisabled || !isExportAllowed || exportingFormat !== null}
              title={!isExportAllowed ? 'Export restricted for vendor role' : isDisabled ? 'No data to export' : 'Export full data to Excel'}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: isDisabled || !isExportAllowed ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.25)',
                border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: 7, padding: '7px 13px', fontSize: 12, fontWeight: 700, color: '#fff',
                cursor: isDisabled || !isExportAllowed ? 'not-allowed' : 'pointer',
                opacity: isDisabled || !isExportAllowed ? 0.5 : 1,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!isDisabled && isExportAllowed) e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; }}
              onMouseLeave={e => { if (!isDisabled && isExportAllowed) e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
            >
              {exportingFormat === 'excel' ? (
                <RefreshCw size={13} style={{ animation: 'rp-spin 0.8s linear infinite' }} />
              ) : (
                <FileSpreadsheet size={13} />
              )}
              {exportingFormat === 'excel' ? 'Exporting Excel…' : 'Export Excel'}
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              title="Print report preview"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 7, padding: '7px 12px', fontSize: 12, fontWeight: 600, color: '#fff',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
            >
              <Printer size={13} /> Print
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              title="Share link to report"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 7, padding: '7px 12px', fontSize: 12, fontWeight: 600, color: '#fff',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
            >
              <Share2 size={13} /> Share
            </button>
          </div>
        </div>

        {/* Applied Filters strip */}
        <div style={{ marginTop: 10, background: 'rgba(255,255,255,0.12)', borderRadius: 6, padding: '5px 12px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={10} />
          <span style={{ fontWeight: 700 }}>Filters applied:</span>
          <span style={{ opacity: 0.9 }}>{describeFilters(filters)}</span>
        </div>
      </div>

      {/* ── Report Body ───────────────────────────────────────────────────── */}
      <div ref={bodyRef} className="report-body-content" style={{ background: '#F9FAFB', padding: '0 24px 24px' }}>
        {renderBody()}
      </div>
    </div>
  );
}
