
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <img
      src="/lovable-uploads/143ae866-e284-4f13-82da-318647724a55.png"
      alt="TUWAYE Logo"
      className={`${sizeClasses[size]} ${className}`}
    />
  );
};

export default Logo;
