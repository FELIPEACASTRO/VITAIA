import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Brain, Cpu, Shield, Sparkles, Zap } from "lucide-react";
import { useEffect, useState } from "react";

export default function Login() {
  const loginUrl = getLoginUrl();
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0A0E14] via-[#0D1520] to-[#050609]">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 217, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 217, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite'
        }} />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 bg-[#00D9FF] rounded-full opacity-60"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animation: `floatParticle ${5 + particle.delay}s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`,
              boxShadow: '0 0 10px rgba(0, 217, 255, 0.8)',
            }}
          />
        ))}
      </div>

      {/* Holographic Orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 rounded-full opacity-30 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(0, 217, 255, 0.4) 0%, transparent 70%)',
          animation: 'pulse 4s ease-in-out infinite'
        }}
      />
      <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full opacity-30 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(157, 0, 255, 0.4) 0%, transparent 70%)',
          animation: 'pulse 5s ease-in-out infinite',
          animationDelay: '1s'
        }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(0, 255, 136, 0.3) 0%, transparent 70%)',
          animation: 'pulse 6s ease-in-out infinite',
          animationDelay: '2s'
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Branding */}
          <div className="space-y-8 text-center lg:text-left">
            {/* Logo with Holographic Effect */}
            <div className="inline-flex flex-col items-center lg:items-start">
              <div className="relative group mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-[#00D9FF] via-[#9D00FF] to-[#00FF88] rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
                <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-[#00D9FF] to-[#9D00FF] flex items-center justify-center shadow-2xl transform group-hover:scale-105 transition-transform duration-300"
                  style={{ boxShadow: '0 0 60px rgba(0, 217, 255, 0.4)' }}>
                  <Brain className="w-16 h-16 text-white" strokeWidth={1.5} />
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-transparent to-white/20" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#00FF88] rounded-full flex items-center justify-center shadow-lg animate-bounce"
                  style={{ boxShadow: '0 0 20px rgba(0, 255, 136, 0.6)' }}>
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </div>

              <h1 className="text-6xl lg:text-7xl font-black mb-4 tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D9FF] via-[#00FF88] to-[#9D00FF] animate-gradient-x">
                  VITAIA
                </span>
              </h1>
              <p className="text-2xl lg:text-3xl text-[#A9B1BD] font-light mb-2">
                A IA da Vida
              </p>
              <div className="h-1 w-32 bg-gradient-to-r from-[#00D9FF] to-[#9D00FF] rounded-full" />
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12">
              <FeatureCard
                icon={<Brain className="w-6 h-6" />}
                title="IA Médica Avançada"
                description="Diagnósticos precisos com deep learning"
                color="from-[#00D9FF] to-[#0099CC]"
                glowColor="rgba(0, 217, 255, 0.3)"
              />
              <FeatureCard
                icon={<Zap className="w-6 h-6" />}
                title="Análise em Tempo Real"
                description="Processamento instantâneo de dados"
                color="from-[#00FF88] to-[#00CC6A]"
                glowColor="rgba(0, 255, 136, 0.3)"
              />
              <FeatureCard
                icon={<Cpu className="w-6 h-6" />}
                title="50+ Especialidades"
                description="Cobertura médica completa"
                color="from-[#9D00FF] to-[#7000FF]"
                glowColor="rgba(157, 0, 255, 0.3)"
              />
              <FeatureCard
                icon={<Shield className="w-6 h-6" />}
                title="LGPD Compliance"
                description="Segurança e privacidade total"
                color="from-[#FF0099] to-[#CC0077]"
                glowColor="rgba(255, 0, 153, 0.3)"
              />
            </div>
          </div>

          {/* Right Side - Login Card */}
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              {/* Glass Card with Glow */}
              <div className="relative group">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[#00D9FF] via-[#9D00FF] to-[#00FF88] rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
                
                {/* Main Card */}
                <div className="relative bg-[rgba(15,23,42,0.7)] backdrop-blur-2xl rounded-3xl p-8 border border-[rgba(255,255,255,0.1)] shadow-2xl">
                  {/* Scan Line Effect */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00D9FF] to-transparent opacity-50 animate-scan" />
                  
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00D9FF] to-[#9D00FF] mb-4 shadow-lg"
                      style={{ boxShadow: '0 0 30px rgba(0, 217, 255, 0.5)' }}>
                      <Brain className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      Bem-vindo de Volta
                    </h2>
                    <p className="text-[#A9B1BD]">
                      Entre na próxima geração da medicina
                    </p>
                  </div>

                  {/* Login Button */}
                  <a href={loginUrl} className="block">
                    <Button
                      className="w-full h-14 text-lg font-semibold relative overflow-hidden group/btn"
                      style={{
                        background: 'linear-gradient(135deg, #00D9FF 0%, #9D00FF 100%)',
                        border: 'none',
                        boxShadow: '0 10px 40px rgba(0, 217, 255, 0.3)',
                      }}
                    >
                      {/* Shimmer Effect */}
                      <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      
                      <span className="relative flex items-center justify-center gap-3">
                        <Cpu className="w-5 h-5 animate-spin-slow" />
                        Entrar no Sistema
                        <Sparkles className="w-5 h-5" />
                      </span>
                    </Button>
                  </a>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[rgba(255,255,255,0.1)]" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-[rgba(15,23,42,0.9)] text-[#A9B1BD]">
                        Acesso Seguro
                      </span>
                    </div>
                  </div>

                  {/* Security Badges */}
                  <div className="flex items-center justify-center gap-6 text-xs text-[#A9B1BD]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#00FF88] rounded-full animate-pulse"
                        style={{ boxShadow: '0 0 10px rgba(0, 255, 136, 0.6)' }} />
                      <span>256-bit SSL</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#00D9FF]" />
                      <span>LGPD Compliant</span>
                    </div>
                  </div>

                  {/* Footer Text */}
                  <p className="text-center text-xs text-[#717E91] mt-6 leading-relaxed">
                    Ao entrar, você concorda com nossos termos de serviço e política de privacidade
                  </p>
                </div>
              </div>

              {/* Version Badge */}
              <div className="text-center mt-6 text-sm text-[#717E91]">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)]">
                  <div className="w-2 h-2 bg-[#00D9FF] rounded-full animate-pulse" />
                  Versão 1.0 • Powered by Medical AI
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }

        @keyframes floatParticle {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translate(20px, -20px) scale(1.2);
            opacity: 1;
          }
        }

        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }

        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color,
  glowColor,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  glowColor: string;
}) {
  return (
    <div className="relative group">
      <div
        className="absolute -inset-0.5 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"
        style={{ background: `linear-gradient(135deg, ${glowColor}, transparent)` }}
      />
      <div className="relative bg-[rgba(15,23,42,0.6)] backdrop-blur-xl rounded-2xl p-5 border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] transition-all duration-300">
        <div
          className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${color} mb-3 shadow-lg`}
          style={{ boxShadow: `0 0 20px ${glowColor}` }}
        >
          {icon}
        </div>
        <h3 className="text-white font-semibold mb-1 text-sm">{title}</h3>
        <p className="text-[#A9B1BD] text-xs leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
