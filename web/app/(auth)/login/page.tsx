"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthState } from "../actions";

const initialState: AuthState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div>
      <p className="label-eyebrow mb-2">acceso</p>
      <h1 className="font-serif text-2xl text-ink-0">
        Iniciar sesion
      </h1>
      <p className="mt-2 text-sm text-ink-500">
        Segui monitoreando tus proyectos donde los dejaste.
      </p>

      <form action={formAction} className="mt-8 space-y-4">
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
            className="field-input"
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>

        {state.error && (
          <p className="rounded-2xl border border-ink-700 bg-ink-900 px-4 py-3 text-sm text-ink-300">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-500">
        No tenes cuenta?{" "}
        <Link href="/register" className="text-ink-0 underline underline-offset-4">
          Crea una
        </Link>
      </p>
    </div>
  );
}
