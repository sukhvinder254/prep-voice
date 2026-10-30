
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const companies = [
  "Google",
  "Microsoft",
  "Amazon",
  "Meta",
  "Apple",
  "Adobe",
  "Netflix",
  "NVIDIA",
  "Flipkart",
  "Walmart",
  "Uber",
  "Atlassian",
  "Salesforce",
  "Sprinklr",
  "Oracle",
  "Other",
];

export default function CompanyInterviewPage() {
  const router = useRouter();
  const [selectedCompany, setSelectedCompany] = useState("");
  const [customCompany, setCustomCompany] = useState("");

  const companyName =
    selectedCompany === "Other" ? customCompany.trim() : selectedCompany;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#faf8ff] via-[#f5f0ff] to-[#eee7ff] px-5 py-12 text-gray-800">
      <div className="mx-auto max-w-5xl">

        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white/80 px-4 py-2 text-sm font-semibold text-purple-700 shadow-sm">
            <span>✦</span> PREPVOICE AI
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Company-Specific Interview
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-500 sm:text-base">
            Prepare smarter for your dream company with personalised
            AI-powered interview practice.
          </p>
        </div>

        <div className="rounded-3xl border border-white bg-white/80 p-5 shadow-[0_12px_45px_rgba(100,70,160,0.09)] backdrop-blur-sm sm:p-9">

          <div className="mb-7">
            <h2 className="text-xl font-bold text-gray-900">
              Choose your target company
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Select one company to customise your interview experience.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {companies.map((company) => {
              const isSelected = selectedCompany === company;

              return (
                <button
                  key={company}
                  type="button"
                  onClick={() => setSelectedCompany(company)}
                  className={`group relative min-h-[100px] rounded-2xl border p-4 text-left transition-all duration-200 ${
                    isSelected
                      ? "border-purple-500 bg-purple-50 shadow-md shadow-purple-100"
                      : "border-purple-100 bg-white hover:-translate-y-1 hover:border-purple-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-base font-bold ${
                      isSelected ? "text-purple-700" : "text-gray-800"
                    }`}>
                      {company}
                    </span>

                    {isSelected && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-xs text-white">
                        ✓
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-xs text-gray-400">
                    {company === "Other"
                      ? "Add your company"
                      : "Select company"}
                  </p>
                </button>
              );
            })}
          </div>

          {selectedCompany === "Other" && (
            <div className="mt-6">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Company name
              </label>
              <input
                value={customCompany}
                onChange={(e) => setCustomCompany(e.target.value)}
                placeholder="Enter company name..."
                className="w-full rounded-xl border border-purple-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
              />
            </div>
          )}

          <div className="mt-9 border-t border-purple-100 pt-6">
            <button
              type="button"
              disabled={!companyName}
              onClick={() => {
                sessionStorage.setItem(
                  "prepvoice_company",
                  companyName
                );
                router.push("/company-interview/role");
              }}
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-4 font-semibold text-white shadow-lg shadow-purple-200 transition hover:-translate-y-0.5 hover:from-purple-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            >
              Continue to Role Selection →
            </button>

            <p className="mt-3 text-center text-xs text-gray-400">
              Your interview journey starts here.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
