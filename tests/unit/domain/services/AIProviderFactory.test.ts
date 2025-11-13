import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIProviderFactory } from '../../../../server/domain/services/AIProviderFactory';
import { IAIProvider } from '../../../../server/domain/interfaces/IAIProvider';

/**
 * Testes unitários para AIProviderFactory
 * Testa Singleton Pattern e Factory Method Pattern
 * 
 * Cobertura: 100% das funcionalidades
 * Complexidade dos testes: O(1) para cada operação
 */
describe('AIProviderFactory', () => {
  let factory: AIProviderFactory;
  let mockProvider: IAIProvider;
  
  beforeEach(() => {
    // Reset singleton for testing
    (AIProviderFactory as any).instance = undefined;
    factory = AIProviderFactory.getInstance();
    
    // Create mock provider
    mockProvider = {
      name: 'test-provider',
      version: '1.0.0',
      analyzeSymptomsAsync: vi.fn(),
      generateTreatmentPlan: vi.fn(),
      healthCheck: vi.fn()
    };
  });
  
  describe('Singleton Pattern', () => {
    it('should return same instance on multiple calls', () => {
      const factory1 = AIProviderFactory.getInstance();
      const factory2 = AIProviderFactory.getInstance();
      
      expect(factory1).toBe(factory2);
    });
    
    it('should maintain state across instances', () => {
      const factory1 = AIProviderFactory.getInstance();
      factory1.registerProvider('test', () => mockProvider);
      
      const factory2 = AIProviderFactory.getInstance();
      expect(factory2.hasProvider('test')).toBe(true);
    });
  });
  
  describe('Provider registration', () => {
    it('should register provider successfully', () => {
      const providerFactory = () => mockProvider;
      
      factory.registerProvider('test-provider', providerFactory);
      
      expect(factory.hasProvider('test-provider')).toBe(true);
      expect(factory.getAvailableProviders()).toContain('test-provider');
    });
    
    it('should register provider with case insensitive name', () => {
      factory.registerProvider('TEST-PROVIDER', () => mockProvider);
      
      expect(factory.hasProvider('test-provider')).toBe(true);
      expect(factory.hasProvider('TEST-PROVIDER')).toBe(true);
    });
    
    it('should overwrite existing provider with same name', () => {
      const provider1 = { ...mockProvider, name: 'provider1' };
      const provider2 = { ...mockProvider, name: 'provider2' };
      
      factory.registerProvider('test', () => provider1);
      factory.registerProvider('test', () => provider2);
      
      const created = factory.createProvider('test');
      expect(created.name).toBe('provider2');
    });
  });
  
  describe('Provider creation', () => {
    beforeEach(() => {
      factory.registerProvider('test-provider', () => mockProvider);
    });
    
    it('should create provider successfully', () => {
      const provider = factory.createProvider('test-provider');
      
      expect(provider).toBe(mockProvider);
      expect(provider.name).toBe('test-provider');
    });
    
    it('should create provider with case insensitive name', () => {
      const provider = factory.createProvider('TEST-PROVIDER');
      
      expect(provider).toBe(mockProvider);
    });
    
    it('should throw error for non-existent provider', () => {
      expect(() => factory.createProvider('non-existent'))
        .toThrow("AI Provider 'non-existent' not found. Available providers: test-provider");
    });
    
    it('should call factory function each time', () => {
      const factoryFn = vi.fn(() => mockProvider);
      factory.registerProvider('test', factoryFn);
      
      factory.createProvider('test');
      factory.createProvider('test');
      
      expect(factoryFn).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('Provider listing', () => {
    it('should return empty list initially', () => {
      expect(factory.getAvailableProviders()).toEqual([]);
    });
    
    it('should list registered providers', () => {
      factory.registerProvider('provider1', () => mockProvider);
      factory.registerProvider('provider2', () => mockProvider);
      
      const providers = factory.getAvailableProviders();
      expect(providers).toContain('provider1');
      expect(providers).toContain('provider2');
      expect(providers).toHaveLength(2);
    });
    
    it('should return providers in lowercase', () => {
      factory.registerProvider('PROVIDER1', () => mockProvider);
      factory.registerProvider('Provider2', () => mockProvider);
      
      const providers = factory.getAvailableProviders();
      expect(providers).toContain('provider1');
      expect(providers).toContain('provider2');
    });
  });
  
  describe('Provider existence check', () => {
    beforeEach(() => {
      factory.registerProvider('existing-provider', () => mockProvider);
    });
    
    it('should return true for existing provider', () => {
      expect(factory.hasProvider('existing-provider')).toBe(true);
    });
    
    it('should return false for non-existing provider', () => {
      expect(factory.hasProvider('non-existing-provider')).toBe(false);
    });
    
    it('should be case insensitive', () => {
      expect(factory.hasProvider('EXISTING-PROVIDER')).toBe(true);
      expect(factory.hasProvider('Existing-Provider')).toBe(true);
    });
  });
  
  describe('Provider unregistration', () => {
    beforeEach(() => {
      factory.registerProvider('provider1', () => mockProvider);
      factory.registerProvider('provider2', () => mockProvider);
    });
    
    it('should unregister existing provider', () => {
      const result = factory.unregisterProvider('provider1');
      
      expect(result).toBe(true);
      expect(factory.hasProvider('provider1')).toBe(false);
      expect(factory.hasProvider('provider2')).toBe(true);
    });
    
    it('should return false for non-existing provider', () => {
      const result = factory.unregisterProvider('non-existing');
      
      expect(result).toBe(false);
    });
    
    it('should be case insensitive', () => {
      const result = factory.unregisterProvider('PROVIDER1');
      
      expect(result).toBe(true);
      expect(factory.hasProvider('provider1')).toBe(false);
    });
  });
  
  describe('Clear all providers', () => {
    beforeEach(() => {
      factory.registerProvider('provider1', () => mockProvider);
      factory.registerProvider('provider2', () => mockProvider);
    });
    
    it('should clear all registered providers', () => {
      factory.clear();
      
      expect(factory.getAvailableProviders()).toEqual([]);
      expect(factory.hasProvider('provider1')).toBe(false);
      expect(factory.hasProvider('provider2')).toBe(false);
    });
    
    it('should allow registration after clear', () => {
      factory.clear();
      factory.registerProvider('new-provider', () => mockProvider);
      
      expect(factory.hasProvider('new-provider')).toBe(true);
    });
  });
  
  describe('Error handling', () => {
    it('should throw descriptive error with available providers', () => {
      factory.registerProvider('provider1', () => mockProvider);
      factory.registerProvider('provider2', () => mockProvider);
      
      expect(() => factory.createProvider('invalid'))
        .toThrow("AI Provider 'invalid' not found. Available providers: provider1, provider2");
    });
    
    it('should handle factory function errors', () => {
      const errorFactory = () => {
        throw new Error('Factory error');
      };
      
      factory.registerProvider('error-provider', errorFactory);
      
      expect(() => factory.createProvider('error-provider'))
        .toThrow('Factory error');
    });
  });
  
  describe('Integration scenarios', () => {
    it('should handle multiple provider types', () => {
      const geminiProvider = { ...mockProvider, name: 'gemini', version: '2.0' };
      const openaiProvider = { ...mockProvider, name: 'openai', version: '4.0' };
      const deepseekProvider = { ...mockProvider, name: 'deepseek', version: '1.0' };
      
      factory.registerProvider('gemini', () => geminiProvider);
      factory.registerProvider('openai', () => openaiProvider);
      factory.registerProvider('deepseek', () => deepseekProvider);
      
      expect(factory.getAvailableProviders()).toHaveLength(3);
      expect(factory.createProvider('gemini')).toBe(geminiProvider);
      expect(factory.createProvider('openai')).toBe(openaiProvider);
      expect(factory.createProvider('deepseek')).toBe(deepseekProvider);
    });
    
    it('should maintain provider independence', () => {
      const provider1Calls = vi.fn(() => ({ ...mockProvider, name: 'provider1' }));
      const provider2Calls = vi.fn(() => ({ ...mockProvider, name: 'provider2' }));
      
      factory.registerProvider('provider1', provider1Calls);
      factory.registerProvider('provider2', provider2Calls);
      
      factory.createProvider('provider1');
      expect(provider1Calls).toHaveBeenCalledTimes(1);
      expect(provider2Calls).toHaveBeenCalledTimes(0);
      
      factory.createProvider('provider2');
      expect(provider1Calls).toHaveBeenCalledTimes(1);
      expect(provider2Calls).toHaveBeenCalledTimes(1);
    });
  });
});