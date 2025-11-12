import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap,
  Brain,
  Sparkles,
} from "lucide-react";
import { trpc } from "../lib/trpc";

type AIProvider = "openai" | "gemini" | "deepseek";

interface ProviderHealth {
  openai: boolean;
  gemini: boolean;
  deepseek: boolean;
}

interface AIProviderSelectorProps {
  selectedProvider?: AIProvider;
  onProviderChange?: (provider: AIProvider) => void;
  enableMultiProvider?: boolean;
  onMultiProviderChange?: (enabled: boolean) => void;
  showHealthCheck?: boolean;
  className?: string;
}

const providerInfo = {
  openai: {
    name: "OpenAI ChatGPT",
    description: "GPT-4o - Modelo avançado para análise médica complexa",
    icon: Brain,
    color: "bg-green-500",
    features: ["Raciocínio avançado", "Análise detalhada", "Suporte a imagens"],
  },
  gemini: {
    name: "Google Gemini",
    description: "Gemini 2.0 Flash - Rápido e eficiente para diagnósticos",
    icon: Sparkles,
    color: "bg-blue-500",
    features: ["Velocidade alta", "Multimodal", "Contexto extenso"],
  },
  deepseek: {
    name: "DeepSeek",
    description: "DeepSeek Reasoner - Especializado em raciocínio médico",
    icon: Zap,
    color: "bg-purple-500",
    features: ["Raciocínio médico", "Análise profunda", "Custo eficiente"],
  },
} as const;

export function AIProviderSelector({
  selectedProvider = "gemini",
  onProviderChange,
  enableMultiProvider = false,
  onMultiProviderChange,
  showHealthCheck = true,
  className = "",
}: AIProviderSelectorProps) {
  const [providerHealth, setProviderHealth] = useState<ProviderHealth>({
    openai: false,
    gemini: false,
    deepseek: false,
  });
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [lastHealthCheck, setLastHealthCheck] = useState<Date | null>(null);

  const healthCheckQuery = trpc.ai.checkHealth.useQuery(undefined, {
    enabled: showHealthCheck,
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
  });

  // Handle success in useEffect
  React.useEffect(() => {
    if (healthCheckQuery.data?.success && healthCheckQuery.data.providers) {
      setProviderHealth(healthCheckQuery.data.providers);
      setLastHealthCheck(new Date());
    }
  }, [healthCheckQuery.data]);

  const handleProviderChange = (provider: string) => {
    const aiProvider = provider as AIProvider;
    onProviderChange?.(aiProvider);
  };

  const handleMultiProviderToggle = (enabled: boolean) => {
    onMultiProviderChange?.(enabled);
  };

  const checkHealth = async () => {
    setIsCheckingHealth(true);
    try {
      await healthCheckQuery.refetch();
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const getProviderStatusIcon = (provider: AIProvider) => {
    const isHealthy = providerHealth[provider];
    if (isHealthy) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getProviderStatusBadge = (provider: AIProvider) => {
    const isHealthy = providerHealth[provider];
    return (
      <Badge
        variant={isHealthy ? "default" : "destructive"}
        className="text-xs"
      >
        {isHealthy ? "Online" : "Offline"}
      </Badge>
    );
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Configuração de IA Médica
        </CardTitle>
        <CardDescription>
          Configure os provedores de IA para análise médica e diagnóstico
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Provider Selection */}
        <div className="space-y-3">
          <Label htmlFor="provider-select" className="text-sm font-medium">
            Provedor Principal
          </Label>
          <Select value={selectedProvider} onValueChange={handleProviderChange}>
            <SelectTrigger id="provider-select">
              <SelectValue placeholder="Selecione um provedor de IA" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(providerInfo).map(([key, info]) => {
                const provider = key as AIProvider;
                const Icon = info.icon;
                return (
                  <SelectItem
                    key={key}
                    value={key}
                    className="flex items-center"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{info.name}</span>
                      {showHealthCheck && getProviderStatusIcon(provider)}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Multi-Provider Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="multi-provider" className="text-sm font-medium">
              Análise Multi-Provedor
            </Label>
            <p className="text-xs text-muted-foreground">
              Use múltiplos provedores para consenso médico
            </p>
          </div>
          <Switch
            id="multi-provider"
            checked={enableMultiProvider}
            onCheckedChange={handleMultiProviderToggle}
          />
        </div>

        <Separator />

        {/* Provider Details */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Provedores Disponíveis</h4>
          <div className="grid gap-3">
            {Object.entries(providerInfo).map(([key, info]) => {
              const provider = key as AIProvider;
              const Icon = info.icon;
              const isSelected = selectedProvider === provider;

              return (
                <div
                  key={key}
                  className={`p-3 rounded-lg border transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-md ${info.color} text-white`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-sm">{info.name}</h5>
                          {showHealthCheck && getProviderStatusBadge(provider)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {info.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {info.features.map(feature => (
                            <Badge
                              key={feature}
                              variant="outline"
                              className="text-xs"
                            >
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    {showHealthCheck && (
                      <div className="flex items-center gap-1">
                        {getProviderStatusIcon(provider)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Health Check Section */}
        {showHealthCheck && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Status dos Provedores</h4>
                  {lastHealthCheck && (
                    <p className="text-xs text-muted-foreground">
                      Última verificação: {lastHealthCheck.toLocaleTimeString()}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkHealth}
                  disabled={isCheckingHealth}
                >
                  {isCheckingHealth ? "Verificando..." : "Verificar Status"}
                </Button>
              </div>

              {healthCheckQuery.data?.recommendation && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted">
                  <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Recomendação</p>
                    <p className="text-xs text-muted-foreground">
                      {healthCheckQuery.data.recommendation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Usage Tips */}
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
          <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            💡 Dicas de Uso
          </h5>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <li>
              • <strong>Gemini:</strong> Melhor para análises rápidas e
              diagnósticos gerais
            </li>
            <li>
              • <strong>ChatGPT:</strong> Ideal para casos complexos e análise
              detalhada
            </li>
            <li>
              • <strong>DeepSeek:</strong> Excelente para raciocínio médico
              profundo
            </li>
            <li>
              • <strong>Multi-Provedor:</strong> Use para casos críticos que
              precisam de consenso
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default AIProviderSelector;
