import { createClient } from "@/lib/supabase/server";
import { StyleForm } from "./style-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, proposal_style")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  return (
    <div className="animate-fadeUp max-w-2xl">
      <p className="label-eyebrow mb-2">tu cuenta</p>
      <h1 className="font-serif text-3xl text-ink-0">Perfil</h1>
      <p className="mt-2 text-sm text-ink-500">
        Personaliza como la IA redacta tus propuestas. Esto se usa cada vez
        que tocas "Generar propuesta IA" en Telegram.
      </p>

      <div className="mt-8">
        <StyleForm initialValue={profile?.proposal_style ?? ""} />
      </div>
    </div>
  );
}
