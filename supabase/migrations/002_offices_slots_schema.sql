-- ============================================================
-- Migration 002: offices, appointment_slots, schema updates
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. CREATE TABLE: offices
CREATE TABLE IF NOT EXISTS public.offices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. ALTER doctor_schedules: add office_id
ALTER TABLE public.doctor_schedules
  ADD COLUMN IF NOT EXISTS office_id uuid REFERENCES public.offices(id) ON DELETE SET NULL;

-- 3. CREATE TABLE: appointment_slots
CREATE TABLE IF NOT EXISTS public.appointment_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  office_id uuid NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  slot_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'booked', 'blocked')),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. ALTER appointments: add office_id, slot_id, update status values
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS office_id uuid REFERENCES public.offices(id) ON DELETE SET NULL;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS slot_id uuid REFERENCES public.appointment_slots(id) ON DELETE SET NULL;

-- Drop old status constraint if exists, add new one
DO $$
BEGIN
  -- Remove any existing check constraint on status
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'appointments' AND column_name = 'status'
    AND constraint_name LIKE '%status%check%'
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE public.appointments DROP CONSTRAINT ' || constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu USING (constraint_name)
      WHERE tc.table_name = 'appointments'
        AND ccu.column_name = 'status'
        AND tc.constraint_type = 'CHECK'
      LIMIT 1
    );
  END IF;
END $$;

-- Add updated check constraint for status
ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('scheduled', 'confirmed', 'attended', 'cancelled', 'no_show'));

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_offices_doctor_id ON public.offices(doctor_id);
CREATE INDEX IF NOT EXISTS idx_offices_tenant_id ON public.offices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointment_slots_doctor_date ON public.appointment_slots(doctor_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_appointment_slots_office_date ON public.appointment_slots(office_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_appointment_slots_status ON public.appointment_slots(status);
CREATE INDEX IF NOT EXISTS idx_appointments_office_id ON public.appointments(office_id);
CREATE INDEX IF NOT EXISTS idx_appointments_slot_id ON public.appointments(slot_id);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Enable RLS on new tables
ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_slots ENABLE ROW LEVEL SECURITY;

-- offices: users can read offices of their tenant
CREATE POLICY "offices_select_tenant"
  ON public.offices FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid()
    )
  );

-- offices: doctors can insert their own offices
CREATE POLICY "offices_insert_doctor"
  ON public.offices FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role IN ('doctor', 'admin')
    )
  );

-- offices: doctors can update their own offices
CREATE POLICY "offices_update_doctor"
  ON public.offices FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role IN ('doctor', 'admin')
    )
  );

-- offices: doctors can delete their own offices
CREATE POLICY "offices_delete_doctor"
  ON public.offices FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role IN ('doctor', 'admin')
    )
  );

-- appointment_slots: users can read slots of their tenant
CREATE POLICY "slots_select_tenant"
  ON public.appointment_slots FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid()
    )
  );

-- appointment_slots: doctors/secretaries can insert slots
CREATE POLICY "slots_insert_staff"
  ON public.appointment_slots FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role IN ('doctor', 'secretary', 'admin')
    )
  );

-- appointment_slots: doctors/secretaries can update slots
CREATE POLICY "slots_update_staff"
  ON public.appointment_slots FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role IN ('doctor', 'secretary', 'admin')
    )
  );

-- appointment_slots: doctors/secretaries can delete slots
CREATE POLICY "slots_delete_staff"
  ON public.appointment_slots FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role IN ('doctor', 'secretary', 'admin')
    )
  );
