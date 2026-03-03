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
import { useLanguage } from "@/app/contexts/LanguageContext";
import { tAccountForecastSettings } from "@/app/lib/i18n";
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
  const { language } = useLanguage();
  const supabase = createClient();
  const t = tAccountForecastSettings;

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

          // Sincronizar também a meta mensal do mês atual na tabela budgets (categoria geral = NULL)
          if (settings.monthly_budget !== null) {
            const now = new Date();
            const monthYear = `${now.getFullYear()}-${String(
              now.getMonth() + 1
            ).padStart(2, "0")}`;

            try {
              await supabase
                .from("budgets")
                .upsert(
                  {
                    account_id: account.id,
                    category_id: null,
                    month_year: monthYear,
                    planned_amount: settings.monthly_budget,
                  } as any,
                  {
                    onConflict: "account_id,category_id,month_year",
                  }
                );
              console.log(
                "✅ AccountForecastSettings - Meta mensal sincronizada em budgets para",
                monthYear
              );
            } catch (budgetError) {
              console.error(
                "⚠️ AccountForecastSettings - Erro ao sincronizar meta em budgets:",
                budgetError
              );
            }
          }
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
          {t.title[language]}{account.name}
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
                    {t.monthlyBudget[language]}
                  </span>
                </div>
                <p className="text-xl font-bold text-green-600">
                  {settings.monthly_budget
                    ? formatCurrency(settings.monthly_budget)
                    : t.notDefined[language]}
                </p>
                <p className="text-xs text-gray-500">
                  {settings.budget_type === "fixed"
                    ? t.fixedBudget[language]
                    : t.flexibleBudget[language]}
                </p>
              </div>

              <div className="p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {t.alertAt[language]}
                  </span>
                </div>
                <p className="text-xl font-bold text-orange-600">
                  {settings.alert_threshold}%
                </p>
                <p className="text-xs text-gray-500">
                  {settings.notifications_enabled
                    ? t.notificationsActive[language]
                    : t.notificationsDisabled[language]}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">{t.autoAdjust[language]}</span>
              </div>
              <div className="flex items-center gap-2">
                {settings.auto_adjust ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                )}
                <span className="text-sm text-gray-600">
                  {settings.auto_adjust ? t.enabled[language] : t.disabled[language]}
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
                {t.editSettings[language]}
              </Button>
            </div>
          </div>
        ) : (
          // Modo Edição
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthly_budget">{t.monthlyBudgetKr[language]}</Label>
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
                  {t.leaveEmpty[language]}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alert_threshold">{t.alertAtPercent[language]}</Label>
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
                  {t.whenToAlert[language]}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.budgetType[language]}</Label>
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
                  <SelectItem value="fixed">{t.fixedBudgetOption[language]}</SelectItem>
                  <SelectItem value="flexible">
                    {t.flexibleBudgetOption[language]}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div>
                  <Label htmlFor="auto_adjust" className="text-sm font-medium">
                    {t.autoAdjust[language]}
                  </Label>
                  <p className="text-xs text-gray-500">
                    {t.adjustEstimates[language]}
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
                    {t.notifications[language]}
                  </Label>
                  <p className="text-xs text-gray-500">
                    {t.receiveAlerts[language]}
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
                {isLoading ? t.saving[language] : t.save[language]}
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex-1"
              >
                {t.cancel[language]}
              </Button>
            </div>
          </div>
        )}

        {/* Informações Adicionais */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              {t.howItWorks[language]}
            </span>
          </div>
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              • <strong>{t.fixedBudget[language]}:</strong> {t.fixedBudgetDesc[language]}
            </p>
            <p>
              • <strong>{t.flexibleBudget[language]}:</strong> {t.flexibleBudgetDesc[language]}
            </p>
            <p>
              • <strong>{t.autoAdjust[language]}:</strong> {t.autoAdjustDesc[language]}
            </p>
            <p>
              • <strong>{t.alerts[language]}:</strong> {t.alertsDesc[language]}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
