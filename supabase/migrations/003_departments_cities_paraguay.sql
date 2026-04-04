-- ============================================================
-- Migration 003: departments & cities of Paraguay + patient/doctor location fields
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. CREATE TABLE: departments
CREATE TABLE IF NOT EXISTS public.departments (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE
);

-- 2. INSERT departments (17 departamentos + Asunción)
INSERT INTO public.departments (name) VALUES
  ('Asunción'),
  ('Concepción'),
  ('San Pedro'),
  ('Cordillera'),
  ('Guairá'),
  ('Caaguazú'),
  ('Caazapá'),
  ('Itapúa'),
  ('Misiones'),
  ('Paraguarí'),
  ('Alto Paraná'),
  ('Central'),
  ('Ñeembucú'),
  ('Amambay'),
  ('Canindeyú'),
  ('Presidente Hayes'),
  ('Alto Paraguay'),
  ('Boquerón')
ON CONFLICT (name) DO NOTHING;

-- 3. CREATE TABLE: cities
CREATE TABLE IF NOT EXISTS public.cities (
  id serial PRIMARY KEY,
  department_id integer NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  name text NOT NULL
);

-- 4. INSERT cities by department
-- Asunción
INSERT INTO public.cities (department_id, name)
SELECT d.id, c.name FROM public.departments d,
(VALUES ('Asunción')) AS c(name)
WHERE d.name = 'Asunción'
ON CONFLICT DO NOTHING;

-- Concepción
INSERT INTO public.cities (department_id, name)
SELECT d.id, c.name FROM public.departments d,
(VALUES ('Concepción'),('Horqueta'),('Belén'),('Loreto'),('San Carlos'),('San Lázaro'),('Yby Yaú')) AS c(name)
WHERE d.name = 'Concepción';

-- San Pedro
INSERT INTO public.cities (department_id, name)
SELECT d.id, c.name FROM public.departments d,
(VALUES ('San Pedro de Ycuamandiyú'),('Santa Rosa del Aguaray'),('San Estanislao'),('25 de Diciembre'),('Villa del Rosario'),('General Aquino'),('Itacurubí del Rosario'),('Lima'),('Tacuatí'),('Unión')) AS c(name)
WHERE d.name = 'San Pedro';

-- Cordillera
INSERT INTO public.cities (department_id, name)
SELECT d.id, c.name FROM public.departments d,
(VALUES ('Caacupé'),('Altos'),('Arroyos y Esteros'),('Atyrá'),('Eusebio Ayala'),('Isla Pucú'),('Itacurubí de la Cordillera'),('Piribebuy'),('San Bernardino'),('Santa Elena'),('Tobatí'),('Valenzuela')) AS c(name)
WHERE d.name = 'Cordillera';

-- Guairá
INSERT INTO public.cities (department_id, name)
SELECT d.id, c.name FROM public.departments d,
(VALUES ('Villarrica'),('Borja'),('Colonia Independencia'),('Félix Pérez Cardozo'),('Iturbe'),('José Fassardi'),('Mbocayaty'),('Natalicio Talavera'),('Ñumí'),('San Salvador'),('Yataity')) AS c(name)
WHERE d.name = 'Guairá';

-- Caaguazú
INSERT INTO public.cities (department_id, name)
SELECT d.id, c.name FROM public.departments d,
(VALUES ('Coronel Oviedo'),('Caaguazú'),('Carayaó'),('Dr. Juan Manuel Frutos'),('José Domingo Ocampos'),('La Pastora'),('Nueva Londres'),('Repatriación'),('San Joaquín'),('San José de los Arroyos'),('Yhú')) AS c(name)
WHERE d.name = 'Caaguazú';

-- Caazapá
INSERT INTO public.cities (department_id, name)
SELECT d.id, c.name FROM public.departments d,
(VALUES ('Caazapá'),('Abaí'),('Buena Vista'),('Dr. Moisés Bertoni'),('General Higinio Morínigo'),('Maciel'),('San Juan Nepomuceno'),('Tavaí'),('Yuty')) AS c(name)
WHERE d.name = 'Caazapá';

-- Itapúa
INSERT INTO public.cities (department_id, name)
SELECT d.id, c.name FROM public.departments d,
(VALUES ('Encarnación'),('Bella Vista'),('Cambyretá'),('Capitán Meza'),('Capitán Miranda'),('Carlos Antonio López'),('Carmen del Paraná'),('Coronel Bogado'),('Edelira'),('Fram'),('General Artigas'),('General Delgado'),('Hohenau'),('Jesús'),('La Paz'),('Natalio'),('Nueva Alborada'),('Obligado'),('Pirapó'),('San Cosme y Damián'),('San Pedro del Paraná'),('San Rafael del Paraná'),('Trinidad'),('Tomás Romero Pereira')) AS c(name)
WHERE d.name = 'Itapúa';

-- Misiones
INSERT INTO public.cities (department_id, name)
SELECT d.id, c.name FROM public.departments d,
(VALUES ('San Juan Bautista'),('Ayolas'),('San Ignacio'),('San Miguel'),('San Patricio'),('Santa María'),('Santa Rosa'),('Santiago'),('Villa Florida'),('Yabebyry')) AS c(name)
WHERE d.name = 'Misiones';

