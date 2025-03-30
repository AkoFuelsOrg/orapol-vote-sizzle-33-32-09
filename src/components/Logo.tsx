
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
      src="/lovable-uploads/142738e7-3764-4db2-8b2f-b9a9614f97e9.png"
      alt="TUWAYE Logo"
      className={`${sizeClasses[size]} ${className}`}
    />
  );
};

export default Logo;
