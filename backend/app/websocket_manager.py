import json
import random
import string
from typing import Dict, List, Optional
from fastapi import WebSocket
from backend.app.game_logic import OmokGame, BLACK, WHITE


class ConnectionManager:
    def __init__(self):
        # room_id -> {"game": OmokGame, "connections": {player_id: WebSocket}, "players": {player_id: player_color}}
        self.rooms: Dict[str, dict] = {}

    def generate_room_id(self) -> str:
        while True:
            room_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            if room_id not in self.rooms:
                return room_id

    def create_room(self) -> str:
        room_id = self.generate_room_id()
        self.rooms[room_id] = {
            "game": OmokGame(),
            "connections": {},
            "player_colors": {},
            "spectators": []
        }
        return room_id

    async def connect(self, websocket: WebSocket, room_id: str, client_id: str) -> Optional[int]:
        await websocket.accept()

        if room_id not in self.rooms:
            self.rooms[room_id] = {
                "game": OmokGame(),
                "connections": {},
                "player_colors": {},
                "spectators": []
            }

        room = self.rooms[room_id]
        assigned_color = None

        # Assign player color (BLACK for first player, WHITE for second)
        existing_colors = list(room["player_colors"].values())
        if BLACK not in existing_colors:
            assigned_color = BLACK
        elif WHITE not in existing_colors:
            assigned_color = WHITE
        else:
            # Spectator mode
            room["spectators"].append(websocket)

        if assigned_color:
            room["connections"][client_id] = websocket
            room["player_colors"][client_id] = assigned_color

        # Broadcast update room state to all clients in room
        await self.broadcast_game_state(room_id)
        return assigned_color

    def disconnect(self, room_id: str, client_id: str, websocket: WebSocket):
        if room_id in self.rooms:
            room = self.rooms[room_id]
            if client_id in room["connections"]:
                del room["connections"][client_id]
            if client_id in room["player_colors"]:
                del room["player_colors"][client_id]
            if websocket in room["spectators"]:
                room["spectators"].remove(websocket)

            # Cleanup empty room
            if not room["connections"] and not room["spectators"]:
                del self.rooms[room_id]

    async def broadcast_game_state(self, room_id: str):
        if room_id not in self.rooms:
            return

        room = self.rooms[room_id]
        game: OmokGame = room["game"]
        state_data = {
            "type": "state_update",
            "room_id": room_id,
            "state": game.get_state(),
            "players_count": len(room["player_colors"]),
            "is_ready": len(room["player_colors"]) == 2
        }

        message_str = json.dumps(state_data)

        # Send to player connections
        for ws in room["connections"].values():
            try:
                await ws.send_text(message_str)
            except Exception:
                pass

        # Send to spectators
        for ws in room["spectators"]:
            try:
                await ws.send_text(message_str)
            except Exception:
                pass

    async def broadcast_message(self, room_id: str, data: dict):
        if room_id not in self.rooms:
            return

        room = self.rooms[room_id]
        message_str = json.dumps(data)

        for ws in list(room["connections"].values()) + room["spectators"]:
            try:
                await ws.send_text(message_str)
            except Exception:
                pass


manager = ConnectionManager()
