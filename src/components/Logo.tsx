
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
      src="/lovable-uploads/e75d5e1d-7b70-4d61-9955-995f071eeaad.png"
      alt="TUWAYE Logo"
      className={`${sizeClasses[size]} ${className}`}
    />
  );
};

export default Logo;
