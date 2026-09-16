import Navbar from "@/components/ui/Navbar";
import Sidebar from "@/components/ui/Sidebar";
import RightSideBar from "@/components/ui/RightSideBar";
import React, { ReactNode, useEffect, useState } from "react";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  const handleslidein = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen((state) => !state);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f9fa] text-[#3a3a3a]">
      <Navbar handleslidein={handleslidein} />

      <div className="flex w-full max-w-full py-1">
        <Sidebar isOpen={sidebarOpen} onclose={handleslidein} />

        <main className="min-w-0 flex-1 bg-white p-3 sm:p-4 lg:p-6">
          {children}
        </main>

        <div className="hidden xl:block">
          <RightSideBar />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
