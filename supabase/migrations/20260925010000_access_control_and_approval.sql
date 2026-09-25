-- ==============================================================================
-- AltoFox Migration: 20260925010000_access_control_and_approval.sql
-- Description: Adds status ('pending', 'approved', 'disabled') to profiles,
--              signup_mode to app_settings, updates handle_new_user trigger,
--              and updates all RLS policies so ONLY approved users can access data.
-- ==============================================================================

-- 1. ADD STATUS AND COMPANY_NAME TO PROFILES
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'disabled'));

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS company_name text;

-- Existing users (including russ@altopex.com) are set to 'approved'
UPDATE public.profiles 
SET status = 'approved' 
WHERE status IS NULL OR status = 'pending';

-- 2. ADD SIGNUP_MODE TO APP_SETTINGS
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS signup_mode text NOT NULL DEFAULT 'approval_required' CHECK (signup_mode IN ('approval_required', 'invite_only', 'open'));

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS contact_email text DEFAULT 'russ@altopex.com';

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS google_auth_enabled boolean DEFAULT false;

-- 3. UPDATE NEW USER TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_first boolean;
  assigned_role text;
  assigned_status text;
  current_signup_mode text;
BEGIN
  -- Check if this is the very first user or owner email
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first;
  
  -- Get current sign-up mode from app_settings
  SELECT signup_mode INTO current_signup_mode FROM public.app_settings LIMIT 1;
  IF current_signup_mode IS NULL THEN
    current_signup_mode := 'approval_required';
  END IF;

  IF is_first OR LOWER(NEW.email) = 'russ@altopex.com' THEN
    assigned_role := 'owner';
    assigned_status := 'approved';
  ELSIF current_signup_mode = 'open' THEN
    assigned_role := COALESCE(NEW.raw_user_meta_data->>'role', 'editor');
    assigned_status := 'approved';
  ELSE
    assigned_role := COALESCE(NEW.raw_user_meta_data->>'role', 'editor');
    assigned_status := 'pending';
  END IF;

  INSERT INTO public.profiles (id, full_name, avatar_url, role, status, company_name, last_active_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    assigned_role,
    assigned_status,
    NEW.raw_user_meta_data->>'company_name',
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = CASE WHEN EXCLUDED.avatar_url <> '' THEN EXCLUDED.avatar_url ELSE profiles.avatar_url END,
    company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
    last_active_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RLS HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_approved()
RETURNS boolean AS $$
BEGIN
  RETURN (
    auth.role() = 'authenticated' AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND status = 'approved'
    )
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean AS $$
BEGIN
  RETURN (
    public.is_approved() AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'owner'
    )
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 5. UPDATE PROFILES POLICIES
-- Approved users can see all team profiles; pending/disabled users can ONLY see their own profile row
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_approved_or_self" ON public.profiles;
CREATE POLICY "profiles_select_approved_or_self" ON public.profiles
  FOR SELECT TO authenticated 
  USING (public.is_approved() OR id = auth.uid());

-- Users can update their own profile; owners can update any profile (including approving status and roles)
DROP POLICY IF EXISTS "profiles_update_user_or_owner" ON public.profiles;
CREATE POLICY "profiles_update_user_or_owner" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_owner())
  WITH CHECK (
    CASE 
      WHEN NOT public.is_owner() THEN (
        id = auth.uid() 
        AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
        AND status = (SELECT p.status FROM public.profiles p WHERE p.id = auth.uid())
      )
      ELSE true
    END
  );

-- Only owner can delete a profile
DROP POLICY IF EXISTS "profiles_delete_owner" ON public.profiles;
CREATE POLICY "profiles_delete_owner" ON public.profiles
  FOR DELETE TO authenticated USING (public.is_owner());

-- 6. UPDATE PROJECTS POLICIES (Strictly approved users only)
DROP POLICY IF EXISTS "projects_select_authenticated" ON public.projects;
CREATE POLICY "projects_select_authenticated" ON public.projects
  FOR SELECT TO authenticated USING (public.is_approved());

DROP POLICY IF EXISTS "projects_insert_authenticated" ON public.projects;
CREATE POLICY "projects_insert_authenticated" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (public.is_approved());

DROP POLICY IF EXISTS "projects_update_authenticated" ON public.projects;
CREATE POLICY "projects_update_authenticated" ON public.projects
  FOR UPDATE TO authenticated USING (public.is_approved()) WITH CHECK (public.is_approved());

DROP POLICY IF EXISTS "projects_delete_owner_only" ON public.projects;
CREATE POLICY "projects_delete_owner_only" ON public.projects
  FOR DELETE TO authenticated USING (public.is_owner());

-- 7. UPDATE ALL WORKSPACE DATA TABLES TO REQUIRE APPROVED STATUS
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
    EXECUTE format('CREATE POLICY "%I_select_auth" ON public.%I FOR SELECT TO authenticated USING (public.is_approved())', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "%I_insert_auth" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "%I_insert_auth" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_approved())', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "%I_update_auth" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "%I_update_auth" ON public.%I FOR UPDATE TO authenticated USING (public.is_approved()) WITH CHECK (public.is_approved())', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "%I_delete_auth" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "%I_delete_auth" ON public.%I FOR DELETE TO authenticated USING (public.is_approved())', tbl, tbl);
  END LOOP;
END;
$$;

-- 8. UPDATE APP_SETTINGS POLICIES
DROP POLICY IF EXISTS "app_settings_select_authenticated" ON public.app_settings;
CREATE POLICY "app_settings_select_authenticated" ON public.app_settings
  FOR SELECT TO authenticated USING (public.is_approved());

DROP POLICY IF EXISTS "app_settings_update_owner_only" ON public.app_settings;
CREATE POLICY "app_settings_update_owner_only" ON public.app_settings
  FOR UPDATE TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());

-- 9. UPDATE STORAGE BUCKET POLICIES (Require is_approved)
DO $$
BEGIN
  BEGIN
    DROP POLICY IF EXISTS "storage_site_assets_auth_select" ON storage.objects;
    CREATE POLICY "storage_site_assets_auth_select" ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id IN ('site-assets', 'backups') AND public.is_approved());

    DROP POLICY IF EXISTS "storage_site_assets_auth_insert" ON storage.objects;
    CREATE POLICY "storage_site_assets_auth_insert" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id IN ('site-assets', 'backups') AND public.is_approved());

    DROP POLICY IF EXISTS "storage_site_assets_auth_update" ON storage.objects;
    CREATE POLICY "storage_site_assets_auth_update" ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id IN ('site-assets', 'backups') AND public.is_approved());

    DROP POLICY IF EXISTS "storage_site_assets_auth_delete" ON storage.objects;
    CREATE POLICY "storage_site_assets_auth_delete" ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id IN ('site-assets', 'backups') AND public.is_approved());
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Storage policies update skipped: %', SQLERRM;
  END;
END;
$$;
