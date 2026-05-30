// src/components/DrawingCanvas/Pallete.tsx
import React from "react";
import { PalleteItem } from "./PalleteItem";
import '../../styles/components/pallete.css';

export type PalleteItemType = 'color' | 'size' | 'eraser' | 'clear' | 'undo' | 'redo';

export interface PalleteItemData {
  type: PalleteItemType;
  color?: string;
  size?: number;
}

const items: PalleteItemData[] = [
  // 🎨 Цвета
  { type: "color", color: "#DC143C" },  // Красный
  { type: "color", color: "#FF6103" },  // Оранжевый
  { type: "color", color: "#FFD700" },  // Желтый
  { type: "color", color: "#00A550" },  // Зеленый
  { type: "color", color: "#008B8B" },  // Бирюзовый
  { type: "color", color: "#120A8F" },  // Синий
  { type: "color", color: "#E32636" },  // Бордовый
  { type: "color", color: "#CC7722" },  // Коричневый
  { type: "color", color: "#35281E" },  // Темно-коричневый
  { type: "color", color: "#ffffff" },  // Белый (ластик)

  // 📏 Размеры
  { type: "size", size: 0.05 },
  { type: "size", size: 0.1 },
  { type: "size", size: 0.2 },
  { type: "size", size: 0.3 },
  { type: "size", size: 0.4 },

  // 🛠️ Инструменты
  { type: "clear" },
  { type: "undo" },
  { type: "redo" },
];

export const Pallete: React.FC = () => {
  return (
    <div className="pallete-container animate-fade-in-down">
      {items.map((data, index) => (
        <PalleteItem key={`${data.type}-${index}`} data={data} />
      ))}
    </div>
  );
};