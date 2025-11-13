import { IUseCase } from '../../domain/interfaces/IUseCase';
import { IRepository } from '../../domain/interfaces/IRepository';
import { Patient } from '../../domain/entities/Patient';
import { nanoid } from 'nanoid';

/**
 * Caso de uso para criar paciente seguindo Clean Architecture
 * Implementa Single Responsibility Principle
 * 
 * Complexidade: O(1) - operação de inserção no banco
 */
export interface CreatePatientRequest {
  cpf: string;
  name: string;
  email: string;
  birthDate: Date;
  gender: 'M' | 'F' | 'Other';
  phone: string;
  address: string;
  emergencyContact: string;
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];
}

export interface CreatePatientResponse {
  patient: {
    id: string;
    cpf: string;
    name: string;
    email: string;
    birthDate: Date;
    gender: 'M' | 'F' | 'Other';
    phone: string;
    address: string;
    emergencyContact: string;
    allergies: string[];
    chronicConditions: string[];
    currentMedications: string[];
    age: number;
    isMinor: boolean;
    isElderly: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

export class CreatePatientUseCase implements IUseCase<CreatePatientRequest, CreatePatientResponse> {
  constructor(
    private readonly patientRepository: IRepository<any, string>
  ) {}
  
  async execute(request: CreatePatientRequest): Promise<CreatePatientResponse> {
    // Validações de negócio
    await this.validateUniqueConstraints(request);
    
    // Criar entidade Patient com validações de domínio
    const patient = Patient.create({
      id: nanoid(),
      cpf: request.cpf,
      name: request.name,
      email: request.email,
      birthDate: request.birthDate,
      gender: request.gender,
      phone: request.phone,
      address: request.address,
      emergencyContact: request.emergencyContact,
      allergies: request.allergies,
      chronicConditions: request.chronicConditions,
      currentMedications: request.currentMedications
    });
    
    // Persistir no repositório
    const savedPatient = await this.patientRepository.create(patient.toPlainObject());
    
    // Retornar resposta enriquecida
    return {
      patient: {
        ...savedPatient,
        age: patient.getAge(),
        isMinor: patient.isMinor(),
        isElderly: patient.isElderly()
      }
    };
  }
  
  /**
   * Valida restrições únicas (CPF, Email)
   * Complexidade: O(1) - busca por índice
   */
  private async validateUniqueConstraints(request: CreatePatientRequest): Promise<void> {
    // Aqui seria implementada a validação de CPF e email únicos
    // Por simplicidade, assumindo que o repositório já trata essas validações
    
    // Validação adicional de negócio
    if (request.birthDate > new Date()) {
      throw new Error('Birth date cannot be in the future');
    }
    
    const age = Patient.calculateAge(request.birthDate);
    if (age > 150) {
      throw new Error('Invalid birth date: age cannot exceed 150 years');
    }
  }
}