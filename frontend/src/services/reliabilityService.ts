/**
 * ReliabilityService
 * ==================
 * Simulates the future FastAPI calculation engine client-side.
 * All business calculations live here so that swapping this mock service
 * for real HTTP/REST API calls will require editing only this file.
 *
 * All public methods return RxJS-compatible Observables shaped like future REST responses.
 *
 * Automatic Reactivity:
 * Listens to write updates in performanceService & procurementService and
 * automatically triggers recalculation, mirroring the automated backend workflow
 * with zero manual score entry anywhere.
 */

import type {
  VendorReliability,
  ReliabilityFactors,
  ReliabilityTrendPoint,
  ProcurementRecommendation,
  RiskLevel,
  RecommendationStatus
} from '../models/reliability';

import { performanceService } from './performanceService';
import { procurementService } from './procurementService';

// ─── Lightweight RxJS-compatible Observable & Subject implementation ────────

export class Observable<T> {
  constructor(
    private subscribeFn: (subscriber: { next: (val: T) => void; complete?: () => void }) => void
  ) {}

  subscribe(next: (val: T) => void): { unsubscribe: () => void } {
    let unsubscribed = false;
    this.subscribeFn({
      next: (val: T) => {
        if (!unsubscribed) next(val);
      }
    });
    return {
      unsubscribe: () => {
        unsubscribed = true;
      }
    };
  }

  toPromise(): Promise<T> {
    return new Promise((resolve) => {
      this.subscribe((val) => resolve(val));
    });
  }

  then<TResult1 = T>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null
  ): Promise<TResult1> {
    return this.toPromise().then(onfulfilled);
  }
}

export class BehaviorSubject<T> {
  private subscribers: Array<(val: T) => void> = [];

  constructor(private _value: T) {}

  getValue(): T {
    return this._value;
  }

  subscribe(next: (val: T) => void): { unsubscribe: () => void } {
    this.subscribers.push(next);
    next(this._value);
    return {
      unsubscribe: () => {
        this.subscribers = this.subscribers.filter(s => s !== next);
      }
    };
  }

  next(val: T): void {
    this._value = val;
    this.subscribers.forEach(sub => sub(val));
  }

  asObservable(): Observable<T> {
    return new Observable<T>((subscriber) => {
      this.subscribe((v) => subscriber.next(v));
    });
  }
}

export function of<T>(value: T): Observable<T> {
  return new Observable<T>((subscriber) => {
    subscriber.next(value);
    if (subscriber.complete) subscriber.complete();
  });
}

// ─── Vendor Master List ──────────────────────────────────────────────────────

interface MasterVendor {
  id: number;
  name: string;
  category: string;
}

const MASTER_VENDORS: MasterVendor[] = [
  { id: 1, name: 'TechCorp Solutions Pvt Ltd', category: 'IT Vendors' },
  { id: 2, name: 'Global Logistics & Freight', category: 'Logistics Partners' },
  { id: 4, name: 'Zenith Office Supplies', category: 'Service Providers' },
  { id: 5, name: 'EquipMax Machinery Ltd', category: 'Equipment Vendors' },
  { id: 9, name: 'NovaSec Systems Pvt Ltd', category: 'IT Vendors' },
  { id: 10, name: 'SafeGuard Industries', category: 'Maintenance Vendors' },
  { id: 11, name: 'Infra Build & Civil Co.', category: 'Service Providers' },
  { id: 12, name: 'PrintMaster Communications', category: 'Service Providers' }
];

// Baseline contract compliance scores (0-100) per vendor
const BASELINE_COMPLIANCE: Record<string, number> = {
  'TechCorp Solutions Pvt Ltd': 98,
  'Zenith Office Supplies': 96,
  'Global Logistics & Freight': 92,
  'Infra Build & Civil Co.': 90,
  'NovaSec Systems Pvt Ltd': 88,
  'PrintMaster Communications': 85,
  'EquipMax Machinery Ltd': 58,
  'SafeGuard Industries': 50
};

// 12-Month Trend Seed Points for 6+ Vendors (Aug 2025 – Jul 2026)
const TREND_PERIODS = [
  'Aug 2025', 'Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026',
  'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026'
];

