
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Move } from 'lucide-react';

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

  // Update position on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition({
        x: Math.min(position.x, window.innerWidth - 80),
        y: Math.min(position.y, window.innerHeight - 80)
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position]);

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
        background: '#3eb0ff',  // Primary color
        borderRadius: '50%',
        padding: '15px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        width: '50px',  // Explicit width
        height: '50px', // Explicit height
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid rgba(255,255,255,0.3)',
        position: 'fixed',  // Ensure it stays in the viewport
        margin: '20px'  // Add some margin from the edges
      }}
      onMouseDown={handleMouseDown}
      onClick={() => !isDragging && navigate('/vibezone')}
    >
      <Film className="h-6 w-6 text-white" />
    </div>
  );
};

export default DraggableIcon;
