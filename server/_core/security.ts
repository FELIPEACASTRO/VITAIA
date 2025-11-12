import crypto from "crypto";

// Security headers for production
export const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
};

// Input validation class
export class InputValidator {
  private static readonly DANGEROUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
  ];

  private static readonly SQL_INJECTION_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(--|#|\/\*|\*\/)/g,
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/gi,
    /('|(\\')|(;))/g,
  ];

  validateInput(input: string): { isValid: boolean; threats: string[] } {
    const threats: string[] = [];

    // Check for XSS patterns
    for (const pattern of InputValidator.DANGEROUS_PATTERNS) {
      if (pattern.test(input)) {
        threats.push("XSS_ATTEMPT");
        break;
      }
    }

    // Check for SQL injection patterns
    for (const pattern of InputValidator.SQL_INJECTION_PATTERNS) {
      if (pattern.test(input)) {
        threats.push("SQL_INJECTION_ATTEMPT");
        break;
      }
    }

    // Check for excessive length
    if (input.length > 10000) {
      threats.push("EXCESSIVE_LENGTH");
    }

    return {
      isValid: threats.length === 0,
      threats,
    };
  }

  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, "") // Remove angle brackets
      .replace(/['"]/g, "") // Remove quotes
      .replace(/[;&|`$]/g, "") // Remove command injection chars
      .trim();
  }
}

// Rate limiting class
export class RateLimiter {
  private static store = new Map<
    string,
    { count: number; resetTime: number }
  >();

  checkLimit(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const record = RateLimiter.store.get(key);

    if (!record || now > record.resetTime) {
      // Create new record or reset expired one
      RateLimiter.store.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (record.count >= maxRequests) {
      return false; // Rate limit exceeded
    }

    // Increment count
    record.count++;
    return true;
  }

  // Cleanup expired entries
  static cleanup(): void {
    const now = Date.now();
    for (const [key, value] of RateLimiter.store.entries()) {
      if (now > value.resetTime) {
        RateLimiter.store.delete(key);
      }
    }
  }
}

// Anomaly detection class
export class AnomalyDetector {
  private static readonly SUSPICIOUS_PATTERNS = {
    RAPID_REQUESTS: { threshold: 100, window: 60000 }, // 100 requests in 1 minute
    FAILED_LOGINS: { threshold: 10, window: 300000 }, // 10 failed logins in 5 minutes
    UNUSUAL_HOURS: { startHour: 2, endHour: 6 }, // Activity between 2-6 AM
    GEOGRAPHIC_ANOMALY: { maxDistance: 1000 }, // km
  };

  static detectRapidRequests(userId: number, requestCount: number): boolean {
    const { threshold, window } = this.SUSPICIOUS_PATTERNS.RAPID_REQUESTS;
    return requestCount > threshold;
  }

  static detectFailedLogins(attempts: number): boolean {
    const { threshold } = this.SUSPICIOUS_PATTERNS.FAILED_LOGINS;
    return attempts >= threshold;
  }

  static detectUnusualHours(): boolean {
    const hour = new Date().getHours();
    const { startHour, endHour } = this.SUSPICIOUS_PATTERNS.UNUSUAL_HOURS;
    return hour >= startHour && hour <= endHour;
  }

  static async logAnomaly(
    type: string,
    details: Record<string, any>
  ): Promise<void> {
    console.warn(`[SECURITY ANOMALY] ${type}:`, details);
    // In production, this would save to database and trigger alerts
  }
}

// Data masking class
export class DataMasker {
  static maskEmail(email: string): string {
    const [local, domain] = email.split("@");
    if (!local || !domain) return email;

    const maskedLocal =
      local.length > 2
        ? local[0] + "*".repeat(local.length - 2) + local[local.length - 1]
        : local;

    return `${maskedLocal}@${domain}`;
  }

  static maskCRM(crm: string): string {
    if (crm.length <= 4) return crm;
    return (
      crm.substring(0, 2) +
      "*".repeat(crm.length - 4) +
      crm.substring(crm.length - 2)
    );
  }

  static maskCPF(cpf: string): string {
    return cpf.replace(/(\d{3})\d{3}(\d{3})/, "$1***$2");
  }

  static maskPhone(phone: string): string {
    return phone.replace(/(\d{2})\d{4}(\d{4})/, "$1****$2");
  }
}

// Security audit class
export class SecurityAudit {
  static async auditUserAccess(
    userId: number,
    action: string,
    resource: string
  ): Promise<void> {
    const auditData = {
      userId,
      action,
      resource,
      timestamp: new Date(),
      ip: "unknown", // Would be passed from context
      userAgent: "unknown", // Would be passed from context
    };

    console.log("[SECURITY AUDIT]", auditData);
    // In production, save to audit log table
  }

  static async detectSuspiciousActivity(userId: number): Promise<boolean> {
    // Check for various suspicious patterns
    const checks = [
      AnomalyDetector.detectUnusualHours(),
      // Add more checks as needed
    ];

    const suspiciousCount = checks.filter(Boolean).length;

    if (suspiciousCount > 0) {
      await AnomalyDetector.logAnomaly("SUSPICIOUS_ACTIVITY", {
        userId,
        checks: checks.map((result, index) => ({ check: index, result })),
      });
      return true;
    }

    return false;
  }
}

// Compliance manager class
export class ComplianceManager {
  // Generate data export for patient (right to data portability)
  static async exportPatientData(patientId: number): Promise<any> {
    // In production, this would gather all patient data from various tables
    return {
      patientId,
      exportDate: new Date().toISOString(),
      data: {
        // Would include all patient data
      },
      format: "JSON",
      encryption: "AES-256",
    };
  }

  // Anonymize patient data (right to be forgotten)
  static async anonymizePatientData(patientId: number): Promise<void> {
    console.log(`[COMPLIANCE] Anonymizing data for patient ${patientId}`);
    // In production, this would:
    // 1. Replace personal data with anonymized values
    // 2. Keep medical data for research (if consented)
    // 3. Log the anonymization process
  }

  // Check data retention policies
  static async checkDataRetention(): Promise<void> {
    console.log("[COMPLIANCE] Checking data retention policies");
    // In production, this would:
    // 1. Find data past retention period
    // 2. Schedule for deletion/anonymization
    // 3. Notify relevant parties
  }
}

// Encryption utilities
export class EncryptionUtils {
  private static readonly ALGORITHM = "aes-256-gcm";
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;

  static generateKey(): Buffer {
    return crypto.randomBytes(this.KEY_LENGTH);
  }

  static encrypt(
    text: string,
    key: Buffer
  ): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    return {
      encrypted,
      iv: iv.toString("hex"),
      tag: cipher.getAuthTag().toString("hex"),
    };
  }

  static decrypt(
    encryptedData: { encrypted: string; iv: string; tag: string },
    key: Buffer
  ): string {
    const iv = Buffer.from(encryptedData.iv, "hex");
    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
    decipher.setAuthTag(Buffer.from(encryptedData.tag, "hex"));

    let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }
}

// Initialize cleanup interval
setInterval(() => {
  RateLimiter.cleanup();
}, 300000); // Cleanup every 5 minutes
