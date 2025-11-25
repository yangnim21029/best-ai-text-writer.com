import React, { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50 flex flex-col font-sans text-gray-900">
      {children}
    </div>
  );
};