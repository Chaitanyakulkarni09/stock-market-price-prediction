from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import auth_service
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserOut
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["auth"])
bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    """Shared dependency — resolves JWT → User ORM object."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = auth_service.decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = auth_service.get_user_by_id(db, int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if auth_service.get_user_by_email(db, payload.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    user  = auth_service.register_user(db, payload.name, payload.email, payload.password)
    token = auth_service.create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = auth_service.authenticate_user(db, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = auth_service.create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.delete("/delete-account", status_code=200)
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete the authenticated user and all their data (watchlist, chat history)."""
    from app.models.watchlist import WatchlistItem
    from app.models.chat_history import ChatHistory
    user_id = current_user.id
    # Explicitly delete child rows first with synchronize_session=False
    db.query(WatchlistItem).filter(WatchlistItem.user_id == user_id).delete(synchronize_session=False)
    db.query(ChatHistory).filter(ChatHistory.user_id == user_id).delete(synchronize_session=False)
    db.query(User).filter(User.id == user_id).delete(synchronize_session=False)
    db.commit()
    return {"message": "Account deleted successfully"}
