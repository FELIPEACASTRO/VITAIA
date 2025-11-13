import { describe, it, expect } from 'vitest';
import { Email } from '../../../../server/domain/value-objects/Email';

/**
 * Testes unitários simplificados para Value Object Email
 * Foca nos casos de uso mais importantes
 */
describe('Email Value Object - Simplified', () => {
  describe('Valid email creation', () => {
    it('should create valid email', () => {
      const email = Email.create('test@example.com');
      expect(email.getValue()).toBe('test@example.com');
    });
    
    it('should normalize to lowercase', () => {
      const email = Email.create('TEST@EXAMPLE.COM');
      expect(email.getValue()).toBe('test@example.com');
    });
    
    it('should trim whitespace', () => {
      const email = Email.create('  test@example.com  ');
      expect(email.getValue()).toBe('test@example.com');
    });
  });
  
  describe('Email validation', () => {
    it('should validate correct emails', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com'
      ];
      
      validEmails.forEach(email => {
        expect(Email.isValid(email)).toBe(true);
      });
    });
    
    it('should invalidate obviously incorrect emails', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        '',
        ' '
      ];
      
      invalidEmails.forEach(email => {
        expect(Email.isValid(email)).toBe(false);
      });
    });
  });
  
  describe('Domain extraction', () => {
    it('should extract domain correctly', () => {
      const email = Email.create('test@example.com');
      expect(email.getDomain()).toBe('example.com');
    });
  });
  
  describe('Equality', () => {
    it('should compare emails correctly', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('TEST@EXAMPLE.COM');
      const email3 = Email.create('other@example.com');
      
      expect(email1.equals(email2)).toBe(true);
      expect(email1.equals(email3)).toBe(false);
    });
  });
  
  describe('String representation', () => {
    it('should return email as string', () => {
      const email = Email.create('TEST@EXAMPLE.COM');
      expect(email.toString()).toBe('test@example.com');
    });
  });
});