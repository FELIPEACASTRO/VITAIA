import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";

export default function Analytics() {
  const { user } = useAuth();
  const { data: stats, isLoading } = trpc.stats.overview.useQuery();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const aiStatsData = stats?.aiStats ? [
    { name: "Aprovadas", value: stats.aiStats.approved },
    { name: "Rejeitadas", value: stats.aiStats.rejected },
    { name: "Pendentes", value: stats.aiStats.pending },
  ] : [];

  const COLORS = ["#3b82f6", "#ef4444", "#f59e0b"];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Estatísticas e Análises</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral do seu desempenho e dados de pacientes
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.patientCount || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Pacientes cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Consultas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.consultationCount || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Consultas registradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sugestões de IA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.aiStats?.total || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total de sugestões geradas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AI Suggestions Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Status das Sugestões de IA</CardTitle>
              <CardDescription>
                Distribuição de sugestões por status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {aiStatsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={aiStatsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {aiStatsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Nenhuma sugestão de IA gerada ainda
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes das Sugestões</CardTitle>
              <CardDescription>
                Análise detalhada das sugestões de IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Aprovadas</span>
                <span className="text-2xl font-bold text-blue-600">
                  {stats?.aiStats?.approved || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Rejeitadas</span>
                <span className="text-2xl font-bold text-red-600">
                  {stats?.aiStats?.rejected || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Pendentes de Revisão</span>
                <span className="text-2xl font-bold text-amber-600">
                  {stats?.aiStats?.pending || 0}
                </span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Taxa de Aprovação</span>
                  <span className="text-lg font-bold">
                    {stats?.aiStats?.total && stats.aiStats.total > 0
                      ? Math.round((stats.aiStats.approved / stats.aiStats.total) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo de Atividades</CardTitle>
            <CardDescription>
              Visão geral das suas atividades no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {stats?.patientCount || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Pacientes Ativos
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {stats?.consultationCount || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Consultas Realizadas
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {stats?.aiStats?.total || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Análises de IA
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {stats?.aiStats?.pending || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Pendentes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
