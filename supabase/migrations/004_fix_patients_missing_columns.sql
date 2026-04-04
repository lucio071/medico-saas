-- ============================================================
-- Migration 004: Add missing columns to patients table
-- ============================================================

-- Rename date_of_birth to birth_date for consistency
ALTER TABLE public.patients
  RENAME COLUMN date_of_birth TO birth_date;

-- Add missing columns
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS emergency_contact text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
