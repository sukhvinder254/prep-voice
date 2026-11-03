
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: "⌂" },
  { name: "Interview", href: "/interview", icon: "🎙" },
  {
    name: "Company Interview",
    href: "/company-interview",
    icon: "🏢",
  },
  {
    name: "Skill Gap Analyzer",
    href: "/skill-gap",
    icon: "🎯",
  },
  {
    name: "Skill Gap History",
    href: "/skill-gap/history",
    icon: "📊",
  },
  {
    name: "Preparation Planner",
    href: "/preparation",
    icon: "🗓️",
  },
  {
    name: "Preparation History",
    href: "/preparation/history",
    icon: "📅",
  },
  { name: "Analytics", href: "/analytics", icon: "▥" },
  { name: "History", href: "/history", icon: "◷" },
  { name: "Question Bank", href: "/questions", icon: "📚" },
];

export default function Navigation() {
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  return (
    <aside className="w-full shrink-0 border-b border-purple-100 bg-white md:min-h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="p-6">
        <Link href="/dashboard">
          <h1 className="text-2xl font-bold text-purple-700">
            PrepVoice
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            Your AI Interview Partner
          </p>
        </Link>

        <div className="mt-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Workspace
          </p>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-purple-100 text-purple-700"
                      : "text-gray-600 hover:bg-purple-50 hover:text-purple-700"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-10 rounded-2xl bg-purple-50 p-5">
          <h3 className="font-bold text-purple-800">
            Keep improving!
          </h3>
          <p className="mt-2 text-xs leading-5 text-purple-600">
            Practice regularly and build confidence for your next interview.
          </p>
        </div>
      </div>
    </aside>
  );
}
