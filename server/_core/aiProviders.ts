import { ENV } from "./env";

export type AIProvider = "openai" | "gemini" | "deepseek";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?:
      | "audio/mpeg"
      | "audio/wav"
      | "application/pdf"
      | "audio/mp4"
      | "video/mp4";
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  provider?: AIProvider; // Novo: especificar provedor
  temperature?: number;
  topP?: number;
  topK?: number;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  provider: AIProvider; // Novo: identificar provedor usado
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

// Provider configurations
const PROVIDER_CONFIGS = {
  openai: {
    baseUrl: ENV.openaiApiUrl,
    apiKey: ENV.openaiApiKey,
    models: {
      default: "gpt-4o",
      fast: "gpt-4o-mini",
      reasoning: "o1-preview",
    },
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
  },
  gemini: {
    baseUrl: ENV.geminiApiUrl,
    apiKey: ENV.geminiApiKey,
    models: {
      default: "gemini-2.0-flash-exp",
      fast: "gemini-1.5-flash",
      reasoning: "gemini-2.0-flash-thinking-exp",
    },
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    }),
  },
  deepseek: {
    baseUrl: ENV.deepseekApiUrl,
    apiKey: ENV.deepseekApiKey,
    models: {
      default: "deepseek-chat",
      fast: "deepseek-chat",
      reasoning: "deepseek-reasoner",
    },
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
  },
} as const;

// Utility functions
const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

// Provider-specific implementations
class OpenAIProvider {
  private config = PROVIDER_CONFIGS.openai;

