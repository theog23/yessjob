import Link from "next/link";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/server";
import type { Plan } from "@/lib/types";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order("price_usd", { ascending: true });

  return (
    <main className="relative min-h-screen overflow-x-clip bg-ink-950">
      <Header />
      <Hero />
      <Marquee />
      <Problem />
      <Solution />
      <HowItWorks />
      <Plans plans={(plans as Plan[]) ?? []} />
      <FinalCta />
      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="relative z-50 mx-auto flex max-w-7xl items-center justify-between px-6 py-7 md:px-10">
      <Link href="/">
        <Logo />
      </Link>
      <nav className="hidden items-center gap-8 md:flex">
        <a href="#como-funciona" className="text-sm text-ink-500 transition-colors hover:text-ink-0">
          Como funciona
        </a>
        <a href="#planes" className="text-sm text-ink-500 transition-colors hover:text-ink-0">
          Planes
        </a>
      </nav>
      <div className="flex items-center gap-5">
        <Link href="/login" className="text-sm text-ink-500 transition-colors hover:text-ink-0">
          Iniciar sesion
        </Link>
        <Link href="/register" className="btn-primary !px-5 !py-2.5 !text-[13px]">
          Crear cuenta
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative px-6 pb-24 pt-6 md:px-10 md:pb-32">
      {/* Etiqueta vertical, estilo lomo de revista */}
      <div className="absolute bottom-24 left-2 hidden md:block">
        <span className="vertical-label label-eyebrow">
          Para quienes viven de proyectos freelance
        </span>
      </div>

      <div className="ml-0 md:ml-16">
        <h1 className="max-w-5xl animate-fadeUp text-balance font-serif text-[13vw] leading-[0.95] tracking-tight text-ink-0 md:text-[6.4rem] lg:text-[7.2rem]">
          El proyecto <em className="italic">perfecto</em> no espera a que lo encuentres.
        </h1>

        <div className="mt-10 grid gap-8 md:mt-14 md:grid-cols-12 md:items-end">
          <p
            className="animate-fadeUp text-balance font-serif text-xl leading-snug text-ink-400 md:col-span-6 md:text-2xl"
            style={{ animationDelay: "100ms" }}
          >
            Todos los dias aparecen decenas de oportunidades nuevas.
          </p>
          <p
            className="animate-fadeUp text-balance text-sm leading-relaxed text-ink-500 md:col-span-4 md:text-base"
            style={{ animationDelay: "160ms" }}
          >
            Revisas apenas unas pocas, cuando puedes, y para cuando las ves ya
            tienen varias propuestas. Nosotros las vigilamos por ti y te
            avisamos apenas aparece una de las tuyas.
          </p>
          <div
            className="flex animate-fadeUp flex-col items-start gap-4 md:col-span-2"
            style={{ animationDelay: "220ms" }}
          >
            <Link href="/register" className="btn-primary w-full">
              Empezar gratis
            </Link>
            <a
              href="#como-funciona"
              className="text-sm text-ink-500 underline decoration-ink-700 underline-offset-4 transition-colors hover:text-ink-0"
            >
              Ver como funciona
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const items = ["Workana", "Freelancer.com", "Tu rubro", "Tu momento"];
  const track = [...items, ...items];

  return (
    <section className="overflow-hidden border-y border-ink-800 bg-ink-0 py-5">
      <div className="marquee-track flex w-max items-center gap-10 whitespace-nowrap">
        {track.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-10 font-serif text-3xl italic text-ink-950 md:text-4xl"
          >
            {item}
            <span className="font-sans text-xl not-italic text-ink-600">✦</span>
          </span>
        ))}
      </div>
    </section>
  );
}

