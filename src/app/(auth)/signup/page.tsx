"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação de senha
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "As senhas não coincidem.",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "A senha deve ter pelo menos 6 caracteres.",
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) {
        toast({
          variant: "destructive",
          title: "Erro ao criar conta",
          description: authError.message,
        });
        return;
      }

      if (!authData.user) {
        toast({
          variant: "destructive",
          title: "Erro inesperado",
          description: "Não foi possível criar a conta.",
        });
        return;
      }

      // 2. Criar registro na tabela users
      const { error: userError } = await supabase.from("users").insert({
        id: authData.user.id,
        email: authData.user.email!,
        full_name: fullName,
      });

      if (userError) {
        console.error("Error creating user record:", userError);
      }

      // 3. Criar conta padrão
      const { data: accountData, error: accountError } = await supabase
        .from("accounts")
        .insert({
          user_id: authData.user.id,
          name: fullName.split(" ")[0] || "Minha Conta",
          type: "personal",
          color: "#3B82F6",
          icon: "💰",
        })
        .select()
        .single();

      if (accountError) {
        console.error("Error creating account:", accountError);
      }

      toast({
        title: "Conta criada com sucesso!",
        description: "Redirecionando para o dashboard...",
      });

      // Redirect para dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Signup error:", error);
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
            Criar conta
          </CardTitle>
          <CardDescription className="text-center">
            Comece a controlar suas finanças hoje
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Seu nome"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
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
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              disabled={isLoading}
            >
              {isLoading ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-slate-600">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Fazer login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