const MOCK_TRENDS_DATA: Record<string, ReliabilityTrendPoint[]> = {
  'TechCorp Solutions Pvt Ltd': TREND_PERIODS.map((period, idx) => {
    const score = Math.min(98, 91 + Math.floor(idx * 0.45));
    return {
      vendorId: 1,
      period,
      reliabilityScore: score,
      deliveryScore: Math.min(99, 93 + idx),
      qualityScore: Math.min(97, 92 + Math.floor(idx * 0.4)),
      communicationScore: 96,
      complianceScore: 98,
      issueResolutionScore: 94
    };
  }),

  // CLEARLY IMPROVING VENDOR: Zenith Office Supplies (72 -> 96)
  'Zenith Office Supplies': TREND_PERIODS.map((period, idx) => {
    const score = Math.min(96, 72 + idx * 2);
    return {
      vendorId: 4,
      period,
      reliabilityScore: score,
      deliveryScore: Math.min(96, 70 + idx * 2.2),
      qualityScore: Math.min(95, 74 + idx * 1.8),
      communicationScore: Math.min(96, 75 + idx * 1.8),
      complianceScore: Math.min(98, 76 + idx * 1.9),
      issueResolutionScore: Math.min(95, 70 + idx * 2.1)
    };
  }),

  // CLEARLY DECLINING VENDOR: EquipMax Machinery Ltd (84 -> 45 High Risk)
  'EquipMax Machinery Ltd': TREND_PERIODS.map((period, idx) => {
    const score = Math.max(45, 84 - idx * 3.4);
    return {
      vendorId: 5,
      period,
      reliabilityScore: Math.round(score),
      deliveryScore: Math.max(42, Math.round(86 - idx * 3.8)),
      qualityScore: Math.max(48, Math.round(85 - idx * 3.2)),
      communicationScore: Math.max(40, Math.round(82 - idx * 3.6)),
      complianceScore: Math.max(52, Math.round(85 - idx * 2.8)),
      issueResolutionScore: Math.max(42, Math.round(80 - idx * 3.3))
    };
  }),

  // CLEARLY DECLINING VENDOR 2: SafeGuard Industries (68 -> 48 High Risk)
  'SafeGuard Industries': TREND_PERIODS.map((period, idx) => {
    const score = Math.max(48, 68 - idx * 1.7);
    return {
      vendorId: 10,
      period,
      reliabilityScore: Math.round(score),
      deliveryScore: Math.max(45, Math.round(70 - idx * 2)),
      qualityScore: Math.max(50, Math.round(68 - idx * 1.5)),
      communicationScore: Math.max(44, Math.round(65 - idx * 1.8)),
      complianceScore: Math.max(50, Math.round(62 - idx * 1.1)),
      issueResolutionScore: Math.max(42, Math.round(60 - idx * 1.6))
    };
  }),

  'Global Logistics & Freight': TREND_PERIODS.map((period, idx) => {
    const score = Math.min(88, 82 + Math.floor(idx * 0.5));
    return {
      vendorId: 2,
      period,
      reliabilityScore: score,
      deliveryScore: Math.min(88, 80 + Math.floor(idx * 0.7)),
      qualityScore: Math.min(86, 82 + Math.floor(idx * 0.3)),
      communicationScore: 84,
      complianceScore: 92,
      issueResolutionScore: 82
    };
  }),

  'NovaSec Systems Pvt Ltd': TREND_PERIODS.map((period, idx) => {
    const score = Math.min(85, 75 + Math.floor(idx * 0.9));
    return {
      vendorId: 9,
      period,
      reliabilityScore: score,
      deliveryScore: Math.min(86, 76 + idx),
      qualityScore: Math.min(84, 78 + Math.floor(idx * 0.5)),
      communicationScore: 85,
      complianceScore: 88,
      issueResolutionScore: 80
    };
  }),

  'Infra Build & Civil Co.': TREND_PERIODS.map((period, idx) => {
    const score = Math.min(89, 84 + Math.floor(idx * 0.4));
    return {
      vendorId: 11,
      period,
      reliabilityScore: score,
      deliveryScore: Math.min(90, 85 + Math.floor(idx * 0.4)),
      qualityScore: 88,
      communicationScore: 82,
      complianceScore: 90,
      issueResolutionScore: 84
    };
  }),

  'PrintMaster Communications': TREND_PERIODS.map((period, idx) => {
    const score = Math.min(85, 80 + Math.floor(idx * 0.4));
    return {
      vendorId: 12,
      period,
      reliabilityScore: score,
      deliveryScore: Math.min(86, 82 + Math.floor(idx * 0.3)),
      qualityScore: 85,
      communicationScore: 82,
      complianceScore: 85,
      issueResolutionScore: 80
    };
  })
};

