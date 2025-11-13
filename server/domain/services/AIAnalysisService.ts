/**
 * Strategy Pattern for AI Analysis
 * 
 * Complexity Analysis:
 * - analyze: O(1) for API calls, O(n) for processing results
 * - multiProviderAnalysis: O(k) where k is number of providers
 * - consensusAnalysis: O(k * log k) for sorting and consensus
 * 
 * Design Patterns Used:
 * - Strategy Pattern: Different AI providers
 * - Factory Pattern: Provider creation
 * - Chain of Responsibility: Fallback mechanism
 * - Observer Pattern: Event notifications
 */

import { Patient } from "../entities/Patient";

export interface AnalysisResult {
  diagnosis: string[];
  confidence: number;
  recommendations: string[];
  riskAssessment: "low" | "medium" | "high";
  provider: string;
  timestamp: Date;
  processingTime: number;
}

export interface ConsensusResult {
  finalDiagnosis: string[];
  averageConfidence: number;
  consensusRecommendations: string[];
  providerResults: AnalysisResult[];
  consensusScore: number;
}

// Strategy Interface
export interface IAIProvider {
  getName(): string;
  isAvailable(): Promise<boolean>;
  analyze(patient: Patient, symptoms: string[]): Promise<AnalysisResult>;
  getCapabilities(): string[];
  getMaxTokens(): number;
  getCostPerRequest(): number;
}

// Abstract Strategy Base Class
export abstract class BaseAIProvider implements IAIProvider {
  protected readonly name: string;
  protected readonly apiKey: string;
  protected readonly baseUrl: string;

