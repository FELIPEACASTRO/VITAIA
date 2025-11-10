import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Filter, Download } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function AuditLog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("");
  const [filterResourceType, setFilterResourceType] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // In a real implementation, you would fetch audit logs from the backend
  // For now, we'll show a placeholder with the structure

  const getActionColor = (action: string) => {
    if (action.includes("create")) return "bg-green-100 text-green-800";
    if (action.includes("update")) return "bg-blue-100 text-blue-800";
    if (action.includes("delete")) return "bg-red-100 text-red-800";
    if (action.includes("view")) return "bg-gray-100 text-gray-800";
    return "bg-purple-100 text-purple-800";
  };

  const getResourceColor = (resourceType: string) => {
    switch (resourceType) {
      case "patient":
        return "bg-blue-50 border-blue-200";
      case "consultation":
        return "bg-green-50 border-green-200";
      case "ai_suggestion":
        return "bg-purple-50 border-purple-200";
      case "exam":
        return "bg-orange-50 border-orange-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const mockAuditLogs = [
    {
      id: 1,
      userId: 1,
      userName: "Felipe Angelo",
      action: "view_patient",
      resourceType: "patient",
      resourceId: 1,
      resourceName: "Felipe Angelo de Castro Carneiro",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      ipAddress: "192.168.1.100",
      details: "Acessou perfil do paciente",
    },
    {
      id: 2,
      userId: 1,
      userName: "Felipe Angelo",
      action: "create_consultation",
      resourceType: "consultation",
      resourceId: 1,
      resourceName: "Consulta - Dor de Cabeça",
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      ipAddress: "192.168.1.100",
      details: "Criou nova consulta",
    },
    {
      id: 3,
      userId: 1,
      userName: "Felipe Angelo",
      action: "review_ai_suggestion",
      resourceType: "ai_suggestion",
      resourceId: 1,
      resourceName: "Sugestão de Diagnóstico",
      timestamp: new Date(Date.now() - 1000 * 60 * 25),
      ipAddress: "192.168.1.100",
      details: "Aprovou sugestão de IA",
    },
    {
      id: 4,
      userId: 1,
      userName: "Felipe Angelo",
      action: "create_exam",
      resourceType: "exam",
      resourceId: 1,
      resourceName: "Exame de Sangue",
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
      ipAddress: "192.168.1.100",
      details: "Registrou resultado de exame",
    },
  ];

  const filteredLogs = mockAuditLogs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = !filterAction || log.action === filterAction;
    const matchesResourceType = !filterResourceType || log.resourceType === filterResourceType;

    return matchesSearch && matchesAction && matchesResourceType;
  });

  const handleExportCSV = () => {
    const headers = ["Data/Hora", "Usuário", "Ação", "Recurso", "ID", "Endereço IP", "Detalhes"];
    const rows = filteredLogs.map((log) => [
      log.timestamp.toLocaleString("pt-BR"),
      log.userName,
      log.action,
      log.resourceType,
      log.resourceId,
      log.ipAddress,
      log.details,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auditoria LGPD</h1>
          <p className="text-muted-foreground mt-2">
            Rastreamento completo de acessos e operações em dados de pacientes
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-semibold">Buscar</label>
                <Input
                  placeholder="Usuário, recurso, ação..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Ação</label>
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Todas as ações</option>
                  <option value="view_patient">Ver Paciente</option>
                  <option value="create_consultation">Criar Consulta</option>
                  <option value="create_exam">Criar Exame</option>
                  <option value="review_ai_suggestion">Revisar IA</option>
                  <option value="update_patient">Atualizar Paciente</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold">Tipo de Recurso</label>
                <select
                  value={filterResourceType}
                  onChange={(e) => setFilterResourceType(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Todos os recursos</option>
                  <option value="patient">Paciente</option>
                  <option value="consultation">Consulta</option>
                  <option value="exam">Exame</option>
                  <option value="ai_suggestion">Sugestão IA</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button onClick={handleExportCSV} variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Registros de Auditoria</CardTitle>
            <CardDescription>{filteredLogs.length} registros encontrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum registro encontrado
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 rounded-lg border ${getResourceColor(log.resourceType)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{log.userName}</span>
                          <Badge className={getActionColor(log.action)}>
                            {log.action.replace(/_/g, " ")}
                          </Badge>
                          <Badge variant="outline">{log.resourceType}</Badge>
                        </div>
                        <p className="text-sm text-gray-700">{log.resourceName}</p>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <div className="flex items-center gap-1 justify-end mb-1">
                          <Calendar className="w-3 h-3" />
                          {log.timestamp.toLocaleString("pt-BR")}
                        </div>
                        <div>IP: {log.ipAddress}</div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">{log.details}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* LGPD Compliance Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">Conformidade LGPD</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <p>
              ✓ <strong>Rastreamento Completo:</strong> Todos os acessos a dados de pacientes são registrados
            </p>
            <p>
              ✓ <strong>Retenção de Dados:</strong> Logs são mantidos por 36 meses conforme regulamentação
            </p>
            <p>
              ✓ <strong>Direito ao Esquecimento:</strong> Dados de pacientes podem ser deletados a pedido
            </p>
            <p>
              ✓ <strong>Consentimento:</strong> Registro de consentimento para processamento de dados
            </p>
            <p>
              ✓ <strong>Transparência:</strong> Pacientes podem solicitar cópia de seus dados
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
