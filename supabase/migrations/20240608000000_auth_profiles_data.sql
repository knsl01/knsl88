-- KNSL Legal Intelligence — Supabase schema (auth + profiles + app data)

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT NOT NULL DEFAULT '',
  username TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'reviewer' CHECK (role IN ('admin', 'partner', 'reviewer', 'viewer')),
  firm_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated ON public.profiles;
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Case analyses
CREATE TABLE IF NOT EXISTS public.case_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Analisa perkara',
  law_filter TEXT NOT NULL DEFAULT 'all',
  source TEXT NOT NULL DEFAULT 'heuristic',
  ai_status TEXT,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_case_analyses_user ON public.case_analyses(user_id, created_at DESC);

DROP TRIGGER IF EXISTS case_analyses_updated ON public.case_analyses;
CREATE TRIGGER case_analyses_updated BEFORE UPDATE ON public.case_analyses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Contract reviews
CREATE TABLE IF NOT EXISTS public.contract_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  perspective TEXT,
  used_ai BOOLEAN NOT NULL DEFAULT false,
  ai_hits INT NOT NULL DEFAULT 0,
  risk_score INT,
  risk_category TEXT,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contract_reviews_user ON public.contract_reviews(user_id, created_at DESC);

DROP TRIGGER IF EXISTS contract_reviews_updated ON public.contract_reviews;
CREATE TRIGGER contract_reviews_updated BEFORE UPDATE ON public.contract_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Audit log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "case_analyses_all_own" ON public.case_analyses;
CREATE POLICY "case_analyses_all_own" ON public.case_analyses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "contract_reviews_all_own" ON public.contract_reviews;
CREATE POLICY "contract_reviews_all_own" ON public.contract_reviews
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "audit_insert_own" ON public.audit_log;
CREATE POLICY "audit_insert_own" ON public.audit_log FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "audit_select_admin" ON public.audit_log;
CREATE POLICY "audit_select_admin" ON public.audit_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'partner'))
);
