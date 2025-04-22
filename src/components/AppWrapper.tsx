
import React from 'react';
import AuthLogoOverride from './AuthLogoOverride';
import DraggableIcon from './DraggableIcon';

const AppWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <AuthLogoOverride />
      <DraggableIcon />
      {children}
    </>
  );
};

export default AppWrapper;
