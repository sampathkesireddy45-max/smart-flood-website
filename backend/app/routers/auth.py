from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import UserLogin, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user:
        # If user not found, create a demo user for smooth testing/demo flow
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
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return {
        "access_token": f"token-for-{user.id}-{user.role}",
        "token_type": "bearer",
        "user": user
    }

@router.get("/users")
def list_demo_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users