function Problem() {
  const points = [
    {
      title: "Se pierden entre cientos de publicaciones",
      body: "Los mejores proyectos quedan enterrados entre docenas de publicaciones nuevas cada hora. Nadie tiene tiempo de revisarlas todas.",
    },
    {
      title: "Llegas tarde",
      body: "Para cuando los ves, ya tienen varias propuestas y el cliente ya eligio con quien hablar primero.",
    },
    {
      title: "Revisas de todo para encontrar poco",
      body: "Pierdes horas filtrando publicaciones que ni siquiera son de tu area, buscando esa unica que te sirve.",
    },
  ];

  return (
    <section className="px-6 py-24 md:px-10 md:py-36">
      <div className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-4">
          <p className="label-eyebrow mb-5">El problema</p>
          <h2 className="text-balance font-serif text-4xl leading-[1.05] text-ink-0 md:text-5xl">
            Buscar trabajo se volvio un trabajo en si mismo.
          </h2>
        </div>

        <div className="md:col-span-7 md:col-start-6">
          {points.map((p, i) => (
            <div
              key={p.title}
              className="group grid gap-2 border-t border-ink-800 py-8 transition-colors first:border-t-0 md:grid-cols-12 md:items-baseline md:gap-6 md:py-10"
            >
              <span className="font-serif text-sm text-ink-600 md:col-span-1">
                0{i + 1}
              </span>
              <h3 className="font-serif text-2xl text-ink-0 transition-transform duration-300 group-hover:translate-x-2 md:col-span-4">
                {p.title}
              </h3>
              <p className="text-sm leading-relaxed text-ink-500 md:col-span-7">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Solution() {
  return (
    <section className="relative overflow-hidden bg-ink-0 px-6 py-24 md:px-10 md:py-36">
      <div className="blob absolute -left-32 -top-32 h-96 w-96 animate-drift bg-white/[0.06]" />
      <div className="blob absolute -bottom-40 -right-20 h-[30rem] w-[30rem] animate-driftSlow bg-white/[0.05]" />

      <div className="relative grid gap-10 md:grid-cols-12">
        <div className="md:col-span-4">
          <p className="label-eyebrow mb-5 !text-ink-600">La solucion</p>
          <p className="max-w-md text-balance text-base leading-relaxed text-ink-700 md:text-lg">
            Eliges tu rubro, tus plataformas y lo que te interesa recibir. A
            partir de ahi no tienes que volver a revisar nada.
          </p>
        </div>
        <div className="md:col-span-8">
          <h2 className="text-balance font-serif text-4xl italic leading-[1.05] text-ink-950 md:text-6xl">
            Eliges que te interesa. Nosotros no dejamos de mirar.
          </h2>
          <p className="mt-8 max-w-lg text-balance text-base leading-relaxed text-ink-700 md:text-lg">
            En el instante en que aparece un proyecto que coincide con lo
            tuyo, te llega el aviso. Tu decides si responder.
          </p>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Cuentanos que buscas",
      body: "Eliges tu area — diseño, desarrollo, redaccion, lo que sea — y las plataformas donde quieres que miremos.",
      align: "left" as const,
    },
    {
      n: "02",
      title: "Nosotros vigilamos, siempre",
      body: "Mientras haces otra cosa, seguimos de cerca cada publicacion nueva que aparece en tu rubro.",
      align: "right" as const,
    },
    {
      n: "03",
      title: "Te avisamos al toque",
      body: "Apenas aparece algo para ti, te llega el aviso directo a tu celular, con todo lo que necesitas para decidir.",
      align: "left" as const,
    },
  ];

  return (
    <section id="como-funciona" className="px-6 py-24 md:px-10 md:py-36">
      <p className="label-eyebrow mb-5">Como funciona</p>
      <h2 className="max-w-2xl text-balance font-serif text-4xl leading-[1.05] text-ink-0 md:text-5xl">
        Tres pasos. Despues, te olvidas del tema.
      </h2>

      <div className="mt-16 space-y-2 md:mt-24">
        {steps.map((s) => (
          <div
            key={s.n}
            className="relative overflow-hidden border-t border-ink-800 py-10 last:border-b md:py-16"
          >
            <span
              aria-hidden
              className={`pointer-events-none absolute top-1/2 -translate-y-1/2 select-none font-serif text-[10rem] leading-none text-ink-850 md:text-[14rem] ${
                s.align === "left" ? "-left-4 md:-left-6" : "-right-4 md:-right-6"
              }`}
            >
              {s.n}
            </span>
            <div
              className={`relative flex flex-col gap-3 ${
                s.align === "right" ? "md:items-end md:text-right" : ""
              }`}
            >
              <h3 className="font-serif text-3xl text-ink-0 md:text-4xl">{s.title}</h3>
              <p className="max-w-md text-sm leading-relaxed text-ink-500 md:text-base">
                {s.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Plans({ plans }: { plans: Plan[] }) {
  if (!plans.length) return null;

  const rows: { label: string; get: (p: Plan) => string }[] = [
    { label: "Plataformas", get: (p) => `${p.max_platforms}` },
    { label: "Rubros", get: (p) => `${p.max_sectors}` },
    { label: "Palabras clave", get: (p) => `${p.max_keywords}` },
    { label: "Frecuencia de avisos", get: (p) => `Cada ${p.min_scrape_interval_min} min` },
    {
      label: "Propuestas asistidas",
      get: (p) => (p.max_proposals_per_day >= 999 ? "Ilimitadas" : `${p.max_proposals_per_day}/dia`),
    },
  ];

  return (
    <section id="planes" className="px-6 py-24 md:px-10 md:py-36">
      <p className="label-eyebrow mb-5">Planes</p>
      <h2 className="max-w-2xl text-balance font-serif text-4xl leading-[1.05] text-ink-0 md:text-5xl">
        Empieza gratis. Escala cuando lo necesites.
      </h2>

      <div className="mt-16 overflow-x-auto">
        <div className="min-w-[720px]">
          <div
            className="grid border-b border-ink-800 pb-6"
            style={{ gridTemplateColumns: "1.4fr repeat(3, 1fr)" }}
          >
            <div />
            {plans.map((p, i) => (
              <div
                key={p.id}
                className={`px-4 ${i === 1 ? "-my-4 rounded-t-2xl bg-ink-0 py-4" : ""}`}
              >
                <p className={`label-eyebrow ${i === 1 ? "!text-ink-600" : ""}`}>{p.name}</p>
                <p
                  className={`mt-2 font-serif text-3xl ${i === 1 ? "text-ink-950" : "text-ink-0"}`}
                >
                  {p.price_usd === 0 ? "Gratis" : `$${p.price_usd}`}
                  {p.price_usd > 0 && (
                    <span className="text-sm font-normal opacity-50">/mes</span>
                  )}
                </p>
              </div>
            ))}
          </div>

          {rows.map((row) => (
            <div
              key={row.label}
              className="grid items-center border-b border-ink-800 py-5"
              style={{ gridTemplateColumns: "1.4fr repeat(3, 1fr)" }}
            >
              <p className="text-sm text-ink-500">{row.label}</p>
              {plans.map((p, i) => (
                <p
                  key={p.id}
                  className={`px-4 text-sm ${i === 1 ? "bg-ink-0 py-1 font-medium text-ink-950" : "text-ink-0"}`}
                >
                  {row.get(p)}
                </p>
              ))}
            </div>
          ))}

          <div className="grid pt-8" style={{ gridTemplateColumns: "1.4fr repeat(3, 1fr)" }}>
            <div />
            {plans.map((p, i) => (
              <div key={p.id} className={`px-4 ${i === 1 ? "-mt-2 rounded-b-2xl bg-ink-0 pb-6" : ""}`}>
                <Link
                  href="/register"
                  className={
                    i === 1
                      ? "inline-flex w-full items-center justify-center rounded-full border border-ink-950 px-6 py-3 text-sm font-medium text-ink-950 transition-colors hover:bg-ink-950 hover:text-ink-0"
                      : "btn-secondary w-full"
                  }
                >
                  Empezar
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden px-6 py-28 md:px-10 md:py-40">
      <h2 className="text-balance font-serif text-[15vw] leading-[0.9] tracking-tight text-ink-0 md:text-[9rem]">
        Se el primero.
      </h2>
      <div className="mt-10 flex items-center gap-6 md:mt-14">
        <Link href="/register" className="btn-primary">
          Crear cuenta gratis
        </Link>
        <p className="max-w-[16rem] text-sm text-ink-500">
          No el ultimo en intentarlo. Empieza a recibir avisos hoy mismo.
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-ink-800 px-6 py-10 md:px-10">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <Logo />
        <p className="text-xs text-ink-500">© {new Date().getFullYear()} yessjob</p>
      </div>
    </footer>
  );
}
