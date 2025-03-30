
import React from 'react';
import useLogoOverride from '../hooks/use-logo-override';

const LogoOverrideProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useLogoOverride();
  return <>{children}</>;
};

export default LogoOverrideProvider;
