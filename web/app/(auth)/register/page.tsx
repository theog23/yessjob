"use client";

import { useActionState } from "react";
import Link from "next/link";
import { register, type AuthState } from "../actions";

const initialState: AuthState = { error: null };

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(register, initialState);

  if (state.success) {
    return (
      <div>
        <p className="label-eyebrow mb-2">listo</p>
        <h1 className="font-serif text-2xl text-ink-0">
          Revisa tu email
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-400">{state.success}</p>
        <Link href="/login" className="btn-secondary mt-8 w-full">
          Ir a iniciar sesion
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="label-eyebrow mb-2">nueva cuenta</p>
      <h1 className="font-serif text-2xl text-ink-0">
        Crear cuenta
      </h1>
      <p className="mt-2 text-sm text-ink-500">
        Gratis. Sin tarjeta. Configuras tus filtros en 2 minutos.
      </p>

      <form action={formAction} className="mt-8 space-y-4">
        <div>
          <label className="label-eyebrow mb-2 block">Nombre</label>
          <input
            type="text"
            name="full_name"
            required
            className="field-input"
            placeholder="Tu nombre"
            autoComplete="name"
          />
        </div>
        <div>
          <label className="label-eyebrow mb-2 block">Email</label>
          <input
            type="email"
            name="email"
            required
            className="field-input"
            placeholder="tu@email.com"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="label-eyebrow mb-2 block">Contrasena</label>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            className="field-input"
            placeholder="Minimo 8 caracteres"
            autoComplete="new-password"
          />
        </div>

        {state.error && (
          <p className="rounded-2xl border border-ink-700 bg-ink-900 px-4 py-3 text-sm text-ink-300">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "Creando cuenta..." : "Crear cuenta gratis"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-500">
        Ya tenes cuenta?{" "}
        <Link href="/login" className="text-ink-0 underline underline-offset-4">
          Inicia sesion
        </Link>
      </p>
    </div>
  );
}
