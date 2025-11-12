import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { db } from '../db';
import { 
  modelVersions, 
  mlExperiments, 
  featureDefinitions, 
  trainingDatasets, 
  predictionLogs, 
  modelDriftMonitoring, 
  anomalyDetections,
  systemMetrics 
} from '../../drizzle/schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';

// Schemas de validação
export const createModelVersionSchema = z.object({
  modelName: z.string().min(1, 'Nome do modelo é obrigatório'),
  version: z.string().min(1, 'Versão é obrigatória'),
  description: z.string().optional(),
  algorithm: z.string().min(1, 'Algoritmo é obrigatório'),
  hyperparameters: z.record(z.any()).optional(),
  accuracy: z.number().min(0).max(100).optional(),
  precision: z.number().min(0).max(100).optional(),
  recall: z.number().min(0).max(100).optional(),
  f1Score: z.number().min(0).max(100).optional(),
  aucRoc: z.number().min(0).max(100).optional(),
});

export const createExperimentSchema = z.object({
  experimentName: z.string().min(1, 'Nome do experimento é obrigatório'),
  description: z.string().optional(),
  objective: z.enum(['classification', 'regression', 'clustering']),
  dataset: z.string().min(1, 'Dataset é obrigatório'),
  config: z.record(z.any()).optional(),
});

export const logPredictionSchema = z.object({
  modelVersionId: z.number().int().positive(),
  consultationId: z.number().int().positive().optional(),
  patientId: z.number().int().positive().optional(),
  inputFeatures: z.record(z.any()),
  prediction: z.record(z.any()),
  confidence: z.number().min(0).max(100),
  processingTime: z.number().int().positive().optional(),
});

// Classe principal para MLOps
export class MLOpsService {
  
  // ========================================
  // MODEL MANAGEMENT
  // ========================================
  
  static async createModelVersion(data: z.infer<typeof createModelVersionSchema>, userId: number) {
    const validatedData = createModelVersionSchema.parse(data);
    
    const result = await db.insert(modelVersions).values({
      ...validatedData,
      hyperparameters: validatedData.hyperparameters ? JSON.stringify(validatedData.hyperparameters) : null,
      createdBy: userId,
    }).returning();

    return result[0];
  }

  static async getActiveModel(modelName: string) {
    const result = await db.select()
      .from(modelVersions)
      .where(and(
        eq(modelVersions.modelName, modelName),
        eq(modelVersions.status, 'active')
      ))
      .orderBy(desc(modelVersions.createdAt))
      .limit(1);

    return result[0] || null;
  }

