from typing import List, Optional, Tuple
from pydantic import BaseModel, Field


class Position(BaseModel):
    row: int = Field(..., ge=0, le=14, description="Row index (0-14)")
    col: int = Field(..., ge=0, le=14, description="Column index (0-14)")


class MoveRequest(BaseModel):
    row: int = Field(..., ge=0, le=14)
    col: int = Field(..., ge=0, le=14)
    player: int = Field(..., ge=1, le=2, description="1 for Black, 2 for White")


class AIMoveRequest(BaseModel):
    board: List[List[int]] = Field(..., description="15x15 board state")
    difficulty: str = Field("medium", description="easy, medium, hard")
    ai_player: int = Field(2, description="1 for Black, 2 for White")


class GameState(BaseModel):
    board: List[List[int]]
    current_turn: int = 1  # 1: Black, 2: White
    winner: Optional[int] = None  # None, 1, 2, or 0 (Draw)
    winning_line: Optional[List[Tuple[int, int]]] = None
    move_history: List[Tuple[int, int, int]] = []  # List of (row, col, player)
    is_game_over: bool = False


class RoomCreateResponse(BaseModel):
    room_id: str
    message: str
