# VITAIA - Medical AI Assistant

## Project Overview

VITAIA (Vita + AI = "The AI of Life") is a comprehensive medical AI platform designed to assist healthcare professionals with clinical decision-making. The platform combines symptom analysis, medical exam results, patient history, and clinical guidelines to provide AI-powered suggestions for diagnosis, treatment, and medication.

**Status:** Successfully migrated from MySQL to PostgreSQL for Replit environment  
**Last Updated:** November 11, 2025

## Tech Stack

### Frontend
- React 19 with TypeScript
- Vite 7 (build tool)
- Tailwind CSS 4 + Shadcn/UI components
- tRPC for type-safe API communication
- Wouter for routing

### Backend
- Node.js with Express 4
- tRPC 11 (RPC framework)
- PostgreSQL database (Replit-provided)
- Drizzle ORM for database queries

### Key Features
- 22 database tables covering patients, consultations, AI suggestions, medical images, research protocols, and more
- Multi-specialty support (50+ Brazilian medical specialties)
- LGPD compliance (Brazilian GDPR) with audit logs and patient consent tracking
- AI explainability system for transparency
- Medical image analysis support
- Research protocol management for clinical trials
- HL7/FHIR integration for EHR interoperability

## Project Structure

```
├── client/               # Frontend React application
│   ├── src/
│   │   ├── pages/       # Page components (Dashboard, Login, PatientDetail, etc.)
│   │   ├── components/  # Reusable UI components (Shadcn/UI)
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utilities and tRPC client
│   └── index.html
├── server/              # Backend Express server
│   ├── _core/          # Core infrastructure
│   │   ├── index.ts    # Server entry point
│   │   ├── oauth.ts    # Manus OAuth integration
│   │   ├── llm.ts      # AI/LLM integration
│   │   └── trpc.ts     # tRPC setup
│   ├── routers.ts      # tRPC API routes
│   ├── db.ts           # Database query helpers
│   └── storage.ts      # Data storage logic
├── drizzle/            # Database schema and migrations
│   ├── schema.ts       # PostgreSQL table definitions
│   └── 0000_*.sql      # Migration files
└── shared/             # Shared code between frontend and backend
```

## Environment Configuration

The following environment variables are used:

### Database (Auto-configured by Replit)
- `DATABASE_URL` - PostgreSQL connection string

