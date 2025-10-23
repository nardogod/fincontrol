"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { ArrowLeft, Home, Users, Building, Car } from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";
import { useToast } from "@/app/hooks/use-toast";

const accountTypes = [
  {
    value: "personal",
    label: "Pessoal",
    description: "Sua conta pessoal privada",
    icon: Home,
    color: "#3B82F6",
  },
  {
    value: "shared",
    label: "Compartilhada",
    description: "Conta da casa, família",
    icon: Users,
    color: "#10B981",
  },
  {
    value: "business",
    label: "Empresa",
    description: "Conta da empresa, negócios",
    icon: Building,
    color: "#8B5CF6",
  },
  {
    value: "vehicle",
    label: "Veículo",
    description: "Conta do carro, moto",
    icon: Car,
    color: "#F59E0B",
  },
];

const currencies = [
  { value: "kr", label: "Krone (kr)", symbol: "kr" },
  { value: "real", label: "Real (R$)", symbol: "R$" },
  { value: "dolar", label: "Dólar ($)", symbol: "$" },
  { value: "euro", label: "Euro (€)", symbol: "€" },
];

const predefinedColors = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#8B5CF6", // Purple
  "#F59E0B", // Orange
  "#EF4444", // Red
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#F97316", // Orange
];

export default function NewAccountPage() {
  const [formData, setFormData] = useState({
    name: "",
    type: "personal",
    color: "#3B82F6",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Buscar usuário atual
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Usuário não autenticado");
      }

      // Criar conta
      const { data: account, error: accountError } = await supabase
        .from("accounts")
        .insert({
          name: formData.name,
          type: formData.type,
          color: formData.color,
          description: formData.description || null,
          user_id: user.id,
        })
        .select()
        .single();

      if (accountError) {
        console.error("Erro ao criar conta:", accountError);
        throw accountError;
      }

      // Adicionar usuário como owner
      const { error: memberError } = await supabase
        .from("account_members")
        .insert({
          account_id: account.id,
          user_id: user.id,
          role: "owner",
        });

      if (memberError) throw memberError;

      toast({
        title: "Conta criada!",
        description: `A conta "${formData.name}" foi criada com sucesso.`,
      });

      router.push("/accounts");
    } catch (error) {
      console.error("Erro ao criar conta:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
        description: "Tente novamente mais tarde.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedType = accountTypes.find(
    (type) => type.value === formData.type
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 lg:px-6">
          <div className="flex items-center gap-4">
            <Link href="/accounts">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Nova Conta
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Crie uma nova conta para organizar suas finanças
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-6 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nome da Conta */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Conta</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Conta da Casa, Conta Pessoal"
                  required
                />
              </div>

              {/* Tipo de Conta */}
              <div className="space-y-2">
                <Label>Tipo de Conta</Label>
                <div className="grid grid-cols-2 gap-3">
                  {accountTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.type === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, type: type.value })
                        }
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                            style={{ backgroundColor: type.color }}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-sm">{type.label}</p>
                            <p className="text-xs text-gray-600">
                              {type.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cor da Conta */}
              <div className="space-y-2">
                <Label>Cor da Conta</Label>
                <div className="flex gap-2 flex-wrap">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`h-8 w-8 rounded-full border-2 ${
                        formData.color === color
                          ? "border-gray-800"
                          : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded border"
                    style={{ backgroundColor: formData.color }}
                  />
                  <span className="text-sm text-gray-600">
                    {selectedType?.label} - {formData.color}
                  </span>
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Ex: Conta principal da família"
                />
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <Link href="/accounts" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Cancelar
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isLoading || !formData.name.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                >
                  {isLoading ? "Criando..." : "Criar Conta"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
