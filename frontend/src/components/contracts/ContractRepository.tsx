/**
 * ContractRepository — Module 6: Contract & Compliance Management
 * ===============================================================
 * Full Material-style table for querying, searching, filtering, sorting,
 * and performing row actions on vendor contracts.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Search, Filter, Plus, FileText, CheckCircle, AlertTriangle, AlertCircle,
  Eye, Edit3, Trash2, RotateCcw, ChevronLeft, ChevronRight, ArrowUpDown, X
} from 'lucide-react';
import { contractService } from '../../services/contractService';
import type { Contract, ContractStatus, ContractType } from '../../models/contract';

interface Props {
  roleColor: string;
  currentRole: string;
  userName: string;
  onSelectContract: (id: number) => void;
  onNewContract: () => void;
  onEditContract: (id: number) => void;
}

const STATUS_CONFIG: Record<ContractStatus, { bg: string; color: string }> = {
  Active:     { bg: '#E8F5E9', color: '#2E7D32' },
  Draft:      { bg: '#F3F4F6', color: '#4B5563' },
  Expired:    { bg: '#FFEBEE', color: '#B71C1C' },
  Renewed:    { bg: '#E0F2FE', color: '#0284C7' },
  Terminated: { bg: '#ECEFF1', color: '#263238' },
};

const CONTRACT_TYPES: (ContractType | 'All')[] = [
  'All',
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

const VENDORS = [
  'All',
  'TechCorp Solutions Pvt Ltd',
  'Global Logistics & Freight',
  'Zenith Office Supplies',
  'EquipMax Machinery Ltd',
  'NovaSec Systems Pvt Ltd',
  'SafeGuard Industries',
  'Infra Build & Civil Co.',
  'PrintMaster Communications',
];

function formatINR(val: number): string {
  if (!val || isNaN(val)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

type SortField = 'contractNumber' | 'contractTitle' | 'vendorName' | 'startDate' | 'endDate' | 'contractValue' | 'daysToExpiry' | 'status';

export function ContractRepository({
  roleColor,
  currentRole,
  userName,
  onSelectContract,
  onNewContract,
  onEditContract,
}: Props) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<ContractType | 'All'>('All');
  const [vendorFilter, setVendorFilter] = useState('All');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('contractNumber');
  const [sortAsc, setSortAsc] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals & Actions
  const [deleteContractId, setDeleteContractId] = useState<number | null>(null);
  const [renewContractObj, setRenewContractObj] = useState<Contract | null>(null);
  const [renewEndDate, setRenewEndDate] = useState('');
  const [renewRemarks, setRenewRemarks] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    contractService.getContracts({ pageSize: 200 }).subscribe((data) => {
      setContracts(data.items);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Role permissions
  const isVendor = currentRole === 'Vendor';
  const isAdmin = currentRole === 'Administrator';
  const isProcManager = currentRole === 'Procurement Manager';
  const canAdd = (isAdmin || isProcManager) && !isVendor;

  // Filter logic
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      // Vendor auto-filter: Vendor role sees ONLY their own contracts
      if (isVendor) {
        const isMatch = c.vendorName.toLowerCase().includes('techcorp') || c.vendorName.toLowerCase().includes(userName.toLowerCase());
        if (!isMatch) return false;
      }

      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (typeFilter !== 'All' && c.contractType !== typeFilter) return false;
      if (vendorFilter !== 'All' && c.vendorName !== vendorFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesQuery =
          c.contractTitle.toLowerCase().includes(q) ||
          c.contractNumber.toLowerCase().includes(q) ||
          c.vendorName.toLowerCase().includes(q) ||
          c.procurementCategory.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [contracts, isVendor, userName, statusFilter, typeFilter, vendorFilter, search]);

  // Sort logic
  const sortedContracts = useMemo(() => {
    const list = [...filteredContracts];
    list.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredContracts, sortField, sortAsc]);

  // Pagination logic
  const totalItems = sortedContracts.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedContracts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedContracts.slice(start, start + pageSize);
  }, [sortedContracts, page, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Delete Action
  const handleDeleteConfirm = () => {
    if (deleteContractId) {
      contractService.deleteContract(deleteContractId).subscribe(() => {
        setDeleteContractId(null);
        setToast({ msg: 'Contract deleted successfully', type: 'success' });
        loadData();
      });
    }
  };

  // Renew Action
  const handleRenewConfirm = () => {
    if (!renewContractObj || !renewEndDate || !renewRemarks.trim()) return;

    contractService
      .renewContract({
        contractId: renewContractObj.contractId,
        contractNumber: renewContractObj.contractNumber,
        vendorName: renewContractObj.vendorName,
        oldEndDate: renewContractObj.endDate,
        newEndDate: renewEndDate,
        renewedBy: userName,
        renewalDate: new Date().toISOString().slice(0, 10),
        remarks: renewRemarks,
      })
      .subscribe(() => {
        setRenewContractObj(null);
        setToast({ msg: 'Contract renewed successfully!', type: 'success' });
        loadData();
      });
  };

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #E4E7EC',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  };

  // KPI calculations
  const activeCount = filteredContracts.filter((c) => c.status === 'Active' || c.status === 'Renewed').length;
  const expiringCount = filteredContracts.filter((c) => c.daysToExpiry >= 0 && c.daysToExpiry <= 30 && c.status !== 'Expired').length;
  const expiredCount = filteredContracts.filter((c) => c.status === 'Expired' || c.daysToExpiry < 0).length;
  const totalValueSum = filteredContracts.reduce((acc, c) => acc + (c.contractValue || 0), 0);

  return (
    <div style={{ padding: '24px 28px', fontFamily: 'Inter, sans-serif' }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Contract Repository</h1>
          <p style={{ fontSize: 13, color: '#667085', marginTop: 4 }}>
            Central database for all vendor agreements, SLAs, terms, and active contracts
          </p>
        </div>

        {canAdd && (
          <button
            onClick={onNewContract}
            style={{
              padding: '10px 20px',
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
            <Plus size={16} /> Add Contract
          </button>
        )}
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <div style={{ ...cardStyle, borderLeft: '4px solid #10B981', padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Contracts</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>{activeCount}</div>
        </div>

        <div style={{ ...cardStyle, borderLeft: '4px solid #F59E0B', padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Expiring ≤ 30 Days</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>{expiringCount}</div>
        </div>

        <div style={{ ...cardStyle, borderLeft: '4px solid #EF4444', padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Expired Contracts</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>{expiredCount}</div>
        </div>

        <div style={{ ...cardStyle, borderLeft: `4px solid ${roleColor}`, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Portfolio Value</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>{formatINR(totalValueSum)}</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap', background: '#fff', padding: 14, border: '1px solid #E4E7EC', borderRadius: 10 }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: 10 }} />
          <input
            type="text"
            placeholder="Search by contract #, title, vendor..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{
              width: '100%',
              padding: '7px 10px 7px 32px',
              border: '1px solid #E4E7EC',
              borderRadius: 8,
              fontSize: 12,
              outline: 'none',
            }}
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
          style={{ padding: '7px 10px', border: '1px solid #E4E7EC', borderRadius: 8, fontSize: 12, outline: 'none', cursor: 'pointer' }}
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Draft">Draft</option>
          <option value="Expired">Expired</option>
          <option value="Renewed">Renewed</option>
          <option value="Terminated">Terminated</option>
        </select>

        {/* Contract Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value as any); setPage(1); }}
          style={{ padding: '7px 10px', border: '1px solid #E4E7EC', borderRadius: 8, fontSize: 12, outline: 'none', cursor: 'pointer' }}
        >
          {CONTRACT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === 'All' ? 'All Contract Types' : t}
            </option>
          ))}
        </select>

        {/* Vendor filter */}
        {!isVendor && (
          <select
            value={vendorFilter}
            onChange={(e) => { setVendorFilter(e.target.value); setPage(1); }}
            style={{ padding: '7px 10px', border: '1px solid #E4E7EC', borderRadius: 8, fontSize: 12, outline: 'none', cursor: 'pointer' }}
          >
            {VENDORS.map((v) => (
              <option key={v} value={v}>
                {v === 'All' ? 'All Vendors' : v}
              </option>
            ))}
          </select>
        )}

        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748B', fontWeight: 600 }}>
          Showing {paginatedContracts.length} of {totalItems} contracts
        </span>
      </div>

      {/* Material Table */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Loading repository contracts...</div>
        ) : paginatedContracts.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
            <FileText size={32} style={{ margin: '0 auto 10px', display: 'block', color: '#CBD5E1' }} />
            No contracts match your current filters.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th onClick={() => handleSort('contractNumber')} style={{ padding: '12px 16px', fontWeight: 800, color: '#475569', cursor: 'pointer' }}>
                  Contract # <ArrowUpDown size={12} style={{ inlineSize: 'auto' }} />
                </th>
                <th onClick={() => handleSort('contractTitle')} style={{ padding: '12px 16px', fontWeight: 800, color: '#475569', cursor: 'pointer' }}>
                  Agreement Title
                </th>
                <th onClick={() => handleSort('vendorName')} style={{ padding: '12px 16px', fontWeight: 800, color: '#475569', cursor: 'pointer' }}>
                  Vendor / Supplier
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 800, color: '#475569' }}>Type & Category</th>
                <th onClick={() => handleSort('startDate')} style={{ padding: '12px 16px', fontWeight: 800, color: '#475569', cursor: 'pointer' }}>
                  Start Date
                </th>
                <th onClick={() => handleSort('endDate')} style={{ padding: '12px 16px', fontWeight: 800, color: '#475569', cursor: 'pointer' }}>
                  End Date
                </th>
                <th onClick={() => handleSort('contractValue')} style={{ padding: '12px 16px', fontWeight: 800, color: '#475569', cursor: 'pointer' }}>
                  Value (₹)
                </th>
                <th onClick={() => handleSort('status')} style={{ padding: '12px 16px', fontWeight: 800, color: '#475569', cursor: 'pointer' }}>
                  Status
                </th>
                <th onClick={() => handleSort('daysToExpiry')} style={{ padding: '12px 16px', fontWeight: 800, color: '#475569', cursor: 'pointer' }}>
                  Days Left
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 800, color: '#475569', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedContracts.map((c) => {
                const isExpired = c.status === 'Expired' || c.daysToExpiry < 0;
                const statusCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.Draft;
                const canRowEdit = (isAdmin || isProcManager) && !isVendor;
                const canRowDelete = isAdmin;
                const canRowRenew = (isAdmin || isProcManager) && (c.status === 'Active' || c.status === 'Renewed' || isExpired);

                return (
                  <tr
                    key={c.contractId}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      background: isExpired ? '#FFF5F5' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    {/* Contract Number */}
                    <td style={{ padding: '12px 16px', fontWeight: 800, fontFamily: 'monospace', color: roleColor }}>
                      {c.contractNumber}
                    </td>

                    {/* Contract Title */}
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1E293B', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.contractTitle}
                    </td>

                    {/* Vendor Name */}
                    <td style={{ padding: '12px 16px', color: '#334155', fontWeight: 600 }}>
                      {c.vendorName}
                    </td>

                    {/* Type & Category */}
                    <td style={{ padding: '12px 16px', color: '#64748B' }}>
                      <div style={{ fontWeight: 700, color: '#334155' }}>{c.contractType}</div>
                      <div style={{ fontSize: 10 }}>{c.procurementCategory}</div>
                    </td>

                    {/* Dates */}
                    <td style={{ padding: '12px 16px', color: '#475569' }}>{c.startDate}</td>
                    <td style={{ padding: '12px 16px', color: isExpired ? '#B71C1C' : '#475569', fontWeight: isExpired ? 800 : 400 }}>
                      {c.endDate}
                    </td>

                    {/* Value */}
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0F172A' }}>
                      {formatINR(c.contractValue)}
                    </td>

                    {/* Status chip */}
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '3px 9px',
                          borderRadius: 100,
                          background: statusCfg.bg,
                          color: statusCfg.color,
                        }}
                      >
                        {c.status.toUpperCase()}
                      </span>
                    </td>

                    {/* Days Left Badge */}
                    <td style={{ padding: '12px 16px' }}>
                      {c.daysToExpiry < 0 ? (
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#FFEBEE', color: '#B71C1C' }}>
                          Expired
                        </span>
                      ) : c.daysToExpiry <= 30 ? (
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#FFF3E0', color: '#E65100' }}>
                          {c.daysToExpiry}d left
                        </span>
                      ) : c.daysToExpiry <= 90 ? (
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: '#EFF6FF', color: '#1D4ED8' }}>
                          {c.daysToExpiry}d left
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: '#64748B' }}>{c.daysToExpiry} days</span>
                      )}
                    </td>

                    {/* Row Actions */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => onSelectContract(c.contractId)}
                          title="View Details"
                          style={{
                            background: '#F1F5F9',
                            border: 'none',
                            borderRadius: 6,
                            padding: '5px 8px',
                            cursor: 'pointer',
                            color: '#334155',
                          }}
                        >
                          <Eye size={14} />
                        </button>

                        {canRowEdit && (
                          <button
                            onClick={() => onEditContract(c.contractId)}
                            title="Edit Contract"
                            style={{
                              background: '#F1F5F9',
                              border: 'none',
                              borderRadius: 6,
                              padding: '5px 8px',
                              cursor: 'pointer',
                              color: '#334155',
                            }}
                          >
                            <Edit3 size={14} />
                          </button>
                        )}

                        {canRowRenew && (
                          <button
                            onClick={() => {
                              const d = new Date(c.endDate);
                              d.setFullYear(d.getFullYear() + 1);
                              setRenewEndDate(d.toISOString().slice(0, 10));
                              setRenewRemarks('');
                              setRenewContractObj(c);
                            }}
                            title="Renew Contract"
                            style={{
                              background: '#EFF6FF',
                              border: 'none',
                              borderRadius: 6,
                              padding: '5px 8px',
                              cursor: 'pointer',
                              color: '#2563EB',
                            }}
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}

                        {canRowDelete && (
                          <button
                            onClick={() => setDeleteContractId(c.contractId)}
                            title="Delete Contract"
                            style={{
                              background: '#FEF2F2',
                              border: 'none',
                              borderRadius: 6,
                              padding: '5px 8px',
                              cursor: 'pointer',
                              color: '#EF4444',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748B' }}>
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              style={{ padding: '3px 6px', border: '1px solid #CBD5E1', borderRadius: 6, fontSize: 11 }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#64748B' }}>
              Page <b>{page}</b> of <b>{totalPages}</b>
            </span>

            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: 6,
                  background: page === 1 ? '#F1F5F9' : '#fff',
                  border: '1px solid #CBD5E1',
                  borderRadius: 6,
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronLeft size={14} color={page === 1 ? '#94A3B8' : '#334155'} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: 6,
                  background: page === totalPages ? '#F1F5F9' : '#fff',
                  border: '1px solid #CBD5E1',
                  borderRadius: 6,
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronRight size={14} color={page === totalPages ? '#94A3B8' : '#334155'} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteContractId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: 400, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#B71C1C', marginBottom: 8 }}>
              Confirm Contract Deletion
            </div>
            <div style={{ fontSize: 13, color: '#4B5563', marginBottom: 20 }}>
              Are you sure you want to permanently delete this contract? This action cannot be undone.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setDeleteContractId(null)} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} style={{ padding: '8px 16px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Delete Contract
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Quick Renew Modal */}
      {renewContractObj && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: 440, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <RotateCcw size={18} color="#2563EB" /> Renew Contract: {renewContractObj.contractNumber}
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>
              Current end date: <b>{renewContractObj.endDate}</b>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                New Expiry End Date
              </label>
              <input
                type="date"
                value={renewEndDate}
                onChange={(e) => setRenewEndDate(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13 }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Renewal Remarks
              </label>
              <textarea
                value={renewRemarks}
                onChange={(e) => setRenewRemarks(e.target.value)}
                placeholder="Remarks for renewal clause extension..."
                rows={3}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setRenewContractObj(null)} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleRenewConfirm} style={{ padding: '8px 16px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Confirm Renewal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
