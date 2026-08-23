from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_procurement
from app.models.user import User
from app.models.contract import Contract, Certification, ContractStatus, ComplianceStatus
from app.models.vendor import Vendor
from app.schemas.contract import ContractCreate, ContractUpdate, ContractOut, CertificationCreate, CertificationOut
from app.services.code_generator import generate_contract_number
from app.services.notification_service import create_notification
from app.models.notification import NotificationType

router = APIRouter(prefix="/contracts", tags=["Contract & Compliance"])


@router.post("", response_model=ContractOut, status_code=201)
def create_contract(payload: ContractCreate, db: Session = Depends(get_db), current_user: User = Depends(require_procurement)):
    vendor = db.get(Vendor, payload.vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    contract = Contract(
        **payload.model_dump(),
        contract_number=generate_contract_number(),
        status=ContractStatus.ACTIVE if payload.start_date <= date.today() <= payload.end_date else ContractStatus.DRAFT,
        created_by=current_user.id,
    )
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract


@router.get("", response_model=list[ContractOut])
def list_contracts(
    vendor_id: str | None = None,
    status_: ContractStatus | None = Query(default=None, alias="status"),
    expiring_within_days: int | None = None,
    skip: int = 0,
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(Contract)
    if vendor_id:
        query = query.filter(Contract.vendor_id == vendor_id)
    if status_:
        query = query.filter(Contract.status == status_)
    if expiring_within_days is not None:
        cutoff = date.today() + timedelta(days=expiring_within_days)
        query = query.filter(Contract.end_date <= cutoff, Contract.end_date >= date.today())
    return query.order_by(Contract.end_date.asc()).offset(skip).limit(limit).all()


@router.get("/{contract_id}", response_model=ContractOut)
def get_contract(contract_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    contract = db.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract


@router.put("/{contract_id}", response_model=ContractOut)
def update_contract(contract_id: str, payload: ContractUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_procurement)):
    contract = db.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    previous_compliance = contract.compliance_status
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(contract, field, value)
    db.commit()
    db.refresh(contract)

    if (
        contract.compliance_status == ComplianceStatus.NON_COMPLIANT
        and previous_compliance != ComplianceStatus.NON_COMPLIANT
        and contract.created_by
    ):
        create_notification(
            db, user_id=contract.created_by,
            title="Contract Flagged Non-Compliant",
            message=f"Contract '{contract.title}' ({contract.contract_number}) has been marked non-compliant and needs review.",
            type=NotificationType.COMPLIANCE_ALERT,
        )

    return contract


@router.put("/{contract_id}/renew", response_model=ContractOut)
def renew_contract(contract_id: str, new_end_date: date, db: Session = Depends(get_db), _: User = Depends(require_procurement)):
    contract = db.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    if new_end_date <= contract.end_date:
        raise HTTPException(status_code=400, detail="New end date must be after the current end date")
    contract.end_date = new_end_date
    contract.status = ContractStatus.RENEWED
    db.commit()
    db.refresh(contract)
    return contract


@router.delete("/{contract_id}", status_code=204)
def terminate_contract(contract_id: str, db: Session = Depends(get_db), _: User = Depends(require_procurement)):
    contract = db.get(Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    contract.status = ContractStatus.TERMINATED
    db.commit()
    return None


@router.post("/certifications", response_model=CertificationOut, status_code=201)
def add_certification(payload: CertificationCreate, db: Session = Depends(get_db), _: User = Depends(require_procurement)):
    vendor = db.get(Vendor, payload.vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    cert = Certification(**payload.model_dump())
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return cert


@router.get("/vendor/{vendor_id}/certifications", response_model=list[CertificationOut])
def list_certifications(vendor_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Certification).filter(Certification.vendor_id == vendor_id).all()
