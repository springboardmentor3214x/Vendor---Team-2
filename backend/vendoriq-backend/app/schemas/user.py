from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

from app.models.user import RoleEnum


class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: str | None = None
    role: RoleEnum = RoleEnum.PROCUREMENT_MANAGER


class UserCreate(UserBase):
    password: str = Field(min_length=8)


class UserUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    avatar_url: str | None = None


class UserRoleUpdate(BaseModel):
    role: RoleEnum


class UserOut(UserBase):
    id: str
    is_active: bool
    is_verified: bool
    avatar_url: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)
