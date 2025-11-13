import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  root: path.resolve(import.meta.dirname),
  test: {
    globals: true,
    environment: "node",
    include: [
      "tests/**/*.test.ts",
      "tests/**/*.spec.ts",
      "server/**/*.test.ts",
      "server/**/*.spec.ts",
    ],
    exclude: [
      "node_modules/",
      "dist/",
      "**/*.d.ts",
      "**/*.config.*",
      "client/",
    ],
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      exclude: [
        "node_modules/",
        "dist/",
        "tests/",
        "**/*.d.ts",
        "**/*.config.*",
        "drizzle/",
        "client/",
        "**/*.test.ts",
        "**/*.spec.ts",
      ],
      // Configurações de cobertura para garantir qualidade
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        // Thresholds específicos para domínio (mais rigorosos)
        "server/domain/**": {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        // Thresholds para casos de uso
        "server/application/**": {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      },
      // Incluir apenas código de produção
      include: [
        "server/**/*.ts"
      ],
      // Reportar arquivos não testados
      all: true,
      // Configurações avançadas
      skipFull: false,
      watermarks: {
        statements: [50, 80],
        functions: [50, 80],
        branches: [50, 80],
        lines: [50, 80]
      }
    },
    // Configurações de timeout para testes de integração
    testTimeout: 10000,
    hookTimeout: 10000,
    // Executar testes em sequência para evitar conflitos de banco
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./server"),
      "@client": path.resolve(import.meta.dirname, "./client/src"),
      "@tests": path.resolve(import.meta.dirname, "./tests"),
    },
  },
});
