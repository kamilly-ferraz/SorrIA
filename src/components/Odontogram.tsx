import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DentalRecord {
  id: string;
  tooth_number: number;
  diagnosis: string;
  notes: string | null;
}

interface OdontogramProps {
  records: DentalRecord[];
  onSave: (tooth: { tooth_number: number; diagnosis: string; notes: string }) => Promise<void>;
  readOnly?: boolean;
}

const DIAGNOSIS_OPTIONS = [
  { value: 'healthy', label: 'Saudável', color: 'hsl(0, 0%, 100%)' },
  { value: 'cavity', label: 'Cárie', color: 'hsl(0, 84%, 60%)' },
  { value: 'restoration', label: 'Restauração', color: 'hsl(205, 78%, 56%)' },
  { value: 'missing', label: 'Ausente', color: 'hsl(210, 15%, 70%)' },
  { value: 'crown', label: 'Coroa', color: 'hsl(38, 92%, 50%)' },
  { value: 'root_canal', label: 'Tratamento de canal', color: 'hsl(280, 60%, 50%)' },
  { value: 'implant', label: 'Implante', color: 'hsl(160, 60%, 45%)' },
];

const DIAGNOSIS_COLORS: Record<string, string> = {
  healthy: 'bg-background border-border',
  cavity: 'bg-destructive/20 border-destructive',
  restoration: 'bg-primary/20 border-primary',
  missing: 'bg-muted border-muted-foreground/50',
  crown: 'bg-warning/20 border-warning',
  root_canal: 'bg-purple-200 border-purple-500',
  implant: 'bg-success/20 border-success',
};

const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export default function Odontogram({ records, onSave, readOnly = false }: OdontogramProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const getToothRecord = (tooth: number) => records.find((r) => r.tooth_number === tooth);
  const getToothDiagnosis = (tooth: number) => getToothRecord(tooth)?.diagnosis || 'healthy';

  const handleToothClick = (tooth: number) => {
    if (readOnly) return;
    const record = getToothRecord(tooth);
    setSelected(tooth);
    setDiagnosis(record?.diagnosis || 'healthy');
    setNotes(record?.notes || '');
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    await onSave({ tooth_number: selected, diagnosis, notes });
    setSaving(false);
    setSelected(null);
  };

  const renderTooth = (tooth: number) => {
    const d = getToothDiagnosis(tooth);
    const colorClass = DIAGNOSIS_COLORS[d] || DIAGNOSIS_COLORS.healthy;
    return (
      <button
        key={tooth}
        onClick={() => handleToothClick(tooth)}
        className={`w-10 h-12 rounded-md border-2 flex items-center justify-center text-xs font-bold transition-all hover:scale-110 ${colorClass} ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
        title={`Dente ${tooth}`}
      >
        {tooth}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {DIAGNOSIS_OPTIONS.map((d) => (
          <div key={d.value} className="flex items-center gap-1.5">
            <span
              className={`w-3 h-3 rounded-sm border ${DIAGNOSIS_COLORS[d.value]}`}
            />
            <span className="text-muted-foreground">{d.label}</span>
          </div>
        ))}
      </div>

      {/* Upper teeth */}
      <div className="text-center">
        <p className="text-xs font-medium text-muted-foreground mb-2">Arcada Superior</p>
        <div className="flex justify-center gap-1 flex-wrap">
          {upperTeeth.slice(0, 8).map(renderTooth)}
          <div className="w-px bg-border mx-1" />
          {upperTeeth.slice(8).map(renderTooth)}
        </div>
      </div>

      {/* Lower teeth */}
      <div className="text-center">
        <p className="text-xs font-medium text-muted-foreground mb-2">Arcada Inferior</p>
        <div className="flex justify-center gap-1 flex-wrap">
          {lowerTeeth.slice(0, 8).map(renderTooth)}
          <div className="w-px bg-border mx-1" />
          {lowerTeeth.slice(8).map(renderTooth)}
        </div>
      </div>

      {/* Modal for tooth */}
      <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dente {selected}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Diagnóstico</Label>
              <Select value={diagnosis} onValueChange={setDiagnosis}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIAGNOSIS_OPTIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observação clínica</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: cárie oclusal extensa" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
