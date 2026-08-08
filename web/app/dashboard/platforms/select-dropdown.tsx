"use client";

import { useEffect, useRef, useState } from "react";

type Option = { value: string; label: string };

/**
 * Reemplaza el <select> nativo (que en la mayoria de navegadores
 * muestra un popup gris con highlight azul, fuera de linea con el
 * resto del diseno) por una lista propia con el mismo estilo "glass"
 * que ya usa el buscador de skills.
 */
export function SelectDropdown({
  name,
  options,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  name: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`field-input flex items-center justify-between text-left disabled:cursor-not-allowed disabled:opacity-50 ${
          selected ? "text-ink-0" : "text-ink-600"
        }`}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <span
          aria-hidden
          className={`ml-2 shrink-0 text-ink-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          ⌄
        </span>
      </button>

      {open && (
        <ul className="glass absolute z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl">
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/50 ${
                  o.value === value ? "font-medium text-ink-0" : "text-ink-400"
                }`}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      <input type="hidden" name={name} value={value} />
    </div>
  );
}
