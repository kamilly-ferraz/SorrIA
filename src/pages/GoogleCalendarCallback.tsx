import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Calendar } from 'lucide-react';
import SorrIABrand from '@/components/SorrIABrand';

export default function GoogleCalendarCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const success = searchParams.get('status') !== 'error';
  const errorMsg = searchParams.get('message') || 'Erro desconhecido';

  useEffect(() => {
    // Notifica janela opener (fluxo popup)
    if (window.opener) {
      try {
        window.opener.postMessage(success ? 'gcal-connected' : 'gcal-error', '*');
      } catch (_) {}
      // Fecha automaticamente o popup após um momento
      if (success) {
        setTimeout(() => window.close(), 3000);
      }
    }
  }, [success]);

  useEffect(() => {
    if (!success) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Se não estiver em popup, redireciona
          if (!window.opener) {
            navigate('/agenda');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [success, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(224, 71%, 33%), hsl(221, 83%, 53%), hsl(213, 94%, 68%))' }}>
      <Card className="border-0 shadow-2xl max-w-md w-full mx-4">
        <CardContent className="p-8 text-center space-y-6">
          {success ? (
            <>
              <div className="flex justify-center">
                <div className="relative">
                  <Calendar className="h-16 w-16 text-primary" />
                  <CheckCircle2 className="h-8 w-8 text-green-500 absolute -bottom-1 -right-1 bg-white rounded-full" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground mb-1">Google Agenda conectado com sucesso!</h1>
                <p className="text-sm text-muted-foreground">
                  Suas consultas serão sincronizadas automaticamente com o Google Calendar.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={() => navigate('/agenda')} className="w-full">
                  <Calendar className="mr-2 h-4 w-4" /> Ir para Agenda
                </Button>
                <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                  Voltar ao Dashboard
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {window.opener ? `Fechando em ${countdown}s...` : `Redirecionando em ${countdown}s...`}
              </p>
            </>
          ) : (
            <>
              <div className="flex justify-center">
                <XCircle className="h-16 w-16 text-destructive" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground mb-1">Erro na conexão</h1>
                <p className="text-sm text-muted-foreground">{errorMsg}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={() => navigate('/agenda')} className="w-full">Voltar à Agenda</Button>
              </div>
            </>
          )}
          <div className="pt-2 border-t border-border/50">
            <SorrIABrand size="sm" />
            <span className="text-xs text-muted-foreground ml-2">ERP Odontológico</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
