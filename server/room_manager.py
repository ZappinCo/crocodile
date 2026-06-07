import uuid
import random
import json
from typing import Dict, List, Optional
from datetime import datetime


class Point:
    def __init__(self, x: float, y: float):
        self.x = x
        self.y = y

    def to_dict(self):
        return {"x": self.x, "y": self.y}

    @staticmethod
    def from_dict(data: dict):
        return Point(data.get("x", 0), data.get("y", 0))


class Stroke:
    def __init__(self, id: str, points: List[Point], brush: dict):
        self.id = id
        self.points = points
        self.brush = brush

    def to_dict(self):
        return {
            "id": self.id,
            "points": [p.to_dict() for p in self.points],
            "brush": self.brush
        }

    @staticmethod
    def from_dict(data: dict):
        points = [Point.from_dict(p) for p in data.get("points", [])]
        return Stroke(
            id=data.get("id", str(uuid.uuid4())),
            points=points,
            brush=data.get("brush", {"color": "#000000", "size": 0.2, "brushType": "round", "eraser": False})
        )


class Message:
    def __init__(self, id: str, roomId: str, userId: str, userName: str, text: str, timestamp: str):
        self.id = id
        self.roomId = roomId
        self.userId = userId
        self.userName = userName
        self.text = text
        self.timestamp = timestamp

    def to_dict(self):
        return {
            "id": self.id,
            "roomId": self.roomId,
            "userId": self.userId,
            "userName": self.userName,
            "text": self.text,
            "timestamp": self.timestamp,
        }


class Room:
    def __init__(self, name: str, description: str, capacity: int, owner_id: str = "system"):
        self.id = str(uuid.uuid4())
        self.owner_id = owner_id
        self.name = name
        self.description = description
        self.capacity = capacity
        self.current_users = 0
        self.users: Dict[str, str] = {}
        self.leader_id: Optional[str] = None
        self.leader_name: Optional[str] = None
        self.game_active = False
        self.current_word: Optional[str] = None
        self.words_pool = ["кот", "собака", "дом", "машина", "солнце", "луна", "цветок", "дерево", "книга", "компьютер"]
        
        self.strokes: List[Stroke] = []
        self.canvas_history: List[str] = []
        self.canvas_future: List[str] = []

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "capacity": self.capacity,
            "current_users": self.current_users,
            "leader_id": self.leader_id,
            "leader_name": self.leader_name,
            "current_word": self.current_word if self.leader_id else None,
            "game_active": self.game_active,
            "owner_id": self.owner_id,
            "words_pool": self.words_pool
        }

    def update_words_pool(self, words: List[str]):
        if words and len(words) > 0:
            self.words_pool = words

    def add_user(self, user_id: str, user_name: str) -> bool:
        if user_id in self.users or self.current_users >= self.capacity:
            return False
        
        self.users[user_id] = user_name
        self.current_users = len(self.users)
        
        if len(self.users) == 1:
            self.leader_id = user_id
            self.leader_name = user_name
            self.game_active = True
            self.current_word = random.choice(self.words_pool)
        
        return True

    def remove_user(self, user_id: str) -> bool:
        if user_id not in self.users:
            return False
        
        del self.users[user_id]
        self.current_users = len(self.users)
        
        if self.leader_id == user_id and self.current_users > 0:
            new_leader_id = list(self.users.keys())[0]
            self.leader_id = new_leader_id
            self.leader_name = self.users[new_leader_id]
            self.current_word = random.choice(self.words_pool)
            self.clear_canvas()
            return True

        if self.current_users == 0:
            self.leader_id = None
            self.leader_name = None
            self.current_word = None
            self.clear_canvas()
            return True
        
        return False

    def get_user_name(self, user_id: str) -> str:
        return self.users.get(user_id, user_id)

    def get_users_list(self) -> List[str]:
        return list(self.users.keys())

    def get_users_with_names(self) -> List[Dict]:
        return [{"id": uid, "name": name} for uid, name in self.users.items()]

    def check_guess(self, user_id: str, guess: str) -> bool:
        if not self.game_active or user_id == self.leader_id:
            return False
        if self.current_word and guess.lower().strip() == self.current_word.lower():
            self.leader_id = user_id
            self.leader_name = self.users.get(user_id, user_id)
            self.current_word = random.choice(self.words_pool) if self.words_pool else "слово"
            self.clear_canvas()
            return True
        return False

    
    def add_stroke(self, stroke_data: dict) -> Stroke:
        stroke = Stroke(
            id=str(uuid.uuid4()),
            points=[Point.from_dict(p) for p in stroke_data.get("points", [])],
            brush=stroke_data.get("brush", {"color": "#000000", "size": 0.2, "brushType": "round", "eraser": False})
        )
        
        self.canvas_history.append(self.get_strokes_json())
        self.canvas_future = []
        self.strokes.append(stroke)
        return stroke

    def get_strokes(self) -> List[dict]:
        return [stroke.to_dict() for stroke in self.strokes]

    def get_strokes_json(self) -> str:
        return json.dumps(self.get_strokes())

    def clear_canvas(self):
        if self.strokes:
            self.canvas_history.append(self.get_strokes_json())
            self.strokes = []
            self.canvas_future = []

    def load_strokes(self, strokes_data: List[dict]):
        self.strokes = [Stroke.from_dict(s) for s in strokes_data]
        self.canvas_history = []
        self.canvas_future = []


