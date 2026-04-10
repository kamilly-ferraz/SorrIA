import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link to="/login">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Política de Privacidade</h1>
        </div>

        <Card className="border-border/50">
          <CardContent className="p-8 prose prose-sm max-w-none text-foreground">
            <p className="text-muted-foreground text-sm mb-6">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

            <h2 className="text-xl font-semibold mt-6 mb-3">1. Dados Coletados</h2>
            <p>O SorrIA coleta os seguintes dados pessoais para fins de atendimento odontológico:</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Nome completo</li>
              <li>Telefone</li>
              <li>CPF</li>
              <li>Data de nascimento</li>
              <li>Dados clínicos e odontológicos</li>
              <li>Arquivos clínicos (radiografias, documentos)</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3">2. Finalidade do Uso</h2>
            <p className="text-muted-foreground">Os dados são coletados e utilizados exclusivamente para:</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Gestão de prontuários e atendimentos odontológicos</li>
              <li>Agendamento de consultas</li>
              <li>Comunicação com o paciente</li>
              <li>Cumprimento de obrigações legais e regulatórias</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3">3. Tempo de Retenção</h2>
            <p className="text-muted-foreground">
              Os dados clínicos são mantidos pelo período mínimo exigido pela legislação vigente (CFO e LGPD).
              Prontuários odontológicos devem ser mantidos por no mínimo 20 anos, conforme determinação do Conselho Federal de Odontologia.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">4. Direitos do Paciente (LGPD)</h2>
            <p className="text-muted-foreground">Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), o paciente tem direito a:</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Confirmação da existência de tratamento de dados</li>
              <li>Acesso aos seus dados pessoais</li>
              <li>Correção de dados incompletos ou desatualizados</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
              <li>Portabilidade dos dados</li>
              <li>Informação sobre compartilhamento de dados</li>
              <li>Revogação do consentimento</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3">5. Segurança</h2>
            <p className="text-muted-foreground">
              Os dados são armazenados com criptografia, isolamento por clínica (multi-tenant), controle de acesso
              baseado em perfis e auditoria de acessos a dados sensíveis. Arquivos clínicos são protegidos com
              URLs temporárias autenticadas.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">6. Contato</h2>
            <p className="text-muted-foreground">
              Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato com o
              responsável pela clínica através dos canais de atendimento disponibilizados.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
