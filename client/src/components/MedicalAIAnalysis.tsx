import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Brain,
  Stethoscope,
  FileText,
  TestTube,
  Users,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info,
  Sparkles,
} from "lucide-react";
import { trpc } from "../lib/trpc";

type AIProvider = "openai" | "gemini" | "deepseek";

interface MedicalAIAnalysisProps {
  consultationId: number;
  patientId: number;
  className?: string;
}

interface AnalysisResult {
  success: boolean;
  provider?: string;
  model?: string;
  content?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: string;
}

const providerIcons = {
  openai: Brain,
  gemini: Sparkles,
  deepseek: TestTube,
  "multi-provider": Users,
} as const;

const providerColors = {
  openai: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  gemini: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  deepseek:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "multi-provider":
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
} as const;

export function MedicalAIAnalysis({
  consultationId,
  patientId,
  className = "",
}: MedicalAIAnalysisProps) {
  const [symptoms, setSymptoms] = useState("");
  const [examResults, setExamResults] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");
  const [labResults, setLabResults] = useState("");
  const [clinicalContext, setClinicalContext] = useState("");
  const [selectedProvider, setSelectedProvider] =
    useState<AIProvider>("gemini");
  const [activeTab, setActiveTab] = useState("diagnosis");

  // Mutations for different AI analyses
  const differentialDiagnosisMutation =
    trpc.ai.generateDifferentialDiagnosis.useMutation();
  const treatmentPlanMutation = trpc.ai.generateTreatmentPlan.useMutation();
  const labAnalysisMutation = trpc.ai.analyzeLabResults.useMutation();
  const consensusMutation = trpc.ai.getMedicalConsensus.useMutation();

  const handleDifferentialDiagnosis = async () => {
    if (!symptoms.trim()) {
      alert("Por favor, insira os sintomas do paciente.");
      return;
    }

    await differentialDiagnosisMutation.mutateAsync({
      consultationId,
      patientId,
      symptoms,
      examResults: examResults || undefined,
      medicalHistory: medicalHistory || undefined,
      provider: selectedProvider,
    });
  };

  const handleTreatmentPlan = async () => {
    if (!symptoms.trim()) {
      alert("Por favor, insira informações sobre o diagnóstico.");
      return;
    }

    const patientProfile = `
Histórico Médico: ${medicalHistory || "Não informado"}
Resultados de Exames: ${examResults || "Não informado"}
    `.trim();

    await treatmentPlanMutation.mutateAsync({
      consultationId,
      patientId,
      diagnosis: symptoms, // Using symptoms as diagnosis for now
      patientProfile,
      provider: selectedProvider,
    });
  };

  const handleLabAnalysis = async () => {
    if (!labResults.trim() || !clinicalContext.trim()) {
      alert(
        "Por favor, insira os resultados laboratoriais e o contexto clínico."
      );
      return;
    }

    await labAnalysisMutation.mutateAsync({
      consultationId,
      patientId,
      labResults,
      clinicalContext,
      provider: selectedProvider,
    });
  };

  const handleConsensusAnalysis = async () => {
    if (!symptoms.trim()) {
      alert("Por favor, insira os sintomas do paciente.");
      return;
    }

    await consensusMutation.mutateAsync({
      consultationId,
      patientId,
      symptoms,
      examResults: examResults || undefined,
      medicalHistory: medicalHistory || undefined,
    });
  };

  const renderAnalysisResult = (
    result: AnalysisResult | undefined,
    isPending: boolean,
    title: string
  ) => {
    if (isPending) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Analisando com IA médica...</span>
        </div>
      );
    }

    if (!result) return null;

    if (!result.success) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Erro na análise: {result.error}</AlertDescription>
        </Alert>
      );
    }

    const provider = result.provider as keyof typeof providerIcons;
    const Icon = providerIcons[provider] || Brain;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            <h3 className="font-semibold">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={providerColors[provider] || providerColors.gemini}
            >
              {result.provider}
            </Badge>
            {result.model && (
              <Badge variant="outline" className="text-xs">
                {result.model}
              </Badge>
            )}
          </div>
        </div>

        <div className="prose prose-sm max-w-none dark:prose-invert">
          <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
            {result.content}
          </div>
        </div>

        {result.usage && (
          <div className="text-xs text-muted-foreground flex items-center gap-4">
            <span>Tokens: {result.usage.total_tokens}</span>
            <span>Prompt: {result.usage.prompt_tokens}</span>
            <span>Resposta: {result.usage.completion_tokens}</span>
          </div>
        )}
      </div>
    );
  };

  const renderConsensusResult = () => {
    const result = consensusMutation.data;
    const isPending = consensusMutation.isPending;

    if (isPending) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Obtendo consenso de múltiplos provedores...</span>
        </div>
      );
    }

    if (!result) return null;

    if (!result.success) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Erro na análise de consenso: {result.error}
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <h3 className="font-semibold">
              Análise de Consenso Multi-Provedor
            </h3>
          </div>
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            Confiança: {result.confidence?.toFixed(0)}%
          </Badge>
        </div>

        {/* Individual Provider Results */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Respostas Individuais:</h4>
          {result.results?.map((providerResult, index) => {
            const provider =
              providerResult.provider as keyof typeof providerIcons;
            const Icon = providerIcons[provider] || Brain;

            return (
              <Card key={index} className="border-l-4 border-l-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <CardTitle className="text-sm">
                      {providerResult.provider}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {providerResult.model}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="whitespace-pre-wrap text-sm">
                      {providerResult.content}
                    </div>
                  </div>
                  {providerResult.usage && (
                    <div className="text-xs text-muted-foreground mt-2 flex items-center gap-4">
                      <span>Tokens: {providerResult.usage.total_tokens}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Separator />

        {/* Consensus Summary */}
        <div>
          <h4 className="font-medium text-sm mb-3">Resumo do Consenso:</h4>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
              {result.consensus}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-primary" />
          Análise Médica com IA
        </CardTitle>
        <CardDescription>
          Use múltiplos provedores de IA para análise médica abrangente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="diagnosis">Diagnóstico</TabsTrigger>
            <TabsTrigger value="treatment">Tratamento</TabsTrigger>
            <TabsTrigger value="lab">Laboratório</TabsTrigger>
            <TabsTrigger value="consensus">Consenso</TabsTrigger>
          </TabsList>

          {/* Diagnosis Tab */}
          <TabsContent value="diagnosis" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Sintomas do Paciente *
                </label>
                <Textarea
                  placeholder="Descreva os sintomas apresentados pelo paciente..."
                  value={symptoms}
                  onChange={e => setSymptoms(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Resultados de Exames (Opcional)
                </label>
                <Textarea
                  placeholder="Resultados de exames físicos, radiológicos, etc..."
                  value={examResults}
                  onChange={e => setExamResults(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Histórico Médico (Opcional)
                </label>
                <Textarea
                  placeholder="Histórico médico relevante do paciente..."
                  value={medicalHistory}
                  onChange={e => setMedicalHistory(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleDifferentialDiagnosis}
                  disabled={differentialDiagnosisMutation.isPending}
                  className="flex-1"
                >
                  {differentialDiagnosisMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Gerar Diagnóstico Diferencial
                </Button>
                <select
                  value={selectedProvider}
                  onChange={e =>
                    setSelectedProvider(e.target.value as AIProvider)
                  }
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="gemini">Gemini</option>
                  <option value="openai">ChatGPT</option>
                  <option value="deepseek">DeepSeek</option>
                </select>
              </div>
            </div>

            {renderAnalysisResult(
              differentialDiagnosisMutation.data,
              differentialDiagnosisMutation.isPending,
              "Diagnóstico Diferencial"
            )}
          </TabsContent>

          {/* Treatment Tab */}
          <TabsContent value="treatment" className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Use os mesmos dados da aba de diagnóstico para gerar um plano de
                tratamento.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleTreatmentPlan}
              disabled={treatmentPlanMutation.isPending}
              className="w-full"
            >
              {treatmentPlanMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Gerar Plano de Tratamento
            </Button>

            {renderAnalysisResult(
              treatmentPlanMutation.data,
              treatmentPlanMutation.isPending,
              "Plano de Tratamento"
            )}
          </TabsContent>

          {/* Lab Tab */}
          <TabsContent value="lab" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Resultados Laboratoriais *
                </label>
                <Textarea
                  placeholder="Cole aqui os resultados dos exames laboratoriais..."
                  value={labResults}
                  onChange={e => setLabResults(e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Contexto Clínico *
                </label>
                <Textarea
                  placeholder="Descreva o contexto clínico e a suspeita diagnóstica..."
                  value={clinicalContext}
                  onChange={e => setClinicalContext(e.target.value)}
                  rows={2}
                />
              </div>

              <Button
                onClick={handleLabAnalysis}
                disabled={labAnalysisMutation.isPending}
                className="w-full"
              >
                {labAnalysisMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Analisar Resultados Laboratoriais
              </Button>
            </div>

            {renderAnalysisResult(
              labAnalysisMutation.data,
              labAnalysisMutation.isPending,
              "Análise Laboratorial"
            )}
          </TabsContent>

          {/* Consensus Tab */}
          <TabsContent value="consensus" className="space-y-4">
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                A análise de consenso usa múltiplos provedores de IA para
                fornecer uma visão abrangente. Use os dados da aba de
                diagnóstico.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleConsensusAnalysis}
              disabled={consensusMutation.isPending}
              className="w-full"
              variant="outline"
            >
              {consensusMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Obter Consenso Multi-Provedor
            </Button>

            {renderConsensusResult()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default MedicalAIAnalysis;
