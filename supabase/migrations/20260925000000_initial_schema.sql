-- ==============================================================================
-- AltoFox Static Website Builder - Complete Supabase Schema Migration
-- Migration: 20260925000000_initial_schema.sql
-- Description: Creates 19 tables, indexes, updated_at triggers, auth triggers,
--              storage buckets, and strict Row Level Security (RLS) policies.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. HELPER FUNCTIONS FOR TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. PROFILES TABLE (Linked directly to Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  role text NOT NULL CHECK (role IN ('owner', 'editor')) DEFAULT 'editor',
  last_active_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger to automatically create a profile when a new user signs in or is invited
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_first boolean;
  assigned_role text;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first;
  IF is_first THEN
    assigned_role := 'owner';
  ELSE
    assigned_role := COALESCE(NEW.raw_user_meta_data->>'role', 'editor');
  END IF;

  INSERT INTO public.profiles (id, full_name, avatar_url, role, last_active_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    assigned_role,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = CASE WHEN EXCLUDED.avatar_url <> '' THEN EXCLUDED.avatar_url ELSE profiles.avatar_url END,
    last_active_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for profiles updated_at
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  domain text,
  niche text,
  main_city text,
  state text,
  theme_id text,
  settings jsonb DEFAULT '{}'::jsonb,
  business_details jsonb DEFAULT '{}'::jsonb,
  wizard_inputs jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'trash')),
  deleted_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. PAGES TABLE
CREATE TABLE IF NOT EXISTS public.pages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('home', 'service', 'location', 'service_location', 'blog', 'project', 'about', 'contact', 'custom')),
  slug text NOT NULL,
  url_path text NOT NULL,
  title text NOT NULL,
  seo jsonb DEFAULT '{}'::jsonb,
  content jsonb DEFAULT '{}'::jsonb,
  keywords jsonb DEFAULT '[]'::jsonb,
  is_hidden boolean DEFAULT false,
  last_meaningful_update timestamptz DEFAULT now(),
  sort_order integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT uq_project_slug UNIQUE (project_id, slug)
);
CREATE TRIGGER set_pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. VERSIONS TABLE (Whole site & per-page snapshots)
CREATE TABLE IF NOT EXISTS public.versions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  page_id uuid REFERENCES public.pages(id) ON DELETE SET NULL,
  snapshot jsonb NOT NULL,
  summary text,
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TRIGGER set_versions_updated_at
  BEFORE UPDATE ON public.versions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. ASSETS TABLE
CREATE TABLE IF NOT EXISTS public.assets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  filename text NOT NULL,
  alt_text text,
  width integer,
  height integer,
  source text NOT NULL DEFAULT 'upload' CHECK (source IN ('pexels', 'pixabay', 'upload', 'bing')),
  credit text,
  used_on jsonb DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TRIGGER set_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. REDIRECTS TABLE
CREATE TABLE IF NOT EXISTS public.redirects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  from_path text NOT NULL,
  to_path text NOT NULL,
  reason text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TRIGGER set_redirects_updated_at
  BEFORE UPDATE ON public.redirects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. CUSTOM_BLOCKS TABLE
CREATE TABLE IF NOT EXISTS public.custom_blocks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  content text NOT NULL,
  placement jsonb DEFAULT '{}'::jsonb,
  keep_exact boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TRIGGER set_custom_blocks_updated_at
  BEFORE UPDATE ON public.custom_blocks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 10. KEYWORD_RESEARCH TABLE
