import Link from "next/link";
import { Archivo } from "next/font/google";
import { Logo } from "@/components/logo";
import { Reveal } from "@/components/reveal";
import { ScrollWords } from "@/components/scroll-words";
import { ShrinkingLogo } from "@/components/shrinking-logo";
import { createClient } from "@/lib/supabase/server";
import type { Plan } from "@/lib/types";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: plan } = await supabase
    .from("plans")
    .select("*")
    .eq("slug", "pro")
    .eq("is_active", true)
    .maybeSingle();

  return (
    <main className="relative min-h-screen overflow-x-clip bg-ink-950">
      <Header />
      <Hero />
      <Explainer />
      <AiProposals />
      <ScrollStatement />
      <Marquee />
      <HowItWorks />
      <Plans plan={plan as Plan | null} />
      <FinalCta />
      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="sticky top-4 z-50 mx-auto flex max-w-lg items-center justify-between rounded-[20px] bg-ink-0 px-4 py-3 text-ink-950 shadow-soft">
      <Link href="/">
        <Logo />
      </Link>
      <nav className="hidden items-center gap-5 md:flex">
        <a href="#como-funciona" className="text-sm text-ink-400 transition-colors hover:text-ink-950">
          Como funciona
        </a>
        <a href="#planes" className="text-sm text-ink-400 transition-colors hover:text-ink-950">
          Planes
        </a>
      </nav>
      <div className="flex items-center gap-3">
        <Link href="/login" className="hidden text-sm text-ink-400 transition-colors hover:text-ink-950 sm:block">
          Iniciar sesion
        </Link>
        <Link
          href="/register"
          className="rounded-full bg-ink-950 px-4 py-2 text-xs font-medium text-ink-0 transition-transform hover:scale-[1.03]"
        >
          Crear cuenta
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative flex min-h-[85vh] flex-col justify-center px-6 py-20 md:min-h-[92vh] md:px-10 md:py-0">
      <Reveal>
        <h1
          className={`${archivo.className} mx-auto max-w-5xl text-balance text-center text-[clamp(2rem,10.8vw,3rem)] font-[800] leading-[1.15] tracking-[-0.03em] text-ink-0 md:text-[7rem] md:leading-[0.92]`}
        >
          <span className="block">Nunca dejamos</span>
          <span className="block">de buscar.</span>
        </h1>
      </Reveal>

      <Reveal delay={100}>
        <div className="mt-6 md:mt-10">
          <ShrinkingLogo />
        </div>
      </Reveal>
    </section>
  );
}

