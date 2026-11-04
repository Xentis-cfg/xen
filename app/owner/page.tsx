export const instant = false;

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function OwnerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: roleRecord, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (error || roleRecord?.role !== "owner") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
        <section className="rounded-xl border border-white/10 bg-zinc-900 p-8">
          <h1 className="text-2xl font-bold">Erişim reddedildi</h1>
          <p className="mt-2 text-zinc-400">
            Bu sayfaya erişim yetkin yok.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <header className="border-b border-white/10 pb-6">
          <p className="text-sm font-semibold tracking-[0.25em] text-cyan-400">
            XENCOM
          </p>
          <h1 className="mt-2 text-3xl font-bold">Owner Paneli</h1>
        </header>

        <section className="mt-8 rounded-xl border border-white/10 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-400">Durum</p>
          <p className="mt-2 font-medium">Owner sunucu tarafında doğrulandı.</p>
          <p className="mt-2 text-sm text-zinc-400">{user.email}</p>
        </section>
      </div>
    </main>
  );
}
