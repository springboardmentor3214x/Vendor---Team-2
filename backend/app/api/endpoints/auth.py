from datetime import timedelta, datetime
from typing import Any
import secrets

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import schemas
from app.api import deps
from app.core import security
from app.core.config import get_settings
from app.models.user import User

settings = get_settings()
router = APIRouter()


@router.post("/login/access-token", response_model=schemas.Token)
def login_access_token(
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """OAuth2 compatible token login — returns JWT access token."""
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }


@router.post("/register", response_model=schemas.User)
def register_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: schemas.UserCreate,
) -> Any:
    """Register a new user. Email must be unique."""
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists",
        )
    if len(user_in.password) < 6:
        raise HTTPException(status_code=422, detail="Password must be at least 6 characters")
    user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        mobile_number=user_in.mobile_number,
        employee_id=user_in.employee_id,
        company_name=user_in.company_name,
        role=user_in.role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/me", response_model=schemas.User)
def get_my_profile(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get the current authenticated user's profile."""
    return current_user


@router.put("/me", response_model=schemas.User)
def update_my_profile(
    *,
    db: Session = Depends(deps.get_db),
    user_in: schemas.UserUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Update the current authenticated user's profile."""
    if user_in.full_name is not None:
        current_user.full_name = user_in.full_name
    if user_in.mobile_number is not None:
        current_user.mobile_number = user_in.mobile_number
    if user_in.employee_id is not None:
        current_user.employee_id = user_in.employee_id
    if user_in.company_name is not None:
        current_user.company_name = user_in.company_name
    if user_in.profile_picture_url is not None:
        current_user.profile_picture_url = user_in.profile_picture_url
    if user_in.password:
        if len(user_in.password) < 6:
            raise HTTPException(status_code=422, detail="Password must be at least 6 characters")
        current_user.hashed_password = security.get_password_hash(user_in.password)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/forgot-password")
def forgot_password(
    *,
    db: Session = Depends(deps.get_db),
    payload: schemas.ForgotPasswordRequest,
) -> Any:
    """
    Send a password reset token. In production this would email the link;
    for development we return the token directly so the UI can use it.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        # Return success even if user not found (security best practice)
        return {"message": "If this email is registered, a reset link has been sent."}
    
    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    db.commit()
    
    # In production: send email here
    # For dev: return token in response
    return {
        "message": "Password reset token generated",
        "reset_token": token,  # Remove this in production!
        "expires_in": "1 hour"
    }


@router.post("/reset-password")
def reset_password(
    *,
    db: Session = Depends(deps.get_db),
    payload: schemas.ResetPasswordRequest,
) -> Any:
    """Reset password using a valid reset token."""
    user = db.query(User).filter(User.reset_token == payload.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    if user.reset_token_expires and user.reset_token_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reset token has expired")
    if len(payload.new_password) < 6:
        raise HTTPException(status_code=422, detail="Password must be at least 6 characters")
    
    user.hashed_password = security.get_password_hash(payload.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    return {"message": "Password has been reset successfully"}


@router.post("/test-token", response_model=schemas.User)
def test_token(current_user: User = Depends(deps.get_current_user)) -> Any:
    """Test access token validity."""
    return current_user
