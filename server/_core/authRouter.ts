import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "./trpc";
import { AuthService, loginSchema, registerSchema } from "./auth";
import { RateLimiter, InputValidator } from "./security";
import * as db from "../db";

export const authRouter = router({
  // User login
  login: publicProcedure.input(loginSchema).mutation(async ({ input, ctx }) => {
    try {
      // Rate limiting by IP
      const clientId = ctx.req.ip || "unknown";
      const rateLimiter = new RateLimiter();
      if (!rateLimiter.checkLimit(`login:${clientId}`, 5, 300000)) {
        // 5 attempts per 5 minutes
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many login attempts. Try again in 5 minutes.",
        });
      }

      // Validate input against threats
      const validator = new InputValidator();
      const validation = validator.validateInput(JSON.stringify(input));
      if (!validation.isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid input detected",
        });
      }

      const result = await AuthService.login(input.email, input.password);

      // Audit log
      await db.createAuditLog({
        userId: result.user.id,
        action: "LOGIN_SUCCESS",
        resourceType: "auth",
        details: JSON.stringify({
          email: input.email,
          loginMethod: "email",
          userAgent: ctx.req.headers["user-agent"],
        }),
        ipAddress: ctx.req.ip,
      });

      return {
        success: true,
        user: result.user,
        token: result.token,
      };
    } catch (error) {
      // Log failed login attempt
      await db.createAuditLog({
        action: "LOGIN_FAILED",
        resourceType: "auth",
        details: JSON.stringify({
          email: input.email,
          error: error instanceof Error ? error.message : "Unknown error",
          userAgent: ctx.req.headers["user-agent"],
        }),
        ipAddress: ctx.req.ip,
      });

      throw error;
    }
  }),

  // User registration
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Rate limiting by IP
        const clientId = ctx.req.ip || "unknown";
        const rateLimiter = new RateLimiter();
        if (!rateLimiter.checkLimit(`register:${clientId}`, 3, 3600000)) {
          // 3 registrations per hour
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many registration attempts. Try again in 1 hour.",
          });
        }

        // Validate CRM (basic implementation)
        const crmRegex = /^\d{4,6}\/[A-Z]{2}$/;
        if (input.crm && !crmRegex.test(input.crm)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid CRM. Use format: 123456/UF",
          });
        }

        const result = await AuthService.register(input);

        // Audit log
        await db.createAuditLog({
          userId: result.user.id,
          action: "REGISTER_SUCCESS",
          resourceType: "auth",
          details: JSON.stringify({
            email: input.email,
            name: input.name,
            crm: input.crm,
            specialty: input.specialty,
            userAgent: ctx.req.headers["user-agent"],
          }),
          ipAddress: ctx.req.ip,
        });

        return {
          success: true,
          user: result.user,
          token: result.token,
        };
      } catch (error) {
        // Log failed registration attempt
        await db.createAuditLog({
          action: "REGISTER_FAILED",
          resourceType: "auth",
          details: JSON.stringify({
            email: input.email,
            error: error instanceof Error ? error.message : "Unknown error",
            userAgent: ctx.req.headers["user-agent"],
          }),
          ipAddress: ctx.req.ip,
        });

        throw error;
      }
    }),

  // Get current user
  me: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }

    // Get complete user data
    const user = await db.getUserById(ctx.user.id);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      crm: user.crm,
      specialty: user.specialty,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt,
      lastSignedIn: user.lastSignedIn,
    };
  }),

  // Logout (invalidate token)
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }

    // Audit log
    await db.createAuditLog({
      userId: ctx.user.id,
      action: "LOGOUT",
      resourceType: "auth",
      details: JSON.stringify({
        userAgent: ctx.req.headers["user-agent"],
      }),
      ipAddress: ctx.req.ip,
    });

    return { success: true, message: "Logout successful" };
  }),

  // Change password
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z
          .string()
          .min(8, "New password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      await AuthService.changePassword(
        ctx.user.id,
        input.currentPassword,
        input.newPassword
      );

      // Audit log
      await db.createAuditLog({
        userId: ctx.user.id,
        action: "PASSWORD_CHANGE",
        resourceType: "auth",
        details: JSON.stringify({
          userAgent: ctx.req.headers["user-agent"],
        }),
        ipAddress: ctx.req.ip,
      });

      return { success: true, message: "Password changed successfully" };
    }),

  // Check password strength
  checkPasswordStrength: publicProcedure
    .input(
      z.object({
        password: z.string(),
      })
    )
    .query(({ input }) => {
      const password = input.password;
      let score = 0;
      const feedback: string[] = [];

      // Strength criteria
      if (password.length >= 8) score += 1;
      else feedback.push("Use at least 8 characters");

      if (password.length >= 12) score += 1;
      else feedback.push("Use at least 12 characters for better security");

      if (/[a-z]/.test(password)) score += 1;
      else feedback.push("Include lowercase letters");

      if (/[A-Z]/.test(password)) score += 1;
      else feedback.push("Include uppercase letters");

      if (/[0-9]/.test(password)) score += 1;
      else feedback.push("Include numbers");

      if (/[^A-Za-z0-9]/.test(password)) score += 1;
      else feedback.push("Include special symbols");

      // Check common patterns
      const commonPatterns = [/123456/, /password/i, /qwerty/i, /abc123/i];

      if (commonPatterns.some(pattern => pattern.test(password))) {
        score -= 2;
        feedback.push("Avoid sequences or common words");
      }

      const strength = score <= 2 ? "weak" : score <= 4 ? "medium" : "strong";

      return {
        score: Math.max(0, score),
        strength,
        feedback,
      };
    }),
});
