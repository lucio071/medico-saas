-- ============================================================
-- Migration 006: Add starts_at and ends_at to appointments
-- ============================================================

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS ends_at timestamptz;

-- Copy data from scheduled_at to starts_at if any exists
UPDATE public.appointments SET starts_at = scheduled_at WHERE starts_at IS NULL AND scheduled_at IS NOT NULL;
