-- Make scheduled_at nullable since we now use starts_at/ends_at
ALTER TABLE public.appointments ALTER COLUMN scheduled_at DROP NOT NULL;
