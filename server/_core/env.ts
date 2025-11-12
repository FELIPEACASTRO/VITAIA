// VITAIA Environment Configuration
// Configure these variables in .env file
export const ENV = {
  // Application Configuration
  appId: process.env.VITE_APP_ID ?? "vitaia-medical-ai",
  cookieSecret:
    process.env.JWT_SECRET ?? "vitaia-jwt-secret-change-in-production",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
  port: parseInt(process.env.PORT ?? "5000"),
  host: process.env.HOST ?? "0.0.0.0",

  // Security Configuration
  enableRateLimit: process.env.ENABLE_RATE_LIMIT !== "false",
  enableSecurityHeaders: process.env.ENABLE_SECURITY_HEADERS !== "false",
  enableAuditLog: process.env.ENABLE_AUDIT_LOG !== "false",
  enableEncryption: process.env.ENABLE_ENCRYPTION === "true",

  // Legacy support (maintained for compatibility)
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",

  // Multi-Provider AI Configuration
  // OpenAI/ChatGPT
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiApiUrl: process.env.OPENAI_API_URL ?? "https://api.openai.com/v1",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o",

  // Google Gemini
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiApiUrl:
    process.env.GEMINI_API_URL ??
    "https://generativelanguage.googleapis.com/v1beta",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.0-flash-exp",

  // DeepSeek
  deepseekApiKey: process.env.DEEPSEEK_API_KEY ?? "",
  deepseekApiUrl: process.env.DEEPSEEK_API_URL ?? "https://api.deepseek.com/v1",
  deepseekModel: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",

  // AI Provider Selection
  defaultAiProvider: (process.env.DEFAULT_AI_PROVIDER ?? "gemini") as
    | "gemini"
    | "openai"
    | "deepseek",
  enableMultiProvider: process.env.ENABLE_MULTI_PROVIDER !== "false",
  aiTimeout: parseInt(process.env.AI_TIMEOUT ?? "30000"), // 30 seconds
  aiMaxTokens: parseInt(process.env.AI_MAX_TOKENS ?? "4096"),
  aiTemperature: parseFloat(process.env.AI_TEMPERATURE ?? "0.3"),

  // Medical AI Configuration
  enableMedicalValidation: process.env.ENABLE_MEDICAL_VALIDATION !== "false",
  enableClinicalGuidelines: process.env.ENABLE_CLINICAL_GUIDELINES !== "false",
  enableDrugInteractionCheck:
    process.env.ENABLE_DRUG_INTERACTION_CHECK === "true",

  // Logging Configuration
  logLevel: process.env.LOG_LEVEL ?? "info",
  enableDebugLogs: process.env.ENABLE_DEBUG_LOGS === "true",
};

// Validation function to check required environment variables
export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required variables
  if (!ENV.databaseUrl) {
    errors.push("DATABASE_URL is required");
  }

  // Check AI provider configuration
  const hasOpenAI = !!ENV.openaiApiKey;
  const hasGemini = !!ENV.geminiApiKey;
  const hasDeepSeek = !!ENV.deepseekApiKey;

  if (!hasOpenAI && !hasGemini && !hasDeepSeek) {
    errors.push(
      "At least one AI provider API key is required (OPENAI_API_KEY, GEMINI_API_KEY, or DEEPSEEK_API_KEY)"
    );
  }

  // Check default provider is configured
  if (ENV.defaultAiProvider === "openai" && !hasOpenAI) {
    errors.push(
      "DEFAULT_AI_PROVIDER is set to 'openai' but OPENAI_API_KEY is not configured"
    );
  }
  if (ENV.defaultAiProvider === "gemini" && !hasGemini) {
    errors.push(
      "DEFAULT_AI_PROVIDER is set to 'gemini' but GEMINI_API_KEY is not configured"
    );
  }
  if (ENV.defaultAiProvider === "deepseek" && !hasDeepSeek) {
    errors.push(
      "DEFAULT_AI_PROVIDER is set to 'deepseek' but DEEPSEEK_API_KEY is not configured"
    );
  }

  // Production-specific checks
  if (ENV.isProduction) {
    if (ENV.cookieSecret === "vitaia-jwt-secret-change-in-production") {
      errors.push("JWT_SECRET must be changed in production");
    }
    if (!ENV.enableSecurityHeaders) {
      errors.push("Security headers should be enabled in production");
    }
    if (!ENV.enableRateLimit) {
      errors.push("Rate limiting should be enabled in production");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Initialize environment validation
const validation = validateEnvironment();
if (!validation.isValid) {
  console.error("❌ Environment validation failed:");
  validation.errors.forEach(error => console.error(`  - ${error}`));

  if (ENV.isProduction) {
    console.error("Exiting due to environment validation errors in production");
    process.exit(1);
  } else {
    console.warn(
      "⚠️  Continuing with environment validation warnings in development"
    );
  }
} else {
  console.log("✅ Environment validation passed");
}
