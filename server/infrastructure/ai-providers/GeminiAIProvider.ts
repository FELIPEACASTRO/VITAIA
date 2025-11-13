import { IAIProvider, DiagnosisSuggestion, PatientProfile, TreatmentPlan, ProviderHealthStatus } from '../../domain/interfaces/IAIProvider';

/**
 * Implementação do provedor Google Gemini seguindo Strategy Pattern
 * Implementa Interface Segregation Principle
 * 
 * Complexidade de análise: O(n) onde n é o tamanho do input
 * Complexidade de resposta: O(m) onde m é o tamanho da resposta
 */
export class GeminiAIProvider implements IAIProvider {
  public readonly name = 'gemini';
  public readonly version = '2.0-flash';
  
  private readonly apiKey: string;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private readonly model = 'gemini-2.0-flash-exp';
  
  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.apiKey = apiKey;
  }
  
  /**
   * Analisa sintomas usando Google Gemini
   * Complexidade: O(n) onde n é o número de sintomas
   */
  async analyzeSymptomsAsync(symptoms: string[], patientHistory?: string): Promise<DiagnosisSuggestion[]> {
    try {
      const prompt = this.buildAnalysisPrompt(symptoms, patientHistory);
      const response = await this.callGeminiAPI(prompt);
      
      return this.parseAnalysisResponse(response);
    } catch (error) {
      console.error('Gemini analysis error:', error);
      throw new Error(`Gemini analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Gera plano de tratamento usando Gemini
   */
  async generateTreatmentPlan(diagnosis: string, patientProfile: PatientProfile): Promise<TreatmentPlan> {
    try {
      const prompt = this.buildTreatmentPrompt(diagnosis, patientProfile);
      const response = await this.callGeminiAPI(prompt);
      
      return this.parseTreatmentResponse(response);
    } catch (error) {
      console.error('Gemini treatment plan error:', error);
      throw new Error(`Gemini treatment plan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Verifica saúde do provedor Gemini
   * Complexidade: O(1)
   */
  async healthCheck(): Promise<ProviderHealthStatus> {
    const startTime = Date.now();
    
    try {
      const testPrompt = 'Responda apenas "OK" se você está funcionando corretamente.';
      const response = await this.callGeminiAPI(testPrompt);
      
      const responseTime = Date.now() - startTime;
      const isHealthy = response.toLowerCase().includes('ok');
      
      return {
        isAvailable: isHealthy,
        responseTime,
        lastChecked: new Date(),
        errorRate: 0
      };
    } catch (error) {
      return {
        isAvailable: false,
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        errorRate: 1
      };
    }
  }
  
  /**
   * Constrói prompt para análise de sintomas
   */
  private buildAnalysisPrompt(symptoms: string[], patientHistory?: string): string {
    const symptomsText = symptoms.join(', ');
    const historyText = patientHistory || 'Não informado';
    
    return `
Como um assistente médico de IA especializado, analise os seguintes sintomas e forneça sugestões de diagnóstico diferencial.

SINTOMAS: ${symptomsText}
HISTÓRICO DO PACIENTE: ${historyText}

Por favor, forneça sua análise no seguinte formato JSON:
{
  "suggestions": [
    {
      "condition": "Nome da condição",
      "confidence": 0.85,
      "reasoning": "Explicação detalhada do raciocínio clínico",
      "severity": "medium",
      "recommendedActions": ["Ação 1", "Ação 2", "Ação 3"]
    }
  ]
}

DIRETRIZES:
- Forneça entre 3-5 sugestões de diagnóstico diferencial
- Confidence deve ser um valor entre 0 e 1
- Severity pode ser: "low", "medium", "high", "critical"
- Inclua raciocínio clínico detalhado
- Sugira ações específicas para cada condição
- Considere o histórico médico do paciente
- Priorize condições mais prováveis baseadas nos sintomas
- IMPORTANTE: Esta é uma ferramenta de auxílio. Sempre recomende avaliação médica profissional.

Responda APENAS com o JSON válido, sem texto adicional.
`;
  }
  
  /**
   * Constrói prompt para plano de tratamento
   */
  private buildTreatmentPrompt(diagnosis: string, patientProfile: PatientProfile): string {
    return `
Como um assistente médico de IA, gere um plano de tratamento para o seguinte diagnóstico:

DIAGNÓSTICO: ${diagnosis}
PERFIL DO PACIENTE:
- Idade: ${patientProfile.age} anos
- Gênero: ${patientProfile.gender}
- Alergias: ${patientProfile.allergies.join(', ') || 'Nenhuma'}
- Medicações atuais: ${patientProfile.currentMedications.join(', ') || 'Nenhuma'}
- Condições crônicas: ${patientProfile.chronicConditions.join(', ') || 'Nenhuma'}

Forneça o plano de tratamento no seguinte formato JSON:
{
  "primaryTreatment": "Tratamento principal recomendado",
  "alternativeTreatments": ["Alternativa 1", "Alternativa 2"],
  "medications": [
    {
      "name": "Nome do medicamento",
      "dosage": "Dosagem",
      "frequency": "Frequência",
      "duration": "Duração",
      "warnings": ["Aviso 1", "Aviso 2"]
    }
  ],
  "followUpInstructions": "Instruções de acompanhamento",
  "estimatedRecoveryTime": "Tempo estimado de recuperação"
}

DIRETRIZES:
- Considere alergias e medicações atuais do paciente
- Forneça alternativas de tratamento
- Inclua medicações com dosagens específicas
- Adicione avisos importantes sobre medicações
- Considere a idade do paciente nas recomendações
- IMPORTANTE: Este é um auxílio. Sempre requer supervisão médica.

Responda APENAS com o JSON válido, sem texto adicional.
`;
  }
  
  /**
   * Chama a API do Gemini
   * Complexidade: O(1) - chamada HTTP
   */
  private async callGeminiAPI(prompt: string): Promise<string> {
    const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
    
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.3, // Baixa temperatura para respostas mais consistentes
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }
    
    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }
    
    const content = data.candidates[0].content;
    if (!content || !content.parts || content.parts.length === 0) {
      throw new Error('Invalid response format from Gemini API');
    }
    
    return content.parts[0].text;
  }
  
  /**
   * Parseia resposta de análise de sintomas
   * Complexidade: O(n) onde n é o número de sugestões
   */
  private parseAnalysisResponse(response: string): DiagnosisSuggestion[] {
    try {
      // Limpa a resposta removendo possíveis marcadores de código
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanResponse);
      
      if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
        throw new Error('Invalid response format: missing suggestions array');
      }
      
      return parsed.suggestions.map((suggestion: any) => ({
        condition: suggestion.condition || 'Condição não especificada',
        confidence: Math.max(0, Math.min(1, suggestion.confidence || 0.5)),
        reasoning: suggestion.reasoning || 'Raciocínio não fornecido',
        severity: this.validateSeverity(suggestion.severity),
        recommendedActions: Array.isArray(suggestion.recommendedActions) 
          ? suggestion.recommendedActions 
          : ['Consultar médico especialista']
      }));
    } catch (error) {
      console.error('Error parsing Gemini analysis response:', error);
      
      // Fallback: retorna sugestão genérica
      return [{
        condition: 'Avaliação médica necessária',
        confidence: 0.5,
        reasoning: 'Não foi possível processar a resposta da IA. Recomenda-se avaliação médica profissional.',
        severity: 'medium',
        recommendedActions: ['Consultar médico clínico geral', 'Monitorar sintomas']
      }];
    }
  }
  
  /**
   * Parseia resposta de plano de tratamento
   */
  private parseTreatmentResponse(response: string): TreatmentPlan {
    try {
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanResponse);
      
      return {
        primaryTreatment: parsed.primaryTreatment || 'Consultar médico especialista',
        alternativeTreatments: Array.isArray(parsed.alternativeTreatments) 
          ? parsed.alternativeTreatments 
          : [],
        medications: Array.isArray(parsed.medications) 
          ? parsed.medications.map((med: any) => ({
              name: med.name || 'Medicação não especificada',
              dosage: med.dosage || 'Conforme prescrição médica',
              frequency: med.frequency || 'Conforme orientação médica',
              duration: med.duration || 'Conforme orientação médica',
              warnings: Array.isArray(med.warnings) ? med.warnings : []
            }))
          : [],
        followUpInstructions: parsed.followUpInstructions || 'Acompanhar com médico especialista',
        estimatedRecoveryTime: parsed.estimatedRecoveryTime || 'Variável conforme caso'
      };
    } catch (error) {
      console.error('Error parsing Gemini treatment response:', error);
      
      // Fallback: retorna plano genérico
      return {
        primaryTreatment: 'Consultar médico especialista para avaliação e tratamento adequado',
        alternativeTreatments: [],
        medications: [],
        followUpInstructions: 'Agendar consulta médica para avaliação detalhada',
        estimatedRecoveryTime: 'Variável conforme diagnóstico e tratamento'
      };
    }
  }
  
  /**
   * Valida e normaliza severidade
   */
  private validateSeverity(severity: string): 'low' | 'medium' | 'high' | 'critical' {
    const validSeverities: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
    return validSeverities.includes(severity as any) ? severity as any : 'medium';
  }
}