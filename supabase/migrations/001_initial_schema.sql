-- ============================================
-- SCHEMA BASE - Sistema SorrIA ERP
-- Contém: Roles, Profiles, User Permissions
-- ============================================

-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'dentista');

-- User Roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  tenant_id UUID, -- Adicionado para suporte multi-tenant
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  tenant_id UUID, -- Adicionado para suporte multi-tenant
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User Permissions table
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID, -- Adicionado para suporte multi-tenant
  modulo TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, modulo)
);

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TENANT TABLE (Obrigatório para multi-tenant)
-- ============================================
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Function to get user's tenant
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Primeiro, criar um tenant padrão
INSERT INTO tenants (nome, slug)
VALUES ('Clínica Padrão', 'clinica-padrao')
ON CONFLICT (slug) DO NOTHING;

-- Trigger for new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Pegar o primeiro tenant disponível
  SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
  
  -- Se não existir nenhum tenant, criar um
  IF v_tenant_id IS NULL THEN
    INSERT INTO tenants (nome, slug) VALUES ('Clínica Padrão', 'clinica-padrao')
    RETURNING id INTO v_tenant_id;
  END IF;
  
  -- Inserir perfil
  INSERT INTO public.profiles (user_id, tenant_id, nome, email)
  VALUES (
    NEW.id,
    v_tenant_id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'name', 'Usuário'),
    NEW.email
  );
  
  -- Inserir role
  INSERT INTO public.user_roles (user_id, tenant_id, role)
  VALUES (
    NEW.id,
    v_tenant_id,
    COALESCE((NEW.raw_user_meta_data->>'papel')::app_role, 'dentista')
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for tenants
CREATE POLICY "Authenticated users can read tenants"
ON public.tenants FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage tenants"
ON public.tenants FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can read own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can insert own role"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR tenant_id = public.get_user_tenant_id(auth.uid()));

-- RLS Policies for profiles
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for user_permissions
CREATE POLICY "Users can read own permissions"
ON public.user_permissions FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can manage permissions"
ON public.user_permissions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_tenant_id ON public.user_roles(tenant_id);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX idx_user_permissions_tenant_id ON public.user_permissions(tenant_id);
CREATE INDEX idx_user_permissions_modulo ON public.user_permissions(modulo);
CREATE INDEX idx_tenants_slug ON public.tenants(slug);
