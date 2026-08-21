import type {
  DeliveryPerformance,
  QualityEvaluation,
  CommunicationLog,
  ServiceRating,
  VendorPerformanceMetrics,
  VendorRanking
} from '../models/performance';

// ─── Initial Mock Data ────────────────────────────────────────────────────────

const VENDORS_LIST = [
  { name: 'TechCorp Solutions Pvt Ltd', category: 'IT Vendors' },
  { name: 'Global Logistics & Freight', category: 'Logistics Partners' },
  { name: 'EquipMax Machinery Ltd', category: 'Equipment Vendors' },
  { name: 'Zenith Office Supplies', category: 'Service Providers' },
  { name: 'NovaSec Systems Pvt Ltd', category: 'IT Vendors' },
  { name: 'SafeGuard Industries', category: 'Maintenance Vendors' },
  { name: 'Infra Build & Civil Co.', category: 'Service Providers' },
  { name: 'PrintMaster Communications', category: 'Service Providers' }
];

const MOCK_DELIVERIES: DeliveryPerformance[] = [
  { id: 1, poNumber: 'PO-2026-0001', vendorName: 'TechCorp Solutions Pvt Ltd', expectedDeliveryDate: '2026-01-10', actualDeliveryDate: '2026-01-10', delayDays: 0, deliveryStatus: 'On-Time', remarks: 'Delivered in full, on schedule.' },
  { id: 2, poNumber: 'PO-2026-0002', vendorName: 'TechCorp Solutions Pvt Ltd', expectedDeliveryDate: '2026-02-15', actualDeliveryDate: '2026-02-14', delayDays: 0, deliveryStatus: 'Early', remarks: 'Delivered 1 day early.' },
  { id: 3, poNumber: 'PO-2026-0003', vendorName: 'TechCorp Solutions Pvt Ltd', expectedDeliveryDate: '2026-03-20', actualDeliveryDate: '2026-03-22', delayDays: 2, deliveryStatus: 'Delayed', remarks: 'Courier transit delay.' },
  { id: 4, poNumber: 'PO-2026-0004', vendorName: 'Global Logistics & Freight', expectedDeliveryDate: '2026-01-15', actualDeliveryDate: '2026-01-15', delayDays: 0, deliveryStatus: 'On-Time', remarks: 'SLA compliant delivery.' },
  { id: 5, poNumber: 'PO-2026-0005', vendorName: 'Global Logistics & Freight', expectedDeliveryDate: '2026-02-20', actualDeliveryDate: '2026-02-23', delayDays: 3, deliveryStatus: 'Delayed', remarks: 'Traffic congestion on Highway.' },
  { id: 6, poNumber: 'PO-2026-0006', vendorName: 'EquipMax Machinery Ltd', expectedDeliveryDate: '2026-03-10', actualDeliveryDate: '2026-03-15', delayDays: 5, deliveryStatus: 'Delayed', remarks: 'Stock delay at factory.' },
  { id: 7, poNumber: 'PO-2026-0007', vendorName: 'Zenith Office Supplies', expectedDeliveryDate: '2026-02-28', actualDeliveryDate: '2026-02-28', delayDays: 0, deliveryStatus: 'On-Time' },
  { id: 8, poNumber: 'PO-2026-0008', vendorName: 'NovaSec Systems Pvt Ltd', expectedDeliveryDate: '2026-03-05', actualDeliveryDate: '2026-03-07', delayDays: 2, deliveryStatus: 'Delayed' },
  { id: 9, poNumber: 'PO-2026-0009', vendorName: 'SafeGuard Industries', expectedDeliveryDate: '2026-03-12', actualDeliveryDate: '2026-03-16', delayDays: 4, deliveryStatus: 'Delayed' },
  { id: 10, poNumber: 'PO-2026-0010', vendorName: 'Infra Build & Civil Co.', expectedDeliveryDate: '2026-04-01', actualDeliveryDate: '2026-03-31', delayDays: 0, deliveryStatus: 'Early' },
  { id: 11, poNumber: 'PO-2026-0011', vendorName: 'PrintMaster Communications', expectedDeliveryDate: '2026-04-10', actualDeliveryDate: '2026-04-10', delayDays: 0, deliveryStatus: 'On-Time' }
];