  constructor(name: string, apiKey: string, baseUrl: string) {
    this.name = name;
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  getName(): string {
    return this.name;
  }

  abstract isAvailable(): Promise<boolean>;
  abstract analyze(patient: Patient, symptoms: string[]): Promise<AnalysisResult>;
  abstract getCapabilities(): string[];
  abstract getMaxTokens(): number;
  abstract getCostPerRequest(): number;

  protected buildPrompt(patient: Patient, symptoms: string[]): string {
    const medicalRecord = patient.getMedicalRecord();
    const vitalSigns = patient.getVitalSigns();

    return `
      Paciente: ${patient.getName()}, ${patient.getAge()} anos, ${patient.getGender()}
      
      Histórico Médico:
      - Condições: ${medicalRecord.getConditions().join(", ") || "Nenhuma"}
      - Alergias: ${medicalRecord.getAllergies().join(", ") || "Nenhuma"}
      - Medicações: ${medicalRecord.getMedications().join(", ") || "Nenhuma"}
      
      Sinais Vitais:
      ${vitalSigns ? `
      - Frequência Cardíaca: ${vitalSigns.getHeartRate()} bpm
      - Pressão Arterial: ${vitalSigns.getBloodPressure()}
      - Temperatura: ${vitalSigns.getTemperature()}°C
      - Saturação O2: ${vitalSigns.getOxygenSaturation()}%
      ` : "- Não disponível"}
      
      Sintomas Atuais: ${symptoms.join(", ")}
      
      Por favor, forneça:
      1. Possíveis diagnósticos diferenciais
      2. Nível de confiança (0-1)
      3. Recomendações de tratamento
      4. Avaliação de risco (low/medium/high)
    `;
  }

  protected parseResponse(response: string): Partial<AnalysisResult> {
    // Basic parsing logic - can be enhanced with more sophisticated NLP
    const lines = response.split('\n').filter(line => line.trim());
    
    const diagnosis: string[] = [];
    const recommendations: string[] = [];
    let confidence = 0.5;
    let riskAssessment: "low" | "medium" | "high" = "medium";

    for (const line of lines) {
      if (line.toLowerCase().includes('diagnóstico') || line.toLowerCase().includes('diagnosis')) {
        diagnosis.push(line.replace(/^\d+\.?\s*/, '').trim());
      } else if (line.toLowerCase().includes('recomenda') || line.toLowerCase().includes('tratamento')) {
        recommendations.push(line.replace(/^\d+\.?\s*/, '').trim());
      } else if (line.toLowerCase().includes('confiança') || line.toLowerCase().includes('confidence')) {
        const match = line.match(/(\d+\.?\d*)/);
        if (match) {
          confidence = Math.min(1, Math.max(0, parseFloat(match[1])));
        }
      } else if (line.toLowerCase().includes('risco')) {
        if (line.toLowerCase().includes('alto') || line.toLowerCase().includes('high')) {
          riskAssessment = "high";
        } else if (line.toLowerCase().includes('baixo') || line.toLowerCase().includes('low')) {
          riskAssessment = "low";
        }
      }
    }

    return { diagnosis, recommendations, confidence, riskAssessment };
  }
}

// Concrete Strategy - OpenAI Provider
export class OpenAIProvider extends BaseAIProvider {
  constructor(apiKey: string) {
    super("OpenAI", apiKey, "https://api.openai.com/v1");
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { "Authorization": `Bearer ${this.apiKey}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async analyze(patient: Patient, symptoms: string[]): Promise<AnalysisResult> {
    const startTime = Date.now();
    const prompt = this.buildPrompt(patient, symptoms);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1000,
          temperature: 0.3
        })
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content || "";
      const parsed = this.parseResponse(content);

      return {
        diagnosis: parsed.diagnosis || [],
        confidence: parsed.confidence || 0.5,
        recommendations: parsed.recommendations || [],
        riskAssessment: parsed.riskAssessment || "medium",
        provider: this.name,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      throw new Error(`OpenAI analysis failed: ${error}`);
    }
  }

  getCapabilities(): string[] {
    return ["diagnosis", "treatment", "risk-assessment", "drug-interactions"];
  }

  getMaxTokens(): number {
    return 8192;
  }

  getCostPerRequest(): number {
    return 0.03; // USD per 1K tokens
  }
}

// Concrete Strategy - Gemini Provider
export class GeminiProvider extends BaseAIProvider {
  constructor(apiKey: string) {
    super("Gemini", apiKey, "https://generativelanguage.googleapis.com/v1beta");
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models?key=${this.apiKey}`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async analyze(patient: Patient, symptoms: string[]): Promise<AnalysisResult> {
    const startTime = Date.now();
    const prompt = this.buildPrompt(patient, symptoms);

    try {
      const response = await fetch(`${this.baseUrl}/models/gemini-pro:generateContent?key=${this.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1000
          }
        })
      });

      const data = await response.json();
      const content = data.candidates[0]?.content?.parts[0]?.text || "";
      const parsed = this.parseResponse(content);

      return {
        diagnosis: parsed.diagnosis || [],
        confidence: parsed.confidence || 0.5,
        recommendations: parsed.recommendations || [],
        riskAssessment: parsed.riskAssessment || "medium",
        provider: this.name,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      throw new Error(`Gemini analysis failed: ${error}`);
    }
  }

  getCapabilities(): string[] {
    return ["diagnosis", "treatment", "risk-assessment", "medical-imaging"];
  }

  getMaxTokens(): number {
    return 32768;
  }

  getCostPerRequest(): number {
    return 0.0005; // USD per 1K tokens
  }
}

// Factory Pattern for Provider Creation
export class AIProviderFactory {
  private static providers = new Map<string, new (apiKey: string) => IAIProvider>();

  static registerProvider(name: string, providerClass: new (apiKey: string) => IAIProvider): void {
    this.providers.set(name.toLowerCase(), providerClass);
  }

  static createProvider(name: string, apiKey: string): IAIProvider {
    const ProviderClass = this.providers.get(name.toLowerCase());
    if (!ProviderClass) {
      throw new Error(`Unknown AI provider: ${name}`);
    }
    return new ProviderClass(apiKey);
  }

  static getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

// Register providers
AIProviderFactory.registerProvider("openai", OpenAIProvider);
AIProviderFactory.registerProvider("gemini", GeminiProvider);

// Context Class for Strategy Pattern
export class AIAnalysisService {
  private providers: IAIProvider[] = [];
  private fallbackChain: IAIProvider[] = [];

  constructor(providers: IAIProvider[]) {
    this.providers = providers;
    this.buildFallbackChain();
  }

  private async buildFallbackChain(): Promise<void> {
    // O(n) where n is number of providers
    this.fallbackChain = [];
    for (const provider of this.providers) {
      if (await provider.isAvailable()) {
        this.fallbackChain.push(provider);
      }
    }
    
    // Sort by cost (cheaper first) - O(n log n)
    this.fallbackChain.sort((a, b) => a.getCostPerRequest() - b.getCostPerRequest());
  }

  /**
   * Analyze with primary provider and fallback
   * @complexity O(k) where k is number of providers in fallback chain
   */
  async analyze(patient: Patient, symptoms: string[]): Promise<AnalysisResult> {
    await this.buildFallbackChain();

    for (const provider of this.fallbackChain) {
      try {
        return await provider.analyze(patient, symptoms);
      } catch (error) {
        console.warn(`Provider ${provider.getName()} failed:`, error);
        continue;
      }
    }

    throw new Error("All AI providers failed");
  }

  /**
   * Multi-provider analysis for consensus
   * @complexity O(k) where k is number of available providers
   */
  async multiProviderAnalysis(patient: Patient, symptoms: string[]): Promise<ConsensusResult> {
    await this.buildFallbackChain();
    
    const results: AnalysisResult[] = [];
    const promises = this.fallbackChain.map(async (provider) => {
      try {
        return await provider.analyze(patient, symptoms);
      } catch (error) {
        console.warn(`Provider ${provider.getName()} failed:`, error);
        return null;
      }
    });

    const settledResults = await Promise.allSettled(promises);
    
    for (const result of settledResults) {
      if (result.status === "fulfilled" && result.value) {
        results.push(result.value);
      }
    }

    if (results.length === 0) {
      throw new Error("No providers returned results");
    }

    return this.calculateConsensus(results);
  }

  /**
   * Calculate consensus from multiple results
   * @complexity O(k * m * log m) where k is providers, m is diagnoses per provider
   */
  private calculateConsensus(results: AnalysisResult[]): ConsensusResult {
    // Aggregate diagnoses with frequency counting - O(k * m)
    const diagnosisCount = new Map<string, number>();
    const recommendationCount = new Map<string, number>();
    
    for (const result of results) {
      for (const diagnosis of result.diagnosis) {
        diagnosisCount.set(diagnosis, (diagnosisCount.get(diagnosis) || 0) + 1);
      }
      for (const recommendation of result.recommendations) {
        recommendationCount.set(recommendation, (recommendationCount.get(recommendation) || 0) + 1);
      }
    }

    // Sort by frequency - O(m log m)
    const finalDiagnosis = Array.from(diagnosisCount.entries())
      .sort((a, b) => b[1] - a[1])
      .filter(([_, count]) => count >= Math.ceil(results.length / 2))
      .map(([diagnosis]) => diagnosis);

    const consensusRecommendations = Array.from(recommendationCount.entries())
      .sort((a, b) => b[1] - a[1])
      .filter(([_, count]) => count >= Math.ceil(results.length / 2))
      .map(([recommendation]) => recommendation);

    // Calculate average confidence - O(k)
    const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    // Calculate consensus score based on agreement - O(k)
    const consensusScore = this.calculateConsensusScore(results);

    return {
      finalDiagnosis,
      averageConfidence,
      consensusRecommendations,
      providerResults: results,
      consensusScore
    };
  }

  /**
   * Calculate how much providers agree
   * @complexity O(k²) where k is number of providers
   */
  private calculateConsensusScore(results: AnalysisResult[]): number {
    if (results.length < 2) return 1.0;

    let totalAgreement = 0;
    let comparisons = 0;

    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        const agreement = this.calculateAgreement(results[i], results[j]);
        totalAgreement += agreement;
        comparisons++;
      }
    }

    return comparisons > 0 ? totalAgreement / comparisons : 0;
  }

  /**
   * Calculate agreement between two results
   * @complexity O(m) where m is number of diagnoses
   */
  private calculateAgreement(result1: AnalysisResult, result2: AnalysisResult): number {
    const set1 = new Set(result1.diagnosis);
    const set2 = new Set(result2.diagnosis);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    // Jaccard similarity
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Get provider statistics
   * @complexity O(k) where k is number of providers
   */
  async getProviderStats(): Promise<Array<{
    name: string;
    available: boolean;
    capabilities: string[];
    cost: number;
    maxTokens: number;
  }>> {
    const stats = [];
    
    for (const provider of this.providers) {
      stats.push({
        name: provider.getName(),
        available: await provider.isAvailable(),
        capabilities: provider.getCapabilities(),
        cost: provider.getCostPerRequest(),
        maxTokens: provider.getMaxTokens()
      });
    }

    return stats;
  }
}