// ─── Reactive State Cache ────────────────────────────────────────────────────

let reliabilitiesCache: VendorReliability[] = [];
let factorsCache: Map<string, ReliabilityFactors> = new Map();
let recommendationsCache: ProcurementRecommendation[] = [];

const reliabilitiesSubject = new BehaviorSubject<VendorReliability[]>([]);

// ─── Reliability Calculation Engine ─────────────────────────────────────────

function assignRiskLevel(score: number): RiskLevel {
  if (score >= 75) return 'Low Risk';
  if (score >= 50) return 'Medium Risk';
  return 'High Risk';
}

function assignRecommendationStatus(score: number): RecommendationStatus {
  if (score >= 85) return 'Recommended';
  if (score >= 65) return 'Conditional';
  return 'Not Recommended';
}

async function computeVendorReliability(vendor: MasterVendor): Promise<{
  reliability: Omit<VendorReliability, 'rankPosition'>;
  factors: ReliabilityFactors;
}> {
  const vName = vendor.name;

  // 1. Fetch source metrics from Performance and Procurement services
  const deliveries = await performanceService.getDeliveries(vName);
  const qualityEvals = await performanceService.getQualityEvaluations(vName);
  const commLogs = await performanceService.getCommunicationLogs(vName);
  const serviceRatings = await performanceService.getServiceRatings(vName);
  const trackingRecords = await procurementService.getAllTracking();

  // 1a. Delivery History Score (25%)
  let deliveryHistoryScore = 85;
  const vTracking = trackingRecords.filter(t => t.vendorName === vName);
  const allDelivs = [...deliveries, ...vTracking];
  if (allDelivs.length > 0) {
    const onTime = allDelivs.filter(d => {
      const status = 'deliveryStatus' in d ? d.deliveryStatus : '';
      return status === 'On-Time' || status === 'Early' || status === 'Delivered';
    }).length;
    deliveryHistoryScore = Math.round((onTime / allDelivs.length) * 100);
  } else {
    if (vName.includes('TechCorp')) deliveryHistoryScore = 96;
    else if (vName.includes('Zenith')) deliveryHistoryScore = 94;
    else if (vName.includes('Global')) deliveryHistoryScore = 88;
    else if (vName.includes('Infra')) deliveryHistoryScore = 89;
    else if (vName.includes('NovaSec')) deliveryHistoryScore = 85;
    else if (vName.includes('PrintMaster')) deliveryHistoryScore = 84;
    else if (vName.includes('EquipMax')) deliveryHistoryScore = 48;
    else deliveryHistoryScore = 45;
  }

  // 1b. Product Quality Score (25%)
  let productQualityScore = 80;
  if (qualityEvals.length > 0) {
    const avgRating = qualityEvals.reduce((acc, q) => acc + q.overallQualityRating, 0) / qualityEvals.length;
    productQualityScore = Math.round((avgRating / 5) * 100);
  } else {
    if (vName.includes('TechCorp')) productQualityScore = 94;
    else if (vName.includes('Zenith')) productQualityScore = 90;
    else if (vName.includes('Global')) productQualityScore = 82;
    else if (vName.includes('Infra')) productQualityScore = 88;
    else if (vName.includes('NovaSec')) productQualityScore = 84;
    else if (vName.includes('PrintMaster')) productQualityScore = 85;
    else if (vName.includes('EquipMax')) productQualityScore = 52;
    else productQualityScore = 48;
  }

  // 1c. Communication Efficiency Score (15%)
  let communicationEfficiencyScore = 80;
  if (commLogs.length > 0) {
    const onTimeComm = commLogs.filter(c => c.communicationStatus !== 'SLA Breach').length;
    communicationEfficiencyScore = Math.round((onTimeComm / commLogs.length) * 100);
  } else {
    if (vName.includes('TechCorp')) communicationEfficiencyScore = 96;
    else if (vName.includes('Zenith')) communicationEfficiencyScore = 94;
    else if (vName.includes('Global')) communicationEfficiencyScore = 84;
    else if (vName.includes('Infra')) communicationEfficiencyScore = 82;
    else if (vName.includes('NovaSec')) communicationEfficiencyScore = 85;
    else if (vName.includes('PrintMaster')) communicationEfficiencyScore = 82;
    else if (vName.includes('EquipMax')) communicationEfficiencyScore = 42;
    else communicationEfficiencyScore = 40;
  }

  // 1d. Contract Compliance Score (15%)
  const contractComplianceScore = BASELINE_COMPLIANCE[vName] ?? 80;

  // 1e. Purchase History Score (10%)
  let purchaseHistoryScore = 85;
  const poResult = await procurementService.getPurchaseOrders({ page: 1, pageSize: 100 });
  const vPOs = poResult.items.filter(p => p.vendorName === vName);
  if (vPOs.length > 0) {
    const fulfilled = vPOs.filter(p => p.poStatus === 'Fulfilled' || p.poStatus === 'Issued' || p.poStatus === 'In Transit').length;
    purchaseHistoryScore = Math.round((fulfilled / vPOs.length) * 100);
  } else {
    if (vName.includes('TechCorp')) purchaseHistoryScore = 96;
    else if (vName.includes('Zenith')) purchaseHistoryScore = 92;
    else if (vName.includes('Global')) purchaseHistoryScore = 88;
    else if (vName.includes('Infra')) purchaseHistoryScore = 86;
    else if (vName.includes('NovaSec')) purchaseHistoryScore = 84;
    else if (vName.includes('PrintMaster')) purchaseHistoryScore = 82;
    else if (vName.includes('EquipMax')) purchaseHistoryScore = 55;
    else purchaseHistoryScore = 50;
  }

  // 1f. Issue Resolution Score (10%)
  let issueResolutionScore = 80;
  if (serviceRatings.length > 0) {
    const avgIssue = serviceRatings.reduce((acc, s) => acc + s.issueResolution, 0) / serviceRatings.length;
    issueResolutionScore = Math.round((avgIssue / 5) * 100);
  } else {
    if (vName.includes('TechCorp')) issueResolutionScore = 94;
    else if (vName.includes('Zenith')) issueResolutionScore = 92;
    else if (vName.includes('Global')) issueResolutionScore = 82;
    else if (vName.includes('Infra')) issueResolutionScore = 84;
    else if (vName.includes('NovaSec')) issueResolutionScore = 80;
    else if (vName.includes('PrintMaster')) issueResolutionScore = 80;
    else if (vName.includes('EquipMax')) issueResolutionScore = 45;
    else issueResolutionScore = 42;
  }

  // Weighted Reliability Score Calculation:
  // Delivery 25%, Quality 25%, Communication 15%, Compliance 15%, Purchase History 10%, Issue Resolution 10%
  const weightedScore = Math.round(
    (deliveryHistoryScore * 0.25) +
    (productQualityScore * 0.25) +
    (communicationEfficiencyScore * 0.15) +
    (contractComplianceScore * 0.15) +
    (purchaseHistoryScore * 0.10) +
    (issueResolutionScore * 0.10)
  );

  const reliabilityScore = Math.max(0, Math.min(100, weightedScore));
  const riskLevel = assignRiskLevel(reliabilityScore);
  const recommendationStatus = assignRecommendationStatus(reliabilityScore);

  const factors: ReliabilityFactors = {
    vendorId: vendor.id,
    deliveryHistoryScore,
    productQualityScore,
    communicationEfficiencyScore,
    contractComplianceScore,
    purchaseHistoryScore,
    issueResolutionScore
  };

  const reliability: Omit<VendorReliability, 'rankPosition'> = {
    vendorId: vendor.id,
    vendorName: vendor.name,
    vendorCategory: vendor.category,
    reliabilityScore,
    riskLevel,
    recommendationStatus,
    lastCalculatedAt: new Date().toISOString()
  };

  return { reliability, factors };
}

