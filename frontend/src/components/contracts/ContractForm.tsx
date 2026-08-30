/**
 * ContractForm — Module 6: Contract & Compliance Management
 * =========================================================
 * Shared reactive form for creating (/contracts/new) and editing (/contracts/:id/edit).
 * Fully validated inline against mock ContractService.
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, FileText, Building2, Calendar, IndianRupee,
  Shield, CheckCircle, AlertCircle, Upload, X, Save, FileCheck
} from 'lucide-react';
import { contractService } from '../../services/contractService';
import type { Contract, ContractType, ContractStatus } from '../../models/contract';

interface Props {
  contractId?: number;
  onCancel: () => void;
  onSaveSuccess: (contract: Contract) => void;
  currentRole: string;
  userName: string;
  roleColor: string;
}

const APPROVED_VENDORS = [
  { id: 1, name: 'TechCorp Solutions Pvt Ltd', category: 'IT Services' },
  { id: 2, name: 'Global Logistics & Freight', category: 'Logistics Services' },
  { id: 4, name: 'Zenith Office Supplies', category: 'General Supplies' },
  { id: 5, name: 'EquipMax Machinery Ltd', category: 'Heavy Equipment' },
  { id: 9, name: 'NovaSec Systems Pvt Ltd', category: 'IT Security' },
  { id: 10, name: 'SafeGuard Industries', category: 'Safety Equipment' },
  { id: 11, name: 'Infra Build & Civil Co.', category: 'Civil Works' },
  { id: 12, name: 'PrintMaster Communications', category: 'Marketing Services' },
];

const CONTRACT_TYPES: ContractType[] = [
  'Fixed Price',
  'Time & Materials',
  'Service Agreement',
  'Supply Agreement',
  'AMC',
  'NDA',
  'Maintenance Contract',
  'License Agreement',
  'Framework Contract',
  'SLA Agreement',
];

const CATEGORIES = [
  'IT Services',
  'IT Hardware',
  'IT Software',
  'IT Security',
  'Logistics Services',
  'General Supplies',
  'Heavy Equipment',
  'Civil Works',
  'Facility Services',
  'Safety Equipment',
  'Marketing Services',
  'Professional Services',
];

const PAYMENT_TERMS = [
  'Net 15',
  'Net 30',
  'Net 45',
  'Net 60',
  'Quarterly',
  'Monthly',
  'Milestone-based',
  'On Delivery',
  'Annual upfront',
];

const STATUSES: ContractStatus[] = ['Draft', 'Active', 'Expired', 'Renewed', 'Terminated'];

function formatINR(val: number): string {
  if (!val || isNaN(val)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

export function ContractForm({
  contractId,
  onCancel,
  onSaveSuccess,
  currentRole,
  userName,
  roleColor,
}: Props) {
  const isEdit = Boolean(contractId);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [contractNumber, setContractNumber] = useState(isEdit ? '' : 'Auto-generated on save');
  const [contractTitle, setContractTitle] = useState('');
  const [vendorId, setVendorId] = useState<number>(APPROVED_VENDORS[0].id);
  const [vendorName, setVendorName] = useState(APPROVED_VENDORS[0].name);
  const [contractType, setContractType] = useState<ContractType>('Service Agreement');
  const [procurementCategory, setProcurementCategory] = useState(APPROVED_VENDORS[0].category);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [contractValue, setContractValue] = useState<number | ''>(1000000);
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [sla, setSla] = useState('');
  const [warrantyDetails, setWarrantyDetails] = useState('');
  const [responsibleManager, setResponsibleManager] = useState(userName);
  const [status, setStatus] = useState<ContractStatus>('Draft');
  const [documentName, setDocumentName] = useState('');

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Load existing contract if editing
  useEffect(() => {
    if (contractId) {
      contractService.getContractById(contractId).subscribe((c) => {
        if (c) {
          setContractNumber(c.contractNumber);
          setContractTitle(c.contractTitle);
          setVendorId(c.vendorId);
          setVendorName(c.vendorName);
          setContractType(c.contractType);
          setProcurementCategory(c.procurementCategory);
          setStartDate(c.startDate);
          setEndDate(c.endDate);
          setContractValue(c.contractValue);
          setPaymentTerms(c.paymentTerms);
          setSla(c.sla || '');
          setWarrantyDetails(c.warrantyDetails || '');
          setResponsibleManager(c.responsibleManager);
          setStatus(c.status);
          setDocumentName(c.documentName || '');
        } else {
          setToast({ msg: 'Contract not found', type: 'error' });
        }
        setLoading(false);
      });
    }
  }, [contractId]);

  // Handle vendor select
  const handleVendorChange = (id: number) => {
    const selected = APPROVED_VENDORS.find((v) => v.id === id);
    if (selected) {
      setVendorId(selected.id);
      setVendorName(selected.name);
      setProcurementCategory(selected.category);
    }
  };

  // Validate form
  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!contractTitle.trim()) {
      errs.contractTitle = 'Contract title is required';
    } else if (contractTitle.length < 5) {
      errs.contractTitle = 'Title must be at least 5 characters';
    }

    if (!vendorId) {
      errs.vendorId = 'Please select a vendor';
    }

    if (!startDate) {
      errs.startDate = 'Start date is required';
    }

    if (!endDate) {
      errs.endDate = 'End date is required';
    } else if (startDate && new Date(endDate) <= new Date(startDate)) {
      errs.endDate = 'End date must be after start date';
    }

    if (contractValue === '' || isNaN(Number(contractValue)) || Number(contractValue) <= 0) {
      errs.contractValue = 'Contract value must be a positive number';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate();
  };

  const handleSave = (forcedStatus?: ContractStatus) => {
    setTouched({
      contractTitle: true,
      startDate: true,
      endDate: true,
      contractValue: true,
    });

    if (!validate()) {
      setToast({ msg: 'Please correct the validation errors below', type: 'error' });
      return;
    }

    setSaving(true);
    const targetStatus = forcedStatus || status;

    const payload = {
      contractTitle,
      vendorId,
      vendorName,
      contractType,
      procurementCategory,
      startDate,
      endDate,
      contractValue: Number(contractValue),
      paymentTerms,
      sla,
      warrantyDetails,
      responsibleManager,
      status: targetStatus,
      documentName: documentName || `${contractNumber || 'CT-2026-NEW'}_${vendorName.replace(/\s+/g, '')}.pdf`,
      linkedProcurementNumbers: [],
    };

    if (isEdit && contractId) {
      contractService.updateContract(contractId, payload).subscribe((updated) => {
        setSaving(false);
        if (updated) {
          setToast({ msg: 'Contract updated successfully!', type: 'success' });
          setTimeout(() => onSaveSuccess(updated), 500);
        } else {
          setToast({ msg: 'Failed to update contract', type: 'error' });
        }
      });
    } else {
      contractService.createContract(payload).subscribe((created) => {
        setSaving(false);
        setToast({ msg: `Contract ${created.contractNumber} created successfully!`, type: 'success' });
        setTimeout(() => onSaveSuccess(created), 500);
      });
    }
  };

  // Mock File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocumentName(file.name);
      setToast({ msg: `Uploaded file ${file.name}`, type: 'success' });
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#667085', fontFamily: 'Inter, sans-serif' }}>
        Loading contract details...
      </div>
    );
  }

  const isRoleAllowed = currentRole === 'Administrator' || currentRole === 'Procurement Manager';

  if (!isRoleAllowed) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#B71C1C', fontFamily: 'Inter, sans-serif' }}>
        <AlertCircle size={36} style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 16, fontWeight: 700 }}>Access Denied</div>
        <div style={{ fontSize: 13, color: '#667085', marginTop: 4 }}>
          Only Procurement Managers and Administrators can create or edit contracts.
        </div>
        <button
          onClick={onCancel}
          style={{
            marginTop: 16,
            padding: '8px 16px',
            background: '#F3F4F6',
            border: '1px solid #D1D5DB',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Back to Contracts
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 28px', fontFamily: 'Inter, sans-serif', maxWidth: 1000, margin: '0 auto' }}>
      {/* Toast message */}
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
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onCancel}
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
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>
              {isEdit ? `Edit Contract: ${contractNumber}` : 'Create New Vendor Contract'}
            </h1>
            <p style={{ fontSize: 13, color: '#667085', marginTop: 4 }}>
              {isEdit
                ? 'Update agreement details, duration, payment terms, or status.'
                : 'Register a new vendor agreement, SLA, and warranty specifications.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              padding: '9px 18px',
              background: '#fff',
              border: '1px solid #D1D5DB',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: '#374151',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>

          {!isEdit && (
            <button
              onClick={() => handleSave('Draft')}
              disabled={saving}
              style={{
                padding: '9px 18px',
                background: '#F3F4F6',
                border: '1px solid #D1D5DB',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                color: '#374151',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <FileCheck size={16} /> Save as Draft
            </button>
          )}

          <button
            onClick={() => handleSave()}
            disabled={saving}
            style={{
              padding: '9px 20px',
              background: roleColor,
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}
          >
            <Save size={16} /> {saving ? 'Saving...' : isEdit ? 'Update Contract' : 'Save Contract'}
          </button>
        </div>
      </div>

      {/* Main Form Box */}
      <div style={{ background: '#fff', border: '1px solid #E4E7EC', borderRadius: 14, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        
        {/* Section 1: Basic Identifiers */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', borderBottom: '1px solid #F1F5F9', paddingBottom: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={16} color={roleColor} /> Basic Agreement Details
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 16 }}>
            {/* Contract Number */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Contract Number <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(Read-Only)</span>
              </label>
              <input
                type="text"
                value={contractNumber}
                readOnly
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#6B7280',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                }}
              />
            </div>

            {/* Contract Title */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Contract Title <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                value={contractTitle}
                onChange={(e) => setContractTitle(e.target.value)}
                onBlur={() => handleBlur('contractTitle')}
                placeholder="e.g. Enterprise IT Support & Maintenance SLA"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: `1px solid ${touched.contractTitle && errors.contractTitle ? '#EF4444' : '#D1D5DB'}`,
                  borderRadius: 8,
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              {touched.contractTitle && errors.contractTitle && (
                <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{errors.contractTitle}</div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {/* Vendor Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Vendor / Supplier <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={vendorId}
                onChange={(e) => handleVendorChange(Number(e.target.value))}
                disabled={isEdit}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 8,
                  fontSize: 13,
                  background: isEdit ? '#F9FAFB' : '#fff',
                  cursor: isEdit ? 'not-allowed' : 'pointer',
                  outline: 'none',
                }}
              >
                {APPROVED_VENDORS.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                Vendor ID: <b style={{ fontFamily: 'monospace' }}>VEN-2026-00{vendorId}</b>
              </div>
            </div>

            {/* Contract Type */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Contract Type <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value as ContractType)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 8,
                  fontSize: 13,
                  background: '#fff',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {CONTRACT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Procurement Category */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Procurement Category
              </label>
              <select
                value={procurementCategory}
                onChange={(e) => setProcurementCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 8,
                  fontSize: 13,
                  background: '#fff',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Financials & Validity */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', borderBottom: '1px solid #F1F5F9', paddingBottom: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <IndianRupee size={16} color={roleColor} /> Duration, Financials & Status
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* Start Date */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Start Date <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onBlur={() => handleBlur('startDate')}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: `1px solid ${touched.startDate && errors.startDate ? '#EF4444' : '#D1D5DB'}`,
                  borderRadius: 8,
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              {touched.startDate && errors.startDate && (
                <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{errors.startDate}</div>
              )}
            </div>

            {/* End Date */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                End Date <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                onBlur={() => handleBlur('endDate')}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: `1px solid ${touched.endDate && errors.endDate ? '#EF4444' : '#D1D5DB'}`,
                  borderRadius: 8,
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              {touched.endDate && errors.endDate && (
                <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>{errors.endDate}</div>
              )}
            </div>

            {/* Contract Value */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Contract Value (₹) <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="number"
                value={contractValue}
                onChange={(e) => setContractValue(e.target.value === '' ? '' : Number(e.target.value))}
                onBlur={() => handleBlur('contractValue')}
                placeholder="1000000"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: `1px solid ${touched.contractValue && errors.contractValue ? '#EF4444' : '#D1D5DB'}`,
                  borderRadius: 8,
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <div style={{ fontSize: 11, color: '#059669', fontWeight: 700, marginTop: 4 }}>
                Preview: {formatINR(Number(contractValue))}
              </div>
            </div>

            {/* Payment Terms */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 8,
                  fontSize: 13,
                  background: '#fff',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {PAYMENT_TERMS.map((pt) => (
                  <option key={pt} value={pt}>
                    {pt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Responsible Manager */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Responsible Manager
              </label>
              <input
                type="text"
                value={responsibleManager}
                onChange={(e) => setResponsibleManager(e.target.value)}
                disabled={currentRole !== 'Administrator'}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 8,
                  fontSize: 13,
                  background: currentRole !== 'Administrator' ? '#F9FAFB' : '#fff',
                  cursor: currentRole !== 'Administrator' ? 'not-allowed' : 'text',
                  outline: 'none',
                }}
              />
              {currentRole !== 'Administrator' && (
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Auto-filled from logged-in user</div>
              )}
            </div>

            {/* Contract Status */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Contract Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ContractStatus)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 8,
                  fontSize: 13,
                  background: '#fff',
                  cursor: 'pointer',
                  outline: 'none',
                  fontWeight: 700,
                }}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: SLA & Warranty Terms */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', borderBottom: '1px solid #F1F5F9', paddingBottom: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={16} color={roleColor} /> SLA & Warranty Specifications
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* SLA Textarea */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Service Level Agreement (SLA) Details
              </label>
              <textarea
                value={sla}
                onChange={(e) => setSla(e.target.value)}
                placeholder="e.g. 99.5% uptime SLA; P1 issue resolution within 2 hours; penalty of 1% per hour delay."
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 8,
                  fontSize: 13,
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Warranty Details Textarea */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Warranty & Guarantee Terms
              </label>
              <textarea
                value={warrantyDetails}
                onChange={(e) => setWarrantyDetails(e.target.value)}
                placeholder="e.g. 12-month comprehensive warranty on all replaced hardware parts; free replacement within 30 days for manufacturing defects."
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 8,
                  fontSize: 13,
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Document Attachment */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', borderBottom: '1px solid #F1F5F9', paddingBottom: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Upload size={16} color={roleColor} /> Signed Agreement Attachment
          </div>

          {documentName ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={20} color={roleColor} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{documentName}</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Mock attached agreement document (.pdf)</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDocumentName('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#EF4444',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <X size={16} /> Remove
              </button>
            </div>
          ) : (
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                border: '2px dashed #CBD5E1',
                borderRadius: 12,
                cursor: 'pointer',
                background: '#FAFAFA',
                transition: 'border 0.2s',
              }}
            >
              <Upload size={28} color="#94A3B8" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
                Click to attach signed contract PDF
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                Simulated file upload (PDF, DOCX up to 25MB)
              </div>
              <input type="file" accept=".pdf,.docx" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