  static async deployModel(modelVersionId: number, userId: number) {
    // Primeiro, depreciar modelo ativo atual
    const currentModel = await db.select()
      .from(modelVersions)
      .where(eq(modelVersions.id, modelVersionId))
      .limit(1);

    if (currentModel.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Modelo não encontrado',
      });
    }

    const modelName = currentModel[0].modelName;

    // Depreciar modelos ativos da mesma família
    await db.update(modelVersions)
      .set({ 
        status: 'deprecated',
        deprecatedAt: new Date()
      })
      .where(and(
        eq(modelVersions.modelName, modelName),
        eq(modelVersions.status, 'active')
      ));

    // Ativar novo modelo
    await db.update(modelVersions)
      .set({ 
        status: 'active',
        deployedAt: new Date()
      })
      .where(eq(modelVersions.id, modelVersionId));

    return { success: true, message: 'Modelo implantado com sucesso' };
  }

  // ========================================
  // EXPERIMENT TRACKING
  // ========================================

  static async createExperiment(data: z.infer<typeof createExperimentSchema>, userId: number) {
    const validatedData = createExperimentSchema.parse(data);
    
    const result = await db.insert(mlExperiments).values({
      ...validatedData,
      config: validatedData.config ? JSON.stringify(validatedData.config) : null,
      createdBy: userId,
    }).returning();

    return result[0];
  }

  static async updateExperimentMetrics(experimentId: number, metrics: Record<string, any>) {
    await db.update(mlExperiments)
      .set({ 
        metrics: JSON.stringify(metrics),
        updatedAt: new Date()
      })
      .where(eq(mlExperiments.id, experimentId));

    return { success: true };
  }

  static async completeExperiment(experimentId: number, results: Record<string, any>) {
    await db.update(mlExperiments)
      .set({ 
        status: 'completed',
        results: JSON.stringify(results),
        completedAt: new Date()
      })
      .where(eq(mlExperiments.id, experimentId));

    return { success: true };
  }

  // ========================================
  // PREDICTION LOGGING
  // ========================================

  static async logPrediction(data: z.infer<typeof logPredictionSchema>) {
    const validatedData = logPredictionSchema.parse(data);
    
    const result = await db.insert(predictionLogs).values({
      ...validatedData,
      inputFeatures: JSON.stringify(validatedData.inputFeatures),
      prediction: JSON.stringify(validatedData.prediction),
      status: 'completed',
    }).returning();

    return result[0];
  }

  static async updatePredictionFeedback(predictionId: number, actualOutcome: any, feedback: string, reviewedBy: number) {
    await db.update(predictionLogs)
      .set({
        actualOutcome: JSON.stringify(actualOutcome),
        feedback,
        status: 'reviewed',
        reviewedBy,
        reviewedAt: new Date(),
      })
      .where(eq(predictionLogs.id, predictionId));

    return { success: true };
  }

  // ========================================
  // DRIFT MONITORING
  // ========================================

  static async recordModelMetric(modelVersionId: number, metricName: string, currentValue: number, baselineValue: number) {
    const driftScore = Math.abs(((currentValue - baselineValue) / baselineValue) * 100);
    const threshold = 10; // 10% de drift
    const isAlert = driftScore > threshold;

    const result = await db.insert(modelDriftMonitoring).values({
      modelVersionId,
      metricName,
      currentValue: Math.round(currentValue),
      baselineValue: Math.round(baselineValue),
      driftScore: Math.round(driftScore),
      threshold,
      isAlert,
      alertSentAt: isAlert ? new Date() : null,
    }).returning();

    // Se há drift significativo, criar alerta
    if (isAlert) {
      await this.createAnomalyDetection({
        detectionType: 'drift',
        resourceType: 'model',
        resourceId: modelVersionId,
        anomalyScore: Math.round(driftScore),
        description: `Drift detectado na métrica ${metricName}: ${currentValue}% (baseline: ${baselineValue}%)`,
        severity: driftScore > 25 ? 'high' : 'medium',
      });
    }

    return result[0];
  }

  static async getDriftAlerts(modelVersionId?: number) {
    let query = db.select().from(modelDriftMonitoring).where(eq(modelDriftMonitoring.isAlert, true));
    
    if (modelVersionId) {
      query = query.where(eq(modelDriftMonitoring.modelVersionId, modelVersionId));
    }

    return query.orderBy(desc(modelDriftMonitoring.createdAt));
  }

  // ========================================
  // ANOMALY DETECTION
  // ========================================

  static async createAnomalyDetection(data: {
    detectionType: string;
    resourceType?: string;
    resourceId?: number;
    anomalyScore: number;
    description?: string;
    features?: Record<string, any>;
    severity?: string;
  }) {
    const result = await db.insert(anomalyDetections).values({
      ...data,
      features: data.features ? JSON.stringify(data.features) : null,
    }).returning();

    return result[0];
  }

  static async getAnomalies(filters: {
    detectionType?: string;
    severity?: string;
    status?: string;
    limit?: number;
  } = {}) {
    let query = db.select().from(anomalyDetections);

    if (filters.detectionType) {
      query = query.where(eq(anomalyDetections.detectionType, filters.detectionType));
    }
    if (filters.severity) {
      query = query.where(eq(anomalyDetections.severity, filters.severity));
    }
    if (filters.status) {
      query = query.where(eq(anomalyDetections.status, filters.status));
    }

    return query
      .orderBy(desc(anomalyDetections.createdAt))
      .limit(filters.limit || 50);
  }

  // ========================================
  // FRAUD DETECTION
  // ========================================

  static async detectFraudulentActivity(consultationId: number, features: Record<string, any>) {
    // Algoritmo simples de detecção de fraude baseado em regras
    let fraudScore = 0;
    const anomalies: string[] = [];

    // Regra 1: Muitas consultas em pouco tempo
    if (features.consultationsLast24h > 10) {
      fraudScore += 30;
      anomalies.push('Número excessivo de consultas em 24h');
    }

    // Regra 2: Diagnósticos muito raros
    if (features.diagnosisRarityScore > 90) {
      fraudScore += 25;
      anomalies.push('Diagnóstico extremamente raro');
    }

    // Regra 3: Padrão de horário suspeito
    if (features.consultationHour < 6 || features.consultationHour > 22) {
      fraudScore += 15;
      anomalies.push('Horário de consulta suspeito');
    }

    // Regra 4: Medicamentos de alto custo
    if (features.highCostMedicationsCount > 3) {
      fraudScore += 20;
      anomalies.push('Prescrição excessiva de medicamentos de alto custo');
    }

    // Se score > 50, criar alerta de fraude
    if (fraudScore > 50) {
      await this.createAnomalyDetection({
        detectionType: 'fraud',
        resourceType: 'consultation',
        resourceId: consultationId,
        anomalyScore: fraudScore,
        description: `Possível atividade fraudulenta detectada: ${anomalies.join(', ')}`,
        features,
        severity: fraudScore > 75 ? 'critical' : 'high',
      });
    }

    return {
      fraudScore,
      isFraud: fraudScore > 50,
      anomalies,
    };
  }

  // ========================================
  // SYSTEM METRICS
  // ========================================

  static async recordSystemMetric(metricName: string, value: number, unit: string, category: string, tags?: Record<string, any>) {
    const result = await db.insert(systemMetrics).values({
      metricName,
      metricValue: Math.round(value),
      unit,
      category,
      tags: tags ? JSON.stringify(tags) : null,
    }).returning();

    return result[0];
  }

  static async getSystemMetrics(metricName?: string, category?: string, hours?: number) {
    let query = db.select().from(systemMetrics);

    const conditions = [];
    
    if (metricName) {
      conditions.push(eq(systemMetrics.metricName, metricName));
    }
    if (category) {
      conditions.push(eq(systemMetrics.category, category));
    }
    if (hours) {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      conditions.push(gte(systemMetrics.timestamp, since));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return query.orderBy(desc(systemMetrics.timestamp)).limit(1000);
  }

  // ========================================
  // FEATURE STORE
  // ========================================

  static async createFeature(data: {
    featureName: string;
    description?: string;
    featureType: 'numerical' | 'categorical' | 'text' | 'image' | 'time_series';
    source?: string;
    transformation?: string;
    validationRules?: Record<string, any>;
  }, userId: number) {
    const result = await db.insert(featureDefinitions).values({
      ...data,
      validationRules: data.validationRules ? JSON.stringify(data.validationRules) : null,
      createdBy: userId,
    }).returning();

    return result[0];
  }

  static async getActiveFeatures() {
    return db.select()
      .from(featureDefinitions)
      .where(eq(featureDefinitions.isActive, true))
      .orderBy(featureDefinitions.featureName);
  }

  // ========================================
  // DASHBOARD METRICS
  // ========================================

  static async getDashboardMetrics() {
    // Métricas dos últimos 30 dias
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalPredictions,
      accuracyMetrics,
      driftAlerts,
      anomalies,
      activeModels
    ] = await Promise.all([
      // Total de predições
      db.select({ count: sql<number>`count(*)` })
        .from(predictionLogs)
        .where(gte(predictionLogs.createdAt, thirtyDaysAgo)),

      // Métricas de acurácia média
      db.select({ 
        avgAccuracy: sql<number>`avg(${modelVersions.accuracy})`,
        avgPrecision: sql<number>`avg(${modelVersions.precision})`,
        avgRecall: sql<number>`avg(${modelVersions.recall})`,
      })
        .from(modelVersions)
        .where(eq(modelVersions.status, 'active')),

      // Alertas de drift
      db.select({ count: sql<number>`count(*)` })
        .from(modelDriftMonitoring)
        .where(and(
          eq(modelDriftMonitoring.isAlert, true),
          gte(modelDriftMonitoring.createdAt, thirtyDaysAgo)
        )),

      // Anomalias detectadas
      db.select({ count: sql<number>`count(*)` })
        .from(anomalyDetections)
        .where(and(
          eq(anomalyDetections.status, 'open'),
          gte(anomalyDetections.createdAt, thirtyDaysAgo)
        )),

      // Modelos ativos
      db.select({ count: sql<number>`count(*)` })
        .from(modelVersions)
        .where(eq(modelVersions.status, 'active'))
    ]);

    return {
      totalPredictions: totalPredictions[0]?.count || 0,
      avgAccuracy: Math.round(accuracyMetrics[0]?.avgAccuracy || 0),
      avgPrecision: Math.round(accuracyMetrics[0]?.avgPrecision || 0),
      avgRecall: Math.round(accuracyMetrics[0]?.avgRecall || 0),
      driftAlerts: driftAlerts[0]?.count || 0,
      openAnomalies: anomalies[0]?.count || 0,
      activeModels: activeModels[0]?.count || 0,
    };
  }
}

