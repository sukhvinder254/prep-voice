"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const levels = [
  {
    name: "Beginner",
    subtitle: "Fresher / Entry-Level (0-1 yrs)",
    description: "Evaluates fundamental algorithms, CS theory, standard paradigms, and clean syntax.",
    topics: ["Core fundamentals", "Algorithmic thinking", "Standard problem solving"],
  },
  {
    name: "Intermediate",
    subtitle: "Mid-Level Professional (1-3 yrs)",
    description: "Evaluates practical software engineering, edge-case resilience, component design, and API trade-offs.",
    topics: ["Production patterns", "Performance tuning", "Scenario architecture"],
  },
  {
    name: "Advanced",
    subtitle: "Senior & Staff Engineer (4+ yrs)",
    description: "High-level distributed systems design, cross-functional leadership, architectural trade-offs, and scaling.",
    topics: ["System scalability", "Distributed consensus", "Failure mode analysis"],
  },
];

export default function ExperienceLevelPage() {
  const router = useRouter();
  const [selectedLevel, setSelectedLevel] = useState("");

  const company =
    typeof window !== "undefined"
      ? sessionStorage.getItem("prepvoice_company")
      : null;

  const role =
    typeof window !== "undefined"
      ? sessionStorage.getItem("prepvoice_role")
      : null;

  return (
    <div className="min-h-screen bg-slate-50/70 px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-100">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
              Seniority Calibration
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">Step 3 of 4</span>
          </div>

          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Choose Experience Level
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-md bg-white border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-800">
              {company || "Company"}
            </span>
            <span className="text-xs text-slate-400">/</span>
            <span className="rounded-md bg-white border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-800">
              {role || "Role"}
            </span>
          </div>
        </div>

        <div className="pro-card p-6 sm:p-8">
          <div className="mb-6 pb-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Select Seniority Band
            </h2>
            <p className="text-xs text-slate-400">Calibrates AI question complexity</p>
          </div>

          <div className="space-y-3.5">
            {levels.map((level) => {
              const isSelected = selectedLevel === level.name;

              return (
                <button
                  key={level.name}
                  type="button"
                  onClick={() => setSelectedLevel(level.name)}
                  className={`w-full rounded-xl border p-5 text-left transition-all duration-150 ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/80 shadow-xs ring-1 ring-indigo-600"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          {level.name}
                        </h3>
                        <span className="text-xs font-semibold text-slate-500">
                          ({level.subtitle})
                        </span>
                        {isSelected && (
                          <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-bold text-white ml-auto">
                            Selected ✓
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-slate-600 leading-normal">
                        {level.description}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {level.topics.map((topic) => (
                          <span
                            key={topic}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <button
              type="button"
              disabled={!selectedLevel || !company || !role}
              onClick={() => {
                sessionStorage.setItem("prepvoice_level", selectedLevel);
                router.push("/company-interview/setup");
              }}
              className="pro-btn-primary w-full text-xs font-bold"
            >
              Continue to Interview Configuration →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
