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

// Script inline que roda ANTES dos chunks - captura ChunkLoadError por cache antigo
const chunkReloadScript = `
(function(){
  var flagKey = 'fincontrol_chunk_reload_attempted';
  function handleChunkError(e) {
    var err = (e && e.error) || (e && e.reason);
    var msg = (err && (err.message || String(err))) || '';
    var isChunk = (err && err.name === 'ChunkLoadError') || msg.indexOf('ChunkLoadError') >= 0 || msg.indexOf('Loading chunk') >= 0 || msg.indexOf('Loading CSS chunk') >= 0;
    if (isChunk && sessionStorage.getItem(flagKey) !== '1') {
      sessionStorage.setItem(flagKey, '1');
      var u = window.location.pathname + window.location.search;
      window.location.replace(u + (u.indexOf('?') >= 0 ? '&' : '?') + '_r=' + Date.now());
    }
  }
  window.addEventListener('error', handleChunkError);
  window.addEventListener('unhandledrejection', handleChunkError);
})();
`;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <script dangerouslySetInnerHTML={{ __html: langScript }} />
        <script dangerouslySetInnerHTML={{ __html: chunkReloadScript }} />
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
