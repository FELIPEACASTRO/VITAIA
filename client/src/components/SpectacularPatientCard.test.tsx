import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import SpectacularPatientCard from "./SpectacularPatientCard";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    circle: ({ children, ...props }: any) => (
      <circle {...props}>{children}</circle>
    ),
  },
}));

const mockPatient = {
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
  conditions: ["Hipertensão", "Diabetes Tipo 2", "Colesterol Alto"],
  aiInsights: {
    riskScore: 25,
    recommendations: [
      "Manter medicação atual",
      "Agendar exames de rotina em 3 meses",
      "Continuar dieta balanceada",
    ],
    lastAnalysis: "14/01/2024",
  },
};

describe("SpectacularPatientCard", () => {
  describe("Basic Rendering", () => {
    it("renders patient information correctly", () => {
      render(<SpectacularPatientCard patient={mockPatient} />);

      // Patient name and basic info
      expect(screen.getByText("João Silva")).toBeInTheDocument();
      expect(screen.getByText("45 anos • Masculino")).toBeInTheDocument();
      expect(screen.getByText("ID: PAT001")).toBeInTheDocument();
    });

    it("displays contact information", () => {
      render(<SpectacularPatientCard patient={mockPatient} />);

      expect(screen.getByText("(11) 99999-9999")).toBeInTheDocument();
      expect(screen.getByText("joao.silva@email.com")).toBeInTheDocument();
      expect(
        screen.getByText("Rua das Flores, 123 - São Paulo, SP")
      ).toBeInTheDocument();
    });

    it("shows vitals information", () => {
      render(<SpectacularPatientCard patient={mockPatient} />);

      expect(screen.getByText("72 bpm")).toBeInTheDocument();
      expect(screen.getByText("120/80")).toBeInTheDocument();
      expect(screen.getByText("36.5°C")).toBeInTheDocument();
      expect(screen.getByText("SpO2 98%")).toBeInTheDocument();
    });

    it("displays appointment information", () => {
      render(<SpectacularPatientCard patient={mockPatient} />);

      expect(screen.getByText("15/01/2024")).toBeInTheDocument();
      expect(screen.getByText("20/01/2024")).toBeInTheDocument();
    });
  });

  describe("Status and Risk Level", () => {
    it("displays stable status correctly", () => {
      render(<SpectacularPatientCard patient={mockPatient} />);

      expect(screen.getByText("Baixo Risco")).toBeInTheDocument();
    });

    it("displays attention status correctly", () => {
      const attentionPatient = {
        ...mockPatient,
        status: "attention" as const,
        riskLevel: "medium" as const,
      };
      render(<SpectacularPatientCard patient={attentionPatient} />);

      expect(screen.getByText("Risco Moderado")).toBeInTheDocument();
    });

    it("displays critical status correctly", () => {
      const criticalPatient = {
        ...mockPatient,
        status: "critical" as const,
        riskLevel: "high" as const,
      };
      render(<SpectacularPatientCard patient={criticalPatient} />);

      expect(screen.getByText("Alto Risco")).toBeInTheDocument();
    });
  });

  describe("Medical Conditions", () => {
    it("displays first 3 conditions", () => {
      render(<SpectacularPatientCard patient={mockPatient} />);

      expect(screen.getByText("Hipertensão")).toBeInTheDocument();
      expect(screen.getByText("Diabetes Tipo 2")).toBeInTheDocument();
      expect(screen.getByText("Colesterol Alto")).toBeInTheDocument();
    });

    it("shows +X mais when more than 3 conditions", () => {
      const patientWithManyConditions = {
        ...mockPatient,
        conditions: [
          "Hipertensão",
          "Diabetes",
          "Colesterol",
          "Asma",
          "Artrite",
        ],
      };
      render(<SpectacularPatientCard patient={patientWithManyConditions} />);

      expect(screen.getByText("+2 mais")).toBeInTheDocument();
    });

    it("does not show conditions section when empty", () => {
      const patientWithoutConditions = { ...mockPatient, conditions: [] };
      render(<SpectacularPatientCard patient={patientWithoutConditions} />);

      expect(screen.queryByText("Condições Médicas")).not.toBeInTheDocument();
    });
  });

  describe("AI Insights", () => {
    it("displays AI risk score", () => {
      render(<SpectacularPatientCard patient={mockPatient} />);

      expect(screen.getByText("25%")).toBeInTheDocument();
      expect(screen.getByText("Risco IA")).toBeInTheDocument();
    });

    it("shows AI recommendations", () => {
      render(<SpectacularPatientCard patient={mockPatient} />);

      expect(screen.getByText("• Manter medicação atual")).toBeInTheDocument();
      expect(
        screen.getByText("• Agendar exames de rotina em 3 meses")
      ).toBeInTheDocument();
    });

    it("displays last analysis date", () => {
      render(<SpectacularPatientCard patient={mockPatient} />);

      expect(
        screen.getByText("Última análise: 14/01/2024")
      ).toBeInTheDocument();
    });
  });

  describe("Avatar", () => {
    it("generates correct initials for patient name", () => {
      render(<SpectacularPatientCard patient={mockPatient} />);

      expect(screen.getByText("JS")).toBeInTheDocument();
    });

    it("handles single name correctly", () => {
      const singleNamePatient = { ...mockPatient, name: "João" };
      render(<SpectacularPatientCard patient={singleNamePatient} />);

      expect(screen.getByText("J")).toBeInTheDocument();
    });

    it("handles multiple names correctly", () => {
      const multipleNamePatient = {
        ...mockPatient,
        name: "João Pedro Silva Santos",
      };
      render(<SpectacularPatientCard patient={multipleNamePatient} />);

      expect(screen.getByText("JP")).toBeInTheDocument();
    });
  });

  describe("Action Buttons", () => {
    it("renders action buttons", () => {
      render(<SpectacularPatientCard patient={mockPatient} />);

      expect(
        screen.getByRole("button", { name: /ver detalhes/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /agendar/i })
      ).toBeInTheDocument();
    });

    it("calls onViewDetails when Ver Detalhes is clicked", async () => {
      const user = userEvent.setup();
      const mockOnViewDetails = vi.fn();

      render(
        <SpectacularPatientCard
          patient={mockPatient}
          onViewDetails={mockOnViewDetails}
        />
      );

      const viewDetailsButton = screen.getByRole("button", {
        name: /ver detalhes/i,
      });
      await user.click(viewDetailsButton);

      expect(mockOnViewDetails).toHaveBeenCalledWith("PAT001");
      expect(mockOnViewDetails).toHaveBeenCalledTimes(1);
    });

    it("calls onScheduleAppointment when Agendar is clicked", async () => {
      const user = userEvent.setup();
      const mockOnScheduleAppointment = vi.fn();

      render(
        <SpectacularPatientCard
          patient={mockPatient}
          onScheduleAppointment={mockOnScheduleAppointment}
        />
      );

      const scheduleButton = screen.getByRole("button", { name: /agendar/i });
      await user.click(scheduleButton);

      expect(mockOnScheduleAppointment).toHaveBeenCalledWith("PAT001");
      expect(mockOnScheduleAppointment).toHaveBeenCalledTimes(1);
    });

    it("does not crash when callback functions are not provided", async () => {
      const user = userEvent.setup();

      render(<SpectacularPatientCard patient={mockPatient} />);

      const viewDetailsButton = screen.getByRole("button", {
        name: /ver detalhes/i,
      });
      const scheduleButton = screen.getByRole("button", { name: /agendar/i });

      // Should not throw errors
      await user.click(viewDetailsButton);
      await user.click(scheduleButton);

      expect(viewDetailsButton).toBeInTheDocument();
      expect(scheduleButton).toBeInTheDocument();
    });
  });

  describe("Conditional Rendering", () => {
    it("handles missing next appointment", () => {
      const patientWithoutNextAppointment = {
        ...mockPatient,
        nextAppointment: undefined,
      };
      render(
        <SpectacularPatientCard patient={patientWithoutNextAppointment} />
      );

      expect(screen.getByText("Última consulta:")).toBeInTheDocument();
      expect(screen.queryByText("Próxima consulta:")).not.toBeInTheDocument();
    });

    it("shows next appointment when available", () => {
      render(<SpectacularPatientCard patient={mockPatient} />);

      expect(screen.getByText("Próxima consulta:")).toBeInTheDocument();
      expect(screen.getByText("20/01/2024")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper button roles", () => {
      render(<SpectacularPatientCard patient={mockPatient} />);

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(2);
    });

    it("supports keyboard navigation", async () => {
      const user = userEvent.setup();
      const mockOnViewDetails = vi.fn();

      render(
        <SpectacularPatientCard
          patient={mockPatient}
          onViewDetails={mockOnViewDetails}
        />
      );

      const viewDetailsButton = screen.getByRole("button", {
        name: /ver detalhes/i,
      });

      // Focus and activate with keyboard
      viewDetailsButton.focus();
      await user.keyboard("{Enter}");

      expect(mockOnViewDetails).toHaveBeenCalledWith("PAT001");
    });

    it("has meaningful text content for screen readers", () => {
      render(<SpectacularPatientCard patient={mockPatient} />);

      // Important information should be accessible
      expect(screen.getByText("Sinais Vitais")).toBeInTheDocument();
      expect(screen.getByText("Insights de IA")).toBeInTheDocument();
      expect(screen.getByText("Condições Médicas")).toBeInTheDocument();
    });
  });

  describe("Data Validation", () => {
    it("handles empty recommendations array", () => {
      const patientWithoutRecommendations = {
        ...mockPatient,
        aiInsights: {
          ...mockPatient.aiInsights,
          recommendations: [],
        },
      };
      render(
        <SpectacularPatientCard patient={patientWithoutRecommendations} />
      );

      expect(screen.getByText("Insights de IA")).toBeInTheDocument();
      expect(
        screen.queryByText("• Manter medicação atual")
      ).not.toBeInTheDocument();
    });

    it("handles extreme risk scores", () => {
      const highRiskPatient = {
        ...mockPatient,
        aiInsights: { ...mockPatient.aiInsights, riskScore: 95 },
      };
      render(<SpectacularPatientCard patient={highRiskPatient} />);

      expect(screen.getByText("95%")).toBeInTheDocument();
    });

    it("handles zero risk score", () => {
      const zeroRiskPatient = {
        ...mockPatient,
        aiInsights: { ...mockPatient.aiInsights, riskScore: 0 },
      };
      render(<SpectacularPatientCard patient={zeroRiskPatient} />);

      expect(screen.getByText("0%")).toBeInTheDocument();
    });
  });
});
