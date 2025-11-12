import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Brain,
  Heart,
  Thermometer,
  Stethoscope
} from "lucide-react";
import { useState } from "react";

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  address: string;
  lastVisit: string;
  nextAppointment?: string;
  status: "stable" | "attention" | "critical";
  riskLevel: "low" | "medium" | "high";
  vitals: {
    heartRate: number;
    bloodPressure: string;
    temperature: number;
    oxygenSaturation: number;
  };
  conditions: string[];
  aiInsights: {
    riskScore: number;
    recommendations: string[];
    lastAnalysis: string;
  };
}

interface SpectacularPatientCardProps {
  patient: Patient;
  onViewDetails?: (patientId: string) => void;
  onScheduleAppointment?: (patientId: string) => void;
}

const statusConfig = {
  stable: {
    color: "bg-green-500",
    textColor: "text-green-700",
    bgColor: "bg-green-50",
    icon: CheckCircle,
    label: "Estável"
  },
  attention: {
    color: "bg-yellow-500",
    textColor: "text-yellow-700",
    bgColor: "bg-yellow-50",
    icon: AlertTriangle,
    label: "Atenção"
  },
  critical: {
    color: "bg-red-500",
    textColor: "text-red-700",
    bgColor: "bg-red-50",
    icon: AlertTriangle,
    label: "Crítico"
  }
};

const riskConfig = {
  low: { color: "bg-green-100 text-green-800", label: "Baixo Risco" },
  medium: { color: "bg-yellow-100 text-yellow-800", label: "Risco Moderado" },
  high: { color: "bg-red-100 text-red-800", label: "Alto Risco" }
};

export default function SpectacularPatientCard({ 
  patient, 
  onViewDetails, 
  onScheduleAppointment 
}: SpectacularPatientCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const status = statusConfig[patient.status];
  const risk = riskConfig[patient.riskLevel];
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group"
    >
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white dark:bg-slate-800">
        {/* Status Header */}
        <div className={`h-2 ${status.color}`} />
        
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                  <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                
                {/* Status Indicator */}
                <motion.div
                  animate={{ scale: isHovered ? 1.1 : 1 }}
                  className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${status.color} flex items-center justify-center shadow-lg`}
                >
                  <StatusIcon className="h-3 w-3 text-white" />
                </motion.div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                  {patient.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {patient.age} anos • {patient.gender}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className={risk.color}>
                    {risk.label}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    ID: {patient.id}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* AI Risk Score */}
            <motion.div
              animate={{ rotate: isHovered ? 5 : 0 }}
              className="text-center"
            >
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <motion.circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - patient.aiInsights.riskScore / 100)}`}
                    className={patient.aiInsights.riskScore > 70 ? "text-red-500" : 
                              patient.aiInsights.riskScore > 40 ? "text-yellow-500" : "text-green-500"}
                    initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - patient.aiInsights.riskScore / 100) }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {patient.aiInsights.riskScore}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Risco IA</p>
            </motion.div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Phone className="h-4 w-4 text-blue-500" />
              <span className="truncate">{patient.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <Mail className="h-4 w-4 text-green-500" />
              <span className="truncate">{patient.email}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 md:col-span-2">
              <MapPin className="h-4 w-4 text-red-500" />
              <span className="truncate">{patient.address}</span>
            </div>
          </div>

          {/* Vitals */}
          <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-500" />
              Sinais Vitais
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                <span className="text-gray-600 dark:text-gray-300">
                  {patient.vitals.heartRate} bpm
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-blue-500" />
                <span className="text-gray-600 dark:text-gray-300">
                  {patient.vitals.bloodPressure}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-orange-500" />
                <span className="text-gray-600 dark:text-gray-300">
                  {patient.vitals.temperature}°C
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-gray-600 dark:text-gray-300">
                  SpO2 {patient.vitals.oxygenSaturation}%
                </span>
              </div>
            </div>
          </div>

          {/* Conditions */}
          {patient.conditions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Condições Médicas
              </h4>
              <div className="flex flex-wrap gap-1">
                {patient.conditions.slice(0, 3).map((condition, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {condition}
                  </Badge>
                ))}
                {patient.conditions.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{patient.conditions.length - 3} mais
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* AI Insights */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Insights de IA
            </h4>
            <div className="space-y-2">
              {patient.aiInsights.recommendations.slice(0, 2).map((rec, index) => (
                <p key={index} className="text-xs text-purple-700 dark:text-purple-300">
                  • {rec}
                </p>
              ))}
              <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Última análise: {patient.aiInsights.lastAnalysis}
              </p>
            </div>
          </div>

          {/* Appointments */}
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Última consulta:</p>
              <p className="font-medium text-gray-900 dark:text-white">{patient.lastVisit}</p>
            </div>
            {patient.nextAppointment && (
              <div className="text-right">
                <p className="text-gray-500 dark:text-gray-400">Próxima consulta:</p>
                <p className="font-medium text-green-600 dark:text-green-400">{patient.nextAppointment}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onViewDetails?.(patient.id)}
            >
              Ver Detalhes
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600"
              onClick={() => onScheduleAppointment?.(patient.id)}
            >
              Agendar
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}