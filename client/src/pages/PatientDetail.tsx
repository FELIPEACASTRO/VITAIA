import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

interface PatientDetailProps {
  params: {
    patientId: string;
  };
}

export default function PatientDetail({ params }: PatientDetailProps) {
  const patientId = parseInt(params.patientId);
  const [, setLocation] = useLocation();
  const [isCreateConsultationOpen, setIsCreateConsultationOpen] = useState(false);
  const [consultationForm, setConsultationForm] = useState({
    symptoms: "",
    physicalExamination: "",
    notes: "",
  });
  const [selectedConsultationId, setSelectedConsultationId] = useState<number | undefined>(undefined);

  // Queries
  const { data: patient, isLoading: patientLoading } = trpc.patients.get.useQuery({ patientId });
  const { data: consultations } = trpc.consultations.list.useQuery({ patientId });
  const { data: selectedConsultation } = trpc.consultations.get.useQuery(
    { consultationId: selectedConsultationId ?? 0 },
    { enabled: selectedConsultationId !== undefined }
  );
  const { data: aiSuggestions } = trpc.ai.getSuggestions.useQuery(
    { consultationId: selectedConsultationId ?? 0 },
    { enabled: selectedConsultationId !== undefined }
  );
  const { data: examResults } = trpc.exams.list.useQuery(
    { consultationId: selectedConsultationId ?? 0 },
    { enabled: selectedConsultationId !== undefined }
  );

  // Mutations
  const createConsultationMutation = trpc.consultations.create.useMutation({
    onSuccess: () => {
      setIsCreateConsultationOpen(false);
      setConsultationForm({ symptoms: "", physicalExamination: "", notes: "" });
      trpc.useUtils().consultations.list.invalidate();
    },
  });

  const generateAISuggestionsMutation = trpc.ai.generateSuggestions.useMutation();

  const handleCreateConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsultation) {
      await createConsultationMutation.mutateAsync({
        patientId,
        ...consultationForm,
      });
    }
  };

  const handleGenerateAISuggestions = async () => {
    if (!selectedConsultation) return;
    
    await generateAISuggestionsMutation.mutateAsync({
      consultationId: selectedConsultation.id,
      patientId,
      symptoms: selectedConsultation.symptoms || "",
      examResults: examResults?.map(e => `${e.examType}: ${e.results || ""}`).join("\n") || undefined,
      medicalHistory: patient?.medicalHistory || undefined,
    });
    
    trpc.useUtils().ai.getSuggestions.invalidate();
  };

  if (patientLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!patient) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Paciente não encontrado</p>
          <Button onClick={() => setLocation("/dashboard")} className="mt-4">
            Voltar ao Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{patient.name}</h1>
            <p className="text-muted-foreground">
              {patient.dateOfBirth && `Nascido em ${patient.dateOfBirth}`}
              {patient.gender && ` • ${patient.gender === "M" ? "Masculino" : patient.gender === "F" ? "Feminino" : "Outro"}`}
            </p>
          </div>
        </div>

        {/* Patient Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {patient.email && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Email</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{patient.email}</p>
              </CardContent>
            </Card>
          )}
          {patient.phone && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Telefone</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{patient.phone}</p>
              </CardContent>
            </Card>
          )}
          {patient.currentMedications && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Medicações Atuais</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{patient.currentMedications}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="consultations" className="w-full">
          <TabsList>
            <TabsTrigger value="consultations">Consultas</TabsTrigger>
            <TabsTrigger value="history">Histórico Médico</TabsTrigger>
          </TabsList>

          {/* Consultations Tab */}
          <TabsContent value="consultations" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Consultas</h2>
              <Dialog open={isCreateConsultationOpen} onOpenChange={setIsCreateConsultationOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Nova Consulta
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Registrar Nova Consulta</DialogTitle>
                    <DialogDescription>
                      Preencha os detalhes da consulta para {patient.name}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateConsultation} className="space-y-4">
                    <div>
                      <Label htmlFor="symptoms">Sintomas *</Label>
                      <Textarea
                        id="symptoms"
                        value={consultationForm.symptoms}
                        onChange={(e) =>
                          setConsultationForm({
                            ...consultationForm,
                            symptoms: e.target.value,
                          })
                        }
                        placeholder="Descreva os sintomas do paciente"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="exam">Exame Físico</Label>
                      <Textarea
                        id="exam"
                        value={consultationForm.physicalExamination}
                        onChange={(e) =>
                          setConsultationForm({
                            ...consultationForm,
                            physicalExamination: e.target.value,
                          })
                        }
                        placeholder="Achados do exame físico"
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Notas Adicionais</Label>
                      <Textarea
                        id="notes"
                        value={consultationForm.notes}
                        onChange={(e) =>
                          setConsultationForm({
                            ...consultationForm,
                            notes: e.target.value,
                          })
                        }
                        placeholder="Notas adicionais"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateConsultationOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={createConsultationMutation.isPending}
                      >
                        {createConsultationMutation.isPending
                          ? "Criando..."
                          : "Criar Consulta"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {consultations && consultations.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">
                    Nenhuma consulta registrada. Comece criando uma nova consulta.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {consultations?.map((consultation) => (
                  <Card
                    key={consultation.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedConsultationId(consultation.id)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {new Date(consultation.date).toLocaleDateString("pt-BR")}
                      </CardTitle>
                      <CardDescription>
                        {(consultation.symptoms || "").substring(0, 100)}...
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}

            {/* Selected Consultation Details */}
            {selectedConsultation && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Detalhes da Consulta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Sintomas</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedConsultation.symptoms}
                    </p>
                  </div>
                  {selectedConsultation.physicalExamination && (
                    <div>
                      <h3 className="font-semibold mb-2">Exame Físico</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedConsultation.physicalExamination}
                      </p>
                    </div>
                  )}

                  {/* Exam Results */}
                  {examResults && examResults.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Resultados de Exames</h3>
                          <div className="space-y-2">
                        {examResults?.map((exam) => (
                          <div key={exam.id} className="text-sm border-l-2 border-primary pl-3">
                            <p className="font-medium">{exam.examType}</p>
                            <p className="text-muted-foreground">{exam.results || "Sem resultados"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Suggestions */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold">Sugestões de IA</h3>
                      <Button
                        size="sm"
                        onClick={handleGenerateAISuggestions}
                        disabled={generateAISuggestionsMutation.isPending}
                      >
                        {generateAISuggestionsMutation.isPending
                          ? "Gerando..."
                          : "Gerar Sugestões"}
                      </Button>
                    </div>

                    {aiSuggestions && aiSuggestions.length > 0 ? (
                      <div className="space-y-3">
                        {aiSuggestions.map((suggestion) => (
                          <Card key={suggestion.id} className="bg-blue-50">
                            <CardContent className="pt-4">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-semibold text-blue-600">
                                  {suggestion.suggestionType.toUpperCase()}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {suggestion.reviewed === 1 ? "✓ Aprovado" : suggestion.reviewed === -1 ? "✗ Rejeitado" : "Pendente"}
                                </span>
                              </div>
                              <Streamdown>{suggestion.content}</Streamdown>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nenhuma sugestão gerada ainda. Clique em "Gerar Sugestões" para obter análise de IA.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Medical History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Histórico Médico</CardTitle>
              </CardHeader>
              <CardContent>
                {patient.medicalHistory ? (
                  <p className="whitespace-pre-wrap text-sm">
                    {patient.medicalHistory}
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    Nenhum histórico médico registrado
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
