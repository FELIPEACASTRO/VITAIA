# 🧪 VITAIA Testing Guide

Este guia abrangente descreve a estratégia de testes implementada no VITAIA, seguindo as melhores práticas para aplicações React/TypeScript.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Configuração](#configuração)
- [Estrutura de Testes](#estrutura-de-testes)
- [Tipos de Testes](#tipos-de-testes)
- [Executando Testes](#executando-testes)
- [Escrevendo Testes](#escrevendo-testes)
- [Melhores Práticas](#melhores-práticas)
- [Troubleshooting](#troubleshooting)

## 🎯 Visão Geral

O VITAIA implementa uma estratégia de testes em pirâmide:

- **70% Testes Unitários**: Componentes isolados, hooks, funções utilitárias
- **20% Testes de Integração**: Fluxos entre componentes, APIs
- **10% Testes E2E**: Jornadas críticas de usuário

### Stack de Testes

- **Vitest**: Framework de testes rápido e moderno
- **React Testing Library**: Testes centrados no usuário
- **Jest DOM**: Matchers para elementos DOM
- **User Event**: Simulação realista de interações
- **TypeScript**: Tipagem estática nos testes

## ⚙️ Configuração

### Arquivos de Configuração

```
├── vitest.config.ts              # Testes backend
├── vitest.frontend.config.ts     # Testes frontend
├── tests/
│   ├── setup.ts                  # Setup backend
│   └── frontend-setup.ts         # Setup frontend
└── client/src/test-utils/
    └── index.tsx                 # Utilitários de teste
```

### Scripts Disponíveis

```bash
# Executar todos os testes
pnpm test

# Testes backend apenas
pnpm test:backend

# Testes frontend apenas
pnpm test:frontend

# Modo watch (desenvolvimento)
pnpm test:watch:frontend

# Coverage report
pnpm test:coverage:frontend

# Interface visual
pnpm test:ui:frontend
```

## 📁 Estrutura de Testes

### Organização de Arquivos

```
client/src/
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   └── button.test.tsx
│   ├── SpectacularPatientCard.tsx
│   └── SpectacularPatientCard.test.tsx
├── hooks/
│   ├── useMobile.tsx
│   └── useMobile.test.tsx
└── test-utils/
    └── index.tsx
```

### Convenções de Nomenclatura

- **Testes unitários**: `Component.test.tsx`
- **Testes de integração**: `Component.integration.test.tsx`
- **Testes de acessibilidade**: `Component.a11y.test.tsx`
- **Snapshots**: `__snapshots__/Component.test.tsx.snap`

## 🧪 Tipos de Testes

### 1. Testes Unitários de Componentes

```typescript
import { render, screen } from "@testing-library/react";
import { Button } from "./button";

describe("Button Component", () => {
  it("renders with correct text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click</Button>);
    await user.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 2. Testes de Hooks Customizados

```typescript
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "./useMobile";

describe("useIsMobile", () => {
  it("returns false for desktop screen", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      value: 1024,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });
});
```

### 3. Testes de Integração

```typescript
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PatientDashboard from "./PatientDashboard";

const renderWithProviders = (component) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe("PatientDashboard Integration", () => {
  it("loads and displays patient data", async () => {
    renderWithProviders(<PatientDashboard patientId="123" />);

    expect(screen.getByText("Carregando...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("João Silva")).toBeInTheDocument();
    });
  });
});
```

### 4. Testes de Acessibilidade

```typescript
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

describe("Button Accessibility", () => {
  it("should have no accessibility violations", async () => {
    const { container } = render(<Button>Accessible Button</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## 🚀 Executando Testes

### Desenvolvimento Local

```bash
# Executar testes em modo watch
pnpm test:watch:frontend

# Executar testes específicos
pnpm test:frontend -- button.test.tsx

# Executar com coverage
pnpm test:coverage:frontend

# Interface visual
pnpm test:ui:frontend
```

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## ✍️ Escrevendo Testes

### Estrutura de Teste

```typescript
describe("ComponentName", () => {
  describe("Rendering", () => {
    it("renders correctly with default props", () => {
      // Test basic rendering
    });
  });

  describe("Interactions", () => {
    it("handles user interactions", async () => {
      // Test user events
    });
  });

  describe("States", () => {
    it("handles different states", () => {
      // Test loading, error, success states
    });
  });

  describe("Accessibility", () => {
    it("is accessible", async () => {
      // Test a11y
    });
  });
});
```

### Usando Test Utils

```typescript
import { render, createMockPatient, mockHandlers } from "@/test-utils";

describe("PatientCard", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("displays patient information", () => {
    const patient = createMockPatient({ name: "Maria Silva" });

    render(
      <PatientCard
        patient={patient}
        onViewDetails={mockHandlers.onViewDetails}
      />
    );

    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
  });
});
```

### Mockando Dependências

```typescript
// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

// Mock APIs
vi.mock("@/lib/api", () => ({
  fetchPatients: vi.fn().mockResolvedValue([]),
}));
```

## 📏 Melhores Práticas

### 1. Teste Comportamento, Não Implementação

```typescript
// ❌ Evitar: testar implementação
expect(component.state.isLoading).toBe(true);

// ✅ Preferir: testar comportamento observável
expect(screen.getByText(/carregando/i)).toBeInTheDocument();
```

### 2. Use Queries Semânticas

```typescript
// ✅ Preferir queries por role/label
screen.getByRole("button", { name: /salvar/i });
screen.getByLabelText(/nome do paciente/i);

// ❌ Evitar queries por classe/id
screen.getByClassName("btn-primary");
```

### 3. Teste Estados de Loading e Error

```typescript
describe("PatientList", () => {
  it("shows loading state", () => {
    render(<PatientList />);
    expect(screen.getByText(/carregando/i)).toBeInTheDocument();
  });

  it("shows error state", async () => {
    vi.mocked(fetchPatients).mockRejectedValue(new Error("API Error"));

    render(<PatientList />);

    await waitFor(() => {
      expect(screen.getByText(/erro ao carregar/i)).toBeInTheDocument();
    });
  });
});
```

### 4. Mantenha Testes Determinísticos

```typescript
// ❌ Evitar dados voláteis
const timestamp = Date.now();

// ✅ Usar mocks determinísticos
vi.spyOn(Date, "now").mockReturnValue(1609459200000);
```

### 5. Agrupe Testes Logicamente

```typescript
describe("UserProfile", () => {
  describe("when user is authenticated", () => {
    // Testes para usuário autenticado
  });

  describe("when user is not authenticated", () => {
    // Testes para usuário não autenticado
  });
});
```

## 📊 Métricas de Qualidade

### Coverage Targets

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

### Performance Targets

- **Testes unitários**: < 30s total
- **Testes integração**: < 5min
- **Render time**: < 16ms (60fps)

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. "window.matchMedia is not a function"

```typescript
// Em frontend-setup.ts
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});
```

#### 2. "IntersectionObserver is not defined"

```typescript
// Em frontend-setup.ts
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

#### 3. Testes de Animação Falhando

```typescript
// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));
```

#### 4. Async/Await Issues

```typescript
// Use waitFor para operações assíncronas
await waitFor(() => {
  expect(screen.getByText("Loaded")).toBeInTheDocument();
});

// Use findBy para elementos que aparecem assincronamente
const element = await screen.findByText("Async Content");
```

### Debug de Testes

```typescript
// Ver o DOM atual
screen.debug();

// Ver queries disponíveis
screen.logTestingPlaygroundURL();

// Verificar se elemento existe
console.log(screen.queryByText("Text")); // null se não existir
```

## 📚 Recursos Adicionais

- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro)
- [Vitest Documentation](https://vitest.dev/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [Testing Playground](https://testing-playground.com/)

## 🎯 Próximos Passos

1. **Adicionar jest-axe** para testes automatizados de acessibilidade
2. **Implementar MSW** para mock de APIs
3. **Adicionar Playwright** para testes E2E
4. **Configurar Chromatic** para visual regression testing
5. **Integrar Storybook** para component testing

---

**Lembre-se**: Testes são documentação viva do seu código. Escreva testes que descrevam claramente o comportamento esperado e que sejam fáceis de entender e manter.
