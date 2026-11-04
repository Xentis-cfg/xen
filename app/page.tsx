"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function Home() {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
          },
        });

        if (error) throw error;

        setMessage(
          data.session
            ? "Hesap oluşturuldu ve giriş yapıldı."
            : "Hesap oluşturuldu. E-posta doğrulaması gerekiyorsa gelen kutunu kontrol et.",
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        setMessage("Giriş başarılı.");
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Bir hata oluştu.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-8 shadow-2xl">
        <p className="mb-2 text-sm font-semibold tracking-[0.25em] text-cyan-400">
          XENCOM
        </p>
        <h1 className="text-3xl font-bold">
          {mode === "signup" ? "Hesap oluştur" : "Giriş yap"}
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Topluluğa katılmak için e-posta adresini kullan.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {mode === "signup" && (
            <label className="block text-sm">
              Görünen ad
              <input
                required
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2.5 outline-none focus:border-cyan-400"
                autoComplete="nickname"
              />
            </label>
          )}

          <label className="block text-sm">
            E-posta
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2.5 outline-none focus:border-cyan-400"
              autoComplete="email"
            />
          </label>

          <label className="block text-sm">
            Şifre
            <input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2.5 outline-none focus:border-cyan-400"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
            {mode === "signup" && (
              <span className="mt-1 block text-xs text-zinc-500">
                En az 8 karakter.
              </span>
            )}
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-zinc-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "İşleniyor…"
              : mode === "signup"
                ? "Kayıt ol"
                : "Giriş yap"}
          </button>
        </form>

        {message && (
          <p className="mt-5 rounded-lg bg-zinc-800 p-3 text-sm text-zinc-200">
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-zinc-400">
          {mode === "signup" ? "Zaten hesabın var mı?" : "Hesabın yok mu?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signup" ? "login" : "signup");
              setMessage("");
            }}
            className="font-semibold text-cyan-400 hover:text-cyan-300"
          >
            {mode === "signup" ? "Giriş yap" : "Kayıt ol"}
          </button>
        </p>
      </section>
    </main>
  );
}
