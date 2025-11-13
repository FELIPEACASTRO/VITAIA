import { CPF } from '../value-objects/CPF';
import { Email } from '../value-objects/Email';

/**
 * Entidade Patient seguindo Domain-Driven Design
 * Encapsula regras de negócio e invariantes do domínio
 * 
 * Complexidade de criação: O(1)
 * Complexidade de validação: O(1)
 */
export class Patient {
  private constructor(
    private readonly id: string,
    private readonly cpf: CPF,
    private name: string,
    private email: Email,
    private birthDate: Date,
    private gender: 'M' | 'F' | 'Other',
    private phone: string,
    private address: string,
    private emergencyContact: string,
    private allergies: string[],
    private chronicConditions: string[],
    private currentMedications: string[],
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}
  
  /**
   * Factory method para criar novo paciente
   * Implementa validações de negócio
   */
  public static create(data: {
    id: string;
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
  }): Patient {
    // Validações de negócio
    if (!data.name.trim()) {
      throw new Error('Patient name is required');
    }
    
    if (data.birthDate > new Date()) {
      throw new Error('Birth date cannot be in the future');
    }
    
    const age = Patient.calculateAge(data.birthDate);
    if (age > 150) {
      throw new Error('Invalid birth date: age cannot exceed 150 years');
    }
    
    const cpf = CPF.create(data.cpf);
    const email = Email.create(data.email);
    const now = new Date();
    
    return new Patient(
      data.id,
      cpf,
      data.name.trim(),
      email,
      data.birthDate,
      data.gender,
      data.phone,
      data.address,
      data.emergencyContact,
      data.allergies || [],
      data.chronicConditions || [],
      data.currentMedications || [],
      now,
      now
    );
  }
  
  /**
   * Calcula idade do paciente
   * @param birthDate Data de nascimento
   * @returns Idade em anos
   */
  public static calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
  
  // Getters
  public getId(): string { return this.id; }
  public getCPF(): CPF { return this.cpf; }
  public getName(): string { return this.name; }
  public getEmail(): Email { return this.email; }
  public getBirthDate(): Date { return this.birthDate; }
  public getGender(): 'M' | 'F' | 'Other' { return this.gender; }
  public getPhone(): string { return this.phone; }
  public getAddress(): string { return this.address; }
  public getEmergencyContact(): string { return this.emergencyContact; }
  public getAllergies(): string[] { return [...this.allergies]; }
  public getChronicConditions(): string[] { return [...this.chronicConditions]; }
  public getCurrentMedications(): string[] { return [...this.currentMedications]; }
  public getCreatedAt(): Date { return this.createdAt; }
  public getUpdatedAt(): Date { return this.updatedAt; }
  
  /**
   * Calcula idade atual do paciente
   */
  public getAge(): number {
    return Patient.calculateAge(this.birthDate);
  }
  
  /**
   * Verifica se o paciente é menor de idade
   */
  public isMinor(): boolean {
    return this.getAge() < 18;
  }
  
  /**
   * Verifica se o paciente é idoso
   */
  public isElderly(): boolean {
    return this.getAge() >= 65;
  }
  
  /**
   * Atualiza informações do paciente
   */
  public updateInfo(data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    emergencyContact?: string;
  }): void {
    if (data.name !== undefined) {
      if (!data.name.trim()) {
        throw new Error('Patient name cannot be empty');
      }
      this.name = data.name.trim();
    }
    
    if (data.email !== undefined) {
      this.email = Email.create(data.email);
    }
    
    if (data.phone !== undefined) {
      this.phone = data.phone;
    }
    
    if (data.address !== undefined) {
      this.address = data.address;
    }
    
    if (data.emergencyContact !== undefined) {
      this.emergencyContact = data.emergencyContact;
    }
    
    this.updatedAt = new Date();
  }
  
  /**
   * Adiciona alergia
   */
  public addAllergy(allergy: string): void {
    if (!allergy.trim()) {
      throw new Error('Allergy description cannot be empty');
    }
    
    if (!this.allergies.includes(allergy)) {
      this.allergies.push(allergy);
      this.updatedAt = new Date();
    }
  }
  
  /**
   * Remove alergia
   */
  public removeAllergy(allergy: string): void {
    const index = this.allergies.indexOf(allergy);
    if (index > -1) {
      this.allergies.splice(index, 1);
      this.updatedAt = new Date();
    }
  }
  
  /**
   * Adiciona condição crônica
   */
  public addChronicCondition(condition: string): void {
    if (!condition.trim()) {
      throw new Error('Chronic condition description cannot be empty');
    }
    
    if (!this.chronicConditions.includes(condition)) {
      this.chronicConditions.push(condition);
      this.updatedAt = new Date();
    }
  }
  
  /**
   * Remove condição crônica
   */
  public removeChronicCondition(condition: string): void {
    const index = this.chronicConditions.indexOf(condition);
    if (index > -1) {
      this.chronicConditions.splice(index, 1);
      this.updatedAt = new Date();
    }
  }
  
  /**
   * Adiciona medicação atual
   */
  public addCurrentMedication(medication: string): void {
    if (!medication.trim()) {
      throw new Error('Medication description cannot be empty');
    }
    
    if (!this.currentMedications.includes(medication)) {
      this.currentMedications.push(medication);
      this.updatedAt = new Date();
    }
  }
  
  /**
   * Remove medicação atual
   */
  public removeCurrentMedication(medication: string): void {
    const index = this.currentMedications.indexOf(medication);
    if (index > -1) {
      this.currentMedications.splice(index, 1);
      this.updatedAt = new Date();
    }
  }
  
  /**
   * Converte para objeto simples para persistência
   */
  public toPlainObject() {
    return {
      id: this.id,
      cpf: this.cpf.getValue(),
      name: this.name,
      email: this.email.getValue(),
      birthDate: this.birthDate,
      gender: this.gender,
      phone: this.phone,
      address: this.address,
      emergencyContact: this.emergencyContact,
      allergies: this.allergies,
      chronicConditions: this.chronicConditions,
      currentMedications: this.currentMedications,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}