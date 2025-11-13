"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { createClient } from "@/app/lib/supabase/client";
import { toast } from "@/app/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Pegar redirect da URL
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação de campos obrigatórios
    if (!email.trim()) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Email é obrigatório.",
      });
      return;
    }

    if (!password.trim()) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Senha é obrigatória.",
      });
      return;
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Email inválido.",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log("Tentando fazer login com:", { email: email.trim() });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      console.log("Resposta do login:", { data, error });

      if (error) {
        console.error("Login error:", error);
        toast({
          variant: "destructive",
          title: "Erro ao fazer login",
          description: error.message || "Credenciais inválidas.",
        });
        return;
      }

      if (data.user) {
        console.log("Login bem-sucedido, usuário:", data.user);
        console.log("Redirecionando para:", redirectPath);
        toast({
          title: "Login realizado!",
          description: "Redirecionando...",
        });

        // Aguardar um pouco antes de redirecionar
        setTimeout(() => {
          router.push(redirectPath);
          router.refresh();
        }, 1000);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro inesperado",
        description: "Tente novamente mais tarde.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl shadow-lg">
              💰
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Bem-vindo de volta
          </CardTitle>
          <CardDescription className="text-center">
            Entre com sua conta para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-slate-600">
            Não tem uma conta?{" "}
            <Link
              href="/signup"
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Criar conta
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
