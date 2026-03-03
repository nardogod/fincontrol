"use client";

import { useEffect } from "react";

/**
 * Garante que erros de ChunkLoadError (quando o HTML aponta para um chunk antigo)
 * forcem um reload completo da página uma única vez.
 * Isso evita que usuários fiquem presos em telas quebradas após um deploy.
 */
export default function ChunkReloadHandler() {
  useEffect(() => {
    const flagKey = "fincontrol_chunk_reload_attempted";

    function shouldReloadOnce() {
      if (typeof window === "undefined") return false;
      if (sessionStorage.getItem(flagKey) === "1") return false;
      sessionStorage.setItem(flagKey, "1");
      return true;
    }

    function handleError(event: any) {
      const err = event?.error || event?.reason || event;
      const message =
        (err && (err.message || err.toString())) || String(event || "");
      const name = err?.name || "";

      const isChunkError =
        name === "ChunkLoadError" ||
        message.includes("ChunkLoadError") ||
        message.includes("Loading chunk") ||
        message.includes("Loading CSS chunk");

      if (isChunkError && shouldReloadOnce()) {
        // Reload forçando novo HTML + novos chunks
        window.location.reload();
      }
    }

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleError);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleError);
    };
  }, []);

  return null;
}

