/**
 * Repository Pattern Interface
 * 
 * Complexity Analysis:
 * - findById: O(1) with proper indexing, O(n) worst case
 * - findAll: O(n) where n is total patients
 * - findByCondition: O(n) where n is total patients
 * - save: O(1) for updates, O(log n) for inserts with B-tree
 * - delete: O(1) with proper indexing
 * 
 * Follows SOLID principles:
 * - SRP: Single responsibility for patient data access
 * - OCP: Open for extension with new implementations
 * - LSP: Any implementation should be substitutable
 * - ISP: Interface segregation - only patient-related methods
 * - DIP: High-level modules depend on this abstraction
 */

import { Patient, PatientId } from "../entities/Patient";

export interface SearchCriteria {
  name?: string;
  age?: { min?: number; max?: number };
  gender?: string;
  conditions?: string[];
  riskLevel?: "low" | "medium" | "high";
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface IPatientRepository {
  /**
   * Find patient by ID
   * @complexity O(1) with proper indexing
   */
  findById(id: PatientId): Promise<Patient | null>;

  /**
   * Find all patients with pagination
   * @complexity O(n) where n is the number of patients
   */
  findAll(limit?: number, offset?: number): Promise<PaginatedResult<Patient>>;

  /**
   * Find patients by search criteria
   * @complexity O(n) where n is the number of patients
   */
  findByCriteria(criteria: SearchCriteria): Promise<PaginatedResult<Patient>>;

  /**
   * Find patients with specific medical conditions
   * @complexity O(n) where n is the number of patients
   */
  findByConditions(conditions: string[]): Promise<Patient[]>;

  /**
   * Find patients by risk level
   * @complexity O(n) where n is the number of patients
   */
  findByRiskLevel(riskLevel: "low" | "medium" | "high"): Promise<Patient[]>;

  /**
   * Save patient (create or update)
   * @complexity O(1) for updates, O(log n) for inserts
   */
  save(patient: Patient): Promise<Patient>;

  /**
   * Delete patient by ID
   * @complexity O(1) with proper indexing
   */
  delete(id: PatientId): Promise<boolean>;

  /**
   * Check if patient exists
   * @complexity O(1) with proper indexing
   */
  exists(id: PatientId): Promise<boolean>;

  /**
   * Count total patients
   * @complexity O(1) with proper database optimization
   */
  count(): Promise<number>;

  /**
   * Count patients by criteria
   * @complexity O(n) where n is the number of patients
   */
  countByCriteria(criteria: SearchCriteria): Promise<number>;

  /**
   * Batch operations for better performance
   * @complexity O(n) where n is the number of patients
   */
  saveMany(patients: Patient[]): Promise<Patient[]>;

  /**
   * Find patients with abnormal vital signs
   * @complexity O(n) where n is the number of patients
   */
  findWithAbnormalVitals(): Promise<Patient[]>;
}