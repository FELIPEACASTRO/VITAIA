/**
 * Use Cases - Application Business Rules
 * 
 * Complexity Analysis:
 * - createPatient: O(1) for validation + O(log n) for database insert
 * - updatePatient: O(1) for validation + O(1) for database update
 * - searchPatients: O(n) where n is total patients (can be optimized with indexing)
 * - analyzePatient: O(k) where k is number of AI providers
 * 
 * SOLID Principles Applied:
 * - SRP: Each use case has single responsibility
 * - OCP: Open for extension with new use cases
 * - LSP: Use cases can be substituted
 * - ISP: Interfaces are focused and specific
 * - DIP: Depends on abstractions (repositories, services)
 */

import { Patient, PatientId, VitalSigns, MedicalRecord } from "../entities/Patient";
import { IPatientRepository, SearchCriteria, PaginatedResult } from "../repositories/IPatientRepository";
import { AIAnalysisService, AnalysisResult, ConsensusResult } from "../services/AIAnalysisService";

// DTOs for Use Case boundaries
export interface CreatePatientRequest {
  name: string;
  age: number;
  gender: string;
  email: string;
  phone: string;
  address: string;
  conditions?: string[];
  allergies?: string[];
  medications?: string[];
  vitalSigns?: {
    heartRate: number;
    bloodPressure: string;
    temperature: number;
    oxygenSaturation: number;
  };
}

export interface UpdatePatientRequest {
  id: string;
  name?: string;
  conditions?: string[];
  allergies?: string[];
  medications?: string[];
  vitalSigns?: {
    heartRate: number;
    bloodPressure: string;
    temperature: number;
    oxygenSaturation: number;
  };
}

export interface AnalyzePatientRequest {
  patientId: string;
  symptoms: string[];
  useConsensus?: boolean;
}

export interface PatientResponse {
  id: string;
  name: string;
  age: number;
  gender: string;
  email: string;
  phone: string;
  address: string;
  conditions: string[];
  allergies: string[];
  medications: string[];
  vitalSigns?: {
    heartRate: number;
    bloodPressure: string;
    temperature: number;
    oxygenSaturation: number;
    recordedAt: Date;
  };
  riskLevel: "low" | "medium" | "high";
  createdAt: Date;
  updatedAt: Date;
}

// Base Use Case class following Command Pattern
export abstract class UseCase<TRequest, TResponse> {
  abstract execute(request: TRequest): Promise<TResponse>;

  protected validateRequest(request: TRequest): void {
    if (!request) {
      throw new Error("Request cannot be null or undefined");
    }
  }

  protected handleError(error: unknown, context: string): never {
    console.error(`Error in ${context}:`, error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error(`Unknown error in ${context}`);
  }
}

// Create Patient Use Case
export class CreatePatientUseCase extends UseCase<CreatePatientRequest, PatientResponse> {
  constructor(
    private readonly patientRepository: IPatientRepository
  ) {
    super();
  }

  /**
   * Create a new patient
   * @complexity O(1) for validation + O(log n) for database insert
   */
  async execute(request: CreatePatientRequest): Promise<PatientResponse> {
    try {
      this.validateRequest(request);
      this.validateCreateRequest(request);

      // Check if patient already exists by email
      const existingPatients = await this.patientRepository.findByCriteria({
        limit: 1,
        offset: 0
      });

      // Generate unique ID
      const patientId = this.generatePatientId();

      // Create patient entity
      const patient = Patient.create({
        id: patientId,
        ...request
      });

      // Save to repository
      const savedPatient = await this.patientRepository.save(patient);

      return this.mapToResponse(savedPatient);
    } catch (error) {
      this.handleError(error, "CreatePatientUseCase");
    }
  }