// Utilitários para validação de features
export class FeatureValidator {
  static validateNumerical(value: any, rules: any): boolean {
    if (typeof value !== 'number') return false;
    
    if (rules.min !== undefined && value < rules.min) return false;
    if (rules.max !== undefined && value > rules.max) return false;
    
    return true;
  }

  static validateCategorical(value: any, rules: any): boolean {
    if (!rules.allowedValues) return true;
    return rules.allowedValues.includes(value);
  }

  static validateFeatures(features: Record<string, any>, featureDefinitions: any[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    for (const featureDef of featureDefinitions) {
      const value = features[featureDef.featureName];
      const rules = featureDef.validationRules ? JSON.parse(featureDef.validationRules) : {};

      if (rules.required && (value === undefined || value === null)) {
        errors.push(`Feature '${featureDef.featureName}' é obrigatória`);
        continue;
      }

      if (value !== undefined && value !== null) {
        let isValid = true;

        switch (featureDef.featureType) {
          case 'numerical':
            isValid = this.validateNumerical(value, rules);
            break;
          case 'categorical':
            isValid = this.validateCategorical(value, rules);
            break;
          // Adicionar mais validações conforme necessário
        }

        if (!isValid) {
          errors.push(`Feature '${featureDef.featureName}' tem valor inválido: ${value}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}