### Authentication (Manus OAuth)
- `VITE_APP_ID` - Application ID for Manus OAuth
- `JWT_SECRET` - Secret for cookie signing
- `OAUTH_SERVER_URL` - OAuth server URL (default: https://api.manus.im)
- `OWNER_OPEN_ID` - OpenID of the owner/admin user

### AI/ML Features
- `BUILT_IN_FORGE_API_URL` - Forge API endpoint
- `BUILT_IN_FORGE_API_KEY` - Forge API key for AI features

## Database Schema

**22 Tables:**
1. `users` - Medical professionals (doctors)
2. `patients` - Patient information
3. `consultations` - Medical consultations/visits
4. `examResults` - Lab and diagnostic test results
5. `aiSuggestions` - AI-generated clinical suggestions
6. `aiExplanations` - Explanations for AI suggestions
7. `suggestionFeedback` - Doctor feedback on AI suggestions
8. `auditLogs` - LGPD compliance audit trail
9. `notifications` - Real-time notifications
10. `patientConsent` - LGPD consent management
11. `dataRetentionPolicy` - Data retention policies
12. `medicalImages` - Medical imaging (X-rays, CT, MRI)
13. `researchProtocol` - Clinical trial protocols
14. `researchParticipant` - Research study participants
15. `hl7FhirMapping` - EHR integration mappings
16. `medicalSpecialties` - Medical specialties catalog
17. `doctorSpecialties` - Doctor-specialty associations
18. `clinicalGuidelines` - Evidence-based clinical guidelines
19. `specialtyMedications` - Specialty-specific medication catalog
20. `specialtyDiagnosticTests` - Specialty-specific diagnostic tests
21. `specialtyProcedures` - Specialty-specific procedures
22. `consultationSpecialty` - Consultation-specialty links

## Running the Project

### Development Mode
The project runs automatically via the configured workflow:
```bash
npm run dev
```

This starts:
- Backend server on port 5000 (Express + Vite middleware)
- Frontend served via Vite HMR
- Both accessible at the Replit preview URL

### Database Migrations
```bash
npm run db:push        # Generate and apply migrations
npm run db:push --force # Force apply (if schema changes conflict)
```

### Build for Production
```bash
npm run build   # Build frontend and backend
npm start       # Run production server
```

## Recent Changes (Migration to Replit)

### November 11, 2025 - Complete Setup & Routing Implementation

1. **Database Migration (MySQL → PostgreSQL)** ✅
   - Converted all 22 tables from MySQL to PostgreSQL
   - Changed `mysqlTable` to `pgTable`
   - Changed `mysqlEnum` to `pgEnum` (created 8 enum types)
   - Converted `int().autoincrement()` to `serial()`
   - Updated timestamp handling for `updatedAt` fields
   - Replaced `onDuplicateKeyUpdate` with `onConflictDoUpdate` in upsert logic
   - Migrations applied successfully with `npm run db:push`

2. **Server Configuration** ✅
   - Configured server to bind to `0.0.0.0:5000` (required for Replit)
   - Updated Vite to use HMR over WSS with proper client port
   - Removed port-finding logic (uses fixed port 5000)

3. **Dependencies** ✅
   - Added `postgres` package for PostgreSQL connectivity
   - Updated `drizzle-orm` to use `postgres-js` driver

4. **Critical Routing Fixes** ✅ NEW
   - Fixed missing routes in App.tsx (was 2, now 9 complete routes)
   - Implemented all page routes:
     - `/` - Home Dashboard
     - `/pacientes` - Patient List
     - `/paciente/:patientId` - Patient Detail
     - `/analytics` - Statistics
     - `/auditoria` - Audit Log
     - `/relatorios` - Report Generator
     - `/componentes` - Component Showcase
     - `/404` - Not Found
   - Fixed navigation links in DashboardLayout (corrected menu paths)
   - Implemented onClick handlers in Home page buttons
   - Updated patient detail navigation in Dashboard

5. **Documentation** ✅ NEW
   - Created SETUP_COMPLETO.md with full implementation guide
   - Updated replit.md with complete architecture details

## Design System

**Color Palette:**
- Verde Vivo (#10B981) - Success, positive actions
- Azul Ciano (#06B6D4) - Information, highlights
- Roxo Moderno (#8B5CF6) - AI elements
- Vermelho Alerta (#EF4444) - Errors, critical warnings
- Âmbar Aviso (#F59E0B) - Warnings, attention

**Typography:**
- Headlines: Inter Bold (700)
- Body: Inter Regular (400)
- Code: JetBrains Mono

## Compliance & Security

### LGPD Compliance
- Patient consent tracking (`patientConsent` table)
- Complete audit logging (`auditLogs` table)
- Data retention policies (`dataRetentionPolicy` table)
- Right to be forgotten support

### Security Features
- Manus OAuth authentication
- JWT-based sessions
- Audit trail for all operations
- IP address logging for compliance

## AI Features

### Suggestion Types
- **Diagnosis** - Differential diagnosis suggestions
- **Treatment** - Treatment plan recommendations
- **Medication** - Medication suggestions with dosing
- **Summary** - Clinical summary generation

### Explainability
Each AI suggestion includes:
- Step-by-step reasoning
- Key factors considered
- Evidence links and references
- Alternative options

### Quality Feedback
Doctors can rate AI suggestions on:
- Clinical relevance (1-5)
- Accuracy (1-5)
- Usefulness (1-5)

## Future Roadmap

### Short-term (0-3 months)
- [ ] Complete OAuth setup with Manus
- [ ] Configure AI API keys (Gemini/LLM)
- [ ] Test with real medical professionals
- [ ] Deploy to production

### Medium-term (3-6 months)
- [ ] Clinical trial pilot study
- [ ] Real EHR integration (HL7/FHIR)
- [ ] Medical image AI analysis
- [ ] Mobile app development

### Long-term (6-12 months)
- [ ] ANVISA regulatory approval
- [ ] Scale to 1000+ doctors
- [ ] Latin America expansion
- [ ] Monetization strategy

## Setup Complete! ✅

The project is successfully running on Replit with all migrations complete and the development server operational.

**What's Working:**
- ✅ PostgreSQL database with all 22 tables created
- ✅ Frontend running on port 5000 with Vite HMR
- ✅ Backend Express server with tRPC API
- ✅ Environment variables configured
- ✅ Manus OAuth integration ready (requires app registration)
- ✅ Deployment configuration set up

**Next Steps for Production:**
1. Register the app with Manus OAuth to get a real `VITE_APP_ID`
2. Configure AI API keys (Gemini or other LLM provider)
3. Set up S3 or object storage for medical images
4. Add real medical professionals for testing
5. Click the "Publish" button to deploy

## Known Issues

None at this time. Project successfully running on Replit with PostgreSQL.

## Documentation

Additional documentation available:
- `VITAIA_DESIGN_SYSTEM.md` - Complete design system guide
- `ANVISA_COMPLIANCE.md` - Regulatory compliance documentation
- `SCALABILITY_ROADMAP.md` - Technical scalability planning
- `todo.md` - Current development tasks

## Support

For issues or questions about this deployment, check:
1. Console logs in the workflow output
2. Database connection status
3. Environment variables configuration
