import { MainLayout } from '@/components/layout/MainLayout';
import { mockInsights, mockPatients } from '@/data/mockData';
import { Brain, Sparkles, ThumbsUp, FileText, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const AIInsights = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl ai-gradient">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Clinical Insights</h1>
            <p className="text-sm text-muted-foreground">Análises inteligentes baseadas no histórico clínico</p>
          </div>
        </div>

        {/* Generate new */}
        <div className="ai-surface rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-ai-start" />
            <h3 className="font-semibold ai-gradient-text">Gerar Novo Insight</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Selecione um paciente para a IA analisar seu histórico clínico e gerar recomendações de tratamento.
          </p>
          <div className="flex flex-wrap gap-2">
            {mockPatients.slice(0, 3).map(p => (
              <Button key={p.id} variant="outline" size="sm" className="rounded-xl gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {p.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </AvatarFallback>
                </Avatar>
                {p.nome}
              </Button>
            ))}
          </div>
        </div>

        {/* Existing insights */}
        <div className="space-y-4">
          {mockInsights.map((insight, i) => {
            const patient = mockPatients.find(p => p.id === insight.paciente_id);
            return (
              <div
                key={insight.id}
                className="card-shadow rounded-2xl bg-card p-6 animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 font-bold text-primary">
                        {patient?.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-card-foreground">{patient?.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(insight.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full ai-gradient px-3 py-1">
                    <Sparkles className="h-3 w-3 text-primary-foreground" />
                    <span className="text-xs font-semibold text-primary-foreground">{insight.probabilidade}% confiança</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl bg-secondary/50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-warning" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Análise</span>
                    </div>
                    <p className="text-sm text-card-foreground">{insight.insight_texto}</p>
                  </div>

                  <div className="rounded-xl bg-success/5 border border-success/15 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-success" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tratamento Sugerido</span>
                    </div>
                    <p className="text-sm font-medium text-card-foreground">{insight.sugestao_tratamento}</p>
                  </div>

                  <div className="rounded-xl bg-secondary/30 p-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Justificativa Clínica</span>
                    <p className="mt-1 text-sm text-muted-foreground">{insight.justificativa}</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button size="sm" className="gap-2 rounded-xl font-semibold">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    Validar Insight
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl">
                    Ver Prontuário Completo
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
};

export default AIInsights;
