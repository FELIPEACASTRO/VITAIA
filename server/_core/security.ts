import crypto from 'crypto';
import { z } from 'zod';
import * as db from '../db';
import { TRPCError } from '@trpc/server';

// Security configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100;
const ANOMALY_THRESHOLD = 0.8; // 80% confidence for anomaly detection

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Security headers
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};

// Input validation and sanitization
export class InputValidator {
  // Medical data validation schemas
  static readonly medicalRecordSchema = z.object({
    symptoms: z.string().max(5000).regex(/^[a-zA-Z0-9\s\.,;:\-\(\)\/]+$/, 'Invalid characters in symptoms'),
    diagnosis: z.string().max(1000).regex(/^[a-zA-Z0-9\s\.,;:\-\(\)\/]+$/, 'Invalid characters in diagnosis'),
    treatment: z.string().max(2000).regex(/^[a-zA-Z0-9\s\.,;:\-\(\)\/]+$/, 'Invalid characters in treatment'),
    medications: z.string().max(1000).regex(/^[a-zA-Z0-9\s\.,;:\-\(\)\/\+]+$/, 'Invalid characters in medications'),
    notes: z.string().max(3000).regex(/^[a-zA-Z0-9\s\.,;:\-\(\)\/\n\r]+$/, 'Invalid characters in notes')
  });

  static readonly patientDataSchema = z.object({
    name: z.string().min(2).max(100).regex(/^[a-zA-ZÀ-ÿ\s\-\'\.]+$/, 'Invalid characters in name'),
    email: z.string().email().max(320),
    phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format'),
    cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}\-\d{2}$|^\d{11}$/, 'Invalid CPF format'),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
  });

  static readonly examResultSchema = z.object({
    examType: z.string().max(100).regex(/^[a-zA-Z0-9\s\-\_]+$/, 'Invalid exam type'),
    results: z.string().max(10000),
    normalRange: z.string().max(500),
    interpretation: z.string().max(2000)
  });

  // Sanitize HTML content
  static sanitizeHtml(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Validate and sanitize medical data
  static validateMedicalData(data: any, schema: z.ZodSchema): any {
    try {
      const validated = schema.parse(data);
      
      // Additional sanitization for text fields
      const sanitized = { ...validated };
      for (const [key, value] of Object.entries(sanitized)) {
        if (typeof value === 'string') {
          sanitized[key] = this.sanitizeHtml(value.trim());
        }
      }
      
      return sanitized;
    } catch (error) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid input data',
        cause: error
      });
    }
  }

  // Check for SQL injection patterns
  static detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(;|\-\-|\/\*|\*\/)/,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(\'\s*(OR|AND)\s*\'\w*\'\s*=\s*\'\w*)/i
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
  }

  // Check for XSS patterns
  static detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  }
}

// Rate limiting
export class RateLimiter {
  static checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const key = `rate_limit:${identifier}`;
    
    const current = rateLimitStore.get(key);
    
    if (!current || now > current.resetTime) {
      // Reset or create new window
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW
      });
      return true;
    }
    
    if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
      return false;
    }
    
    current.count++;
    return true;
  }

  static getRemainingRequests(identifier: string): number {
    const key = `rate_limit:${identifier}`;
    const current = rateLimitStore.get(key);
    
    if (!current || Date.now() > current.resetTime) {
      return RATE_LIMIT_MAX_REQUESTS;
    }
    
    return Math.max(0, RATE_LIMIT_MAX_REQUESTS - current.count);
  }
}