  async invoke(params: InvokeParams): Promise<InvokeResult> {
    if (!this.config.apiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const {
      messages,
      tools,
      toolChoice,
      tool_choice,
      maxTokens,
      max_tokens,
      outputSchema,
      output_schema,
      responseFormat,
      response_format,
      temperature,
      topP,
    } = params;

    const payload: Record<string, unknown> = {
      model: this.config.models.default,
      messages: messages.map(normalizeMessage),
      temperature: temperature ?? 0.7,
      top_p: topP ?? 1,
      max_tokens: maxTokens || max_tokens || 4096,
    };

    if (tools && tools.length > 0) {
      payload.tools = tools;
    }

    const normalizedToolChoice = normalizeToolChoice(
      toolChoice || tool_choice,
      tools
    );
    if (normalizedToolChoice) {
      payload.tool_choice = normalizedToolChoice;
    }

    const normalizedResponseFormat = normalizeResponseFormat({
      responseFormat,
      response_format,
      outputSchema,
      output_schema,
    });

    if (normalizedResponseFormat) {
      payload.response_format = normalizedResponseFormat;
    }

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: this.config.headers(this.config.apiKey),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenAI API failed: ${response.status} ${response.statusText} – ${errorText}`
      );
    }

    const result = (await response.json()) as InvokeResult;
    result.provider = "openai";
    return result;
  }
}

class GeminiProvider {
  private config = PROVIDER_CONFIGS.gemini;

  async invoke(params: InvokeParams): Promise<InvokeResult> {
    if (!this.config.apiKey) {
      throw new Error("Gemini API key not configured");
    }

    const { messages, maxTokens, max_tokens, temperature, topP, topK } = params;

    // Convert messages to Gemini format
    const contents = messages.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [
        {
          text:
            typeof msg.content === "string"
              ? msg.content
              : JSON.stringify(msg.content),
        },
      ],
    }));

    const payload = {
      contents,
      generationConfig: {
        temperature: temperature ?? 0.7,
        topP: topP ?? 1,
        topK: topK ?? 40,
        maxOutputTokens: maxTokens || max_tokens || 4096,
      },
    };

    const response = await fetch(
      `${this.config.baseUrl}/models/${this.config.models.default}:generateContent?key=${this.config.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gemini API failed: ${response.status} ${response.statusText} – ${errorText}`
      );
    }

    const geminiResult = await response.json();

    // Convert Gemini response to standard format
    const result: InvokeResult = {
      id: `gemini-${Date.now()}`,
      created: Math.floor(Date.now() / 1000),
      model: this.config.models.default,
      provider: "gemini",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content:
              geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || "",
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: geminiResult.usageMetadata?.promptTokenCount || 0,
        completion_tokens:
          geminiResult.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: geminiResult.usageMetadata?.totalTokenCount || 0,
      },
    };

    return result;
  }
}

class DeepSeekProvider {
  private config = PROVIDER_CONFIGS.deepseek;

  async invoke(params: InvokeParams): Promise<InvokeResult> {
    if (!this.config.apiKey) {
      throw new Error("DeepSeek API key not configured");
    }

    const {
      messages,
      tools,
      toolChoice,
      tool_choice,
      maxTokens,
      max_tokens,
      outputSchema,
      output_schema,
      responseFormat,
      response_format,
      temperature,
      topP,
    } = params;

    const payload: Record<string, unknown> = {
      model: this.config.models.default,
      messages: messages.map(normalizeMessage),
      temperature: temperature ?? 0.7,
      top_p: topP ?? 1,
      max_tokens: maxTokens || max_tokens || 4096,
    };

    if (tools && tools.length > 0) {
      payload.tools = tools;
    }

    const normalizedToolChoice = normalizeToolChoice(
      toolChoice || tool_choice,
      tools
    );
    if (normalizedToolChoice) {
      payload.tool_choice = normalizedToolChoice;
    }

    const normalizedResponseFormat = normalizeResponseFormat({
      responseFormat,
      response_format,
      outputSchema,
      output_schema,
    });

    if (normalizedResponseFormat) {
      payload.response_format = normalizedResponseFormat;
    }

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: this.config.headers(this.config.apiKey),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `DeepSeek API failed: ${response.status} ${response.statusText} – ${errorText}`
      );
    }

    const result = (await response.json()) as InvokeResult;
    result.provider = "deepseek";
    return result;
  }
}

// Provider factory
const providers = {
  openai: new OpenAIProvider(),
  gemini: new GeminiProvider(),
  deepseek: new DeepSeekProvider(),
};

// Main function to invoke AI with multiple provider support
export async function invokeAI(params: InvokeParams): Promise<InvokeResult> {
  const provider = params.provider || (ENV.defaultAiProvider as AIProvider);

  if (!providers[provider]) {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  try {
    return await providers[provider].invoke(params);
  } catch (error) {
    console.error(`[AI Provider ${provider}] Error:`, error);

    // If multi-provider is enabled, try fallback
    if (ENV.enableMultiProvider && provider !== "gemini") {
      console.log(`[AI Provider] Falling back to Gemini...`);
      try {
        return await providers.gemini.invoke({ ...params, provider: "gemini" });
      } catch (fallbackError) {
        console.error(`[AI Provider] Fallback also failed:`, fallbackError);
        throw error; // Throw original error
      }
    }

    throw error;
  }
}

// Convenience functions for specific providers
export const invokeOpenAI = (params: Omit<InvokeParams, "provider">) =>
  invokeAI({ ...params, provider: "openai" });

export const invokeGemini = (params: Omit<InvokeParams, "provider">) =>
  invokeAI({ ...params, provider: "gemini" });

export const invokeDeepSeek = (params: Omit<InvokeParams, "provider">) =>
  invokeAI({ ...params, provider: "deepseek" });

// Multi-provider consensus (experimental)
export async function invokeMultiProvider(
  params: InvokeParams,
  providers: AIProvider[] = ["openai", "gemini", "deepseek"]
): Promise<InvokeResult[]> {
  const results = await Promise.allSettled(
    providers.map(provider => invokeAI({ ...params, provider }))
  );

  return results
    .filter(
      (result): result is PromiseFulfilledResult<InvokeResult> =>
        result.status === "fulfilled"
    )
    .map(result => result.value);
}

// Provider health check
export async function checkProviderHealth(): Promise<
  Record<AIProvider, boolean>
> {
  const healthChecks = await Promise.allSettled([
    invokeOpenAI({
      messages: [{ role: "user", content: "Hello" }],
      maxTokens: 10,
    })
      .then(() => true)
      .catch(() => false),

    invokeGemini({
      messages: [{ role: "user", content: "Hello" }],
      maxTokens: 10,
    })
      .then(() => true)
      .catch(() => false),

    invokeDeepSeek({
      messages: [{ role: "user", content: "Hello" }],
      maxTokens: 10,
    })
      .then(() => true)
      .catch(() => false),
  ]);

  return {
    openai:
      healthChecks[0].status === "fulfilled" ? healthChecks[0].value : false,
    gemini:
      healthChecks[1].status === "fulfilled" ? healthChecks[1].value : false,
    deepseek:
      healthChecks[2].status === "fulfilled" ? healthChecks[2].value : false,
  };
}
