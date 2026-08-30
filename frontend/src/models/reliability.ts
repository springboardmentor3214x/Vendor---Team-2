/**
 * Vendor Reliability Management
 * Data structures for reliability scores, factors, rankings, and recommendations.
 *
 * Excludes backend/database code. Swapping this mock implementation
 * for real HTTP/REST API calls will require zero changes to UI interfaces.
 */

export type RiskLevel = 'Low Risk' | 'Medium Risk' | 'High Risk';
export type RecommendationStatus = 'Recommended' | 'Conditional' | 'Not Recommended';

export interface VendorReliability {
  vendorId: number | string;
  vendorName: string;
  vendorCategory: string;
  reliabilityScore: number; // 0-100
  riskLevel: RiskLevel;
  rankPosition: number;
  recommendationStatus: RecommendationStatus;
  lastCalculatedAt: string;
}

export interface ReliabilityFactors {
  vendorId: number | string;
  deliveryHistoryScore: number;          // 0-100
  productQualityScore: number;           // 0-100
  communicationEfficiencyScore: number;  // 0-100
  contractComplianceScore: number;       // 0-100
  purchaseHistoryScore: number;          // 0-100
  issueResolutionScore: number;          // 0-100
}

export interface ReliabilityTrendPoint {
  vendorId: number | string;
  period: string;                         // month/year label e.g., "Jan 2026"
  reliabilityScore: number;
  deliveryScore: number;
  qualityScore: number;
  communicationScore: number;
  complianceScore: number;
  issueResolutionScore: number;
}

export interface ProcurementRecommendation {
  vendorId: number | string;
  vendorName: string;
  category: string;
  reliabilityScore: number;
  riskLevel: RiskLevel;
  recommendationRank: number;
  reason: string;
}
