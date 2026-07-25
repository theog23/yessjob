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
    <header className="sticky top-4 z-50 mx-auto flex max-w-4xl items-center justify-between px-4">
      <div className="glass flex w-full items-center justify-between rounded-full px-5 py-3">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <a href="#como-funciona" className="text-sm text-ink-400 transition-colors hover:text-ink-0">
            Como funciona
          </a>
          <a href="#planes" className="text-sm text-ink-400 transition-colors hover:text-ink-0">
            Planes
          </a>
        </nav>
        <div className="flex items-center gap-1">
          <Link href="/login" className="btn-ghost !px-3 !text-[13px]">
            Iniciar sesion
          </Link>
          <Link href="/register" className="btn-primary !px-4 !py-2 !text-[13px]">
            Crear cuenta
          </Link>
        </div>
      </div>
    </header>
  );
}

function Blobs() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div className="blob animate-drift left-[-10%] top-[-10%] h-[32rem] w-[32rem] bg-ink-0/[0.06]" />
      <div className="blob animate-driftSlow right-[-15%] top-[10%] h-[36rem] w-[36rem] bg-ink-400/[0.08]" />
      <div className="blob animate-drift bottom-[-15%] left-[20%] h-[28rem] w-[28rem] bg-ink-0/[0.05]" />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative px-4 pb-28 pt-20 md:pb-40 md:pt-28">
      <Blobs />
      <div className="mx-auto max-w-3xl text-center">
        <div className="glass mx-auto mb-8 inline-flex animate-fadeUp items-center gap-2 rounded-full px-4 py-2">
          <span className="status-dot bg-ink-0" />
          <span className="text-xs text-ink-400">
            Para quienes viven de proyectos freelance
          </span>
        </div>

        <h1
          className="animate-fadeUp text-balance font-serif text-4xl leading-[1.08] tracking-tight text-ink-0 md:text-6xl"
          style={{ animationDelay: "80ms" }}
        >
          El proyecto perfecto no espera a que vos lo encuentres.
        </h1>

        <p
          className="mx-auto mt-6 max-w-xl animate-fadeUp text-balance text-base leading-relaxed text-ink-400 md:text-lg"
          style={{ animationDelay: "160ms" }}
        >
          Todos los dias aparecen decenas de oportunidades nuevas. Vos revisas
          unas pocas, cuando podes, y para cuando las ves ya tienen varias
          propuestas. Nosotros las vigilamos por vos y te avisamos apenas
          aparece una de las tuyas.
        </p>

        <div
          className="mt-10 flex animate-fadeUp flex-wrap items-center justify-center gap-4"
          style={{ animationDelay: "240ms" }}
        >
          <Link href="/register" className="btn-primary">
            Empezar gratis
          </Link>
          <a href="#como-funciona" className="btn-secondary">
            Ver como funciona
          </a>
        </div>
      </div>

      <FloatingAlertCard />
    </section>
  );
}

