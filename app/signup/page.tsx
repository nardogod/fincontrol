"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import LanguageSelector from "@/app/components/LanguageSelector";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { tSignup } from "@/app/lib/i18n";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const { language } = useLanguage();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação de campos obrigatórios
    if (!fullName.trim()) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Nome é obrigatório.",
      });
      return;
    }

    if (!email.trim()) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Email é obrigatório.",
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
      console.log("Tentando criar usuário com:", { email, fullName });

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

      console.log("Resposta do signup:", { authData, authError });

      if (authError) {
        console.error("Auth error:", authError);
        toast({
          variant: "destructive",
          title: "Erro ao criar conta",
          description: authError.message || "Erro desconhecido ao criar conta.",
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl shadow-lg">
              💰
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {tSignup.title[language]}
          </CardTitle>
          <CardDescription className="text-center">
            {tSignup.subtitle[language]}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{tSignup.fullName[language]}</Label>
              <Input
                id="fullName"
                type="text"
                placeholder={tSignup.placeholderName[language]}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{tSignup.email[language]}</Label>
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
              <Label htmlFor="password">{tSignup.password[language]}</Label>
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
              <Label htmlFor="confirmPassword">{tSignup.confirmPassword[language]}</Label>
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
              {isLoading ? tSignup.creating[language] : tSignup.create[language]}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-slate-600">
            {tSignup.hasAccount[language]}{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              {tSignup.doLogin[language]}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