const MOCK_QUALITY_EVALUATIONS: QualityEvaluation[] = [
  { id: 1, poNumber: 'PO-2026-0001', vendorName: 'TechCorp Solutions Pvt Ltd', inspectionDate: '2026-01-11', materialQuality: 5, packagingQuality: 4, quantityAccuracy: 5, specificationCompliance: 5, productDefects: 'None', overallQualityRating: 4.75, inspectorRemarks: 'Excellent product batch.' },
  { id: 2, poNumber: 'PO-2026-0002', vendorName: 'TechCorp Solutions Pvt Ltd', inspectionDate: '2026-02-16', materialQuality: 4, packagingQuality: 5, quantityAccuracy: 5, specificationCompliance: 4, productDefects: 'None', overallQualityRating: 4.5, inspectorRemarks: 'Fulfillment was correct.' },
  { id: 3, poNumber: 'PO-2026-0004', vendorName: 'Global Logistics & Freight', inspectionDate: '2026-01-16', materialQuality: 4, packagingQuality: 4, quantityAccuracy: 4, specificationCompliance: 4, productDefects: 'None', overallQualityRating: 4.0, inspectorRemarks: 'Meets requirements' },
  { id: 4, poNumber: 'PO-2026-0006', vendorName: 'EquipMax Machinery Ltd', inspectionDate: '2026-03-16', materialQuality: 3, packagingQuality: 3, quantityAccuracy: 4, specificationCompliance: 3, productDefects: 'Hydraulic leak in one widget copy', overallQualityRating: 3.25, inspectorRemarks: 'Defect identified, unit returned.' }
];

const MOCK_COMMUNICATION_LOGS: CommunicationLog[] = [
  { id: 1, poNumber: 'PO-2026-0001', vendorName: 'TechCorp Solutions Pvt Ltd', messageSentTime: '2026-01-02T10:00:00Z', vendorResponseTime: '2026-01-02T11:30:00Z', responseDurationHours: 1.5, communicationStatus: 'Responded', remarks: 'Quick confirmation.' },
  { id: 2, poNumber: 'PO-2026-0002', vendorName: 'TechCorp Solutions Pvt Ltd', messageSentTime: '2026-02-05T09:00:00Z', vendorResponseTime: '2026-02-05T12:00:00Z', responseDurationHours: 3.0, communicationStatus: 'Responded' },
  { id: 3, poNumber: 'PO-2026-0004', vendorName: 'Global Logistics & Freight', messageSentTime: '2026-01-06T14:00:00Z', vendorResponseTime: '2026-01-06T18:30:00Z', responseDurationHours: 4.5, communicationStatus: 'Responded' },
  { id: 4, poNumber: 'PO-2026-0006', vendorName: 'EquipMax Machinery Ltd', messageSentTime: '2026-03-01T11:00:00Z', vendorResponseTime: undefined, responseDurationHours: undefined, communicationStatus: 'SLA Breach', remarks: 'Failed to reply in 24 hrs.' }
];

const MOCK_SERVICE_RATINGS: ServiceRating[] = [
  { id: 1, poNumber: 'PO-2026-0001', vendorName: 'TechCorp Solutions Pvt Ltd', professionalism: 5, customerSupport: 5, documentationQuality: 4, flexibility: 4, communicationEffectiveness: 5, issueResolution: 5, overallServiceRating: 4.67, comments: 'Extremely professional customer support.' },
  { id: 2, poNumber: 'PO-2026-0004', vendorName: 'Global Logistics & Freight', professionalism: 4, customerSupport: 4, documentationQuality: 4, flexibility: 3, communicationEffectiveness: 4, issueResolution: 4, overallServiceRating: 3.83, comments: 'Good service, could improve flexibility.' }
];

