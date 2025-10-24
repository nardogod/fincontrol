"use client";

import { useSidebar } from "@/app/contexts/SidebarContext";
import Sidebar from "@/app/components/Sidebar";

interface SidebarWrapperProps {
  children: React.ReactNode;
  user?: {
    full_name?: string;
    email?: string;
  };
}

export default function SidebarWrapper({
  children,
  user,
}: SidebarWrapperProps) {
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} isCollapsed={isCollapsed} onToggle={toggleSidebar} />
      <main
        className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? "lg:ml-16" : "lg:ml-64"
        }`}
      >
        <div className="h-full overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
