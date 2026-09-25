-- Migration: 20260925020000_plans_and_limits.sql
-- Add plan tier and website limit quota columns to profiles

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan text DEFAULT 'starter';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website_limit integer DEFAULT 5;

-- Update existing profiles with defaults
UPDATE public.profiles
SET plan = 'starter', website_limit = 5
WHERE plan IS NULL;

-- Ensure owner accounts have unlimited quota
UPDATE public.profiles
SET plan = 'unlimited', website_limit = 999999
WHERE role = 'owner';
