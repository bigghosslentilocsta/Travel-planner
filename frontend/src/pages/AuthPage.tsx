import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useState, type FormEvent } from "react";
import { apiFetch } from "../api/client";
import { firebaseAuth, googleProvider } from "../lib/firebase";

type AuthPageProps = {
  onAuthenticated: (token: string) => void;
};

type AuthResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function exchangeFirebaseToken(idToken: string) {
    const data = await apiFetch<AuthResponse>("/auth/firebase", {
      method: "POST",
      body: JSON.stringify({ idToken })
    });

    localStorage.setItem("tp_token", data.token);
    onAuthenticated(data.token);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }

        if (!firebaseAuth) {
          throw new Error("Firebase is not configured in the frontend environment");
        }

        await createUserWithEmailAndPassword(firebaseAuth, email, password);

        const data = await apiFetch<AuthResponse>("/auth/signup", {
          method: "POST",
          body: JSON.stringify({ name, email, password })
        });

        localStorage.setItem("tp_token", data.token);
        onAuthenticated(data.token);
        return;
      }

      if (!firebaseAuth) {
        throw new Error("Firebase is not configured in the frontend environment");
      }

      const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const idToken = await credential.user.getIdToken();
      await exchangeFirebaseToken(idToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGooglePopup() {
    setError("");
    setLoading(true);

    try {
      if (!firebaseAuth || !googleProvider) {
        throw new Error("Firebase Google sign-in is not configured in the frontend environment");
      }

      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await result.user.getIdToken();
      await exchangeFirebaseToken(idToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google auth failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900/50 p-6 shadow-glow">
        <p className="text-xs uppercase tracking-[0.25em] text-indigo-300">Welcome</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-100">{mode === "register" ? "Create your account" : "Sign in"}</h1>

        <div className="mt-4 grid grid-cols-2 rounded-lg border border-slate-700 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-md px-3 py-2 text-sm ${mode === "login" ? "bg-indigo-600 text-white" : "text-slate-300"}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`rounded-md px-3 py-2 text-sm ${mode === "register" ? "bg-indigo-600 text-white" : "text-slate-300"}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={submit} className="mt-4 space-y-3">
          {mode === "register" && (
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Full name"
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
            />
          )}
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
          />
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
          />

          {mode === "register" && (
            <input
              required
              type="password"
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter password"
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
            />
          )}

          {error && <p className="text-sm text-rose-300">{error}</p>}

          <button
            disabled={loading}
            type="submit"
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-800"
          >
            {loading ? "Please wait..." : mode === "register" ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-2 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-700" />
          OR CONTINUE WITH
          <span className="h-px flex-1 bg-slate-700" />
        </div>

        <button
          type="button"
          onClick={() => void handleGooglePopup()}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 hover:border-indigo-500 disabled:cursor-not-allowed"
        >
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-400" />
          Continue with Google
        </button>

      </div>
    </div>
  );
}
