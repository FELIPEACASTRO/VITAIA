/**
 * Infrastructure Layer - Repository Implementation
 * 
 * Complexity Analysis:
 * - findById: O(1) with B-tree index on ID
 * - findAll: O(n) where n is total records, O(k) with LIMIT
 * - findByCriteria: O(n) worst case, O(log n) with proper indexing
 * - save: O(log n) for insert/update with B-tree
 * - delete: O(log n) with B-tree index
 * 
 * Database Optimization Strategies:
 * - Composite indexes for common query patterns
 * - Partial indexes for filtered queries
 * - Connection pooling for scalability
 * - Read replicas for query scaling
 * - Query result caching
 */

import { Patient, PatientId, VitalSigns, MedicalRecord } from "../../domain/entities/Patient";
import { IPatientRepository, SearchCriteria, PaginatedResult } from "../../domain/repositories/IPatientRepository";

// Database connection interface (adapter pattern)
export interface IDatabaseConnection {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
  execute(sql: string, params?: any[]): Promise<{ affectedRows: number; insertId?: number }>;
  transaction<T>(callback: (connection: IDatabaseConnection) => Promise<T>): Promise<T>;
}

// Database row interface
interface PatientRow {
  id: string;
  name: string;
  age: number;
  gender: string;
  email: string;
  phone: string;
  address: string;
  conditions: string; // JSON string
  allergies: string; // JSON string
  medications: string; // JSON string
  heart_rate?: number;
  blood_pressure?: string;
  temperature?: number;
  oxygen_saturation?: number;
  vitals_recorded_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export class PatientRepository implements IPatientRepository {
  constructor(
    private readonly db: IDatabaseConnection,
    private readonly tableName: string = 'patients'
  ) {}

  /**
   * Find patient by ID
   * @complexity O(1) with primary key index
   */
  async findById(id: PatientId): Promise<Patient | null> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE id = ? AND deleted_at IS NULL
    `;
    
    const row = await this.db.queryOne<PatientRow>(sql, [id.toString()]);
    
    if (!row) {
      return null;
    }

    return this.mapRowToEntity(row);
  }

  /**
   * Find all patients with pagination
   * @complexity O(k) where k is the limit, O(n) without limit
   */
  async findAll(limit: number = 50, offset: number = 0): Promise<PaginatedResult<Patient>> {
    // Get total count for pagination
    const countSql = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE deleted_at IS NULL`;
    const countResult = await this.db.queryOne<{ total: number }>(countSql);
    const total = countResult?.total || 0;

    // Get paginated data
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE deleted_at IS NULL 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    const rows = await this.db.query<PatientRow>(sql, [limit, offset]);
    const patients = rows.map(row => this.mapRowToEntity(row));

    const page = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    return {
      data: patients,
      total,
      page,
      pageSize: limit,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };
  }

