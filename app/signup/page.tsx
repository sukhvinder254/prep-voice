
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
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
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
      {/* Soft lavender background */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-purple-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 top-1/4 h-40 w-40 rounded-full bg-pink-200/20 blur-3xl" />

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/80 bg-white/80 shadow-[0_24px_100px_rgba(90,65,150,0.12)] backdrop-blur-xl animate-fade-up lg:grid-cols-2">
        {/* Brand panel */}
        <section className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#f0eaff] via-[#f7f5ff] to-[#eaf1ff] p-8 sm:p-12 lg:min-h-[700px]">
          <div className="absolute -right-16 top-28 h-64 w-64 rounded-full border border-violet-200/60" />
          <div className="absolute -right-5 top-40 h-44 w-44 rounded-full border border-violet-200/50" />
          <div className="absolute bottom-20 left-1/2 h-44 w-44 rounded-full bg-white/50 blur-3xl" />

          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="brand-icon h-12 w-12 shadow-sm">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <path
                    d="M4 10v4M8 6v12M12 3v18M16 7v10M20 10v4"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="text-lg font-extrabold tracking-tight text-[#29213f]">
                PrepVoice<span className="text-[#8769e9]">.</span>
              </span>
            </Link>

            <div className="mt-12 sm:mt-16">
              <span className="eyebrow inline-flex rounded-full border border-violet-200/70 bg-white/65 px-3 py-1.5">
                YOUR NEXT CHAPTER
              </span>

              <h1 className="brand-wordmark brand-gradient mt-6">
                Your voice.
                <br />
                Your future.
              </h1>

              <p className="mt-5 max-w-sm text-base leading-7 text-[#6e6685] sm:text-lg">
                Build confidence one answer at a time. Create your account and
                begin a smarter interview preparation journey.
              </p>
            </div>
          </div>

          <div className="relative mt-10 rounded-2xl border border-white/80 bg-white/65 p-5 shadow-[0_10px_35px_rgba(104,79,160,0.06)] backdrop-blur-md">
            <div className="flex items-start gap-3">
              <span className="brand-icon h-10 w-10 shrink-0 rounded-xl">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div>
                <p className="font-bold text-[#302748]">
                  Made for your growth
                </p>
                <p className="mt-1 text-sm leading-6 text-[#777087]">
                  Practice questions, review AI feedback, and keep improving
                  with every attempt.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Signup form */}
        <section className="flex items-center justify-center bg-white/90 p-7 sm:p-12 lg:p-14">
          <div className="w-full max-w-sm">
            <div className="mb-7 lg:hidden">
              <Link href="/" className="inline-flex items-center gap-3">
                <span className="brand-icon h-10 w-10 rounded-xl">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 10v4M8 6v12M12 3v18M16 7v10M20 10v4"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span className="text-lg font-extrabold text-[#29213f]">
                  PrepVoice<span className="text-[#8769e9]">.</span>
                </span>
              </Link>
            </div>

            <div className="mb-7">
              <p className="eyebrow">GET STARTED FOR FREE</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#27213b] sm:text-[34px]">
                Create your
                <br />
                <span className="brand-gradient">account.</span>
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#7c778d]">
                A few details, then you&apos;re ready to practice.
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-[#39324f]"
                >
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="premium-input"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-[#39324f]"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="premium-input"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-[#39324f]"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={6}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="premium-input pr-20"
                    placeholder="At least 6 characters"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute inset-y-0 right-3 my-auto rounded-md px-2 text-xs font-bold text-[#7964c5] transition hover:bg-[#f4f0ff]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <p className="mt-2 text-xs text-[#9891a9]">
                  Use at least 6 characters.
                </p>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700"
                >
                  {error}
                </p>
              )}

              {message && (
                <p
                  role="status"
                  className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800"
                >
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Creating your account...
                  </>
                ) : (
                  <>
                    Create your account
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path
                        d="M5 12h14m-6-6 6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-[#777187]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-bold text-[#7659dc] transition hover:text-[#5738c2]"
              >
                Sign in
              </Link>
            </p>

            <p className="mt-6 text-center text-xs leading-5 text-[#aaa4b7]">
              Start small. Practice consistently. Grow confidently.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
