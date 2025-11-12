// VITAIA LLM Integration - Multi-Provider Support
// This file maintains backward compatibility while adding support for multiple AI providers

import {
  invokeAI,
  invokeOpenAI,
  invokeGemini,
  invokeDeepSeek,
  invokeMultiProvider,
  checkProviderHealth,
  type AIProvider,
  type InvokeParams as AIInvokeParams,
  type InvokeResult as AIInvokeResult,
  type Message,
  type Tool,
  type ToolChoice,
  type OutputSchema,
  type ResponseFormat,
  type Role,
  type TextContent,
  type ImageContent,
  type FileContent,
  type MessageContent,
  type ToolCall,
  type JsonSchema,
} from "./aiProviders";

// Re-export types for backward compatibility
export type {
  Role,
  TextContent,
  ImageContent,
  FileContent,
  MessageContent,
  Message,
  Tool,
  ToolChoice,
  OutputSchema,
  ResponseFormat,
  ToolCall,
  JsonSchema,
  AIProvider,
};

// Legacy InvokeParams type (for backward compatibility)
export type InvokeParams = AIInvokeParams;

// Enhanced InvokeResult with provider info
export type InvokeResult = AIInvokeResult;

// Legacy function for backward compatibility
export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  // Use the new multi-provider system with Gemini as default (maintaining current behavior)
  return invokeAI({ ...params, provider: "gemini" });
}

// Enhanced medical AI functions with multi-provider support
export async function invokeMedicalAI(params: {
  messages: Message[];
  specialty?: string;
  provider?: AIProvider;
  useMultiProvider?: boolean;
  temperature?: number;
}): Promise<InvokeResult | InvokeResult[]> {
  const { messages, specialty, provider, useMultiProvider, temperature } =
    params;

  // Add medical context to system message
  const enhancedMessages: Message[] = [
    {
      role: "system",
      content: `You are VITAIA, a specialized medical AI assistant designed to support healthcare professionals. 
${specialty ? `You are currently operating in the context of ${specialty}.` : ""}

IMPORTANT GUIDELINES:
- Provide evidence-based medical information
- Always emphasize that your suggestions are for physician review only
- Never replace clinical judgment or direct patient care
- Follow medical ethics and patient safety protocols
- Cite relevant medical guidelines when possible
- Be precise with medical terminology
- Consider differential diagnoses appropriately

Your responses should be professional, accurate, and helpful for clinical decision-making.`,
    },
    ...messages,
  ];

  const invokeParams: InvokeParams = {
    messages: enhancedMessages,
    temperature: temperature ?? 0.3, // Lower temperature for medical accuracy
    maxTokens: 4096,
  };

  if (useMultiProvider) {
    const providers: AIProvider[] = ["gemini", "openai", "deepseek"];
    return invokeMultiProvider(invokeParams, providers);
  }

  return invokeAI({ ...invokeParams, provider });
}

// Specialized medical functions
export async function generateDifferentialDiagnosis(params: {
  symptoms: string;
  examResults?: string;
  medicalHistory?: string;
  specialty?: string;
  provider?: AIProvider;
}): Promise<InvokeResult> {
  const { symptoms, examResults, medicalHistory, specialty, provider } = params;

  const prompt = `Analyze the following patient presentation and provide a differential diagnosis:

PATIENT PRESENTATION:
Symptoms: ${symptoms}
${examResults ? `Exam Results: ${examResults}` : ""}
${medicalHistory ? `Medical History: ${medicalHistory}` : ""}
${specialty ? `Specialty Context: ${specialty}` : ""}

Please provide:
1. TOP 5 DIFFERENTIAL DIAGNOSES (ranked by likelihood)
2. KEY CLINICAL FEATURES supporting each diagnosis
3. RECOMMENDED DIAGNOSTIC TESTS to confirm/rule out
4. RED FLAGS or urgent considerations
5. NEXT STEPS in clinical evaluation

Format your response clearly with numbered sections.`;

  return invokeMedicalAI({
    messages: [{ role: "user", content: prompt }],
    specialty,
    provider,
    temperature: 0.2, // Very low temperature for diagnostic accuracy
  }) as Promise<InvokeResult>;
}

