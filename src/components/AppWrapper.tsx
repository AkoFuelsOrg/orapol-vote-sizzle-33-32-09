
import React from 'react';
import AuthLogoOverride from './AuthLogoOverride';

const AppWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <AuthLogoOverride />
      {children}
    </>
  );
};

export default AppWrapper;
