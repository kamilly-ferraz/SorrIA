import { useState, useEffect, useRef } from 'react';
import { Search, User, Calendar, Scissors } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  type: 'patient' | 'appointment' | 'procedure';
  id: string;
  title: string;
  subtitle: string;
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const { profile } = useAuth();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!query.trim() || !profile?.tenant_id) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const tenantId = profile.tenant_id;
      const [patients, appointments, procedures] = await Promise.all([
        supabase
          .from('patients')
          .select('id, name, phone, cpf')
          .eq('tenant_id', tenantId)
          .or(`name.ilike.%${query}%,phone.ilike.%${query}%,cpf.ilike.%${query}%`)
          .limit(5),
        supabase
          .from('appointments')
          .select('id, appointment_date, appointment_time, patients(name), procedure_types(name)')
          .eq('tenant_id', tenantId)
          .limit(5),
        supabase
          .from('procedure_types')
          .select('id, name')
          .eq('tenant_id', tenantId)
          .ilike('name', `%${query}%`)
          .limit(5),
      ]);

      const r: SearchResult[] = [];
      patients.data?.forEach((p: any) => r.push({ type: 'patient', id: p.id, title: p.name, subtitle: p.phone || p.cpf || '' }));
      appointments.data
        ?.filter((a: any) => a.patients?.name?.toLowerCase().includes(query.toLowerCase()))
        .forEach((a: any) => r.push({ type: 'appointment', id: a.id, title: `${a.patients?.name} — ${a.appointment_date}`, subtitle: a.procedure_types?.name || '' }));
      procedures.data?.forEach((p: any) => r.push({ type: 'procedure', id: p.id, title: p.name, subtitle: 'Procedimento' }));
      setResults(r);
      setOpen(r.length > 0);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, profile?.tenant_id]);

  const icons = { patient: User, appointment: Calendar, procedure: Scissors };

  const handleClick = (r: SearchResult) => {
    setOpen(false);
    setQuery('');
    if (r.type === 'patient') navigate(`/pacientes/${r.id}`);
    else if (r.type === 'appointment') navigate('/agenda');
    else navigate('/procedimentos');
  };

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Buscar pacientes, consultas, procedimentos..."
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => results.length > 0 && setOpen(true)}
        className="pl-10 bg-muted/50 border-border/50"
      />
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {results.map((r) => {
            const Icon = icons[r.type];
            return (
              <button
                key={`${r.type}-${r.id}`}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                onClick={() => handleClick(r)}
              >
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
