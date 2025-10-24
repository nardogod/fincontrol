"use client";

import { Button } from "@/app/components/ui/button";
import { Home, Users, Building, Car } from "lucide-react";
import type { TAccount } from "@/app/lib/types";
import { cn } from "@/app/lib/utils";

interface AccountSelectorProps {
  accounts: (TAccount & {
    is_shared?: boolean;
    member_role?: string;
  })[];
  activeAccountId: string | null;
  onAccountChange: (accountId: string) => void;
}

export default function AccountSelector({
  accounts,
  activeAccountId,
  onAccountChange,
}: AccountSelectorProps) {
  const getAccountIcon = (type: string) => {
    switch (type) {
      case "personal":
        return <Home className="h-4 w-4" />;
      case "shared":
        return <Users className="h-4 w-4" />;
      case "business":
        return <Building className="h-4 w-4" />;
      case "vehicle":
        return <Car className="h-4 w-4" />;
      default:
        return <Home className="h-4 w-4" />;
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="text-center text-sm text-slate-500">
        Nenhuma conta encontrada
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
      {accounts.map((account) => {
        const isActive = activeAccountId === account.id;

        return (
          <Button
            key={account.id}
            onClick={() => onAccountChange(account.id)}
            variant={isActive ? "default" : "outline"}
            className={cn(
              "whitespace-nowrap transition-all relative",
              isActive
                ? "scale-105 shadow-lg"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
            style={
              isActive
                ? {
                    backgroundColor: account.color,
                    borderColor: account.color,
                  }
                : undefined
            }
          >
            {getAccountIcon(account.type)}
            <span>{account.name}</span>
            {account.is_shared && (
              <div className="ml-1 h-2 w-2 rounded-full bg-blue-500" title="Conta compartilhada" />
            )}
          </Button>
        );
      })}
    </div>
  );
}
