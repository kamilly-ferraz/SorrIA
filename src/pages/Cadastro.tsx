import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/services/api/SupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import logo from '@/assets/images/sorria-logo.png';

const Cadastro = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}`,
        emailConfirm: false,
        data: { 
          nome, 
          papel: 'dentista'
        },
      } as any,
    });

    setLoading(false);
    
    if (error) {
      console.error('Erro no cadastro:', error);
      toast.error(`Erro: ${error.message}`);
    } else {
      toast.success('Conta criada com sucesso! Você já pode fazer login.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-t from-blue-300 via-blue-200 to-blue-50">
      <div className="w-full max-w-md px-6">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white flex items-center justify-center">
            <img
              src={logo}
              alt="SorrIA logo"
              className="w-14 h-14 object-contain"
            />
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">
            <span className="text-[#006BB5]">Sorr</span>
            <span className="text-[#40A9FF]">IA</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Criar sua conta</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="mb-6 text-center">
            <h2 className="text-lg font-semibold text-gray-900">Criar Conta</h2>
            <p className="text-sm text-gray-500 mt-1">Preencha os dados para começar</p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <Label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1.5">
                Nome completo
              </Label>
              <Input
                id="nome"
                placeholder="Dr(a). Nome Sobrenome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="h-10"
                required
              />
            </div>

            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10"
                required
              />
            </div>

            <div>
              <Label htmlFor="cadastro-senha" className="block text-sm font-medium text-gray-700 mb-1.5">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="cadastro-senha"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mín. 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 pr-10"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Criando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Criar Conta
                </span>
              )}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            Já tem conta?{' '}
            <Link
              to="/login"
              className="font-medium text-[#0095FF] hover:underline"
            >
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Cadastro;
