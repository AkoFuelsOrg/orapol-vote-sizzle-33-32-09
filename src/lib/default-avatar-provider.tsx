
import React, { createContext, useContext, ReactNode } from 'react';

// Create a context to provide the default avatar URL throughout the app
interface DefaultAvatarContextType {
  defaultAvatarUrl: string;
}

const DefaultAvatarContext = createContext<DefaultAvatarContextType>({
  defaultAvatarUrl: "/lovable-uploads/a4e9124a-4f86-442b-a248-deb01d8501eb.png",
});

export const useDefaultAvatar = () => useContext(DefaultAvatarContext);

interface DefaultAvatarProviderProps {
  children: ReactNode;
}

export const DefaultAvatarProvider: React.FC<DefaultAvatarProviderProps> = ({ children }) => {
  return (
    <DefaultAvatarContext.Provider
      value={{
        defaultAvatarUrl: "/lovable-uploads/a4e9124a-4f86-442b-a248-deb01d8501eb.png",
      }}
    >
      {children}
    </DefaultAvatarContext.Provider>
  );
};
