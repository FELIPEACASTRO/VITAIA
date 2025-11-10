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

          // Save AI suggestion to database
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
});

export type AppRouter = typeof appRouter;
