"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const supabase = createClient();
      const cleanedEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email: cleanedEmail,
        password: password.trim(),
        options: {
          data: { full_name: name.trim() },
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.session) {
        router.push("/interview");
        router.refresh();
      } else {
        setMessage(
          "Account created! Please check your email to confirm your account, then sign in."
        );
      }
    } catch {
      setError("Unable to register account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6">
      {/* Subtle background ambient mesh */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-violet-500/5 blur-3xl" />

      <div className="relative z-10 grid w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/50 lg:grid-cols-2">
        {/* Left Side: Brand & Benefits */}
        <section className="relative hidden flex-col justify-between border-r border-slate-100 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-10 text-white lg:flex">
          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-500/30">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
              </div>
              <span className="font-heading text-lg font-bold tracking-tight text-white">
                PrepVoice
              </span>
            </Link>

            <div className="mt-12">
              <span className="inline-flex rounded-full bg-indigo-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-300 border border-indigo-400/20">
                Free Candidate Access
              </span>
              <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white leading-tight">
                Start mastering your interviews with AI coaching today.
              </h1>
              <p className="mt-3 text-xs leading-relaxed text-slate-300">
                Join thousands of software engineers, product managers, and leaders who practice aloud before their real interviews.
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xs">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-xs">✓</span>
                <span className="text-xs font-semibold text-white">Zero Installation Required</span>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-300 leading-normal">
                Direct speech-to-text directly in your browser. Practice whenever you want.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xs">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs">✓</span>
                <span className="text-xs font-semibold text-white">Intelligent Long-Term Memory</span>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-300 leading-normal">
                Tracks recurring patterns and knowledge gaps across every session you complete.
              </p>
            </div>
          </div>
        </section>

        {/* Right Side: Sign Up Form */}
        <section className="flex flex-col justify-center p-8 sm:p-12">
          <div className="w-full max-w-sm mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Create candidate account
              </h2>
              <p className="mt-1.5 text-xs text-slate-500">
                Enter your details to initialize your personalized practice profile.
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pro-input"
                  placeholder="Alex Rivera"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pro-input"
                  placeholder="name@example.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pro-input pr-16"
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-2 my-auto px-2 text-xs font-medium text-slate-500 hover:text-slate-800"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
                >
                  {error}
                </div>
              )}

              {message && (
                <div
                  role="status"
                  className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="pro-btn-primary w-full text-xs font-bold"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Creating Profile...
                  </>
                ) : (
                  "Create Account & Get Started"
                )}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-5 text-center">
              <p className="text-xs text-slate-500">
                Already registered?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
