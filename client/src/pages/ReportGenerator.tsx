import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Download, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

interface ReportData {
  consultation: any;
  patient: any;
  examResults: any[];
  aiSuggestions: any[];
}

export default function ReportGenerator() {
  const [, setLocation] = useLocation();
  const [selectedConsultationId, setSelectedConsultationId] = useState<number | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: patients } = trpc.patients.list.useQuery();
  const generateReportMutation = trpc.reports.generateConsultationReport.useQuery(
    { consultationId: selectedConsultationId || 0 },
    { enabled: selectedConsultationId !== null }
  );

  const handleGenerateReport = async () => {
    if (!selectedConsultationId) return;
    
    setIsGenerating(true);
    try {
      const result = await generateReportMutation.refetch();
      if (result.data?.data) {
        setReportData(result.data.data);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!reportData) return;

    const htmlContent = generatePDFContent(reportData);
    const element = document.createElement("a");
    const file = new Blob([htmlContent], { type: "text/html" });
    element.href = URL.createObjectURL(file);
    element.download = `relatorio_consulta_${reportData.consultation?.id || "unknown"}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Gerar Relatórios</h1>
          <p className="text-muted-foreground mt-1">
            Crie e baixe relatórios de consultas em PDF
          </p>
        </div>

        {/* Report Generation Card */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Consulta</CardTitle>
            <CardDescription>
              Escolha uma consulta para gerar o relatório
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {patients && patients.length > 0 ? (
                patients.map((patient) => (
                  <div key={patient.id} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">{patient.name}</h3>
                    <div className="text-sm text-muted-foreground mb-3">
                      <p>Email: {patient.email || "N/A"}</p>
                      <p>Telefone: {patient.phone || "N/A"}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/patient/${patient.id}`)}
                    >
                      Ver Consultas
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum paciente cadastrado
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Report Preview */}
        {reportData && (
          <Card>
            <CardHeader>
              <CardTitle>Prévia do Relatório</CardTitle>
              <CardDescription>
                Relatório de consulta para {reportData.patient?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Patient Info */}
              <div>
                <h3 className="font-semibold mb-2">Informações do Paciente</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-1 text-sm">
                  <p><strong>Nome:</strong> {reportData.patient?.name}</p>
                  <p><strong>Data de Nascimento:</strong> {reportData.patient?.dateOfBirth || "N/A"}</p>
                  <p><strong>Gênero:</strong> {reportData.patient?.gender || "N/A"}</p>
                  <p><strong>Email:</strong> {reportData.patient?.email || "N/A"}</p>
                  <p><strong>Telefone:</strong> {reportData.patient?.phone || "N/A"}</p>
                </div>
              </div>

              {/* Consultation Info */}
              <div>
                <h3 className="font-semibold mb-2">Informações da Consulta</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  <p><strong>Data:</strong> {reportData.consultation?.date ? new Date(reportData.consultation.date).toLocaleDateString("pt-BR") : "N/A"}</p>
                  <div>
                    <strong>Sintomas:</strong>
                    <p className="mt-1 text-gray-700">{reportData.consultation?.symptoms || "N/A"}</p>
                  </div>
                  {reportData.consultation?.physicalExamination && (
                    <div>
                      <strong>Exame Físico:</strong>
                      <p className="mt-1 text-gray-700">{reportData.consultation.physicalExamination}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Exam Results */}
              {reportData.examResults && reportData.examResults.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Resultados de Exames</h3>
                  <div className="space-y-2">
                    {reportData.examResults.map((exam) => (
                      <div key={exam.id} className="bg-gray-50 p-4 rounded-lg text-sm">
                        <p><strong>{exam.examType}</strong></p>
                        <p className="text-gray-700 mt-1">{exam.results}</p>
                        {exam.interpretation && (
                          <p className="text-gray-600 mt-1"><em>Interpretação: {exam.interpretation}</em></p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Suggestions */}
              {reportData.aiSuggestions && reportData.aiSuggestions.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Sugestões de IA</h3>
                  <div className="space-y-2">
                    {reportData.aiSuggestions.map((suggestion) => (
                      <div key={suggestion.id} className="bg-blue-50 p-4 rounded-lg text-sm border border-blue-200">
                        <p className="font-semibold text-blue-900 mb-2">{suggestion.suggestionType.toUpperCase()}</p>
                        <p className="text-gray-700">{suggestion.content}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Confiança: {suggestion.confidence}% | Status: {suggestion.reviewed === 1 ? "Aprovado" : suggestion.reviewed === -1 ? "Rejeitado" : "Pendente"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Download Button */}
              <Button
                onClick={handleDownloadPDF}
                className="w-full gap-2"
                size="lg"
              >
                <Download className="w-4 h-4" />
                Baixar Relatório em PDF
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function generatePDFContent(data: ReportData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Consulta</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
        .info-row { margin-bottom: 10px; }
        .info-label { font-weight: bold; display: inline-block; width: 150px; }
        .suggestion { background-color: #f0f4ff; padding: 15px; margin-bottom: 10px; border-left: 4px solid #3b82f6; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Relatório de Consulta Médica</h1>
        <p>Gerado em: ${new Date().toLocaleDateString("pt-BR")}</p>
      </div>

      <div class="section">
        <div class="section-title">Informações do Paciente</div>
        <div class="info-row">
          <span class="info-label">Nome:</span> ${data.patient?.name || "N/A"}
        </div>
        <div class="info-row">
          <span class="info-label">Data de Nascimento:</span> ${data.patient?.dateOfBirth || "N/A"}
        </div>
        <div class="info-row">
          <span class="info-label">Gênero:</span> ${data.patient?.gender || "N/A"}
        </div>
        <div class="info-row">
          <span class="info-label">Email:</span> ${data.patient?.email || "N/A"}
        </div>
        <div class="info-row">
          <span class="info-label">Telefone:</span> ${data.patient?.phone || "N/A"}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Informações da Consulta</div>
        <div class="info-row">
          <span class="info-label">Data:</span> ${data.consultation?.date ? new Date(data.consultation.date).toLocaleDateString("pt-BR") : "N/A"}
        </div>
        <div class="info-row">
          <span class="info-label">Sintomas:</span>
        </div>
        <p>${data.consultation?.symptoms || "N/A"}</p>
        ${data.consultation?.physicalExamination ? `
          <div class="info-row">
            <span class="info-label">Exame Físico:</span>
          </div>
          <p>${data.consultation.physicalExamination}</p>
        ` : ""}
      </div>

      ${data.examResults && data.examResults.length > 0 ? `
        <div class="section">
          <div class="section-title">Resultados de Exames</div>
          ${data.examResults.map(exam => `
            <div class="info-row">
              <strong>${exam.examType}</strong><br>
              ${exam.results}<br>
              ${exam.interpretation ? `<em>Interpretação: ${exam.interpretation}</em>` : ""}
            </div>
          `).join("")}
        </div>
      ` : ""}

      ${data.aiSuggestions && data.aiSuggestions.length > 0 ? `
        <div class="section">
          <div class="section-title">Sugestões de IA</div>
          ${data.aiSuggestions.map(suggestion => `
            <div class="suggestion">
              <strong>${suggestion.suggestionType.toUpperCase()}</strong><br>
              ${suggestion.content}<br>
              <small>Confiança: ${suggestion.confidence}% | Status: ${suggestion.reviewed === 1 ? "Aprovado" : suggestion.reviewed === -1 ? "Rejeitado" : "Pendente"}</small>
            </div>
          `).join("")}
        </div>
      ` : ""}

      <div style="margin-top: 50px; border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; color: #666;">
        <p><strong>Aviso Legal:</strong> Este relatório é gerado automaticamente pelo sistema Assistente Médico de IA. As sugestões de IA são apenas para suporte à decisão clínica e não substituem o julgamento profissional do médico.</p>
      </div>
    </body>
    </html>
  `;
}
