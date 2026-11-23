"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const roles = [
  {
    name: "Software Development Engineer",
    short: "SDE",
    description: "Data structures, algorithms, system architecture, and problem solving",
  },
  {
    name: "Frontend Developer",
    short: "Frontend",
    description: "React, TypeScript, Next.js, performance optimization, and web standards",
  },
  {
    name: "Backend Developer",
    short: "Backend",
    description: "Distributed systems, microservices, databases, and API engineering",
  },
  {
    name: "Full Stack Developer",
    short: "Full Stack",
    description: "End-to-end web architectures, full stack integration, and cloud services",
  },
  {
    name: "Data Analyst / Scientist",
    short: "Data",
    description: "SQL, Python, statistical modeling, analytical decision making, and metrics",
  },
  {
    name: "Product Analyst / PM",
    short: "Product",
    description: "Product execution, user funnel metrics, business cases, and trade-offs",
  },
  {
    name: "AI / Machine Learning Engineer",
    short: "AI / ML",
    description: "Deep learning, LLMs, PyTorch, model serving, and feature pipelines",
  },
  {
    name: "DevOps & Cloud Engineer",
    short: "DevOps",
    description: "Kubernetes, Docker, CI/CD automation, AWS/GCP, and site reliability",
  },
  {
    name: "Other",
    short: "Custom",
    description: "Specify a custom role for personalized interview generation",
  },
];

export default function RoleSelectionPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState("");
  const [customRole, setCustomRole] = useState("");

  const roleName = selectedRole === "Other" ? customRole.trim() : selectedRole;

  const company =
    typeof window !== "undefined"
      ? sessionStorage.getItem("prepvoice_company")
      : null;

  return (
    <div className="min-h-screen bg-slate-50/70 px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-100">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
              Role Calibration
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">Step 2 of 4</span>
          </div>

          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Select Your Target Role
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Targeting{" "}
            <span className="font-bold text-indigo-700">
              {company || "Selected Organization"}
            </span>
            . Choose your specialization track to calibrate question depth.
          </p>
        </div>

        <div className="pro-card p-6 sm:p-8">
          <div className="mb-6 pb-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Select Position Track
            </h2>
            <span className="text-xs text-slate-400">9 Core Tracks</span>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            {roles.map((role) => {
              const isSelected = selectedRole === role.name;

              return (
                <button
                  key={role.name}
                  type="button"
                  onClick={() => setSelectedRole(role.name)}
                  className={`rounded-xl border p-4.5 text-left transition-all duration-150 ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/80 shadow-xs ring-1 ring-indigo-600"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                      {role.short}
                    </span>
                    {isSelected && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">
                        ✓
                      </span>
                    )}
                  </div>

                  <h3 className="mt-2.5 text-sm font-bold text-slate-900">
                    {role.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 leading-normal">
                    {role.description}
                  </p>
                </button>
              );
            })}
          </div>

          {selectedRole === "Other" && (
            <div className="mt-6">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Custom Role Designation
              </label>
              <input
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="e.g. Security Engineer, Solutions Architect..."
                className="pro-input"
              />
            </div>
          )}

          <div className="mt-8 border-t border-slate-100 pt-6">
            <button
              type="button"
              disabled={!roleName || !company}
              onClick={() => {
                sessionStorage.setItem("prepvoice_role", roleName);
                router.push("/company-interview/level");
              }}
              className="pro-btn-primary w-full text-xs font-bold"
            >
              Continue to Seniority Level →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
