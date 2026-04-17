export const SPECIALTIES = [
  "Medicina General",
  "Pediatría",
  "Cardiología",
  "Nefrología",
  "Neurología",
  "Ginecología",
  "Obstetricia",
  "Traumatología",
  "Ortopedia",
  "Dermatología",
  "Oftalmología",
  "Otorrinolaringología",
  "Urología",
  "Gastroenterología",
  "Endocrinología",
  "Psiquiatría",
  "Oncología",
  "Neumología",
  "Reumatología",
  "Infectología",
  "Cirugía General",
  "Cirugía Plástica",
  "Anestesiología",
  "Radiología",
  "Medicina Interna",
] as const;

export type Specialty = (typeof SPECIALTIES)[number];

export const MAX_SPECIALTIES_PER_DOCTOR = 3;
