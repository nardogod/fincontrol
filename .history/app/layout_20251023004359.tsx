import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/app/components/ui/toaster";
import { SidebarProvider } from "@/app/contexts/SidebarContext";
import InviteWrapper from "@/app/components/InviteWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinControl - Controle Financeiro Pessoal & Familiar",
  description:
    "Sistema de controle financeiro com entrada automática via WhatsApp/Email e dashboards em tempo real",
  authors: [{ name: "Leonardo" }],
  keywords: [
    "finanças",
    "controle financeiro",
    "orçamento",
    "família",
    "gastos",
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <SidebarProvider>{children}</SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
