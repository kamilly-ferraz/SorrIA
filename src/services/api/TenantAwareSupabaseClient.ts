import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/Types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export class TenantRequiredError extends Error {
  constructor(message = 'Tenant ID é obrigatório para esta operação.') {
    super(message);
    this.name = 'TenantRequiredError';
  }
}

export class TenantInjectionError extends Error {
  constructor(message = 'Tentativa de injeção de tenantId detectada.') {
    super(message);
    this.name = 'TenantInjectionError';
  }
}

export type TenantResolver = () => string | null;

export class TenantAwareSupabaseClient {
  private client: SupabaseClient<Database> | null = null;
  private tenantResolver: TenantResolver;

  constructor(tenantResolver: TenantResolver) {
    if (!tenantResolver) {
      throw new Error('Tenant resolver function é obrigatória');
    }
    
    this.tenantResolver = tenantResolver;
  }

  private getClient(): SupabaseClient<Database> {
    if (!this.client) {
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase credentials not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
      }
      this.client = createClient<Database>(supabaseUrl, supabaseKey, {
        auth: {
          storage: localStorage,
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    }
    return this.client;
  }

  getTenantId(): string {
    const tenantId = this.tenantResolver();
    
    if (!tenantId || tenantId.trim() === '') {
      throw new TenantRequiredError();
    }
    
    return tenantId;
  }

  from<T extends keyof Database['public']['Tables']>(
    table: T
  ): TenantAwareQueryBuilder<T> {
    const tenantId = this.getTenantId();
    
    // Skip actual client call if not initialized (for testing)
    if (!this.client) {
      return new TenantAwareQueryBuilder(null, tenantId);
    }
    
    const client = this.getClient();
    const query = client
      .from(table)
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);

    return new TenantAwareQueryBuilder(query, tenantId);
  }

  isAuthenticated(): boolean {
    try {
      const tenantId = this.getTenantId();
      return !!tenantId;
    } catch {
      return false;
    }
  }

  getCurrentTenantId(): string | null {
    try {
      return this.getTenantId();
    } catch {
      return null;
    }
  }

  getRawClient(): SupabaseClient<Database> {
    return this.client;
  }

  setTenantResolver(resolver: TenantResolver): void {
    this.tenantResolver = resolver;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class TenantAwareQueryBuilder<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private query: any;
  private tenantId: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(query: any, tenantId: string) {
    this.query = query;
    this.tenantId = tenantId;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  select(): any {
    return this.query;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  insert(): any {
    return this.query;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update(): any {
    return this.query;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  upsert(): any {
    return this.query;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete(): any {
    return this.query;
  }

  getTenantInfo(): { tenantId: string } {
    return { tenantId: this.tenantId };
  }
}

let tenantAwareInstance: TenantAwareSupabaseClient | null = null;

export function createTenantAwareClient(tenantResolver: TenantResolver, forceNew = false): TenantAwareSupabaseClient {
  if (forceNew || !tenantAwareInstance) {
    tenantAwareInstance = new TenantAwareSupabaseClient(tenantResolver);
  }
  return tenantAwareInstance;
}

export function getTenantAwareClient(): TenantAwareSupabaseClient {
  if (!tenantAwareInstance) {
    throw new Error('TenantAwareSupabaseClient não foi inicializado.');
  }
  return tenantAwareInstance;
}

export function resetTenantAwareClient(): void {
  tenantAwareInstance = null;
}
