import Link from "next/link";
import { Archivo } from "next/font/google";
import { Logo } from "@/components/logo";
import { Reveal } from "@/components/reveal";
import { createClient } from "@/lib/supabase/server";
import type { Plan } from "@/lib/types";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

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
      <HowItWorks />
      <Plans plans={(plans as Plan[]) ?? []} />
      <FinalCta />
      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="sticky top-4 z-50 mx-auto flex max-w-3xl items-center justify-between rounded-full bg-ink-0 px-5 py-3 text-ink-950 shadow-soft md:px-6">
      <Link href="/">
        <Logo />
      </Link>
      <nav className="hidden items-center gap-6 md:flex">
        <a href="#como-funciona" className="text-sm text-ink-400 transition-colors hover:text-ink-950">
          Como funciona
        </a>
        <a href="#planes" className="text-sm text-ink-400 transition-colors hover:text-ink-950">
          Planes
        </a>
      </nav>
      <div className="flex items-center gap-2">
        <Link href="/login" className="hidden text-sm text-ink-400 transition-colors hover:text-ink-950 sm:block">
          Iniciar sesion
        </Link>
        <Link
          href="/register"
          className="rounded-full bg-ink-950 px-4 py-2 text-sm font-medium text-ink-0 transition-transform hover:scale-[1.03]"
        >
          Crear cuenta
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="px-6 pb-20 pt-16 md:px-10 md:pb-28 md:pt-24">
      <div className="mx-auto max-w-4xl text-center">
        <Reveal>
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-ink-800 px-4 py-1.5 text-xs text-ink-500">
            <span className="status-dot animate-pulse bg-ink-0" />
            Monitoreo activo, ahora mismo
          </p>
        </Reveal>

        <Reveal delay={80}>
          <h1
            className={`${archivo.className} text-balance text-[13vw] font-[900] leading-[0.95] tracking-[-0.03em] text-ink-0 md:text-[5.2rem]`}
          >
            Buscando tu proximo proyecto.
            <br />
            Cada minuto. Cada segundo.
          </h1>
        </Reveal>

        <Reveal delay={160}>
          <p className="mx-auto mt-7 max-w-md text-balance text-base text-ink-500 md:text-lg">
            Conecta tu Telegram, dinos que buscas, y nosotros vigilamos
            Workana, Freelancer y Upwork por ti.
          </p>
        </Reveal>

        <Reveal delay={240}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="btn-primary">
              Empezar gratis
            </Link>
            <a href="#como-funciona" className="btn-secondary">
              Ver como funciona
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Marquee() {
  const items = ["Workana", "Freelancer.com", "Upwork", "Siempre vigilando"];
  const track = [...items, ...items];

  return (
    <section className="overflow-hidden border-y border-ink-800 bg-ink-0 py-4">
      <div className="marquee-track flex w-max items-center gap-10 whitespace-nowrap">
        {track.map((item, i) => (
          <span
            key={i}
            className={`${archivo.className} flex items-center gap-10 text-2xl font-[800] tracking-tight text-ink-950 md:text-3xl`}
          >
            {item}
            <span className="text-lg text-ink-600">✦</span>
          </span>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Conecta tu Telegram",
      body: "Un enlace, un clic. Asi de simple.",
    },
    {
      n: "02",
      title: "Dinos que buscas",
      body: "Elegis tu rubro y tus plataformas.",
    },
    {
      n: "03",
      title: "Recibi el aviso",
      body: "Apenas aparece algo para ti, te llega al instante.",
    },
  ];

  return (
    <section id="como-funciona" className="px-6 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <h2
            className={`${archivo.className} mx-auto max-w-lg text-balance text-center text-3xl font-[800] tracking-tight text-ink-0 md:text-4xl`}
          >
            Vos decidis que buscar. Nosotros hacemos el resto.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 100}>
              <div className="h-full rounded-3xl bg-ink-900 p-7">
                <span className={`${archivo.className} text-sm font-[700] text-ink-600`}>
                  {s.n}
                </span>
                <h3 className={`${archivo.className} mt-4 text-xl font-[700] tracking-tight text-ink-0`}>
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
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
    <section id="planes" className="px-6 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <h2
            className={`${archivo.className} text-balance text-3xl font-[800] tracking-tight text-ink-0 md:text-4xl`}
          >
            Empeza gratis. Escala cuando lo necesites.
          </h2>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-12 overflow-x-auto rounded-3xl bg-ink-900 p-6 md:p-8">
            <div className="min-w-[640px]">
              <div
                className="grid border-b border-ink-800 pb-6"
                style={{ gridTemplateColumns: "1.4fr repeat(3, 1fr)" }}
              >
                <div />
                {plans.map((p, i) => (
                  <div key={p.id} className={`px-4 ${i === 1 ? "-my-4 rounded-2xl bg-ink-0 py-4" : ""}`}>
                    <p className={`label-eyebrow ${i === 1 ? "!text-ink-600" : ""}`}>{p.name}</p>
                    <p
                      className={`${archivo.className} mt-2 text-2xl font-[800] ${i === 1 ? "text-ink-950" : "text-ink-0"}`}
                    >
                      {p.price_usd === 0 ? "Gratis" : `$${p.price_usd}`}
                      {p.price_usd > 0 && <span className="text-sm font-normal opacity-50">/mes</span>}
                    </p>
                  </div>
                ))}
              </div>

              {rows.map((row) => (
                <div
                  key={row.label}
                  className="grid items-center border-b border-ink-800 py-4"
                  style={{ gridTemplateColumns: "1.4fr repeat(3, 1fr)" }}
                >
                  <p className="text-sm text-ink-500">{row.label}</p>
                  {plans.map((p, i) => (
                    <p
                      key={p.id}
                      className={`px-4 text-sm ${i === 1 ? "rounded-lg bg-ink-0 py-1 font-medium text-ink-950" : "text-ink-0"}`}
                    >
                      {row.get(p)}
                    </p>
                  ))}
                </div>
              ))}

              <div className="grid pt-6" style={{ gridTemplateColumns: "1.4fr repeat(3, 1fr)" }}>
                <div />
                {plans.map((p, i) => (
                  <div key={p.id} className={`px-4 ${i === 1 ? "-mt-1 rounded-b-2xl bg-ink-0 pb-5" : ""}`}>
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
        </Reveal>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-6 py-24 text-center md:px-10 md:py-32">
      <Reveal>
        <h2
          className={`${archivo.className} mx-auto max-w-2xl text-balance text-4xl font-[900] tracking-tight text-ink-0 md:text-6xl`}
        >
          Deja de buscar. Empeza a recibir.
        </h2>
      </Reveal>
      <Reveal delay={100}>
        <div className="mt-9">
          <Link href="/register" className="btn-primary">
            Crear cuenta gratis
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-ink-800 px-6 py-10 md:px-10">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 sm:flex-row">
        <Logo />
        <p className="text-xs text-ink-500">© {new Date().getFullYear()} yessjob</p>
      </div>
    </footer>
  );
}
