import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import type {
  ReportType, ReportFilters,
  VendorPerformanceReportResult, ProcurementReportResult,
  PurchaseOrderReportResult, ComplianceReportResult,
  ContractReportResult, ExecutiveSummaryReportResult,
} from '../models/report';

type AnyReportResult =
  | VendorPerformanceReportResult | ProcurementReportResult
  | PurchaseOrderReportResult     | ComplianceReportResult
  | ContractReportResult          | ExecutiveSummaryReportResult;

function getFilename(reportType: string): string {
  const dateStr = new Date().toISOString().split('T')[0];
  const typeMap: Record<string, string> = {
    'vendor-performance': 'Vendor_Performance_Report',
    'procurement': 'Procurement_Report',
    'purchase-order': 'Purchase_Order_Report',
    'compliance': 'Compliance_Report',
    'contract': 'Contract_Report',
    'executive-summary': 'Executive_Summary_Report',
  };
  const prefix = typeMap[reportType] ?? 'VendorIQ_Report';
  return `${prefix}_${dateStr}.pdf`;
}

function fmtCurrency(val: number): string {
  if (val >= 10000000) return `Rs.${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `Rs.${(val / 100000).toFixed(1)} L`;
  if (val >= 1000) return `Rs.${(val / 1000).toFixed(0)} K`;
  return `Rs.${val}`;
}

export async function exportReportToPdf(
  reportType: ReportType,
  reportTitle: string,
  filters: ReportFilters,
  result: AnyReportResult,
  userName: string = 'System User',
  chartContainerRef?: HTMLElement | null
): Promise<string> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const dateStr = new Date().toLocaleString('en-IN');

  const primaryColor: [number, number, number] = [21, 101, 192]; // #1565C0
  const headerBgColor: [number, number, number] = [245, 247, 250];

  // 1. Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('VendorIQ ENTERPRISE', 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Vendor Reliability Intelligence Platform`, 14, 18);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(reportTitle.toUpperCase(), pageWidth - 14, 11, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${dateStr} | By: ${userName}`, pageWidth - 14, 18, { align: 'right' });

  let y = 30;

  // 2. Applied Filters Strip
  doc.setFillColor(...headerBgColor);
  doc.roundedRect(14, y, pageWidth - 28, 12, 2, 2, 'F');
  doc.setDrawColor(228, 231, 236);
  doc.roundedRect(14, y, pageWidth - 28, 12, 2, 2, 'S');

  const filterSummary = [
    `Range: ${filters.startDate || 'N/A'} to ${filters.endDate || 'N/A'}`,
    `Category: ${filters.vendorCategory || 'All'}`,
    `Records: ${result.meta.recordCount}`
  ].join('  |  ');

  doc.setTextColor(55, 65, 81);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Applied Filters:', 18, y + 7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(filterSummary, 44, y + 7.5);

  y += 18;

  // 3. KPI Summary Box Grid
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('KEY PERFORMANCE INDICATORS', 14, y);
  y += 5;

  let kpiItems: { label: string; value: string }[] = [];
  if (reportType === 'vendor-performance') {
    const res = result as VendorPerformanceReportResult;
    kpiItems = [
      { label: 'Vendors Evaluated', value: String(res.summary.totalVendors) },
      { label: 'Avg On-Time %', value: `${res.summary.onTimeDeliveryAvg}%` },
      { label: 'Avg Quality Score', value: `${res.summary.avgQualityScore}/100` },
      { label: 'High Risk Vendors', value: String(res.summary.highRiskCount) },
    ];
  } else if (reportType === 'procurement') {
    const res = result as ProcurementReportResult;
    kpiItems = [
      { label: 'Total Requests', value: String(res.summary.totalRequests) },
      { label: 'Approved Count', value: String(res.summary.approvedCount) },
      { label: 'Avg Processing', value: `${res.summary.avgProcessingDays}d` },
      { label: 'Est. Spend', value: fmtCurrency(res.summary.totalBudget) },
    ];
  } else if (reportType === 'purchase-order') {
    const res = result as PurchaseOrderReportResult;
    kpiItems = [
      { label: 'Total Orders', value: String(res.summary.totalPOs) },
      { label: 'Total Order Value', value: fmtCurrency(res.summary.totalValue) },
      { label: 'Fulfilled', value: String(res.summary.fulfilledCount) },
      { label: 'Delayed Orders', value: String(res.summary.delayedCount) },
    ];
  } else if (reportType === 'compliance') {
    const res = result as ComplianceReportResult;
    kpiItems = [
      { label: 'Overall Compliance', value: `${res.summary.complianceRate}%` },
      { label: 'Compliant Vendors', value: `${res.summary.compliantVendors}/${res.summary.totalVendors}` },
      { label: 'Expired Certs', value: String(res.summary.expiredCount) },
      { label: 'Pending Reviews', value: String(res.summary.pendingCount) },
    ];
  } else if (reportType === 'contract') {
    const res = result as ContractReportResult;
    kpiItems = [
      { label: 'Active Contracts', value: String(res.summary.activeCount) },
      { label: 'Portfolio Value', value: fmtCurrency(res.summary.totalValue) },
      { label: 'Expiring (30 Days)', value: String(res.summary.expiringIn30Days) },
      { label: 'Renewal Rate', value: `${res.summary.renewalRate}%` },
    ];
  } else if (reportType === 'executive-summary') {
    const res = result as ExecutiveSummaryReportResult;
    kpiItems = [
      { label: 'Active Vendors', value: String(res.vendorKPIs.activeVendors) },
      { label: 'Total Spend', value: fmtCurrency(res.poKPIs.totalSpend) },
      { label: 'Compliance Rate', value: `${res.complianceKPIs.overallComplianceRate}%` },
      { label: 'Expiring Contracts', value: String(res.contractKPIs.expiringIn30Days) },
    ];
  }

  const kpiBoxWidth = (pageWidth - 28 - (kpiItems.length - 1) * 4) / kpiItems.length;
  kpiItems.forEach((kpi, idx) => {
    const kpiX = 14 + idx * (kpiBoxWidth + 4);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(kpiX, y, kpiBoxWidth, 14, 2, 2, 'F');
    doc.setDrawColor(228, 231, 236);
    doc.roundedRect(kpiX, y, kpiBoxWidth, 14, 2, 2, 'S');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(156, 163, 175);
    doc.text(kpi.label.toUpperCase(), kpiX + 4, y + 4.5);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(kpi.value, kpiX + 4, y + 10.5);
  });

  y += 20;

  // 4. Capture On-Screen Charts if container available
  if (chartContainerRef) {
    try {
      const canvas = await html2canvas(chartContainerRef, { scale: 1.5, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 28;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (y + imgHeight > pageHeight - 30) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text('VISUAL ANALYTICS', 14, y);
      y += 4;

      doc.addImage(imgData, 'PNG', 14, y, imgWidth, Math.min(imgHeight, 90));
      y += Math.min(imgHeight, 90) + 10;
    } catch {
      // If canvas capture fails, continue silently
    }
  }

  // 5. Data Table Section via autoTable
  let tableHeaders: string[] = [];
  let tableRows: (string | number)[][] = [];

  if (reportType === 'vendor-performance') {
    const res = result as VendorPerformanceReportResult;
    tableHeaders = ['Vendor Name', 'Category', 'POs', 'On-Time %', 'Quality', 'Resp. Time', 'Reliability', 'Risk'];
    tableRows = res.rows.map(r => [
      r.vendorName, r.category, r.totalPOs, `${r.onTimeDeliveryRate}%`, `${r.qualityScore}/100`, `${r.avgResponseTimeHours}h`, String(r.reliabilityScore), r.riskLevel
    ]);
  } else if (reportType === 'procurement') {
    const res = result as ProcurementReportResult;
    tableHeaders = ['Department', 'Total Requests', 'Approved', 'Cancelled', 'Avg Approval Days', 'Spend Budget'];
    tableRows = res.byDepartment.map(d => [
      d.department, d.count, d.approved, d.rejected, `${d.avgDays}d`, fmtCurrency(d.budget)
    ]);
  } else if (reportType === 'purchase-order') {
    const res = result as PurchaseOrderReportResult;
    tableHeaders = ['PO Number', 'Vendor', 'Department', 'PO Date', 'Order Value', 'Status', 'Payment'];
    tableRows = res.rows.map(po => [
      po.poNumber, po.vendorName, po.department, po.poDate, fmtCurrency(po.totalCost), po.status, po.paymentStatus
    ]);
  } else if (reportType === 'compliance') {
    const res = result as ComplianceReportResult;
    tableHeaders = ['Vendor Name', 'Category', 'Checks', 'Compliant', 'Pending', 'Expired Cert', 'Rate %'];
    tableRows = res.byVendor.map(v => [
      v.vendorName, v.category, v.totalChecks, v.compliantCount, v.pendingCount, v.hasExpired ? 'YES' : 'NO', `${v.complianceRate}%`
    ]);
  } else if (reportType === 'contract') {
    const res = result as ContractReportResult;
    tableHeaders = ['Contract #', 'Title', 'Vendor', 'Value', 'End Date', 'Days Left', 'Status'];
    tableRows = res.rows.map(c => [
      c.contractNumber, c.contractTitle, c.vendorName, fmtCurrency(c.contractValue), c.endDate, `${c.daysToExpiry}d`, c.status
    ]);
  } else if (reportType === 'executive-summary') {
    const res = result as ExecutiveSummaryReportResult;
    tableHeaders = ['Top Vendor', 'Category', 'Reliability Score'];
    tableRows = res.topVendors.map(v => [v.vendorName, v.category, `${v.score}/100`]);
  }

  if (tableRows.length > 0) {
    if (y + 25 > pageHeight - 30) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text('DETAILED REPORT DATA', 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [tableHeaders],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [55, 65, 81],
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      margin: { left: 14, right: 14, top: 25, bottom: 20 },
      didDrawPage: () => {
        // Will handle page numbers in footer pass
      },
    });

    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    y = finalY + 10;
  }

  // 6. Insights Section
  if (result.insights.length > 0) {
    if (y + 30 > pageHeight - 30) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text('AUTOMATED BUSINESS INSIGHTS', 14, y);
    y += 5;

    doc.setFillColor(243, 244, 246);
    const insightsBoxHeight = Math.max(16, result.insights.length * 6 + 6);
    doc.roundedRect(14, y, pageWidth - 28, insightsBoxHeight, 2, 2, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(14, y, pageWidth - 28, insightsBoxHeight, 2, 2, 'S');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    result.insights.forEach((ins, idx) => {
      doc.text(`• ${ins}`, 18, y + 6 + idx * 6);
    });
  }

  // 7. Footer Pass for all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(229, 231, 235);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(156, 163, 175);
    doc.text('Confidential — Vendor Reliability Intelligence Platform', 14, pageHeight - 7);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
  }

  const filename = getFilename(reportType);
  doc.save(filename);
  return filename;
}
