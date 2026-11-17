import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Camera, UserCircle } from "lucide-react";
import { apiFetch } from "../api/client";

type Profile = {
  name: string;
  email: string;
  avatarUrl?: string;
};

type ProfileStats = {
  planned: number;
  upcoming: number;
  completed: number;
};

export function ProfilePage({ token }: { token: string }) {
  const [profile, setProfile] = useState<Profile>({ name: "", email: "" });
  const [stats, setStats] = useState<ProfileStats>({ planned: 0, upcoming: 0, completed: 0 });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void apiFetch<{ profile: Profile; stats: ProfileStats }>("/profile", {}, token)
      .then((data) => {
        if (!active) return;
        setProfile(data.profile);
        setStats(data.stats);
        setName(data.profile.name);
        setAvatarUrl(data.profile.avatarUrl || "");
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load profile");
      });

    return () => {
      active = false;
    };
  }, [token]);

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 3000000) {
      setError("Profile pictures must be smaller than 3 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(typeof reader.result === "string" ? reader.result : "");
      setError("");
    };
    reader.onerror = () => setError("Unable to read that image.");
    reader.readAsDataURL(file);
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const data = await apiFetch<{ profile: Profile }>("/profile", {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim(), avatarUrl })
      }, token);
      setProfile(data.profile);
      setMessage("Profile updated.");
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update profile");
    } finally {
      setSaving(false);
    }
  }

  const initial = (profile.name || profile.email || "?")[0].toUpperCase();

  return (
    <main className="relative z-10 mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <section className="glass-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-400">Your account</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-800">Profile</h2>
        <p className="mt-1 text-sm text-slate-500">Manage your profile and see your travel history.</p>

        <form onSubmit={saveProfile} className="mt-6 space-y-5">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img src={avatarUrl} alt={profile.name || "Profile"} className="h-20 w-20 rounded-full object-cover ring-4 ring-brand-100" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-600 ring-4 ring-brand-50">{initial}</div>
            )}
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-brand-200 px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50">
              <Camera size={16} /> Upload profile picture
              <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            </label>
            {avatarUrl && <button type="button" onClick={() => setAvatarUrl("")} className="text-sm text-coral-600 hover:underline">Remove</button>}
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={80} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input value={profile.email} readOnly className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500" />
          </label>

          {error && <p className="text-sm text-coral-600">{error}</p>}
          {message && <p className="text-sm text-emerald-600">{message}</p>}
          <button type="submit" disabled={saving} className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50">{saving ? "Saving..." : "Save profile"}</button>
        </form>
      </section>

      <section className="glass-card p-6">
        <div className="flex items-center gap-2 text-slate-800"><UserCircle size={20} className="text-brand-500" /><h3 className="font-semibold">Trip stats</h3></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <StatCard label="Planned" value={stats.planned} />
          <StatCard label="Upcoming" value={stats.upcoming} />
          <StatCard label="Completed" value={stats.completed} />
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4"><div className="text-2xl font-bold text-brand-600">{value}</div><div className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div></div>;
}
