import { IUseCase } from '../../domain/interfaces/IUseCase';
import { IAIAnalysisStrategy, AnalysisResult } from '../../domain/services/AIAnalysisStrategy';
import { IAIProvider, PatientProfile } from '../../domain/interfaces/IAIProvider';
import { AIProviderFactory } from '../../domain/services/AIProviderFactory';

/**
 * Caso de uso para análise de sintomas com IA
 * Implementa Strategy Pattern para diferentes tipos de análise
 * 
 * Complexidade: O(n*m) onde n é o número de provedores e m é o número de sintomas
 */
export interface AnalyzeSymptomsRequest {
  symptoms: string[];
  patientProfile: PatientProfile;
  analysisStrategy: 'single' | 'consensus' | 'fallback';
  preferredProviders?: string[];
}

export interface AnalyzeSymptomsResponse {
  analysisResult: AnalysisResult;
  recommendations: {
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    shouldSeekImmediateCare: boolean;
    suggestedSpecialties: string[];
    nextSteps: string[];
  };
}

export class AnalyzeSymptomsUseCase implements IUseCase<AnalyzeSymptomsRequest, AnalyzeSymptomsResponse> {
  constructor(
    private readonly aiProviderFactory: AIProviderFactory,
    private readonly analysisStrategies: Map<string, IAIAnalysisStrategy>
  ) {}
  
  async execute(request: AnalyzeSymptomsRequest): Promise<AnalyzeSymptomsResponse> {
    // Validações de entrada
    this.validateRequest(request);
    
    // Obter provedores de IA disponíveis
    const providers = await this.getAvailableProviders(request.preferredProviders);
    
    // Selecionar estratégia de análise
    const strategy = this.getAnalysisStrategy(request.analysisStrategy);
    
    // Executar análise
    const analysisResult = await strategy.analyze(
      request.symptoms,
      request.patientProfile,
      providers
    );
    
    // Gerar recomendações baseadas no resultado
    const recommendations = this.generateRecommendations(analysisResult, request.patientProfile);
    
    return {
      analysisResult,
      recommendations
    };
  }
  
  /**
   * Valida a requisição de entrada
   */
  private validateRequest(request: AnalyzeSymptomsRequest): void {
    if (!request.symptoms || request.symptoms.length === 0) {
      throw new Error('At least one symptom is required');
    }
    
    if (request.symptoms.some(symptom => !symptom.trim())) {
      throw new Error('All symptoms must be non-empty strings');
    }
    
    if (!request.patientProfile) {
      throw new Error('Patient profile is required');
    }
    
    if (request.patientProfile.age < 0 || request.patientProfile.age > 150) {
      throw new Error('Invalid patient age');
    }
  }
  
  /**
   * Obtém provedores de IA disponíveis
   * Complexidade: O(n) onde n é o número de provedores preferidos
   */
  private async getAvailableProviders(preferredProviders?: string[]): Promise<IAIProvider[]> {
    const availableProviders = this.aiProviderFactory.getAvailableProviders();
    
    if (availableProviders.length === 0) {
      throw new Error('No AI providers available');
    }
    
    let providersToUse: string[];
    
    if (preferredProviders && preferredProviders.length > 0) {
      // Usar apenas provedores preferidos que estão disponíveis
      providersToUse = preferredProviders.filter(provider => 
        availableProviders.includes(provider)
      );
      
      if (providersToUse.length === 0) {
        throw new Error('None of the preferred providers are available');
      }
    } else {
      // Usar todos os provedores disponíveis
      providersToUse = availableProviders;
    }
    
    // Criar instâncias dos provedores e verificar saúde
    const providers: IAIProvider[] = [];
    
    for (const providerName of providersToUse) {
      try {
        const provider = this.aiProviderFactory.createProvider(providerName);
        const healthStatus = await provider.healthCheck();
        
        if (healthStatus.isAvailable) {
          providers.push(provider);
        } else {
          console.warn(`Provider ${providerName} is not available`);
        }
      } catch (error) {
        console.error(`Failed to initialize provider ${providerName}:`, error);
      }
    }
    
    if (providers.length === 0) {
      throw new Error('No healthy AI providers available');
    }
    
    return providers;
  }
  
  /**
   * Seleciona estratégia de análise
   */
  private getAnalysisStrategy(strategyName: string): IAIAnalysisStrategy {
    const strategy = this.analysisStrategies.get(strategyName);
    
    if (!strategy) {
      throw new Error(`Analysis strategy '${strategyName}' not found`);
    }
    
    return strategy;
  }
  