// Anomaly detection for fraud prevention
export class AnomalyDetector {
  // Detect unusual user behavior patterns
  static async detectUserAnomalies(userId: number): Promise<{
    isAnomalous: boolean;
    score: number;
    reasons: string[];
  }> {
    const reasons: string[] = [];
    let anomalyScore = 0;

    // Get user's recent activity
    const recentLogs = await db.getRecentAuditLogs(userId, 24); // Last 24 hours
    
    // Check for unusual activity patterns
    const loginCount = recentLogs.filter(log => log.action === 'user_logged_in').length;
    const patientCreationCount = recentLogs.filter(log => log.action === 'patient_created').length;
    const consultationCount = recentLogs.filter(log => log.action === 'consultation_created').length;

    // Unusual login frequency
    if (loginCount > 20) {
      anomalyScore += 0.3;
      reasons.push('Excessive login attempts');
    }

    // Unusual patient creation rate
    if (patientCreationCount > 50) {
      anomalyScore += 0.4;
      reasons.push('Excessive patient creation');
    }

    // Unusual consultation rate
    if (consultationCount > 100) {
      anomalyScore += 0.3;
      reasons.push('Excessive consultation creation');
    }

    // Check for suspicious IP patterns
    const uniqueIPs = new Set(recentLogs.map(log => log.ipAddress).filter(Boolean));
    if (uniqueIPs.size > 10) {
      anomalyScore += 0.2;
      reasons.push('Multiple IP addresses');
    }

    // Check for off-hours activity (assuming business hours 8-18)
    const offHoursActivity = recentLogs.filter(log => {
      const hour = new Date(log.createdAt).getHours();
      return hour < 8 || hour > 18;
    }).length;

    if (offHoursActivity > recentLogs.length * 0.7) {
      anomalyScore += 0.2;
      reasons.push('Excessive off-hours activity');
    }

    return {
      isAnomalous: anomalyScore >= ANOMALY_THRESHOLD,
      score: Math.min(anomalyScore, 1.0),
      reasons
    };
  }

  // Detect suspicious consultation patterns
  static async detectConsultationAnomalies(consultationData: any): Promise<{
    isAnomalous: boolean;
    score: number;
    reasons: string[];
  }> {
    const reasons: string[] = [];
    let anomalyScore = 0;

    // Check for duplicate or template-like content
    if (consultationData.symptoms && consultationData.symptoms.length < 10) {
      anomalyScore += 0.2;
      reasons.push('Suspiciously short symptom description');
    }

    // Check for repetitive patterns
    const words = consultationData.symptoms?.split(' ') || [];
    const uniqueWords = new Set(words);
    if (words.length > 20 && uniqueWords.size / words.length < 0.3) {
      anomalyScore += 0.3;
      reasons.push('Repetitive content detected');
    }

    // Check for potential data injection
    if (consultationData.symptoms && InputValidator.detectSQLInjection(consultationData.symptoms)) {
      anomalyScore += 0.8;
      reasons.push('Potential SQL injection attempt');
    }

    if (consultationData.symptoms && InputValidator.detectXSS(consultationData.symptoms)) {
      anomalyScore += 0.8;
      reasons.push('Potential XSS attempt');
    }

    return {
      isAnomalous: anomalyScore >= ANOMALY_THRESHOLD,
      score: Math.min(anomalyScore, 1.0),
      reasons
    };
  }

  // Log detected anomalies
  static async logAnomaly(
    detectionType: string,
    resourceType: string,
    resourceId: number,
    anomalyScore: number,
    description: string,
    features: any,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) {
    await db.createAnomalyDetection({
      detectionType,
      resourceType,
      resourceId,
      anomalyScore: Math.round(anomalyScore * 100),
      description,
      features: JSON.stringify(features),
      severity,
      status: 'open'
    });
  }
}

// Data masking for sensitive information
export class DataMasker {
  // Mask CPF (Brazilian tax ID)
  static maskCPF(cpf: string): string {
    if (!cpf) return '';
    return cpf.replace(/(\d{3})\d{3}(\d{3})/, '$1.***.$2-**');
  }

  // Mask email
  static maskEmail(email: string): string {
    if (!email) return '';
    const [username, domain] = email.split('@');
    if (username.length <= 2) return email;
    return `${username.substring(0, 2)}***@${domain}`;
  }

  // Mask phone number
  static maskPhone(phone: string): string {
    if (!phone) return '';
    return phone.replace(/(\d{2})\d{4}(\d{4})/, '$1****$2');
  }

  // Mask medical record numbers
  static maskMedicalRecord(record: string): string {
    if (!record) return '';
    if (record.length <= 4) return '****';
    return `****${record.slice(-4)}`;
  }

