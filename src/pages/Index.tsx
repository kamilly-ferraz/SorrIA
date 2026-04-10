// Esta página é um fallback - o App.tsx redireciona para o Dashboard
// A rota "/" usa SuperAdminHome que redireciona baseado no perfil

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Carregando...</h1>
        <p className="text-xl text-muted-foreground">Redirecionando para o dashboard...</p>
      </div>
    </div>
  );
};

export default Index;