function Explainer() {
  return (
    <section id="que-es" className="min-h-[70vh] px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[300px_1fr] md:gap-16">
        <Reveal>
          <h2 className={`${archivo.className} text-6xl font-[700] tracking-tight text-ink-0 md:text-7xl`}>
            ¡Hola!
          </h2>
        </Reveal>

        <div className="space-y-6">
          <Reveal delay={80}>
            <p className="text-balance text-xl font-medium leading-snug text-ink-0 md:text-2xl">
              yessjob es un servicio que vigila Workana, Freelancer.com y Upwork
              por ti, todo el dia, y avisa por Telegram apenas aparece
              un proyecto de tu rubro.
            </p>
          </Reveal>
          <Reveal delay={160}>
            <p className="text-balance text-base leading-relaxed text-ink-500 md:text-lg">
              No hace falta entrar a revisar cada plataforma varias
              veces al dia. Eliges una vez tu rubro, tus plataformas y las
              palabras clave que te interesan, y nosotros nos encargamos de
              mirar constantemente y avisarte al instante, para que seas de
              los primeros en responder.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function AiProposals() {
  return (
    <section className="px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <p className="label-eyebrow mb-4">Propuestas con IA</p>
          <h2
            className={`${archivo.className} text-balance text-4xl font-[800] tracking-tight text-ink-0 md:text-6xl`}
          >
            <span className="block">Tu estilo y su inteligencia.</span>
            <span className="block">La propuesta perfecta.</span>
          </h2>
        </Reveal>

        <Reveal delay={100}>
          <p className="mt-8 max-w-xl text-balance text-base leading-relaxed text-ink-500 md:text-lg">
            Pegas una propuesta tuya que te haya funcionado, o describes como
            te gusta escribir. La IA la combina con cada proyecto nuevo y te
            entrega una propuesta lista para enviar, sin salir de Telegram.
          </p>
        </Reveal>

        <Reveal delay={180}>
          <div
            className={`${archivo.className} mt-12 flex flex-wrap items-center gap-4 text-lg font-[800] tracking-tight text-ink-0 md:text-2xl`}
          >
            <span className="rounded-full border border-ink-800 px-5 py-2">Tu estilo</span>
            <span className="text-ink-600">+</span>
            <span className="rounded-full border border-ink-800 px-5 py-2">El proyecto</span>
            <span className="text-ink-600">=</span>
            <span className="rounded-full bg-ink-0 px-5 py-2 text-ink-950">Propuesta lista</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ScrollStatement() {
  return (
    <section className="px-6 py-24 md:px-10 md:py-36">
      <div className="mx-auto max-w-4xl">
        <ScrollWords
          text="Buscamos tu proyecto ideal cada minuto, cada segundo, sin descanso, para que tu solo tengas que decidir si te interesa."
          className={`${archivo.className} text-balance text-3xl font-[800] leading-tight tracking-tight md:text-5xl`}
        />
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
      body: "Vinculas tu cuenta en un clic. A partir de ahi, todo pasa alli, sin entrar a ninguna plataforma a revisar manualmente.",
    },
    {
      n: "02",
      title: "Elige que buscas",
      body: "Seleccionas tu rubro, tus plataformas y las palabras clave que te interesan. Tu decides los filtros, nosotros los aplicamos siempre.",
    },
    {
      n: "03",
      title: "Recibe el aviso al instante",
      body: "Apenas aparece un proyecto que coincide, te llega la notificacion con todo lo que necesitas para decidir, antes que la mayoria lo vea.",
    },
  ];

  return (
    <section id="como-funciona" className="px-6 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <p className="label-eyebrow mb-4">Como funciona</p>
        </Reveal>

        <div className="mt-4 divide-y divide-ink-800 border-t border-ink-800">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 80}>
              <div className="grid gap-2 py-8 md:grid-cols-[80px_260px_1fr] md:items-baseline md:gap-8">
                <span className={`${archivo.className} text-sm font-[700] text-ink-600`}>{s.n}</span>
                <h3 className={`${archivo.className} text-2xl font-[700] tracking-tight text-ink-0`}>
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed text-ink-500 md:text-base">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Plans({ plan }: { plan: Plan | null }) {
  if (!plan) return null;

  const features = [
    "3 plataformas: Workana, Freelancer.com y Upwork",
    "Avisos cada minuto, sin pausas",
    "100 generaciones de propuestas con IA por mes",
    "Generaciones extra: +100 por $2 cuando las necesites",
  ];

  return (
    <section id="planes" className="px-6 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <p className="label-eyebrow mb-4">Planes</p>
          <h2 className={`${archivo.className} text-balance text-3xl font-[800] tracking-tight text-ink-0 md:text-4xl`}>
            Un plan. Todo incluido.
          </h2>
        </Reveal>

        <Reveal delay={100}>
          <div className="mx-auto mt-12 max-w-md rounded-3xl border border-ink-0 bg-ink-0 p-8 text-ink-950">
            <p className="label-eyebrow !text-ink-600">{plan.name}</p>
            <p className={`${archivo.className} mt-3 text-5xl font-[800]`}>
              ${plan.price_usd}
              <span className="text-base font-normal opacity-50">/mes</span>
            </p>
            <p className="mt-2 text-sm text-ink-600">15 dias gratis, sin tarjeta.</p>

            <ul className="mt-7 space-y-3 border-t border-ink-300 pt-6 text-sm">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-0.5 text-ink-600">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-ink-950 px-6 py-3 text-sm font-medium text-ink-0 transition-transform hover:scale-[1.02]"
            >
              Empezar prueba gratis
            </Link>
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
          Deja de buscar. Empieza a recibir.
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
    <footer className="border-t border-ink-800 px-6 py-16 md:px-10">
      <div className="mx-auto max-w-4xl">
        <h3 className={`${archivo.className} max-w-xl text-balance text-3xl font-[800] tracking-tight text-ink-0 md:text-4xl`}>
          Encontrando proyectos, todo el tiempo.
        </h3>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-ink-800 pt-6 sm:flex-row">
          <Logo />
          <p className="text-xs text-ink-500">© {new Date().getFullYear()} yessjob</p>
        </div>
      </div>
    </footer>
  );
}
