"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/app/lib/supabase/client";
import InviteNotification from "@/app/components/InviteNotification";
import { Bell } from "lucide-react";
import { Button } from "@/app/components/ui/button";

export default function InviteWrapper({ children }: { children: React.ReactNode }) {
  const [hasInvites, setHasInvites] = useState(false);
  const [showInvites, setShowInvites] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const checkForInvites = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.email) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("account_invites")
          .select("id")
          .eq("invited_email", userData.user.email)
          .eq("status", "pending");

        if (error) throw error;
        
        setHasInvites((data?.length || 0) > 0);
      } catch (dbError: any) {
        // Silenciar erro de permissão - pode ser RLS bloqueando
        if (dbError?.code !== '42501') {
          console.error("Error checking invites:", dbError);
        }
      }
    } catch (error) {
      console.error("Error checking invites:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    checkForInvites();
  }, [checkForInvites]);

  if (isLoading) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      
      {/* Notificação de convites */}
      {hasInvites && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          {!showInvites ? (
            <Button
              onClick={() => setShowInvites(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            >
              <Bell className="h-4 w-4 mr-2" />
              Você tem convites pendentes
            </Button>
          ) : (
            <div className="bg-white rounded-lg shadow-xl border p-4 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Convites Pendentes</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInvites(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
              <InviteNotification />
            </div>
          )}
        </div>
      )}
    </>
  );
}