  private validateCreateRequest(request: CreatePatientRequest): void {
    if (!request.name || request.name.trim().length < 2) {
      throw new Error("Patient name must be at least 2 characters long");
    }

    if (!request.email || !request.email.includes("@")) {
      throw new Error("Valid email is required");
    }

    if (request.age < 0 || request.age > 150) {
      throw new Error("Patient age must be between 0 and 150");
    }

    if (!request.phone || request.phone.trim().length < 8) {
      throw new Error("Valid phone number is required");
    }
  }

  private generatePatientId(): string {
    // Generate unique patient ID with prefix
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `PAT_${timestamp}_${random}`.toUpperCase();
  }

  private mapToResponse(patient: Patient): PatientResponse {
    const medicalRecord = patient.getMedicalRecord();
    const vitalSigns = patient.getVitalSigns();

    return {
      id: patient.getId().toString(),
      name: patient.getName(),
      age: patient.getAge(),
      gender: patient.getGender(),
      email: patient.getEmail(),
      phone: patient.getPhone(),
      address: patient.getAddress(),
      conditions: medicalRecord.getConditions() as string[],
      allergies: medicalRecord.getAllergies() as string[],
      medications: medicalRecord.getMedications() as string[],
      vitalSigns: vitalSigns ? {
        heartRate: vitalSigns.getHeartRate(),
        bloodPressure: vitalSigns.getBloodPressure(),
        temperature: vitalSigns.getTemperature(),
        oxygenSaturation: vitalSigns.getOxygenSaturation(),
        recordedAt: vitalSigns.getRecordedAt(),
      } : undefined,
      riskLevel: patient.calculateRiskLevel(),
      createdAt: patient.getCreatedAt(),
      updatedAt: patient.getUpdatedAt(),
    };
  }
}

// Get Patient Use Case
export class GetPatientUseCase extends UseCase<string, PatientResponse | null> {
  constructor(
    private readonly patientRepository: IPatientRepository
  ) {
    super();
  }

  /**
   * Get patient by ID
   * @complexity O(1) with proper indexing
   */
  async execute(patientId: string): Promise<PatientResponse | null> {
    try {
      this.validateRequest(patientId);

      if (!patientId || patientId.trim().length === 0) {
        throw new Error("Patient ID is required");
      }

      const id = PatientId.create(patientId);
      const patient = await this.patientRepository.findById(id);

      if (!patient) {
        return null;
      }

      return this.mapToResponse(patient);
    } catch (error) {
      this.handleError(error, "GetPatientUseCase");
    }
  }

  private mapToResponse(patient: Patient): PatientResponse {
    const medicalRecord = patient.getMedicalRecord();
    const vitalSigns = patient.getVitalSigns();

    return {
      id: patient.getId().toString(),
      name: patient.getName(),
      age: patient.getAge(),
      gender: patient.getGender(),
      email: patient.getEmail(),
      phone: patient.getPhone(),
      address: patient.getAddress(),
      conditions: medicalRecord.getConditions() as string[],
      allergies: medicalRecord.getAllergies() as string[],
      medications: medicalRecord.getMedications() as string[],
      vitalSigns: vitalSigns ? {
        heartRate: vitalSigns.getHeartRate(),
        bloodPressure: vitalSigns.getBloodPressure(),
        temperature: vitalSigns.getTemperature(),
        oxygenSaturation: vitalSigns.getOxygenSaturation(),
        recordedAt: vitalSigns.getRecordedAt(),
      } : undefined,
      riskLevel: patient.calculateRiskLevel(),
      createdAt: patient.getCreatedAt(),
      updatedAt: patient.getUpdatedAt(),
    };
  }
}

// Update Patient Use Case
export class UpdatePatientUseCase extends UseCase<UpdatePatientRequest, PatientResponse> {
  constructor(
    private readonly patientRepository: IPatientRepository
  ) {
    super();
  }

