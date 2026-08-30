/**
 * ReportFilterPanel — Module 10: Reports & Export
 * Context-aware filter panel used by all 6 report types.
 */

import { useState, useEffect } from 'react';
import { X, SlidersHorizontal, Calendar, ChevronDown, RotateCcw, Play } from 'lucide-react';
import type {
  ReportFilters, ReportType, DatePreset, VendorCategory,
  DepartmentName, ProcurementStatus, POStatus,
  ContractStatusFilter, ComplianceStatusFilter, AppliedFilterChip,
} from '../../models/report';

// ─── Constants ────────────────────────────────────────────────────────────────

const VENDOR_CATEGORIES: VendorCategory[] = [
  'Raw Material Suppliers','Equipment Vendors','IT Vendors',
  'Service Providers','Logistics Partners','Maintenance Vendors',
];

const DEPARTMENTS: DepartmentName[] = [
  'Manufacturing','IT','Logistics','Finance','Operations','Maintenance',
  'Engineering','Facilities','Warehouse','Product','Marketing','Security',
  'Admin','Health & Safety','Design',
];

const PROCUREMENT_STATUSES: ProcurementStatus[] = ['Pending','Approved','Ordered','Delivered','Completed','Cancelled'];
const PO_STATUSES: POStatus[] = ['Draft','Issued','In Transit','Fulfilled','Delayed','Cancelled','Awaiting Shipment'];
const CONTRACT_STATUSES: ContractStatusFilter[] = ['Active','Expiring Soon','Expired','Renewed','Terminated','Draft'];
const COMPLIANCE_STATUSES: ComplianceStatusFilter[] = ['Compliant','Non-Compliant','Pending Verification','Expired'];

const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: 'last-30',        label: 'Last 30 Days' },
  { id: 'last-quarter',   label: 'Last Quarter' },
  { id: 'last-6-months',  label: 'Last 6 Months' },
  { id: 'ytd',            label: 'Year-to-Date' },
  { id: 'custom',         label: 'Custom Range' },
];

// Which filters each report type shows
const FILTER_MAP: Record<ReportType, Array<keyof ReportFilters>> = {
  'vendor-performance': ['datePreset','startDate','endDate','vendorCategory','vendorName','reliabilityScoreMin','reliabilityScoreMax'],
  'procurement':        ['datePreset','startDate','endDate','vendorCategory','departments','procurementStatus','vendorName'],
  'purchase-order':     ['datePreset','startDate','endDate','vendorCategory','vendorName','poStatus','departments'],
  'compliance':         ['datePreset','startDate','endDate','vendorCategory','vendorName','complianceStatus'],
  'contract':           ['datePreset','startDate','endDate','vendorCategory','vendorName','contractStatus'],
  'executive-summary':  ['datePreset','startDate','endDate','vendorCategory'],
};

// ─── Known vendor names for the searchable select ────────────────────────────

