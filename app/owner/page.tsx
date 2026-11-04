"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function OwnerPage() {
const supabase = createClient();
  const router = useRouter();
  const [status, setStatus] = useState("Hesap kontrol ediliyor…");
  const [email, setEmail] = useState("");

  useEffect(() => {
    let active = true;

    async function checkOwner() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/");
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (!active) return;

      if (error || data?.role !== "owner") {
        setStatus("Bu sayfaya erişim yetkin yok.");
        return;
      }

      setEmail(user.email ?? "");
      setStatus("Owner doğrulandı.");
    }

    checkOwner();

    return () => {
      active = false;
    };
  }, [router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <p className="text-sm font-semibold tracking-[0.25em] text-cyan-400">
              XENCOM
            </p>
            <h1 className="mt-2 text-3xl font-bold">Owner Paneli</h1>
          </div>
          <button
            onClick={signOut}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm hover:bg-white/10"
          >
            Çıkış yap
          </button>
        </header>

        <section className="mt-8 rounded-xl border border-white/10 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-400">Durum</p>
          <p className="mt-2 font-medium">{status}</p>
          {email && <p className="mt-2 text-sm text-zinc-400">{email}</p>}
        </section>

        <section className="mt-6 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-6">
          <h2 className="text-xl font-semibold">Kurulum durumu</h2>
          <p className="mt-2 text-sm text-zinc-300">
            Owner rolü doğrulandı. Yönetim işlemlerini eklemeden önce
            sunucu tarafı yetki kontrolleri ve veritabanı politikaları
            hazırlanacak.
          </p>
        </section>
      </div>
    </main>
  );
}
