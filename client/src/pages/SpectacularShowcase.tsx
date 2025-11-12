import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  Eye, 
  Code, 
  Palette, 
  Zap, 
  Heart,
  Brain,
  Users,
  Activity
} from "lucide-react";

// Import dos componentes espetaculares
import SpectacularHero from "@/components/SpectacularHero";
import SpectacularLoadingScreen from "@/components/SpectacularLoadingScreen";
import SpectacularPatientCard from "@/components/SpectacularPatientCard";
import SpectacularDashboard from "@/components/SpectacularDashboard";
import SpectacularMicrocopy from "@/components/SpectacularMicrocopy";

// Mock data para demonstração
const mockPatient = {
  id: "PAT001",
  name: "Maria Silva Santos",
  age: 45,
  gender: "Feminino",
  phone: "(11) 99999-9999",
  email: "maria.silva@email.com",
  address: "Rua das Flores, 123 - São Paulo, SP",
  lastVisit: "15/01/2024",
  nextAppointment: "22/01/2024",
  status: "attention" as const,
  riskLevel: "medium" as const,
  vitals: {
    heartRate: 78,
    bloodPressure: "140/90",
    temperature: 36.8,
    oxygenSaturation: 97
  },
  conditions: ["Hipertensão", "Diabetes Tipo 2", "Colesterol Alto"],
  aiInsights: {
    riskScore: 65,
    recommendations: [
      "Monitorar pressão arterial diariamente",
      "Ajustar medicação para diabetes",
      "Agendar consulta cardiológica"
    ],
    lastAnalysis: "Hoje às 14:30"
  }
};

const showcaseItems = [
  {
    id: "hero",
    title: "Hero Section Espetacular",
    description: "Landing page cinematográfica com animações avançadas",
    icon: Sparkles,
    color: "from-purple-500 to-pink-500",
    component: "hero"
  },
  {
    id: "loading",
    title: "Loading Screen Avançado",
    description: "Tela de carregamento com múltiplos estágios e animações",
    icon: Zap,
    color: "from-blue-500 to-cyan-500",
    component: "loading"
  },
  {
    id: "patient-card",
    title: "Patient Card Premium",
    description: "Card de paciente com vitais, IA e micro-interações",
    icon: Heart,
    color: "from-green-500 to-emerald-500",
    component: "patient"
  },
  {
    id: "dashboard",
    title: "Dashboard Médico Avançado",
    description: "Dashboard completo com gráficos e analytics em tempo real",
    icon: Activity,
    color: "from-orange-500 to-red-500",
    component: "dashboard"
  },
  {
    id: "microcopy",
    title: "Sistema de Microcopy",
    description: "Comunicação empática e profissional em cada interação",
    icon: Brain,
    color: "from-indigo-500 to-purple-500",
    component: "microcopy"
  }
];

export default function SpectacularShowcase() {
  const [activeComponent, setActiveComponent] = useState("hero");
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  const startLoadingDemo = () => {
    setIsLoadingDemo(true);
    setTimeout(() => setIsLoadingDemo(false), 8000);
  };

  const renderComponent = () => {
    switch (activeComponent) {
      case "hero":
        return <SpectacularHero />;
      case "loading":
        return (
          <div className="relative">
            <SpectacularLoadingScreen isLoading={isLoadingDemo} />
            {!isLoadingDemo && (
              <div className="flex items-center justify-center min-h-[400px] bg-slate-100 dark:bg-slate-800 rounded-lg">
                <Button 
                  onClick={startLoadingDemo}
                  className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Demonstrar Loading
                </Button>
              </div>
            )}
          </div>
        );
      case "patient":
        return (
          <div className="max-w-md mx-auto">
            <SpectacularPatientCard 
              patient={mockPatient}
              onViewDetails={(id) => console.log("Ver detalhes:", id)}
              onScheduleAppointment={(id) => console.log("Agendar:", id)}
            />
          </div>
        );
      case "dashboard":
        return <SpectacularDashboard />;
      case "microcopy":
        return <SpectacularMicrocopy />;
      default:
        return <SpectacularHero />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-cyan-400 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">V</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    VITAIA Showcase
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Frontend Espetacular - Todos os Profissionais Integrados
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Eye className="h-3 w-3 mr-1" />
                Demo Mode
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                <Code className="h-3 w-3 mr-1" />
                React 19 + TypeScript
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Component Selector */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-purple-500" />
                  Componentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {showcaseItems.map((item) => (
                  <motion.button
                    key={item.id}
                    onClick={() => setActiveComponent(item.component)}
                    className={`w-full text-left p-4 rounded-lg border transition-all duration-300 ${
                      activeComponent === item.component
                        ? 'border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-700'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-200 hover:bg-purple-50/50 dark:hover:bg-purple-900/10'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${item.color}`}>
                        <item.icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {item.title}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </CardContent>
            </Card>

            {/* Professional Credits */}
            <Card className="mt-6 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  Profissionais Integrados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {[
                    { role: "Product Manager", color: "bg-blue-100 text-blue-800" },
                    { role: "UX Designer", color: "bg-green-100 text-green-800" },
                    { role: "UI Designer", color: "bg-purple-100 text-purple-800" },
                    { role: "Motion Designer", color: "bg-pink-100 text-pink-800" },
                    { role: "UX Writer", color: "bg-orange-100 text-orange-800" },
                    { role: "Frontend Dev", color: "bg-cyan-100 text-cyan-800" },
                    { role: "Accessibility", color: "bg-indigo-100 text-indigo-800" },
                  ].map((prof, index) => (
                    <motion.div
                      key={prof.role}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Badge variant="secondary" className={`${prof.color} text-xs`}>
                        ✅ {prof.role}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Component Display */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeComponent}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden"
            >
              {renderComponent()}
            </motion.div>

            {/* Component Info */}
            <Card className="mt-6 border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {showcaseItems.find(item => item.component === activeComponent)?.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                      {showcaseItems.find(item => item.component === activeComponent)?.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Heart className="h-3 w-3 mr-1" />
                      Responsivo
                    </Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <Zap className="h-3 w-3 mr-1" />
                      Animado
                    </Badge>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      <Brain className="h-3 w-3 mr-1" />
                      IA Ready
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}