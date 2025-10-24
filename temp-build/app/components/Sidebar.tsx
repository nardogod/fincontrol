"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";
import {
  LayoutDashboard,
  CreditCard,
  Plus,
  Download,
  LogOut,
  Menu,
  X,
  Home,
  MessageCircle,
} from "lucide-react";

interface SidebarProps {
  user?: {
    full_name?: string;
    email?: string;
  };
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({
  user,
  isCollapsed = false,
  onToggle,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Contas",
      href: "/accounts",
      icon: Home,
    },
    {
      name: "Transações",
      href: "/transactions",
      icon: CreditCard,
    },
    {
      name: "Nova Transação",
      href: "/transactions/new",
      icon: Plus,
    },
    {
      name: "WhatsApp",
      href: "/whatsapp",
      icon: MessageCircle,
    },
    {
      name: "Exportar",
      href: "/export",
      icon: Download,
    },
  ];

  const handleLogout = async () => {
    // Implementar logout
    window.location.href = "/login";
  };

  return (
    <>
      {/* Mobile menu button - positioned in middle of screen */}
      <div
        className="lg:hidden fixed left-4 z-50"
        style={{ top: "50%", transform: "translateY(-50%)" }}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white/95 backdrop-blur-sm border-2 border-blue-500 shadow-lg"
        >
          {isOpen ? (
            <X className="h-4 w-4 text-blue-600" />
          ) : (
            <Menu className="h-4 w-4 text-blue-600" />
          )}
        </Button>
      </div>

      {/* Desktop toggle button - positioned in middle of screen */}
      <div
        className="hidden lg:block fixed left-4 z-[60]"
        style={{ top: "50%", transform: "translateY(-50%)" }}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={onToggle}
          className="bg-white border-2 border-blue-500 shadow-xl hover:bg-blue-50"
        >
          {isCollapsed ? (
            <Menu className="h-4 w-4 text-blue-600" />
          ) : (
            <X className="h-4 w-4 text-blue-600" />
          )}
        </Button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "h-full bg-white border-r border-slate-200 transition-all duration-300 ease-in-out",
          // Mobile: fixed overlay with higher z-index
          "fixed left-0 top-0 z-[60] transform lg:relative lg:z-auto lg:translate-x-0",
          // Mobile visibility
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          // Width - mobile always 64, desktop based on collapsed state
          "w-64",
          isCollapsed ? "lg:w-16" : "lg:w-64"
        )}
        style={{
          // Force desktop to be relative, mobile to be fixed
          position: isDesktop ? "relative" : "fixed",
          left: isDesktop ? "auto" : "0",
          top: isDesktop ? "auto" : "0",
          zIndex: isDesktop ? "auto" : "60",
          // Mobile: full height, desktop: auto
          height: isDesktop ? "auto" : "100vh",
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div
            className={cn(
              "flex items-center border-b border-slate-200 transition-all duration-300",
              isCollapsed ? "justify-center p-4" : "gap-3 p-6"
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <Home className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-lg font-bold text-slate-900">FinControl</h1>
                <p className="text-xs text-slate-600">Controle Financeiro</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
                    isCollapsed ? "justify-center" : "gap-3"
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className="h-4 w-4" />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-slate-200">
            {user && !isCollapsed && (
              <div className="mb-4">
                <p className="text-sm font-medium text-slate-900">
                  {user.full_name || "Usuário"}
                </p>
                <p className="text-xs text-slate-600">{user.email}</p>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className={cn(
                "w-full text-slate-700 hover:text-red-700 hover:border-red-200",
                isCollapsed ? "justify-center px-2" : "justify-start gap-2"
              )}
              title={isCollapsed ? "Sair" : undefined}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span>Sair</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* Spacer for desktop - removed to fix layout */}
    </>
  );
}
