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
    <main className="min-h-screen bg-ink-950">
      <Header />
      <Hero />
      <LogosBar />
      <HowItWorks />
      <Plans plans={(plans as Plan[]) ?? []} />
      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink-800 bg-ink-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#como-funciona" className="label-eyebrow hover:text-ink-0">
            Como funciona
          </a>
          <a href="#planes" className="label-eyebrow hover:text-ink-0">
            Planes
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost">
            Iniciar sesion
          </Link>
          <Link href="/register" className="btn-primary">
            Crear cuenta
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-ink-800">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]" />
      <div className="relative mx-auto max-w-6xl px-6 py-28 md:py-36">
        <div className="max-w-3xl animate-fadeUp">
          <p className="label-eyebrow mb-6 flex items-center gap-2">
            <span className="status-dot bg-ink-0" />
            monitoreo activo · workana + freelancer
          </p>
          <h1 className="text-4xl font-medium leading-[1.1] tracking-tight text-ink-0 md:text-6xl">
            Los proyectos freelance
            <br />
            te encuentran a{" "}
            <span className="relative inline-block">
              vos
              <span className="absolute -bottom-1 left-0 h-px w-full bg-ink-0" />
            </span>
            .
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-400 md:text-lg">
            Elegis tu sector y tus plataformas. Nosotros vigilamos Workana y
            Freelancer sin parar y te avisamos directo a Telegram apenas
            aparece algo para vos.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/register" className="btn-primary">
              Crear cuenta gratis
            </Link>
            <a href="#como-funciona" className="btn-secondary">
              Ver como funciona
            </a>
          </div>
        </div>

        <TelegramMock />
      </div>
    </section>
  );
}

function TelegramMock() {
  return (
    <div className="pointer-events-none absolute -right-10 top-24 hidden w-[380px] rotate-2 lg:block">
      <div className="panel animate-fadeUp p-5" style={{ animationDelay: "150ms" }}>
        <div className="mb-4 flex items-center justify-between">
          <span className="label-eyebrow">nuevo proyecto · workana</span>
          <span className="status-dot bg-ink-0 animate-blink" />
        </div>
        <p className="text-sm font-medium text-ink-0">
          Necesito automatizar reportes con Python
        </p>
        <p className="mt-2 text-xs leading-relaxed text-ink-500">
          Busco a alguien con experiencia en scraping y APIs para conectar
          nuestro CRM con...
        </p>
        <div className="mt-4 flex items-center gap-4 font-mono text-[11px] text-ink-500">
          <span>USD 200-400</span>
          <span>·</span>
          <span>3 propuestas</span>
          <span>·</span>
          <span>hace 2 min</span>
        </div>
        <div className="mt-4 flex gap-2">
          <span className="border border-ink-700 px-3 py-1.5 font-mono text-[11px] text-ink-400">
            Abrir proyecto
          </span>
          <span className="border border-ink-0 px-3 py-1.5 font-mono text-[11px] text-ink-0">
            Generar propuesta IA
          </span>
        </div>
      </div>
    </div>
  );
}

function LogosBar() {
  return (
    <section className="border-b border-ink-800 py-8">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-12 px-6 font-mono text-xs uppercase tracking-widest2 text-ink-600">
        <span>Workana</span>
        <span className="text-ink-800">/</span>
        <span>Freelancer.com</span>
        <span className="text-ink-800">/</span>
        <span>Telegram</span>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Elegis plataforma y sector",
      body: "Workana, Freelancer o ambas. IT, diseño, marketing, redacción y mas — vos decidis donde buscar.",
    },
    {
      n: "02",
      title: "Definis tus palabras clave",
      body: "Filtramos por tus keywords, presupuesto minimo y las que quieras excluir. Solo lo relevante.",
    },
    {
      n: "03",
      title: "Recibis la notificacion en Telegram",
      body: "En segundos, directo a tu chat. Con un boton generas una propuesta con IA lista para enviar.",
    },
  ];

  return (
    <section id="como-funciona" className="border-b border-ink-800 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="label-eyebrow mb-3">proceso</p>
        <h2 className="max-w-lg text-2xl font-medium tracking-tight text-ink-0 md:text-3xl">
          Tres pasos, cero scroll infinito.
        </h2>

        <div className="mt-16 grid gap-px overflow-hidden border border-ink-800 bg-ink-800 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="bg-ink-950 p-8">
              <span className="font-mono text-3xl text-ink-700">{s.n}</span>
              <h3 className="mt-6 text-lg font-medium text-ink-0">{s.title}</h3>
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
    <section id="planes" className="border-b border-ink-800 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="label-eyebrow mb-3">planes</p>
        <h2 className="max-w-lg text-2xl font-medium tracking-tight text-ink-0 md:text-3xl">
          Empeza gratis. Escala cuando lo necesites.
        </h2>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {plans.map((p, i) => (
            <div
              key={p.id}
              className={`flex flex-col p-8 ${
                i === 1
                  ? "border border-ink-0 bg-ink-0 text-ink-950"
                  : "panel text-ink-0"
              }`}
            >
              <p
                className={`label-eyebrow ${i === 1 ? "text-ink-600" : "text-ink-500"}`}
              >
                {p.name}
              </p>
              <p className="mt-4 text-3xl font-medium tracking-tight">
                {p.price_usd === 0 ? "Gratis" : `USD ${p.price_usd}`}
                {p.price_usd > 0 && (
                  <span className="text-sm font-normal opacity-60">/mes</span>
                )}
              </p>

              <ul
                className={`mt-8 flex-1 space-y-3 font-mono text-xs ${
                  i === 1 ? "text-ink-700" : "text-ink-400"
                }`}
              >
                <li>· {p.max_platforms} plataforma(s)</li>
                <li>· {p.max_sectors} sector(es)</li>
                <li>· {p.max_keywords} keywords</li>
                <li>· cada {p.min_scrape_interval_min} min</li>
                <li>
                  ·{" "}
                  {p.max_proposals_per_day >= 999
                    ? "propuestas ilimitadas"
                    : `${p.max_proposals_per_day} propuestas IA/dia`}
                </li>
              </ul>

              <Link
                href="/register"
                className={`mt-8 ${i === 1 ? "btn-secondary !border-ink-950 !text-ink-950 hover:!border-ink-600" : "btn-secondary"}`}
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

function Footer() {
  return (
    <footer className="py-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
        <Logo />
        <p className="font-mono text-[11px] text-ink-600">
          © {new Date().getFullYear()} yessjob
        </p>
      </div>
    </footer>
  );
}
