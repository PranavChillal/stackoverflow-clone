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
        if (window.innerWidth <= 768) {
            setSidebarOpen(false);
        }
    }, []);

    const handleslidein = () => {
        if (window.innerWidth <= 768) {
            setSidebarOpen((state) => !state);
        }
    };

    return (
        <div className="bg-[#f8f9fa] text-[#3a3a3a] min-h-screen">
            <Navbar handleslidein={handleslidein} />

            <div className="flex max-w-full py-1">
                <Sidebar
                    isOpen={sidebarOpen}
                    onclose={handleslidein}
                />

                <main className="flex-1 min-w-0 p-4 lg:p-6 bg-white">
                    {children}
                </main>
                <RightSideBar />
            </div>
        </div>
    );
};

export default MainLayout;