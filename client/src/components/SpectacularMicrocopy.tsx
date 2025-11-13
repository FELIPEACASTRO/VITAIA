import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  Brain,
  Heart,
  Shield,
  Loader2,
  Sparkles,
} from "lucide-react";

// UX Writing Guidelines para VITAIA
export const VITAIA_MICROCOPY = {
  // Tons de Voz
  VOICE_TONE: {
    professional: "Profissional e confiável",
    empathetic: "Empático e humano",
    clear: "Claro e direto",
    supportive: "Acolhedor e encorajador",
  },

  // Estados de Loading
  LOADING_STATES: {
    analyzing: "Analisando dados médicos...",
    processing: "Processando com IA médica...",
    generating: "Gerando insights clínicos...",
    saving: "Salvando informações do paciente...",
    uploading: "Enviando exame com segurança...",
    syncing: "Sincronizando dados LGPD...",
  },

  // Mensagens de Sucesso
  SUCCESS_MESSAGES: {
    patient_saved:
      "✅ Paciente cadastrado com sucesso! Dados protegidos por criptografia LGPD.",
    analysis_complete:
      "🧠 Análise de IA concluída! Sugestões clínicas disponíveis para revisão.",
    appointment_scheduled:
      "📅 Consulta agendada! Lembrete enviado ao paciente.",
    exam_uploaded:
      "📋 Exame carregado com segurança! Análise automática iniciada.",
    report_generated:
      "📊 Relatório médico gerado! Pronto para revisão e assinatura digital.",
  },

  // Mensagens de Erro (Empáticas)
  ERROR_MESSAGES: {
    network_error:
      "🌐 Conexão instável detectada. Seus dados estão seguros - tentaremos novamente automaticamente.",
    validation_error:
      "📝 Alguns campos precisam de atenção. Vamos ajudar você a completar.",
    permission_denied:
      "🔒 Acesso restrito por segurança. Entre em contato com o administrador se necessário.",
    file_too_large:
      "📁 Arquivo muito grande. Para melhor performance, use arquivos até 10MB.",
    ai_unavailable:
      "🧠 IA temporariamente indisponível. Análise manual disponível como alternativa.",
  },

  // Avisos Importantes
  WARNING_MESSAGES: {
    ai_disclaimer:
      "⚠️ IA é ferramenta auxiliar. Decisão clínica final sempre do médico responsável.",
    data_retention:
      "🗂️ Dados mantidos conforme LGPD. Exclusão automática após período legal.",
    critical_patient:
      "🚨 Paciente em estado crítico. Priorizar atendimento imediato.",
    exam_pending:
      "⏰ Exame pendente há 48h. Considere reagendamento ou follow-up.",
    consent_required:
      "📋 Consentimento LGPD necessário antes de prosseguir com análise.",
  },

  // Informações Contextuais
  INFO_MESSAGES: {
    first_visit:
      "👋 Primeira consulta! Configure preferências e histórico médico.",
    ai_learning:
      "🧠 IA aprendendo com seu feedback. Cada avaliação melhora a precisão.",
    backup_complete:
      "💾 Backup automático realizado. Seus dados estão protegidos.",
    update_available: "🔄 Nova versão disponível com melhorias de segurança.",
    offline_mode: "📱 Modo offline ativo. Dados sincronizarão quando conectar.",
  },

  // Call-to-Actions Persuasivos
  CTA_BUTTONS: {
    primary: "Iniciar Análise IA",
    secondary: "Revisar Sugestões",
    emergency: "Atendimento Urgente",
    schedule: "Agendar Consulta",
    save_draft: "Salvar Rascunho",
    export_report: "Exportar Relatório",
    get_second_opinion: "Segunda Opinião IA",
  },

  // Placeholders Úteis
  PLACEHOLDERS: {
    patient_search: "Buscar por nome, CPF ou prontuário...",
    symptoms: "Ex: dor de cabeça, febre há 3 dias, náusea...",
    medication: "Nome do medicamento, dosagem, frequência...",
    notes: "Observações clínicas, evolução do quadro...",
    exam_description: "Tipo de exame, data, observações relevantes...",
  },

  // Tooltips Educativos
  TOOLTIPS: {
    ai_confidence:
      "Nível de confiança da IA baseado em dados clínicos similares",
    risk_score: "Pontuação calculada por múltiplos algoritmos médicos",
    lgpd_icon: "Dados criptografados e protegidos conforme LGPD",
    backup_status: "Último backup realizado com sucesso",
    sync_status: "Dados sincronizados em tempo real",
  },
};

// Componente para demonstrar o microcopy em ação
export default function SpectacularMicrocopy() {
  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Sistema de Microcopy VITAIA
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Comunicação clara, empática e profissional em cada interação
        </p>
      </motion.div>

      {/* Loading States */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 text-blue-500" />
            Estados de Loading
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(VITAIA_MICROCOPY.LOADING_STATES).map(
            ([key, message], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
              >
                <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  {message}
                </span>
              </motion.div>
            )
          )}
        </CardContent>
      </Card>

      {/* Success Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Mensagens de Sucesso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(VITAIA_MICROCOPY.SUCCESS_MESSAGES).map(
            ([key, message], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    {message}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )
          )}
        </CardContent>
      </Card>

      {/* Error Messages (Empáticas) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Mensagens de Erro Empáticas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(VITAIA_MICROCOPY.ERROR_MESSAGES).map(
            ([key, message], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700 dark:text-red-300">
                    {message}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )
          )}
        </CardContent>
      </Card>

      {/* Warning Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Avisos Importantes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(VITAIA_MICROCOPY.WARNING_MESSAGES).map(
            ([key, message], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                    {message}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )
          )}
        </CardContent>
      </Card>

      {/* CTA Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Call-to-Actions Persuasivos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(VITAIA_MICROCOPY.CTA_BUTTONS).map(
              ([key, label], index) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    className={`w-full ${
                      key === "primary"
                        ? "bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600"
                        : key === "emergency"
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-blue-500 hover:bg-blue-600"
                    }`}
                  >
                    {key === "primary" && <Brain className="h-4 w-4 mr-2" />}
                    {key === "emergency" && (
                      <AlertTriangle className="h-4 w-4 mr-2" />
                    )}
                    {key === "schedule" && <Heart className="h-4 w-4 mr-2" />}
                    {label}
                  </Button>
                </motion.div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Voice & Tone Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-500" />
            Diretrizes de Tom de Voz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(VITAIA_MICROCOPY.VOICE_TONE).map(
              ([key, description], index) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg"
                >
                  <Badge variant="secondary" className="mb-2 capitalize">
                    {key.replace("_", " ")}
                  </Badge>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300">
                    {description}
                  </p>
                </motion.div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Placeholders Úteis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-cyan-500" />
            Placeholders Educativos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(VITAIA_MICROCOPY.PLACEHOLDERS).map(
            ([key, placeholder], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border-l-4 border-cyan-400"
              >
                <div className="text-sm font-medium text-cyan-800 dark:text-cyan-300 mb-1 capitalize">
                  {key.replace("_", " ")}
                </div>
                <div className="text-sm text-cyan-600 dark:text-cyan-400 italic">
                  "{placeholder}"
                </div>
              </motion.div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