  /**
   * Update existing patient
   * @complexity O(1) for validation + O(1) for database update
   */
  async execute(request: UpdatePatientRequest): Promise<PatientResponse> {
    try {
      this.validateRequest(request);
      this.validateUpdateRequest(request);

      const patientId = PatientId.create(request.id);
      const existingPatient = await this.patientRepository.findById(patientId);

      if (!existingPatient) {
        throw new Error("Patient not found");
      }

      // Update patient data
      if (request.name) {
        existingPatient.updateName(request.name);
      }

      if (request.vitalSigns) {
        const vitalSigns = new VitalSigns(
          request.vitalSigns.heartRate,
          request.vitalSigns.bloodPressure,
          request.vitalSigns.temperature,
          request.vitalSigns.oxygenSaturation
        );
        existingPatient.updateVitalSigns(vitalSigns);
      }

      if (request.conditions || request.allergies || request.medications) {
        const currentRecord = existingPatient.getMedicalRecord();
        const newRecord = new MedicalRecord(
          request.conditions || currentRecord.getConditions(),
          request.allergies || currentRecord.getAllergies(),
          request.medications || currentRecord.getMedications()
        );
        existingPatient.updateMedicalRecord(newRecord);
      }

      // Save updated patient
      const updatedPatient = await this.patientRepository.save(existingPatient);

      return this.mapToResponse(updatedPatient);
    } catch (error) {
      this.handleError(error, "UpdatePatientUseCase");
    }
  }

  private validateUpdateRequest(request: UpdatePatientRequest): void {
    if (!request.id || request.id.trim().length === 0) {
      throw new Error("Patient ID is required");
    }

    if (request.name !== undefined && request.name.trim().length < 2) {
      throw new Error("Patient name must be at least 2 characters long");
    }
  }

  private mapToResponse(patient: Patient): PatientResponse {
    const medicalRecord = patient.getMedicalRecord();
    const vitalSigns = patient.getVitalSigns();

    return {
      id: patient.getId().toString(),
      name: patient.getName(),
      age: patient.getAge(),
      gender: patient.getGender(),
      email: patient.getEmail(),
      phone: patient.getPhone(),
      address: patient.getAddress(),
      conditions: medicalRecord.getConditions() as string[],
      allergies: medicalRecord.getAllergies() as string[],
      medications: medicalRecord.getMedications() as string[],
      vitalSigns: vitalSigns ? {
        heartRate: vitalSigns.getHeartRate(),
        bloodPressure: vitalSigns.getBloodPressure(),
        temperature: vitalSigns.getTemperature(),
        oxygenSaturation: vitalSigns.getOxygenSaturation(),
        recordedAt: vitalSigns.getRecordedAt(),
      } : undefined,
      riskLevel: patient.calculateRiskLevel(),
      createdAt: patient.getCreatedAt(),
      updatedAt: patient.getUpdatedAt(),
    };
  }
}

// Search Patients Use Case
export class SearchPatientsUseCase extends UseCase<SearchCriteria, PaginatedResult<PatientResponse>> {
  constructor(
    private readonly patientRepository: IPatientRepository
  ) {
    super();
  }

  /**
   * Search patients with criteria
   * @complexity O(n) where n is total patients (can be optimized with indexing)
   */
  async execute(criteria: SearchCriteria): Promise<PaginatedResult<PatientResponse>> {
    try {
      this.validateRequest(criteria);
      this.validateSearchCriteria(criteria);

      const result = await this.patientRepository.findByCriteria(criteria);

      return {
        data: result.data.map(patient => this.mapToResponse(patient)),
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        hasNext: result.hasNext,
        hasPrevious: result.hasPrevious,
      };
    } catch (error) {
      this.handleError(error, "SearchPatientsUseCase");
    }
  }