const VENDOR_NAMES = [
  'TechCorp Solutions Pvt Ltd','NovaSec Systems Pvt Ltd','DataBridge Technologies',
  'CloudAxis Infratech','SoftSolutions Inc','EquipMax Machinery Ltd',
  'PrecisionTech Equipments','HeavyLift Industries','MechMaster Engineering',
  'SteelPlus Raw Materials','CrystalChem Supplies','AgriRaw Commodities',
  'PolymerCore India','BuildRaw Composites','Zenith Office Supplies',
  'Infra Build & Civil Co.','BuildRight Construction','PrintMaster Communications',
  'FacilitiesFirst Services','Global Logistics & Freight','SwiftMove Logistics',
  'QuickShip India','CargoLink Pvt Ltd','ExpressFreight Solutions',
  'SafeGuard Industries','ProMaint Services','TechServ Maintenance',
  'FixItFast Engineering','OmniRepair Systems','EliteCare Solutions',
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface ReportFilterPanelProps {
  reportType: ReportType;
  roleColor: string;
  initialFilters: ReportFilters;
  isLoading: boolean;
  onGenerate: (filters: ReportFilters) => void;
  onClose?: () => void;
}

// ─── Chip builder ─────────────────────────────────────────────────────────────

function buildChips(filters: ReportFilters): AppliedFilterChip[] {
  const chips: AppliedFilterChip[] = [];
  const preset = DATE_PRESETS.find(p => p.id === filters.datePreset);
  if (filters.datePreset && filters.datePreset !== 'last-6-months')
    chips.push({ key: 'datePreset', label: 'Date', value: preset?.label ?? filters.datePreset });
  if (filters.startDate && filters.endDate && filters.datePreset === 'custom')
    chips.push({ key: 'startDate', label: 'Range', value: `${filters.startDate} → ${filters.endDate}` });
  if (filters.vendorCategory)
    chips.push({ key: 'vendorCategory', label: 'Category', value: filters.vendorCategory });
  if (filters.vendorName)
    chips.push({ key: 'vendorName', label: 'Vendor', value: filters.vendorName });
  if (filters.procurementStatus)
    chips.push({ key: 'procurementStatus', label: 'PR Status', value: filters.procurementStatus });
  if (filters.poStatus)
    chips.push({ key: 'poStatus', label: 'PO Status', value: filters.poStatus });
  if (filters.contractStatus)
    chips.push({ key: 'contractStatus', label: 'Contract', value: filters.contractStatus });
  if (filters.complianceStatus)
    chips.push({ key: 'complianceStatus', label: 'Compliance', value: filters.complianceStatus });
  if (filters.departments?.length)
    chips.push({ key: 'departments', label: 'Departments', value: filters.departments.join(', ') });
  if ((filters.reliabilityScoreMin ?? 0) > 0 || (filters.reliabilityScoreMax ?? 100) < 100)
    chips.push({ key: 'reliabilityScoreMin', label: 'Score', value: `${filters.reliabilityScoreMin ?? 0}–${filters.reliabilityScoreMax ?? 100}` });
  return chips;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, display: 'block',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E4E7EC',
  fontSize: 13, color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box',
};
const selectStyle: React.CSSProperties = { ...inputStyle, appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' };

// ─── Component ───────────────────────────────────────────────────────────────

export function ReportFilterPanel({ reportType, roleColor, initialFilters, isLoading, onGenerate, onClose }: ReportFilterPanelProps) {
  const [filters, setFilters] = useState<ReportFilters>(initialFilters);
  const [vendorSearch, setVendorSearch] = useState(initialFilters.vendorName ?? '');
  const [vendorDropOpen, setVendorDropOpen] = useState(false);

  useEffect(() => { setFilters(initialFilters); setVendorSearch(initialFilters.vendorName ?? ''); }, [reportType]);

  const applicable = FILTER_MAP[reportType] ?? [];
  const shows = (key: keyof ReportFilters) => applicable.includes(key);

  const set = <K extends keyof ReportFilters>(key: K, val: ReportFilters[K]) =>
    setFilters(prev => ({ ...prev, [key]: val }));

  const clearAll = () => {
    const reset: ReportFilters = {
      reportType,
      datePreset: 'last-6-months',
      startDate: '', endDate: '',
      vendorCategory: '', departments: [],
      procurementStatus: '', vendorName: '',
      poStatus: '', contractStatus: '', complianceStatus: '',
      reliabilityScoreMin: 0, reliabilityScoreMax: 100,
    };
    setFilters(reset);
    setVendorSearch('');
  };

  const clearChip = (chip: AppliedFilterChip) => {
    if (chip.key === 'departments') set('departments', []);
    else if (chip.key === 'reliabilityScoreMin') { set('reliabilityScoreMin', 0); set('reliabilityScoreMax', 100); }
    else if (chip.key === 'startDate') { set('startDate', ''); set('endDate', ''); }
    else if (chip.key === 'datePreset') set('datePreset', 'last-6-months');
    else set(chip.key as keyof ReportFilters, '' as never);
    if (chip.key === 'vendorName') setVendorSearch('');
  };

  const toggleDept = (dept: DepartmentName) => {
    const cur = filters.departments ?? [];
    set('departments', cur.includes(dept) ? cur.filter(d => d !== dept) : [...cur, dept]);
  };

  const chips = buildChips(filters);
  const filteredVendors = VENDOR_NAMES.filter(v => v.toLowerCase().includes(vendorSearch.toLowerCase()));

  return (
    <div style={{
      background: '#fff', border: '1px solid #E4E7EC', borderRadius: 12,
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SlidersHorizontal size={16} color={roleColor} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Report Filters</span>
          {chips.length > 0 && (
            <span style={{ background: roleColor, color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 100, padding: '2px 7px' }}>
              {chips.length}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={clearAll} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F1F5F9', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 12, color: '#6B7280', cursor: 'pointer', fontWeight: 600 }}>
            <RotateCcw size={12} /> Reset
          </button>
          {onClose && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Date Preset */}
        {shows('datePreset') && (
          <div>
            <label style={labelStyle}><Calendar size={10} style={{ display: 'inline', marginRight: 4 }} />Date Range</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {DATE_PRESETS.map(p => (
                <button
                  key={p.id}
                  onClick={() => set('datePreset', p.id)}
                  style={{
                    padding: '5px 11px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid',
                    borderColor: filters.datePreset === p.id ? roleColor : '#E4E7EC',
                    background: filters.datePreset === p.id ? `${roleColor}15` : '#fff',
                    color: filters.datePreset === p.id ? roleColor : '#6B7280',
                  }}
                >{p.label}</button>
              ))}
            </div>
            {filters.datePreset === 'custom' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ ...labelStyle, marginBottom: 3 }}>From</label>
                  <input type="date" style={inputStyle} value={filters.startDate ?? ''} onChange={e => set('startDate', e.target.value)} />
                </div>
                <div>
                  <label style={{ ...labelStyle, marginBottom: 3 }}>To</label>
                  <input type="date" style={inputStyle} value={filters.endDate ?? ''} onChange={e => set('endDate', e.target.value)} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vendor Category */}
        {shows('vendorCategory') && (
          <div>
            <label style={labelStyle}>Vendor Category</label>
            <div style={{ position: 'relative' }}>
              <select style={selectStyle} value={filters.vendorCategory ?? ''} onChange={e => set('vendorCategory', e.target.value as VendorCategory | '')}>
                <option value="">All Categories</option>
                {VENDOR_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
            </div>
          </div>
        )}

        {/* Vendor Name searchable */}
        {shows('vendorName') && (
          <div style={{ position: 'relative' }}>
            <label style={labelStyle}>Vendor Name</label>
            <input
              style={inputStyle}
              placeholder="Search vendor..."
              value={vendorSearch}
              onChange={e => { setVendorSearch(e.target.value); set('vendorName', e.target.value); setVendorDropOpen(true); }}
              onFocus={() => setVendorDropOpen(true)}
              onBlur={() => setTimeout(() => setVendorDropOpen(false), 150)}
            />
            {vendorDropOpen && vendorSearch.length > 0 && filteredVendors.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E4E7EC', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: 180, overflowY: 'auto' }}>
                {filteredVendors.slice(0, 8).map(v => (
                  <div key={v} onMouseDown={() => { setVendorSearch(v); set('vendorName', v); setVendorDropOpen(false); }}
                    style={{ padding: '8px 14px', fontSize: 12, cursor: 'pointer', color: '#111827' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                  >{v}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Departments multi-select */}
        {shows('departments') && (
          <div>
            <label style={labelStyle}>Departments ({filters.departments?.length ?? 0} selected)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, padding: '8px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E4E7EC', maxHeight: 130, overflowY: 'auto' }}>
              {DEPARTMENTS.map(d => {
                const sel = filters.departments?.includes(d);
                return (
                  <button key={d} onClick={() => toggleDept(d)}
                    style={{ padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
                      borderColor: sel ? roleColor : '#E4E7EC',
                      background: sel ? `${roleColor}20` : '#fff',
                      color: sel ? roleColor : '#6B7280',
                    }}>{d}</button>
                );
              })}
            </div>
          </div>
        )}

        {/* Procurement Status */}
        {shows('procurementStatus') && (
          <div>
            <label style={labelStyle}>Procurement Status</label>
            <div style={{ position: 'relative' }}>
              <select style={selectStyle} value={filters.procurementStatus ?? ''} onChange={e => set('procurementStatus', e.target.value as ProcurementStatus | '')}>
                <option value="">All Statuses</option>
                {PROCUREMENT_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
            </div>
          </div>
        )}

        {/* PO Status */}
        {shows('poStatus') && (
          <div>
            <label style={labelStyle}>Purchase Order Status</label>
            <div style={{ position: 'relative' }}>
              <select style={selectStyle} value={filters.poStatus ?? ''} onChange={e => set('poStatus', e.target.value as POStatus | '')}>
                <option value="">All PO Statuses</option>
                {PO_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
            </div>
          </div>
        )}

        {/* Contract Status */}
        {shows('contractStatus') && (
          <div>
            <label style={labelStyle}>Contract Status</label>
            <div style={{ position: 'relative' }}>
              <select style={selectStyle} value={filters.contractStatus ?? ''} onChange={e => set('contractStatus', e.target.value as ContractStatusFilter | '')}>
                <option value="">All Contract Statuses</option>
                {CONTRACT_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
            </div>
          </div>
        )}

        {/* Compliance Status */}
        {shows('complianceStatus') && (
          <div>
            <label style={labelStyle}>Compliance Status</label>
            <div style={{ position: 'relative' }}>
              <select style={selectStyle} value={filters.complianceStatus ?? ''} onChange={e => set('complianceStatus', e.target.value as ComplianceStatusFilter | '')}>
                <option value="">All Compliance Statuses</option>
                {COMPLIANCE_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
            </div>
          </div>
        )}

        {/* Reliability Score Range */}
        {shows('reliabilityScoreMin') && (
          <div>
            <label style={labelStyle}>
              Reliability Score: {filters.reliabilityScoreMin ?? 0} – {filters.reliabilityScoreMax ?? 100}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ ...labelStyle, marginBottom: 3, fontSize: 10 }}>Min</label>
                <input type="range" min={0} max={100} value={filters.reliabilityScoreMin ?? 0}
                  onChange={e => set('reliabilityScoreMin', Number(e.target.value))}
                  style={{ width: '100%', accentColor: roleColor }} />
              </div>
              <div>
                <label style={{ ...labelStyle, marginBottom: 3, fontSize: 10 }}>Max</label>
                <input type="range" min={0} max={100} value={filters.reliabilityScoreMax ?? 100}
                  onChange={e => set('reliabilityScoreMax', Number(e.target.value))}
                  style={{ width: '100%', accentColor: roleColor }} />
              </div>
            </div>
          </div>
        )}

        {/* Applied Filters Chips */}
        {chips.length > 0 && (
          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Applied Filters</span>
              <button onClick={clearAll} style={{ fontSize: 11, color: '#C62828', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Clear All</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {chips.map((chip, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${roleColor}12`, border: `1px solid ${roleColor}40`, borderRadius: 100, padding: '3px 10px 3px 10px' }}>
                  <span style={{ fontSize: 11, color: roleColor, fontWeight: 600 }}>{chip.label}: {chip.value}</span>
                  <button onClick={() => clearChip(chip)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: roleColor, padding: 0, display: 'flex', alignItems: 'center' }}>
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={() => onGenerate(filters)}
          disabled={isLoading}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: isLoading ? '#9CA3AF' : roleColor, color: '#fff',
            border: 'none', borderRadius: 8, padding: '11px 20px',
            fontSize: 13, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.2s', letterSpacing: '0.2px',
          }}
        >
          {isLoading ? (
            <>
              <span style={{ width: 14, height: 14, border: '2px solid #ffffff50', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'rfp-spin 0.7s linear infinite' }} />
              Generating Report…
            </>
          ) : (
            <><Play size={13} /> Generate Report</>
          )}
        </button>
        <style>{`@keyframes rfp-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
