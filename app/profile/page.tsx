"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Profile = {
  id: string;
  display_name: string | null;
  username: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  avatar_color: string | null;
  banner_color: string | null;
};

const BUCKET = "profile-images";
const MAX_BYTES = 2 * 1024 * 1024;
const TYPES = ["image/png", "image/jpeg", "image/webp"];
const SWATCHES = ["#44403c", "#1e3a5f", "#3f6212", "#7c2d12", "#4c1d95", "#0f766e", "#525252", "#000000"];
const INPUT = "mt-2 w-full border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 focus:border-white focus:outline-none";

export default function ProfilePage() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState<Profile | null>(null);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/");
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username, bio, location, avatar_url, banner_url, avatar_color, banner_color")
        .eq("id", user.id)
        .maybeSingle();

      if (error) setStatus("Profil yüklenemedi: " + error.message);
      setUserId(user.id);
      setForm(data as Profile | null);
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function uploadImage(kind: "avatar_url" | "banner_url", file: File | undefined) {
    if (!file || !userId) return;
    if (!TYPES.includes(file.type)) {
      setStatus("Sadece PNG, JPG veya WEBP yüklenebilir.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setStatus("Dosya en fazla 2 MB olabilir.");
      return;
    }

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${userId}/${kind === "avatar_url" ? "avatar" : "banner"}-${Date.now()}.${ext}`;
    setStatus("Görsel yükleniyor...");

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
    if (error) {
      setStatus("Yükleme hatası: " + error.message);
      return;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    update(kind, data.publicUrl);
    setStatus("Görsel yüklendi. Kaydetmeyi unutma.");
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || !userId) return;

    const username = (form.username ?? "").trim().toLowerCase();
    if (username && !/^[a-z0-9_]{3,20}$/.test(username)) {
      setStatus("Kullanıcı adı 3-20 karakter olmalı: küçük harf, rakam veya alt çizgi.");
      return;
    }

    setSaving(true);
    setStatus("");
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: form.display_name?.trim() || null,
        username: username || null,
        bio: form.bio ?? "",
        location: form.location ?? "",
        avatar_url: form.avatar_url,
        banner_url: form.banner_url,
        avatar_color: form.avatar_color,
        banner_color: form.banner_color,
      })
      .eq("id", userId);
    setSaving(false);

    if (error) {
      setStatus(error.code === "23505" ? "Bu kullanıcı adı zaten alınmış." : "Kaydedilemedi: " + error.message);
      return;
    }
    setStatus("Profil kaydedildi.");
  }

  if (loading) return <main className="min-h-screen bg-black p-8 text-neutral-400">Yükleniyor...</main>;
  if (!form) return <main className="min-h-screen bg-black p-8 text-neutral-400">{status || "Profil bulunamadı."}</main>;

  const initial = (form.display_name || form.username || "?").charAt(0).toUpperCase();

  return (
    <main className="min-h-screen bg-black text-neutral-100">
      <div
        className="h-44 w-full bg-cover bg-center"
        style={{
          backgroundColor: form.banner_color ?? "#1e3a5f",
          backgroundImage: form.banner_url ? `url("${form.banner_url}")` : undefined,
        }}
      />

      <div className="mx-auto max-w-2xl px-6">
        <div className="-mt-12">
          <div
            className="flex h-24 w-24 items-center justify-center overflow-hidden border-4 border-black text-3xl font-semibold"
            style={{ backgroundColor: form.avatar_color ?? "#44403c" }}
          >
            {form.avatar_url ? (
              <img src={form.avatar_url} alt="Profil resmi" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-8 space-y-8 pb-16">
          <section className="space-y-4 border-t border-neutral-800 pt-6">
            <h2 className="text-xs uppercase tracking-widest text-neutral-500">Görseller</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-neutral-300">
                Profil resmi
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="mt-2 block w-full text-sm"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => uploadImage("avatar_url", e.target.files?.[0])}
                />
              </label>
              <label className="block text-sm text-neutral-300">
                Banner
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="mt-2 block w-full text-sm"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => uploadImage("banner_url", e.target.files?.[0])}
                />
              </label>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xs uppercase tracking-widest text-neutral-500">Renkler</h2>
            <Swatches label="Avatar rengi" value={form.avatar_color} onPick={(c) => update("avatar_color", c)} />
            <Swatches label="Banner rengi" value={form.banner_color} onPick={(c) => update("banner_color", c)} />
          </section>

          <section className="space-y-4">
            <h2 className="text-xs uppercase tracking-widest text-neutral-500">Bilgiler</h2>
            <label className="block text-sm text-neutral-300">
              Ad
              <input className={INPUT} value={form.display_name ?? ""} onChange={(e) => update("display_name", e.target.value)} />
            </label>
            <label className="block text-sm text-neutral-300">
              Kullanıcı adı
              <input className={INPUT} value={form.username ?? ""} onChange={(e) => update("username", e.target.value)} />
            </label>
            <label className="block text-sm text-neutral-300">
              Konum
              <input className={INPUT} value={form.location ?? ""} onChange={(e) => update("location", e.target.value)} />
            </label>
            <label className="block text-sm text-neutral-300">
              Biyografi
              <textarea
                rows={4}
                maxLength={280}
                className={INPUT}
                value={form.bio ?? ""}
                onChange={(e) => update("bio", e.target.value)}
              />
            </label>
          </section>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="border border-white bg-white px-5 py-2 text-black disabled:opacity-50"
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <p role="status" className="text-sm text-neutral-400">{status}</p>
          </div>
        </form>
      </div>
    </main>
  );
}

function Swatches({ label, value, onPick }: { label: string; value: string | null; onPick: (color: string) => void }) {
  return (
    <div>
      <p className="text-sm text-neutral-300">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`${label}: ${c}`}
            onClick={() => onPick(c)}
            className={`h-8 w-8 border border-neutral-700 ${value === c ? "outline outline-2 outline-offset-2 outline-white" : ""}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
}
