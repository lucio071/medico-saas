-- Add specialties array column to doctors table
ALTER TABLE doctors
ADD COLUMN IF NOT EXISTS specialties text[];

-- Migrate existing specialty values into the array
UPDATE doctors
SET specialties = ARRAY[specialty]
WHERE specialty IS NOT NULL
  AND (specialties IS NULL OR array_length(specialties, 1) IS NULL);

-- Optional: GIN index for @> containment queries
CREATE INDEX IF NOT EXISTS idx_doctors_specialties ON doctors USING GIN (specialties);
