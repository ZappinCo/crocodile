# app/room_manager.py
import uuid
import random
from typing import Dict, List, Optional
from datetime import datetime


class Message:
    def __init__(self, id: str, roomId: str, userId: str, userName: str, text: str, timestamp: str, isGuess: bool = False):
        self.id = id
        self.roomId = roomId
        self.userId = userId
        self.userName = userName
        self.text = text
        self.timestamp = timestamp
        self.isGuess = isGuess

    def to_dict(self):
        return {
            "id": self.id,
            "roomId": self.roomId,
            "userId": self.userId,
            "userName": self.userName,
            "text": self.text,
            "timestamp": self.timestamp,
            "isGuess": self.isGuess
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
            "owner_id": self.owner_id
        }

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
        
        if self.current_users == 0 and not self.is_default:
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
            self.current_word = random.choice(self.words_pool)
            return True
        return False


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
            room = Room(name, desc, cap)
            self.rooms[room.id] = room
            self.messages[room.id] = []
            print(f"✅ Created room: {name}")

    def get_all_rooms(self) -> List[dict]:
        return [room.to_dict() for room in self.rooms.values()]

    def get_room(self, room_id: str):
        return self.rooms.get(room_id)

    def get_rooms_count(self) -> int:
        return len(self.rooms)

    def create_room(self, name: str, description: str, capacity: int, creator_id: str, creator_name: str):
        for room in self.rooms.values():
            if room.name == name and not room.is_default:
                return None
        
        room = Room(name, description, capacity, creator_id)
        self.rooms[room.id] = room
        self.messages[room.id] = []
        
        self._add_system_message(room.id, f"🏠 Комната '{name}' создана! {creator_name} - ведущий")
        return room

    def delete_room(self, room_id: str) -> bool:
        room = self.rooms.get(room_id)
        if room and not room.owner_id == "system":
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
            self._add_system_message(room_id, f"✨ {user_name} присоединился!")
            if room.leader_id == user_id and room.current_word:
                self._add_system_message(room_id, f"🔤 Ваше слово: {room.current_word}")
            return room, None
        return None, "Room is full"

    def leave_room(self, room_id: str, user_id: str):
        room = self.rooms.get(room_id)
        if not room:
            return None, False
        
        user_name = room.get_user_name(user_id)
        should_delete = room.remove_user(user_id)
        
        if not should_delete:
            self._add_system_message(room_id, f"👋 {user_name} покинул комнату")
        
        if should_delete:
            # self.delete_room(room_id)
            return None, True
        
        return room, False

    def add_message(self, room_id: str, user_id: str, user_name: str, text: str, is_guess: bool = False):
        room = self.rooms.get(room_id)
        if not room:
            return None
        
        msg = Message(
            id=str(uuid.uuid4()),
            roomId=room_id,
            userId=user_id,
            userName=user_name,
            text=text,
            timestamp=datetime.now().isoformat(),
            isGuess=is_guess
        )
        
        self.messages[room_id].append(msg)
        
        if is_guess and room.check_guess(user_id, text):
            winner_name = room.get_user_name(user_id)
            self._add_system_message(room_id, f"🎉 {winner_name} угадал слово! Новый ведущий: {room.leader_name}")
            self._add_system_message(room_id, f"🔤 Новое слово: {room.current_word}")
        
        return msg

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