export class EnvConfig {
  private static instance: EnvConfig;
  
  private readonly _supabaseUrl: string;
  private readonly _supabaseKey: string;
  private readonly _supabaseProjectId: string;
  
  private readonly _appName: string;
  private readonly _appVersion: string;
  
  private readonly _nodeEnv: string;
  private readonly _isDevelopment: boolean;
  private readonly _isProduction: boolean;

  private constructor() {
    this._supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    this._supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
    this._supabaseProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || '';
    
    this._appName = import.meta.env.VITE_APP_NAME || 'SorrIA - ERP';
    this._appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';
    
    this._nodeEnv = import.meta.env.MODE || 'development';
    this._isDevelopment = import.meta.env.DEV;
    this._isProduction = import.meta.env.PROD;
  }

  public static getInstance(): EnvConfig {
    if (!EnvConfig.instance) {
      EnvConfig.instance = new EnvConfig();
    }
    return EnvConfig.instance;
  }

  public validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this._supabaseUrl) {
      errors.push('VITE_SUPABASE_URL não está configurada');
    }
    if (!this._supabaseKey) {
      errors.push('VITE_SUPABASE_PUBLISHABLE_KEY não está configurada');
    }
    if (!this._supabaseProjectId) {
      errors.push('VITE_SUPABASE_PROJECT_ID não está configurada');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  get supabaseUrl(): string {
    return this._supabaseUrl;
  }

  get supabaseKey(): string {
    return this._supabaseKey;
  }

  get supabaseProjectId(): string {
    return this._supabaseProjectId;
  }

  get appName(): string {
    return this._appName;
  }

  get appVersion(): string {
    return this._appVersion;
  }

  get nodeEnv(): string {
    return this._nodeEnv;
  }

  get isDevelopment(): boolean {
    return this._isDevelopment;
  }

  get isProduction(): boolean {
    return this._isProduction;
  }

  public getSupabaseConfig() {
    return {
      url: this._supabaseUrl,
      key: this._supabaseKey,
      projectId: this._supabaseProjectId,
    };
  }

  public getAppConfig() {
    return {
      name: this._appName,
      version: this._appVersion,
      environment: this._nodeEnv,
    };
  }

  public getAll() {
    return {
      supabase: this.getSupabaseConfig(),
      app: this.getAppConfig(),
      environment: {
        nodeEnv: this._nodeEnv,
        isDevelopment: this._isDevelopment,
        isProduction: this._isProduction,
      }
    };
  }
}

export const envConfig = EnvConfig.getInstance();

export function generateEnvTemplate(): string {
  return `# ==============================================
# Configurações do SorrIA - ERP
# ==============================================

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id

# App (opcional)
VITE_APP_NAME=SorrIA - ERP
VITE_APP_VERSION=1.0.0
`.trim();
}

if (import.meta.env.DEV) {
  const validation = envConfig.validate();
  if (!validation.valid) {
    console.warn('⚠️ Configurações incompletas:', validation.errors);
  }
}