function generateReasonString(
  vendorName: string,
  score: number,
  factors: ReliabilityFactors,
  riskLevel: RiskLevel
): string {
  if (riskLevel === 'High Risk') {
    return `High risk warning: ${factors.deliveryHistoryScore}% on-time delivery with low quality evaluation (${Math.round(factors.productQualityScore * 0.05 * 10) / 10} avg rating). Not recommended for critical orders.`;
  }
  if (score >= 90) {
    return `${factors.deliveryHistoryScore}% on-time delivery, ${(factors.productQualityScore * 0.05).toFixed(1)} avg quality rating, zero contract compliance violations.`;
  }
  if (score >= 80) {
    return `${factors.deliveryHistoryScore}% delivery fulfillment rate, ${factors.contractComplianceScore}% contract compliance, reliable issue resolution.`;
  }
  return `${factors.deliveryHistoryScore}% delivery rate, ${(factors.productQualityScore * 0.05).toFixed(1)} avg quality, conditional approval status.`;
}

async function recalculateAllInternal(): Promise<VendorReliability[]> {
  const newFactorsMap = new Map<string, ReliabilityFactors>();
  const unrankedList: Omit<VendorReliability, 'rankPosition'>[] = [];

  for (const v of MASTER_VENDORS) {
    const { reliability, factors } = await computeVendorReliability(v);
    newFactorsMap.set(String(v.id), factors);
    newFactorsMap.set(v.name, factors);
    unrankedList.push(reliability);
  }

  // Sort descending by reliabilityScore
  unrankedList.sort((a, b) => b.reliabilityScore - a.reliabilityScore);

  // Assign rank position
  const rankedList: VendorReliability[] = unrankedList.map((item, idx) => ({
    ...item,
    rankPosition: idx + 1
  }));

  // Build Procurement Recommendations
  const newRecs: ProcurementRecommendation[] = rankedList.map((v, idx) => {
    const factors = newFactorsMap.get(String(v.vendorId)) || {
      vendorId: v.vendorId,
      deliveryHistoryScore: 80,
      productQualityScore: 80,
      communicationEfficiencyScore: 80,
      contractComplianceScore: 80,
      purchaseHistoryScore: 80,
      issueResolutionScore: 80
    };
    return {
      vendorId: v.vendorId,
      vendorName: v.vendorName,
      category: v.vendorCategory,
      reliabilityScore: v.reliabilityScore,
      riskLevel: v.riskLevel,
      recommendationRank: idx + 1,
      reason: generateReasonString(v.vendorName, v.reliabilityScore, factors, v.riskLevel)
    };
  });

  reliabilitiesCache = rankedList;
  factorsCache = newFactorsMap;
  recommendationsCache = newRecs;

  reliabilitiesSubject.next(rankedList);
  return rankedList;
}

