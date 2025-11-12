import { Request, Response, NextFunction } from "express";
import { ENV } from "./env";
import {
  securityHeaders,
  RateLimiter,
  InputValidator,
  AnomalyDetector,
} from "./security";
import * as db from "../db";

// Security headers middleware
export function securityHeadersMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (ENV.enableSecurityHeaders) {
    Object.entries(securityHeaders).forEach(([header, value]) => {
      res.setHeader(header, value);
    });
  }
  next();
}

// Rate limiting middleware
export function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!ENV.enableRateLimit) {
    return next();
  }

  const clientId = req.ip || "unknown";
  const rateLimiter = new RateLimiter();

  // General rate limit: 1000 requests per hour
  if (!rateLimiter.checkLimit(`general:${clientId}`, 1000, 3600000)) {
    return res.status(429).json({
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter: 3600,
    });
  }

  next();
}

// Input validation middleware
export function inputValidationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const validator = new InputValidator();

  // Validate request body
  if (req.body && typeof req.body === "object") {
    const bodyString = JSON.stringify(req.body);
    const validation = validator.validateInput(bodyString);

    if (!validation.isValid) {
      // Log security threat
      console.warn("[SECURITY] Input validation failed:", {
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        threats: validation.threats,
        path: req.path,
      });

      return res.status(400).json({
        error: "Invalid input detected",
        message: "Request contains potentially dangerous content",
      });
    }
  }

  next();
}

// Audit logging middleware
export function auditMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!ENV.enableAuditLog) {
    return next();
  }

  const startTime = Date.now();

  // Log request
  const auditData = {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    timestamp: new Date(),
  };

  // Override res.end to capture response
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any) {
    const duration = Date.now() - startTime;

    // Log response
    db.createAuditLog({
      action: `${req.method}_${req.path}`,
      resourceType: "api",
      details: JSON.stringify({
        ...auditData,
        statusCode: res.statusCode,
        duration,
      }),
      ipAddress: req.ip,
    }).catch(console.error);

    // Call original end
    originalEnd.call(this, chunk, encoding);
  };

  next();
}

// Anomaly detection middleware
export function anomalyDetectionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Check for unusual hours
  if (AnomalyDetector.detectUnusualHours()) {
    AnomalyDetector.logAnomaly("UNUSUAL_HOURS_ACCESS", {
      ip: req.ip,
      path: req.path,
      time: new Date(),
      userAgent: req.headers["user-agent"],
    });
  }

  // Check for rapid requests (basic implementation)
  const clientId = req.ip || "unknown";
  const rateLimiter = new RateLimiter();

  // If more than 50 requests in 1 minute, flag as suspicious
  if (!rateLimiter.checkLimit(`anomaly:${clientId}`, 50, 60000)) {
    AnomalyDetector.logAnomaly("RAPID_REQUESTS", {
      ip: req.ip,
      path: req.path,
      time: new Date(),
    });
  }

  next();
}

// CORS middleware for production
export function corsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const allowedOrigins = ENV.isProduction
    ? ["https://yourdomain.com"] // Configure your production domains
    : ["http://localhost:3000", "http://localhost:5000"];

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  next();
}

// Error handling middleware
export function errorHandlingMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("[ERROR]", error);

  // Log error for audit
  if (ENV.enableAuditLog) {
    db.createAuditLog({
      action: "ERROR",
      resourceType: "api",
      details: JSON.stringify({
        error: error.message,
        stack: ENV.isDevelopment ? error.stack : undefined,
        path: req.path,
        method: req.method,
      }),
      ipAddress: req.ip,
    }).catch(console.error);
  }

  // Don't expose internal errors in production
  const message = ENV.isProduction ? "Internal server error" : error.message;

  res.status(500).json({
    error: "Internal Server Error",
    message,
    ...(ENV.isDevelopment && { stack: error.stack }),
  });
}

// Health check middleware
export function healthCheckMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.path === "/health" || req.path === "/api/health") {
    return res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: ENV.isProduction ? "production" : "development",
      services: {
        database: !!ENV.databaseUrl,
        ai: {
          openai: !!ENV.openaiApiKey,
          gemini: !!ENV.geminiApiKey,
          deepseek: !!ENV.deepseekApiKey,
        },
      },
    });
  }
  next();
}