// Pre-computed monthly score histories for charts (Jan - Jun 2026)
const MOCK_TRENDS: Record<string, { month: string; overallScore: number }[]> = {
  'TechCorp Solutions Pvt Ltd': [
    { month: 'Jan', overallScore: 90 }, { month: 'Feb', overallScore: 92 }, { month: 'Mar', overallScore: 93 },
    { month: 'Apr', overallScore: 94 }, { month: 'May', overallScore: 93 }, { month: 'Jun', overallScore: 95 }
  ],
  'Global Logistics & Freight': [
    { month: 'Jan', overallScore: 84 }, { month: 'Feb', overallScore: 85 }, { month: 'Mar', overallScore: 84 },
    { month: 'Apr', overallScore: 86 }, { month: 'May', overallScore: 88 }, { month: 'Jun', overallScore: 89 }
  ],
  'EquipMax Machinery Ltd': [
    { month: 'Jan', overallScore: 78 }, { month: 'Feb', overallScore: 76 }, { month: 'Mar', overallScore: 79 },
    { month: 'Apr', overallScore: 80 }, { month: 'May', overallScore: 78 }, { month: 'Jun', overallScore: 81 }
  ],
  'Zenith Office Supplies': [
    { month: 'Jan', overallScore: 88 }, { month: 'Feb', overallScore: 89 }, { month: 'Mar', overallScore: 90 },
    { month: 'Apr', overallScore: 91 }, { month: 'May', overallScore: 92 }, { month: 'Jun', overallScore: 92 }
  ],
  'NovaSec Systems Pvt Ltd': [
    { month: 'Jan', overallScore: 80 }, { month: 'Feb', overallScore: 82 }, { month: 'Mar', overallScore: 81 },
    { month: 'Apr', overallScore: 83 }, { month: 'May', overallScore: 82 }, { month: 'Jun', overallScore: 83 }
  ],
  'SafeGuard Industries': [
    { month: 'Jan', overallScore: 75 }, { month: 'Feb', overallScore: 77 }, { month: 'Mar', overallScore: 76 },
    { month: 'Apr', overallScore: 78 }, { month: 'May', overallScore: 77 }, { month: 'Jun', overallScore: 78 }
  ]
};

// Global states loaded into memory
let deliveries = [...MOCK_DELIVERIES];
let qualityEvaluations = [...MOCK_QUALITY_EVALUATIONS];
let communicationLogs = [...MOCK_COMMUNICATION_LOGS];
let serviceRatings = [...MOCK_SERVICE_RATINGS];
let metrics: VendorPerformanceMetrics[] = [];
let rankings: VendorRanking[] = [];

// ─── Score Calculation Utility ───────────────────────────────────────────────

