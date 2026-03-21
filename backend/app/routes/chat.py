from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.chat_history import ChatHistory
from app.schemas.auth import ChatSaveRequest
from app.routes.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/save")
def save_chat(
    payload: ChatSaveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = ChatHistory(
        user_id=current_user.id,
        user_message=payload.user_message,
        bot_response=payload.bot_response,
    )
    db.add(row)
    db.commit()
    return {"status": "saved"}


@router.get("/history")
def get_chat_history(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(ChatHistory)
        .filter(ChatHistory.user_id == current_user.id)
        .order_by(ChatHistory.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id":           r.id,
            "user_message": r.user_message,
            "bot_response": r.bot_response,
            "created_at":   r.created_at,
        }
        for r in rows
    ]
