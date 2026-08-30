import React from "react";
import { Filter, RefreshCw, Search } from "lucide-react";

export interface FilterValues {
  dateRange: string;
  category: string;
  department: string;
  contractStatus: string;
  procurementStatus: string;
  search: string;
}

export interface FilterBarProps {
  filters: FilterValues;
  onFilterChange: (key: keyof FilterValues, val: string) => void;
  onReset: () => void;
  categories?: string[];
  departments?: string[];
  contractStatuses?: string[];
  procurementStatuses?: string[];
  showCategory?: boolean;
  showDepartment?: boolean;
  showContractStatus?: boolean;
  showProcurementStatus?: boolean;
  showSearch?: boolean;
}

export function FilterBar({
  filters,
  onFilterChange,
  onReset,
  categories = ["All", "IT Vendors", "Logistics Partners", "Equipment Vendors", "Service Providers", "Maintenance Vendors"],
  departments = ["All", "IT & Systems", "Supply Chain", "Operations", "Civil Works", "Facilities"],
  contractStatuses = ["All", "Active", "Draft", "Renewed", "Expired", "Terminated"],
  procurementStatuses = ["All", "Pending", "Approved", "Ordered", "In Transit", "Fulfilled", "Completed", "Cancelled"],
  showCategory = true,
  showDepartment = true,
  showContractStatus = true,
  showProcurementStatus = true,
  showSearch = true,
}: FilterBarProps) {
  const selectStyle: React.CSSProperties = {
    padding: "6px 12px",
    borderRadius: 6,
    border: "1px solid #D1D5DB",
    fontSize: 12,
    background: "#fff",
    color: "#374151",
    fontWeight: 500,
    outline: "none",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E4E7EC",
        borderRadius: 12,
        padding: "12px 18px",
        marginBottom: 20,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#374151", marginRight: 4 }}>
          <Filter size={15} color="#667085" />
          <span>Filters:</span>
        </div>

        {/* Date Range / Period */}
        <select
          value={filters.dateRange}
          onChange={(e) => onFilterChange("dateRange", e.target.value)}
          style={selectStyle}
        >
          <option value="All Time">All Time</option>
          <option value="This Month">This Month (Aug 2026)</option>
          <option value="Last 3 Months">Last 3 Months</option>
          <option value="Last 6 Months">Last 6 Months</option>
          <option value="FY 2026">FY 2026</option>
        </select>

        {/* Category */}
        {showCategory && (
          <select
            value={filters.category}
            onChange={(e) => onFilterChange("category", e.target.value)}
            style={selectStyle}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                Category: {cat}
              </option>
            ))}
          </select>
        )}

        {/* Department */}
        {showDepartment && (
          <select
            value={filters.department}
            onChange={(e) => onFilterChange("department", e.target.value)}
            style={selectStyle}
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                Dept: {dept}
              </option>
            ))}
          </select>
        )}

        {/* Contract Status */}
        {showContractStatus && (
          <select
            value={filters.contractStatus}
            onChange={(e) => onFilterChange("contractStatus", e.target.value)}
            style={selectStyle}
          >
            {contractStatuses.map((st) => (
              <option key={st} value={st}>
                Contract: {st}
              </option>
            ))}
          </select>
        )}

        {/* Procurement Status */}
        {showProcurementStatus && (
          <select
            value={filters.procurementStatus}
            onChange={(e) => onFilterChange("procurementStatus", e.target.value)}
            style={selectStyle}
          >
            {procurementStatuses.map((st) => (
              <option key={st} value={st}>
                PO Status: {st}
              </option>
            ))}
          </select>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {showSearch && (
          <div style={{ position: "relative", width: 180 }}>
            <Search size={14} color="#9CA3AF" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => onFilterChange("search", e.target.value)}
              style={{
                width: "100%",
                padding: "6px 10px 6px 30px",
                borderRadius: 6,
                border: "1px solid #D1D5DB",
                fontSize: 12,
                outline: "none",
              }}
            />
          </div>
        )}

        <button
          onClick={onReset}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 12px",
            background: "#F3F4F6",
            border: "1px solid #E5E7EB",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            color: "#374151",
            cursor: "pointer",
          }}
          title="Reset Filters"
        >
          <RefreshCw size={13} /> Reset
        </button>
      </div>
    </div>
  );
}
