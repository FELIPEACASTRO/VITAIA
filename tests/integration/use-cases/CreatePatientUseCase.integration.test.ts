import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CreatePatientUseCase, CreatePatientRequest } from '../../../server/application/use-cases/CreatePatientUseCase';
import { IRepository } from '../../../server/domain/interfaces/IRepository';

/**
 * Testes de integração para CreatePatientUseCase
 * Testa integração entre caso de uso, entidade e repositório
 *
 * Cobertura: Fluxos completos de criação de paciente
 * Complexidade: O(1) para cada operação de banco
 */
describe('CreatePatientUseCase Integration', () => {
  let useCase: CreatePatientUseCase;
  let patientRepository: IRepository<any, string>;

  const validRequest: CreatePatientRequest = {
    cpf: '11144477735',
    name: 'João Silva',
    email: 'joao.silva@email.com',
    birthDate: new Date('1990-05-15'),
    gender: 'M',
    phone: '(11) 99999-9999',
    address: 'Rua das Flores, 123',
    emergencyContact: 'Maria Silva - (11) 88888-8888',
    allergies: ['Penicilina'],
    chronicConditions: ['Hipertensão'],
    currentMedications: ['Losartana 50mg']
  };

  beforeEach(() => {
    // Create mock repository for testing
    patientRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn().mockImplementation(async (entity) => ({
        ...entity,
        id: 'generated-id-123',
        createdAt: new Date(),
        updatedAt: new Date()
      })),
      update: vi.fn(),
      delete: vi.fn()
    };
    useCase = new CreatePatientUseCase(patientRepository);
  });

  afterEach(async () => {
    // Cleanup - remove test data
    // Note: In a real test environment, you would use a test database
    // and clean it up after each test
  });

  describe('Successful patient creation', () => {
    it('should create patient with complete data', async () => {
      const response = await useCase.execute(validRequest);

      expect(response.patient).toBeDefined();
      expect(response.patient.id).toBeDefined();
      expect(response.patient.cpf).toBe(validRequest.cpf);
      expect(response.patient.name).toBe(validRequest.name);
      expect(response.patient.email).toBe(validRequest.email);
      expect(response.patient.birthDate).toEqual(validRequest.birthDate);
      expect(response.patient.gender).toBe(validRequest.gender);
      expect(response.patient.phone).toBe(validRequest.phone);
      expect(response.patient.address).toBe(validRequest.address);
      expect(response.patient.emergencyContact).toBe(validRequest.emergencyContact);
      expect(response.patient.allergies).toEqual(validRequest.allergies);
      expect(response.patient.chronicConditions).toEqual(validRequest.chronicConditions);
      expect(response.patient.currentMedications).toEqual(validRequest.currentMedications);
      expect(response.patient.createdAt).toBeInstanceOf(Date);
      expect(response.patient.updatedAt).toBeInstanceOf(Date);
    });

    it('should create patient with minimal data', async () => {
      const minimalRequest: CreatePatientRequest = {
        cpf: '52998224725',
        name: 'Maria Santos',
        email: 'maria.santos@email.com',
        birthDate: new Date('1985-10-20'),
        gender: 'F',
        phone: '(11) 88888-8888',
        address: 'Rua das Palmeiras, 456',
        emergencyContact: 'José Santos - (11) 77777-7777'
      };

      const response = await useCase.execute(minimalRequest);

      expect(response.patient.allergies).toEqual([]);
      expect(response.patient.chronicConditions).toEqual([]);
      expect(response.patient.currentMedications).toEqual([]);
    });

    it('should calculate age correctly', async () => {
      const birthDate = new Date('1990-05-15');
      const request = { ...validRequest, birthDate };

      const response = await useCase.execute(request);

      const expectedAge = new Date().getFullYear() - 1990;
      expect(response.patient.age).toBeGreaterThanOrEqual(expectedAge - 1);
      expect(response.patient.age).toBeLessThanOrEqual(expectedAge);
    });

    it('should identify minor correctly', async () => {
      const minorBirthDate = new Date();
      minorBirthDate.setFullYear(minorBirthDate.getFullYear() - 16);

      const request = { ...validRequest, cpf: '98765432100', birthDate: minorBirthDate };

      const response = await useCase.execute(request);

      expect(response.patient.isMinor).toBe(true);
      expect(response.patient.isElderly).toBe(false);
    });

    it('should identify elderly correctly', async () => {
      const elderlyBirthDate = new Date();
      elderlyBirthDate.setFullYear(elderlyBirthDate.getFullYear() - 70);

      const request = { ...validRequest, cpf: '12345678909', birthDate: elderlyBirthDate };

      const response = await useCase.execute(request);

      expect(response.patient.isMinor).toBe(false);
      expect(response.patient.isElderly).toBe(true);
    });
  });

  describe('Validation errors', () => {
    it('should throw error for invalid CPF', async () => {
      const invalidRequest = { ...validRequest, cpf: '12345678900' };

      await expect(useCase.execute(invalidRequest))
        .rejects.toThrow('Invalid CPF');
    });

    it('should throw error for invalid email', async () => {
      const invalidRequest = { ...validRequest, email: 'invalid-email' };

      await expect(useCase.execute(invalidRequest))
        .rejects.toThrow('Invalid email format');
    });

    it('should throw error for empty name', async () => {
      const invalidRequest = { ...validRequest, name: '' };

      await expect(useCase.execute(invalidRequest))
        .rejects.toThrow('Patient name is required');
    });

    it('should throw error for future birth date', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const invalidRequest = { ...validRequest, birthDate: futureDate };

      await expect(useCase.execute(invalidRequest))
        .rejects.toThrow('Birth date cannot be in the future');
    });

    it('should throw error for invalid age (over 150)', async () => {
      const ancientDate = new Date();
      ancientDate.setFullYear(ancientDate.getFullYear() - 151);

      const invalidRequest = { ...validRequest, birthDate: ancientDate };

      await expect(useCase.execute(invalidRequest))
        .rejects.toThrow('Invalid birth date: age cannot exceed 150 years');
    });
  });

  describe('Business rule validation', () => {
    it('should trim patient name', async () => {
      const requestWithSpaces = { ...validRequest, name: '  João Silva  ' };

      const response = await useCase.execute(requestWithSpaces);

      expect(response.patient.name).toBe('João Silva');
    });

    it('should normalize email to lowercase', async () => {
      const requestWithUppercaseEmail = {
        ...validRequest,
        cpf: '52998224725',
        email: 'JOAO.SILVA@EMAIL.COM'
      };

      const response = await useCase.execute(requestWithUppercaseEmail);

      expect(response.patient.email).toBe('joao.silva@email.com');
    });

    it('should format CPF correctly', async () => {
      const requestWithFormattedCPF = {
        ...validRequest,
        cpf: '111.444.777-35'
      };

      const response = await useCase.execute(requestWithFormattedCPF);

      expect(response.patient.cpf).toBe('11144477735');
    });
  });

  describe('Repository integration', () => {
    it('should call repository create method', async () => {
      const response = await useCase.execute(validRequest);

      // Verify repository was called with correct data
      expect(patientRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: validRequest.name,
          cpf: validRequest.cpf,
          email: validRequest.email
        })
      );

      expect(response.patient.id).toBe('generated-id-123');
    });

    it('should handle repository errors gracefully', async () => {
      // Mock repository to throw error
      const mockRepository = {
        create: vi.fn().mockRejectedValue(new Error('Database connection failed'))
      };

      const useCaseWithMockRepo = new CreatePatientUseCase(mockRepository as any);

      await expect(useCaseWithMockRepo.execute(validRequest))
        .rejects.toThrow('Database connection failed');
    });
  });

  describe('Performance considerations', () => {
    it('should complete patient creation within reasonable time', async () => {
      const startTime = Date.now();

      await useCase.execute(validRequest);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Should complete within 1 second (adjust based on your requirements)
      expect(executionTime).toBeLessThan(1000);
    });

    it('should handle concurrent patient creation', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => ({
        ...validRequest,
        cpf: `1114447773${i}`,
        email: `patient${i}@email.com`,
        name: `Patient ${i}`
      }));

      const promises = requests.map(request => useCase.execute(request));
      const responses = await Promise.all(promises);

      expect(responses).toHaveLength(5);
      responses.forEach((response, index) => {
        expect(response.patient.name).toBe(`Patient ${index}`);
      });
    });
  });
});
