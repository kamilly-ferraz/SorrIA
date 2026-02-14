import { Armchair, Clock, TrendingUp } from 'lucide-react';

interface MetricRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
  barPercent: number;
  color: string;
}

function MetricRow({ icon: Icon, label, value, barPercent, color }: MetricRowProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium text-card-foreground">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {label}
        </span>
        <span className="font-semibold text-card-foreground">{value}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-secondary">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${barPercent}%`, background: color }}
        />
      </div>
    </div>
  );
}

export function EfficiencyCard() {
  return (
    <div className="card-shadow rounded-2xl bg-card p-6">
      <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Efficiency Pro
      </h3>
      <div className="space-y-5">
        <MetricRow
          icon={Armchair}
          label="Utilização das Cadeiras"
          value="78%"
          barPercent={78}
          color="hsl(217 91% 53%)"
        />
        <MetricRow
          icon={Clock}
          label="Tempo Médio de Espera"
          value="12 min"
          barPercent={35}
          color="hsl(142 71% 45%)"
        />
        <MetricRow
          icon={TrendingUp}
          label="Otimização de Agenda"
          value="+15%"
          barPercent={65}
          color="hsl(250 80% 60%)"
        />
      </div>
    </div>
  );
}