-- Paraguarí
INSERT INTO public.cities (department_id, name)
SELECT d.id, c.name FROM public.departments d,
(VALUES ('Paraguarí'),('Acahay'),('Caapucú'),('Caballero'),('Carapeguá'),('Escobar'),('La Colmena'),('Mbuyapey'),('Pirayú'),('Quiindy'),('Quyquyhó'),('San Roque González de Santa Cruz'),('Sapucai'),('Tebicuary-mí'),('Yaguarón'),('Ybycuí'),('Ybytymí')) AS c(name)
WHERE d.name = 'Paraguarí';

-- Alto Paraná
INSERT INTO public.cities (department_id, name)
SELECT d.id, c.name FROM public.departments d,
(VALUES ('Ciudad del Este'),('Presidente Franco'),('Hernandarias'),('Minga Guazú'),('Santa Rita'),('Juan León Mallorquín'),('Itakyry'),('Ñacunday'),('Yguazú'),('San Alberto'),('San Cristóbal'),('Santa Rosa del Monday'),('Mbaracayú'),('Los Cedrales'),('Domingo Martínez de Irala'),('Dr. Juan León Mallorquín')) AS c(name)
WHERE d.name = 'Alto Paraná';

-- Central
INSERT INTO public.cities (department_id, name)
SELECT d.id, c.name FROM public.departments d,
(VALUES ('Areguá'),('Capiatá'),('Fernando de la Mora'),('Guarambaré'),('Itá'),('Itauguá'),('Lambaré'),('Limpio'),('Luque'),('Mariano Roque Alonso'),('Ñemby'),('Nueva Italia'),('San Antonio'),('San Lorenzo'),('Villa Elisa'),('Villeta'),('Ypacaraí'),('Ypané'),('J. Augusto Saldívar')) AS c(name)
WHERE d.name = 'Central';

-- Ñeembucú
INSERT INTO public.cities (department_id, name)
SELECT d.id, c.name FROM public.departments d,
(VALUES ('Pilar'),('Alberdi'),('Cerrito'),('Desmochados'),('General José Eduvigis Díaz'),('Guazú Cuá'),('Humaitá'),('Isla Umbú'),('Laureles'),('Mayor José D. Martínez'),('Paso de Patria'),('San Juan Bautista de Ñeembucú'),('Tacuaras'),('Villa Franca'),('Villa Oliva'),('Villalbín')) AS c(name)
WHERE d.name = 'Ñeembucú';

-- Amambay
INSERT INTO public.cities (department_id, name)
SELECT d.id, c.name FROM public.departments d,
(VALUES ('Pedro Juan Caballero'),('Bella Vista Norte'),('Capitán Bado'),('Karapaí'),('Zanja Pytã')) AS c(name)
WHERE d.name = 'Amambay';

-- Canindeyú
INSERT INTO public.cities (department_id, name)
SELECT d.id, c.name FROM public.departments d,
(VALUES ('Salto del Guairá'),('Corpus Christi'),('Curuguaty'),('General Francisco Caballero Álvarez'),('Itanará'),('Katueté'),('La Paloma'),('Nueva Esperanza'),('Villa Ygatimí'),('Yby Pytã'),('Yby Yaú')) AS c(name)
WHERE d.name = 'Canindeyú';

-- Presidente Hayes
INSERT INTO public.cities (department_id, name)
SELECT d.id, c.name FROM public.departments d,
(VALUES ('Villa Hayes'),('Benjamín Aceval'),('Nanawa'),('José Falcón'),('Puerto Pinasco'),('Teniente Irala Fernández')) AS c(name)
WHERE d.name = 'Presidente Hayes';

-- Alto Paraguay
INSERT INTO public.cities (department_id, name)
SELECT d.id, c.name FROM public.departments d,
(VALUES ('Fuerte Olimpo'),('Bahía Negra'),('Carmelo Peralta'),('Puerto Casado')) AS c(name)
WHERE d.name = 'Alto Paraguay';

-- Boquerón
INSERT INTO public.cities (department_id, name)
SELECT d.id, c.name FROM public.departments d,
(VALUES ('Filadelfia'),('Loma Plata'),('Neuland'),('Mariscal Estigarribia')) AS c(name)
WHERE d.name = 'Boquerón';

-- ============================================================
-- 5. ALTER patients: add location fields
-- ============================================================
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS department_id integer REFERENCES public.departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS city_id integer REFERENCES public.cities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS neighborhood text;

-- ============================================================
-- 6. ALTER doctors: add location fields
-- ============================================================
ALTER TABLE public.doctors
  ADD COLUMN IF NOT EXISTS department_id integer REFERENCES public.departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS city_id integer REFERENCES public.cities(id) ON DELETE SET NULL;

-- ============================================================
-- 7. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_cities_department_id ON public.cities(department_id);
CREATE INDEX IF NOT EXISTS idx_patients_department_id ON public.patients(department_id);
CREATE INDEX IF NOT EXISTS idx_patients_city_id ON public.patients(city_id);
CREATE INDEX IF NOT EXISTS idx_doctors_department_id ON public.doctors(department_id);
CREATE INDEX IF NOT EXISTS idx_doctors_city_id ON public.doctors(city_id);

-- ============================================================
-- 8. RLS for departments and cities (read-only for all authenticated)
-- ============================================================
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "departments_select_all"
  ON public.departments FOR SELECT
  USING (true);

CREATE POLICY "cities_select_all"
  ON public.cities FOR SELECT
  USING (true);