  // Mask sensitive medical data for logs
  static maskMedicalData(data: any): any {
    const masked = { ...data };
    
    if (masked.cpf) masked.cpf = this.maskCPF(masked.cpf);
    if (masked.email) masked.email = this.maskEmail(masked.email);
    if (masked.phone) masked.phone = this.maskPhone(masked.phone);
    if (masked.medicalRecord) masked.medicalRecord = this.maskMedicalRecord(masked.medicalRecord);
    
    // Mask detailed medical information in logs
    if (masked.symptoms) masked.symptoms = '[MEDICAL_DATA_MASKED]';
    if (masked.diagnosis) masked.diagnosis = '[MEDICAL_DATA_MASKED]';
    if (masked.treatment) masked.treatment = '[MEDICAL_DATA_MASKED]';
    if (masked.examResults) masked.examResults = '[MEDICAL_DATA_MASKED]';
    
    return masked;
  }
}

// Security audit logging
export class SecurityAudit {
  static async logSecurityEvent(
    eventType: 'authentication' | 'authorization' | 'data_access' | 'anomaly' | 'security_violation',
    userId: number | null,
    details: any,
    severity: 'info' | 'warning' | 'error' | 'critical' = 'info',
    ipAddress?: string
  ) {
    await db.createAuditLog({
      userId,
      action: `security_${eventType}`,
      resourceType: 'security',
      resourceId: null,
      details: JSON.stringify({
        eventType,
        severity,
        timestamp: new Date().toISOString(),
        ...DataMasker.maskMedicalData(details)
      }),
      ipAddress
    });

    // For critical events, also create system metrics
    if (severity === 'critical') {
      await db.createSystemMetric({
        metricName: `security_critical_${eventType}`,
        metricValue: 1,
        unit: 'count',
        category: 'security',
        tags: JSON.stringify({ severity, userId, ipAddress })
      });
    }
  }

  // Check for brute force attacks
  static async checkBruteForce(identifier: string, action: string): Promise<boolean> {
    const recentAttempts = await db.getRecentSecurityEvents(identifier, action, 15); // Last 15 minutes
    
    if (recentAttempts.length > 10) {
      await this.logSecurityEvent(
        'security_violation',
        null,
        { 
          type: 'brute_force_detected',
          identifier,
          action,
          attempts: recentAttempts.length
        },
        'critical',
        identifier
      );
      return true;
    }
    
    return false;
  }
}

// GDPR/LGPD compliance utilities
export class ComplianceManager {
  // Generate data export for patient (right to data portability)
  static async exportPatientData(patientId: number): Promise<any> {
    const patient = await db.getPatientById(patientId);
    if (!patient) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Patient not found'
      });
    }

    const consultations = await db.getConsultationsByPatient(patientId);
    const examResults = await db.getExamResultsByPatient(patientId);
    const medicalImages = await db.getMedicalImagesByPatient(patientId);
    const consents = await db.getAllPatientConsents(patientId);

    return {
      exportDate: new Date().toISOString(),
      patient,
      consultations,
      examResults,
      medicalImages,
      consents,
      dataRetentionPolicy: await db.getDataRetentionPolicy(patientId)
    };
  }

  // Anonymize patient data (right to be forgotten)
  static async anonymizePatientData(patientId: number, reason: string): Promise<void> {
    const anonymizedId = `ANON_${crypto.randomUUID()}`;
    
    // Update patient record with anonymized data
    await db.updatePatient(patientId, {
      name: 'ANONYMIZED',
      email: null,
      phone: null,
      medicalHistory: 'ANONYMIZED',
      currentMedications: 'ANONYMIZED'
    });

    // Update related records
    await db.anonymizePatientConsultations(patientId);
    await db.anonymizePatientExams(patientId);
    
    // Update retention policy
    await db.updateDataRetentionPolicy(patientId, {
      deletionCompletedDate: new Date(),
      deletionReason: reason
    });

    // Log anonymization
    await db.createAuditLog({
      userId: null,
      action: 'patient_anonymized',
      resourceType: 'patient',
      resourceId: patientId,
      details: JSON.stringify({ reason, anonymizedId })
    });
  }

  // Check consent validity
  static async checkConsentValidity(patientId: number, consentType: string): Promise<boolean> {
    const consent = await db.getPatientConsent(patientId, consentType);
    
    if (!consent || !consent.consentGiven) {
      return false;
    }

    // Check if consent has expired
    if (consent.expiryDate && consent.expiryDate < new Date()) {
      return false;
    }

    return true;
  }
}

// Clean up rate limiting store periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes