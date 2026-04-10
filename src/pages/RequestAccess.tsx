import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import SorrIABrand from '@/components/SorrIABrand';
import logo from '@/assets/sorria-logo.png';
import { User, Mail, Phone, MessageSquare, Send } from 'lucide-react';

export default function RequestAccess() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: 'Preencha nome e e-mail', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('access_requests' as any).insert({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        message: form.message.trim() || null,
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      toast({ title: 'Erro ao enviar solicitação', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-8" style={{ background: 'linear-gradient(135deg, hsl(224, 71%, 33%), hsl(221, 83%, 53%), hsl(213, 94%, 68%))' }}>
      <div className="w-full max-w-md px-6">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="SorrIA" className="h-24 w-24 rounded-3xl shadow-2xl mb-4" />
          <SorrIABrand size="lg" invertContrast className="text-3xl" />
          <p className="text-blue-100/80 text-sm mt-1">Sistema de Gestão Odontológica</p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardContent className="p-8">
            {submitted ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-100 p-4">
                    <Send className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <h1 className="text-xl font-bold text-foreground">Solicitação enviada!</h1>
                <p className="text-sm text-muted-foreground">
                  Sua solicitação de acesso foi enviada com sucesso. O administrador da clínica irá avaliar e entrar em contato.
                </p>
                <Link to="/login">
                  <Button variant="outline" className="w-full mt-4">Voltar ao login</Button>
                </Link>
              </div>
            ) : (
              <>
                <h1 className="text-xl font-bold text-foreground text-center mb-1">Solicitar Acesso</h1>
                <p className="text-muted-foreground text-center text-sm mb-6">
                  Preencha seus dados para solicitar acesso ao sistema da sua clínica.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome completo *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-10" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Seu nome completo" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="email" className="pl-10" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="seu@email.com" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input className="pl-10" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Observação</Label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea className="pl-10 min-h-[80px]" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Nome da clínica, cargo, etc." />
                    </div>
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={loading}>
                    {loading ? 'Enviando...' : <><Send className="h-4 w-4" /> Solicitar Acesso</>}
                  </Button>
                </form>
                <p className="text-center text-sm text-muted-foreground pt-4">
                  Já tem acesso?{' '}
                  <Link to="/login" className="text-primary hover:underline font-medium">Entrar</Link>
                </p>
              </>
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
