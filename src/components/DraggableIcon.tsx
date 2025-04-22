
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video } from 'lucide-react';
import { useBreakpoint } from '../hooks/use-mobile';

const DraggableIcon: React.FC = () => {
  const navigate = useNavigate();
  const breakpoint = useBreakpoint();
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

  // Only show on mobile and tablet
  if (breakpoint === "desktop") {
    return null;
  }

  return (
    <div
      className={`fixed z-50 cursor-move transition-transform ${
        isDragging ? 'scale-110' : 'hover:scale-105'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        background: '#9b87f5',  // Primary Purple
        borderRadius: '50%',
        padding: '15px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        width: '50px',
        height: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid rgba(255,255,255,0.3)'
      }}
      onMouseDown={handleMouseDown}
      onClick={() => !isDragging && navigate('/vibezone')}
    >
      <Video className="h-6 w-6 text-white" />
    </div>
  );
};

export default DraggableIcon;
