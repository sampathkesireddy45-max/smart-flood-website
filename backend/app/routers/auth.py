import re
import random
import time
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..config import settings
from ..schemas import (
    UserLogin,
    TokenResponse,
    UserResponse,
    OtpRequest,
    OtpVerifyRequest,
    OtpResponse,
    AuthConfigResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

# In-memory OTP storage: phone -> {otp, portal, created_at}
OTP_STORE: Dict[str, Dict[str, Any]] = {}

def normalize_phone(phone: str) -> str:
    """Extract clean 10-digit mobile number."""
    digits = re.sub(r"\D", "", phone or "")
    if digits.startswith("91") and len(digits) == 12:
        return digits[2:]
    if len(digits) > 10:
        return digits[-10:]
    return digits

@router.get("/config", response_model=AuthConfigResponse)
def get_auth_config():
    """Returns the designated municipal admin phone number and system mode."""
    return {
        "admin_phone": normalize_phone(settings.ADMIN_PHONE),
        "mode": settings.DATA_MODE,
    }

@router.post("/request-otp", response_model=OtpResponse)
def request_otp(payload: OtpRequest):
    """
    Sends an OTP to the given mobile number.
    If portal is 'admin', strictly enforces that the phone must match ADMIN_PHONE.
    """
    clean_phone = normalize_phone(payload.phone)
    if len(clean_phone) != 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a valid 10-digit mobile number.",
        )

    clean_admin_phone = normalize_phone(settings.ADMIN_PHONE)

    if payload.portal == "admin":
        if clean_phone != clean_admin_phone:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"ACCESS DENIED: Mobile number (+91 {clean_phone}) is not authorized for Municipal Authority Administration. Authorized administrator phone only.",
            )

    # Generate 6-digit OTP
    generated_otp = f"{random.randint(100000, 999999)}"
    # Store with 10-minute expiration
    OTP_STORE[clean_phone] = {
        "otp": generated_otp,
        "portal": payload.portal,
        "created_at": time.time(),
    }

    return {
        "success": True,
        "message": f"6-Digit verification code dispatched to +91 {clean_phone}",
        "dev_otp": generated_otp,
        "phone": clean_phone,
        "portal": payload.portal,
    }

@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(payload: OtpVerifyRequest, db: Session = Depends(get_db)):
    """
    Verifies the OTP and issues a session token and user profile.
    Admin portal strictly checks that the phone is authorized.
    """
    clean_phone = normalize_phone(payload.phone)
    clean_admin_phone = normalize_phone(settings.ADMIN_PHONE)

    if payload.portal == "admin" and clean_phone != clean_admin_phone:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ACCESS DENIED: Unauthorized administrator mobile number.",
        )

    record = OTP_STORE.get(clean_phone)
    entered_otp = payload.otp.strip()

    # Verify matching OTP or demo backup code 123456
    valid = False
    if record and record.get("otp") == entered_otp:
        # Check expiry (10 mins)
        if time.time() - record.get("created_at", 0) < 600:
            valid = True
    elif entered_otp == "123456" or (record and entered_otp == record.get("otp")):
        valid = True

    if not valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP. Please check the code or request a new one.",
        )

    # Clean up OTP record once verified
    if clean_phone in OTP_STORE:
        del OTP_STORE[clean_phone]

    # Resolve role and user identity
    if payload.portal == "admin":
        role = "authority"
        name = "Municipal Disaster Management Lead"
        email = f"admin.{clean_phone}@floodauthority.gov.in"
    else:
        role = "citizen"
        name = f"Citizen (+91 ...{clean_phone[-4:]})"
        email = f"citizen.{clean_phone}@citizen.suraksha.gov.in"

    user = db.query(User).filter(User.phone == clean_phone).first()
    if not user:
        user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(
            name=name,
            email=email,
            password_hash="otp_verified",
            role=role,
            phone=clean_phone,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update role if logging into authorized portal
        user.role = role
        user.phone = clean_phone
        db.commit()
        db.refresh(user)

    return {
        "access_token": f"suraksha-jwt-{user.id}-{user.role}-{int(time.time())}",
        "token_type": "bearer",
        "user": user,
    }

@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Fallback username/password login for backwards compatibility."""
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user:
        role = "citizen"
        if "admin" in credentials.email or "authority" in credentials.email:
            role = "authority"
        elif "worker" in credentials.email:
            role = "field_worker"
        
        user = User(
            name=credentials.email.split("@")[0].replace(".", " ").title(),
            email=credentials.email,
            password_hash="demo_hash",
            role=role,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return {
        "access_token": f"token-for-{user.id}-{user.role}",
        "token_type": "bearer",
        "user": user,
    }

@router.get("/users")
def list_demo_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users
