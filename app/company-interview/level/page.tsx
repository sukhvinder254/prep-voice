
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const levels = [
  {
    name: "Beginner",
    subtitle: "Fresher / Student",
    description: "Build your fundamentals and prepare for entry-level interviews.",
    icon: "🌱",
    topics: ["Basic concepts", "Fundamentals", "Easy questions"],
  },
  {
    name: "Intermediate",
    subtitle: "1–2 Years Experience",
    description: "Test your practical knowledge and strengthen problem-solving.",
    icon: "🚀",
    topics: ["Practical concepts", "Problem solving", "Scenario questions"],
  },
  {
    name: "Advanced",
    subtitle: "3+ Years Experience",
    description: "Prepare for challenging technical and real-world scenarios.",
    icon: "🏆",
    topics: ["Advanced concepts", "System design", "Complex scenarios"],
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
    <main className="min-h-screen bg-gradient-to-br from-[#faf8ff] via-[#f5f0ff] to-[#eee7ff] px-5 py-12 text-gray-800">
      <div className="mx-auto max-w-4xl">

        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white/80 px-4 py-2 text-sm font-semibold text-purple-700 shadow-sm">
            ✦ PREPVOICE AI
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Choose Your Experience Level
          </h1>

          <p className="mt-3 text-sm text-gray-500 sm:text-base">
            Personalise your interview difficulty based on your experience.
          </p>

          <div className="mt-5 inline-flex flex-wrap justify-center gap-2">
            <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-purple-700 shadow-sm">
              {company || "Company"}
            </span>
            <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-purple-700 shadow-sm">
              {role || "Role"}
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-white bg-white/80 p-5 shadow-[0_12px_45px_rgba(100,70,160,0.09)] backdrop-blur-sm sm:p-9">

          <h2 className="mb-2 text-xl font-bold text-gray-900">
            What&apos;s your experience level?
          </h2>
          <p className="mb-7 text-sm text-gray-500">
            Choose the level that best describes your current preparation.
          </p>

          <div className="space-y-4">
            {levels.map((level) => {
              const isSelected = selectedLevel === level.name;

              return (
                <button
                  key={level.name}
                  type="button"
                  onClick={() => setSelectedLevel(level.name)}
                  className={`w-full rounded-2xl border p-5 text-left transition-all duration-200 sm:p-6 ${
                    isSelected
                      ? "border-purple-500 bg-purple-50 shadow-md shadow-purple-100"
                      : "border-purple-100 bg-white hover:border-purple-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">{level.icon}</span>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-bold text-gray-900">
                          {level.name}
                        </h3>

                        {isSelected && (
                          <span className="rounded-full bg-purple-600 px-3 py-1 text-xs font-semibold text-white">
                            Selected ✓
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs font-medium text-purple-700">
                        {level.subtitle}
                      </p>

                      <p className="mt-3 text-sm leading-6 text-gray-500">
                        {level.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {level.topics.map((topic) => (
                          <span
                            key={topic}
                            className="rounded-full bg-purple-50 px-3 py-1 text-xs text-purple-700"
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

          <div className="mt-9 border-t border-purple-100 pt-6">
            <button
              type="button"
              disabled={!selectedLevel || !company || !role}
              onClick={() => {
                sessionStorage.setItem(
                  "prepvoice_level",
                  selectedLevel
                );
                router.push("/company-interview/setup");
              }}
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-4 font-semibold text-white shadow-lg shadow-purple-200 transition hover:-translate-y-0.5 hover:from-purple-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue to Interview Setup →
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
