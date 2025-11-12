import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from './trpc';
import { 
  MLOpsService, 
  createModelVersionSchema, 
  createExperimentSchema, 
  logPredictionSchema 
} from './mlops';
import { SecurityService } from './security';

export const mlopsRouter = router({
  // ========================================
  // MODEL MANAGEMENT
  // ========================================

  // Criar nova versão de modelo
  createModelVersion: protectedProcedure
    .input(createModelVersionSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado',
        });
      }

      return await MLOpsService.createModelVersion(input, ctx.user.id);
    }),

  // Obter modelo ativo
  getActiveModel: protectedProcedure
    .input(z.object({
      modelName: z.string().min(1, 'Nome do modelo é obrigatório'),
    }))
    .query(async ({ input }) => {
      return await MLOpsService.getActiveModel(input.modelName);
    }),

  // Implantar modelo
  deployModel: protectedProcedure
    .input(z.object({
      modelVersionId: z.number().int().positive(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado',
        });
      }

      // Apenas admins podem implantar modelos
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Apenas administradores podem implantar modelos',
        });
      }

      return await MLOpsService.deployModel(input.modelVersionId, ctx.user.id);
    }),

  // ========================================
  // EXPERIMENT TRACKING
  // ========================================

  // Criar experimento
  createExperiment: protectedProcedure
    .input(createExperimentSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado',
        });
      }

      return await MLOpsService.createExperiment(input, ctx.user.id);
    }),

  // Atualizar métricas do experimento
  updateExperimentMetrics: protectedProcedure
    .input(z.object({
      experimentId: z.number().int().positive(),
      metrics: z.record(z.any()),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado',
        });
      }

      return await MLOpsService.updateExperimentMetrics(input.experimentId, input.metrics);
    }),

  // Completar experimento
  completeExperiment: protectedProcedure
    .input(z.object({
      experimentId: z.number().int().positive(),
      results: z.record(z.any()),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado',
        });
      }

      return await MLOpsService.completeExperiment(input.experimentId, input.results);
    }),

  // ========================================
  // PREDICTION LOGGING
  // ========================================

  // Registrar predição
  logPrediction: protectedProcedure
    .input(logPredictionSchema)
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado',
        });
      }

      return await MLOpsService.logPrediction(input);
    }),

  // Atualizar feedback da predição
  updatePredictionFeedback: protectedProcedure
    .input(z.object({
      predictionId: z.number().int().positive(),
      actualOutcome: z.any(),
      feedback: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado',
        });
      }

      return await MLOpsService.updatePredictionFeedback(
        input.predictionId,
        input.actualOutcome,
        input.feedback,
        ctx.user.id
      );
    }),

  // ========================================
  // DRIFT MONITORING
  // ========================================

  // Registrar métrica do modelo
  recordModelMetric: protectedProcedure
    .input(z.object({
      modelVersionId: z.number().int().positive(),
      metricName: z.string().min(1),
      currentValue: z.number(),
      baselineValue: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado',
        });
      }

      return await MLOpsService.recordModelMetric(
        input.modelVersionId,
        input.metricName,
        input.currentValue,
        input.baselineValue
      );
    }),

  // Obter alertas de drift
  getDriftAlerts: protectedProcedure
    .input(z.object({
      modelVersionId: z.number().int().positive().optional(),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado',
        });
      }

      return await MLOpsService.getDriftAlerts(input.modelVersionId);
    }),

  // ========================================
  // ANOMALY DETECTION
  // ========================================

  // Obter anomalias
  getAnomalies: protectedProcedure
    .input(z.object({
      detectionType: z.string().optional(),
      severity: z.string().optional(),
      status: z.string().optional(),
      limit: z.number().int().positive().max(100).optional(),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado',
        });
      }

      return await MLOpsService.getAnomalies(input);
    }),

  // Detectar atividade fraudulenta
  detectFraud: protectedProcedure
    .input(z.object({
      consultationId: z.number().int().positive(),
      features: z.record(z.any()),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado',
        });
      }

      return await MLOpsService.detectFraudulentActivity(input.consultationId, input.features);
    }),

  // ========================================
  // SYSTEM METRICS
  // ========================================

  // Registrar métrica do sistema
  recordSystemMetric: protectedProcedure
    .input(z.object({
      metricName: z.string().min(1),
      value: z.number(),
      unit: z.string(),
      category: z.string(),
      tags: z.record(z.any()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado',
        });
      }

      return await MLOpsService.recordSystemMetric(
        input.metricName,
        input.value,
        input.unit,
        input.category,
        input.tags
      );
    }),

  // Obter métricas do sistema
  getSystemMetrics: protectedProcedure
    .input(z.object({
      metricName: z.string().optional(),
      category: z.string().optional(),
      hours: z.number().int().positive().max(168).optional(), // Máximo 1 semana
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado',
        });
      }

      return await MLOpsService.getSystemMetrics(input.metricName, input.category, input.hours);
    }),

  // ========================================
  // FEATURE STORE
  // ========================================

  // Criar feature
  createFeature: protectedProcedure
    .input(z.object({
      featureName: z.string().min(1),
      description: z.string().optional(),
      featureType: z.enum(['numerical', 'categorical', 'text', 'image', 'time_series']),
      source: z.string().optional(),
      transformation: z.string().optional(),
      validationRules: z.record(z.any()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado',
        });
      }

      return await MLOpsService.createFeature(input, ctx.user.id);
    }),

  // Obter features ativas
  getActiveFeatures: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado',
        });
      }

      return await MLOpsService.getActiveFeatures();
    }),

  // ========================================
  // DASHBOARD
  // ========================================

  // Obter métricas do dashboard
  getDashboardMetrics: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado',
        });
      }

      const metrics = await MLOpsService.getDashboardMetrics();
      
      // Aplicar differential privacy se não for admin
      if (ctx.user.role !== 'admin') {
        return SecurityService.applyDifferentialPrivacy(metrics, 1.0);
      }
      
      return metrics;
    }),

  // ========================================
  // ADVANCED ANALYTICS
  // ========================================

  // Análise de performance de modelo
  analyzeModelPerformance: protectedProcedure
    .input(z.object({
      modelVersionId: z.number().int().positive(),
      timeRange: z.enum(['24h', '7d', '30d', '90d']).default('7d'),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Usuário não autenticado',
        });
      }

      // Calcular período baseado no timeRange
      const now = new Date();
      const periods = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000,
      };
      
      const since = new Date(now.getTime() - periods[input.timeRange]);

      // Buscar métricas de drift para o período
      const driftMetrics = await MLOpsService.getDriftAlerts(input.modelVersionId);
      
      // Calcular estatísticas
      const totalAlerts = driftMetrics.length;
      const criticalAlerts = driftMetrics.filter(m => (m.driftScore || 0) > 25).length;
      
      return {
        modelVersionId: input.modelVersionId,
        timeRange: input.timeRange,
        totalAlerts,
        criticalAlerts,
        averageDriftScore: totalAlerts > 0 
          ? Math.round(driftMetrics.reduce((sum, m) => sum + (m.driftScore || 0), 0) / totalAlerts)
          : 0,
        healthStatus: criticalAlerts > 5 ? 'critical' : totalAlerts > 10 ? 'warning' : 'healthy',
      };
    }),

  // Relatório de segurança
  getSecurityReport: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user || ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Acesso restrito a administradores',
        });
      }

      const anomalies = await MLOpsService.getAnomalies({ limit: 50 });
      
      const fraudAlerts = anomalies.filter(a => a.detectionType === 'fraud');
      const driftAlerts = anomalies.filter(a => a.detectionType === 'drift');
      const otherAnomalies = anomalies.filter(a => !['fraud', 'drift'].includes(a.detectionType));
      
      return {
        totalAnomalies: anomalies.length,
        fraudAlerts: fraudAlerts.length,
        driftAlerts: driftAlerts.length,
        otherAnomalies: otherAnomalies.length,
        criticalAnomalies: anomalies.filter(a => a.severity === 'critical').length,
        openAnomalies: anomalies.filter(a => a.status === 'open').length,
        recentAnomalies: anomalies.slice(0, 10), // 10 mais recentes
      };
    }),
});