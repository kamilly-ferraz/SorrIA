import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import SorrIABrand from '@/components/SorrIABrand';
import logo from '@/assets/sorria-logo.png';
import { Mail, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: 'Erro ao entrar', description: error.message, variant: 'destructive' });
    } else {
      navigate('/');
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'E-mail enviado', description: 'Verifique sua caixa de entrada.' });
      setForgotMode(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(224, 71%, 33%), hsl(221, 83%, 53%), hsl(213, 94%, 68%))' }}>
      <div className="w-full max-w-md px-6">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="SorrIA" className="h-28 w-28 rounded-3xl shadow-2xl mb-4" />
          <SorrIABrand size="lg" invertContrast className="text-3xl" />
          <p className="text-blue-100/80 text-sm mt-1">Sistema de Gestão Odontológica</p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardContent className="p-8">
            <h1 className="text-2xl font-bold text-foreground text-center mb-6">
              Bem-vindo
            </h1>

            {forgotMode ? (
              <form onSubmit={handleForgot} className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">Informe seu e-mail para recuperar a senha.</p>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="email" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="seu@email.com" />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                </Button>
                <Button variant="ghost" className="w-full" type="button" onClick={() => setForgotMode(false)}>
                  Voltar ao login
                </Button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="email" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="seu@email.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="password" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
                  </div>
                </div>
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? 'Entrando...' : <>Entrar <ArrowRight className="h-4 w-4" /></>}
                </Button>
                <div className="flex justify-between text-sm pt-2">
                  <button type="button" className="text-primary hover:underline" onClick={() => setForgotMode(true)}>
                    Esqueci a senha
                  </button>
                </div>
                <p className="text-center text-sm text-muted-foreground pt-2">
                  Ainda não tem acesso?{' '}
                  <Link to="/solicitar-acesso" className="text-primary hover:underline font-medium">
                    Solicite acesso à sua clínica
                  </Link>
                </p>
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-border/50 text-center">
              <Link to="/politica-privacidade" className="text-xs text-muted-foreground hover:text-primary hover:underline">
                Política de Privacidade
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