  /**
   * Find patients by search criteria
   * @complexity O(n) worst case, O(log n) with proper indexing
   */
  async findByCriteria(criteria: SearchCriteria): Promise<PaginatedResult<Patient>> {
    const { whereClause, params } = this.buildWhereClause(criteria);
    const limit = criteria.limit || 50;
    const offset = criteria.offset || 0;

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total 
      FROM ${this.tableName} 
      WHERE deleted_at IS NULL ${whereClause}
    `;
    const countResult = await this.db.queryOne<{ total: number }>(countSql, params);
    const total = countResult?.total || 0;

    // Get paginated data
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE deleted_at IS NULL ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    const rows = await this.db.query<PatientRow>(sql, [...params, limit, offset]);
    const patients = rows.map(row => this.mapRowToEntity(row));

    const page = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    return {
      data: patients,
      total,
      page,
      pageSize: limit,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };
  }

  /**
   * Find patients with specific conditions
   * @complexity O(n) with JSON search, can be optimized with JSON indexes
   */
  async findByConditions(conditions: string[]): Promise<Patient[]> {
    if (conditions.length === 0) {
      return [];
    }

    // Use JSON_OVERLAPS for PostgreSQL or JSON_SEARCH for MySQL
    const conditionsJson = JSON.stringify(conditions);
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE deleted_at IS NULL 
      AND JSON_OVERLAPS(conditions, ?)
      ORDER BY created_at DESC
    `;
    
    const rows = await this.db.query<PatientRow>(sql, [conditionsJson]);
    return rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * Find patients by risk level (computed field)
   * @complexity O(n) as risk level is computed
   */
  async findByRiskLevel(riskLevel: "low" | "medium" | "high"): Promise<Patient[]> {
    // This would ideally use a computed column or materialized view
    // For now, we fetch all and filter (not optimal for large datasets)
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE deleted_at IS NULL 
      ORDER BY created_at DESC
    `;
    
    const rows = await this.db.query<PatientRow>(sql);
    const patients = rows.map(row => this.mapRowToEntity(row));
    
    return patients.filter(patient => patient.calculateRiskLevel() === riskLevel);
  }

  /**
   * Save patient (create or update)
   * @complexity O(log n) for insert/update with B-tree index
   */
  async save(patient: Patient): Promise<Patient> {
    const data = this.mapEntityToRow(patient);
    
    return await this.db.transaction(async (conn) => {
      // Check if patient exists
      const existsSql = `SELECT id FROM ${this.tableName} WHERE id = ? AND deleted_at IS NULL`;
      const exists = await conn.queryOne(existsSql, [patient.getId().toString()]);

      if (exists) {
        // Update existing patient
        const updateSql = `
          UPDATE ${this.tableName} 
          SET name = ?, age = ?, gender = ?, email = ?, phone = ?, address = ?,
              conditions = ?, allergies = ?, medications = ?,
              heart_rate = ?, blood_pressure = ?, temperature = ?, 
              oxygen_saturation = ?, vitals_recorded_at = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND deleted_at IS NULL
        `;
        
        await conn.execute(updateSql, [
          data.name, data.age, data.gender, data.email, data.phone, data.address,
          data.conditions, data.allergies, data.medications,
          data.heart_rate, data.blood_pressure, data.temperature,
          data.oxygen_saturation, data.vitals_recorded_at,
          data.id
        ]);
      } else {
        // Insert new patient
        const insertSql = `
          INSERT INTO ${this.tableName} 
          (id, name, age, gender, email, phone, address, conditions, allergies, medications,
           heart_rate, blood_pressure, temperature, oxygen_saturation, vitals_recorded_at,
           created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;
        
        await conn.execute(insertSql, [
          data.id, data.name, data.age, data.gender, data.email, data.phone, data.address,
          data.conditions, data.allergies, data.medications,
          data.heart_rate, data.blood_pressure, data.temperature,
          data.oxygen_saturation, data.vitals_recorded_at
        ]);
      }

      // Return updated patient
      const updatedRow = await conn.queryOne<PatientRow>(
        `SELECT * FROM ${this.tableName} WHERE id = ? AND deleted_at IS NULL`,
        [patient.getId().toString()]
      );

      if (!updatedRow) {
        throw new Error("Failed to save patient");
      }

      return this.mapRowToEntity(updatedRow);
    });
  }

  /**
   * Delete patient (soft delete)
   * @complexity O(1) with primary key index
   */
  async delete(id: PatientId): Promise<boolean> {
    const sql = `
      UPDATE ${this.tableName} 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND deleted_at IS NULL
    `;
    
    const result = await this.db.execute(sql, [id.toString()]);
    return result.affectedRows > 0;
  }

  /**
   * Check if patient exists
   * @complexity O(1) with primary key index
   */
  async exists(id: PatientId): Promise<boolean> {
    const sql = `SELECT 1 FROM ${this.tableName} WHERE id = ? AND deleted_at IS NULL`;
    const result = await this.db.queryOne(sql, [id.toString()]);
    return result !== null;
  }

  /**
   * Count total patients
   * @complexity O(1) with proper database optimization
   */
  async count(): Promise<number> {
    const sql = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE deleted_at IS NULL`;
    const result = await this.db.queryOne<{ total: number }>(sql);
    return result?.total || 0;
  }

  /**
   * Count patients by criteria
   * @complexity O(n) worst case, O(log n) with proper indexing
   */
  async countByCriteria(criteria: SearchCriteria): Promise<number> {
    const { whereClause, params } = this.buildWhereClause(criteria);
    
    const sql = `
      SELECT COUNT(*) as total 
      FROM ${this.tableName} 
      WHERE deleted_at IS NULL ${whereClause}
    `;
    
    const result = await this.db.queryOne<{ total: number }>(sql, params);
    return result?.total || 0;
  }

  /**
   * Batch save patients
   * @complexity O(n * log n) where n is number of patients
   */
  async saveMany(patients: Patient[]): Promise<Patient[]> {
    if (patients.length === 0) {
      return [];
    }

    return await this.db.transaction(async (conn) => {
      const savedPatients: Patient[] = [];
      
      for (const patient of patients) {
        const data = this.mapEntityToRow(patient);
        
        // Use UPSERT (INSERT ... ON DUPLICATE KEY UPDATE for MySQL, INSERT ... ON CONFLICT for PostgreSQL)
        const upsertSql = `
          INSERT INTO ${this.tableName} 
          (id, name, age, gender, email, phone, address, conditions, allergies, medications,
           heart_rate, blood_pressure, temperature, oxygen_saturation, vitals_recorded_at,
           created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON DUPLICATE KEY UPDATE
          name = VALUES(name), age = VALUES(age), gender = VALUES(gender),
          email = VALUES(email), phone = VALUES(phone), address = VALUES(address),
          conditions = VALUES(conditions), allergies = VALUES(allergies), medications = VALUES(medications),
          heart_rate = VALUES(heart_rate), blood_pressure = VALUES(blood_pressure),
          temperature = VALUES(temperature), oxygen_saturation = VALUES(oxygen_saturation),
          vitals_recorded_at = VALUES(vitals_recorded_at), updated_at = CURRENT_TIMESTAMP
        `;
        
        await conn.execute(upsertSql, [
          data.id, data.name, data.age, data.gender, data.email, data.phone, data.address,
          data.conditions, data.allergies, data.medications,
          data.heart_rate, data.blood_pressure, data.temperature,
          data.oxygen_saturation, data.vitals_recorded_at
        ]);

        // Fetch saved patient
        const savedRow = await conn.queryOne<PatientRow>(
          `SELECT * FROM ${this.tableName} WHERE id = ? AND deleted_at IS NULL`,
          [patient.getId().toString()]
        );

        if (savedRow) {
          savedPatients.push(this.mapRowToEntity(savedRow));
        }
      }

      return savedPatients;
    });
  }

  /**
   * Find patients with abnormal vital signs
   * @complexity O(n) for full table scan, can be optimized with computed columns
   */
  async findWithAbnormalVitals(): Promise<Patient[]> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE deleted_at IS NULL 
      AND (
        heart_rate < 60 OR heart_rate > 100 OR
        temperature < 36.0 OR temperature > 37.5 OR
        oxygen_saturation < 95
      )
      ORDER BY created_at DESC
    `;
    
    const rows = await this.db.query<PatientRow>(sql);
    return rows.map(row => this.mapRowToEntity(row));
  }

  // Private helper methods

  private buildWhereClause(criteria: SearchCriteria): { whereClause: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];

    if (criteria.name) {
      conditions.push("name LIKE ?");
      params.push(`%${criteria.name}%`);
    }

    if (criteria.gender) {
      conditions.push("gender = ?");
      params.push(criteria.gender);
    }

    if (criteria.age) {
      if (criteria.age.min !== undefined) {
        conditions.push("age >= ?");
        params.push(criteria.age.min);
      }
      if (criteria.age.max !== undefined) {
        conditions.push("age <= ?");
        params.push(criteria.age.max);
      }
    }

    if (criteria.conditions && criteria.conditions.length > 0) {
      // JSON search for conditions
      const conditionChecks = criteria.conditions.map(() => "JSON_SEARCH(conditions, 'one', ?) IS NOT NULL");
      conditions.push(`(${conditionChecks.join(" OR ")})`);
      params.push(...criteria.conditions);
    }

    const whereClause = conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "";
    return { whereClause, params };
  }

  private mapRowToEntity(row: PatientRow): Patient {
    const conditions = row.conditions ? JSON.parse(row.conditions) : [];
    const allergies = row.allergies ? JSON.parse(row.allergies) : [];
    const medications = row.medications ? JSON.parse(row.medications) : [];

    let vitalSigns: VitalSigns | undefined;
    if (row.heart_rate && row.blood_pressure && row.temperature && row.oxygen_saturation) {
      vitalSigns = new VitalSigns(
        row.heart_rate,
        row.blood_pressure,
        row.temperature,
        row.oxygen_saturation
      );
    }

    return Patient.create({
      id: row.id,
      name: row.name,
      age: row.age,
      gender: row.gender,
      email: row.email,
      phone: row.phone,
      address: row.address,
      conditions,
      allergies,
      medications,
      vitalSigns: vitalSigns ? {
        heartRate: vitalSigns.getHeartRate(),
        bloodPressure: vitalSigns.getBloodPressure(),
        temperature: vitalSigns.getTemperature(),
        oxygenSaturation: vitalSigns.getOxygenSaturation()
      } : undefined
    });
  }

  private mapEntityToRow(patient: Patient): Omit<PatientRow, 'created_at' | 'updated_at'> {
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
      conditions: JSON.stringify(medicalRecord.getConditions()),
      allergies: JSON.stringify(medicalRecord.getAllergies()),
      medications: JSON.stringify(medicalRecord.getMedications()),
      heart_rate: vitalSigns?.getHeartRate(),
      blood_pressure: vitalSigns?.getBloodPressure(),
      temperature: vitalSigns?.getTemperature(),
      oxygen_saturation: vitalSigns?.getOxygenSaturation(),
      vitals_recorded_at: vitalSigns?.getRecordedAt()
    };
  }
}

