
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film } from 'lucide-react';

const DraggableIcon: React.FC = () => {
  const navigate = useNavigate();
  const [position, setPosition] = useState({ 
    x: window.innerWidth - 80,  // Positioned from the right
    y: window.innerHeight - 80  // Positioned from the bottom 
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = Math.min(Math.max(0, e.clientX - dragStart.x), window.innerWidth - 60);
      const newY = Math.min(Math.max(0, e.clientY - dragStart.y), window.innerHeight - 60);
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      className={`fixed z-50 cursor-move transition-transform ${
        isDragging ? 'scale-110' : 'hover:scale-105'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        background: 'rgba(155, 135, 245, 0.8)', // Primary Purple with opacity
        borderRadius: '50%',
        padding: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}
      onMouseDown={handleMouseDown}
      onClick={() => !isDragging && navigate('/vibezone')}
    >
      <Film className="h-6 w-6 text-white" />
    </div>
  );
};

export default DraggableIcon;