// Initial calculation run
recalculateAllInternal();

// ─── Automated Listener Hooking for Automatic Workflows ──────────────────────

function setupAutomaticReactivity() {
  // Wrap performanceService write methods to trigger recalculation automatically
  const origAddDelivery = performanceService.addDelivery.bind(performanceService);
  performanceService.addDelivery = async function (...args) {
    const result = await origAddDelivery(...args);
    recalculateAllInternal();
    return result;
  };

  const origAddQuality = performanceService.addQualityEvaluation.bind(performanceService);
  performanceService.addQualityEvaluation = async function (...args) {
    const result = await origAddQuality(...args);
    recalculateAllInternal();
    return result;
  };

  const origAddComm = performanceService.addCommunicationLog.bind(performanceService);
  performanceService.addCommunicationLog = async function (...args) {
    const result = await origAddComm(...args);
    recalculateAllInternal();
    return result;
  };

  const origAddService = performanceService.addServiceRating.bind(performanceService);
  performanceService.addServiceRating = async function (...args) {
    const result = await origAddService(...args);
    recalculateAllInternal();
    return result;
  };

  // Wrap procurementService write methods to trigger recalculation automatically
  const origUpdateTracking = procurementService.updateTracking.bind(procurementService);
  procurementService.updateTracking = async function (...args) {
    const result = await origUpdateTracking(...args);
    recalculateAllInternal();
    return result;
  };

  const origCreatePO = procurementService.createPurchaseOrder.bind(procurementService);
  procurementService.createPurchaseOrder = async function (...args) {
    const result = await origCreatePO(...args);
    recalculateAllInternal();
    return result;
  };

  const origMarkPaid = procurementService.markInvoicePaid.bind(procurementService);
  procurementService.markInvoicePaid = async function (...args) {
    const result = await origMarkPaid(...args);
    recalculateAllInternal();
    return result;
  };
}

setupAutomaticReactivity();

// ─── ReliabilityService API Export ───────────────────────────────────────────