function FloatingAlertCard() {
  return (
    <div className="pointer-events-none relative mx-auto mt-16 hidden max-w-3xl md:block">
      <div
        className="glass absolute left-[8%] top-0 w-72 -rotate-3 animate-fadeUp rounded-3xl p-5"
        style={{ animationDelay: "380ms" }}
      >
        <p className="label-eyebrow">nueva oportunidad</p>
        <p className="mt-3 font-serif text-lg text-ink-0">
          Rediseno de identidad para marca de indumentaria
        </p>
        <p className="mt-2 text-xs text-ink-500">Diseño grafico · hace un minuto</p>
      </div>
      <div
        className="glass absolute right-[6%] top-16 w-64 rotate-2 animate-fadeUp rounded-3xl p-5"
        style={{ animationDelay: "480ms" }}
      >
        <p className="label-eyebrow">nueva oportunidad</p>
        <p className="mt-3 font-serif text-lg text-ink-0">
          Necesito ordenar la contabilidad de mi negocio
        </p>
        <p className="mt-2 text-xs text-ink-500">Finanzas · hace un minuto</p>
      </div>
    </div>
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
      body: "Perdes horas filtrando publicaciones que ni siquiera son de tu area, buscando esa unica que te sirve.",
    },
  ];

  return (
    <section className="relative px-4 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-lg">
          <p className="label-eyebrow mb-4">el problema</p>
          <h2 className="text-balance font-serif text-3xl leading-tight text-ink-0 md:text-4xl">
            Buscar trabajo se volvio un trabajo en si mismo.
          </h2>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {points.map((p) => (
            <div key={p.title} className="panel p-7">
              <h3 className="font-serif text-xl leading-snug text-ink-0">{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-500">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Solution() {
  return (
    <section className="relative overflow-hidden px-4 py-24 md:py-32">
      <div className="absolute inset-0 -z-10 bg-ink-0" />
      <div className="blob absolute -left-20 top-0 -z-10 h-96 w-96 animate-drift bg-white/[0.06]" />
      <div className="blob absolute -right-10 bottom-0 -z-10 h-[26rem] w-[26rem] animate-driftSlow bg-white/[0.05]" />

      <div className="mx-auto max-w-3xl text-center">
        <p className="label-eyebrow mb-4 !text-ink-600">la solucion</p>
        <h2 className="text-balance font-serif text-3xl leading-tight text-ink-950 md:text-4xl">
          Vos elegis que te interesa. Nosotros no dejamos de mirar.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-balance text-base leading-relaxed text-ink-700 md:text-lg">
          Elegis tu rubro, tus plataformas y lo que te interesa recibir. A
          partir de ahi no tenes que volver a revisar nada: en el instante en
          que aparece un proyecto que coincide con lo tuyo, te llega el
          aviso. Vos decidis si responder.
        </p>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Contanos que buscas",
      body: "Elegis tu area — diseño, desarrollo, redaccion, lo que sea — y las plataformas donde queres que miremos.",
    },
    {
      n: "02",
      title: "Nosotros vigilamos, siempre",
      body: "Mientras haces otra cosa, seguimos de cerca cada publicacion nueva que aparece en tu rubro.",
    },
    {
      n: "03",
      title: "Te avisamos al toque",
      body: "Apenas aparece algo para vos, te llega el aviso directo al celular, con todo lo que necesitas para decidir.",
    },
  ];

  return (
    <section id="como-funciona" className="relative px-4 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        <div className="mb-14 max-w-lg">
          <p className="label-eyebrow mb-4">como funciona</p>
          <h2 className="text-balance font-serif text-3xl leading-tight text-ink-0 md:text-4xl">
            Tres pasos. Despues, te olvidas del tema.
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="panel relative overflow-hidden p-8">
              <span className="font-serif text-5xl italic text-ink-700">{s.n}</span>
              <h3 className="mt-6 font-serif text-xl text-ink-0">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-500">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Plans({ plans }: { plans: Plan[] }) {
  if (!plans.length) return null;

  return (
    <section id="planes" className="relative px-4 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        <div className="mb-14 max-w-lg">
          <p className="label-eyebrow mb-4">planes</p>
          <h2 className="text-balance font-serif text-3xl leading-tight text-ink-0 md:text-4xl">
            Empeza gratis. Escala cuando lo necesites.
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {plans.map((p, i) => (
            <div
              key={p.id}
              className={`flex flex-col rounded-3xl p-8 ${
                i === 1 ? "glass-dark" : "panel"
              }`}
            >
              <p className={`label-eyebrow ${i === 1 ? "!text-ink-600" : ""}`}>{p.name}</p>
              <p
                className={`mt-4 font-serif text-3xl ${i === 1 ? "text-ink-950" : "text-ink-0"}`}
              >
                {p.price_usd === 0 ? "Gratis" : `USD ${p.price_usd}`}
                {p.price_usd > 0 && (
                  <span className="text-base font-normal opacity-50">/mes</span>
                )}
              </p>

              <ul
                className={`mt-8 flex-1 space-y-2.5 text-sm ${
                  i === 1 ? "text-ink-700" : "text-ink-500"
                }`}
              >
                <li>{p.max_platforms} plataforma(s)</li>
                <li>{p.max_sectors} rubro(s)</li>
                <li>{p.max_keywords} palabras clave</li>
                <li>Avisos cada {p.min_scrape_interval_min} min</li>
                <li>
                  {p.max_proposals_per_day >= 999
                    ? "Propuestas ilimitadas"
                    : `${p.max_proposals_per_day} propuestas asistidas/dia`}
                </li>
              </ul>

              <Link
                href="/register"
                className={i === 1 ? "btn-primary mt-8 !bg-ink-950 !text-ink-0" : "btn-secondary mt-8"}
              >
                Empezar
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative px-4 py-24 md:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-balance font-serif text-3xl leading-tight text-ink-0 md:text-5xl">
          Se el primero en enterarte.
          <br />
          <span className="italic text-ink-500">No el ultimo en intentarlo.</span>
        </h2>
        <div className="mt-10">
          <Link href="/register" className="btn-primary">
            Crear cuenta gratis
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-ink-800 px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
        <Logo />
        <p className="text-xs text-ink-500">© {new Date().getFullYear()} yessjob</p>
      </div>
    </footer>
  );
}
