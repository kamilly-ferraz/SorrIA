import { supabase } from '@/services/api/SupabaseClient';

export abstract class BaseRepository {
  protected tableName: string = '';
  
  constructor(tableName: string) {
    console.warn('BaseRepository está deprecated. Use interfaces em @/domain/repositories');
    this.tableName = tableName;
  }
}
