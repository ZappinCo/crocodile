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
  { type: "color", color: "#DC143C" },  
  { type: "color", color: "#FF6103" },  
  { type: "color", color: "#FFD700" },  
  { type: "color", color: "#00A550" },  
  { type: "color", color: "#008B8B" },  
  { type: "color", color: "#120A8F" },  
  { type: "color", color: "#E32636" },  
  { type: "color", color: "#CC7722" },  
  { type: "color", color: "#35281E" },  
  { type: "color", color: "#ffffff" },  

  { type: "size", size: 0.05 },
  { type: "size", size: 0.1 },
  { type: "size", size: 0.2 },
  { type: "size", size: 0.3 },
  { type: "size", size: 0.4 },

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