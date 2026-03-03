import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/app/components/ui/toaster";
import { SidebarProvider } from "@/app/contexts/SidebarContext";
import { LanguageProvider } from "@/app/contexts/LanguageContext";
import InviteWrapper from "@/app/components/InviteWrapper";
import ChunkReloadHandler from "@/app/components/ChunkReloadHandler";

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
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#10B981",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

const langScript = `
(function(){
  try {
    var s = localStorage.getItem('fincontrol_language');
    if (s && ['pt','en','sv'].includes(s)) {
      document.documentElement.lang = s === 'pt' ? 'pt-BR' : s === 'sv' ? 'sv-SE' : 'en';
    }
  } catch(e) {}
})();
`;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <script dangerouslySetInnerHTML={{ __html: langScript }} />
        <ChunkReloadHandler />
        <LanguageProvider>
          <SidebarProvider>
            <InviteWrapper>{children}</InviteWrapper>
          </SidebarProvider>
        </LanguageProvider>
        <Toaster />
      </body>
    </html>
  );
}
