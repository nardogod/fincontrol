"use client";

import { Button } from "@/components/ui/button";
import type { TAccount } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AccountSelectorProps {
  accounts: TAccount[];
  activeAccountId: string | null;
  onAccountChange: (accountId: string) => void;
}

export default function AccountSelector({
  accounts,
  activeAccountId,
  onAccountChange,
}: AccountSelectorProps) {
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
              "whitespace-nowrap transition-all",
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
            <span className="mr-2">{account.icon}</span>
            {account.name}
          </Button>
        );
      })}
    </div>
  );
}
