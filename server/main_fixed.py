# app/main_fixed.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
from datetime import datetime
import json
import uuid

# Правильный импорт - room_manager из текущей папки
from .room_manager import RoomManager

# ========== СОЗДАНИЕ ПРИЛОЖЕНИЯ ==========

app = FastAPI(title="Crocodile Game API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== ИНИЦИАЛИЗАЦИЯ ==========

room_manager = RoomManager()
active_connections: Dict[WebSocket, dict] = {}


# ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

async def send_json(ws: WebSocket, msg_type: str, payload: dict):
    """Отправить JSON сообщение клиенту"""
    try:
        await ws.send_json({
            "type": msg_type,
            "payload": payload,
            "timestamp": int(datetime.now().timestamp() * 1000)
        })
    except Exception as e:
        print(f"Error sending message: {e}")


async def broadcast_to_room(room_id: str, msg_type: str, payload: dict, exclude_ws: WebSocket = None):
    """Отправить сообщение всем в комнате"""
    for ws, info in active_connections.items():
        if info.get("room_id") == room_id and ws != exclude_ws:
            await send_json(ws, msg_type, payload)


async def broadcast_to_all(msg_type: str, payload: dict):
    """Отправить сообщение всем подключенным клиентам"""
    for ws in active_connections.keys():
        await send_json(ws, msg_type, payload)


async def send_rooms_list_to_all():
    """Отправить список комнат всем клиентам"""
    
    await broadcast_to_all("rooms_list", room_manager.get_all_rooms())


# ========== WEB SOCKET ХЕНДЛЕР ==========

@app.websocket("/ws")
async def websocket_handler(websocket: WebSocket):
    await websocket.accept()
    conn_id = str(uuid.uuid4())[:8]
    
    active_connections[websocket] = {
        "id": conn_id,
        "user_id": None,
        "user_name": None,
        "room_id": None,
        "connected_at": datetime.now().isoformat()
    }
    
    print(f"🔌 Client connected: {conn_id}")
    print(f"📊 Total connections: {len(active_connections)}")
    
    try:
        # Отправляем приветствие и список комнат
        await send_json(websocket, "connect", {"connected": True})
        await send_rooms_list_to_all();
        print(f"📋 Sent initial rooms to {conn_id} ({room_manager.get_rooms_count()} rooms)")
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            msg_type = message.get("type")
            payload = message.get("payload", {})
            
            print(f"📨 Received: {msg_type} from {conn_id}")
            
            # 1. ПОЛУЧИТЬ СПИСОК КОМНАТ
            if msg_type == "get_rooms":
                await send_json(websocket, "rooms_list", {
                    "rooms": room_manager.get_all_rooms()
                })
            
            # 2. СОЗДАТЬ КОМНАТУ
            elif msg_type == "room_created":
                creator_id = payload.get("creator_id")
                creator_name = payload.get("creator_name")
                
                room = room_manager.create_room(
                    name=payload.get("name"),
                    description=payload.get("description", ""),
                    capacity=payload.get("capacity", 6),
                    creator_id=creator_id,
                    creator_name=creator_name
                )
                
                if room:
                    active_connections[websocket]["user_id"] = creator_id
                    active_connections[websocket]["room_id"] = room.id
                    active_connections[websocket]["user_name"] = creator_name
                    
                    await send_rooms_list_to_all()
                    
                    await send_json(websocket, "room_created", {
                        "room": room.to_dict(),
                        "message": f"Room '{payload.get('name')}' created"
                    })
                    
                    history = room_manager.get_messages(room.id)
                    if history:
                        await send_json(websocket, "message_history", {
                            "room_id": room.id,
                            "messages": history
                        })
                else:
                    await send_json(websocket, "error", {"message": "Room name already exists"})
            
            # 3. ПРИСОЕДИНИТЬСЯ К КОМНАТЕ
            elif msg_type == "user_joined":
                user_id = payload.get("user_id")
                user_name = payload.get("user_name", user_id)
                room_id = payload.get("room_id")
                
                room, error = room_manager.join_room(room_id, user_id, user_name)
                
                if room:
                    active_connections[websocket]["user_id"] = user_id
                    active_connections[websocket]["room_id"] = room.id
                    active_connections[websocket]["user_name"] = user_name
                    
                    await broadcast_to_room(room.id, "room_update", room.to_dict())
                    await broadcast_to_room(room.id, "user_joined", {
                        "room_id": room.id,
                        "user_id": user_id,
                        "user_name": user_name,
                        "user_count": room.current_users,
                        "users": room.get_users_list(),
                        "leader_id": room.leader_id,
                        "leader_name": room.leader_name,
                        "game_active": room.game_active
                    })
                    
                    history = room_manager.get_messages(room.id)
                    await send_json(websocket, "message_history", {
                        "room_id": room.id,
                        "messages": history
                    })
                    
                    await send_rooms_list_to_all()
                else:
                    await send_json(websocket, "error", {"message": error or "Cannot join room"})
            
            # 4. ПОКИНУТЬ КОМНАТУ
            elif msg_type == "user_left":
                room_id = payload.get("room_id")
                user_id = payload.get("user_id")
                user_name = payload.get("user_name", user_id)
                
                room, deleted = room_manager.leave_room(room_id, user_id)
                
                active_connections[websocket]["room_id"] = None
                active_connections[websocket]["user_id"] = None
                active_connections[websocket]["user_name"] = None
                
                if deleted:
                    await broadcast_to_all("room_deleted", room_id)
                elif room:
                    await broadcast_to_room(room_id, "room_update", room.to_dict())
                    await broadcast_to_room(room_id, "user_left", {
                        "room_id": room_id,
                        "user_id": user_id,
                        "user_name": user_name,
                        "user_count": room.current_users,
                        "users": room.get_users_list(),
                        "leader_id": room.leader_id,
                        "leader_name": room.leader_name
                    })
                
                await send_rooms_list_to_all()
            
            # 5. НОВОЕ СООБЩЕНИЕ
            elif msg_type == "new_message":
                room_id = payload.get("roomId")
                user_id = payload.get("userId")
                user_name = payload.get("userName", user_id)
                text = payload.get("text")
                is_guess = payload.get("isGuess", False)
                
                result = room_manager.add_message(room_id, user_id, user_name, text, is_guess)
                
                if result:
                    await broadcast_to_room(room_id, "new_message", result.to_dict())
                    
                    if "угадал" in result.text:
                        room = room_manager.get_room(room_id)
                        if room:
                            await broadcast_to_room(room_id, "room_update", room.to_dict())
            
            # 6. ИСТОРИЯ СООБЩЕНИЙ
            elif msg_type == "request_history":
                room_id = payload.get("roomId")
                if room_id:
                    history = room_manager.get_messages(room_id)
                    await send_json(websocket, "message_history", {
                        "room_id": room_id,
                        "messages": history
                    })
            
            # 7. ИНФОРМАЦИЯ О КОМНАТЕ
            elif msg_type == "get_room_info":
                room_id = payload.get("room_id")
                room = room_manager.get_room(room_id)
                
                if room:
                    await send_json(websocket, "room_info", {
                        "room": room.to_dict(),
                        "users": room.get_users_with_names()
                    })
            
            # 8. СТАТУС ИГРЫ
            elif msg_type == "get_game_status":
                room_id = payload.get("room_id")
                room = room_manager.get_room(room_id)
                if room:
                    await send_json(websocket, "game_status", {
                        "game_active": room.game_active,
                        "current_word": room.current_word if room.leader_id else None,
                        "leader_id": room.leader_id,
                        "leader_name": room.leader_name
                    })
            
            # 9. PING
            elif msg_type == "ping":
                await send_json(websocket, "pong", {"timestamp": datetime.now().timestamp()})
            
            else:
                await send_json(websocket, "error", {"message": f"Unknown type: {msg_type}"})
    
    except WebSocketDisconnect:
        print(f"🔌 Client disconnected: {conn_id}")
        
        info = active_connections.get(websocket)
        if info and info.get("room_id") and info.get("user_id"):
            room_id = info["room_id"]
            user_id = info["user_id"]
            user_name = info.get("user_name", user_id)
            
            room, deleted = room_manager.leave_room(room_id, user_id)
            
            if deleted:
                await broadcast_to_all("room_deleted", room_id)
            elif room:
                await broadcast_to_room(room_id, "room_update", room.to_dict())
                await broadcast_to_room(room_id, "user_left", {
                    "room_id": room_id,
                    "user_id": user_id,
                    "user_name": user_name,
                    "user_count": room.current_users,
                    "users": room.get_users_list(),
                    "leader_id": room.leader_id,
                    "leader_name": room.leader_name
                })
            
            await send_rooms_list_to_all()
        
        active_connections.pop(websocket, None)
        print(f"📊 Total connections: {len(active_connections)}")
    
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        active_connections.pop(websocket, None)


# ========== HTTP ENDPOINTS ==========

@app.get("/")
async def root():
    return {
        "status": "running",
        "connections": len(active_connections),
        "rooms": room_manager.get_rooms_count(),
        "message": "Crocodile Game Server"
    }


@app.get("/rooms")
async def get_rooms():
    """Получить список всех комнат"""
    return {"rooms": room_manager.get_all_rooms()}


@app.get("/rooms/{room_id}")
async def get_room(room_id: str):
    """Получить информацию о комнате"""
    room = room_manager.get_room(room_id)
    if room:
        return {
            "room": room.to_dict(),
            "users": room.get_users_with_names(),
            "messages_count": len(room_manager.get_messages(room_id))
        }
    return {"error": "Room not found"}, 404


@app.get("/stats")
async def get_stats():
    """Получить статистику сервера"""
    return {
        "active_connections": len(active_connections),
        "total_rooms": room_manager.get_rooms_count(),
        "rooms": room_manager.get_all_rooms(),
        "connections": [
            {
                "id": info["id"],
                "user_name": info.get("user_name"),
                "room_id": info.get("room_id"),
                "connected_at": info["connected_at"]
            }
            for info in active_connections.values()
        ]
    }


@app.delete("/rooms/{room_id}")
async def delete_room(room_id: str):
    """Удалить комнату"""
    success = room_manager.delete_room(room_id)
    if success:
        await broadcast_to_all("room_deleted", room_id)
        await send_rooms_list_to_all()
        return {"success": True, "message": "Room deleted"}
    return {"success": False, "message": "Cannot delete default room or room not found"}


if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("🐊 Crocodile Game Server")
    print("=" * 60)
    print(f"📍 WebSocket URL: ws://localhost:8080/ws")
    print(f"📍 HTTP API: http://localhost:8080")
    print(f"📍 Rooms list: http://localhost:8080/rooms")
    print(f"📍 Stats: http://localhost:8080/stats")
    print("=" * 60)
    print("\n📋 Default rooms:")
    for room in room_manager.get_all_rooms():
        if room.get("is_default"):
            print(f"   - {room['name']} (ID: {room['id'][:8]}...)")
    print("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=8080)