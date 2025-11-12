import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from './trpc';
import { AuthService, loginSchema, registerSchema } from './auth';
import { SecurityService } from './security';
import { db } from '../db';
import { users, auditLogs } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export const authRouter = router({
  // Login do usuário
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Rate limiting por IP
        const clientId = ctx.req.ip || 'unknown';
        if (!SecurityService.checkRateLimit(`login:${clientId}`, 5, 300000)) { // 5 tentativas por 5 minutos
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'Muitas tentativas de login. Tente novamente em 5 minutos.',
          });
        }

        // Validar entrada contra ameaças
        const validation = SecurityService.validateInputSecurity(JSON.stringify(input));
        if (!validation.isValid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Entrada inválida detectada',
          });
        }

        const result = await AuthService.login(input.email, input.password);

        // Log de auditoria
        await db.insert(auditLogs).values({
          userId: result.user.id,
          action: 'LOGIN_SUCCESS',
          resourceType: 'auth',
          details: JSON.stringify({
            email: input.email,
            loginMethod: 'email',
            userAgent: ctx.req.headers['user-agent'],
          }),
          ipAddress: ctx.req.ip,
        });

        return {
          success: true,
          user: result.user,
          token: result.token,
        };
      } catch (error) {
        // Log de tentativa de login falhada
        await db.insert(auditLogs).values({
          action: 'LOGIN_FAILED',
          resourceType: 'auth',
          details: JSON.stringify({
            email: input.email,
            error: error instanceof Error ? error.message : 'Unknown error',
            userAgent: ctx.req.headers['user-agent'],
          }),
          ipAddress: ctx.req.ip,
        });

        throw error;
      }
    }),

  // Registro de novo usuário
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Rate limiting por IP
        const clientId = ctx.req.ip || 'unknown';
        if (!SecurityService.checkRateLimit(`register:${clientId}`, 3, 3600000)) { // 3 registros por hora
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'Muitas tentativas de registro. Tente novamente em 1 hora.',
          });
        }

        // Validar CRM
        if (!SecurityService.validateCRM(input.crm)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'CRM inválido. Use o formato: 123456/UF',
          });
        }

        const result = await AuthService.register(input);

        // Log de auditoria
        await db.insert(auditLogs).values({
          userId: result.user.id,
          action: 'REGISTER_SUCCESS',
          resourceType: 'auth',
          details: JSON.stringify({
            email: input.email,
            name: input.name,
            crm: input.crm,
            specialty: input.specialty,
            userAgent: ctx.req.headers['user-agent'],
          }),
          ipAddress: ctx.req.ip,
        });

        return {
          success: true,
          user: result.user,
          token: result.token,
        };
      } catch (error) {
        // Log de tentativa de registro falhada
        await db.insert(auditLogs).values({
          action: 'REGISTER_FAILED',
          resourceType: 'auth',
          details: JSON.stringify({
            email: input.email,
            error: error instanceof Error ? error.message : 'Unknown error',
            userAgent: ctx.req.headers['user-agent'],
          }),
          ipAddress: ctx.req.ip,
        });

        throw error;
      }
    }),

  // Obter usuário atual
  me: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado',
        });
      }

      // Buscar dados completos do usuário
      const userResult = await db.select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (userResult.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuário não encontrado',
        });
      }

      const user = userResult[0];
      
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

  // Logout (invalidar token)
  logout: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado',
        });
      }

      // Log de auditoria
      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        action: 'LOGOUT',
        resourceType: 'auth',
        details: JSON.stringify({
          userAgent: ctx.req.headers['user-agent'],
        }),
        ipAddress: ctx.req.ip,
      });

      return { success: true, message: 'Logout realizado com sucesso' };
    }),

  // Alterar senha
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
      newPassword: z.string().min(8, 'Nova senha deve ter pelo menos 8 caracteres'),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado',
        });
      }

      // Buscar usuário atual
      const userResult = await db.select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (userResult.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Usuário não encontrado',
        });
      }

      const user = userResult[0];

      // Verificar senha atual
      if (user.password) {
        const isValidPassword = await AuthService.verifyPassword(input.currentPassword, user.password);
        if (!isValidPassword) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Senha atual incorreta',
          });
        }
      }

      // Gerar hash da nova senha
      const newPasswordHash = await AuthService.hashPassword(input.newPassword);

      // Atualizar senha
      await db.update(users)
        .set({
          password: newPasswordHash,
          lastPasswordChange: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      // Log de auditoria
      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        action: 'PASSWORD_CHANGE',
        resourceType: 'auth',
        details: JSON.stringify({
          userAgent: ctx.req.headers['user-agent'],
        }),
        ipAddress: ctx.req.ip,
      });

      return { success: true, message: 'Senha alterada com sucesso' };
    }),

  // Verificar força da senha
  checkPasswordStrength: publicProcedure
    .input(z.object({
      password: z.string(),
    }))
    .query(({ input }) => {
      const password = input.password;
      let score = 0;
      const feedback: string[] = [];

      // Critérios de força
      if (password.length >= 8) score += 1;
      else feedback.push('Use pelo menos 8 caracteres');

      if (password.length >= 12) score += 1;
      else feedback.push('Use pelo menos 12 caracteres para maior segurança');

      if (/[a-z]/.test(password)) score += 1;
      else feedback.push('Inclua letras minúsculas');

      if (/[A-Z]/.test(password)) score += 1;
      else feedback.push('Inclua letras maiúsculas');

      if (/[0-9]/.test(password)) score += 1;
      else feedback.push('Inclua números');

      if (/[^A-Za-z0-9]/.test(password)) score += 1;
      else feedback.push('Inclua símbolos especiais');

      // Verificar padrões comuns
      const commonPatterns = [
        /123456/,
        /password/i,
        /qwerty/i,
        /abc123/i,
      ];

      if (commonPatterns.some(pattern => pattern.test(password))) {
        score -= 2;
        feedback.push('Evite sequências ou palavras comuns');
      }

      const strength = score <= 2 ? 'fraca' : score <= 4 ? 'média' : 'forte';

      return {
        score: Math.max(0, score),
        strength,
        feedback,
      };
    }),

  // Estatísticas de segurança (admin only)
  getSecurityStats: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Acesso restrito a administradores',
        });
      }

      // Buscar estatísticas dos últimos 30 dias
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [
        totalUsers,
        activeUsers,
        loginAttempts,
        failedLogins,
        registrations,
      ] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(users),
        db.select({ count: sql<number>`count(*)` })
          .from(users)
          .where(and(
            eq(users.isActive, true),
            gte(users.lastSignedIn, thirtyDaysAgo)
          )),
        db.select({ count: sql<number>`count(*)` })
          .from(auditLogs)
          .where(and(
            eq(auditLogs.action, 'LOGIN_SUCCESS'),
            gte(auditLogs.createdAt, thirtyDaysAgo)
          )),
        db.select({ count: sql<number>`count(*)` })
          .from(auditLogs)
          .where(and(
            eq(auditLogs.action, 'LOGIN_FAILED'),
            gte(auditLogs.createdAt, thirtyDaysAgo)
          )),
        db.select({ count: sql<number>`count(*)` })
          .from(auditLogs)
          .where(and(
            eq(auditLogs.action, 'REGISTER_SUCCESS'),
            gte(auditLogs.createdAt, thirtyDaysAgo)
          )),
      ]);

      return {
        totalUsers: totalUsers[0]?.count || 0,
        activeUsers: activeUsers[0]?.count || 0,
        loginAttempts: loginAttempts[0]?.count || 0,
        failedLogins: failedLogins[0]?.count || 0,
        registrations: registrations[0]?.count || 0,
        successRate: loginAttempts[0]?.count 
          ? Math.round((loginAttempts[0].count / (loginAttempts[0].count + (failedLogins[0]?.count || 0))) * 100)
          : 0,
      };
    }),
});