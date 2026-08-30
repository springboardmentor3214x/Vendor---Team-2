/**
 * ContractDetails — Module 6: Contract & Compliance Management
 * ============================================================
 * Document-style detailed layout for inspecting a single contract.
 * Integrates live Vendor Reliability Score from reliabilityService,
 * linked POs from procurementService, linked certifications from contractService,
 * and role-gated Renewal and Termination action modals.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, FileText, Calendar, IndianRupee, Shield, Building2,
  CheckCircle, AlertTriangle, AlertCircle, RefreshCw, XCircle, Download,
  Eye, Edit3, RotateCcw, Lock, Award, ShoppingBag, History, X
} from 'lucide-react';
import { contractService } from '../../services/contractService';
import { reliabilityService } from '../../services/reliabilityService';
import { procurementService } from '../../services/procurementService';
import type { Contract, ContractRenewal, Certification } from '../../models/contract';
import type { VendorReliability } from '../../models/reliability';
import type { PurchaseOrder } from '../../models/procurement';

interface Props {
  contractId: number;
  onBack: () => void;
  onEdit: () => void;
  currentRole: string;
  userName: string;
  roleColor: string;
}

const STATUS_CHIPS: Record<string, { bg: string; color: string }> = {
  Active:     { bg: '#E8F5E9', color: '#2E7D32' },
  Draft:      { bg: '#F3F4F6', color: '#4B5563' },
  Expired:    { bg: '#FFEBEE', color: '#B71C1C' },
  Renewed:    { bg: '#E0F2FE', color: '#0284C7' },
  Terminated: { bg: '#ECEFF1', color: '#263238' },
};

function formatINR(val: number): string {
  if (!val || isNaN(val)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

function calculateProgress(startDate: string, endDate: string): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = new Date().getTime();
  if (now <= start) return 0;
  if (now >= end) return 100;
  const total = end - start;
  const elapsed = now - start;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

export function ContractDetails({
  contractId,
  onBack,
  onEdit,
  currentRole,
  userName,
  roleColor,
}: Props) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [reliability, setReliability] = useState<VendorReliability | null>(null);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [renewals, setRenewals] = useState<ContractRenewal[]>([]);

  // Modals state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);

  // Form states inside modals
  const [renewEndDate, setRenewEndDate] = useState('');
  const [renewRemarks, setRenewRemarks] = useState('');
  const [renewError, setRenewError] = useState('');

  const [terminateRemarks, setTerminateRemarks] = useState('');
  const [terminateError, setTerminateError] = useState('');

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    contractService.getContractById(contractId).subscribe((c) => {
      if (!c) {
        setLoading(false);
        return;
      }
      setContract(c);

      // Set default renewal end date (+1 year from contract end date)
      const d = new Date(c.endDate);
      d.setFullYear(d.getFullYear() + 1);
      setRenewEndDate(d.toISOString().slice(0, 10));

      // Load vendor reliability score
      reliabilityService.calculateReliabilityScore(c.vendorId).subscribe((r) => {
        setReliability(r);
      });

      // Load vendor certifications
      contractService.getCertifications({ vendorId: c.vendorId }).subscribe((certs) => {
        setCertifications(certs);
      });

      // Load linked POs from procurement service
      procurementService.getPurchaseOrders().then((res) => {
        const pos = res.items || [];
        const vendorPOs = pos.filter(
          (p: PurchaseOrder) => p.vendorName.toLowerCase() === c.vendorName.toLowerCase()
        );
        setPurchaseOrders(vendorPOs);
      });

      // Load renewal history
      contractService.getRenewals(c.contractId).subscribe((rens) => {
        setRenewals(rens);
      });

      setLoading(false);
    });
  }, [contractId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !contract) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#667085', fontFamily: 'Inter, sans-serif' }}>
        Loading contract details...
      </div>
    );
  }

  const daysLeft = contract.daysToExpiry;
  const elapsedPercent = calculateProgress(contract.startDate, contract.endDate);
  const statusConfig = STATUS_CHIPS[contract.status] || STATUS_CHIPS.Draft;

  // Role permissions
  const isVendor = currentRole === 'Vendor';
  const isAuditor = currentRole === 'Auditor';
  const isFinance = currentRole === 'Finance Officer';
  const isAdmin = currentRole === 'Administrator';
  const isProcManager = currentRole === 'Procurement Manager';

  const canEdit = (isAdmin || isProcManager) && !isVendor && !isAuditor;
  const canRenew = (isAdmin || isProcManager) && (contract.status === 'Active' || contract.status === 'Renewed' || contract.status === 'Expired');
  const canTerminate = isAdmin && (contract.status === 'Active' || contract.status === 'Renewed' || contract.status === 'Draft');

  // Submit Renewal
  const handleConfirmRenew = () => {
    if (!renewEndDate) {
      setRenewError('Please select a valid new end date.');
      return;
    }
    if (new Date(renewEndDate) <= new Date(contract.endDate)) {
      setRenewError('New end date must be after current end date.');
      return;
    }
    if (!renewRemarks.trim()) {
      setRenewError('Remarks are required for contract renewal.');
      return;
    }

    contractService
      .renewContract({
        contractId: contract.contractId,
        contractNumber: contract.contractNumber,
        vendorName: contract.vendorName,
        oldEndDate: contract.endDate,
        newEndDate: renewEndDate,
        renewedBy: userName,
        renewalDate: new Date().toISOString().slice(0, 10),
        remarks: renewRemarks,
      })
      .subscribe(() => {
        setShowRenewModal(false);
        setToast({ msg: 'Contract renewed successfully!', type: 'success' });
        loadData();
      });
  };

  // Submit Termination
  const handleConfirmTerminate = () => {
    if (!terminateRemarks.trim()) {
      setTerminateError('Mandatory remarks required for contract termination.');
      return;
    }

    contractService
      .updateContract(contract.contractId, {
        status: 'Terminated',
      })
      .subscribe(() => {
        setShowTerminateModal(false);
        setToast({ msg: 'Contract terminated.', type: 'error' });
        loadData();
      });
  };

  return (
    <div style={{ padding: '24px 28px', fontFamily: 'Inter, sans-serif', maxWidth: 1100, margin: '0 auto' }}>
      {/* Toast popup */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            padding: '12px 20px',
            borderRadius: 10,
            background: toast.type === 'success' ? '#10B981' : '#EF4444',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            zIndex: 9999,
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onBack}
            style={{
              background: '#fff',
              border: '1px solid #E4E7EC',
              borderRadius: 8,
              padding: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={18} color="#667085" />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>
                {contract.contractTitle}
              </h1>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: 100,
                  background: statusConfig.bg,
                  color: statusConfig.color,
                }}
              >
                {contract.status.toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#667085', marginTop: 4, fontFamily: 'monospace' }}>
              Contract ID: <b>{contract.contractNumber}</b> · Created: {contract.createdAt.slice(0, 10)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          {canEdit && (
            <button
              onClick={onEdit}
              style={{
                padding: '8px 16px',
                background: '#fff',
                border: '1px solid #D1D5DB',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                color: '#374151',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Edit3 size={15} /> Edit Contract
            </button>
          )}

          {canRenew && (
            <button
              onClick={() => {
                setRenewError('');
                setShowRenewModal(true);
              }}
              style={{
                padding: '8px 16px',
                background: '#2563EB',
                border: 'none',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 4px rgba(37,99,235,0.2)',
              }}
            >
              <RotateCcw size={15} /> Renew Contract
            </button>
          )}

          {canTerminate && (
            <button
              onClick={() => {
                setTerminateError('');
                setShowTerminateModal(true);
              }}
              style={{
                padding: '8px 16px',
                background: '#FFF1F2',
                border: '1px solid #FECDD3',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                color: '#BE123C',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <XCircle size={15} /> Terminate
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Document Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        
        {/* Left Column: Core Document Specs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Overview & Duration Card */}
          <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 14, padding: 22 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={16} color={roleColor} /> Agreement Overview & Validity
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>Contract Type</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginTop: 2 }}>{contract.contractType}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>Category</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginTop: 2 }}>{contract.procurementCategory}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>Responsible Manager</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginTop: 2 }}>{contract.responsibleManager}</div>
              </div>
            </div>

            {/* Duration & Progress Bar */}
            <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={14} color="#64748B" /> Contract Term: {contract.startDate} → {contract.endDate}
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 100,
                    background: daysLeft <= 0 ? '#FFEBEE' : daysLeft <= 30 ? '#FFF3E0' : '#EFF6FF',
                    color: daysLeft <= 0 ? '#B71C1C' : daysLeft <= 30 ? '#E65100' : '#1D4ED8',
                  }}
                >
                  {daysLeft < 0 ? `Expired ${Math.abs(daysLeft)}d ago` : `${daysLeft} Days Remaining`}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', height: 8, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${elapsedPercent}%`,
                    height: '100%',
                    background: daysLeft <= 0 ? '#EF4444' : daysLeft <= 30 ? '#F59E0B' : '#10B981',
                    borderRadius: 4,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8', marginTop: 6 }}>
                <span>Elapsed: {elapsedPercent}%</span>
                <span>Expiry Date: {contract.endDate}</span>
              </div>
            </div>
          </div>

          {/* Financials & SLA Terms */}
          <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 14, padding: 22 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <IndianRupee size={16} color={roleColor} /> Commercial Terms & SLA
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#047857', textTransform: 'uppercase' }}>Total Contract Value</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#065F46', marginTop: 2 }}>{formatINR(contract.contractValue)}</div>
                {isFinance && (
                  <div style={{ fontSize: 11, color: '#047857', marginTop: 4, fontWeight: 600 }}>Visible for Finance Audit</div>
                )}
              </div>

              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase' }}>Payment Schedule</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#1E40AF', marginTop: 4 }}>{contract.paymentTerms}</div>
              </div>
            </div>

            {/* SLA Description */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Service Level Agreement (SLA)</div>
              <div style={{ fontSize: 13, color: '#4B5563', background: '#FAFAFA', border: '1px solid #F3F4F6', borderRadius: 8, padding: 12, lineHeight: 1.5 }}>
                {contract.sla || 'No specific SLA conditions defined.'}
              </div>
            </div>

            {/* Warranty Details */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Warranty & Guarantee Terms</div>
              <div style={{ fontSize: 13, color: '#4B5563', background: '#FAFAFA', border: '1px solid #F3F4F6', borderRadius: 8, padding: 12, lineHeight: 1.5 }}>
                {contract.warrantyDetails || 'Standard manufacturer/service provider terms apply.'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Vendor Summary & Documents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Vendor Reliability Card */}
          <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Building2 size={16} color={roleColor} /> Vendor Intelligence Profile
            </div>

            <div style={{ fontSize: 15, fontWeight: 800, color: '#1E293B', marginBottom: 2 }}>{contract.vendorName}</div>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 14, fontFamily: 'monospace' }}>Vendor ID: VEN-2026-00{contract.vendorId}</div>

            {/* Reliability score chip */}
            {reliability ? (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Reliability Score</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 100,
                      background: reliability.riskLevel === 'Low Risk' ? '#D1FAE5' : reliability.riskLevel === 'Medium Risk' ? '#FEF3C7' : '#FEE2E2',
                      color: reliability.riskLevel === 'Low Risk' ? '#065F46' : reliability.riskLevel === 'Medium Risk' ? '#92400E' : '#991B1B',
                    }}
                  >
                    {reliability.riskLevel}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: '#0F172A' }}>{reliability.reliabilityScore}</span>
                  <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>/ 100</span>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#94A3B8' }}>Loading vendor score...</div>
            )}
          </div>

          {/* Uploaded Agreement Card */}
          <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={16} color={roleColor} /> Executed Document
            </div>

            <div style={{ padding: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1E293B', wordBreak: 'break-all' }}>
                {contract.documentName || `${contract.contractNumber}_Agreement.pdf`}
              </div>
              <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>Digitally Executed & Validated</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                onClick={() => setShowPreviewModal(true)}
                style={{
                  padding: '8px',
                  background: '#fff',
                  border: '1px solid #D1D5DB',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#374151',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Eye size={14} /> Preview
              </button>

              <button
                onClick={() => setToast({ msg: `Downloading ${contract.documentName || 'contract.pdf'}...`, type: 'success' })}
                style={{
                  padding: '8px',
                  background: '#F3F4F6',
                  border: '1px solid #D1D5DB',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#374151',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Download size={14} /> Download
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Tabs / Sections: Certifications & POs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        
        {/* Linked Certifications */}
        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={16} color={roleColor} /> Linked Vendor Certifications ({certifications.length})
          </div>

          {certifications.length === 0 ? (
            <div style={{ fontSize: 12, color: '#9CA3AF', padding: '16px 0', textAlign: 'center' }}>
              No active certifications on file for this vendor.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {certifications.map((c) => (
                <div
                  key={c.certificationId}
                  style={{
                    padding: '10px 12px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>{c.certificationName}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>
                      Exp: {c.expiryDate} ({c.certificateNumber})
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 100,
                      background: c.status === 'Valid' ? '#D1FAE5' : c.status === 'Expiring Soon' ? '#FEF3C7' : '#FEE2E2',
                      color: c.status === 'Valid' ? '#065F46' : c.status === 'Expiring Soon' ? '#92400E' : '#991B1B',
                    }}
                  >
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Linked Procurement Orders */}
        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingBag size={16} color={roleColor} /> Linked Purchase Orders ({purchaseOrders.length})
          </div>

          {purchaseOrders.length === 0 ? (
            <div style={{ fontSize: 12, color: '#9CA3AF', padding: '16px 0', textAlign: 'center' }}>
              No purchase orders currently linked to this vendor.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {purchaseOrders.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: '10px 12px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1E293B', fontFamily: 'monospace' }}>
                      {p.poNumber}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{p.productDetails}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>{formatINR(p.totalCost)}</div>
                    <div style={{ fontSize: 10, color: '#059669', fontWeight: 700 }}>{p.poStatus}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Renewal History Section */}
      {renewals.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 14, padding: 20, marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={16} color={roleColor} /> Contract Renewal History ({renewals.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {renewals.map((r) => (
              <div key={r.renewalId} style={{ padding: 12, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#1E293B' }}>
                  <span>Renewed by {r.renewedBy} on {r.renewalDate}</span>
                  <span style={{ color: '#2563EB' }}>Term Extended: {r.oldEndDate} → {r.newEndDate}</span>
                </div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 4, fontStyle: 'italic' }}>"{r.remarks}"</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {showPreviewModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div style={{ background: '#fff', borderRadius: 16, width: '90%', maxWidth: 700, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>
                Document Preview: {contract.documentName || `${contract.contractNumber}_Agreement.pdf`}
              </div>
              <button onClick={() => setShowPreviewModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#667085" />
              </button>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 12, padding: 30, textAlign: 'center', minHeight: 280, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <FileText size={48} color={roleColor} style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 15, fontWeight: 800, color: '#1E293B' }}>{contract.contractTitle}</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                Executed between <b>VendorIQ Enterprise</b> & <b>{contract.vendorName}</b>
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 12, fontFamily: 'monospace' }}>
                Ref: {contract.contractNumber} | Value: {formatINR(contract.contractValue)} | Valid until {contract.endDate}
              </div>
              <div style={{ marginTop: 20, padding: '8px 16px', background: '#D1FAE5', color: '#065F46', borderRadius: 100, fontSize: 11, fontWeight: 800 }}>
                ✓ Digitally Signed & Encrypted Placeholder Document
              </div>
            </div>

            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <button
                onClick={() => setShowPreviewModal(false)}
                style={{ padding: '8px 18px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renewal Dialog Modal */}
      {showRenewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: 480, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <RotateCcw size={18} color="#2563EB" /> Renew Contract: {contract.contractNumber}
            </div>
            <div style={{ fontSize: 12, color: '#667085', marginBottom: 16 }}>
              Current Expiry Date: <b>{contract.endDate}</b>
            </div>

            {renewError && (
              <div style={{ padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B71C1C', borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
                {renewError}
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                New Expiry End Date <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="date"
                value={renewEndDate}
                onChange={(e) => setRenewEndDate(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Renewal Remarks / Clause Adjustments <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <textarea
                value={renewRemarks}
                onChange={(e) => setRenewRemarks(e.target.value)}
                placeholder="e.g. Renewed for FY2026-27 with 5% rate escalation as per clause 4.1."
                rows={3}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowRenewModal(false)} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleConfirmRenew} style={{ padding: '8px 16px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Confirm Renewal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Termination Dialog Modal */}
      {showTerminateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: 480, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#B71C1C', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <XCircle size={18} color="#B71C1C" /> Terminate Contract: {contract.contractNumber}
            </div>
            <div style={{ fontSize: 12, color: '#667085', marginBottom: 16 }}>
              Warning: Terminating a contract will flip its status to <b>Terminated</b> and halt all active SLA monitoring.
            </div>

            {terminateError && (
              <div style={{ padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B71C1C', borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
                {terminateError}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Mandatory Reason for Termination <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <textarea
                value={terminateRemarks}
                onChange={(e) => setTerminateRemarks(e.target.value)}
                placeholder="e.g. Vendor breach of SLA terms / Project scope cancelled by client."
                rows={3}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowTerminateModal(false)} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleConfirmTerminate} style={{ padding: '8px 16px', background: '#B71C1C', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Confirm Termination
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
