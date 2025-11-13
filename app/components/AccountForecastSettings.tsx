"use client";

import { useState, useEffect } from "react";
import {
  Target,
  AlertTriangle,
  CheckCircle,
  Save,
  Edit3,
  DollarSign,
  Calendar,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
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
import { formatCurrency } from "@/app/lib/utils";
import { createClient } from "@/app/lib/supabase/client";
import { useToast } from "@/app/hooks/use-toast";
import type { TAccount } from "@/app/lib/types";

interface AccountForecastSettingsProps {
  account: TAccount;
  onSettingsUpdated?: () => void;
}

interface ForecastSettings {
  monthly_budget: number | null;
  alert_threshold: number; // Percentual para alerta (ex: 80%)
  budget_type: "fixed" | "flexible"; // Orçamento fixo ou flexível
  auto_adjust: boolean; // Se deve ajustar automaticamente baseado no histórico
  notifications_enabled: boolean;
}

export default function AccountForecastSettings({
  account,
  onSettingsUpdated,
}: AccountForecastSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<ForecastSettings>({
    monthly_budget: null,
    alert_threshold: 80,
    budget_type: "flexible",
    auto_adjust: true,
    notifications_enabled: true,
  });

  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    loadSettings();
  }, [account.id]);

  const loadSettings = async () => {
    try {
      console.log(
        "🔍 AccountForecastSettings - Carregando configurações para conta:",
        account.id
      );

      // PRIMEIRO: Tentar carregar do banco de dados (fonte de verdade)
      const { data, error } = await supabase
        .from("account_forecast_settings")
        .select("*")
        .eq("account_id", account.id)
        .single();

      if (data && !error) {
        console.log(
          "✅ AccountForecastSettings - Configurações encontradas no banco:",
          data
        );
        const typedData = data as any;
        const loadedSettings = {
          monthly_budget: typedData.monthly_budget,
          alert_threshold: typedData.alert_threshold || 80,
          budget_type: typedData.budget_type || "flexible",
          auto_adjust:
            typedData.auto_adjust !== null ? typedData.auto_adjust : true,
          notifications_enabled:
            typedData.notifications_enabled !== null
              ? typedData.notifications_enabled
              : true,
        };
        setSettings(loadedSettings);
        // Sincronizar localStorage com banco
        const localKey = `forecast_settings_${account.id}`;
        localStorage.setItem(localKey, JSON.stringify(loadedSettings));
        return;
      }

      // Tratamento de erros
      if (error) {
        if (error.code === "PGRST116") {
          // PGRST116 = no rows returned (não é erro, apenas não existe)
          console.log(
            "📝 AccountForecastSettings - Nenhuma configuração no banco, tentando localStorage"
          );
        } else {
          console.error(
            "❌ AccountForecastSettings - Erro ao buscar no banco:",
            error.message
          );
        }
      }

      // SEGUNDO: Fallback para localStorage (apenas se não houver no banco)
      const localKey = `forecast_settings_${account.id}`;
      const localSettings = localStorage.getItem(localKey);

      if (localSettings) {
        const parsed = JSON.parse(localSettings);
        console.log(
          "🔄 AccountForecastSettings - Usando localStorage como fallback:",
          parsed
        );
        setSettings({
          monthly_budget: parsed.monthly_budget,
          alert_threshold: parsed.alert_threshold || 80,
          budget_type: parsed.budget_type || "flexible",
          auto_adjust:
            parsed.auto_adjust !== undefined ? parsed.auto_adjust : true,
          notifications_enabled:
            parsed.notifications_enabled !== undefined
              ? parsed.notifications_enabled
              : true,
        });
        return;
      }

      // TERCEIRO: Configurações padrão
      console.log("📝 AccountForecastSettings - Usando configurações padrão");
    } catch (error) {
      console.error(
        "❌ AccountForecastSettings - Erro ao carregar configurações:",
        error
      );
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);

      console.log(
        "💾 AccountForecastSettings - Salvando configurações:",
        settings
      );

      // PRIMEIRO: Tentar salvar no banco de dados (fonte de verdade)
      let savedToDatabase = false;
      try {
        const { error, data } = await supabase
          .from("account_forecast_settings")
          .upsert(
            {
              account_id: account.id,
              monthly_budget: settings.monthly_budget,
              alert_threshold: settings.alert_threshold,
              budget_type: settings.budget_type,
              auto_adjust: settings.auto_adjust,
              notifications_enabled: settings.notifications_enabled,
              updated_at: new Date().toISOString(),
            } as any,
            {
              onConflict: "account_id",
            }
          )
          .select()
          .single();

        if (error) {
          console.error(
            "❌ AccountForecastSettings - Erro ao salvar no banco:",
            error
          );
          throw error;
        } else {
          console.log(
            "✅ AccountForecastSettings - Configurações salvas no banco com sucesso:",
            data
          );
          savedToDatabase = true;
        }
      } catch (dbError) {
        console.error(
          "❌ AccountForecastSettings - Erro ao salvar no banco:",
          dbError
        );
        // Continuar para salvar no localStorage como fallback
      }

      // SEGUNDO: Salvar no localStorage (sempre, para sincronização)
      const localKey = `forecast_settings_${account.id}`;
      localStorage.setItem(localKey, JSON.stringify(settings));
      console.log(
        "✅ AccountForecastSettings - Configurações salvas no localStorage"
      );

      if (savedToDatabase) {
        toast({
          title: "Configurações salvas!",
          description:
            "As configurações de previsão foram atualizadas com sucesso.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Aviso",
          description:
            "Configurações salvas localmente. Pode não estar sincronizado com outros dispositivos.",
        });
      }

      setIsEditing(false);

      // Notificar componente pai para recarregar
      onSettingsUpdated?.();

      // Disparar evento customizado para sincronizar com outras páginas (ex: Dashboard)
      window.dispatchEvent(
        new CustomEvent("forecastSettingsUpdated", {
          detail: { accountId: account.id, settings },
        })
      );
      console.log(
        "📢 AccountForecastSettings - Evento 'forecastSettingsUpdated' disparado"
      );

      // Recarregar configurações do banco para garantir sincronização
      await loadSettings();
    } catch (error) {
      console.error(
        "❌ AccountForecastSettings - Erro ao salvar configurações:",
        error
      );
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    loadSettings();
    setIsEditing(false);
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Target className="h-5 w-5" />
          Configurações de Previsão - {account.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isEditing ? (
          // Modo Visualização
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Orçamento Mensal
                  </span>
                </div>
                <p className="text-xl font-bold text-green-600">
                  {settings.monthly_budget
                    ? formatCurrency(settings.monthly_budget)
                    : "Não definido"}
                </p>
                <p className="text-xs text-gray-500">
                  {settings.budget_type === "fixed"
                    ? "Orçamento fixo"
                    : "Orçamento flexível"}
                </p>
              </div>

              <div className="p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Alerta em
                  </span>
                </div>
                <p className="text-xl font-bold text-orange-600">
                  {settings.alert_threshold}%
                </p>
                <p className="text-xs text-gray-500">
                  {settings.notifications_enabled
                    ? "Notificações ativas"
                    : "Notificações desativadas"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Ajuste Automático</span>
              </div>
              <div className="flex items-center gap-2">
                {settings.auto_adjust ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                )}
                <span className="text-sm text-gray-600">
                  {settings.auto_adjust ? "Ativado" : "Desativado"}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setIsEditing(true)}
                className="flex-1"
                variant="outline"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Editar Configurações
              </Button>
            </div>
          </div>
        ) : (
          // Modo Edição
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthly_budget">Orçamento Mensal (kr)</Label>
                <Input
                  id="monthly_budget"
                  type="number"
                  value={settings.monthly_budget || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      monthly_budget: e.target.value
                        ? Number(e.target.value)
                        : null,
                    })
                  }
                  placeholder="Ex: 6000"
                />
                <p className="text-xs text-gray-500">
                  Deixe vazio para usar estimativa automática
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alert_threshold">Alerta em (%)</Label>
                <Input
                  id="alert_threshold"
                  type="number"
                  min="1"
                  max="100"
                  value={settings.alert_threshold}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      alert_threshold: Number(e.target.value),
                    })
                  }
                />
                <p className="text-xs text-gray-500">
                  Quando receber alerta de gastos
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Orçamento</Label>
              <Select
                value={settings.budget_type}
                onValueChange={(value: "fixed" | "flexible") =>
                  setSettings({
                    ...settings,
                    budget_type: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixo - Valor definido</SelectItem>
                  <SelectItem value="flexible">
                    Flexível - Baseado no histórico
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div>
                  <Label htmlFor="auto_adjust" className="text-sm font-medium">
                    Ajuste Automático
                  </Label>
                  <p className="text-xs text-gray-500">
                    Ajustar estimativas baseado no histórico
                  </p>
                </div>
                <input
                  id="auto_adjust"
                  type="checkbox"
                  checked={settings.auto_adjust}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      auto_adjust: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-blue-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div>
                  <Label
                    htmlFor="notifications"
                    className="text-sm font-medium"
                  >
                    Notificações
                  </Label>
                  <p className="text-xs text-gray-500">
                    Receber alertas de gastos
                  </p>
                </div>
                <input
                  id="notifications"
                  type="checkbox"
                  checked={settings.notifications_enabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications_enabled: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-blue-600 rounded"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Informações Adicionais */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Como Funciona
            </span>
          </div>
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              • <strong>Orçamento Fixo:</strong> Usa o valor definido como meta
              mensal
            </p>
            <p>
              • <strong>Orçamento Flexível:</strong> Calcula automaticamente
              baseado no histórico
            </p>
            <p>
              • <strong>Ajuste Automático:</strong> Atualiza estimativas
              conforme novos dados
            </p>
            <p>
              • <strong>Alertas:</strong> Notifica quando atingir o percentual
              definido
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
