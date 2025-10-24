"use client";

import Sidebar from "@/app/components/Sidebar";

interface SimpleSidebarWrapperProps {
  children: React.ReactNode;
  user?: {
    full_name?: string;
    email?: string;
  };
}

export default function SimpleSidebarWrapper({
  children,
  user,
}: SimpleSidebarWrapperProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} isCollapsed={false} onToggle={() => {}} />
      <main className="flex-1 min-w-0 lg:ml-0">{children}</main>
    </div>
  );
}