export const reliabilityService = {
  /**
   * Calculates/retrieves the reliability score and detailed factor breakdown for a vendor.
   * Returns an Observable shaped like a REST response.
   */
  calculateReliabilityScore(vendorId: number | string): Observable<VendorReliability> {
    return new Observable<VendorReliability>((subscriber) => {
      recalculateAllInternal().then((list) => {
        const found = list.find(v => String(v.vendorId) === String(vendorId) || v.vendorName === vendorId);
        if (found) {
          subscriber.next(found);
        } else {
          // Fallback if vendor not found in list
          subscriber.next({
            vendorId,
            vendorName: String(vendorId),
            vendorCategory: 'General',
            reliabilityScore: 75,
            riskLevel: 'Low Risk',
            rankPosition: list.length + 1,
            recommendationStatus: 'Conditional',
            lastCalculatedAt: new Date().toISOString()
          });
        }
      });
    });
  },

  /**
   * Assigns risk level based on 0-100 reliability score.
   * >= 75 Low Risk, 50-74 Medium Risk, < 50 High Risk.
   */
  assignRiskLevel(score: number): RiskLevel {
    return assignRiskLevel(score);
  },

  /**
   * Scores all vendors, sorts descending, and assigns rank positions.
   * Returns an Observable of VendorReliability array.
   */
  generateRankings(): Observable<VendorReliability[]> {
    return new Observable<VendorReliability[]>((subscriber) => {
      if (reliabilitiesCache.length > 0) {
        subscriber.next([...reliabilitiesCache]);
      }
      recalculateAllInternal().then(list => {
        subscriber.next([...list]);
      });
    });
  },

  /**
   * Returns procurement recommendations in category sorted by highest score + lowest risk.
   * Excludes High Risk vendors for High/Critical priority requests.
   */
  getRecommendations(category?: string, priority?: string): Observable<ProcurementRecommendation[]> {
    return new Observable<ProcurementRecommendation[]>((subscriber) => {
      recalculateAllInternal().then(() => {
        let recs = [...recommendationsCache];

        // Filter by category if specified
        if (category && category !== 'All' && category !== 'All Categories') {
          recs = recs.filter(r => r.category.toLowerCase().includes(category.toLowerCase()));
        }

        // Exclude High Risk vendors for High / Critical priority requests
        if (priority && (priority.toLowerCase() === 'high' || priority.toLowerCase() === 'critical')) {
          recs = recs.filter(r => r.riskLevel !== 'High Risk' && r.reliabilityScore >= 50);
        }

        // Sort descending by score
        recs.sort((a, b) => b.reliabilityScore - a.reliabilityScore);

        // Re-assign recommendation ranks
        const finalRecs = recs.map((item, idx) => ({
          ...item,
          recommendationRank: idx + 1
        }));

        subscriber.next(finalRecs);
      });
    });
  },

  /**
   * Returns 12 months of mock trend points per vendor showing believable improving/declining patterns.
   * Zenith Office Supplies is clearly improving (72 -> 96).
   * EquipMax Machinery Ltd and SafeGuard Industries are clearly declining (84 -> 45 High Risk).
   */
  getTrends(vendorId: number | string): Observable<ReliabilityTrendPoint[]> {
    return new Observable<ReliabilityTrendPoint[]>((subscriber) => {
      const vObj = MASTER_VENDORS.find(v => String(v.id) === String(vendorId) || v.name === vendorId);
      const key = vObj ? vObj.name : String(vendorId);

      const series = MOCK_TRENDS_DATA[key] || TREND_PERIODS.map((period) => ({
        vendorId,
        period,
        reliabilityScore: 80,
        deliveryScore: 82,
        qualityScore: 80,
        communicationScore: 80,
        complianceScore: 85,
        issueResolutionScore: 78
      }));

      subscriber.next(series);
    });
  },

  /**
   * Triggers a complete recalculation of all vendor reliability scores and updates observers.
   */
  recalculateAll(): Observable<VendorReliability[]> {
    return new Observable<VendorReliability[]>((subscriber) => {
      recalculateAllInternal().then(list => {
        subscriber.next([...list]);
      });
    });
  },

  /**
   * Returns all current vendor reliabilities as an Observable.
   */
  getReliabilities(): Observable<VendorReliability[]> {
    return this.generateRankings();
  },

  /**
   * Returns the factor breakdown (6 factor scores) for a given vendor.
   */
  getFactors(vendorId: number | string): Observable<ReliabilityFactors | null> {
    return new Observable<ReliabilityFactors | null>((subscriber) => {
      recalculateAllInternal().then(() => {
        const factors = factorsCache.get(String(vendorId)) || factorsCache.get(String(vendorId)) || null;
        subscriber.next(factors);
      });
    });
  }
};