  /**
   * Gera recomendações baseadas no resultado da análise
   * Complexidade: O(n) onde n é o número de sugestões
   */
  private generateRecommendations(
    analysisResult: AnalysisResult,
    patientProfile: PatientProfile
  ): AnalyzeSymptomsResponse['recommendations'] {
    const suggestions = analysisResult.suggestions;
    
    if (suggestions.length === 0) {
      return {
        urgencyLevel: 'low',
        shouldSeekImmediateCare: false,
        suggestedSpecialties: ['Clínico Geral'],
        nextSteps: ['Agendar consulta com clínico geral para avaliação']
      };
    }
    
    // Determinar nível de urgência baseado na severidade das sugestões
    const maxSeverity = this.getMaxSeverity(suggestions.map(s => s.severity));
    const urgencyLevel = this.mapSeverityToUrgency(maxSeverity);
    
    // Determinar se precisa de cuidado imediato
    const shouldSeekImmediateCare = urgencyLevel === 'critical' || 
      (urgencyLevel === 'high' && (patientProfile.age >= 65 || patientProfile.age < 2));
    
    // Sugerir especialidades baseadas nas condições
    const suggestedSpecialties = this.suggestSpecialties(suggestions);
    
    // Gerar próximos passos
    const nextSteps = this.generateNextSteps(urgencyLevel, shouldSeekImmediateCare, suggestions);
    
    return {
      urgencyLevel,
      shouldSeekImmediateCare,
      suggestedSpecialties,
      nextSteps
    };
  }
  
  private getMaxSeverity(severities: string[]): string {
    const severityOrder = ['low', 'medium', 'high', 'critical'];
    return severities.reduce((max, current) => {
      const maxIndex = severityOrder.indexOf(max);
      const currentIndex = severityOrder.indexOf(current);
      return currentIndex > maxIndex ? current : max;
    }, 'low');
  }
  
  private mapSeverityToUrgency(severity: string): 'low' | 'medium' | 'high' | 'critical' {
    return severity as 'low' | 'medium' | 'high' | 'critical';
  }
  
  private suggestSpecialties(suggestions: any[]): string[] {
    // Mapeamento simplificado de condições para especialidades
    const specialtyMap: Record<string, string[]> = {
      'cardiac': ['Cardiologia'],
      'respiratory': ['Pneumologia'],
      'neurological': ['Neurologia'],
      'gastrointestinal': ['Gastroenterologia'],
      'dermatological': ['Dermatologia'],
      'orthopedic': ['Ortopedia'],
      'psychiatric': ['Psiquiatria'],
      'gynecological': ['Ginecologia'],
      'urological': ['Urologia'],
      'ophthalmological': ['Oftalmologia'],
      'ent': ['Otorrinolaringologia']
    };
    
    const specialties = new Set<string>();
    specialties.add('Clínico Geral'); // Sempre incluir clínico geral
    
    suggestions.forEach(suggestion => {
      const condition = suggestion.condition.toLowerCase();
      Object.entries(specialtyMap).forEach(([key, specs]) => {
        if (condition.includes(key)) {
          specs.forEach(spec => specialties.add(spec));
        }
      });
    });
    
    return Array.from(specialties);
  }
  
  private generateNextSteps(
    urgencyLevel: string,
    shouldSeekImmediateCare: boolean,
    suggestions: any[]
  ): string[] {
    const steps: string[] = [];
    
    if (shouldSeekImmediateCare) {
      steps.push('Procurar atendimento médico imediato (pronto-socorro)');
      steps.push('Levar histórico médico e lista de medicamentos atuais');
    } else {
      switch (urgencyLevel) {
        case 'high':
          steps.push('Agendar consulta médica nas próximas 24-48 horas');
          break;
        case 'medium':
          steps.push('Agendar consulta médica na próxima semana');
          break;
        default:
          steps.push('Agendar consulta médica quando conveniente');
      }
    }
    
    // Adicionar passos específicos baseados nas sugestões
    const uniqueActions = new Set<string>();
    suggestions.forEach(suggestion => {
      suggestion.recommendedActions.forEach((action: string) => {
        uniqueActions.add(action);
      });
    });
    
    Array.from(uniqueActions).slice(0, 3).forEach(action => {
      steps.push(action);
    });
    
    steps.push('Monitorar sintomas e procurar ajuda se piorarem');
    
    return steps;
  }
}