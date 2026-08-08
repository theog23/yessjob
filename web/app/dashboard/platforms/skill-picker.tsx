"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FreelancerSkill } from "@/lib/types";

export function SkillPicker({ maxSkills }: { maxSkills: number }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FreelancerSkill[]>([]);
  const [selected, setSelected] = useState<FreelancerSkill[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("freelancer_skills")
        .select("id, name, category")
        .ilike("name", `%${q}%`)
        .order("name")
        .limit(20);
      setLoading(false);
      setResults((data as FreelancerSkill[]) ?? []);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function addSkill(skill: FreelancerSkill) {
    if (selected.some((s) => s.id === skill.id) || selected.length >= maxSkills) return;
    setSelected((prev) => [...prev, skill]);
    setQuery("");
    setResults([]);
  }

  function removeSkill(id: number) {
    setSelected((prev) => prev.filter((s) => s.id !== id));
  }

  const atLimit = selected.length >= maxSkills;

  return (
    <div>
      <label className="label-eyebrow mb-2 block">
        Skills de Freelancer.com{" "}
        <span className="text-ink-600">
          ({selected.length}/{maxSkills})
        </span>
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="field-input"
        placeholder={atLimit ? "Llegaste al limite de tu plan" : "Buscar skills (ej: React, Diseno grafico)"}
        disabled={atLimit}
      />

      {loading && <p className="mt-1 text-xs text-ink-500">Buscando...</p>}

      {results.length > 0 && (
        <ul className="mt-2 max-h-48 overflow-y-auto rounded-2xl border border-ink-800">
          {results.map((skill) => (
            <li key={skill.id}>
              <button
                type="button"
                onClick={() => addSkill(skill)}
                className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-ink-0 hover:bg-ink-900"
              >
                <span>{skill.name}</span>
                <span className="text-xs text-ink-600">{skill.category}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selected.map((skill) => (
            <span
              key={skill.id}
              className="glass flex items-center gap-2 rounded-full px-3 py-1 text-xs text-ink-0"
            >
              {skill.name}
              <button
                type="button"
                onClick={() => removeSkill(skill.id)}
                className="text-ink-500 hover:text-ink-0"
                aria-label={`Quitar ${skill.name}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <input type="hidden" name="freelancer_skill_ids" value={selected.map((s) => s.id).join(",")} />
    </div>
  );
}
