import { useAuth } from "@/_core/hooks/useAuth";
import { APP_NAME, APP_TAGLINE } from "@/const";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Users, Brain, TrendingUp } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full mb-4 animate-pulse">
            <span className="text-2xl font-bold text-white">V</span>
          </div>
          <p className="text-white font-semibold">VITAIA</p>
          <p className="text-gray-400 text-sm mt-2">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Bem-vindo, {user?.name || "Médico"}! 👋
        </h1>
        <p className="text-gray-400">{APP_TAGLINE}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Pacientes</p>
              <p className="text-3xl font-bold text-white mt-2">12</p>
            </div>
            <div className="p-3 bg-emerald-500/20 rounded-lg">
              <Users className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Consultas</p>
              <p className="text-3xl font-bold text-white mt-2">28</p>
            </div>
            <div className="p-3 bg-cyan-500/20 rounded-lg">
              <Activity className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Análises IA</p>
              <p className="text-3xl font-bold text-white mt-2">156</p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Brain className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Taxa Aprovação</p>
              <p className="text-3xl font-bold text-white mt-2">87%</p>
            </div>
            <div className="p-3 bg-amber-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Consultations */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-800/50 border-slate-700/50 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Consultas Recentes</h2>
            
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
                  <div className="flex-1">
                    <p className="text-white font-medium">Paciente #{i}</p>
                    <p className="text-gray-400 text-sm">Há {i} dias</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                      Completa
                    </span>
                    <Button variant="outline" size="sm" className="border-slate-600 hover:bg-slate-700">
                      Ver
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white">
              Ver Todas as Consultas
            </Button>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card className="bg-slate-800/50 border-slate-700/50 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Ações Rápidas</h2>
            
            <div className="space-y-3">
              <Button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white justify-start">
                <span className="mr-2">+</span> Nova Consulta
              </Button>
              
              <Button className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white justify-start">
                <span className="mr-2">+</span> Novo Paciente
              </Button>
              
              <Button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white justify-start">
                <span className="mr-2">📊</span> Análises
              </Button>
              
              <Button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white justify-start">
                <span className="mr-2">📋</span> Relatórios
              </Button>
            </div>
          </Card>

          {/* Features Highlight */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 p-6 mt-6">
            <h3 className="text-lg font-bold text-white mb-4">✨ Recursos IA</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                Diagnóstico Inteligente
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                Análise de Imagens
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                Recomendações Médicas
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                Multi-Especialidade
              </li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mt-8 p-6 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-lg">
        <p className="text-white font-medium mb-2">🚀 Dica do Dia</p>
        <p className="text-gray-300 text-sm">
          Use a IA para gerar sugestões de diagnóstico baseadas em diretrizes clínicas atualizadas. 
          Sempre revise as recomendações antes de prescrever.
        </p>
      </div>
    </DashboardLayout>
  );
}
