import { useEffect } from 'react';
import { getLoginUrl } from '@/const';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const loginUrl = getLoginUrl();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full mb-4 shadow-lg">
              <span className="text-2xl font-bold text-white">V</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">VITAIA</h1>
            <p className="text-gray-300 text-sm">A IA da Vida - Inteligência Artificial Médica</p>
          </div>

          {/* Description */}
          <div className="mb-8 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center mt-1">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Diagnósticos Inteligentes</p>
                <p className="text-gray-400 text-xs">Sugestões de IA baseadas em diretrizes clínicas</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center mt-1">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Multi-Especialidade</p>
                <p className="text-gray-400 text-xs">Suporte para todas as especialidades médicas</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center mt-1">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Conformidade LGPD</p>
                <p className="text-gray-400 text-xs">Dados de pacientes protegidos e auditados</p>
              </div>
            </div>
          </div>

          {/* Login Button */}
          <a href={loginUrl} className="block">
            <Button 
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4" />
                Entrar com Manus
              </span>
            </Button>
          </a>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-gray-400 text-xs text-center">
              Ao entrar, você concorda com nossos termos de serviço e política de privacidade
            </p>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Versão 1.0 • Desenvolvido para Médicos • Powered by IA
          </p>
        </div>
      </div>
    </div>
  );
}