// Database Schema Migration
export const PATIENT_TABLE_SCHEMA = `
CREATE TABLE IF NOT EXISTS patients (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  age INT NOT NULL CHECK (age >= 0 AND age <= 150),
  gender VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  conditions JSON,
  allergies JSON,
  medications JSON,
  heart_rate INT CHECK (heart_rate >= 30 AND heart_rate <= 250),
  blood_pressure VARCHAR(20),
  temperature DECIMAL(4,2) CHECK (temperature >= 30.0 AND temperature <= 45.0),
  oxygen_saturation INT CHECK (oxygen_saturation >= 0 AND oxygen_saturation <= 100),
  vitals_recorded_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  INDEX idx_name (name),
  INDEX idx_age (age),
  INDEX idx_gender (gender),
  INDEX idx_email (email),
  INDEX idx_created_at (created_at),
  INDEX idx_deleted_at (deleted_at),
  INDEX idx_vitals_abnormal (heart_rate, temperature, oxygen_saturation),
  
  -- Composite indexes for common query patterns
  INDEX idx_age_gender (age, gender),
  INDEX idx_name_age (name, age),
  
  -- JSON indexes for condition searches (MySQL 8.0+)
  INDEX idx_conditions ((CAST(conditions AS JSON ARRAY))),
  INDEX idx_allergies ((CAST(allergies AS JSON ARRAY)))
);
`;