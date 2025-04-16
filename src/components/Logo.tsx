
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-20 w-20'
  };

  return (
    <img
      src="/lovable-uploads/420f4044-9fc3-4ea9-855e-859f2581c74b.png"
      alt="Tuwaye Logo"
      className={`${sizeClasses[size]} ${className} transition-all duration-300`}
    />
  );
};

export default Logo;
