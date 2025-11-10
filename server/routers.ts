import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Patient management
  patients: router({
    list: protectedProcedure.query(({ ctx }) => 
      db.getPatientsByDoctor(ctx.user.id)
    ),
    get: protectedProcedure
      .input(z.object({ patientId: z.number() }))
      .query(({ input }) => db.getPatientById(input.patientId)),
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        dateOfBirth: z.string().optional(),
        gender: z.enum(["M", "F", "Other"]).optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        medicalHistory: z.string().optional(),
        currentMedications: z.string().optional(),
      }))
      .mutation(({ ctx, input }) =>
        db.createPatient({
          ...input,
          doctorId: ctx.user.id,
        })
      ),
    update: protectedProcedure
      .input(z.object({
        patientId: z.number(),
        name: z.string().optional(),
        dateOfBirth: z.string().optional(),
        gender: z.enum(["M", "F", "Other"]).optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        medicalHistory: z.string().optional(),
        currentMedications: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const { patientId, ...data } = input;
        return db.updatePatient(patientId, data);
      }),
  }),

  // Consultation management
  consultations: router({
    list: protectedProcedure
      .input(z.object({ patientId: z.number() }))
      .query(({ input }) => db.getConsultationsByPatient(input.patientId)),
    get: protectedProcedure
      .input(z.object({ consultationId: z.number() }))
      .query(({ input }) => db.getConsultationById(input.consultationId)),
    create: protectedProcedure
      .input(z.object({
        patientId: z.number(),
        symptoms: z.string(),
        physicalExamination: z.string().optional(),
        assessment: z.string().optional(),
        plan: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(({ ctx, input }) =>
        db.createConsultation({
          ...input,
          doctorId: ctx.user.id,
          date: new Date(),
        })
      ),
  }),

  // Exam results management
  exams: router({
    list: protectedProcedure
      .input(z.object({ consultationId: z.number() }))
      .query(({ input }) => db.getExamResultsByConsultation(input.consultationId)),
    create: protectedProcedure
      .input(z.object({
        consultationId: z.number(),
        patientId: z.number(),
        examType: z.string(),
        examDate: z.string().optional(),
        results: z.string(),
        normalRange: z.string().optional(),
        interpretation: z.string().optional(),
      }))
      .mutation(({ input }) => db.createExamResult(input)),
  }),

  // AI suggestions and analysis
  ai: router({
    generateSuggestions: protectedProcedure
      .input(z.object({
        consultationId: z.number(),
        patientId: z.number(),
        symptoms: z.string(),
        examResults: z.string().optional(),
        medicalHistory: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const prompt = `You are a medical AI assistant designed to support doctors with clinical decision-making.
Analyze the following patient information and provide diagnostic and treatment suggestions.

PATIENT INFORMATION:
Symptoms: ${input.symptoms}
${input.examResults ? `Exam Results: ${input.examResults}` : ""}
${input.medicalHistory ? `Medical History: ${input.medicalHistory}` : ""}

Provide your response in the following format:
1. DIFFERENTIAL DIAGNOSIS: List 3-5 possible diagnoses with brief explanations
2. RECOMMENDED TESTS: Suggest any additional tests that might be helpful
3. TREATMENT OPTIONS: Suggest treatment approaches (medications, therapies, lifestyle changes)
4. FOLLOW-UP: Recommend follow-up schedule and monitoring

IMPORTANT: These are suggestions only. The final diagnosis and treatment decisions must be made by the treating physician.`;

        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "You are a helpful medical assistant that provides clinical decision support. Always emphasize that your suggestions are for physician review only and not a substitute for clinical judgment.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
          });

          const content = typeof response.choices[0]?.message?.content === 'string' 
            ? response.choices[0].message.content 
            : "";

          if (content) {
            await db.createAISuggestion({
              consultationId: input.consultationId,
              patientId: input.patientId,
              suggestionType: "diagnosis",
              content: content,
              model: "gemini",
              confidence: 75,
            });
          }

          return {
            success: true,
            suggestion: content,
          };
        } catch (error) {
          console.error("[AI] Error generating suggestions:", error);
          return {
            success: false,
            error: "Failed to generate AI suggestions",
          };
        }
      }),

    getSuggestions: protectedProcedure
      .input(z.object({ consultationId: z.number() }))
      .query(({ input }) => db.getAISuggestionsByConsultation(input.consultationId)),

    reviewSuggestion: protectedProcedure
      .input(z.object({
        suggestionId: z.number(),
        approved: z.boolean(),
      }))
      .mutation(({ ctx, input }) =>
        db.reviewAISuggestion(
          input.suggestionId,
          input.approved ? 1 : -1,
          ctx.user.id
        )
      ),
  }),

  // AI Explanations
  explanations: router({
    create: protectedProcedure
      .input(z.object({
        suggestionId: z.number(),
        reasoning: z.string(),
        keyFactors: z.string().optional(),
        evidenceLinks: z.string().optional(),
        alternativeOptions: z.string().optional(),
      }))
      .mutation(({ input }) => db.createAIExplanation(input)),
    
    get: protectedProcedure
      .input(z.object({ suggestionId: z.number() }))
      .query(({ input }) => db.getAIExplanationBySuggestion(input.suggestionId)),
  }),

  // Suggestion Feedback
  feedback: router({
    create: protectedProcedure
      .input(z.object({
        suggestionId: z.number(),
        approved: z.boolean(),
        feedback: z.string().optional(),
        clinicalRelevance: z.number().min(1).max(5).optional(),
        accuracy: z.number().min(1).max(5).optional(),
        usefulness: z.number().min(1).max(5).optional(),
      }))
      .mutation(({ ctx, input }) => 
        db.createSuggestionFeedback({
          ...input,
          doctorId: ctx.user.id,
        })
      ),
    
    get: protectedProcedure
      .input(z.object({ suggestionId: z.number() }))
      .query(({ input }) => db.getSuggestionFeedback(input.suggestionId)),
  }),

  // Patient Consent Management
  consent: router({
    create: protectedProcedure
      .input(z.object({
        patientId: z.number(),
        consentType: z.enum(["data_processing", "ai_analysis", "research", "data_sharing"]),
        consentGiven: z.boolean(),
        expiryDate: z.date().optional(),
        documentUrl: z.string().optional(),
      }))
      .mutation(({ ctx, input }) =>
        db.createPatientConsent({
          ...input,
          consentDate: new Date(),
          ipAddress: ctx.req.ip || "unknown",
        })
      ),
    
    get: protectedProcedure
      .input(z.object({ patientId: z.number(), consentType: z.string() }))
      .query(({ input }) => db.getPatientConsent(input.patientId, input.consentType)),
    
    getAll: protectedProcedure
      .input(z.object({ patientId: z.number() }))
      .query(({ input }) => db.getAllPatientConsents(input.patientId)),
  }),

  // Data Retention Policy
  retention: router({
    create: protectedProcedure
      .input(z.object({
        patientId: z.number(),
        retentionPeriodMonths: z.number().default(36),
      }))
      .mutation(({ input }) => db.createDataRetentionPolicy(input)),
    
    get: protectedProcedure
      .input(z.object({ patientId: z.number() }))
      .query(({ input }) => db.getDataRetentionPolicy(input.patientId)),
    
    update: protectedProcedure
      .input(z.object({
        patientId: z.number(),
        deletionScheduledDate: z.date().optional(),
        deletionCompletedDate: z.date().optional(),
        deletionReason: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const { patientId, ...data } = input;
        return db.updateDataRetentionPolicy(patientId, data);
      }),
  }),

  // Medical Images
  images: router({
    create: protectedProcedure
      .input(z.object({
        consultationId: z.number(),
        patientId: z.number(),
        imageType: z.string(),
        imageUrl: z.string(),
        imageKey: z.string(),
        description: z.string().optional(),
      }))
      .mutation(({ input }) => db.createMedicalImage(input)),
    
    list: protectedProcedure
      .input(z.object({ consultationId: z.number() }))
      .query(({ input }) => db.getMedicalImagesByConsultation(input.consultationId)),
    
    get: protectedProcedure
      .input(z.object({ imageId: z.number() }))
      .query(({ input }) => db.getMedicalImageById(input.imageId)),
    
    analyzeImage: protectedProcedure
      .input(z.object({
        imageId: z.number(),
        analysisPrompt: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const image = await db.getMedicalImageById(input.imageId);
        if (!image) throw new Error("Image not found");

        const prompt = input.analysisPrompt || `Analyze this medical image (${image.imageType}) and provide:
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
                content: "You are a medical imaging AI assistant. Provide detailed analysis of medical images for physician review.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
          });

          const analysisResult = typeof response.choices[0]?.message?.content === 'string'
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
    createProtocol: protectedProcedure
      .input(z.object({
        protocolName: z.string(),
        description: z.string().optional(),
        principalInvestigator: z.string(),
        institution: z.string().optional(),
        startDate: z.date(),
        endDate: z.date().optional(),
        ethicsApprovalNumber: z.string().optional(),
        ethicsApprovalDate: z.date().optional(),
      }))
      .mutation(({ input }) => db.createResearchProtocol(input)),
    
    getProtocol: protectedProcedure
      .input(z.object({ protocolId: z.number() }))
      .query(({ input }) => db.getResearchProtocolById(input.protocolId)),
    
    listProtocols: protectedProcedure.query(() => db.getAllResearchProtocols()),
    
    updateProtocol: protectedProcedure
      .input(z.object({
        protocolId: z.number(),
        status: z.enum(["draft", "active", "completed", "suspended"]).optional(),
        ethicsApprovalNumber: z.string().optional(),
        ethicsApprovalDate: z.date().optional(),
      }))
      .mutation(({ input }) => {
        const { protocolId, ...data } = input;
        return db.updateResearchProtocol(protocolId, data);
      }),
    
    enrollParticipant: protectedProcedure
      .input(z.object({
        protocolId: z.number(),
        patientId: z.number(),
        consentDocumentUrl: z.string().optional(),
        consentGiven: z.boolean(),
      }))
      .mutation(({ input }) => db.enrollResearchParticipant(input)),
    
    getParticipants: protectedProcedure
      .input(z.object({ protocolId: z.number() }))
      .query(({ input }) => db.getResearchParticipantsByProtocol(input.protocolId)),
    
    updateParticipant: protectedProcedure
      .input(z.object({
        participantId: z.number(),
        status: z.enum(["enrolled", "active", "completed", "withdrawn"]).optional(),
        withdrawalDate: z.date().optional(),
      }))
      .mutation(({ input }) => {
        const { participantId, ...data } = input;
        return db.updateResearchParticipant(participantId, data);
      }),
  }),

  // EHR Integration
  ehr: router({
    mapFhirData: protectedProcedure
      .input(z.object({
        patientId: z.number(),
        externalEhrId: z.string(),
        ehrSystem: z.string(),
        fhirResourceType: z.string().optional(),
        fhirData: z.string(),
      }))
      .mutation(({ input }) => db.createHL7FhirMapping(input)),
    
    getEhrMapping: protectedProcedure
      .input(z.object({ patientId: z.number() }))
      .query(({ input }) => db.getHL7FhirMappingByPatient(input.patientId)),
    
    syncEhrData: protectedProcedure
      .input(z.object({
        mappingId: z.number(),
        fhirData: z.string(),
      }))
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
    list: protectedProcedure.query(({ ctx }) =>
      db.getNotificationsByUser(ctx.user.id)
    ),
    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(({ input }) => db.markNotificationAsRead(input.notificationId)),
  }),

  // Statistics
  stats: router({
    overview: protectedProcedure.query(async ({ ctx }) => {
      const patientCount = await db.getPatientCountByDoctor(ctx.user.id);
      const consultationCount = await db.getConsultationCountByDoctor(ctx.user.id);
      const aiStats = await db.getAISuggestionStats(ctx.user.id);
      
      return {
        patientCount,
        consultationCount,
        aiStats,
      };
    }),
  }),

  // Reports
  reports: router({
    generateConsultationReport: protectedProcedure
      .input(z.object({ consultationId: z.number() }))
      .query(async ({ input }) => {
        const consultation = await db.getConsultationById(input.consultationId);
        const patient = consultation ? await db.getPatientById(consultation.patientId) : null;
        const examResults = consultation ? await db.getExamResultsByConsultation(input.consultationId) : [];
        const aiSuggestions = consultation ? await db.getAISuggestionsByConsultation(input.consultationId) : [];
        
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
});

export type AppRouter = typeof appRouter;
