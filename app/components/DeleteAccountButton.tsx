"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";
import { useDeleteAccount } from "@/app/hooks/useDeleteAccount";

interface DeleteAccountButtonProps {
  accountId: string;
  accountName: string;
  onDeleted?: () => void;
}

export default function DeleteAccountButton({
  accountId,
  accountName,
  onDeleted,
}: DeleteAccountButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { deleteAccount, isDeleting } = useDeleteAccount();

  const handleDelete = async () => {
    const result = await deleteAccount(accountId);
    if (result.success) {
      setIsOpen(false);
      onDeleted?.();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
          disabled={isDeleting}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Deletar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deletar Conta</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja deletar a conta "{accountName}"? Esta ação
            não pode ser desfeita.
            <br />
            <br />
            <strong>Nota:</strong> Apenas contas sem transações podem ser
            deletadas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
            disabled={isDeleting}
          >
            {isDeleting ? "Deletando..." : "Deletar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
