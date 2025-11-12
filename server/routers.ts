import { systemRouter } from "./_core/systemRouter";
import { authRouter } from "./_core/authRouter";
// import { mlopsRouter } from "./_core/mlopsRouter"; // Temporarily disabled
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import {
  invokeLLM,
  invokeMedicalAI,
  generateDifferentialDiagnosis,
  generateTreatmentPlan,
  analyzeLabResults,
  checkMedicalAIHealth,
  getMedicalConsensus,
  type AIProvider,
} from "./_core/llm";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  // mlops: mlopsRouter, // Temporarily disabled

  // Patient management
  patients: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getPatientsByDoctor(ctx.user!.id)
    ),
    get: publicProcedure
      .input(z.object({ patientId: z.number() }))
      .query(({ input }) => db.getPatientById(input.patientId)),
    create: publicProcedure
      .input(
        z.object({
          name: z.string(),
          dateOfBirth: z.string().optional(),
          gender: z.enum(["M", "F", "Other"]).optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          medicalHistory: z.string().optional(),
          currentMedications: z.string().optional(),
        })
      )
      .mutation(({ input }) =>
        db.createPatient({
          ...input,
          doctorId: 1,
        })
      ),
    update: publicProcedure
      .input(
        z.object({
          patientId: z.number(),
          name: z.string().optional(),
          dateOfBirth: z.string().optional(),
          gender: z.enum(["M", "F", "Other"]).optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          medicalHistory: z.string().optional(),
          currentMedications: z.string().optional(),
        })
      )
      .mutation(({ input }) => {
        const { patientId, ...data } = input;
        return db.updatePatient(patientId, data);
      }),
  }),

  // Consultation management
  consultations: router({
    list: publicProcedure
      .input(z.object({ patientId: z.number() }))
      .query(({ input }) => db.getConsultationsByPatient(input.patientId)),
    get: publicProcedure
      .input(z.object({ consultationId: z.number() }))
      .query(({ input }) => db.getConsultationById(input.consultationId)),
    create: publicProcedure
      .input(
        z.object({
          patientId: z.number(),
          symptoms: z.string(),
          physicalExamination: z.string().optional(),
          assessment: z.string().optional(),
          plan: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ input }) =>
        db.createConsultation({
          ...input,
          doctorId: 1,
          date: new Date(),
        })
      ),
  }),

  // Exam results management
  exams: router({
    list: publicProcedure
      .input(z.object({ consultationId: z.number() }))
      .query(({ input }) =>
        db.getExamResultsByConsultation(input.consultationId)
      ),
    create: publicProcedure
      .input(
        z.object({
          consultationId: z.number(),
          patientId: z.number(),
          examType: z.string(),
          examDate: z.string().optional(),
          results: z.string(),
          normalRange: z.string().optional(),
          interpretation: z.string().optional(),
        })
      )
      .mutation(({ input }) => db.createExamResult(input)),
  }),

  // Enhanced AI suggestions and analysis with multi-provider support
  ai: router({
    // Legacy endpoint (maintained for backward compatibility)
    generateSuggestions: publicProcedure
      .input(
        z.object({
          consultationId: z.number(),
          patientId: z.number(),
          symptoms: z.string(),
          examResults: z.string().optional(),
          medicalHistory: z.string().optional(),
          provider: z.enum(["openai", "gemini", "deepseek"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const response = await generateDifferentialDiagnosis({
            symptoms: input.symptoms,
            examResults: input.examResults,
            medicalHistory: input.medicalHistory,
            provider: input.provider,
          });

          const content =
            typeof response.choices[0]?.message?.content === "string"
              ? response.choices[0].message.content
              : "";

          if (content) {
            await db.createAISuggestion({
              consultationId: input.consultationId,
              patientId: input.patientId,
              suggestionType: "diagnosis",
              content: content,
              model: response.provider,
              confidence: 75,
            });
          }

          return {
            success: true,
            suggestion: content,
            provider: response.provider,
            model: response.model,
          };
        } catch (error) {
          console.error("[AI] Error generating suggestions:", error);
          return {
            success: false,
            error: "Failed to generate AI suggestions",
          };
        }
      }),

    // New enhanced endpoints
    generateDifferentialDiagnosis: publicProcedure
      .input(
        z.object({
          consultationId: z.number(),
          patientId: z.number(),
          symptoms: z.string(),
          examResults: z.string().optional(),
          medicalHistory: z.string().optional(),
          specialty: z.string().optional(),
          provider: z.enum(["openai", "gemini", "deepseek"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const response = await generateDifferentialDiagnosis({
            symptoms: input.symptoms,
            examResults: input.examResults,
            medicalHistory: input.medicalHistory,
            specialty: input.specialty,
            provider: input.provider,
          });

          const content =
            typeof response.choices[0]?.message?.content === "string"
              ? response.choices[0].message.content
              : "";

          if (content) {
            await db.createAISuggestion({
              consultationId: input.consultationId,
              patientId: input.patientId,
              suggestionType: "differential_diagnosis",
              content: content,
              model: response.provider,
              confidence: 80,
            });
          }

          return {
            success: true,
            diagnosis: content,
            provider: response.provider,
            model: response.model,
            usage: response.usage,
          };
        } catch (error) {
          console.error("[AI] Error generating differential diagnosis:", error);
          return {
            success: false,
            error: "Failed to generate differential diagnosis",
          };
        }
      }),

    generateTreatmentPlan: publicProcedure
      .input(
        z.object({
          consultationId: z.number(),
          patientId: z.number(),
          diagnosis: z.string(),
          patientProfile: z.string(),
          specialty: z.string().optional(),
          provider: z.enum(["openai", "gemini", "deepseek"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const response = await generateTreatmentPlan({
            diagnosis: input.diagnosis,
            patientProfile: input.patientProfile,
            specialty: input.specialty,
            provider: input.provider,
          });

          const content =
            typeof response.choices[0]?.message?.content === "string"
              ? response.choices[0].message.content
              : "";

          if (content) {
            await db.createAISuggestion({
              consultationId: input.consultationId,
              patientId: input.patientId,
              suggestionType: "treatment_plan",
              content: content,
              model: response.provider,
              confidence: 85,
            });
          }

          return {
            success: true,
            treatmentPlan: content,
            provider: response.provider,
            model: response.model,
            usage: response.usage,
          };
        } catch (error) {
          console.error("[AI] Error generating treatment plan:", error);
          return {
            success: false,
            error: "Failed to generate treatment plan",
          };
        }
      }),

    analyzeLabResults: publicProcedure
      .input(
        z.object({
          consultationId: z.number(),
          patientId: z.number(),
          labResults: z.string(),
          clinicalContext: z.string(),
          provider: z.enum(["openai", "gemini", "deepseek"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const response = await analyzeLabResults({
            labResults: input.labResults,
            clinicalContext: input.clinicalContext,
            provider: input.provider,
          });

          const content =
            typeof response.choices[0]?.message?.content === "string"
              ? response.choices[0].message.content
              : "";

          if (content) {
            await db.createAISuggestion({
              consultationId: input.consultationId,
              patientId: input.patientId,
              suggestionType: "lab_analysis",
              content: content,
              model: response.provider,
              confidence: 90,
            });
          }

          return {
            success: true,
            analysis: content,
            provider: response.provider,
            model: response.model,
            usage: response.usage,
          };
        } catch (error) {
          console.error("[AI] Error analyzing lab results:", error);
          return {
            success: false,
            error: "Failed to analyze lab results",
          };
        }
      }),

    getMedicalConsensus: publicProcedure
      .input(
        z.object({
          consultationId: z.number(),
          patientId: z.number(),
          symptoms: z.string(),
          examResults: z.string().optional(),
          medicalHistory: z.string().optional(),
          specialty: z.string().optional(),
          providers: z
            .array(z.enum(["openai", "gemini", "deepseek"]))
            .optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const messages = [
            {
              role: "user" as const,
              content: `Analyze this medical case:
Symptoms: ${input.symptoms}
${input.examResults ? `Exam Results: ${input.examResults}` : ""}
${input.medicalHistory ? `Medical History: ${input.medicalHistory}` : ""}

Provide differential diagnosis and treatment recommendations.`,
            },
          ];

          const consensus = await getMedicalConsensus({
            messages,
            specialty: input.specialty,
            providers: input.providers,
          });

          // Save consensus to database
          if (consensus.consensus) {
            await db.createAISuggestion({
              consultationId: input.consultationId,
              patientId: input.patientId,
              suggestionType: "multi_provider_consensus",
              content: consensus.consensus,
              model: "multi-provider",
              confidence: consensus.confidence,
            });
          }

          return {
            success: true,
            consensus: consensus.consensus,
            results: consensus.results.map(r => ({
              provider: r.provider,
              model: r.model,
              content:
                typeof r.choices[0]?.message?.content === "string"
                  ? r.choices[0].message.content
                  : "",
              usage: r.usage,
            })),
            confidence: consensus.confidence,
          };
        } catch (error) {
          console.error("[AI] Error getting medical consensus:", error);
          return {
            success: false,
            error: "Failed to get medical consensus",
          };
        }
      }),

    checkHealth: publicProcedure.query(async () => {
      try {
        const health = await checkMedicalAIHealth();
        return {
          success: true,
          ...health,
        };
      } catch (error) {
        console.error("[AI] Error checking health:", error);
        return {
          success: false,
          error: "Failed to check AI provider health",
          providers: { openai: false, gemini: false, deepseek: false },
          recommendation: "Unable to check provider health",
        };
      }
    }),

    getSuggestions: publicProcedure
      .input(z.object({ consultationId: z.number() }))
      .query(({ input }) =>
        db.getAISuggestionsByConsultation(input.consultationId)
      ),

    reviewSuggestion: publicProcedure
      .input(
        z.object({
          suggestionId: z.number(),
          approved: z.boolean(),
        })
      )
      .mutation(({ input }) =>
        db.reviewAISuggestion(input.suggestionId, input.approved ? 1 : -1, 1)
      ),
  }),

  // AI Explanations
  explanations: router({
    create: publicProcedure
      .input(
        z.object({
          suggestionId: z.number(),
          reasoning: z.string(),
          keyFactors: z.string().optional(),
          evidenceLinks: z.string().optional(),
          alternativeOptions: z.string().optional(),
        })
      )
      .mutation(({ input }) => db.createAIExplanation(input)),

    get: publicProcedure
      .input(z.object({ suggestionId: z.number() }))
      .query(({ input }) =>
        db.getAIExplanationBySuggestion(input.suggestionId)
      ),
  }),

  // Suggestion Feedback
  feedback: router({
    create: publicProcedure
      .input(
        z.object({
          suggestionId: z.number(),
          approved: z.boolean(),
          feedback: z.string().optional(),
          clinicalRelevance: z.number().min(1).max(5).optional(),
          accuracy: z.number().min(1).max(5).optional(),
          usefulness: z.number().min(1).max(5).optional(),
        })
      )
      .mutation(({ input }) =>
        db.createSuggestionFeedback({
          ...input,
          doctorId: 1,
        })
      ),

    get: publicProcedure
      .input(z.object({ suggestionId: z.number() }))
      .query(({ input }) => db.getSuggestionFeedback(input.suggestionId)),
  }),

  // Patient Consent Management
  consent: router({
    create: publicProcedure
      .input(
        z.object({
          patientId: z.number(),
          consentType: z.enum([
            "data_processing",
            "ai_analysis",
            "research",
            "data_sharing",
          ]),
          consentGiven: z.boolean(),
          expiryDate: z.date().optional(),
          documentUrl: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.createPatientConsent({
          ...input,
          consentDate: new Date(),
          ipAddress: ctx.req.ip || "unknown",
        })
      ),

    get: publicProcedure
      .input(z.object({ patientId: z.number(), consentType: z.string() }))
      .query(({ input }) =>
        db.getPatientConsent(input.patientId, input.consentType)
      ),

    getAll: publicProcedure
      .input(z.object({ patientId: z.number() }))
      .query(({ input }) => db.getAllPatientConsents(input.patientId)),
  }),

  // Data Retention Policy
  retention: router({
    create: publicProcedure
      .input(
        z.object({
          patientId: z.number(),
          retentionPeriodMonths: z.number().default(36),
        })
      )
      .mutation(({ input }) => db.createDataRetentionPolicy(input)),

    get: publicProcedure
      .input(z.object({ patientId: z.number() }))
      .query(({ input }) => db.getDataRetentionPolicy(input.patientId)),

    update: publicProcedure
      .input(
        z.object({
          patientId: z.number(),
          deletionScheduledDate: z.date().optional(),
          deletionCompletedDate: z.date().optional(),
          deletionReason: z.string().optional(),
        })
      )
      .mutation(({ input }) => {
        const { patientId, ...data } = input;
        return db.updateDataRetentionPolicy(patientId, data);
      }),
  }),

  // Medical Images
  images: router({
    create: publicProcedure
      .input(
        z.object({
          consultationId: z.number(),
          patientId: z.number(),
          imageType: z.string(),
          imageUrl: z.string(),
          imageKey: z.string(),
          description: z.string().optional(),
        })
      )
      .mutation(({ input }) => db.createMedicalImage(input)),

    list: publicProcedure
      .input(z.object({ consultationId: z.number() }))
      .query(({ input }) =>
        db.getMedicalImagesByConsultation(input.consultationId)
      ),

    get: publicProcedure
      .input(z.object({ imageId: z.number() }))
      .query(({ input }) => db.getMedicalImageById(input.imageId)),

    analyzeImage: publicProcedure
      .input(
        z.object({
          imageId: z.number(),
          analysisPrompt: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const image = await db.getMedicalImageById(input.imageId);
        if (!image) throw new Error("Image not found");

        const prompt =
          input.analysisPrompt ||
          `Analyze this medical image (${image.imageType}) and provide:
1. Key findings
2. Abnormalities detected (if any)
3. Recommendations for further investigation
4. Confidence level in findings

Remember this is for physician review only, not a substitute for professional diagnosis.`;

        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content:
                  "You are a medical imaging AI assistant. Provide detailed analysis of medical images for physician review.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
          });

          const analysisResult =
            typeof response.choices[0]?.message?.content === "string"
              ? response.choices[0].message.content
              : "";

          if (analysisResult) {
            await db.updateMedicalImageAnalysis(input.imageId, analysisResult);
          }

          return {
            success: true,
            analysis: analysisResult,
          };
        } catch (error) {
          console.error("[Image Analysis] Error:", error);
          return {
            success: false,
            error: "Failed to analyze image",
          };
        }
      }),
  }),

  // Research Protocols
  research: router({
    createProtocol: publicProcedure
      .input(
        z.object({
          protocolName: z.string(),
          description: z.string().optional(),
          principalInvestigator: z.string(),
          institution: z.string().optional(),
          startDate: z.date(),
          endDate: z.date().optional(),
          ethicsApprovalNumber: z.string().optional(),
          ethicsApprovalDate: z.date().optional(),
        })
      )
      .mutation(({ input }) => db.createResearchProtocol(input)),

    getProtocol: publicProcedure
      .input(z.object({ protocolId: z.number() }))
      .query(({ input }) => db.getResearchProtocolById(input.protocolId)),

    listProtocols: publicProcedure.query(() => db.getAllResearchProtocols()),

    updateProtocol: publicProcedure
      .input(
        z.object({
          protocolId: z.number(),
          status: z
            .enum(["draft", "active", "completed", "suspended"])
            .optional(),
          ethicsApprovalNumber: z.string().optional(),
          ethicsApprovalDate: z.date().optional(),
        })
      )
      .mutation(({ input }) => {
        const { protocolId, ...data } = input;
        return db.updateResearchProtocol(protocolId, data);
      }),

    enrollParticipant: publicProcedure
      .input(
        z.object({
          protocolId: z.number(),
          patientId: z.number(),
          consentDocumentUrl: z.string().optional(),
          consentGiven: z.boolean(),
        })
      )
      .mutation(({ input }) => db.enrollResearchParticipant(input)),

    getParticipants: publicProcedure
      .input(z.object({ protocolId: z.number() }))
      .query(({ input }) =>
        db.getResearchParticipantsByProtocol(input.protocolId)
      ),

    updateParticipant: publicProcedure
      .input(
        z.object({
          participantId: z.number(),
          status: z
            .enum(["enrolled", "active", "completed", "withdrawn"])
            .optional(),
          withdrawalDate: z.date().optional(),
        })
      )
      .mutation(({ input }) => {
        const { participantId, ...data } = input;
        return db.updateResearchParticipant(participantId, data);
      }),
  }),

  // EHR Integration
  ehr: router({
    mapFhirData: publicProcedure
      .input(
        z.object({
          patientId: z.number(),
          externalEhrId: z.string(),
          ehrSystem: z.string(),
          fhirResourceType: z.string().optional(),
          fhirData: z.string(),
        })
      )
      .mutation(({ input }) => db.createHL7FhirMapping(input)),

    getEhrMapping: publicProcedure
      .input(z.object({ patientId: z.number() }))
      .query(({ input }) => db.getHL7FhirMappingByPatient(input.patientId)),

    syncEhrData: publicProcedure
      .input(
        z.object({
          mappingId: z.number(),
          fhirData: z.string(),
        })
      )
      .mutation(({ input }) => {
        const { mappingId, ...data } = input;
        return db.updateHL7FhirMapping(mappingId, {
          ...data,
          lastSyncDate: new Date(),
          syncStatus: "synced",
        });
      }),
  }),

  // Notifications
  notifications: router({
    list: publicProcedure.query(() => db.getNotificationsByUser(1)),
    markAsRead: publicProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(({ input }) => db.markNotificationAsRead(input.notificationId)),
  }),

  // Statistics
  stats: router({
    overview: publicProcedure.query(async () => {
      const patientCount = await db.getPatientCountByDoctor(1);
      const consultationCount = await db.getConsultationCountByDoctor(1);
      const aiStats = await db.getAISuggestionStats(1);

      return {
        patientCount,
        consultationCount,
        aiStats,
      };
    }),
  }),

  // Reports
  reports: router({
    generateConsultationReport: publicProcedure
      .input(z.object({ consultationId: z.number() }))
      .query(async ({ input }) => {
        const consultation = await db.getConsultationById(input.consultationId);
        const patient = consultation
          ? await db.getPatientById(consultation.patientId)
          : null;
        const examResults = consultation
          ? await db.getExamResultsByConsultation(input.consultationId)
          : [];
        const aiSuggestions = consultation
          ? await db.getAISuggestionsByConsultation(input.consultationId)
          : [];

        return {
          success: true,
          data: {
            consultation,
            patient,
            examResults,
            aiSuggestions,
          },
        };
      }),
  }),

  // Medical Specialties
  specialties: router({
    list: publicProcedure.query(() => db.getAllMedicalSpecialties()),

    get: publicProcedure
      .input(z.object({ specialtyId: z.number() }))
      .query(({ input }) => db.getMedicalSpecialtyById(input.specialtyId)),

    create: publicProcedure
      .input(
        z.object({
          name: z.string(),
          englishName: z.string(),
          description: z.string().optional(),
          icd10Code: z.string().optional(),
        })
      )
      .mutation(({ input }) => db.createMedicalSpecialty(input)),

    getDoctorSpecialties: publicProcedure
      .input(z.object({ doctorId: z.number() }))
      .query(({ input }) => db.getDoctorSpecialties(input.doctorId)),

    addDoctorSpecialty: publicProcedure
      .input(
        z.object({
          doctorId: z.number(),
          specialtyId: z.number(),
          licenseNumber: z.string().optional(),
          yearsOfExperience: z.number().optional(),
          isPrimary: z.boolean().optional(),
        })
      )
      .mutation(({ input }) => db.addDoctorSpecialty(input)),
  }),

  // Clinical Guidelines
  guidelines: router({
    list: publicProcedure
      .input(z.object({ specialtyId: z.number() }))
      .query(({ input }) => db.getGuidelinesBySpecialty(input.specialtyId)),

    getByCondition: publicProcedure
      .input(z.object({ specialtyId: z.number(), condition: z.string() }))
      .query(({ input }) =>
        db.getGuidelineByCondition(input.specialtyId, input.condition)
      ),

    create: publicProcedure
      .input(
        z.object({
          specialtyId: z.number(),
          condition: z.string(),
          guidelineContent: z.string(),
          source: z.string().optional(),
          publicationYear: z.number().optional(),
          version: z.string().optional(),
        })
      )
      .mutation(({ input }) => db.createClinicalGuideline(input)),
  }),

  // Specialty Medications
  medications: router({
    listBySpecialty: publicProcedure
      .input(z.object({ specialtyId: z.number() }))
      .query(({ input }) => db.getMedicationsBySpecialty(input.specialtyId)),

    create: publicProcedure
      .input(
        z.object({
          specialtyId: z.number(),
          medicationName: z.string(),
          activeIngredient: z.string().optional(),
          dosageForm: z.string().optional(),
          recommendedDose: z.string().optional(),
          indications: z.string().optional(),
          contraindications: z.string().optional(),
          sideEffects: z.string().optional(),
          interactions: z.string().optional(),
          atcCode: z.string().optional(),
        })
      )
      .mutation(({ input }) => db.createSpecialtyMedication(input)),
  }),

  // Specialty Diagnostic Tests
  diagnosticTests: router({
    listBySpecialty: publicProcedure
      .input(z.object({ specialtyId: z.number() }))
      .query(({ input }) => db.getTestsBySpecialty(input.specialtyId)),

    create: publicProcedure
      .input(
        z.object({
          specialtyId: z.number(),
          testName: z.string(),
          testCode: z.string().optional(),
          description: z.string().optional(),
          normalRange: z.string().optional(),
          interpretationGuidelines: z.string().optional(),
          commonIndications: z.string().optional(),
          sampleType: z.string().optional(),
          turnaroundTime: z.string().optional(),
        })
      )
      .mutation(({ input }) => db.createSpecialtyDiagnosticTest(input)),
  }),

  // Specialty Procedures
  procedures: router({
    listBySpecialty: publicProcedure
      .input(z.object({ specialtyId: z.number() }))
      .query(({ input }) => db.getProceduresBySpecialty(input.specialtyId)),

    create: publicProcedure
      .input(
        z.object({
          specialtyId: z.number(),
          procedureName: z.string(),
          procedureCode: z.string().optional(),
          description: z.string().optional(),
          indications: z.string().optional(),
          contraindications: z.string().optional(),
          complications: z.string().optional(),
          estimatedDuration: z.string().optional(),
          recoveryTime: z.string().optional(),
        })
      )
      .mutation(({ input }) => db.createSpecialtyProcedure(input)),
  }),

  // Consultation Specialty - REMOVED DUPLICATE, KEEPING ONLY MULTI-SPECIALTY
  /*consultationSpecialties: router({
    get: publicProcedure
      .input(z.object({ consultationId: z.number() }))
      .query(({ input }) => db.getConsultationSpecialty(input.consultationId)),

    create: publicProcedure
      .input(z.object({
        consultationId: z.number(),
        specialtyId: z.number(),
        primaryDiagnosis: z.string().optional(),
        icdCode: z.string().optional(),
      }))
      .mutation(({ input }) => db.createConsultationSpecialty(input)),
  }),*/

  // Multi-Specialty AI Suggestions
  aiMultiSpecialty: router({
    generateSpecialtySpecificSuggestions: publicProcedure
      .input(
        z.object({
          consultationId: z.number(),
          patientId: z.number(),
          specialtyId: z.number(),
          symptoms: z.string(),
          examResults: z.string().optional(),
          medicalHistory: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Get specialty information
        const specialty = await db.getMedicalSpecialtyById(input.specialtyId);
        if (!specialty) throw new Error("Specialty not found");

        // Get relevant guidelines
        const guidelines = await db.getGuidelinesBySpecialty(input.specialtyId);
        const guidelinesText = guidelines
          .map(g => `${g.condition}: ${g.guidelineContent}`)
          .join("\n\n");

        // Get relevant medications
        const medications = await db.getMedicationsBySpecialty(
          input.specialtyId
        );
        const medicationsText = medications
          .map(
            m => `${m.medicationName} (${m.recommendedDose}): ${m.indications}`
          )
          .join("\n");

        // Get relevant tests
        const tests = await db.getTestsBySpecialty(input.specialtyId);
        const testsText = tests
          .map(t => `${t.testName}: ${t.commonIndications}`)
          .join("\n");

        const prompt = `You are a specialist AI assistant in ${specialty.name} (${specialty.englishName}).
Analyze the following patient information using specialty-specific guidelines and provide diagnostic and treatment suggestions.

SPECIALTY: ${specialty.name}

PATIENT INFORMATION:
Symptoms: ${input.symptoms}
${input.examResults ? `Exam Results: ${input.examResults}` : ""}
${input.medicalHistory ? `Medical History: ${input.medicalHistory}` : ""}

SPECIALTY-SPECIFIC GUIDELINES:
${guidelinesText}

COMMONLY USED MEDICATIONS IN THIS SPECIALTY:
${medicationsText}

COMMONLY ORDERED TESTS IN THIS SPECIALTY:
${testsText}

Provide your response in the following format:
1. SPECIALTY-SPECIFIC DIFFERENTIAL DIAGNOSIS: List 3-5 possible diagnoses relevant to ${specialty.name}
2. RECOMMENDED SPECIALTY TESTS: Suggest tests specific to ${specialty.name}
3. SPECIALTY-SPECIFIC TREATMENT OPTIONS: Suggest medications and therapies commonly used in ${specialty.name}
4. FOLLOW-UP PLAN: Recommend follow-up schedule specific to this specialty
5. SPECIALIST REFERRALS: Suggest other specialists if needed

IMPORTANT: These are suggestions only. The final diagnosis and treatment decisions must be made by the treating physician.`;

        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a specialist AI assistant in ${specialty.name}. Provide clinical decision support based on specialty-specific guidelines and best practices. Always emphasize that your suggestions are for physician review only.`,
              },
              {
                role: "user",
                content: prompt,
              },
            ],
          });

          const content =
            typeof response.choices[0]?.message?.content === "string"
              ? response.choices[0].message.content
              : "";

          if (content) {
            // Create consultation specialty link
            await db.createConsultationSpecialty({
              consultationId: input.consultationId,
              specialtyId: input.specialtyId,
            });

            // Create AI suggestion
            await db.createAISuggestion({
              consultationId: input.consultationId,
              patientId: input.patientId,
              suggestionType: "diagnosis",
              content: content,
              model: "gemini",
              confidence: 80,
            });
          }

          return {
            success: true,
            specialty: specialty.name,
            suggestion: content,
          };
        } catch (error) {
          console.error("[Multi-Specialty AI] Error:", error);
          return {
            success: false,
            error: "Failed to generate specialty-specific suggestions",
          };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
