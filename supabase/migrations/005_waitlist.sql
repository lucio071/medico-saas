-- ============================================================
-- Migration 005: Waitlist table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  requested_date date NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'scheduled', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_doctor ON public.waitlist(doctor_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON public.waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_tenant ON public.waitlist(tenant_id);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Doctors see only their own waitlist
CREATE POLICY "waitlist_select_doctor"
  ON public.waitlist FOR SELECT
  USING (
    doctor_id IN (
      SELECT d.id FROM public.doctors d
      JOIN public.users u ON u.id = d.user_id
      WHERE u.id = auth.uid() AND u.role = 'doctor'
    )
  );

-- Secretaries see waitlist of their assigned doctors
CREATE POLICY "waitlist_select_secretary"
  ON public.waitlist FOR SELECT
  USING (
    doctor_id IN (
      SELECT sd.doctor_id FROM public.secretary_doctors sd
      WHERE sd.secretary_id = auth.uid()
    )
  );

-- Admins see all in their tenant
CREATE POLICY "waitlist_select_admin"
  ON public.waitlist FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Staff (doctor, secretary, admin) can insert
CREATE POLICY "waitlist_insert_staff"
  ON public.waitlist FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.users
      WHERE id = auth.uid() AND role IN ('doctor', 'secretary', 'admin')
    )
  );

-- Staff can update
CREATE POLICY "waitlist_update_staff"
  ON public.waitlist FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users
      WHERE id = auth.uid() AND role IN ('doctor', 'secretary', 'admin')
    )
  );
