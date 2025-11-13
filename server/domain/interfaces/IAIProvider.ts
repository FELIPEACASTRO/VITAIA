/**
 * Interface para provedores de IA seguindo Strategy Pattern
 * Permite trocar algoritmos de IA sem modificar o código cliente
 * 
 * Complexidade de análise: O(n) onde n é o tamanho do input
 * Complexidade de geração: O(m) onde m é o tamanho da resposta
 */
export interface IAIProvider {
  readonly name: string;
  readonly version: string;
  
  /**
   * Analisa sintomas e gera sugestões de diagnóstico
   * @param symptoms Lista de sintomas
   * @param patientHistory Histórico médico do paciente
   * @returns Sugestões de diagnóstico com confiança
   */
  analyzeSymptomsAsync(
    symptoms: string[], 
    patientHistory?: string
  ): Promise<DiagnosisSuggestion[]>;
  
  /**
   * Gera plano de tratamento baseado no diagnóstico
   * @param diagnosis Diagnóstico confirmado
   * @param patientProfile Perfil do paciente
   * @returns Plano de tratamento personalizado
   */
  generateTreatmentPlan(
    diagnosis: string,
    patientProfile: PatientProfile
  ): Promise<TreatmentPlan>;
  
  /**
   * Verifica se o provedor está disponível
   * @returns Status de saúde do provedor
   */
  healthCheck(): Promise<ProviderHealthStatus>;
}

export interface DiagnosisSuggestion {
  condition: string;
  confidence: number; // 0-1
  reasoning: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendedActions: string[];
}

export interface PatientProfile {
  age: number;
  gender: string;
  allergies: string[];
  currentMedications: string[];
  chronicConditions: string[];
}

export interface TreatmentPlan {
  primaryTreatment: string;
  alternativeTreatments: string[];
  medications: MedicationRecommendation[];
  followUpInstructions: string;
  estimatedRecoveryTime: string;
}

export interface MedicationRecommendation {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  warnings: string[];
}

export interface ProviderHealthStatus {
  isAvailable: boolean;
  responseTime: number; // ms
  lastChecked: Date;
  errorRate: number; // 0-1
}