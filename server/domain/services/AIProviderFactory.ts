import { IAIProvider } from '../interfaces/IAIProvider';

/**
 * Factory Pattern para criação de provedores de IA
 * Implementa Factory Method Pattern e Singleton Pattern
 * 
 * Complexidade de criação: O(1)
 * Complexidade de registro: O(1)
 */
export class AIProviderFactory {
  private static instance: AIProviderFactory;
  private providers: Map<string, () => IAIProvider> = new Map();
  
  private constructor() {}
  
  /**
   * Singleton Pattern - garante única instância
   */
  public static getInstance(): AIProviderFactory {
    if (!AIProviderFactory.instance) {
      AIProviderFactory.instance = new AIProviderFactory();
    }
    return AIProviderFactory.instance;
  }
  
  /**
   * Registra um provedor de IA
   * @param name Nome do provedor
   * @param factory Função factory para criar o provedor
   */
  public registerProvider(name: string, factory: () => IAIProvider): void {
    this.providers.set(name.toLowerCase(), factory);
  }
  
  /**
   * Cria instância de um provedor específico
   * @param name Nome do provedor
   * @returns Instância do provedor
   */
  public createProvider(name: string): IAIProvider {
    const factory = this.providers.get(name.toLowerCase());
    if (!factory) {
      throw new Error(`AI Provider '${name}' not found. Available providers: ${Array.from(this.providers.keys()).join(', ')}`);
    }
    return factory();
  }
  
  /**
   * Lista todos os provedores disponíveis
   */
  public getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
  
  /**
   * Verifica se um provedor está registrado
   */
  public hasProvider(name: string): boolean {
    return this.providers.has(name.toLowerCase());
  }
  
  /**
   * Remove um provedor registrado
   */
  public unregisterProvider(name: string): boolean {
    return this.providers.delete(name.toLowerCase());
  }
  
  /**
   * Limpa todos os provedores registrados
   */
  public clear(): void {
    this.providers.clear();
  }
}