
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: "⌂" },
  { name: "Interview", href: "/interview", icon: "🎙" },
  { name: "Analytics", href: "/analytics", icon: "▥" },
  { name: "History", href: "/history", icon: "◷" },
  { name: "Question Bank", href: "/questions", icon: "📚" },
];

export default function Navigation() {
  const pathname = usePathname();

  const authPages = [
    "/login",
    "/signup",
    "/sign-up",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];

  if (authPages.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return null;
  }

  return (
    <aside className="w-full shrink-0 border-b border-purple-100 bg-white p-4 md:min-h-screen md:w-64 md:border-b-0 md:border-r md:p-6">
      <Link href="/dashboard" className="block">
        <h2 className="text-2xl font-extrabold text-purple-700">
          PrepVoice<span className="text-violet-400">.</span>
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          Your AI Interview Coach
        </p>
      </Link>

      <p className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wider text-gray-400">
        Workspace
      </p>

      <nav className="flex flex-wrap gap-2 md:flex-col">
        {navItems.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition ${
                active
                  ? "bg-purple-100 text-purple-800"
                  : "text-gray-600 hover:bg-purple-50 hover:text-purple-700"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 hidden rounded-2xl bg-gradient-to-br from-purple-600 to-violet-500 p-4 text-white md:block">
        <p className="font-semibold">Keep improving!</p>
        <p className="mt-2 text-sm text-purple-100">
          Every practice session brings you closer to interview confidence.
        </p>
      </div>
    </aside>
  );
}
