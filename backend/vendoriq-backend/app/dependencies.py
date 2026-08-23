from typing import Iterable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.database import get_db
from app.models.user import User, RoleEnum

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise credentials_exception
    user_id = payload.get("sub")
    if not user_id:
        raise credentials_exception
    user = db.get(User, user_id)
    if not user:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive")
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user


class RoleChecker:
    """Usage: Depends(RoleChecker([RoleEnum.ADMINISTRATOR, RoleEnum.PROCUREMENT_MANAGER]))"""

    def __init__(self, allowed_roles: Iterable[RoleEnum]):
        self.allowed_roles = set(allowed_roles)

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role.value}' is not permitted to perform this action",
            )
        return current_user


require_admin = RoleChecker([RoleEnum.ADMINISTRATOR])
require_procurement = RoleChecker([RoleEnum.ADMINISTRATOR, RoleEnum.PROCUREMENT_MANAGER])
require_supply_chain = RoleChecker([RoleEnum.ADMINISTRATOR, RoleEnum.SUPPLY_CHAIN_MANAGER, RoleEnum.PROCUREMENT_MANAGER])
require_finance = RoleChecker([RoleEnum.ADMINISTRATOR, RoleEnum.FINANCE_OFFICER])
require_auditor_or_admin = RoleChecker([RoleEnum.ADMINISTRATOR, RoleEnum.AUDITOR])
require_management = RoleChecker([
    RoleEnum.ADMINISTRATOR, RoleEnum.PROCUREMENT_MANAGER, RoleEnum.SUPPLY_CHAIN_MANAGER
])
