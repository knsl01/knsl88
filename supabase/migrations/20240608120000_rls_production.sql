-- =============================================================================
-- KNSL Legal Intelligence — Production Row Level Security
--
-- Principle: authenticated users may ONLY read/write rows they own (user_id or
-- profile id = auth.uid()). No cross-tenant access via anon or JWT manipulation
-- of user_id columns (enforced by WITH CHECK on INSERT/UPDATE).
--
-- Apply after: 20240608000000_auth_profiles_data.sql
-- Run in Supabase SQL Editor or: supabase db push
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY INVOKER — respect caller RLS on underlying tables)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT auth.uid();
$$;

COMMENT ON FUNCTION public.current_user_id() IS
  'Returns auth.uid() with stable search_path — use in policies for clarity.';

CREATE OR REPLACE FUNCTION public.user_owns_project(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = p_project_id
      AND p.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.user_owns_conversation(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = p_conversation_id
      AND c.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- New tables: projects, documents, conversations, messages, usage_tracking
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Perkara tanpa judul',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_user ON public.projects(user_id, created_at DESC);

DROP TRIGGER IF EXISTS projects_updated ON public.projects;
CREATE TRIGGER projects_updated
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Dokumen tanpa judul',
  doc_type TEXT NOT NULL DEFAULT 'other',
  storage_path TEXT,
  content_hash TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project ownership validated in RLS policies (not CHECK — auth.uid() belongs in RLS).
CREATE INDEX IF NOT EXISTS idx_documents_user ON public.documents(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_project ON public.documents(project_id) WHERE project_id IS NOT NULL;

DROP TRIGGER IF EXISTS documents_updated ON public.documents;
CREATE TRIGGER documents_updated
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Chat hukum',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_project ON public.conversations(project_id) WHERE project_id IS NOT NULL;

DROP TRIGGER IF EXISTS conversations_updated ON public.conversations;
CREATE TRIGGER conversations_updated
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_user ON public.messages(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  provider TEXT,
  model TEXT,
  tokens_in INT NOT NULL DEFAULT 0 CHECK (tokens_in >= 0),
  tokens_out INT NOT NULL DEFAULT 0 CHECK (tokens_out >= 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user ON public.usage_tracking(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_feature ON public.usage_tracking(user_id, feature, created_at DESC);

-- ---------------------------------------------------------------------------
-- Enable RLS on all application tables
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owner (except service_role bypass)
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.projects FORCE ROW LEVEL SECURITY;
ALTER TABLE public.documents FORCE ROW LEVEL SECURITY;
ALTER TABLE public.conversations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.messages FORCE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking FORCE ROW LEVEL SECURITY;
ALTER TABLE public.case_analyses FORCE ROW LEVEL SECURITY;
ALTER TABLE public.contract_reviews FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Drop legacy / overly broad policies (idempotent)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "case_analyses_all_own" ON public.case_analyses;
DROP POLICY IF EXISTS "contract_reviews_all_own" ON public.contract_reviews;
DROP POLICY IF EXISTS "audit_insert_own" ON public.audit_log;
DROP POLICY IF EXISTS "audit_select_admin" ON public.audit_log;

-- ---------------------------------------------------------------------------
-- PROFILES — row key IS auth user id
-- ---------------------------------------------------------------------------

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- No DELETE policy: profiles removed via auth.users CASCADE only.

-- ---------------------------------------------------------------------------
-- PROJECTS — direct ownership via user_id
-- ---------------------------------------------------------------------------

CREATE POLICY "projects_select_own"
  ON public.projects FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "projects_insert_own"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "projects_update_own"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "projects_delete_own"
  ON public.projects FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- DOCUMENTS — user_id + optional project must belong to same user
-- ---------------------------------------------------------------------------

CREATE POLICY "documents_select_own"
  ON public.documents FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND (project_id IS NULL OR public.user_owns_project(project_id))
  );

CREATE POLICY "documents_insert_own"
  ON public.documents FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (project_id IS NULL OR public.user_owns_project(project_id))
  );

CREATE POLICY "documents_update_own"
  ON public.documents FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND (project_id IS NULL OR public.user_owns_project(project_id))
  )
  WITH CHECK (
    user_id = auth.uid()
    AND (project_id IS NULL OR public.user_owns_project(project_id))
  );

CREATE POLICY "documents_delete_own"
  ON public.documents FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND (project_id IS NULL OR public.user_owns_project(project_id))
  );

-- ---------------------------------------------------------------------------
-- CONVERSATIONS — direct ownership; optional project link validated
-- ---------------------------------------------------------------------------

CREATE POLICY "conversations_select_own"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND (project_id IS NULL OR public.user_owns_project(project_id))
  );

CREATE POLICY "conversations_insert_own"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (project_id IS NULL OR public.user_owns_project(project_id))
  );

