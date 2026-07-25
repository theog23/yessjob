"use client";

import { useState } from "react";
import { generateLinkToken } from "./actions";

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

export function LinkPanel() {
  const [href, setHref] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    const result = await generateLinkToken();
    setLoading(false);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    if (!BOT_USERNAME) {
      setError("Falta configurar NEXT_PUBLIC_TELEGRAM_BOT_USERNAME.");
      return;
    }
    setHref(`https://t.me/${BOT_USERNAME}?start=${result.token}`);
  }

  if (href) {
    return (
      <div className="panel rounded-3xl p-6">
        <p className="text-sm text-ink-0">Enlace generado. Valido por 15 minutos.</p>
        <p className="mt-2 text-sm text-ink-500">
          Toca el boton para abrir Telegram y confirmar la vinculacion desde ahi.
        </p>
        <a href={href} target="_blank" rel="noopener noreferrer" className="btn-primary mt-4">
          Abrir Telegram →
        </a>
      </div>
    );
  }

  return (
    <div className="panel rounded-3xl p-6">
      <p className="text-sm text-ink-0">Tu cuenta todavia no esta vinculada.</p>
      <p className="mt-2 text-sm text-ink-500">
        Generamos un enlace de un solo uso que confirma la vinculacion con tu
        cuenta automaticamente.
      </p>
      {error && (
        <p className="mt-4 rounded-2xl border border-ink-700 bg-ink-900 px-4 py-3 text-sm text-ink-300">
          {error}
        </p>
      )}
      <button onClick={handleGenerate} disabled={loading} className="btn-primary mt-4">
        {loading ? "Generando..." : "Conectar Telegram"}
      </button>
    </div>
  );
}
