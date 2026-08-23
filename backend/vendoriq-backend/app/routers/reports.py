import io

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.vendor import Vendor
from app.models.procurement import PurchaseOrder
from app.models.contract import Contract
from app.models.reliability import ReliabilityScore
from app.utils.pdf_export import build_pdf_report
from app.utils.excel_export import build_excel_report

router = APIRouter(prefix="/reports", tags=["Reports & Export"])


def _vendor_performance_rows(db: Session):
    rows = (
        db.query(Vendor, ReliabilityScore)
        .outerjoin(ReliabilityScore, ReliabilityScore.vendor_id == Vendor.id)
        .order_by(Vendor.company_name.asc())
        .all()
    )
    headers = ["Vendor", "Category", "Status", "Overall Score", "Risk Level", "Rank"]
    data = []
    seen = set()
    for vendor, score in rows:
        if vendor.id in seen:
            continue
        seen.add(vendor.id)
        data.append([
            vendor.company_name,
            vendor.category.value,
            vendor.status.value,
            score.overall_score if score else "-",
            score.risk_level.value if score else "-",
            score.rank if score else "-",
        ])
    return headers, data


def _procurement_rows(db: Session):
    pos = db.query(PurchaseOrder).order_by(PurchaseOrder.created_at.desc()).limit(1000).all()
    headers = ["PO Number", "Vendor ID", "Item", "Qty", "Unit Price", "Total", "Status", "Expected Delivery"]
    data = [
        [po.po_number, po.vendor_id, po.item_description, po.quantity, po.unit_price, po.total_amount,
         po.status.value, po.expected_delivery_date]
        for po in pos
    ]
    return headers, data


def _contract_rows(db: Session):
    contracts = db.query(Contract).order_by(Contract.end_date.asc()).all()
    headers = ["Contract Number", "Vendor ID", "Title", "Start", "End", "Status", "Compliance"]
    data = [
        [c.contract_number, c.vendor_id, c.title, c.start_date, c.end_date, c.status.value, c.compliance_status.value]
        for c in contracts
    ]
    return headers, data


REPORT_BUILDERS = {
    "vendor-performance": ("Vendor Performance Report", _vendor_performance_rows),
    "procurement": ("Procurement Report", _procurement_rows),
    "purchase-orders": ("Purchase Order Report", _procurement_rows),
    "contracts": ("Contract Report", _contract_rows),
    "compliance": ("Compliance Report", _contract_rows),
}


@router.get("/{report_type}/pdf")
def export_pdf(report_type: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    title, builder = REPORT_BUILDERS.get(report_type, (None, None))
    if not builder:
        return {"detail": f"Unknown report type. Available: {list(REPORT_BUILDERS)}"}
    headers, rows = builder(db)
    pdf_bytes = build_pdf_report(title, headers, rows)
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{report_type}-report.pdf"'},
    )


@router.get("/{report_type}/excel")
def export_excel(report_type: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    title, builder = REPORT_BUILDERS.get(report_type, (None, None))
    if not builder:
        return {"detail": f"Unknown report type. Available: {list(REPORT_BUILDERS)}"}
    headers, rows = builder(db)
    excel_bytes = build_excel_report(title, headers, rows)
    return StreamingResponse(
        io.BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{report_type}-report.xlsx"'},
    )
