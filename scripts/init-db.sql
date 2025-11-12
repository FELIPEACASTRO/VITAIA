-- VITAIA Medical AI - Database Initialization Script
-- This script sets up the initial database configuration for production

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Set timezone
SET timezone = 'UTC';

-- Create indexes for better performance
-- These will be created after the tables are created by Drizzle migrations

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Insert default medical specialties
INSERT INTO "medicalSpecialties" (name, "englishName", description) VALUES
('Medicina Geral', 'General Medicine', 'Especialidade médica que aborda o cuidado integral do paciente'),
('Cardiologia', 'Cardiology', 'Especialidade médica que trata das doenças do coração e sistema cardiovascular'),
('Neurologia', 'Neurology', 'Especialidade médica que trata das doenças do sistema nervoso'),
('Pediatria', 'Pediatrics', 'Especialidade médica que cuida da saúde de crianças e adolescentes'),
('Ginecologia', 'Gynecology', 'Especialidade médica que trata da saúde da mulher'),
('Ortopedia', 'Orthopedics', 'Especialidade médica que trata das doenças do sistema musculoesquelético'),
('Dermatologia', 'Dermatology', 'Especialidade médica que trata das doenças da pele'),
('Psiquiatria', 'Psychiatry', 'Especialidade médica que trata dos transtornos mentais'),
('Oftalmologia', 'Ophthalmology', 'Especialidade médica que trata das doenças dos olhos'),
('Otorrinolaringologia', 'Otorhinolaryngology', 'Especialidade médica que trata das doenças do ouvido, nariz e garganta')
ON CONFLICT (name) DO NOTHING;

-- Insert sample clinical guidelines
INSERT INTO "clinicalGuidelines" ("specialtyId", condition, "guidelineContent", source, "publicationYear") VALUES
(1, 'Hipertensão Arterial', 'Diagnóstico: PA ≥140/90 mmHg em duas medidas. Tratamento: mudanças no estilo de vida + medicação se necessário.', 'SBC - Sociedade Brasileira de Cardiologia', 2023),
(1, 'Diabetes Mellitus Tipo 2', 'Diagnóstico: Glicemia de jejum ≥126 mg/dL ou HbA1c ≥6,5%. Tratamento: dieta, exercício, metformina como primeira linha.', 'SBD - Sociedade Brasileira de Diabetes', 2023),
(2, 'Infarto Agudo do Miocárdio', 'Diagnóstico: sintomas + ECG + troponinas. Tratamento: reperfusão urgente, AAS, estatina, betabloqueador.', 'SBC - Sociedade Brasileira de Cardiologia', 2023)
ON CONFLICT DO NOTHING;

-- Create performance indexes (will be created after tables exist)
-- Note: These will be executed by a separate migration script

-- Log the initialization
INSERT INTO "auditLogs" (action, "resourceType", details, "ipAddress") VALUES
('DATABASE_INIT', 'system', '{"message": "Database initialized with default data"}', '127.0.0.1');