CREATE POLICY "conversations_update_own"
  ON public.conversations FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND (project_id IS NULL OR public.user_owns_project(project_id))
  )
  WITH CHECK (
    user_id = auth.uid()
    AND (project_id IS NULL OR public.user_owns_project(project_id))
  );

CREATE POLICY "conversations_delete_own"
  ON public.conversations FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- MESSAGES — must belong to a conversation owned by auth.uid()
-- Prevents inserting messages into another user's thread.
-- ---------------------------------------------------------------------------

CREATE POLICY "messages_select_own"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND public.user_owns_conversation(conversation_id)
  );

CREATE POLICY "messages_insert_own"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.user_owns_conversation(conversation_id)
  );

CREATE POLICY "messages_update_own"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND public.user_owns_conversation(conversation_id)
  )
  WITH CHECK (
    user_id = auth.uid()
    AND public.user_owns_conversation(conversation_id)
  );

CREATE POLICY "messages_delete_own"
  ON public.messages FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND public.user_owns_conversation(conversation_id)
  );

-- ---------------------------------------------------------------------------
-- USAGE_TRACKING — append-only audit of AI usage per user
-- ---------------------------------------------------------------------------

CREATE POLICY "usage_tracking_select_own"
  ON public.usage_tracking FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "usage_tracking_insert_own"
  ON public.usage_tracking FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- No UPDATE/DELETE for clients — immutable usage log.

-- ---------------------------------------------------------------------------
-- Legacy app tables (case_analyses, contract_reviews) — granular policies
-- ---------------------------------------------------------------------------

CREATE POLICY "case_analyses_select_own"
  ON public.case_analyses FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "case_analyses_insert_own"
  ON public.case_analyses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "case_analyses_update_own"
  ON public.case_analyses FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "case_analyses_delete_own"
  ON public.case_analyses FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "contract_reviews_select_own"
  ON public.contract_reviews FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "contract_reviews_insert_own"
  ON public.contract_reviews FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "contract_reviews_update_own"
  ON public.contract_reviews FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "contract_reviews_delete_own"
  ON public.contract_reviews FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- AUDIT_LOG — users see & append only their own events
-- ---------------------------------------------------------------------------

CREATE POLICY "audit_log_select_own"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "audit_log_insert_own"
  ON public.audit_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Privileges: authenticated only; anon has no direct table access
-- ---------------------------------------------------------------------------

REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.projects FROM anon;
REVOKE ALL ON public.documents FROM anon;
REVOKE ALL ON public.conversations FROM anon;
REVOKE ALL ON public.messages FROM anon;
REVOKE ALL ON public.usage_tracking FROM anon;
REVOKE ALL ON public.case_analyses FROM anon;
REVOKE ALL ON public.contract_reviews FROM anon;
REVOKE ALL ON public.audit_log FROM anon;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT SELECT, INSERT ON public.usage_tracking TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.case_analyses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_reviews TO authenticated;
GRANT SELECT, INSERT ON public.audit_log TO authenticated;

GRANT USAGE, SELECT ON SEQUENCE public.audit_log_id_seq TO authenticated;
