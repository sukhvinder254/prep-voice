
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const roles = [
  {
    name: "Software Development Engineer",
    short: "SDE",
    description: "DSA, problem solving and core CS concepts",
    icon: "💻",
  },
  {
    name: "Frontend Developer",
    short: "Frontend",
    description: "React, JavaScript, Next.js and UI development",
    icon: "🎨",
  },
  {
    name: "Backend Developer",
    short: "Backend",
    description: "APIs, databases, server-side development",
    icon: "⚙️",
  },
  {
    name: "Full Stack Developer",
    short: "Full Stack",
    description: "Frontend, backend and database integration",
    icon: "🌐",
  },
  {
    name: "Data Analyst",
    short: "Data Analyst",
    description: "SQL, Python, analytics and data interpretation",
    icon: "📊",
  },
  {
    name: "Product Analyst",
    short: "Product Analyst",
    description: "Product metrics, business and analytical thinking",
    icon: "📈",
  },
  {
    name: "AI / ML Engineer",
    short: "AI / ML",
    description: "Python, machine learning and AI fundamentals",
    icon: "🤖",
  },
  {
    name: "DevOps Engineer",
    short: "DevOps",
    description: "Cloud, CI/CD and infrastructure fundamentals",
    icon: "☁️",
  },
  {
    name: "Other",
    short: "Other",
    description: "Enter your preferred job role",
    icon: "✦",
  },
];

export default function RoleSelectionPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState("");
  const [customRole, setCustomRole] = useState("");

  const roleName =
    selectedRole === "Other" ? customRole.trim() : selectedRole;

  const company =
    typeof window !== "undefined"
      ? sessionStorage.getItem("prepvoice_company")
      : null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#faf8ff] via-[#f5f0ff] to-[#eee7ff] px-5 py-12 text-gray-800">
      <div className="mx-auto max-w-5xl">

        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white/80 px-4 py-2 text-sm font-semibold text-purple-700 shadow-sm">
            ✦ PREPVOICE AI
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Select Your Interview Role
          </h1>

          <p className="mt-3 text-sm text-gray-500 sm:text-base">
            Choose the role you want to prepare for at{" "}
            <span className="font-semibold text-purple-700">
              {company || "your target company"}
            </span>
            .
          </p>
        </div>

        <div className="rounded-3xl border border-white bg-white/80 p-5 shadow-[0_12px_45px_rgba(100,70,160,0.09)] backdrop-blur-sm sm:p-9">

          <div className="mb-7">
            <h2 className="text-xl font-bold text-gray-900">
              Which role are you targeting?
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Select the role that matches your career goal.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {roles.map((role) => {
              const isSelected = selectedRole === role.name;

              return (
                <button
                  key={role.name}
                  type="button"
                  onClick={() => setSelectedRole(role.name)}
                  className={`rounded-2xl border p-5 text-left transition-all duration-200 ${
                    isSelected
                      ? "border-purple-500 bg-purple-50 shadow-md shadow-purple-100"
                      : "border-purple-100 bg-white hover:-translate-y-1 hover:border-purple-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{role.icon}</span>
                    {isSelected && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-xs text-white">
                        ✓
                      </span>
                    )}
                  </div>

                  <h3 className="mt-4 font-bold text-gray-900">
                    {role.name}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    {role.description}
                  </p>
                </button>
              );
            })}
          </div>

          {selectedRole === "Other" && (
            <div className="mt-6">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Enter your preferred role
              </label>
              <input
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="e.g. Cloud Engineer"
                className="w-full rounded-xl border border-purple-200 bg-white px-4 py-3 text-sm outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
              />
            </div>
          )}

          <div className="mt-9 border-t border-purple-100 pt-6">
            <button
              type="button"
              disabled={!roleName || !company}
              onClick={() => {
                sessionStorage.setItem("prepvoice_role", roleName);
                router.push("/company-interview/level");
              }}
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-4 font-semibold text-white shadow-lg shadow-purple-200 transition hover:-translate-y-0.5 hover:from-purple-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue to Experience Level →
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
