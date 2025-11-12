import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import * as db from '../db';
import { TRPCError } from '@trpc/server';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_EXPIRES_IN = '15m';
const JWT_REFRESH_EXPIRES_IN = '7d';

// Password requirements
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// Rate limiting for login attempts
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  crm?: string;
  specialty?: string;
  sessionId: string;
}

// Validation schemas
export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(PASSWORD_MIN_LENGTH).regex(PASSWORD_REGEX, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  }),
  crm: z.string().min(4).max(20),
  specialty: z.string().min(2).max(100),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
  twoFactorCode: z.string().optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(PASSWORD_MIN_LENGTH).regex(PASSWORD_REGEX),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Encryption utilities
export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
  
  static encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.ALGORITHM, this.KEY);
    cipher.setAAD(Buffer.from('vitaia-medical-data'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }
  
  static decrypt(encryptedData: { encrypted: string; iv: string; tag: string }): string {
    const decipher = crypto.createDecipher(this.ALGORITHM, this.KEY);
    decipher.setAAD(Buffer.from('vitaia-medical-data'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  // Hash sensitive data for searching
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data + process.env.HASH_SALT || 'vitaia-salt').digest('hex');
  }
}

// Password utilities
export class PasswordService {
  static async hash(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }
  
  static async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
  
  static validate(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < PASSWORD_MIN_LENGTH) {
      errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`);
    }
    
    if (!PASSWORD_REGEX.test(password)) {
      errors.push('Password must contain uppercase, lowercase, number, and special character');
    }
    
    return { valid: errors.length === 0, errors };
  }
}

// JWT utilities
export class JWTService {
  static generateTokens(payload: Omit<JWTPayload, 'sessionId'>): AuthTokens {
    const sessionId = crypto.randomUUID();
    const fullPayload: JWTPayload = { ...payload, sessionId };
    
    const accessToken = jwt.sign(fullPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'vitaia-medical-ai',
      audience: 'vitaia-users'
    });
    
    const refreshToken = jwt.sign(
      { userId: payload.userId, sessionId },
      JWT_REFRESH_SECRET,
      {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
        issuer: 'vitaia-medical-ai',
        audience: 'vitaia-users'
      }
    );
    
    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 // 15 minutes in seconds
    };
  }
  
  static verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'vitaia-medical-ai',
        audience: 'vitaia-users'
      }) as JWTPayload;
    } catch (error) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired access token'
      });
    }
  }
  
  static verifyRefreshToken(token: string): { userId: number; sessionId: string } {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET, {
        issuer: 'vitaia-medical-ai',
        audience: 'vitaia-users'
      }) as { userId: number; sessionId: string };
    } catch (error) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired refresh token'
      });
    }
  }
}

// Authentication service
export class AuthService {
  static async register(data: z.infer<typeof registerSchema>) {
    // Check if user already exists
    const existingUser = await db.getUserByEmail(data.email);
    if (existingUser) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'User with this email already exists'
      });
    }
    
    // Validate CRM uniqueness
    const existingCRM = await db.getUserByCRM(data.crm);
    if (existingCRM) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'CRM already registered'
      });
    }
    
    // Hash password
    const hashedPassword = await PasswordService.hash(data.password);
    
    // Generate unique openId
    const openId = crypto.randomUUID();
    
    // Create user
    const user = await db.createUser({
      openId,
      name: data.name,
      email: data.email,
      password: hashedPassword,
      crm: data.crm,
      specialty: data.specialty,
      loginMethod: 'email',
      role: 'user',
      isActive: true,
      emailVerified: false
    });
    
    // Generate tokens
    const tokens = JWTService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      crm: user.crm,
      specialty: user.specialty
    });
    
    // Log registration
    await db.createAuditLog({
      userId: user.id,
      action: 'user_registered',
      resourceType: 'user',
      resourceId: user.id,
      details: JSON.stringify({ email: user.email, crm: user.crm })
    });
    
    return { user: this.sanitizeUser(user), tokens };
  }
  
  static async login(data: z.infer<typeof loginSchema>, ipAddress?: string) {
    const user = await db.getUserByEmail(data.email);
    
    if (!user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password'
      });
    }
    
    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Account is temporarily locked due to too many failed login attempts'
      });
    }
    
    // Check if account is active
    if (!user.isActive) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Account is deactivated'
      });
    }
    
    // Verify password
    const isValidPassword = await PasswordService.verify(data.password, user.password || '');
    
    if (!isValidPassword) {
      // Increment failed login attempts
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      const shouldLock = failedAttempts >= MAX_LOGIN_ATTEMPTS;
      
      await db.updateUser(user.id, {
        failedLoginAttempts: failedAttempts,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_TIME) : undefined
      });
      
      // Log failed attempt
      await db.createAuditLog({
        userId: user.id,
        action: 'login_failed',
        resourceType: 'user',
        resourceId: user.id,
        details: JSON.stringify({ reason: 'invalid_password', attempts: failedAttempts }),
        ipAddress
      });
      
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: shouldLock 
          ? 'Too many failed attempts. Account locked for 15 minutes.'
          : 'Invalid email or password'
      });
    }
    
    // Check 2FA if enabled
    if (user.twoFactorEnabled && !data.twoFactorCode) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Two-factor authentication code required'
      });
    }
    
    if (user.twoFactorEnabled && data.twoFactorCode) {
      const isValid2FA = await this.verify2FA(user.id, data.twoFactorCode);
      if (!isValid2FA) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid two-factor authentication code'
        });
      }
    }
    
    // Reset failed attempts and update last sign in
    await db.updateUser(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastSignedIn: new Date()
    });
    
    // Generate tokens
    const tokens = JWTService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      crm: user.crm,
      specialty: user.specialty
    });
    
    // Log successful login
    await db.createAuditLog({
      userId: user.id,
      action: 'user_logged_in',
      resourceType: 'user',
      resourceId: user.id,
      details: JSON.stringify({ method: 'email', twoFactor: user.twoFactorEnabled }),
      ipAddress
    });
    
    return { user: this.sanitizeUser(user), tokens };
  }
  
  static async refreshToken(refreshToken: string) {
    const payload = JWTService.verifyRefreshToken(refreshToken);
    
    const user = await db.getUserById(payload.userId);
    if (!user || !user.isActive) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not found or inactive'
      });
    }
    
    // Generate new tokens
    const tokens = JWTService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      crm: user.crm,
      specialty: user.specialty
    });
    
    return { user: this.sanitizeUser(user), tokens };
  }
  
  static async changePassword(userId: number, data: z.infer<typeof changePasswordSchema>) {
    const user = await db.getUserById(userId);
    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found'
      });
    }
    
    // Verify current password
    const isValidPassword = await PasswordService.verify(data.currentPassword, user.password || '');
    if (!isValidPassword) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const hashedPassword = await PasswordService.hash(data.newPassword);
    
    // Update password
    await db.updateUser(userId, {
      password: hashedPassword,
      lastPasswordChange: new Date()
    });
    
    // Log password change
    await db.createAuditLog({
      userId,
      action: 'password_changed',
      resourceType: 'user',
      resourceId: userId,
      details: JSON.stringify({ timestamp: new Date().toISOString() })
    });
    
    return { success: true };
  }
  
  private static async verify2FA(userId: number, code: string): Promise<boolean> {
    // Implementation for 2FA verification
    // This would integrate with services like Google Authenticator, Authy, etc.
    // For now, returning true as placeholder
    return true;
  }
  
  private static sanitizeUser(user: any) {
    const { password, twoFactorSecret, ...sanitized } = user;
    return sanitized;
  }
}

// Session management
export class SessionService {
  private static activeSessions = new Map<string, { userId: number; lastActivity: Date }>();
  
  static createSession(sessionId: string, userId: number) {
    this.activeSessions.set(sessionId, {
      userId,
      lastActivity: new Date()
    });
  }
  
  static updateActivity(sessionId: string) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
  }
  
  static isSessionValid(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;
    
    // Session expires after 24 hours of inactivity
    const maxInactivity = 24 * 60 * 60 * 1000; // 24 hours
    return Date.now() - session.lastActivity.getTime() < maxInactivity;
  }
  
  static invalidateSession(sessionId: string) {
    this.activeSessions.delete(sessionId);
  }
  
  static cleanupExpiredSessions() {
    const now = Date.now();
    const maxInactivity = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now - session.lastActivity.getTime() > maxInactivity) {
        this.activeSessions.delete(sessionId);
      }
    }
  }
}

// Cleanup expired sessions every hour
setInterval(() => {
  SessionService.cleanupExpiredSessions();
}, 60 * 60 * 1000);