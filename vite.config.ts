import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

/**
 * Vite Configuration - SorrIA ERP
 * Implementa melhor organização com POO e code-splitting
 */
class ViteConfig {
  private mode: string;

  constructor(mode: string) {
    this.mode = mode;
  }

  /**
   * Configuração do servidor de desenvolvimento
   */
  private get serverConfig() {
    return {
      host: "0.0.0.0",
      port: 8080,
      strictPort: false,
      hmr: {
        overlay: false,
      },
    };
  }

  /**
   * Configuração de build otimizada
   * - Hashes de conteúdo
   * - Code-splitting por vendor
   * - Otimização de chunks
   */
  private get buildConfig() {
    return {
      /**
       * Limite de tamanho do chunk antes de emitir aviso
       */
      chunkSizeWarningLimit: 500,

      /**
       * Code-splitting para melhor performance
       */
      rollupOptions: {
        output: {
          /**
           * Hash de conteúdo para cache busting
           */
          entryFileNames: "assets/[name].[hash].js",
          chunkFileNames: "assets/[name].[hash].js",
          assetFileNames: "assets/[name].[hash].[ext]",

          /**
           * Separa vendors em chunks separados
           * React, Radix, etc. ficam em chunk próprio
           */
          manualChunks: {
            // React core
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            // UI components (Radix)
            'vendor-radix': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-select',
              '@radix-ui/react-tooltip',
              '@radix-ui/react-popover',
            ],
            // Form/validation
            'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
            // Icons
            'vendor-icons': ['lucide-react'],
            // Utils
            'vendor-utils': ['clsx', 'tailwind-merge', 'date-fns'],
          },
        },
      },
    };
  }

  /**
   * Aliases para importação de módulos
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
      server: this.serverConfig,
      build: this.buildConfig,
      plugins: [react()].filter(Boolean),
      resolve: this.resolveConfig,
    };
  }
}

// Exporta configuração usando a classe
export default defineConfig(({ mode }) => new ViteConfig(mode).generate());
