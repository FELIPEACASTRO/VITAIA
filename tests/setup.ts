/**
 * Configuração global para testes
 * Configura ambiente de teste, mocks e utilitários
 */
import { vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { GlobalMetricsCollector } from '../server/domain/services/MetricsCollector';

// Configuração de timezone para testes consistentes
process.env.TZ = 'UTC';

// Mock de variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/vitaia_test';

// Configuração global de timeouts
vi.setConfig({
  testTimeout: 10000,
  hookTimeout: 10000,
});

// Mock de console para reduzir ruído nos testes
const originalConsole = { ...console };

beforeAll(() => {
  // Silencia logs durante os testes, exceto erros
  console.log = vi.fn();
  console.info = vi.fn();
  console.warn = vi.fn();
  console.debug = vi.fn();
  // Mantém console.error para debugging
});

afterAll(() => {
  // Restaura console original
  Object.assign(console, originalConsole);
});

beforeEach(() => {
  // Reset do singleton de métricas para cada teste
  GlobalMetricsCollector.reset();
  
  // Mock de Date.now para testes determinísticos
  const mockDate = new Date('2024-01-01T00:00:00.000Z');
  vi.useFakeTimers();
  vi.setSystemTime(mockDate);
});

afterEach(() => {
  // Limpa todos os mocks após cada teste
  vi.clearAllMocks();
  vi.useRealTimers();
  
  // Reset de singletons
  GlobalMetricsCollector.reset();
});

// Utilitários globais para testes
declare global {
  namespace Vi {
    interface AsserterInterface {
      toBeWithinRange(min: number, max: number): void;
    }
  }
}

// Matcher customizado para verificar se um número está dentro de um range
expect.extend({
  toBeWithinRange(received: number, min: number, max: number) {
    const pass = received >= min && received <= max;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${min} - ${max}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${min} - ${max}`,
        pass: false,
      };
    }
  },
});

// Mock de fetch para testes de integração com APIs externas
global.fetch = vi.fn();

// Configuração de mock para APIs de IA
export const mockAIResponse = {
  gemini: {
    candidates: [{
      content: {
        parts: [{
          text: JSON.stringify({
            suggestions: [{
              condition: "Resfriado comum",
              confidence: 0.8,
              reasoning: "Sintomas compatíveis com infecção viral das vias aéreas superiores",
              severity: "low",
              recommendedActions: ["Repouso", "Hidratação", "Medicação sintomática"]
            }]
          })
        }]
      }
    }]
  },
  openai: {
    choices: [{
      message: {
        content: JSON.stringify({
          suggestions: [{
            condition: "Resfriado comum",
            confidence: 0.8,
            reasoning: "Sintomas compatíveis com infecção viral das vias aéreas superiores",
            severity: "low",
            recommendedActions: ["Repouso", "Hidratação", "Medicação sintomática"]
          }]
        })
      }
    }]
  }
};

// Função helper para criar dados de teste
export const createTestPatientData = (overrides = {}) => ({
  id: 'test-patient-123',
  cpf: '11144477735',
  name: 'João Silva Teste',
  email: 'joao.teste@email.com',
  birthDate: new Date('1990-05-15'),
  gender: 'M' as const,
  phone: '(11) 99999-9999',
  address: 'Rua de Teste, 123',
  emergencyContact: 'Maria Silva - (11) 88888-8888',
  allergies: ['Penicilina'],
  chronicConditions: ['Hipertensão'],
  currentMedications: ['Losartana 50mg'],
  ...overrides
});

// Função helper para criar mock de repositório
export const createMockRepository = () => ({
  findById: vi.fn(),
  findAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findWithPagination: vi.fn(),
  findByFilter: vi.fn(),
});

// Função helper para criar mock de provedor de IA
export const createMockAIProvider = (name = 'test-provider') => ({
  name,
  version: '1.0.0',
  analyzeSymptomsAsync: vi.fn(),
  generateTreatmentPlan: vi.fn(),
  healthCheck: vi.fn().mockResolvedValue({
    isAvailable: true,
    responseTime: 100,
    lastChecked: new Date(),
    errorRate: 0
  })
});

// Configuração de banco de dados para testes
export const setupTestDatabase = async () => {
  // Em um ambiente real, você configuraria um banco de teste aqui
  // Por exemplo, executar migrações, limpar dados, etc.
  console.log('Setting up test database...');
};

export const teardownTestDatabase = async () => {
  // Limpeza do banco de teste
  console.log('Tearing down test database...');
};

// Export de utilitários para uso nos testes
export {
  vi,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
  expect,
  describe,
  it,
  test,
} from 'vitest';