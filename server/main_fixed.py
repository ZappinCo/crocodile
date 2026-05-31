# app/main_fixed.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
from datetime import datetime
import json
import uuid

# Правильный импорт - room_manager из текущей папки
from room_manager import RoomManager

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
        print("send room message to ",info)
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
    await send_json(websocket, "rooms_list",  room_manager.get_all_rooms())
    
    try:
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            msg_type = message.get("type")
            payload = message.get("payload", {})
            
            print(f"📨 Received: {msg_type} from {conn_id}")
            
            # 1. ПОЛУЧИТЬ СПИСОК КОМНАТ
            if msg_type == "get_rooms":
                await send_json(websocket, "rooms_list",  room_manager.get_all_rooms())
            
            # 2. СОЗДАТЬ КОМНАТУ
            elif msg_type == "create_room":
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
            
            elif msg_type == "update_room":
                room_id = payload.get("room_id")
                name = payload.get("name")
                description = payload.get("description", "")
                capacity = payload.get("capacity")
                
                room = room_manager.get_room(room_id)
                if room:
                    room.name = name
                    room.description = description
                    room.capacity = capacity
                    room_manager._add_system_message(room_id, f"✏️ Комната обновлена: {name}")
                    await broadcast_to_all("room_update", room.to_dict())
                else:
                    await send_json(websocket, "error", {"message": "Cannot edit default room"})
            # 3. ПРИСОЕДИНИТЬСЯ К КОМНАТЕ
            elif msg_type == "user_joined":

                user_id = payload.get("user_id")
                user_name = payload.get("user_name", user_id)
                room_id = payload.get("room_id")
                
                room, error = room_manager.join_room(room_id, user_id, user_name)
                print("user_joined")
                if room:
                    active_connections[websocket]["user_id"] = user_id
                    active_connections[websocket]["room_id"] = room.id
                    active_connections[websocket]["user_name"] = user_name
                    
                    await broadcast_to_all("room_update", room.to_dict())
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
                    
                else:
                    await send_json(websocket, "error", {"message": error or "Cannot join room"})
            
            # 4. ПОКИНУТЬ КОМНАТУ
            elif msg_type == "user_left":
                room_id = payload.get("room_id")
                user_id = payload.get("user_id")
                user_name = payload.get("user_name", user_id)
                
                room, deleted = room_manager.leave_room(room_id, user_id,user_name)
                
                active_connections[websocket]["room_id"] = None
                active_connections[websocket]["user_id"] = None
                active_connections[websocket]["user_name"] = None
                
                if room:
                    await broadcast_to_all("room_update", room.to_dict())
                    await broadcast_to_room(room_id, "user_left", {
                        "room_id": room_id,
                        "user_id": user_id,
                        "user_name": user_name,
                        "user_count": room.current_users,
                        "users": room.get_users_list(),
                        "leader_id": room.leader_id,
                        "leader_name": room.leader_name
                    })
            
            # 5. НОВОЕ СООБЩЕНИЕ
            elif msg_type == "new_message":
                room_id = payload.get("roomId")
                user_id = payload.get("userId")
                user_name = payload.get("userName")
                text = payload.get("text")
                
                result,isGuess = room_manager.add_message(room_id, user_id, user_name, text)
                
                if result:
                    print("broadcast_to_room")
                    await broadcast_to_all("new_message", result.to_dict())
                if isGuess:
                    print("isGuess")
                    await broadcast_to_all("room_update", room.to_dict())
            
            # 6. ИСТОРИЯ СООБЩЕНИЙ
            elif msg_type == "request_history":
                room_id = payload.get("roomId")
                if room_id:
                    history = room_manager.get_messages(room_id)
                    await send_json(websocket, "message_history", {
                        "room_id": room_id,
                        "messages": history
                    })
            
            # 9. PING
            elif msg_type == "ping":
                await send_json(websocket, "pong", {"timestamp": datetime.now().timestamp()})

                # 11. УДАЛЕНИЕ КОМНАТЫ
            elif msg_type == "delete_room":
                print(payload)
                room_id = payload
                room = room_manager.get_room(room_id)
                success = room_manager.delete_room(room_id)
                if success:
                    await send_rooms_list_to_all()
                else:
                    await send_json(websocket, "error", {"message": "Failed to delete room"})
                    
            # 7. НОВАЯ ЛИНИЯ (рисование)
            elif msg_type == "add_stroke":
                print(payload)
                room_id = payload.get("roomId")
                user_id = payload.get("userId")
                user_name = payload.get("userName")
                
                if room_id and payload:
                    room = room_manager.get_room(room_id)
                    # Только ведущий может рисовать
                    if room and room.leader_id == user_id:
                        stroke = room_manager.add_stroke_to_room(room_id, payload)
                        if stroke:
                            # Отправляем новую линию всем в комнате
                            await broadcast_to_room(room_id, "draw_stroke", {
                                "stroke": stroke.to_dict(),
                                "points":stroke.to_dict()["points"],
                                "brush":stroke.to_dict()["brush"],
                                "userId": user_id,
                                "userName": user_name
                            })
                            print(f"🎨 Stroke added to room {room_id} by {user_name}")

            # 8. ОЧИСТИТЬ ХОЛСТ
            elif msg_type == "clear_canvas":
                room_id = payload.get("roomId")
                user_id = payload.get("userId")
                user_name = payload.get("userName")
                
                if room_id:
                    room = room_manager.get_room(room_id)
                    # Только ведущий может очищать холст
                    if room and room.leader_id == user_id:
                        room_manager.clear_room_canvas(room_id)
                        # Отправляем команду очистки всем в комнате
                        await broadcast_to_room(room_id, "clear_canvas", {
                            "userId": user_id,
                            "userName": user_name
                        })
                        print(f"🗑️ Canvas cleared in room {room_id} by {user_name}")

            # 9. ОТМЕНИТЬ (UNDO)
            elif msg_type == "undo_stroke":
                room_id = payload.get("roomId")
                user_id = payload.get("userId")
                user_name = payload.get("userName")
                
                if room_id:
                    room = room_manager.get_room(room_id)
                    # Только ведущий может отменять
                    if room and room.leader_id == user_id:
                        removed = room_manager.undo_room_stroke(room_id)
                        if removed:
                            await broadcast_to_room(room_id, "undo_stroke", {
                                "strokeId": removed.id,
                                "userId": user_id,
                                "userName": user_name
                            })
                            print(f"↩️ Undo in room {room_id} by {user_name}")

            # 10. ВЕРНУТЬ (REDO)
            elif msg_type == "redo_stroke":
                room_id = payload.get("roomId")
                user_id = payload.get("userId")
                user_name = payload.get("userName")
                
                if room_id:
                    room = room_manager.get_room(room_id)
                    # Только ведущий может возвращать
                    if room and room.leader_id == user_id:
                        restored = room_manager.redo_room_stroke(room_id)
                        if restored:
                            await broadcast_to_room(room_id, "redo_stroke", {
                                "stroke": restored.to_dict(),
                                "userId": user_id,
                                "userName": user_name
                            })
                            print(f"↪️ Redo in room {room_id} by {user_name}")

            # 11. ЗАПРОСИТЬ ХОЛСТ (при подключении нового пользователя)
            elif msg_type == "request_canvas":
                room_id = payload.get("roomId")
                if room_id:
                    strokes = room_manager.get_room_strokes(room_id)
                    await send_json(websocket, "canvas_state", {
                        "strokes": strokes,
                        "room_id": room_id
                    })
                    print(f"🎨 Canvas state sent to {conn_id} for room {room_id}")
                        
            
    
    except WebSocketDisconnect:
        print(f"🔌 Client disconnected: {conn_id}")
        
        info = active_connections.get(websocket)
        if info and info.get("room_id") and info.get("user_id"):
            room_id = info["room_id"]
            user_id = info["user_id"]
            user_name = info.get("user_name", user_id)
            
            room, deleted = room_manager.leave_room(room_id, user_id,user_name)
            
            if room:
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