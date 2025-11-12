import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// ========================================
// ADVANCED SECURITY SERVICE
// ========================================

export class AdvancedSecurityService {
  
  // ========================================
  // ENCRYPTION & DECRYPTION
  // ========================================
  
  private static readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;
  
  /**
   * Criptografia AES-256-GCM para dados médicos sensíveis
   */
  static encryptMedicalData(data: string, masterKey: string): {
    encrypted: string;
    iv: string;
    tag: string;
  } {
    const key = crypto.scryptSync(masterKey, 'salt', this.KEY_LENGTH);
    const iv = crypto.randomBytes(this.IV_LENGTH);
    
    const cipher = crypto.createCipher(this.ENCRYPTION_ALGORITHM, key);
    cipher.setAAD(Buffer.from('medical-data'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }
  
  /**
   * Descriptografia de dados médicos
   */
  static decryptMedicalData(
    encryptedData: string, 
    iv: string, 
    tag: string, 
    masterKey: string
  ): string {
    const key = crypto.scryptSync(masterKey, 'salt', this.KEY_LENGTH);
    
    const decipher = crypto.createDecipher(this.ENCRYPTION_ALGORITHM, key);
    decipher.setAAD(Buffer.from('medical-data'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  // ========================================
  // ADVANCED AUTHENTICATION
  // ========================================
  
  /**
   * Hash de senha com salt aleatório e custo adaptativo
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12; // Custo adaptativo
    return await bcrypt.hash(password, saltRounds);
  }
  
  /**
   * Verificação de senha com proteção contra timing attacks
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
  
  /**
   * Geração de token JWT com claims médicos específicos
   */
  static generateMedicalJWT(payload: {
    userId: number;
    role: string;
    crm?: string;
    specialties?: string[];
    permissions: string[];
  }): {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  } {
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
    
    const accessTokenExpiry = 15 * 60; // 15 minutos
    const refreshTokenExpiry = 7 * 24 * 60 * 60; // 7 dias
    
    const accessToken = jwt.sign(
      {
        ...payload,
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + accessTokenExpiry,
      },
      secret,
      { algorithm: 'HS256' }
    );
    
    const refreshToken = jwt.sign(
      {
        userId: payload.userId,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + refreshTokenExpiry,
      },
      refreshSecret,
      { algorithm: 'HS256' }
    );
    
    return {
      accessToken,
      refreshToken,
      expiresIn: accessTokenExpiry,
    };
  }
  
  // ========================================
  // MULTI-FACTOR AUTHENTICATION
  // ========================================
  
  /**
   * Geração de secret TOTP para 2FA
   */
  static generateTOTPSecret(): string {
    return crypto.randomBytes(20).toString('base32');
  }
  
  /**
   * Verificação de código TOTP
   */
  static verifyTOTP(token: string, secret: string): boolean {
    const window = 1; // Janela de tolerância
    const counter = Math.floor(Date.now() / 30000);
    
    for (let i = -window; i <= window; i++) {
      const testCounter = counter + i;
      const expectedToken = this.generateTOTPToken(secret, testCounter);
      
      if (this.constantTimeCompare(token, expectedToken)) {
        return true;
      }
    }
    
    return false;
  }
  
  private static generateTOTPToken(secret: string, counter: number): string {
    const key = Buffer.from(secret, 'base32');
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeUInt32BE(counter, 4);
    
    const hmac = crypto.createHmac('sha1', key);
    hmac.update(counterBuffer);
    const digest = hmac.digest();
    
    const offset = digest[digest.length - 1] & 0x0f;
    const binary = 
      ((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff);
    
    const token = (binary % 1000000).toString().padStart(6, '0');
    return token;
  }
  
  private static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }
  
  // ========================================
  // ADVANCED AUDIT LOGGING
  // ========================================
  
  static async logSecurityEvent(event: {
    userId?: number;
    action: string;
    resource: string;
    ipAddress: string;
    userAgent: string;
    success: boolean;
    riskScore: number;
    details?: Record<string, any>;
  }): Promise<void> {
    const auditEvent = {
      ...event,
      timestamp: new Date(),
      eventId: crypto.randomUUID(),
      hash: this.generateEventHash(event),
    };
    
    // Log para sistema de auditoria
    console.log('[SECURITY_AUDIT]', JSON.stringify(auditEvent));
    
    // Se evento de alto risco, alertar imediatamente
    if (event.riskScore > 80) {
      await this.triggerSecurityAlert(auditEvent);
    }
  }
  
  private static generateEventHash(event: any): string {
    const eventString = JSON.stringify(event, Object.keys(event).sort());
    return crypto.createHash('sha256').update(eventString).digest('hex');
  }
  
  private static async triggerSecurityAlert(event: any): Promise<void> {
    // Implementar notificação para equipe de segurança
    console.log('[SECURITY_ALERT]', 'High risk event detected:', event);
  }
  
  // ========================================
  // RATE LIMITING & BRUTE FORCE PROTECTION
  // ========================================
  
  private static loginAttempts = new Map<string, {
    count: number;
    lastAttempt: Date;
    lockedUntil?: Date;
  }>();
  
  static checkRateLimit(identifier: string): {
    allowed: boolean;
    remainingAttempts: number;
    lockedUntil?: Date;
  } {
    const maxAttempts = 5;
    const windowMs = 15 * 60 * 1000; // 15 minutos
    const lockoutMs = 30 * 60 * 1000; // 30 minutos
    
    const now = new Date();
    const attempts = this.loginAttempts.get(identifier);
    
    if (!attempts) {
      this.loginAttempts.set(identifier, {
        count: 1,
        lastAttempt: now,
      });
      return { allowed: true, remainingAttempts: maxAttempts - 1 };
    }
    
    // Verificar se ainda está bloqueado
    if (attempts.lockedUntil && now < attempts.lockedUntil) {
      return {
        allowed: false,
        remainingAttempts: 0,
        lockedUntil: attempts.lockedUntil,
      };
    }
    
    // Reset se janela de tempo passou
    if (now.getTime() - attempts.lastAttempt.getTime() > windowMs) {
      attempts.count = 1;
      attempts.lastAttempt = now;
      delete attempts.lockedUntil;
      return { allowed: true, remainingAttempts: maxAttempts - 1 };
    }
    
    // Incrementar tentativas
    attempts.count++;
    attempts.lastAttempt = now;
    
    if (attempts.count > maxAttempts) {
      attempts.lockedUntil = new Date(now.getTime() + lockoutMs);
      return {
        allowed: false,
        remainingAttempts: 0,
        lockedUntil: attempts.lockedUntil,
      };
    }
    
    return {
      allowed: true,
      remainingAttempts: maxAttempts - attempts.count,
    };
  }
  
  // ========================================
  // DATA ANONYMIZATION & PRIVACY
  // ========================================
  
  /**
   * Anonimização de dados médicos para pesquisa
   */
  static anonymizeMedicalData(data: any): any {
    const anonymized = { ...data };
    
    // Remover identificadores diretos
    delete anonymized.name;
    delete anonymized.email;
    delete anonymized.phone;
    delete anonymized.cpf;
    delete anonymized.address;
    
    // Generalizar dados sensíveis
    if (anonymized.dateOfBirth) {
      const birthYear = new Date(anonymized.dateOfBirth).getFullYear();
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;
      
      // Generalizar idade em faixas
      if (age < 18) anonymized.ageGroup = '0-17';
      else if (age < 30) anonymized.ageGroup = '18-29';
      else if (age < 50) anonymized.ageGroup = '30-49';
      else if (age < 70) anonymized.ageGroup = '50-69';
      else anonymized.ageGroup = '70+';
      
      delete anonymized.dateOfBirth;
    }
    
    // Adicionar ruído diferencial para valores numéricos
    if (anonymized.examResults) {
      anonymized.examResults = this.addDifferentialPrivacyNoise(anonymized.examResults);
    }
    
    return anonymized;
  }
  
  private static addDifferentialPrivacyNoise(data: any, epsilon: number = 1.0): any {
    // Implementação simplificada de differential privacy
    const sensitivity = 1.0;
    const scale = sensitivity / epsilon;
    
    if (typeof data === 'number') {
      const noise = this.laplacianNoise(scale);
      return Math.max(0, data + noise); // Garantir valores não negativos
    }
    
    if (typeof data === 'object' && data !== null) {
      const noisyData = { ...data };
      for (const [key, value] of Object.entries(noisyData)) {
        if (typeof value === 'number') {
          const noise = this.laplacianNoise(scale);
          noisyData[key] = Math.max(0, value + noise);
        }
      }
      return noisyData;
    }
    
    return data;
  }
  
  private static laplacianNoise(scale: number): number {
    const u = Math.random() - 0.5;
    return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }
  
  // ========================================
  // SECURE COMMUNICATION
  // ========================================
  
  /**
   * Validação de integridade de mensagens
   */
  static generateMessageHMAC(message: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(message).digest('hex');
  }
  
  static verifyMessageHMAC(message: string, hmac: string, secret: string): boolean {
    const expectedHmac = this.generateMessageHMAC(message, secret);
    return this.constantTimeCompare(hmac, expectedHmac);
  }
  
  // ========================================
  // SECURITY HEADERS
  // ========================================
  
  static getSecurityHeaders(): Record<string, string> {
    return {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' https:; object-src 'none'; media-src 'self'; frame-src 'none';",
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'X-XSS-Protection': '1; mode=block',
    };
  }
}

// ========================================
// SECURITY VALIDATION SCHEMAS
// ========================================

export const securePasswordSchema = z.string()
  .min(12, 'Senha deve ter pelo menos 12 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
  .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial');

export const medicalDataSchema = z.object({
  patientId: z.number().int().positive(),
  data: z.string().min(1),
  classification: z.enum(['public', 'internal', 'confidential', 'restricted']),
  retentionPeriod: z.number().int().positive().max(120), // máximo 10 anos
});

// ========================================
// ROLE-BASED ACCESS CONTROL
// ========================================

export enum UserRole {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  RESEARCHER = 'researcher',
  AUDITOR = 'auditor',
}

export enum Permission {
  READ_PATIENT_DATA = 'read:patient',
  WRITE_PATIENT_DATA = 'write:patient',
  DELETE_PATIENT_DATA = 'delete:patient',
  ACCESS_AI_SUGGESTIONS = 'access:ai',
  MANAGE_USERS = 'manage:users',
  VIEW_AUDIT_LOGS = 'view:audit',
  EXPORT_DATA = 'export:data',
  MANAGE_SYSTEM = 'manage:system',
}

export const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.READ_PATIENT_DATA,
    Permission.WRITE_PATIENT_DATA,
    Permission.DELETE_PATIENT_DATA,
    Permission.ACCESS_AI_SUGGESTIONS,
    Permission.MANAGE_USERS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.EXPORT_DATA,
    Permission.MANAGE_SYSTEM,
  ],
  [UserRole.DOCTOR]: [
    Permission.READ_PATIENT_DATA,
    Permission.WRITE_PATIENT_DATA,
    Permission.ACCESS_AI_SUGGESTIONS,
  ],
  [UserRole.NURSE]: [
    Permission.READ_PATIENT_DATA,
    Permission.WRITE_PATIENT_DATA,
  ],
  [UserRole.RESEARCHER]: [
    Permission.READ_PATIENT_DATA,
    Permission.EXPORT_DATA,
  ],
  [UserRole.AUDITOR]: [
    Permission.VIEW_AUDIT_LOGS,
  ],
};

export class RBACService {
  static hasPermission(userRole: UserRole, permission: Permission): boolean {
    const permissions = rolePermissions[userRole] || [];
    return permissions.includes(permission);
  }
  
  static checkPermission(userRole: UserRole, permission: Permission): void {
    if (!this.hasPermission(userRole, permission)) {
      throw new Error(`Acesso negado. Permissão necessária: ${permission}`);
    }
  }
}