function recalculateMetricsAndRankings() {
  const newMetrics: VendorPerformanceMetrics[] = [];

  for (const vendor of VENDORS_LIST) {
    const vName = vendor.name;

    // 1. Delivery rate Calculation
    const vDeliveries = deliveries.filter(d => d.vendorName === vName);
    let onTimeDeliveryRate = 100;
    let delayedDeliveryCount = 0;
    if (vDeliveries.length > 0) {
      const fulfilled = vDeliveries.filter(d => d.deliveryStatus === 'On-Time' || d.deliveryStatus === 'Early').length;
      onTimeDeliveryRate = Math.round((fulfilled / vDeliveries.length) * 100);
      delayedDeliveryCount = vDeliveries.filter(d => d.deliveryStatus === 'Delayed').length;
    } else {
      // Default fallback based on seeded reliability
      if (vName.includes('TechCorp')) onTimeDeliveryRate = 95;
      else if (vName.includes('Global')) onTimeDeliveryRate = 88;
      else if (vName.includes('Zenith')) onTimeDeliveryRate = 92;
      else if (vName.includes('NovaSec')) onTimeDeliveryRate = 85;
      else if (vName.includes('EquipMax')) onTimeDeliveryRate = 80;
      else onTimeDeliveryRate = 82;
    }

    // 2. Quality Evaluation Rating
    const vQuality = qualityEvaluations.filter(q => q.vendorName === vName);
    let avgQualityRating = 4.0;
    if (vQuality.length > 0) {
      const sum = vQuality.reduce((acc, q) => acc + q.overallQualityRating, 0);
      avgQualityRating = Number((sum / vQuality.length).toFixed(2));
    } else {
      // Setup seed averages
      if (vName.includes('TechCorp')) avgQualityRating = 4.6;
      else if (vName.includes('Zenith')) avgQualityRating = 4.5;
      else if (vName.includes('Global')) avgQualityRating = 4.1;
      else if (vName.includes('NovaSec')) avgQualityRating = 4.0;
      else if (vName.includes('EquipMax')) avgQualityRating = 3.6;
      else avgQualityRating = 3.8;
    }

    // 3. Communication duration and response compliance
    const vCommLog = communicationLogs.filter(c => c.vendorName === vName);
    let avgResponseTimeHours = 4.0;
    let commScore = 80;
    if (vCommLog.length > 0) {
      const responded = vCommLog.filter(c => c.communicationStatus === 'Responded');
      const sumHours = responded.reduce((acc, c) => acc + (c.responseDurationHours ?? 4.0), 0);
      avgResponseTimeHours = responded.length > 0 ? Number((sumHours / responded.length).toFixed(1)) : 4.0;
      const onTimeComm = vCommLog.filter(c => c.communicationStatus !== 'SLA Breach').length;
      commScore = Math.round((onTimeComm / vCommLog.length) * 100);
    } else {
      if (vName.includes('TechCorp')) { avgResponseTimeHours = 1.8; commScore = 96; }
      else if (vName.includes('Zenith')) { avgResponseTimeHours = 2.0; commScore = 94; }
      else if (vName.includes('Global')) { avgResponseTimeHours = 3.5; commScore = 88; }
      else if (vName.includes('NovaSec')) { avgResponseTimeHours = 3.0; commScore = 85; }
      else { avgResponseTimeHours = 4.5; commScore = 78; }
    }

    // 4. Service Rating
    const vService = serviceRatings.filter(s => s.vendorName === vName);
    let avgServiceRating = 4.0;
    if (vService.length > 0) {
      const sum = vService.reduce((acc, s) => acc + s.overallServiceRating, 0);
      avgServiceRating = Number((sum / vService.length).toFixed(2));
    } else {
      if (vName.includes('TechCorp')) avgServiceRating = 4.5;
      else if (vName.includes('Zenith')) avgServiceRating = 4.4;
      else if (vName.includes('Global')) avgServiceRating = 4.0;
      else if (vName.includes('NovaSec')) avgServiceRating = 3.9;
      else avgServiceRating = 3.7;
    }

    // 5. Completion Rate
    let orderCompletionRate = 100;
    if (vDeliveries.length > 0) {
      // completion implies not failed or not delayed
      const completed = vDeliveries.filter(d => d.deliveryStatus !== 'Delayed').length;
      orderCompletionRate = Math.round((completed / vDeliveries.length) * 100);
    } else {
      if (vName.includes('TechCorp')) orderCompletionRate = 98;
      else if (vName.includes('Global')) orderCompletionRate = 92;
      else if (vName.includes('Zenith')) orderCompletionRate = 95;
      else orderCompletionRate = 90;
    }

    // Weighted Overall Score:
    // delivery (30%) + quality (30%) + communication (20%) + service (20%)
    const deliveryComp = onTimeDeliveryRate;
    const qualityComp = avgQualityRating * 20; // 0-100
    const communicationComp = commScore;
    const serviceComp = avgServiceRating * 20; // 0-100

    const overallPerformanceScore = Math.round(
      (deliveryComp * 0.3) +
      (qualityComp * 0.3) +
      (communicationComp * 0.2) +
      (serviceComp * 0.2)
    );

    newMetrics.push({
      vendorName: vName,
      onTimeDeliveryRate,
      delayedDeliveryCount,
      avgQualityRating,
      avgResponseTimeHours,
      orderCompletionRate,
      overallPerformanceScore
    });
  }

  // Update global cache
  metrics = newMetrics;

  // Re-compute Rankings
  const newRankings: VendorRanking[] = VENDORS_LIST.map(v => {
    const vMetric = metrics.find(m => m.vendorName === v.name);
    // Find rates
    const vDeliveries = deliveries.filter(d => d.vendorName === v.name);
    const delRatingVal = vMetric ? vMetric.onTimeDeliveryRate : 85;

    const vQuality = qualityEvaluations.filter(q => q.vendorName === v.name);
    const qRatingVal = vMetric ? Math.round(vMetric.avgQualityRating * 20) : 80;

    const vCommLog = communicationLogs.filter(c => c.vendorName === v.name);
    const cOnTime = vCommLog.length > 0 ? (vCommLog.filter(c => c.communicationStatus !== 'SLA Breach').length / vCommLog.length) * 100 : 85;
    const commRatingVal = Math.round(cOnTime);

    const vService = serviceRatings.filter(s => s.vendorName === v.name);
    let avgServiceRating = 4.0;
    if (vService.length > 0) {
      const sum = vService.reduce((acc, s) => acc + s.overallServiceRating, 0);
      avgServiceRating = Number((sum / vService.length).toFixed(2));
    } else {
      if (v.name.includes('TechCorp')) avgServiceRating = 4.5;
      else if (v.name.includes('Zenith')) avgServiceRating = 4.4;
      else if (v.name.includes('Global')) avgServiceRating = 4.0;
      else if (v.name.includes('NovaSec')) avgServiceRating = 3.9;
      else avgServiceRating = 3.7;
    }
    const sRatingVal = Math.round(avgServiceRating * 20);

    const overallScore = vMetric ? vMetric.overallPerformanceScore : 82;

    return {
      rankPosition: 1,
      vendorName: v.name,
      category: v.category,
      overallScore,
      deliveryScore: delRatingVal,
      qualityScore: qRatingVal,
      communicationScore: commRatingVal,
      serviceScore: sRatingVal
    };
  });

  // Sort by overallScore DESC
  newRankings.sort((a, b) => b.overallScore - a.overallScore);
  // Re-assign ranks
  newRankings.forEach((r, idx) => {
    r.rankPosition = idx + 1;
  });

  rankings = newRankings;
}

