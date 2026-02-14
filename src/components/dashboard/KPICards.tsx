import { DollarSign, Users, AlertTriangle, Star, TrendingUp, Clock, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: string;
  variant?: 'default' | 'success' | 'warning' | 'info';
}

const variantStyles = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
};

export function KPICard({ title, value, subtitle, icon: Icon, trend, variant = 'default' }: KPICardProps) {
  return (
    <div className="card-shadow group rounded-2xl bg-card p-5 transition-all duration-300 hover:card-shadow-hover">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-card-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', variantStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs font-medium text-success">
          <TrendingUp className="h-3 w-3" />
          {trend}
        </div>
      )}
    </div>
  );
}

export function KPIGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KPICard
        title="Faturamento Hoje"
        value="R$ 1.650"
        subtitle="Meta: R$ 3.500"
        icon={DollarSign}
        trend="+12% vs. ontem"
        variant="success"
      />
      <KPICard
        title="Pacientes Atendidos"
        value="3 / 8"
        subtitle="5 restantes"
        icon={Users}
        variant="info"
      />
      <KPICard
        title="Alertas de Estoque"
        value="2"
        subtitle="Itens abaixo do nível"
        icon={AlertTriangle}
        variant="warning"
      />
      <KPICard
        title="Satisfação Média"
        value="4.8"
        subtitle="Últimos 30 dias"
        icon={Star}
        trend="+0.3 pts"
        variant="default"
      />
    </div>
  );
}
