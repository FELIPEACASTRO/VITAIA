import { IAIProvider, DiagnosisSuggestion, PatientProfile } from '../interfaces/IAIProvider';

/**
 * Strategy Pattern para diferentes estratégias de análise de IA
 * Permite trocar algoritmos de análise em tempo de execução
 * 
 * Complexidade: O(n) onde n é o número de provedores utilizados
 */
export interface IAIAnalysisStrategy {
  analyze(
    symptoms: string[],
    patientProfile: PatientProfile,
    providers: IAIProvider[]
  ): Promise<AnalysisResult>;
}

export interface AnalysisResult {
  suggestions: DiagnosisSuggestion[];
  confidence: number;
  analysisMethod: string;
  providersUsed: string[];
  processingTime: number;
}

/**
 * Estratégia de análise usando um único provedor
 * Complexidade: O(1) - usa apenas um provedor
 */
export class SingleProviderStrategy implements IAIAnalysisStrategy {
  async analyze(
    symptoms: string[],
    patientProfile: PatientProfile,
    providers: IAIProvider[]
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    if (providers.length === 0) {
      throw new Error('No AI providers available');
    }
    
    const provider = providers[0];
    const suggestions = await provider.analyzeSymptomsAsync(symptoms, this.buildPatientHistory(patientProfile));
    
    return {
      suggestions,
      confidence: this.calculateAverageConfidence(suggestions),
      analysisMethod: 'single-provider',
      providersUsed: [provider.name],
      processingTime: Date.now() - startTime
    };
  }
  
  private buildPatientHistory(profile: PatientProfile): string {
    return `Age: ${profile.age}, Gender: ${profile.gender}, Allergies: ${profile.allergies.join(', ')}, Current Medications: ${profile.currentMedications.join(', ')}, Chronic Conditions: ${profile.chronicConditions.join(', ')}`;
  }
  
  private calculateAverageConfidence(suggestions: DiagnosisSuggestion[]): number {
    if (suggestions.length === 0) return 0;
    return suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length;
  }
}

/**
 * Estratégia de consenso usando múltiplos provedores
 * Complexidade: O(n*m) onde n é o número de provedores e m é o número de sugestões
 */
export class ConsensusStrategy implements IAIAnalysisStrategy {
  constructor(private readonly minimumAgreement: number = 0.6) {}
  
  async analyze(
    symptoms: string[],
    patientProfile: PatientProfile,
    providers: IAIProvider[]
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    if (providers.length < 2) {
      throw new Error('Consensus strategy requires at least 2 providers');
    }
    
    const patientHistory = this.buildPatientHistory(patientProfile);
    
    // Executa análise em paralelo com todos os provedores
    const providerResults = await Promise.allSettled(
      providers.map(async provider => ({
        provider: provider.name,
        suggestions: await provider.analyzeSymptomsAsync(symptoms, patientHistory)
      }))
    );
    
    // Filtra apenas resultados bem-sucedidos
    const successfulResults = providerResults
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value);
    
    if (successfulResults.length === 0) {
      throw new Error('All AI providers failed to analyze symptoms');
    }
    
    // Calcula consenso
    const consensusSuggestions = this.calculateConsensus(successfulResults);
    
    return {
      suggestions: consensusSuggestions,
      confidence: this.calculateConsensusConfidence(consensusSuggestions, successfulResults.length),
      analysisMethod: 'consensus',
      providersUsed: successfulResults.map(r => r.provider),
      processingTime: Date.now() - startTime
    };
  }
  
  private calculateConsensus(results: Array<{ provider: string; suggestions: DiagnosisSuggestion[] }>): DiagnosisSuggestion[] {
    const conditionCounts = new Map<string, {
      count: number;
      totalConfidence: number;
      reasoning: string[];
      severity: string[];
      actions: string[];
    }>();
    
    // Conta ocorrências de cada condição
    results.forEach(result => {
      result.suggestions.forEach(suggestion => {
        const existing = conditionCounts.get(suggestion.condition) || {
          count: 0,
          totalConfidence: 0,
          reasoning: [],
          severity: [],
          actions: []
        };
        
        existing.count++;
        existing.totalConfidence += suggestion.confidence;
        existing.reasoning.push(suggestion.reasoning);
        existing.severity.push(suggestion.severity);
        existing.actions.push(...suggestion.recommendedActions);
        
        conditionCounts.set(suggestion.condition, existing);
      });
    });
    
    // Filtra condições com consenso mínimo
    const totalProviders = results.length;
    const consensusThreshold = Math.ceil(totalProviders * this.minimumAgreement);
    
    return Array.from(conditionCounts.entries())
      .filter(([_, data]) => data.count >= consensusThreshold)
      .map(([condition, data]) => ({
        condition,
        confidence: data.totalConfidence / data.count,
        reasoning: `Consensus from ${data.count}/${totalProviders} providers: ${data.reasoning.join('; ')}`,
        severity: this.getMostFrequentSeverity(data.severity) as any,
        recommendedActions: [...new Set(data.actions)]
      }))
      .sort((a, b) => b.confidence - a.confidence);
  }
  
  private getMostFrequentSeverity(severities: string[]): string {
    const counts = severities.reduce((acc, severity) => {
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)[0][0];
  }
  
  private calculateConsensusConfidence(suggestions: DiagnosisSuggestion[], providerCount: number): number {
    if (suggestions.length === 0) return 0;
    
    const baseConfidence = suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length;
    const consensusBonus = Math.min(providerCount / 3, 0.2); // Máximo 20% de bônus
    
    return Math.min(baseConfidence + consensusBonus, 1.0);
  }
  
  private buildPatientHistory(profile: PatientProfile): string {
    return `Age: ${profile.age}, Gender: ${profile.gender}, Allergies: ${profile.allergies.join(', ')}, Current Medications: ${profile.currentMedications.join(', ')}, Chronic Conditions: ${profile.chronicConditions.join(', ')}`;
  }
}

/**
 * Estratégia de fallback - tenta provedores em sequência até obter sucesso
 * Complexidade: O(n) no pior caso, onde n é o número de provedores
 */
export class FallbackStrategy implements IAIAnalysisStrategy {
  async analyze(
    symptoms: string[],
    patientProfile: PatientProfile,
    providers: IAIProvider[]
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    const patientHistory = this.buildPatientHistory(patientProfile);
    
    let lastError: Error | null = null;
    
    for (const provider of providers) {
      try {
        const suggestions = await provider.analyzeSymptomsAsync(symptoms, patientHistory);
        
        return {
          suggestions,
          confidence: this.calculateAverageConfidence(suggestions),
          analysisMethod: 'fallback',
          providersUsed: [provider.name],
          processingTime: Date.now() - startTime
        };
      } catch (error) {
        lastError = error as Error;
        console.warn(`Provider ${provider.name} failed:`, error);
        continue;
      }
    }
    
    throw new Error(`All providers failed. Last error: ${lastError?.message}`);
  }
  
  private buildPatientHistory(profile: PatientProfile): string {
    return `Age: ${profile.age}, Gender: ${profile.gender}, Allergies: ${profile.allergies.join(', ')}, Current Medications: ${profile.currentMedications.join(', ')}, Chronic Conditions: ${profile.chronicConditions.join(', ')}`;
  }
  
  private calculateAverageConfidence(suggestions: DiagnosisSuggestion[]): number {
    if (suggestions.length === 0) return 0;
    return suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length;
  }
}