import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

/**
 * Vitest Configuration - SorrIA ERP
 * Test runner configuration with POO
 */
class VitestConfig {
  
  private get pluginsConfig() {
    return [react()];
  }

  /**
   * Configuração de testes
   */
  private get testConfig() {
    return {
      /**
       * Ambiente de teste
       * jsdom = simula o navegador
       */
      environment: "jsdom",

      /**
       * Disponibiliza funções globais (describe, it, expect)
       * Sem precisar importar em cada arquivo
       */
      globals: true,

      /**
       * Arquivo de setup executado antes dos testes
       * Útil para configurar mocks, helpers, etc.
       */
      setupFiles: ["./src/test/setup.ts"],

      /**
       * Padrão de arquivos que são testes
       */
      include: ["src/**/*.{test,spec}.{ts,tsx}"],

      /**
       * Tempo máximo por teste (evita testes infinitos)
       */
      testTimeout: 10000,

      /**
       * Tempo máximo para hooks (beforeEach, etc.)
       */
      hookTimeout: 10000,
    };
  }

  /**
   * Aliases para imports
   */
  private get resolveConfig() {
    return {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    };
  }

  /**
   * Gera configuração final
   */
  public generate() {
    return {
      plugins: this.pluginsConfig.filter(Boolean),
      test: this.testConfig,
      resolve: this.resolveConfig,
    };
  }
}

// Exporta configuração usando a classe
export default defineConfig(() => new VitestConfig().generate());
