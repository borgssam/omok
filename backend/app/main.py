import os
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from backend.app.models import AIMoveRequest, RoomCreateResponse
from backend.app.game_logic import OmokGame, BLACK, WHITE
from backend.app.ai import OmokAI
from backend.app.websocket_manager import manager

app = FastAPI(
    title="Vanilla JS FastAPI Omok Server",
    description="Backend API and WebSockets for Omok (Gomoku) Game",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "FastAPI Omok Server Running"}


@app.post("/api/ai/move")
async def get_ai_move(request: AIMoveRequest):
    """
    Computes the best move for the AI given board state and difficulty.
    """
    try:
        ai_engine = OmokAI(ai_player=request.ai_player)
        r, c = ai_engine.get_best_move(request.board, difficulty=request.difficulty)
        return {"row": r, "col": c, "difficulty": request.difficulty}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/rooms", response_model=RoomCreateResponse)
async def create_room():
    """Creates a new WebSocket multiplayer game room."""
    room_id = manager.create_room()
    return RoomCreateResponse(room_id=room_id, message="Room created successfully")


@app.websocket("/ws/omok/{room_id}/{client_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, client_id: str):
    color = await manager.connect(websocket, room_id, client_id)

    # Send initial welcome & assigned player color
    await websocket.send_text(json.dumps({
        "type": "connected",
        "client_id": client_id,
        "color": color,
        "color_name": "Black" if color == BLACK else ("White" if color == WHITE else "Spectator")
    }))

    try:
        while True:
            data_str = await websocket.receive_text()
            data = json.loads(data_str)
            action = data.get("action")

            room = manager.rooms.get(room_id)
            if not room:
                break

            game: OmokGame = room["game"]

            if action == "move":
                row = data.get("row")
                col = data.get("col")
                player = room["player_colors"].get(client_id)

                if player and game.make_move(row, col, player):
                    await manager.broadcast_game_state(room_id)

            elif action == "reset":
                game.reset()
                await manager.broadcast_game_state(room_id)

            elif action == "undo":
                game.undo_move()
                await manager.broadcast_game_state(room_id)

            elif action == "chat":
                msg = data.get("message", "")
                sender = "Black" if color == BLACK else ("White" if color == WHITE else "Spectator")
                await manager.broadcast_message(room_id, {
                    "type": "chat",
                    "sender": sender,
                    "message": msg
                })

    except WebSocketDisconnect:
        manager.disconnect(room_id, client_id, websocket)
        await manager.broadcast_game_state(room_id)
    except Exception as e:
        manager.disconnect(room_id, client_id, websocket)


# Mount frontend static files
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend"))
if os.path.exists(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

    @app.get("/")
    async def read_index():
        return FileResponse(os.path.join(frontend_dir, "index.html"))
