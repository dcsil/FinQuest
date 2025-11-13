"""
Authentication utilities for JWT token validation
"""
from uuid import UUID
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from .config import settings
from .db.models import User
from .db.session import get_session

security = HTTPBearer()


async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Verify JWT token from Supabase
    """
    token = credentials.credentials
    
    try:
        # Decode and verify the JWT token
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    token_payload: dict = Depends(verify_token),
    db: Session = Depends(get_session)
) -> User:
    """
    Get current user from database using auth_user_id from token payload.
    Creates user if doesn't exist (for first-time login).
    """
    auth_user_id_str = token_payload.get("sub")
    if not auth_user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    try:
        auth_user_id = UUID(auth_user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format"
        )
    
    # Look up user by auth_user_id
    user = db.query(User).filter(
        User.auth_user_id == auth_user_id,
        User.deleted_at.is_(None)
    ).first()
    
    if not user:
        # User doesn't exist in our DB yet - create it
        email = token_payload.get("email", "")
        user = User(
            auth_user_id=auth_user_id,
            email=email,
            base_currency="USD",  # Default, can be updated later
            timezone="America/Toronto"  # Default
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return user

