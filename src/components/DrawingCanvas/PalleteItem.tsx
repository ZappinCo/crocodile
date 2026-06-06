import React from "react";
import { useDispatch, useSelector } from 'react-redux';
import { 
  setBrushColor, 
  setBrushSize, 
  clearCanvas, 
} from '../../store/slices/drawing.slice';
import type { RootState } from '../../store';
import type { PalleteItemData } from "./Pallete";
import deleteIcon from '../../assets/delete-icon.svg';

interface PalleteItemProps {
  data: PalleteItemData;
}

export const PalleteItem: React.FC<PalleteItemProps> = ({ data }) => {
  const dispatch = useDispatch();
  const brush = useSelector((state: RootState) => state.drawing.brush);
  
  const currentColor = brush.color;
  const currentSize = brush.size;

  const handleColorClick = (color: string) => {
    dispatch(setBrushColor(color));
  };

  const handleSizeClick = (size: number) => {
    dispatch(setBrushSize(size));
  };

  const renderColorItem = (color: string) => (
    <div
      className={`pallete-item pallete-item--color ${currentColor === color}`}
      style={{ backgroundColor: color, border: color === '#ffffff' ? '1px solid #ddd' : 'none' }}
      title={`Цвет: ${color}`}
      onClick={() => handleColorClick(color)}
    >
    </div>
  );

  const renderSizeItem = (size: number) => (
    <div
      className={`pallete-item pallete-item--size ${Math.abs(currentSize - size) < 0.02}`}
      title={`Размер: ${Math.round(size * 100)}%`}
      onClick={() => handleSizeClick(size)}
    >
      <div
        className="size-circle"
        style={{
          backgroundColor: currentColor,
          width: `${size * 28}px`,
          height: `${size * 28}px`,
          borderRadius: '50%',
          boxShadow: `0 0 ${size * 10}px ${currentColor}40`
        }}
      />
    </div>
  );


  const renderClearItem = () => (
    <div 
      className="pallete-item pallete-item--clear" 
      title="Очистить всё" 
      onClick={() => dispatch(clearCanvas())}
    >
      <img src={deleteIcon} className="delete-icon" alt="Очистить" />
    </div>
  );




  switch (data.type) {
    case 'color':
      return renderColorItem(data.color!);
    case 'size':
      return renderSizeItem(data.size!);
    case 'clear':
      return renderClearItem();
    default:
      return <div>Unknown type: {data.type}</div>;
  }
};