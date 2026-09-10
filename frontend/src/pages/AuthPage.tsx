// Handles local signup, login, and Firebase sign-in.
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

function getGoogleAuthError(error: unknown) {
  const code = error && typeof error === "object" && "code" in error && typeof error.code === "string"
    ? error.code
    : undefined;

  switch (code) {
    case "auth/network-request-failed":
      return "Firebase could not reach Google. Check your internet connection, disable blocking extensions/VPN, and try again.";
    case "auth/unauthorized-domain":
      return "This site is not authorized in Firebase. Add localhost (or your deployed domain) under Firebase Console > Authentication > Settings > Authorized domains.";
    case "auth/operation-not-allowed":
      return "Google sign-in is disabled. Enable Google under Firebase Console > Authentication > Sign-in method.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in popup. Allow popups for this site and try again.";
    case "auth/popup-closed-by-user":
      return "The Google sign-in window was closed before login completed.";
    default:
      return error instanceof Error ? error.message : "Google auth failed";
  }
}

// Handles local signup, login, and Firebase sign-in.
export function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Exchanges a Firebase token for an app session token.
  async function exchangeFirebaseToken(idToken: string) {
    const data = await apiFetch<AuthResponse>("/auth/firebase", {
      method: "POST",
      body: JSON.stringify({ idToken })
    });

    localStorage.setItem("tp_token", data.token);
    onAuthenticated(data.token);
  }

  // Submits the local auth form.
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

      const data = await apiFetch<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ idToken })
      });

      localStorage.setItem("tp_token", data.token);
      onAuthenticated(data.token);
    } catch (err: any) {
      setError(err?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  // Handles Google popup authentication.
  async function handleGooglePopup() {
    setError("");
    setLoading(true);

    try {
      if (!firebaseAuth || !googleProvider) {
        throw new Error("Firebase is not configured for Google sign-in");
      }

      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await result.user.getIdToken();

      await exchangeFirebaseToken(idToken);
    } catch (err) {
      setError(getGoogleAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-bg flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <div className="rounded-3xl border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-1 text-center">
            <span className="inline-block rounded-full bg-brand-500/20 px-3 py-1 text-xs font-medium text-brand-200">
              ✈️ Travel Planner
            </span>
          </div>

          <h1 className="mt-4 text-center text-2xl font-bold text-white">
            {mode === "register" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-center text-sm text-white/60">
            {mode === "register" ? "Start planning amazing trips" : "Sign in to continue"}
          </p>

          <div className="mt-5 grid grid-cols-2 rounded-xl border border-white/15 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                mode === "login" ? "bg-brand-500 text-white shadow-md" : "text-white/60 hover:text-white"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                mode === "register" ? "bg-brand-500 text-white shadow-md" : "text-white/60 hover:text-white"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={submit} className="mt-5 space-y-3">
            {mode === "register" && (
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Full name"
                className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
              />
            )}
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
            />
            <input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
            />

            {mode === "register" && (
              <input
                required
                type="password"
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter password"
                className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
              />
            )}

            {error && <p className="text-sm text-coral-400">{error}</p>}

            <button
              disabled={loading}
              type="submit"
              className="w-full rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-brand-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Please wait..." : mode === "register" ? "Create account" : "Sign in"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-2 text-xs text-white/40">
            <span className="h-px flex-1 bg-white/15" />
            OR CONTINUE WITH
            <span className="h-px flex-1 bg-white/15" />
          </div>

          <button
            type="button"
            onClick={() => void handleGooglePopup()}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-all hover:border-white/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
