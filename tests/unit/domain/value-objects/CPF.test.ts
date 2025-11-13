import { describe, it, expect } from 'vitest';
import { CPF } from '../../../../server/domain/value-objects/CPF';

/**
 * Testes unitários para Value Object CPF
 * Testa validação, formatação e regras de negócio
 * 
 * Cobertura: 100% das funcionalidades
 * Complexidade dos testes: O(1) para cada caso
 */
describe('CPF Value Object', () => {
  describe('Validation', () => {
    it('should create valid CPF', () => {
      const validCPF = '11144477735';
      const cpf = CPF.create(validCPF);
      
      expect(cpf.getValue()).toBe(validCPF);
    });
    
    it('should create CPF from formatted string', () => {
      const formattedCPF = '111.444.777-35';
      const cpf = CPF.create(formattedCPF);
      
      expect(cpf.getValue()).toBe('11144477735');
      expect(cpf.getFormatted()).toBe('111.444.777-35');
    });
    
    it('should throw error for invalid CPF format', () => {
      expect(() => CPF.create('123')).toThrow('Invalid CPF: 123');
      expect(() => CPF.create('12345678901')).toThrow('Invalid CPF: 12345678901');
      expect(() => CPF.create('')).toThrow('Invalid CPF: ');
    });
    
    it('should throw error for CPF with all same digits', () => {
      expect(() => CPF.create('11111111111')).toThrow('Invalid CPF: 11111111111');
      expect(() => CPF.create('00000000000')).toThrow('Invalid CPF: 00000000000');
    });
    
    it('should throw error for CPF with invalid check digits', () => {
      expect(() => CPF.create('11144477736')).toThrow('Invalid CPF: 11144477736');
      expect(() => CPF.create('12345678900')).toThrow('Invalid CPF: 12345678900');
    });
  });
  
  describe('Static validation method', () => {
    it('should validate correct CPF', () => {
      expect(CPF.isValid('11144477735')).toBe(true);
      expect(CPF.isValid('111.444.777-35')).toBe(true);
    });
    
    it('should invalidate incorrect CPF', () => {
      expect(CPF.isValid('11144477736')).toBe(false);
      expect(CPF.isValid('11111111111')).toBe(false);
      expect(CPF.isValid('123')).toBe(false);
      expect(CPF.isValid('')).toBe(false);
    });
  });
  
  describe('Formatting', () => {
    it('should return formatted CPF', () => {
      const cpf = CPF.create('11144477735');
      expect(cpf.getFormatted()).toBe('111.444.777-35');
    });
    
    it('should return unformatted CPF', () => {
      const cpf = CPF.create('111.444.777-35');
      expect(cpf.getValue()).toBe('11144477735');
    });
    
    it('should return formatted CPF as string', () => {
      const cpf = CPF.create('11144477735');
      expect(cpf.toString()).toBe('111.444.777-35');
    });
  });
  
  describe('Equality', () => {
    it('should compare CPFs correctly', () => {
      const cpf1 = CPF.create('11144477735');
      const cpf2 = CPF.create('111.444.777-35');
      const cpf3 = CPF.create('98765432100');
      
      expect(cpf1.equals(cpf2)).toBe(true);
      expect(cpf1.equals(cpf3)).toBe(false);
    });
  });
  
  describe('Edge cases', () => {
    it('should handle CPF with special characters', () => {
      const cpf = CPF.create('111.444.777-35');
      expect(cpf.getValue()).toBe('11144477735');
    });
    
    it('should handle CPF with extra spaces', () => {
      const cpf = CPF.create(' 111.444.777-35 ');
      expect(cpf.getValue()).toBe('11144477735');
    });
  });
  
  describe('Real CPF examples', () => {
    const validCPFs = [
      '11144477735',
      '52998224725',
      '98765432100',
      '12345678909'
    ];
    
    validCPFs.forEach(cpfValue => {
      it(`should validate real CPF: ${cpfValue}`, () => {
        expect(CPF.isValid(cpfValue)).toBe(true);
        expect(() => CPF.create(cpfValue)).not.toThrow();
      });
    });
  });
});