CREATE TABLE IF NOT EXISTS public.keyword_research (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  location text,
  volume integer DEFAULT 0,
  data jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TRIGGER set_keyword_research_updated_at
  BEFORE UPDATE ON public.keyword_research
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 11. RESEARCH_CACHE TABLE
CREATE TABLE IF NOT EXISTS public.research_cache (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  query_key text UNIQUE NOT NULL,
  data jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TRIGGER set_research_cache_updated_at
  BEFORE UPDATE ON public.research_cache
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 12. CONTENT_BRIEFS TABLE
CREATE TABLE IF NOT EXISTS public.content_briefs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  brief jsonb DEFAULT '{}'::jsonb,
  coverage jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TRIGGER set_content_briefs_updated_at
  BEFORE UPDATE ON public.content_briefs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 13. LOCAL_FACTS TABLE
CREATE TABLE IF NOT EXISTS public.local_facts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  fact text NOT NULL,
  source_url text,
  approved boolean DEFAULT false,
  checked_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TRIGGER set_local_facts_updated_at
  BEFORE UPDATE ON public.local_facts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 14. CASE_STUDIES TABLE
CREATE TABLE IF NOT EXISTS public.case_studies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  page_id uuid REFERENCES public.pages(id) ON DELETE SET NULL,
  service text,
  city text,
  month_year text,
  notes text,
  photos jsonb DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TRIGGER set_case_studies_updated_at
  BEFORE UPDATE ON public.case_studies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 15. GSC_UPLOADS TABLE
CREATE TABLE IF NOT EXISTS public.gsc_uploads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  date_range_label text NOT NULL,
  start_date date,
  end_date date,
  file_type text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TRIGGER set_gsc_uploads_updated_at
  BEFORE UPDATE ON public.gsc_uploads
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 16. GSC_ROWS TABLE
CREATE TABLE IF NOT EXISTS public.gsc_rows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id uuid NOT NULL REFERENCES public.gsc_uploads(id) ON DELETE CASCADE,
  page_url text NOT NULL,
  query text NOT NULL,
  clicks integer DEFAULT 0,
  impressions integer DEFAULT 0,
  ctr double precision DEFAULT 0,
  position double precision DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TRIGGER set_gsc_rows_updated_at
  BEFORE UPDATE ON public.gsc_rows
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 17. OPTIMIZATION_CYCLES TABLE
CREATE TABLE IF NOT EXISTS public.optimization_cycles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  cycle_date date DEFAULT CURRENT_DATE,
  pages_changed jsonb DEFAULT '[]'::jsonb,
  notes text,
  summary jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TRIGGER set_optimization_cycles_updated_at
  BEFORE UPDATE ON public.optimization_cycles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 18. RANK_CHECKS TABLE
CREATE TABLE IF NOT EXISTS public.rank_checks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  location text,
  type text NOT NULL DEFAULT 'organic' CHECK (type IN ('organic', 'grid')),
  results jsonb DEFAULT '{}'::jsonb,
  checked_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TRIGGER set_rank_checks_updated_at
  BEFORE UPDATE ON public.rank_checks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 19. ACTIVITY_LOG TABLE
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name text,
  user_avatar text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 20. EXPORTS TABLE
CREATE TABLE IF NOT EXISTS public.exports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('full', 'changed_only', 'backup')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  file_list jsonb DEFAULT '[]'::jsonb,
  download_url text,
  storage_path text,
  created_at timestamptz DEFAULT now()
);

-- 21. APP_SETTINGS TABLE (Single row team settings & shared API keys)
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  team_name text DEFAULT 'AltoFox Private Team',
  default_preferences jsonb DEFAULT '{"country":"United States","theme":"modern-indigo","language":"English","qualityReview":true}'::jsonb,
  api_keys jsonb DEFAULT '{}'::jsonb,
  storage_stats jsonb DEFAULT '{"used_bytes":0,"limit_bytes":1073741824}'::jsonb,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TRIGGER set_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Initialize single row if missing
INSERT INTO public.app_settings (team_name)
SELECT 'AltoFox Private Team'
WHERE NOT EXISTS (SELECT 1 FROM public.app_settings);

-- ==============================================================================
-- 22. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_pages_project_id ON public.pages (project_id);
CREATE INDEX IF NOT EXISTS idx_pages_project_slug ON public.pages (project_id, slug);
CREATE INDEX IF NOT EXISTS idx_versions_project_id ON public.versions (project_id);
CREATE INDEX IF NOT EXISTS idx_versions_page_id ON public.versions (page_id);
CREATE INDEX IF NOT EXISTS idx_assets_project_id ON public.assets (project_id);
CREATE INDEX IF NOT EXISTS idx_redirects_project_id ON public.redirects (project_id);
CREATE INDEX IF NOT EXISTS idx_custom_blocks_project_id ON public.custom_blocks (project_id);
CREATE INDEX IF NOT EXISTS idx_keyword_research_project_id ON public.keyword_research (project_id);
CREATE INDEX IF NOT EXISTS idx_content_briefs_page_id ON public.content_briefs (page_id);
CREATE INDEX IF NOT EXISTS idx_local_facts_page_id ON public.local_facts (page_id);
CREATE INDEX IF NOT EXISTS idx_case_studies_project_id ON public.case_studies (project_id);
CREATE INDEX IF NOT EXISTS idx_gsc_uploads_project_id ON public.gsc_uploads (project_id);
CREATE INDEX IF NOT EXISTS idx_gsc_rows_upload_id ON public.gsc_rows (upload_id);
CREATE INDEX IF NOT EXISTS idx_gsc_rows_page_url ON public.gsc_rows (upload_id, page_url);
CREATE INDEX IF NOT EXISTS idx_optimization_cycles_project_id ON public.optimization_cycles (project_id);
CREATE INDEX IF NOT EXISTS idx_rank_checks_project_id ON public.rank_checks (project_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_project_id ON public.activity_log (project_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log (user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exports_project_id ON public.exports (project_id);

-- ==============================================================================
-- 23. STORAGE BUCKETS (site-assets & backups)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('site-assets', 'site-assets', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']),
  ('backups', 'backups', false, 209715200, ARRAY['application/zip', 'application/x-zip-compressed', 'application/json', 'application/octet-stream'])
ON CONFLICT (id) DO UPDATE SET
  public = false;

-- ==============================================================================
-- 24. ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS boolean AS $$
BEGIN
  RETURN (auth.role() = 'authenticated');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  RETURN COALESCE(v_role, 'editor');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean AS $$
BEGIN
  RETURN (public.is_authenticated() AND public.current_user_role() = 'owner');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ==============================================================================
-- 25. ENABLE RLS ON ALL TABLES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsc_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 26. RLS POLICIES (Strict Authentication & Role-Based Access)
-- ==============================================================================

-- A. PROFILES POLICIES
-- Authenticated team members can read all profiles
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- Users can update their own profile (name, avatar, last_active); owners can update any profile (role)
DROP POLICY IF EXISTS "profiles_update_user_or_owner" ON public.profiles;
CREATE POLICY "profiles_update_user_or_owner" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_owner())
  WITH CHECK (
    -- Non-owners cannot change role column to owner
    CASE 
      WHEN NOT public.is_owner() THEN (id = auth.uid() AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()))
      ELSE true
    END
  );

-- Only owner can delete a profile
DROP POLICY IF EXISTS "profiles_delete_owner" ON public.profiles;
CREATE POLICY "profiles_delete_owner" ON public.profiles
  FOR DELETE TO authenticated USING (public.is_owner());

-- B. PROJECTS POLICIES
-- Team members can read active projects and trash
DROP POLICY IF EXISTS "projects_select_authenticated" ON public.projects;
CREATE POLICY "projects_select_authenticated" ON public.projects
  FOR SELECT TO authenticated USING (true);

-- Team members can create projects
DROP POLICY IF EXISTS "projects_insert_authenticated" ON public.projects;
CREATE POLICY "projects_insert_authenticated" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (true);

-- Team members can update projects (or move to trash)
DROP POLICY IF EXISTS "projects_update_authenticated" ON public.projects;
CREATE POLICY "projects_update_authenticated" ON public.projects
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ONLY owner can permanently delete a project from database
DROP POLICY IF EXISTS "projects_delete_owner_only" ON public.projects;
CREATE POLICY "projects_delete_owner_only" ON public.projects
  FOR DELETE TO authenticated USING (public.is_owner());

-- C. TEAM WORKSPACE DATA POLICIES (Pages, Versions, Assets, Redirects, Custom Blocks, etc.)
-- Standard authenticated team access for all project sub-resources
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'pages', 'versions', 'assets', 'redirects', 'custom_blocks',
      'keyword_research', 'research_cache', 'content_briefs', 'local_facts',
      'case_studies', 'gsc_uploads', 'gsc_rows', 'optimization_cycles',
      'rank_checks', 'activity_log', 'exports'
    ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%I_select_auth" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "%I_select_auth" ON public.%I FOR SELECT TO authenticated USING (true)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "%I_insert_auth" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "%I_insert_auth" ON public.%I FOR INSERT TO authenticated WITH CHECK (true)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "%I_update_auth" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "%I_update_auth" ON public.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "%I_delete_auth" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "%I_delete_auth" ON public.%I FOR DELETE TO authenticated USING (true)', tbl, tbl);
  END LOOP;
END;
$$;

-- D. APP_SETTINGS POLICIES
-- Authenticated team members can read settings (API keys are stripped/masked via API endpoints)
DROP POLICY IF EXISTS "app_settings_select_authenticated" ON public.app_settings;
CREATE POLICY "app_settings_select_authenticated" ON public.app_settings
  FOR SELECT TO authenticated USING (true);

-- ONLY owner can update app settings and third-party API keys
DROP POLICY IF EXISTS "app_settings_update_owner_only" ON public.app_settings;
CREATE POLICY "app_settings_update_owner_only" ON public.app_settings
  FOR UPDATE TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());

-- E. STORAGE POLICIES FOR BUCKETS (site-assets & backups)
DO $$
BEGIN
  BEGIN
    DROP POLICY IF EXISTS "storage_site_assets_auth_select" ON storage.objects;
    CREATE POLICY "storage_site_assets_auth_select" ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id IN ('site-assets', 'backups'));

    DROP POLICY IF EXISTS "storage_site_assets_auth_insert" ON storage.objects;
    CREATE POLICY "storage_site_assets_auth_insert" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id IN ('site-assets', 'backups'));

    DROP POLICY IF EXISTS "storage_site_assets_auth_update" ON storage.objects;
    CREATE POLICY "storage_site_assets_auth_update" ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id IN ('site-assets', 'backups'));

    DROP POLICY IF EXISTS "storage_site_assets_auth_delete" ON storage.objects;
    CREATE POLICY "storage_site_assets_auth_delete" ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id IN ('site-assets', 'backups'));
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Storage policies skipped: %', SQLERRM;
  END;
END;
$$;
