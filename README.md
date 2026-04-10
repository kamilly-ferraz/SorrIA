# SorrIA - ERP Odontológico

Sistema de gestão odontológica completo para consultórios e clínicas.

## 🚀 Tecnologias

Este projeto foi construído com as seguintes tecnologias:

### Frontend

| Tecnologia | Versão | Para que serve |
|------------|--------|----------------|
| **React** | 18+ | Biblioteca principal para construção da interface gráfica. Permite criar componentes reutilizáveis e gerenciar o estado da aplicação de forma eficiente. |
| **TypeScript** | 5+ | Superset do JavaScript que adiciona tipagem estática. Facilita a manutenção do código, reduz erros em tempo de desenvolvimento e melhora a autocomplete. |
| **Vite** | 5+ | Build tool moderno que oferece servidor de desenvolvimento rápido (HMR) e build otimizado. Substitui ferramentas mais lentas como Webpack. |
| **Tailwind CSS** | 3+ | Framework CSS utilitário que permite estilizar a aplicação direto nas classes HTML. Acelera o desenvolvimento e garante consistência visual. |
| **shadcn/ui** | - | Biblioteca de componentes React acessíveis e customizáveis. Fornece botões, modais, tabelas, formulários e outros elementos prontos. Baseado em Radix UI. |

### Gerenciamento de Estado e Dados

| Tecnologia | Versão | Para que serve |
|------------|--------|----------------|
| **TanStack Query** (React Query) | 5+ | Gerencia o estado de dados vindos do servidor (cache, refetch, sincronização). Evita chamadas desnecessárias à API e melhora performance. |
| **React Hook Form** | 7+ | Biblioteca para gerenciamento de formulários. Oferece validação com Zod, reduz re-renderizações e é mais performático que formulários controlados tradicionais. |
| **React Router** | 6+ | Biblioteca de roteamento para criar múltiplas páginas/SPAs. Gerencia navegação sem recarregar a página. |
| **Zod** | 3+ | Biblioteca de validação de schema. Usada para validar dados de formulários e respostas da API antes de usar. |

### Backend e Infraestrutura

| Tecnologia | Versão | Para que serve |
|------------|--------|----------------|
| **Supabase** | - | Backend como serviço (BaaS) que fornece: autenticação de usuários (SSO, email/senha), banco de dados PostgreSQL, storage de arquivos, edge functions e realtime subscriptions. Substitui a necessidade de um backend próprio. |
| **Supabase Edge Functions** | - | Funções serverless executadas na edge da Vercel/Supabase. Usadas para lógica de backend como webhooks, integrações externas (Google Calendar) e operações privilegiadas. |

### Bibliotecas de Interface

| Tecnologia | Versão | Para que serve |
|------------|--------|----------------|
| **Radix UI** | - | Biblioteca de componentes headless (sem estilo) e acessíveis. shadcn/ui é construída sobre ela. |
| **Lucide React** | - | Biblioteca de ícones open source. Fornece ícones consistentes e leves para a interface. |
| **Recharts** | 2+ | Biblioteca de gráficos para React. Usada para dashboards e relatórios com gráficos de barras, linhas, pizza, etc. |
| **date-fns** | 3+ | Biblioteca para manipulação de datas em JavaScript/TypeScript. Leve e modular, substitui Moment.js. |
| **Sonner** | - | Biblioteca de notificações/toasts. Exibe mensagens de sucesso, erro e info de forma elegante. |
| **clsx** / **tailwind-merge** | - | Utilitários para construir classes CSS dinamicamente. Simplificam a combinação condicional de classes. |

### Ferramentas de Desenvolvimento

| Tecnologia | Versão | Para que serve |
|------------|--------|----------------|
| **ESLint** | - | Linter de código que analisa o código em busca de erros e enforce regras de estilo. Mantém consistência no código da equipe. |
| **Vitest** | - | Framework de testes unitários para Vite. Rápido e com suporte a TypeScript nativo. |
| **PostCSS** | - | Ferramenta para processar CSS. Usado pelo Tailwind para gerar CSS otimizado. |

### Estrutura do Projeto

```
src/
├── components/       # Componentes React reutilizáveis
│   ├── ui/          # Componentes shadcn/ui (botões, modais, etc)
│   └── ...          # Componentes específicos do projeto
├── contexts/        # Contextos React (Autenticação, etc)
├── controllers/     # Controladores que centralizam lógica de negócio
├── domain/          # Regras de negócio e validações
├── hooks/           # Hooks customizados do React
├── integrations/    # Integrações com serviços externos (Supabase)
├── lib/             # Utilitários e configurações
├── pages/           # Páginas da aplicação (rotas)
├── repositories/    # Camada de acesso a dados
├── services/       # Serviços que abstraem a lógica de negócio
└── types/           # Definições de tipos TypeScript
```

## 📋 Pré-requisitos

- Node.js 18+ e npm ou yarn
- Conta no Supabase (gratuita) para configuração do backend

## 🛠️ Instalação

```sh
# Clonar o repositório
git clone <URL_DO_REPOSITORIO>
cd sorria

# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento
npm run dev
```

O projeto estará disponível em [http://localhost:8080](http://localhost:8080)

## 🌐 Variáveis de Ambiente

Configure as seguintes variáveis no arquivo `.env`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica
VITE_SUPABASE_PROJECT_ID=seu-id-do-projeto
```

## 📄 Licenças das Bibliotecas

Este projeto utiliza as seguintes bibliotecas open source (todas compatíveis com uso comercial):

| Biblioteca | Licença | Descrição |
|-----------|---------|-----------|
| React | MIT | Frontend framework |
| TypeScript | Apache 2.0 | Linguagem tipada |
| Vite | MIT | Build tool |
| Tailwind CSS | MIT | Framework CSS |
| shadcn/ui | MIT | Componentes UI |
| Radix UI | MIT | Componentes acessíveis |
| Supabase | Apache 2.0 | Backend as a Service |
| TanStack Query | MIT | Estado de servidor |
| React Hook Form | MIT | Formulários |
| Zod | MIT | Validação |
| Lucide | ISC | Ícones |
| Recharts | MIT | Gráficos |
| date-fns | MIT | Datas |

---

Este projeto é propriedade de SorrIA.
