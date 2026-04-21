import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="bg-white text-[#1E293B]">
      <TopNav />
      <Hero />
      <Trust />
      <Features />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </div>
  );
}

/* ───────────────────────────── NAV ───────────────────────────── */

function TopNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB] text-white shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M12 2v6M12 16v6M4 12h6M14 12h6" />
            </svg>
          </div>
          <span className="text-lg font-bold text-[#1E293B]">MedicoSaaS</span>
        </Link>

        <div className="hidden items-center gap-7 text-sm font-medium text-[#64748B] md:flex">
          <a href="#features" className="hover:text-[#1E293B]">Funciones</a>
          <a href="#como-funciona" className="hover:text-[#1E293B]">Cómo funciona</a>
          <a href="#precios" className="hover:text-[#1E293B]">Precios</a>
          <a href="#testimonios" className="hover:text-[#1E293B]">Testimonios</a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-[#64748B] hover:text-[#1E293B] sm:block"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="inline-flex h-9 items-center rounded-lg bg-[#2563EB] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1D4ED8]"
          >
            Comenzar gratis
          </Link>
        </div>
      </nav>
    </header>
  );
}

/* ───────────────────────────── HERO ───────────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0B1E3F] via-[#1E3A8A] to-[#2563EB]">
      {/* Grid pattern overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
      {/* Soft glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-0 h-[500px] w-[500px] rounded-full bg-[#60A5FA]/30 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:pb-28 lg:pt-24">
        {/* Left copy */}
        <div className="flex flex-col justify-center">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            100% en la nube · Seguro · Sin instalación
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            El sistema médico más completo de{" "}
            <span className="relative whitespace-nowrap">
              <span className="relative z-10 text-white">Paraguay</span>
              <span
                aria-hidden="true"
                className="absolute -bottom-1 left-0 right-0 h-3 bg-[#60A5FA]/40"
              />
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#CBD5E1]">
            Agenda, historia clínica, recetas digitales y bot de WhatsApp en un
            solo lugar. Diseñado para médicos que quieren crecer sin perder
            tiempo en tareas administrativas.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-white px-6 text-sm font-semibold text-[#0B1E3F] shadow-lg transition hover:bg-slate-100"
            >
              Comenzar gratis
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-white/30 bg-white/5 px-6 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <circle cx="12" cy="12" r="10" strokeWidth={2} />
              </svg>
              Ver demo
            </a>
          </div>

          <div className="mt-10 flex items-center gap-6 text-xs text-[#94A3B8]">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Sin tarjeta de crédito
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Setup en 2 minutos
            </div>
          </div>
        </div>

        {/* Right: dashboard mock */}
        <div className="relative flex items-center justify-center lg:justify-end">
          <div className="relative w-full max-w-lg">
            <div
              aria-hidden="true"
              className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-white/20 to-white/0 blur-xl"
            />
            <DashboardMock />
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardMock() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
      {/* Browser-like top bar */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
        <span className="ml-3 text-[10px] font-medium text-[#64748B]">medicosaas.app/doctor</span>
      </div>

      <div className="flex">
        {/* Mini sidebar */}
        <div className="w-16 border-r border-slate-100 bg-white p-2">
          <div className="mb-3 flex h-8 w-full items-center justify-center rounded-lg bg-[#2563EB] text-white">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M12 2v6M12 16v6M4 12h6M14 12h6" />
            </svg>
          </div>
          <div className="space-y-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-8 rounded-md ${i === 0 ? "bg-[#EFF6FF]" : "bg-slate-50"}`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="h-7 w-7 rounded-full bg-[#2563EB]" />
          </div>

          <div className="mb-4 grid grid-cols-4 gap-2">
            {[
              { v: "24", c: "bg-[#EFF6FF]", t: "text-[#2563EB]" },
              { v: "189", c: "bg-[#ECFDF5]", t: "text-[#10B981]" },
              { v: "47", c: "bg-[#FEF3C7]", t: "text-[#F59E0B]" },
              { v: "09:30", c: "bg-slate-50", t: "text-[#64748B]" },
            ].map((s, i) => (
              <div key={i} className="rounded-lg border border-slate-100 bg-white p-2">
                <div className={`mb-1.5 h-1 w-6 rounded-full ${s.c}`} />
                <p className={`text-sm font-bold ${s.t}`}>{s.v}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {["Juan Pérez", "María Gómez", "Carlos Silva"].map((n, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-slate-200" />
                  <div className="h-3 w-20 rounded bg-slate-200" />
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                    i === 0
                      ? "bg-[#ECFDF5] text-[#10B981]"
                      : i === 1
                        ? "bg-[#FEF3C7] text-[#F59E0B]"
                        : "bg-[#EFF6FF] text-[#2563EB]"
                  }`}
                >
                  {["Atendido", "En espera", "Confirmado"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────── TRUST ───────────────────────────── */

const SPECIALTIES = [
  { icon: "stethoscope", label: "Medicina General" },
  { icon: "heart", label: "Cardiología" },
  { icon: "brain", label: "Neurología" },
  { icon: "child", label: "Pediatría" },
  { icon: "tooth", label: "Odontología" },
  { icon: "eye", label: "Oftalmología" },
];

function Trust() {
  return (
    <section className="border-b border-slate-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-medium uppercase tracking-wider text-[#64748B]">
          Utilizado por médicos de todo Paraguay
        </p>
        <div className="mt-8 grid grid-cols-3 gap-4 sm:grid-cols-6">
          {SPECIALTIES.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-center transition hover:border-[#2563EB]/40 hover:bg-white"
            >
              <SpecialtyIcon kind={s.icon} />
              <span className="text-xs font-medium text-[#64748B]">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SpecialtyIcon({ kind }: { kind: string }) {
  const common = "h-6 w-6 text-[#2563EB]";
  if (kind === "stethoscope") return (
    <svg className={common} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4l3 3v5a5 5 0 0010 0V7l3-3M17 17a3 3 0 100 6 3 3 0 000-6zM12 17v0" />
    </svg>
  );
  if (kind === "heart") return (
    <svg className={common} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  );
  if (kind === "brain") return (
    <svg className={common} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M6 7a3 3 0 016 0v10a3 3 0 01-6 0M18 7a3 3 0 00-6 0v10a3 3 0 006 0" />
    </svg>
  );
  if (kind === "child") return (
    <svg className={common} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" strokeLinecap="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 21v-2a7 7 0 0114 0v2" />
    </svg>
  );
  if (kind === "tooth") return (
    <svg className={common} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3c-2 0-4 2-4 5 0 3 1 5 2 9 .5 2 1 4 2 4s1-2 2-5 1-3 2-3 1 0 2 3 1 5 2 5 1.5-2 2-4c1-4 2-6 2-9 0-3-2-5-4-5-1.5 0-2 1-4 1s-2.5-1-4-1z" />
    </svg>
  );
  return (
    <svg className={common} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" strokeLinecap="round" />
    </svg>
  );
}

/* ───────────────────────────── FEATURES ───────────────────────────── */

const FEATURES = [
  {
    icon: "calendar",
    title: "Agenda inteligente",
    desc: "Vista por día, semana y mes. Kanban de estados de cita: programada, confirmada, atendida.",
  },
  {
    icon: "history",
    title: "Historia clínica digital",
    desc: "Diagnóstico CIE-10, signos vitales, anamnesis, examen físico y notas privadas por visita.",
  },
  {
    icon: "prescription",
    title: "Recetas con QR",
    desc: "Recetas electrónicas con código único. Las farmacias verifican autenticidad en tiempo real.",
  },
  {
    icon: "whatsapp",
    title: "Bot de WhatsApp",
    desc: "Tus pacientes agendan solos las 24 horas desde WhatsApp. Cero llamadas perdidas.",
  },
  {
    icon: "briefcase",
    title: "Multi-secretaria",
    desc: "Una secretaria puede gestionar la agenda de varios médicos desde una sola cuenta.",
  },
  {
    icon: "user",
    title: "Portal del paciente",
    desc: "Cada paciente tiene acceso a sus citas, recetas e historial desde cualquier dispositivo.",
  },
];

function Features() {
  return (
    <section id="features" className="bg-[#F8FAFC] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-[#2563EB]">
            Todo lo que necesitás
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1E293B] sm:text-4xl">
            Funciones que hacen la diferencia
          </h2>
          <p className="mt-4 text-lg text-[#64748B]">
            Reemplazá planillas, WhatsApp disperso y papeles por una plataforma moderna.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:border-[#2563EB]/30 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB] transition group-hover:bg-[#2563EB] group-hover:text-white">
                <FeatureIcon kind={f.icon} />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-[#1E293B]">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureIcon({ kind }: { kind: string }) {
  const common = "h-6 w-6";
  if (kind === "calendar") return (
    <svg className={common} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path strokeLinecap="round" d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  );
  if (kind === "history") return (
    <svg className={common} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 103-6.7M3 3v5h5M12 7v5l3 2" />
    </svg>
  );
  if (kind === "prescription") return (
    <svg className={common} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h7a3 3 0 013 3v2a3 3 0 01-3 3H9V3zM9 14l6 7M13 14l-4 7" />
    </svg>
  );
  if (kind === "whatsapp") return (
    <svg className={common} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
    </svg>
  );
  if (kind === "briefcase") return (
    <svg className={common} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path strokeLinecap="round" d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" />
    </svg>
  );
  return (
    <svg className={common} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

/* ─────────────────────── HOW IT WORKS ─────────────────────── */

const STEPS = [
  {
    num: "01",
    title: "Registrate gratis en 2 minutos",
    desc: "Creá tu cuenta de médico. Solo necesitás tu email y número de matrícula — sin tarjeta de crédito.",
  },
  {
    num: "02",
    title: "Configurá tus horarios y consultorios",
    desc: "Agregá tus consultorios, duración de consulta y horarios semanales. El sistema genera los turnos disponibles automáticamente.",
  },
  {
    num: "03",
    title: "Tus pacientes agendan solos por WhatsApp",
    desc: "Activá el bot y recibí pacientes las 24 horas. Ellos ven tus horarios en tiempo real y confirman por sí mismos.",
  },
];

function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-[#2563EB]">
            Tan simple como 1 · 2 · 3
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1E293B] sm:text-4xl">
            Cómo funciona
          </h2>
          <p className="mt-4 text-lg text-[#64748B]">
            En menos de una tarde tenés tu consultorio 100% digital.
          </p>
        </div>

        <div className="relative mt-16 grid gap-10 lg:grid-cols-3">
          {/* Connector line on desktop */}
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-16 hidden h-px bg-gradient-to-r from-transparent via-[#2563EB]/30 to-transparent lg:block"
          />

          {STEPS.map((s, i) => (
            <div key={s.num} className="relative">
              <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg ring-4 ring-[#EFF6FF]">
                <span className="text-xl font-bold text-[#2563EB]">{s.num}</span>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-[#1E293B]">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#64748B]">{s.desc}</p>
              {i < STEPS.length - 1 ? (
                <svg
                  className="absolute right-4 top-6 hidden h-4 w-4 text-[#94A3B8] lg:block"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── PRICING ───────────────────────────── */

const PLANS = [
  {
    name: "Básico",
    price: "150.000",
    description: "Para médicos que empiezan a digitalizar",
    features: [
      "Agenda y turnos",
      "Historia clínica digital",
      "Hasta 2 secretarias",
      "Portal del paciente",
      "Soporte por email",
    ],
    highlight: false,
  },
  {
    name: "Profesional",
    price: "350.000",
    description: "El más elegido. Todo lo que necesitás para crecer.",
    features: [
      "Todo lo del plan Básico",
      "Bot de WhatsApp 24/7",
      "Recetas con QR verificable",
      "Estadísticas e informes",
      "Secretarias ilimitadas",
      "Soporte prioritario",
    ],
    highlight: true,
  },
  {
    name: "Premium",
    price: "550.000",
    description: "Para clínicas que hacen la diferencia",
    features: [
      "Todo lo del plan Profesional",
      "Teleconsulta integrada",
      "Soporte dedicado 24/7",
      "Capacitación del equipo",
      "Integración con laboratorio",
      "Branding personalizado",
    ],
    highlight: false,
  },
];

function Pricing() {
  return (
    <section id="precios" className="bg-[#F8FAFC] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-[#2563EB]">
            Precios transparentes
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1E293B] sm:text-4xl">
            Un plan para cada etapa
          </h2>
          <p className="mt-4 text-lg text-[#64748B]">
            Sin contratos de permanencia. Cancelá cuando quieras.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border p-8 transition ${
                p.highlight
                  ? "border-[#2563EB] bg-white shadow-[0_20px_60px_-20px_rgba(37,99,235,0.35)] lg:-translate-y-4 lg:scale-105"
                  : "border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
              }`}
            >
              {p.highlight ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#2563EB] px-4 py-1 text-xs font-semibold text-white shadow-md">
                  Más popular
                </span>
              ) : null}

              <h3 className="text-lg font-semibold text-[#1E293B]">{p.name}</h3>
              <p className="mt-1 text-sm text-[#64748B]">{p.description}</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-xs font-medium text-[#64748B]">Gs.</span>
                <span className="text-5xl font-extrabold tracking-tight text-[#1E293B]">
                  {p.price}
                </span>
                <span className="text-sm font-medium text-[#64748B]">/mes</span>
              </div>
              <p className="mt-1 text-xs text-[#94A3B8]">por médico</p>

              <Link
                href="/register"
                className={`mt-7 inline-flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold transition ${
                  p.highlight
                    ? "bg-[#2563EB] text-white shadow-md hover:bg-[#1D4ED8]"
                    : "border border-slate-200 text-[#1E293B] hover:border-[#2563EB] hover:text-[#2563EB]"
                }`}
              >
                Comenzar con {p.name}
              </Link>

              <ul className="mt-7 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <svg
                      className="mt-0.5 h-5 w-5 shrink-0 text-[#10B981]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-[#1E293B]">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────── TESTIMONIALS ─────────────────────── */

const TESTIMONIALS = [
  {
    name: "Dra. María López",
    specialty: "Cardiología · Asunción",
    quote:
      "Antes perdía 2 horas al día gestionando turnos. Con MedicoSaaS y el bot de WhatsApp mis pacientes se agendan solos. Recupero horas para atender.",
    initials: "ML",
    color: "#2563EB",
  },
  {
    name: "Dr. Carlos Benítez",
    specialty: "Pediatría · Encarnación",
    quote:
      "La historia clínica digital con signos vitales y CIE-10 me ahorra tiempo en cada consulta. Y los padres adoran tener acceso al portal.",
    initials: "CB",
    color: "#10B981",
  },
  {
    name: "Dra. Ana Giménez",
    specialty: "Ginecología · Ciudad del Este",
    quote:
      "Tengo dos secretarias que manejan mi agenda desde el mismo sistema. Las recetas digitales con QR son un antes y después.",
    initials: "AG",
    color: "#F59E0B",
  },
];

function Testimonials() {
  return (
    <section id="testimonios" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-[#2563EB]">
            Historias reales
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1E293B] sm:text-4xl">
            Médicos paraguayos ya confían en nosotros
          </h2>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:shadow-lg"
            >
              <svg className="h-8 w-8 text-[#2563EB]/20" fill="currentColor" viewBox="0 0 32 32">
                <path d="M10 8c-2.2 0-4 1.8-4 4v12h8V16H10c0-1.1.9-2 2-2V8zM22 8c-2.2 0-4 1.8-4 4v12h8V16h-4c0-1.1.9-2 2-2V8z" />
              </svg>
              <blockquote className="mt-4 text-sm leading-relaxed text-[#1E293B]">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: t.color }}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1E293B]">{t.name}</p>
                  <p className="text-xs text-[#64748B]">{t.specialty}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── FINAL CTA ─────────────────────────── */

function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0B1E3F] to-[#1D4ED8]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-20 h-64 w-64 rounded-full bg-[#60A5FA]/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-24 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Empezá hoy gratis.
          <br />
          <span className="text-[#93C5FD]">Sin tarjeta de crédito.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-[#CBD5E1]">
          Unite a los médicos paraguayos que están dejando el papel atrás.
          Tu agenda profesional está a 2 minutos.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-white px-8 text-base font-semibold text-[#0B1E3F] shadow-lg transition hover:bg-slate-100"
          >
            Crear mi cuenta gratis
            <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-white/30 px-8 text-base font-semibold text-white transition hover:bg-white/10"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── FOOTER ─────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB] text-white">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
                  <path d="M12 2v6M12 16v6M4 12h6M14 12h6" />
                </svg>
              </div>
              <span className="text-lg font-bold text-[#1E293B]">MedicoSaaS</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-[#64748B]">
              El sistema médico más completo de Paraguay. Agenda, historia
              clínica y bot de WhatsApp en un solo lugar.
            </p>
            <div className="mt-5 flex gap-3">
              <SocialLink href="https://facebook.com" label="Facebook">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </SocialLink>
              <SocialLink href="https://instagram.com" label="Instagram">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </SocialLink>
              <SocialLink href="https://wa.me/595" label="WhatsApp">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
                </svg>
              </SocialLink>
            </div>
          </div>

          <FooterColumn
            title="Producto"
            links={[
              { label: "Funciones", href: "#features" },
              { label: "Precios", href: "#precios" },
              { label: "Cómo funciona", href: "#como-funciona" },
              { label: "Testimonios", href: "#testimonios" },
            ]}
          />
          <FooterColumn
            title="Empresa"
            links={[
              { label: "Sobre nosotros", href: "#" },
              { label: "Blog", href: "#" },
              { label: "Contacto", href: "#" },
              { label: "Carreras", href: "#" },
            ]}
          />
          <FooterColumn
            title="Legal"
            links={[
              { label: "Términos de uso", href: "#" },
              { label: "Política de privacidad", href: "#" },
              { label: "Protección de datos", href: "#" },
              { label: "Cookies", href: "#" },
            ]}
          />
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-slate-200 pt-8 text-sm text-[#64748B] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} MedicoSaaS. Todos los derechos reservados.</p>
          <p className="flex items-center gap-2">
            <span className="inline-flex h-5 w-7 items-center justify-center rounded bg-gradient-to-b from-red-500 via-white to-blue-600 text-[8px] font-bold">
              PY
            </span>
            Hecho con ❤️ en Paraguay
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[#1E293B]">{title}</h3>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="text-[#64748B] transition hover:text-[#2563EB]">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[#64748B] transition hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:text-[#2563EB]"
    >
      {children}
    </a>
  );
}
