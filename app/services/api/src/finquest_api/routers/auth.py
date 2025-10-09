"""
Authentication endpoints
"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from ..supabase_client import supabase
from ..auth_utils import get_current_user

router = APIRouter()


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: dict
    expires_in: int


class RefreshRequest(BaseModel):
    refresh_token: str


class GoogleSignInRequest(BaseModel):
    id_token: str


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def sign_up(request: SignUpRequest):
    """
    Sign up a new user with email and password
    """
    try:
        # Create user in Supabase
        response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "data": {
                    "full_name": request.full_name
                }
            }
        })
        
        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user"
            )
        
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "user": {
                "id": response.user.id,
                "email": response.user.email,
                "full_name": response.user.user_metadata.get("full_name")
            },
            "expires_in": response.session.expires_in
        }
        
    except Exception as e:
        error_message = str(e)
        if "already registered" in error_message.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sign up failed: {error_message}"
        )


@router.post("/signin", response_model=AuthResponse)
async def sign_in(request: SignInRequest):
    """
    Sign in with email and password
    """
    try:
        # Sign in with Supabase
        response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        if not response.user or not response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "user": {
                "id": response.user.id,
                "email": response.user.email,
                "full_name": response.user.user_metadata.get("full_name")
            },
            "expires_in": response.session.expires_in
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Sign in failed: {str(e)}"
        )


@router.post("/signout")
async def sign_out(current_user: dict = Depends(get_current_user)):
    """
    Sign out the current user
    """
    try:
        supabase.auth.sign_out()
        return {"message": "Successfully signed out"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sign out failed: {str(e)}"
        )


@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(request: RefreshRequest):
    """
    Refresh access token using refresh token
    """
    try:
        response = supabase.auth.refresh_session(request.refresh_token)
        
        if not response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "user": {
                "id": response.user.id,
                "email": response.user.email,
                "full_name": response.user.user_metadata.get("full_name")
            },
            "expires_in": response.session.expires_in
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token refresh failed: {str(e)}"
        )


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Get current user information
    """
    try:
        # Get full user details from Supabase
        user = supabase.auth.get_user()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {
            "id": user.user.id,
            "email": user.user.email,
            "full_name": user.user.user_metadata.get("full_name"),
            "created_at": user.user.created_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to get user: {str(e)}"
        )


@router.post("/google", response_model=AuthResponse)
async def google_sign_in(request: GoogleSignInRequest):
    """
    Sign in with Google OAuth
    Note: In a real implementation, you'd verify the Google ID token
    and then create/sign in the user with Supabase
    """
    try:
        # This is a placeholder - actual implementation would verify the Google token
        # and use Supabase's OAuth flow
        response = supabase.auth.sign_in_with_id_token({
            "provider": "google",
            "token": request.id_token
        })
        
        if not response.user or not response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google sign in failed"
            )
        
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "user": {
                "id": response.user.id,
                "email": response.user.email,
                "full_name": response.user.user_metadata.get("full_name")
            },
            "expires_in": response.session.expires_in
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Google sign in failed: {str(e)}"
        )