// Initial calculation
recalculateMetricsAndRankings();

// Simulates async latency
const delay = <T>(data: T, ms = 150): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(data), ms));

// ─── Service Methods ─────────────────────────────────────────────────────────

export const performanceService = {
  getDeliveries(vendorName?: string): Promise<DeliveryPerformance[]> {
    if (vendorName) return delay(deliveries.filter(d => d.vendorName === vendorName));
    return delay([...deliveries]);
  },

  getQualityEvaluations(vendorName?: string): Promise<QualityEvaluation[]> {
    if (vendorName) return delay(qualityEvaluations.filter(q => q.vendorName === vendorName));
    return delay([...qualityEvaluations]);
  },

  getCommunicationLogs(vendorName?: string): Promise<CommunicationLog[]> {
    if (vendorName) return delay(communicationLogs.filter(c => c.vendorName === vendorName));
    return delay([...communicationLogs]);
  },

  getServiceRatings(vendorName?: string): Promise<ServiceRating[]> {
    if (vendorName) return delay(serviceRatings.filter(s => s.vendorName === vendorName));
    return delay([...serviceRatings]);
  },

  getMetrics(vendorName?: string): Promise<VendorPerformanceMetrics[]> {
    if (vendorName) return delay(metrics.filter(m => m.vendorName === vendorName));
    return delay([...metrics]);
  },

  getRankings(): Promise<VendorRanking[]> {
    return delay([...rankings]);
  },

  getMonthlyTrends(vendorName: string): Promise<{ month: string; overallScore: number }[]> {
    // Fallback if vendor trends don't exist
    const series = MOCK_TRENDS[vendorName] || [
      { month: 'Jan', overallScore: 80 }, { month: 'Feb', overallScore: 81 }, { month: 'Mar', overallScore: 82 },
      { month: 'Apr', overallScore: 82 }, { month: 'May', overallScore: 83 }, { month: 'Jun', overallScore: 84 }
    ];
    return delay(series);
  },

  getVendors(): Promise<{ name: string; category: string }[]> {
    return delay([...VENDORS_LIST]);
  },

  getPendingQualityPOs(): Promise<DeliveryPerformance[]> {
    const evaluatedPONumbers = new Set(qualityEvaluations.map(q => q.poNumber));
    const pending = deliveries.filter(d => !evaluatedPONumbers.has(d.poNumber));
    return delay(pending);
  },

  getEligibleServicePOs(): Promise<{ delivery: DeliveryPerformance; isRated: boolean; rating?: ServiceRating }[]> {
    const ratingMap = new Map<string, ServiceRating>();
    serviceRatings.forEach(s => ratingMap.set(s.poNumber, s));

    const eligible = deliveries.map(d => ({
      delivery: d,
      isRated: ratingMap.has(d.poNumber),
      rating: ratingMap.get(d.poNumber)
    }));

    return delay(eligible);
  },

  // ── Write Actions (dynamic updating) ──────────────────────────────────────

  addDelivery(record: Omit<DeliveryPerformance, 'id'>): Promise<DeliveryPerformance> {
    const next: DeliveryPerformance = {
      ...record,
      id: deliveries.length + 1
    };
    deliveries.push(next);
    recalculateMetricsAndRankings();
    return delay(next);
  },

  addQualityEvaluation(record: Omit<QualityEvaluation, 'id' | 'overallQualityRating'>): Promise<QualityEvaluation> {
    const overallQualityRating = Number(
      ((record.materialQuality + record.packagingQuality + record.quantityAccuracy + record.specificationCompliance) / 4).toFixed(2)
    );
    const next: QualityEvaluation = {
      ...record,
      id: qualityEvaluations.length + 1,
      overallQualityRating
    };
    qualityEvaluations.push(next);
    recalculateMetricsAndRankings();
    return delay(next);
  },

  addCommunicationLog(record: Omit<CommunicationLog, 'id'>): Promise<CommunicationLog> {
    const next: CommunicationLog = {
      ...record,
      id: communicationLogs.length + 1
    };
    communicationLogs.push(next);
    recalculateMetricsAndRankings();
    return delay(next);
  },

  addServiceRating(record: Omit<ServiceRating, 'id' | 'overallServiceRating'>): Promise<ServiceRating> {
    const overallServiceRating = Number(
      ((record.professionalism + record.customerSupport + record.documentationQuality + record.flexibility + record.communicationEffectiveness + record.issueResolution) / 6).toFixed(2)
    );
    const next: ServiceRating = {
      ...record,
      id: serviceRatings.length + 1,
      overallServiceRating
    };
    serviceRatings.push(next);
    recalculateMetricsAndRankings();
    return delay(next);
  }
};

/** Helper to format fractional response duration hours into e.g. "2h 30m" */
export function formatDurationHours(hours?: number): string {
  if (hours === undefined || hours === null || isNaN(hours) || hours < 0) return "N/A";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

