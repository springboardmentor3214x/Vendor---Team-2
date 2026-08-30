from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base
import enum
from sqlalchemy import Enum

class UserRole(str, enum.Enum):
    ADMIN = "Administrator"
    PROCUREMENT_MANAGER = "Procurement Manager"
    SUPPLY_CHAIN_MANAGER = "Supply Chain Manager"
    VENDOR = "Vendor"
    FINANCE_OFFICER = "Finance Officer"
    AUDITOR = "Auditor"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    mobile_number = Column(String, nullable=True)
    employee_id = Column(String, nullable=True)
    company_name = Column(String, nullable=True)  # For vendor users
    profile_picture_url = Column(String, nullable=True)
    role = Column(Enum(UserRole), default=UserRole.VENDOR)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Password reset token fields
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