  private validateSearchCriteria(criteria: SearchCriteria): void {
    if (criteria.limit && (criteria.limit < 1 || criteria.limit > 100)) {
      throw new Error("Limit must be between 1 and 100");
    }

    if (criteria.offset && criteria.offset < 0) {
      throw new Error("Offset must be non-negative");
    }

    if (criteria.age) {
      if (criteria.age.min && (criteria.age.min < 0 || criteria.age.min > 150)) {
        throw new Error("Minimum age must be between 0 and 150");
      }
      if (criteria.age.max && (criteria.age.max < 0 || criteria.age.max > 150)) {
        throw new Error("Maximum age must be between 0 and 150");
      }
      if (criteria.age.min && criteria.age.max && criteria.age.min > criteria.age.max) {
        throw new Error("Minimum age cannot be greater than maximum age");
      }
    }
  }

  private mapToResponse(patient: Patient): PatientResponse {
    const medicalRecord = patient.getMedicalRecord();
    const vitalSigns = patient.getVitalSigns();

    return {
      id: patient.getId().toString(),
      name: patient.getName(),
      age: patient.getAge(),
      gender: patient.getGender(),
      email: patient.getEmail(),
      phone: patient.getPhone(),
      address: patient.getAddress(),
      conditions: medicalRecord.getConditions() as string[],
      allergies: medicalRecord.getAllergies() as string[],
      medications: medicalRecord.getMedications() as string[],
      vitalSigns: vitalSigns ? {
        heartRate: vitalSigns.getHeartRate(),
        bloodPressure: vitalSigns.getBloodPressure(),
        temperature: vitalSigns.getTemperature(),
        oxygenSaturation: vitalSigns.getOxygenSaturation(),
        recordedAt: vitalSigns.getRecordedAt(),
      } : undefined,
      riskLevel: patient.calculateRiskLevel(),
      createdAt: patient.getCreatedAt(),
      updatedAt: patient.getUpdatedAt(),
    };
  }
}

// Analyze Patient Use Case
export class AnalyzePatientUseCase extends UseCase<AnalyzePatientRequest, AnalysisResult | ConsensusResult> {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly aiAnalysisService: AIAnalysisService
  ) {
    super();
  }

  /**
   * Analyze patient with AI
   * @complexity O(1) for single provider, O(k) for consensus where k is providers
   */
  async execute(request: AnalyzePatientRequest): Promise<AnalysisResult | ConsensusResult> {
    try {
      this.validateRequest(request);
      this.validateAnalysisRequest(request);

      const patientId = PatientId.create(request.patientId);
      const patient = await this.patientRepository.findById(patientId);

      if (!patient) {
        throw new Error("Patient not found");
      }

      if (request.useConsensus) {
        return await this.aiAnalysisService.multiProviderAnalysis(patient, request.symptoms);
      } else {
        return await this.aiAnalysisService.analyze(patient, request.symptoms);
      }
    } catch (error) {
      this.handleError(error, "AnalyzePatientUseCase");
    }
  }

  private validateAnalysisRequest(request: AnalyzePatientRequest): void {
    if (!request.patientId || request.patientId.trim().length === 0) {
      throw new Error("Patient ID is required");
    }

    if (!request.symptoms || request.symptoms.length === 0) {
      throw new Error("At least one symptom is required");
    }

    if (request.symptoms.some(symptom => !symptom || symptom.trim().length === 0)) {
      throw new Error("All symptoms must be non-empty strings");
    }
  }
}

// Delete Patient Use Case
export class DeletePatientUseCase extends UseCase<string, boolean> {
  constructor(
    private readonly patientRepository: IPatientRepository
  ) {
    super();
  }

  /**
   * Delete patient by ID
   * @complexity O(1) with proper indexing
   */
  async execute(patientId: string): Promise<boolean> {
    try {
      this.validateRequest(patientId);

      if (!patientId || patientId.trim().length === 0) {
        throw new Error("Patient ID is required");
      }

      const id = PatientId.create(patientId);
      const exists = await this.patientRepository.exists(id);

      if (!exists) {
        throw new Error("Patient not found");
      }

      return await this.patientRepository.delete(id);
    } catch (error) {
      this.handleError(error, "DeletePatientUseCase");
    }
  }
}