import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { Activity, Brain, Lock, Users } from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (isAuthenticated) {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">{APP_TITLE}</h1>
          <p className="text-muted-foreground mt-1">Assistencia Medica Inteligente</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Bem-vindo ao {APP_TITLE}</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Uma plataforma inteligente que auxilia medicos com sugestoes de diagnostico,
              tratamento e medicacao baseadas em IA, integrando dados de pacientes e historico medico.
            </p>
            <Button
              size="lg"
              onClick={() => window.location.href = getLoginUrl()}
            >
              Fazer Login
            </Button>
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <Card>
              <CardHeader>
                <Users className="w-8 h-8 mb-2 text-blue-600" />
                <CardTitle>Gerenciamento de Pacientes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Organize e acesse o historico medico completo de seus pacientes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Brain className="w-8 h-8 mb-2 text-purple-600" />
                <CardTitle>Sugestoes de IA</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Receba sugestoes inteligentes de diagnostico e tratamento
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Activity className="w-8 h-8 mb-2 text-green-600" />
                <CardTitle>Analise de Exames</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Registre e analise resultados de exames de forma estruturada
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Lock className="w-8 h-8 mb-2 text-red-600" />
                <CardTitle>Seguranca LGPD</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Dados de pacientes protegidos com conformidade total a LGPD
                </p>
              </CardContent>
            </Card>
          </div>

          {/* How It Works Section */}
          <div className="max-w-3xl mx-auto mb-16">
            <h3 className="text-2xl font-bold mb-8 text-center">Como Funciona</h3>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">1. Cadastre Seus Pacientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Adicione informacoes basicas do paciente, historico medico e medicacoes atuais
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">2. Registre Consultas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Documente sintomas, achados do exame fisico e resultados de exames
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">3. Obtenha Sugestoes de IA</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    A IA analisa os dados e fornece sugestoes de diagnostico diferencial, tratamento e medicacao
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">4. Revise e Aprove</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Voce mantem o controle total - revise, aprove ou rejeite as sugestoes da IA
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-blue-50 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Pronto para comecar?</h3>
            <p className="text-muted-foreground mb-6">
              Faca login para acessar o dashboard e comecar a gerenciar seus pacientes
            </p>
            <Button
              size="lg"
              onClick={() => window.location.href = getLoginUrl()}
            >
              Fazer Login
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 {APP_TITLE}. Todos os direitos reservados.</p>
          <p className="mt-2">Desenvolvido com seguranca e conformidade LGPD em mente.</p>
        </div>
      </footer>
    </div>
  );
}
