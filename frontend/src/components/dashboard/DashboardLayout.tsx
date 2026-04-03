import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userData?: any;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, userData }) => {
  return (
    <div className="flex min-h-screen bg-[#0A0F0D] text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header userData={userData} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
