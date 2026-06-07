from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
from datetime import datetime
import json
import uuid

from room_manager import RoomManager


app = FastAPI(title="Crocodile Game API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


room_manager = RoomManager()
active_connections: Dict[WebSocket, dict] = {}



async def send_json(ws: WebSocket, msg_type: str, payload: dict):
    try:
        await ws.send_json({
            "type": msg_type,
            "payload": payload,
            "timestamp": int(datetime.now().timestamp() * 1000)
        })
    except Exception as e:
        print(f"Error sending message: {e}")


async def broadcast_to_room(room_id: str, msg_type: str, payload: dict, exclude_ws: WebSocket = None):
    for ws, info in active_connections.items():
        if info.get("room_id") == room_id and ws != exclude_ws:
            await send_json(ws, msg_type, payload)


async def broadcast_to_all(msg_type: str, payload: dict):
    for ws in active_connections.keys():
        await send_json(ws, msg_type, payload)


async def send_rooms_list_to_all():
    await broadcast_to_all("rooms_list", room_manager.get_all_rooms())



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
    
    print(f"Client connected: {conn_id}")
    print(f"Total connections: {len(active_connections)}")
    await send_json(websocket, "rooms_list",  room_manager.get_all_rooms())
    
    try:
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            msg_type = message.get("type")
            payload = message.get("payload", {})
            
            if msg_type == "get_rooms":
                await send_json(websocket, "rooms_list",  room_manager.get_all_rooms())
            
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
            
            elif msg_type == "edit_room":
                room_id = payload.get("room_id")
                name = payload.get("name")
                description = payload.get("description", "")
                capacity = payload.get("capacity")
                words = payload.get("words")  # Добавлена поддержка слов
                
                room = room_manager.get_room(room_id)
                if room:
                    if name:
                        room.name = name
                    if description is not None:
                        room.description = description
                    if capacity:
                        room.capacity = capacity
                    if words and isinstance(words, list) and len(words) > 0:
                        room.update_words_pool(words)
                        room_manager._add_system_message(room_id, f"📝 Обновлен список слов! Доступно {len(words)} слов")
                    
                    await broadcast_to_all("room_update", room.to_dict())
                else:
                    await send_json(websocket, "error", {"message": "Cannot edit default room"})
            
            elif msg_type == "user_joined":
                user_id = payload.get("user_id")
                user_name = payload.get("user_name", user_id)
                room_id = payload.get("room_id")
                
                room, error = room_manager.join_room(room_id, user_id, user_name)
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
            
            elif msg_type == "user_left":
                room_id = payload.get("room_id")
                user_id = payload.get("user_id")
                user_name = payload.get("user_name", user_id)
                
                room, needRedraw = room_manager.leave_room(room_id, user_id, user_name)
                
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
                    if needRedraw:
                        strokes = room.get_strokes()
                        await broadcast_to_room(room_id, "set_strokes", {
                            "strokes": strokes,
                            "room_id": room_id,
                            "userId": user_id,
                            "userName": user_name
                        })

            
            elif msg_type == "new_message":
                room_id = payload.get("roomId")
                user_id = payload.get("userId")
                user_name = payload.get("userName")
                text = payload.get("text")
                
                result, isGuess = room_manager.add_message(room_id, user_id, user_name, text)
                
                if result:
                    await broadcast_to_room(room_id, "new_message", result.to_dict())
                if isGuess:
                    await broadcast_to_all("room_update", room.to_dict())
                    history = room_manager.get_messages(room_id)
                    await broadcast_to_room(room_id, "new_message",history[-1])
                    strokes = room.get_strokes()
                    await broadcast_to_room(room_id, "set_strokes", {
                            "strokes": strokes,
                            "room_id": room_id,
                            "userId": user_id,
                            "userName": user_name
                        })
            
            elif msg_type == "request_history":
                room_id = payload.get("roomId")
                if room_id:
                    history = room_manager.get_messages(room_id)
                    await send_json(websocket, "message_history", {
                        "room_id": room_id,
                        "messages": history
                    })
            

            elif msg_type == "delete_room":
                room_id = payload
                success = room_manager.delete_room(room_id)
                if success:
                    await send_rooms_list_to_all()
                else:
                    await send_json(websocket, "error", {"message": "Failed to delete room"})
            
            elif msg_type == "add_stroke":
                room_id = payload.get("roomId")
                user_id = payload.get("userId")
                user_name = payload.get("userName")
                
                if room_id and payload:
                    room = room_manager.get_room(room_id)
                    if room and room.leader_id == user_id:
                        stroke = room_manager.add_stroke_to_room(room_id, payload)
                        if stroke:
                            await broadcast_to_room(room_id, "draw_stroke", {
                                "stroke": stroke.to_dict(),
                                "points": stroke.to_dict()["points"],
                                "brush": stroke.to_dict()["brush"],
                                "userId": user_id,
                                "userName": user_name
                            })

            elif msg_type == "set_strokes":
                room_id = payload.get("roomId")
                user_id = payload.get("userId")
                user_name = payload.get("userName")
                strokes = payload.get("strokes", [])
                
                if room_id:
                    room = room_manager.get_room(room_id)
                    if room and room.leader_id == user_id:
                        room.load_strokes(strokes)
                        await broadcast_to_room(room_id, "set_strokes", {
                            "strokes": strokes,
                            "room_id": room_id,
                            "userId": user_id,
                            "userName": user_name
                        })

            elif msg_type == "request_canvas":
                room_id = payload.get("roomId")
                if room_id:
                    strokes = room_manager.get_room_strokes(room_id)
                    await broadcast_to_room(room_id, "set_strokes", {
                        "strokes": strokes,
                        "room_id": room_id,
                        "userId": user_id,
                        "userName": user_name
                    })
    
    except WebSocketDisconnect:
        print(f"Client disconnected: {conn_id}")
        
        info = active_connections.get(websocket)
        if info and info.get("room_id") and info.get("user_id"):
            room_id = info["room_id"]
            user_id = info["user_id"]
            user_name = info.get("user_name", user_id)
            
            room, deleted = room_manager.leave_room(room_id, user_id, user_name)
            
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
        print(f"Total connections: {len(active_connections)}")
    
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        active_connections.pop(websocket, None)



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
    return {"rooms": room_manager.get_all_rooms()}


@app.get("/rooms/{room_id}")
async def get_room(room_id: str):
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
    success = room_manager.delete_room(room_id)
    if success:
        await send_rooms_list_to_all()
        return {"success": True, "message": "Room deleted"}
    return {"success": False, "message": "Cannot delete default room or room not found"}


if __name__ == "__main__":
    import uvicorn
    print("Crocodile Game Server")
    for room in room_manager.get_all_rooms():
        if room.get("owner_id") == "system":
            print(f"   - {room['name']} (ID: {room['id'][:8]}...)")
    print("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=8080)