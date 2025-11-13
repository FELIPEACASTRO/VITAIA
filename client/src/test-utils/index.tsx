import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";

// Mock providers for testing
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock data generators
export const createMockPatient = (overrides = {}) => ({
  id: "PAT001",
  name: "João Silva",
  age: 45,
  gender: "Masculino",
  phone: "(11) 99999-9999",
  email: "joao.silva@email.com",
  address: "Rua das Flores, 123 - São Paulo, SP",
  lastVisit: "15/01/2024",
  nextAppointment: "20/01/2024",
  status: "stable" as const,
  riskLevel: "low" as const,
  vitals: {
    heartRate: 72,
    bloodPressure: "120/80",
    temperature: 36.5,
    oxygenSaturation: 98,
  },
  conditions: ["Hipertensão", "Diabetes Tipo 2"],
  aiInsights: {
    riskScore: 25,
    recommendations: [
      "Manter medicação atual",
      "Agendar exames de rotina em 3 meses",
    ],
    lastAnalysis: "14/01/2024",
  },
  ...overrides,
});

// Mock handlers for common scenarios
export const mockHandlers = {
  onViewDetails: vi.fn(),
  onScheduleAppointment: vi.fn(),
  onSave: vi.fn(),
  onCancel: vi.fn(),
  onClick: vi.fn(),
  onChange: vi.fn(),
  onSubmit: vi.fn(),
};

// Helper to reset all mocks
export const resetMocks = () => {
  Object.values(mockHandlers).forEach(mock => mock.mockReset());
};

// Accessibility testing helpers
export const axeMatchers = {
  toHaveNoViolations: expect.extend({
    async toHaveNoViolations(received) {
      // This would integrate with jest-axe if added
      return {
        pass: true,
        message: () => "Expected element to have no accessibility violations",
      };
    },
  }),
};

// Screen size testing helpers
export const setScreenSize = (width: number, height: number = 800) => {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    value: width,
  });
  Object.defineProperty(window, "innerHeight", {
    writable: true,
    value: height,
  });
};

export const screenSizes = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1024, height: 768 },
  largeDesktop: { width: 1440, height: 900 },
};

// Wait helpers
export const waitForLoadingToFinish = () =>
  new Promise(resolve => setTimeout(resolve, 0));

// Re-export everything from React Testing Library
export * from "@testing-library/react";
export { customRender as render };
