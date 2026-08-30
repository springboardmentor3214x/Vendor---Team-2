import React, { useState, useEffect } from "react";
import { CheckCircle, X, Search, Filter, ShieldCheck, AlertCircle, Award, Calendar, Layers, ClipboardCheck } from "lucide-react";
import { StarRating } from "./StarRating";
import { performanceService } from "../../services/performanceService";
import type { DeliveryPerformance, QualityEvaluation } from "../../models/performance";

interface QualityEvaluationViewProps {
  roleColor: string;
  currentRole?: string;
  userVendorName?: string;
  onSuccessToast: (msg: string) => void;
}

export const QualityEvaluationView: React.FC<QualityEvaluationViewProps> = ({
  roleColor,
  currentRole = "Administrator",
  userVendorName,
  onSuccessToast,
}) => {
  const isVendor = currentRole === "Vendor";
  const canEvaluate = currentRole === "Administrator" || currentRole === "Procurement Manager";

  const [pendingPOs, setPendingPOs] = useState<DeliveryPerformance[]>([]);
  const [evaluations, setEvaluations] = useState<QualityEvaluation[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for Past Evaluations Table
  const [vendorFilter, setVendorFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Evaluation Modal / Form State
  const [selectedPO, setSelectedPO] = useState<DeliveryPerformance | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [inspectionDate, setInspectionDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [materialQuality, setMaterialQuality] = useState<number>(5);
  const [packagingQuality, setPackagingQuality] = useState<number>(5);
  const [quantityAccuracy, setQuantityAccuracy] = useState<number>(5);
  const [specificationCompliance, setSpecificationCompliance] = useState<number>(5);
  const [productDefects, setProductDefects] = useState<string>("None");
  const [inspectorRemarks, setInspectorRemarks] = useState<string>("Meets all required specifications.");

  const loadData = async () => {
    setLoading(true);
    const pendingList = await performanceService.getPendingQualityPOs();
    const evalList = await performanceService.getQualityEvaluations();
    const vendorObjs = await performanceService.getVendors();

    setPendingPOs(pendingList);
    setEvaluations(evalList);
    setVendors(vendorObjs.map((v) => v.name));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openEvaluationForm = (po: DeliveryPerformance) => {
    setSelectedPO(po);
    setInspectionDate(new Date().toISOString().split("T")[0]);
    setMaterialQuality(5);
    setPackagingQuality(5);
    setQuantityAccuracy(5);
    setSpecificationCompliance(5);
    setProductDefects("None");
    setInspectorRemarks("Meets required quality standards.");
    setIsModalOpen(true);
  };

  const closeEvaluationForm = () => {
    setIsModalOpen(false);
    setSelectedPO(null);
  };

  // Live computed overall quality rating
  const liveOverallRating = Number(
    ((materialQuality + packagingQuality + quantityAccuracy + specificationCompliance) / 4).toFixed(2)
  );

  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO || !canEvaluate) return;

    await performanceService.addQualityEvaluation({
      poNumber: selectedPO.poNumber,
      vendorName: selectedPO.vendorName,
      inspectionDate,
      materialQuality,
      packagingQuality,
      quantityAccuracy,
      specificationCompliance,
      productDefects: productDefects.trim() || "None",
      inspectorRemarks: inspectorRemarks.trim() || "Approved",
    });

    onSuccessToast(
      `Quality Evaluation for ${selectedPO.poNumber} submitted successfully! Vendor metrics updated.`
    );
    closeEvaluationForm();
    await loadData();
  };

  // Filter evaluations
  const filteredEvaluations = evaluations.filter((q) => {
    const matchesVendorRole = !isVendor || (!!userVendorName && q.vendorName.toLowerCase().includes(userVendorName.toLowerCase()));
    if (!matchesVendorRole) return false;

    const matchesVendor = vendorFilter === "ALL" || q.vendorName === vendorFilter;
    const matchesSearch =
      q.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.productDefects.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStart = !startDate || q.inspectionDate >= startDate;
    const matchesEnd = !endDate || q.inspectionDate <= endDate;

    return matchesVendor && matchesSearch && matchesStart && matchesEnd;
  });

  return (
    <div className="space-y-8">
      {/* ── TOP SECTION: Delivered POs Pending Evaluation ── */}
      {canEvaluate && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <ClipboardCheck size={18} className="text-amber-500" />
              Delivered Purchase Orders Pending Quality Evaluation
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect delivered items and record compliance ratings to maintain supplier performance scorecards.
            </p>
          </div>
          <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 self-start sm:self-auto">
            {pendingPOs.length} Pending {pendingPOs.length === 1 ? "PO" : "POs"}
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs">Loading pending orders...</div>
        ) : pendingPOs.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <CheckCircle size={28} className="mx-auto text-emerald-500 mb-2 opacity-80" />
            <p className="text-xs font-semibold text-slate-700">All delivered POs have been evaluated!</p>
            <p className="text-[11px] text-slate-400 mt-0.5">No pending inspections in queue.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingPOs.map((po) => (
              <div
                key={po.id || po.poNumber}
                className="bg-slate-50/70 rounded-lg border border-slate-200 p-4 hover:border-blue-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs font-extrabold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {po.poNumber}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {po.deliveryStatus}
                    </span>
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-900 line-clamp-1">{po.vendorName}</h4>
                  <div className="mt-2 space-y-1 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-slate-400" />
                      <span>Delivered: <b>{po.actualDeliveryDate || po.expectedDeliveryDate}</b></span>
                    </div>
                    {po.remarks && (
                      <p className="text-[11px] text-slate-500 italic line-clamp-2 mt-1">"{po.remarks}"</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => openEvaluationForm(po)}
                  className="mt-4 w-full text-white text-xs font-bold py-2 rounded-lg transition-opacity hover:opacity-90 flex items-center justify-center gap-1.5 shadow-sm"
                  style={{ backgroundColor: roleColor }}
                >
                  <Award size={14} /> Evaluate Quality
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* ── BOTTOM SECTION: Past Evaluations Table & Filters ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Quality Evaluation Ledger</h3>
              <p className="text-xs text-slate-400">Historical inspection reports, defect logs, and component ratings.</p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {filteredEvaluations.length} records found
            </span>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search PO, Vendor, Defects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Vendor Filter */}
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <select
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              >
                <option value="ALL">All Vendors</option>
                {vendors.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Start Date"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-600"
              />
            </div>

            {/* End Date */}
            <div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End Date"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-600"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-3.5">PO Number</th>
                <th className="p-3.5">Vendor Name</th>
                <th className="p-3.5">Inspection Date</th>
                <th className="p-3.5">Aspect Scores (1-5★)</th>
                <th className="p-3.5">Defects Noted</th>
                <th className="p-3.5">Inspector Remarks</th>
                <th className="p-3.5 text-right">Overall Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvaluations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No quality evaluation records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEvaluations.map((q) => (
                  <tr key={q.id || q.poNumber} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-700">{q.poNumber}</td>
                    <td className="p-3.5 font-semibold text-slate-900">{q.vendorName}</td>
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">{q.inspectionDate}</td>
                    <td className="p-3.5 text-slate-600 space-y-0.5 text-[11px]">
                      <div>Mat: <span className="font-bold text-slate-800">{q.materialQuality}★</span> · Pkg: <span className="font-bold text-slate-800">{q.packagingQuality}★</span></div>
                      <div>Qty: <span className="font-bold text-slate-800">{q.quantityAccuracy}★</span> · Spec: <span className="font-bold text-slate-800">{q.specificationCompliance}★</span></div>
                    </td>
                    <td className="p-3.5 max-w-[150px]">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium truncate max-w-full ${
                          q.productDefects && q.productDefects !== "None"
                            ? "bg-rose-50 text-rose-700 border border-rose-200 font-semibold"
                            : "text-slate-500 bg-slate-100"
                        }`}
                      >
                        {q.productDefects || "None"}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 max-w-[180px] truncate text-[11px]" title={q.inspectorRemarks}>
                      {q.inspectorRemarks || "—"}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex flex-col items-end">
                        <StarRating rating={q.overallQualityRating} readOnly size={13} showLabel />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── EVALUATION DIALOG / MODAL ── */}
      {isModalOpen && selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Dialog Header */}
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Award size={18} style={{ color: roleColor }} />
                  Product Quality Inspection Form
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record detailed compliance ratings for this completed order.
                </p>
              </div>
              <button
                onClick={closeEvaluationForm}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Dialog Form */}
            <form onSubmit={handleSubmitEvaluation} className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Auto-filled Read-Only PO details */}
              <div className="grid grid-cols-2 gap-3 bg-slate-100/70 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase">PO Number</label>
                  <input
                    type="text"
                    value={selectedPO.poNumber}
                    readOnly
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 font-mono font-bold text-slate-800 text-xs cursor-not-allowed mt-1"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase">Vendor Name</label>
                  <input
                    type="text"
                    value={selectedPO.vendorName}
                    readOnly
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 font-bold text-slate-800 text-xs cursor-not-allowed mt-1 truncate"
                  />
                </div>
              </div>

              {/* Inspection Date Picker */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">INSPECTION DATE</label>
                <input
                  type="date"
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              {/* Aspect Ratings (1-5 Star inputs) */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Quality Criteria Ratings (1 – 5 Stars)</h4>

                {[
                  { label: "Material Quality", val: materialQuality, set: setMaterialQuality, desc: "Durability, raw composition & build quality" },
                  { label: "Packaging Quality", val: packagingQuality, set: setPackagingQuality, desc: "Protective wrapping, labeling & crate seal" },
                  { label: "Quantity Accuracy", val: quantityAccuracy, set: setQuantityAccuracy, desc: "Exact count delivered vs PO line items" },
                  { label: "Specification Compliance", val: specificationCompliance, set: setSpecificationCompliance, desc: "Adherence to technical blueprint / RFQ specs" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-150">
                    <div>
                      <div className="font-bold text-slate-800 text-xs">{item.label}</div>
                      <div className="text-[10px] text-slate-400">{item.desc}</div>
                    </div>
                    <StarRating rating={item.val} onChange={item.set} size={20} />
                  </div>
                ))}
              </div>

              {/* Live computed overall rating preview badge */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">Live Computed Overall Quality Score</span>
                  <div className="text-xl font-extrabold text-amber-900 mt-0.5 font-mono">
                    {liveOverallRating} / 5.0
                  </div>
                </div>
                <StarRating rating={liveOverallRating} readOnly size={22} />
              </div>

              {/* Product Defects Textarea */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">PRODUCT DEFECTS (IF ANY)</label>
                <textarea
                  value={productDefects}
                  onChange={(e) => setProductDefects(e.target.value)}
                  placeholder="Specify any batch anomalies, scratches, damaged units, or type 'None'..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 h-16 resize-none text-xs"
                />
              </div>

              {/* Inspector Remarks Textarea */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">INSPECTOR REMARKS</label>
                <textarea
                  value={inspectorRemarks}
                  onChange={(e) => setInspectorRemarks(e.target.value)}
                  placeholder="General notes, lab test reference, or sign-off remarks..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 h-16 resize-none text-xs"
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEvaluationForm}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white rounded-lg transition-opacity hover:opacity-90 flex items-center gap-1.5 shadow-md"
                  style={{ backgroundColor: roleColor }}
                >
                  <CheckCircle size={15} /> Save &amp; Recalculate Metrics
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
