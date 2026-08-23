from datetime import datetime, date
from pydantic import BaseModel

from app.models.contract import ContractStatus, ComplianceStatus


class ContractBase(BaseModel):
    vendor_id: str
    title: str
    document_url: str | None = None
    start_date: date
    end_date: date
    contract_value: float | None = None
    auto_renew: bool = False
    terms: str | None = None
    notes: str | None = None


class ContractCreate(ContractBase):
    pass


class ContractUpdate(BaseModel):
    title: str | None = None
    document_url: str | None = None
    end_date: date | None = None
    contract_value: float | None = None
    auto_renew: bool | None = None
    terms: str | None = None
    notes: str | None = None
    status: ContractStatus | None = None
    compliance_status: ComplianceStatus | None = None


class ContractOut(ContractBase):
    id: str
    contract_number: str
    status: ContractStatus
    compliance_status: ComplianceStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CertificationCreate(BaseModel):
    vendor_id: str
    contract_id: str | None = None
    name: str
    issuing_authority: str | None = None
    issue_date: date | None = None
    expiry_date: date | None = None
    document_url: str | None = None


class CertificationOut(CertificationCreate):
    id: str

    class Config:
        from_attributes = True
