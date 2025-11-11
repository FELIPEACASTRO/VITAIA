import { useAuth } from "@/_core/hooks/useAuth";
import { APP_TAGLINE } from "@/const";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { 
  Activity, Users, Brain, TrendingUp, Plus, Sparkles,
  ArrowRight, Zap, ChevronRight, Clock, CheckCircle2
} from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0E14]">
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center w-20 h-20 mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00D9FF] to-[#9D00FF] rounded-2xl blur-xl opacity-50 animate-pulse" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-[#00D9FF] to-[#9D00FF] rounded-2xl flex items-center justify-center"
              style={{ boxShadow: '0 0 40px rgba(0, 217, 255, 0.4)' }}>
              <Brain className="w-10 h-10 text-white animate-pulse" />
            </div>
          </div>
          <p className="text-white font-bold text-lg">VITAIA</p>
          <p className="text-[#A9B1BD] text-sm mt-2">Carregando interface...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Holographic Welcome */}
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl lg:text-5xl font-black mb-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D9FF] via-[#00FF88] to-[#9D00FF]">
                  Olá, {user?.name || "Médico"}
                </span>
                <span className="inline-block ml-3 animate-wave">👋</span>
              </h1>
              <p className="text-[#A9B1BD] text-lg">{APP_TAGLINE}</p>
            </div>
            <Button
              onClick={() => setLocation("/pacientes")}
              className="relative overflow-hidden group h-12 px-6"
              style={{
                background: 'linear-gradient(135deg, #00D9FF 0%, #9D00FF 100%)',
                boxShadow: '0 10px 30px rgba(0, 217, 255, 0.3)',
              }}
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <span className="relative flex items-center gap-2 font-semibold">
                <Plus className="w-5 h-5" />
                Nova Consulta
              </span>
            </Button>
          </div>
        </div>

        {/* Stats Grid with Glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="w-7 h-7" />}
            label="Total de Pacientes"
            value="12"
            trend="+3 este mês"
            gradient="from-[#00D9FF] to-[#0099CC]"
            glowColor="rgba(0, 217, 255, 0.3)"
          />
          <StatCard
            icon={<Activity className="w-7 h-7" />}
            label="Consultas Realizadas"
            value="28"
            trend="+8 esta semana"
            gradient="from-[#00FF88] to-[#00CC6A]"
            glowColor="rgba(0, 255, 136, 0.3)"
          />
          <StatCard
            icon={<Brain className="w-7 h-7" />}
            label="Análises IA"
            value="156"
            trend="92% precisão"
            gradient="from-[#9D00FF] to-[#7000FF]"
            glowColor="rgba(157, 0, 255, 0.3)"
          />
          <StatCard
            icon={<TrendingUp className="w-7 h-7" />}
            label="Taxa de Aprovação"
            value="87%"
            trend="+5% vs mês anterior"
            gradient="from-[#FF0099] to-[#CC0077]"
            glowColor="rgba(255, 0, 153, 0.3)"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 space-y-4">
            <GlassCard title="Atividade Recente" icon={<Clock className="w-5 h-5" />}>
              <div className="space-y-3">
                {[
                  { patient: "Maria Silva", action: "Consulta completada", time: "Há 2 horas", status: "success" },
                  { patient: "João Santos", action: "Análise IA solicitada", time: "Há 4 horas", status: "processing" },
                  { patient: "Ana Costa", action: "Exames recebidos", time: "Há 1 dia", status: "success" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] rounded-xl border border-[rgba(255,255,255,0.05)] transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        item.status === 'success' 
                          ? 'bg-gradient-to-br from-[#00FF88]/20 to-[#00CC6A]/20' 
                          : 'bg-gradient-to-br from-[#00D9FF]/20 to-[#0099CC]/20'
                      }`}>
                        {item.status === 'success' ? (
                          <CheckCircle2 className="w-5 h-5 text-[#00FF88]" />
                        ) : (
                          <Brain className="w-5 h-5 text-[#00D9FF] animate-pulse" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{item.patient}</p>
                        <p className="text-[#A9B1BD] text-sm">{item.action}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#717E91] text-xs">{item.time}</span>
                      <ChevronRight className="w-4 h-4 text-[#717E91] group-hover:text-[#00D9FF] transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => setLocation("/pacientes")}
                variant="ghost"
                className="w-full mt-4 text-[#00D9FF] hover:bg-[rgba(0,217,255,0.1)] group"
              >
                Ver todas as atividades
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </GlassCard>
          </div>

          {/* Quick Actions & AI Features */}
          <div className="space-y-4">
            <GlassCard title="Ações Rápidas" icon={<Zap className="w-5 h-5" />}>
              <div className="space-y-3">
                <QuickActionButton
                  icon={<Plus className="w-5 h-5" />}
                  label="Novo Paciente"
                  gradient="from-[#00D9FF] to-[#0099CC]"
                  onClick={() => setLocation("/pacientes")}
                />
                <QuickActionButton
                  icon={<Activity className="w-5 h-5" />}
                  label="Consultas"
                  gradient="from-[#00FF88] to-[#00CC6A]"
                  onClick={() => setLocation("/pacientes")}
                />
                <QuickActionButton
                  icon={<Brain className="w-5 h-5" />}
                  label="Análises"
                  gradient="from-[#9D00FF] to-[#7000FF]"
                  onClick={() => setLocation("/analytics")}
                />
                <QuickActionButton
                  icon={<TrendingUp className="w-5 h-5" />}
                  label="Relatórios"
                  gradient="from-[#FF0099] to-[#CC0077]"
                  onClick={() => setLocation("/relatorios")}
                />
              </div>
            </GlassCard>

            <GlassCard 
              title="Recursos IA" 
              icon={<Sparkles className="w-5 h-5 text-[#9D00FF]" />}
              gradient="from-[#9D00FF]/10 to-[#7000FF]/5"
            >
              <ul className="space-y-3">
                {[
                  "Diagnóstico Inteligente",
                  "Análise de Imagens",
                  "Recomendações Médicas",
                  "Multi-Especialidade"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#E1E4E8] text-sm">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#9D00FF] to-[#00D9FF] animate-pulse" />
                    {feature}
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>
        </div>

        {/* AI Tip Banner */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00D9FF] via-[#9D00FF] to-[#00FF88] rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
          <div className="relative bg-[rgba(15,23,42,0.7)] backdrop-blur-xl rounded-2xl p-6 border border-[rgba(255,255,255,0.1)]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00D9FF] to-[#9D00FF] flex items-center justify-center flex-shrink-0"
                style={{ boxShadow: '0 0 20px rgba(0, 217, 255, 0.4)' }}>
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#00FF88]" />
                  Dica de IA do Dia
                </h3>
                <p className="text-[#A9B1BD] leading-relaxed">
                  Use a IA para gerar sugestões de diagnóstico baseadas em diretrizes clínicas atualizadas. 
                  Sempre revise as recomendações antes de prescrever. A combinação de experiência médica e inteligência artificial 
                  resulta em decisões clínicas mais precisas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          10%, 30% { transform: rotate(14deg); }
          20% { transform: rotate(-8deg); }
          40% { transform: rotate(-4deg); }
          50% { transform: rotate(10deg); }
        }

        .animate-wave {
          display: inline-block;
          animation: wave 2.5s ease-in-out infinite;
        }
      `}</style>
    </DashboardLayout>
  );
}

function StatCard({
  icon,
  label,
  value,
  trend,
  gradient,
  glowColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
  gradient: string;
  glowColor: string;
}) {
  return (
    <div className="relative group">
      <div
        className="absolute -inset-0.5 rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300"
        style={{ background: `linear-gradient(135deg, ${glowColor}, transparent)` }}
      />
      <div className="relative bg-[rgba(15,23,42,0.7)] backdrop-blur-xl rounded-2xl p-6 border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}
            style={{ boxShadow: `0 0 25px ${glowColor}` }}
          >
            {icon}
          </div>
        </div>
        <p className="text-[#A9B1BD] text-sm font-medium mb-1">{label}</p>
        <p className="text-white text-3xl font-black mb-2">{value}</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
          <span className="text-[#00FF88] text-xs font-medium">{trend}</span>
        </div>
      </div>
    </div>
  );
}

function GlassCard({
  title,
  icon,
  children,
  gradient,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  gradient?: string;
}) {
  return (
    <div className={`relative bg-[rgba(15,23,42,0.7)] backdrop-blur-xl rounded-2xl p-6 border border-[rgba(255,255,255,0.08)] ${gradient ? `bg-gradient-to-br ${gradient}` : ''}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="text-[#00D9FF]">{icon}</div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function QuickActionButton({
  icon,
  label,
  gradient,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  gradient: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full group relative overflow-hidden"
    >
      <div className="relative bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] rounded-xl p-4 border border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)] transition-all duration-300 flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}
        >
          {icon}
        </div>
        <span className="text-white font-medium text-left flex-1">{label}</span>
        <ChevronRight className="w-5 h-5 text-[#717E91] group-hover:text-[#00D9FF] group-hover:translate-x-1 transition-all duration-300" />
      </div>
    </button>
  );
}
