/**
 * Module 4 – Vendor Performance Management
 * TypeScript interface/model definitions.
 *
 * Excludes backend/database code. Swapping this mock implementation
 * for real HTTP/REST API calls will require zero changes to UI interfaces.
 */

export interface DeliveryPerformance {
  id?: number;
  poNumber: string;
  vendorName: string;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  delayDays?: number;
  deliveryStatus: 'Early' | 'On-Time' | 'Delayed';
  remarks?: string;
}

export interface QualityEvaluation {
  id?: number;
  poNumber: string;
  vendorName: string;
  inspectionDate: string;
  materialQuality: number;          // 1-5
  packagingQuality: number;         // 1-5
  quantityAccuracy: number;         // 1-5
  specificationCompliance: number;  // 1-5
  productDefects: string;
  overallQualityRating: number;      // derived, e.g. average of above
  inspectorRemarks: string;
}

export interface CommunicationLog {
  id?: number;
  poNumber: string;
  vendorName: string;
  messageSentTime: string;
  vendorResponseTime?: string;
  responseDurationHours?: number;   // computed difference
  communicationStatus: 'Awaiting Response' | 'Responded' | 'SLA Breach';
  remarks?: string;
}

export interface ServiceRating {
  id?: number;
  poNumber: string;
  vendorName: string;
  professionalism: number;          // 1-5
  customerSupport: number;          // 1-5
  documentationQuality: number;     // 1-5
  flexibility: number;              // 1-5
  communicationEffectiveness: number; // 1-5
  issueResolution: number;          // 1-5
  overallServiceRating: number;     // derived
  comments: string;
}

export interface VendorPerformanceMetrics {
  vendorName: string;
  onTimeDeliveryRate: number;       // percentage (0-100)
  delayedDeliveryCount: number;
  avgQualityRating: number;         // 1-5 stars
  avgResponseTimeHours: number;
  orderCompletionRate: number;      // percentage (0-100)
  overallPerformanceScore: number;  // 0-100 (weighted aggregate)
}

export interface VendorRanking {
  rankPosition: number;
  vendorName: string;
  category: string;
  overallScore: number;             // 0-100
  deliveryScore: number;            // 0-100
  qualityScore: number;             // 0-100
  communicationScore: number;       // 0-100
  serviceScore: number;             // 0-100
}