export async function generateTreatmentPlan(params: {
  diagnosis: string;
  patientProfile: string;
  specialty?: string;
  provider?: AIProvider;
}): Promise<InvokeResult> {
  const { diagnosis, patientProfile, specialty, provider } = params;

  const prompt = `Generate a comprehensive treatment plan for the following:

DIAGNOSIS: ${diagnosis}
PATIENT PROFILE: ${patientProfile}
${specialty ? `SPECIALTY: ${specialty}` : ""}

Please provide:
1. IMMEDIATE TREATMENT PRIORITIES
2. PHARMACOLOGICAL INTERVENTIONS (with dosing considerations)
3. NON-PHARMACOLOGICAL INTERVENTIONS
4. MONITORING PARAMETERS
5. FOLLOW-UP SCHEDULE
6. PATIENT EDUCATION POINTS
7. POTENTIAL COMPLICATIONS to watch for

Ensure all recommendations follow current clinical guidelines.`;

  return invokeMedicalAI({
    messages: [{ role: "user", content: prompt }],
    specialty,
    provider,
    temperature: 0.3,
  }) as Promise<InvokeResult>;
}

export async function analyzeLabResults(params: {
  labResults: string;
  clinicalContext: string;
  provider?: AIProvider;
}): Promise<InvokeResult> {
  const { labResults, clinicalContext, provider } = params;

  const prompt = `Analyze the following laboratory results in the given clinical context:

LABORATORY RESULTS:
${labResults}

CLINICAL CONTEXT:
${clinicalContext}

Please provide:
1. ABNORMAL VALUES IDENTIFIED
2. CLINICAL SIGNIFICANCE of each abnormality
3. POSSIBLE CAUSES/CONDITIONS suggested
4. RECOMMENDED FOLLOW-UP TESTS
5. CLINICAL CORRELATION needed
6. URGENT FINDINGS requiring immediate attention

Provide reference ranges where relevant and explain the clinical implications.`;

  return invokeMedicalAI({
    messages: [{ role: "user", content: prompt }],
    provider,
    temperature: 0.2,
  }) as Promise<InvokeResult>;
}

// Provider health monitoring for medical reliability
export async function checkMedicalAIHealth(): Promise<{
  providers: Record<AIProvider, boolean>;
  recommendation: string;
}> {
  const health = await checkProviderHealth();

  const activeProviders = Object.entries(health)
    .filter(([_, isHealthy]) => isHealthy)
    .map(([provider, _]) => provider);

  let recommendation = "";
  if (activeProviders.length === 0) {
    recommendation =
      "CRITICAL: No AI providers available. Medical AI features disabled.";
  } else if (activeProviders.length === 1) {
    recommendation = `WARNING: Only ${activeProviders[0]} available. Consider enabling backup providers.`;
  } else {
    recommendation = `HEALTHY: ${activeProviders.length} providers available (${activeProviders.join(", ")}).`;
  }

  return {
    providers: health,
    recommendation,
  };
}

// Multi-provider consensus for critical medical decisions
export async function getMedicalConsensus(params: {
  messages: Message[];
  specialty?: string;
  providers?: AIProvider[];
}): Promise<{
  results: InvokeResult[];
  consensus: string;
  confidence: number;
}> {
  const {
    messages,
    specialty,
    providers = ["gemini", "openai", "deepseek"],
  } = params;

  const results = (await invokeMedicalAI({
    messages,
    specialty,
    useMultiProvider: true,
  })) as InvokeResult[];

  // Analyze consensus (simplified implementation)
  const responses = results.map(r =>
    typeof r.choices[0]?.message?.content === "string"
      ? r.choices[0].message.content
      : ""
  );

  const consensus = `MULTI-PROVIDER ANALYSIS:

${results
  .map(
    (result, index) =>
      `${result.provider.toUpperCase()} RESPONSE:\n${responses[index]}\n`
  )
  .join("\n---\n\n")}

CONSENSUS SUMMARY:
Multiple AI providers have analyzed this case. Please review all responses and use your clinical judgment to synthesize the information. Look for common themes and consider any significant differences between providers.`;

  const confidence =
    results.length > 0 ? (results.length / providers.length) * 100 : 0;

  return {
    results,
    consensus,
    confidence,
  };
}

// Export provider-specific functions for advanced use cases
export {
  invokeAI,
  invokeOpenAI,
  invokeGemini,
  invokeDeepSeek,
  invokeMultiProvider,
  checkProviderHealth,
};