class RoomManager:
    def __init__(self):
        self.rooms: Dict[str, Room] = {}
        self.messages: Dict[str, List[Message]] = {}
        self._init_default_rooms()

    def _init_default_rooms(self):
        default_rooms = [
            ("👥 Общая", "Для всех игроков", 10),
            ("🎨 Художественная", "Для рисования", 8),
            ("⚡ Быстрая", "Динамичная игра", 6),
        ]
        for name, desc, cap in default_rooms:
            room = Room(name, desc, cap, owner_id="system")
            self.rooms[room.id] = room
            self.messages[room.id] = []

    def get_all_rooms(self) -> List[dict]:
        return [room.to_dict() for room in self.rooms.values()]

    def get_room(self, room_id: str):
        return self.rooms.get(room_id)

    def get_rooms_count(self) -> int:
        return len(self.rooms)

    def create_room(self, name: str, description: str, capacity: int, creator_id: str, creator_name: str):
        for room in self.rooms.values():
            if room.name == name:
                return None
        
        room = Room(name, description, capacity, owner_id=creator_id)
        room.add_user(creator_id, creator_name)
        self.rooms[room.id] = room
        self.messages[room.id] = []
        
        self._add_system_message(room.id, f"🏠 Комната '{name}' создана! {creator_name} - ведущий")
        return room

    def delete_room(self, room_id: str) -> bool:
        room = self.rooms.get(room_id)
        if room and room.owner_id != "system":
            del self.rooms[room_id]
            if room_id in self.messages:
                del self.messages[room_id]
            return True
        return False

    def join_room(self, room_id: str, user_id: str, user_name: str):
        room = self.rooms.get(room_id)
        if not room:
            return None, "Room not found"
        
        if room.add_user(user_id, user_name):
            return room, None
        return None, "Room is full"

    def leave_room(self, room_id: str, user_id: str, user_name: str):
        room = self.rooms.get(room_id)
        if not room:
            return None, False
        
        need_redraw = room.remove_user(user_id)        
        return room, need_redraw

    def add_message(self, room_id: str, user_id: str, user_name: str, text: str):
        room = self.rooms.get(room_id)
        if not room:
            return None, False
        
        msg = Message(
            id=str(uuid.uuid4()),
            roomId=room_id,
            userId=user_id,
            userName=user_name,
            text=text,
            timestamp=datetime.now().isoformat(),
        )
        
        self.messages[room_id].append(msg)
        is_guess = room.check_guess(user_id, text)

        if is_guess:
            self._add_system_message(room_id, f"✨ {user_name} угадал(а) '{text}'!")         
        
        return msg, is_guess

    def get_messages(self, room_id: str, limit: int = 50) -> List[dict]:
        msgs = self.messages.get(room_id, [])
        return [msg.to_dict() for msg in msgs[-limit:]]

    def _add_system_message(self, room_id: str, text: str):
        msg = Message(
            id=str(uuid.uuid4()),
            roomId=room_id,
            userId="system",
            userName="Система",
            text=text,
            timestamp=datetime.now().isoformat()
        )
        if room_id not in self.messages:
            self.messages[room_id] = []
        self.messages[room_id].append(msg)

    
    def add_stroke_to_room(self, room_id: str, stroke_data: dict) -> Optional[Stroke]:
        room = self.rooms.get(room_id)
        if room:
            return room.add_stroke(stroke_data)
        return None

    def get_room_strokes(self, room_id: str) -> List[dict]:
        room = self.rooms.get(room_id)
        if room:
            return room.get_strokes()
        return []

    def set_room_strokes(self, room_id: str, strokes_data: List[dict]) -> bool:
        room = self.rooms.get(room_id)
        if room:
            room.load_strokes(strokes_data)
            return True
        return False