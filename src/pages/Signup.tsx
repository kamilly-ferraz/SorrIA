import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/sorria-logo.png';
import { User, Mail, Lock, Building2, ArrowRight } from 'lucide-react';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [role, setRole] = useState('admin');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'Senhas não conferem', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Senha deve ter pelo menos 6 caracteres', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data: tenant, error: tenantErr } = await supabase
        .from('tenants')
        .insert({ name: clinicName })
        .select()
        .single();
      if (tenantErr) throw tenantErr;

      const { error: signupErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, tenant_id: tenant.id },
          emailRedirectTo: window.location.origin,
        },
      });
      if (signupErr) throw signupErr;

      toast({ title: 'Conta criada!', description: 'Verifique seu e-mail para confirmar.' });
      navigate('/login');
    } catch (err: any) {
      toast({ title: 'Erro ao criar conta', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8" style={{ background: 'linear-gradient(135deg, hsl(224, 71%, 33%), hsl(221, 83%, 53%), hsl(213, 94%, 68%))' }}>
      <div className="w-full max-w-md px-6">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={logo} alt="SorrIA" className="h-24 w-24 rounded-3xl shadow-2xl" />
        </div>

        {/* Card */}
        <Card className="border-0 shadow-2xl">
          <CardContent className="p-8">
            <h1 className="text-2xl font-bold text-foreground text-center mb-1">Criar Conta</h1>
            <p className="text-muted-foreground text-center text-sm mb-6">Cadastre sua clínica no SorrIA</p>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome completo *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Seu nome" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nome da clínica *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" value={clinicName} onChange={(e) => setClinicName(e.target.value)} required placeholder="Ex: Clínica Sorriso" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>E-mail *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="email" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="seu@email.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Senha *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="password" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="••••••" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Confirmar *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="password" className="pl-10" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="••••••" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Perfil de acesso</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="dentist">Dentista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? 'Criando...' : <>Criar Conta <ArrowRight className="h-4 w-4" /></>}
              </Button>
              <p className="text-center text-sm text-muted-foreground pt-2">
                Já tem conta?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">Entrar</Link>
              </p>
            </form>

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
