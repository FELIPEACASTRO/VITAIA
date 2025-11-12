import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { ENV } from "./env";
import {
  securityHeadersMiddleware,
  rateLimitMiddleware,
  inputValidationMiddleware,
  auditMiddleware,
  anomalyDetectionMiddleware,
  corsMiddleware,
  errorHandlingMiddleware,
  healthCheckMiddleware,
} from "./middleware";

async function startServer() {
  const app = express();
  const server = createServer(app);

  console.log(`🚀 Starting VITAIA Medical AI Server...`);
  console.log(
    `📊 Environment: ${ENV.isProduction ? "PRODUCTION" : "DEVELOPMENT"}`
  );
  console.log(
    `🔒 Security features: ${ENV.enableSecurityHeaders ? "ENABLED" : "DISABLED"}`
  );
  console.log(
    `🛡️  Rate limiting: ${ENV.enableRateLimit ? "ENABLED" : "DISABLED"}`
  );
  console.log(
    `📝 Audit logging: ${ENV.enableAuditLog ? "ENABLED" : "DISABLED"}`
  );

  // Trust proxy for accurate IP addresses (important for rate limiting)
  app.set("trust proxy", 1);

  // Health check endpoint (before other middleware)
  app.use(healthCheckMiddleware);

  // Security middleware
  app.use(corsMiddleware);
  app.use(securityHeadersMiddleware);
  app.use(rateLimitMiddleware);
  app.use(anomalyDetectionMiddleware);

  // Body parsing middleware with security limits
  app.use(
    express.json({
      limit: ENV.isProduction ? "10mb" : "50mb",
      verify: (req, res, buf) => {
        // Store raw body for signature verification if needed
        (req as any).rawBody = buf;
      },
    })
  );
  app.use(
    express.urlencoded({
      limit: ENV.isProduction ? "10mb" : "50mb",
      extended: true,
    })
  );

  // Input validation middleware
  app.use(inputValidationMiddleware);

  // Audit logging middleware
  app.use(auditMiddleware);

  // API routes with tRPC
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError: ({ error, type, path, input, ctx, req }) => {
        console.error(`❌ tRPC Error [${type}] ${path}:`, error);

        // Log tRPC errors for audit
        if (ENV.enableAuditLog) {
          const auditData = {
            action: "TRPC_ERROR",
            resourceType: "api",
            details: JSON.stringify({
              type,
              path,
              error: error.message,
              input: ENV.isDevelopment ? input : "[REDACTED]",
              stack: ENV.isDevelopment ? error.stack : undefined,
            }),
            ipAddress: req?.ip,
          };

          // Don't await to avoid blocking
          import("../db").then(db => {
            db.createAuditLog(auditData).catch(console.error);
          });
        }
      },
    })
  );

  // API status endpoint
  app.get("/api/status", (req, res) => {
    res.json({
      status: "operational",
      version: process.env.npm_package_version || "1.0.0",
      timestamp: new Date().toISOString(),
      environment: ENV.isProduction ? "production" : "development",
      features: {
        multiProviderAI: true,
        securityHeaders: ENV.enableSecurityHeaders,
        rateLimit: ENV.enableRateLimit,
        auditLog: ENV.enableAuditLog,
        encryption: ENV.enableEncryption,
      },
      aiProviders: {
        openai: !!ENV.openaiApiKey,
        gemini: !!ENV.geminiApiKey,
        deepseek: !!ENV.deepseekApiKey,
        default: ENV.defaultAiProvider,
        multiProvider: ENV.enableMultiProvider,
      },
    });
  });

  // Development mode uses Vite, production mode uses static files
  if (ENV.isDevelopment) {
    console.log("🔧 Setting up Vite development server...");
    await setupVite(app, server);
  } else {
    console.log("📦 Serving static files...");
    serveStatic(app);
  }

  // 404 handler for API routes
  app.use("/api/*", (req, res) => {
    res.status(404).json({
      error: "Not Found",
      message: `API endpoint ${req.path} not found`,
      availableEndpoints: ["/api/trpc", "/api/status", "/api/health"],
    });
  });

  // Global error handling middleware (must be last)
  app.use(errorHandlingMiddleware);

  // Graceful shutdown handling
  const gracefulShutdown = (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);

    server.close(() => {
      console.log("✅ HTTP server closed");

      // Close database connections, cleanup resources, etc.
      process.exit(0);
    });

    // Force close after 30 seconds
    setTimeout(() => {
      console.error(
        "❌ Could not close connections in time, forcefully shutting down"
      );
      process.exit(1);
    }, 30000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  // Start server
  const port = ENV.port;
  const host = ENV.host;

  server.listen(port, host, () => {
    console.log(`\n🎉 VITAIA Medical AI Server is running!`);
    console.log(`🌐 Server: http://${host}:${port}/`);
    console.log(`🔗 API: http://${host}:${port}/api/trpc`);
    console.log(`💚 Health: http://${host}:${port}/health`);
    console.log(`📊 Status: http://${host}:${port}/api/status`);

    if (ENV.isDevelopment) {
      console.log(`\n🔧 Development features enabled:`);
      console.log(`   - Hot reload with Vite`);
      console.log(`   - Detailed error messages`);
      console.log(`   - Debug logging`);
    }

    if (ENV.isProduction) {
      console.log(`\n🔒 Production features enabled:`);
      console.log(`   - Security headers`);
      console.log(`   - Rate limiting`);
      console.log(`   - Audit logging`);
      console.log(`   - Error sanitization`);
    }

    console.log(`\n🤖 AI Providers configured:`);
    console.log(`   - OpenAI: ${ENV.openaiApiKey ? "✅" : "❌"}`);
    console.log(`   - Gemini: ${ENV.geminiApiKey ? "✅" : "❌"}`);
    console.log(`   - DeepSeek: ${ENV.deepseekApiKey ? "✅" : "❌"}`);
    console.log(`   - Default: ${ENV.defaultAiProvider}`);
    console.log(
      `   - Multi-provider: ${ENV.enableMultiProvider ? "✅" : "❌"}`
    );

    console.log(`\n🏥 Ready to serve medical AI requests!`);
  });

  // Handle server errors
  server.on("error", (error: any) => {
    if (error.code === "EADDRINUSE") {
      console.error(`❌ Port ${port} is already in use`);
      process.exit(1);
    } else {
      console.error("❌ Server error:", error);
      process.exit(1);
    }
  });
}

// Start the server
startServer().catch(error => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});
