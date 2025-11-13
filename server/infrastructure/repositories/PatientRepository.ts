import { IRepository, IPaginatedRepository, IFilterableRepository } from '../../domain/interfaces/IRepository';
import { db } from '../../db';
import { patients } from '../../../drizzle/schema';
import { eq, like, and, desc } from 'drizzle-orm';

/**
 * Implementação do repositório de pacientes seguindo Repository Pattern
 * Implementa Dependency Inversion Principle - depende de abstrações
 * 
 * Complexidade das operações:
 * - findById: O(1) - busca por chave primária
 * - findAll: O(n) - busca sequencial
 * - create: O(1) - inserção
 * - update: O(1) - atualização por chave primária
 * - delete: O(1) - remoção por chave primária
 */
export interface PatientFilter {
  name?: string;
  cpf?: string;
  email?: string;
  ageMin?: number;
  ageMax?: number;
  gender?: 'M' | 'F' | 'Other';
}

export interface PatientEntity {
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
  createdAt: Date;
  updatedAt: Date;
}

export class PatientRepository implements 
  IRepository<PatientEntity, string>,
  IPaginatedRepository<PatientEntity, string>,
  IFilterableRepository<PatientEntity, PatientFilter, string> {
  
  /**
   * Busca paciente por ID
   * Complexidade: O(1)
   */
  async findById(id: string): Promise<PatientEntity | null> {
    try {
      const result = await db
        .select()
        .from(patients)
        .where(eq(patients.id, id))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error finding patient by ID:', error);
      throw new Error(`Failed to find patient with ID: ${id}`);
    }
  }
  
  /**
   * Busca todos os pacientes
   * Complexidade: O(n)
   */
  async findAll(): Promise<PatientEntity[]> {
    try {
      return await db
        .select()
        .from(patients)
        .orderBy(desc(patients.createdAt));
    } catch (error) {
      console.error('Error finding all patients:', error);
      throw new Error('Failed to retrieve patients');
    }
  }
  
  /**
   * Cria novo paciente
   * Complexidade: O(1)
   */
  async create(entity: Omit<PatientEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<PatientEntity> {
    try {
      const now = new Date();
      const patientData = {
        ...entity,
        createdAt: now,
        updatedAt: now
      };
      
      const result = await db
        .insert(patients)
        .values(patientData)
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error creating patient:', error);
      
      // Tratamento específico para violações de restrição única
      if (error instanceof Error) {
        if (error.message.includes('unique constraint') || error.message.includes('UNIQUE constraint')) {
          if (error.message.includes('cpf')) {
            throw new Error('CPF already exists');
          }
          if (error.message.includes('email')) {
            throw new Error('Email already exists');
          }
        }
      }
      
      throw new Error('Failed to create patient');
    }
  }
  
  /**
   * Atualiza paciente existente
   * Complexidade: O(1)
   */
  async update(id: string, entity: Partial<PatientEntity>): Promise<PatientEntity | null> {
    try {
      const updateData = {
        ...entity,
        updatedAt: new Date()
      };
      
      // Remove campos que não devem ser atualizados
      delete (updateData as any).id;
      delete (updateData as any).createdAt;
      
      const result = await db
        .update(patients)
        .set(updateData)
        .where(eq(patients.id, id))
        .returning();
      
      return result[0] || null;
    } catch (error) {
      console.error('Error updating patient:', error);
      
      // Tratamento específico para violações de restrição única
      if (error instanceof Error) {
        if (error.message.includes('unique constraint') || error.message.includes('UNIQUE constraint')) {
          if (error.message.includes('cpf')) {
            throw new Error('CPF already exists');
          }
          if (error.message.includes('email')) {
            throw new Error('Email already exists');
          }
        }
      }
      
      throw new Error(`Failed to update patient with ID: ${id}`);
    }
  }
  
  /**
   * Remove paciente
   * Complexidade: O(1)
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await db
        .delete(patients)
        .where(eq(patients.id, id))
        .returning({ id: patients.id });
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting patient:', error);
      throw new Error(`Failed to delete patient with ID: ${id}`);
    }
  }
  
  /**
   * Busca paginada de pacientes
   * Complexidade: O(n) limitado por 'limit'
   */
  async findWithPagination(page: number, limit: number): Promise<{
    data: PatientEntity[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      if (page < 1) page = 1;
      if (limit < 1) limit = 10;
      if (limit > 100) limit = 100; // Limite máximo para performance
      
      const offset = (page - 1) * limit;
      
      // Busca dados e contagem total em paralelo
      const [data, totalResult] = await Promise.all([
        db
          .select()
          .from(patients)
          .orderBy(desc(patients.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: patients.id })
          .from(patients)
      ]);
      
      const total = totalResult.length;
      
      return {
        data,
        total,
        page,
        limit
      };
    } catch (error) {
      console.error('Error in paginated patient search:', error);
      throw new Error('Failed to retrieve patients with pagination');
    }
  }
  
  /**
   * Busca pacientes por filtros
   * Complexidade: O(n) com otimização por índices
   */
  async findByFilter(filter: PatientFilter): Promise<PatientEntity[]> {
    try {
      let query = db.select().from(patients);
      const conditions: any[] = [];
      
      // Aplicar filtros
      if (filter.name) {
        conditions.push(like(patients.name, `%${filter.name}%`));
      }
      
      if (filter.cpf) {
        conditions.push(eq(patients.cpf, filter.cpf.replace(/\D/g, '')));
      }
      
      if (filter.email) {
        conditions.push(like(patients.email, `%${filter.email}%`));
      }
      
      if (filter.gender) {
        conditions.push(eq(patients.gender, filter.gender));
      }
      
      // Filtros de idade requerem cálculo
      if (filter.ageMin !== undefined || filter.ageMax !== undefined) {
        const now = new Date();
        
        if (filter.ageMax !== undefined) {
          const minBirthDate = new Date(now.getFullYear() - filter.ageMax - 1, now.getMonth(), now.getDate());
          conditions.push(patients.birthDate.gte(minBirthDate));
        }
        
        if (filter.ageMin !== undefined) {
          const maxBirthDate = new Date(now.getFullYear() - filter.ageMin, now.getMonth(), now.getDate());
          conditions.push(patients.birthDate.lte(maxBirthDate));
        }
      }
      
      // Aplicar condições se existirem
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      return await query.orderBy(desc(patients.createdAt));
    } catch (error) {
      console.error('Error filtering patients:', error);
      throw new Error('Failed to filter patients');
    }
  }
  
  /**
   * Busca paciente por CPF
   * Método auxiliar para validações de unicidade
   * Complexidade: O(1) - busca por índice único
   */
  async findByCPF(cpf: string): Promise<PatientEntity | null> {
    try {
      const cleanCPF = cpf.replace(/\D/g, '');
      const result = await db
        .select()
        .from(patients)
        .where(eq(patients.cpf, cleanCPF))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error finding patient by CPF:', error);
      throw new Error('Failed to find patient by CPF');
    }
  }
  
  /**
   * Busca paciente por email
   * Método auxiliar para validações de unicidade
   * Complexidade: O(1) - busca por índice único
   */
  async findByEmail(email: string): Promise<PatientEntity | null> {
    try {
      const result = await db
        .select()
        .from(patients)
        .where(eq(patients.email, email.toLowerCase()))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error finding patient by email:', error);
      throw new Error('Failed to find patient by email');
    }
  }
  
  /**
   * Conta total de pacientes
   * Complexidade: O(1) - operação de agregação otimizada
   */
  async count(): Promise<number> {
    try {
      const result = await db
        .select({ count: patients.id })
        .from(patients);
      
      return result.length;
    } catch (error) {
      console.error('Error counting patients:', error);
      throw new Error('Failed to count patients');
    }
  }
}