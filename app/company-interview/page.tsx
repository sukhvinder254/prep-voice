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
    <div className="min-h-screen bg-slate-50/70 px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-100">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
              Company Calibration
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">Step 1 of 4</span>
          </div>

          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Target Company Simulation
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Select your target organization to calibrate interview rubrics, leadership principles, and technical expectations.
          </p>
        </div>

        <div className="pro-card p-6 sm:p-8">
          <div className="mb-6 pb-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Select Target Enterprise or Startup
            </h2>
            <span className="text-xs text-slate-400">16 Calibrated Profiles</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {companies.map((company) => {
              const isSelected = selectedCompany === company;

              return (
                <button
                  key={company}
                  type="button"
                  onClick={() => setSelectedCompany(company)}
                  className={`group relative min-h-[90px] rounded-xl border p-4 text-left transition-all duration-150 ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/80 shadow-xs ring-1 ring-indigo-600"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-bold ${
                        isSelected ? "text-indigo-900" : "text-slate-800"
                      }`}
                    >
                      {company}
                    </span>

                    {isSelected && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">
                        ✓
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-[11px] text-slate-400">
                    {company === "Other" ? "Custom Org" : "Standard Track"}
                  </p>
                </button>
              );
            })}
          </div>

          {selectedCompany === "Other" && (
            <div className="mt-6">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Custom Organization Name
              </label>
              <input
                value={customCompany}
                onChange={(e) => setCustomCompany(e.target.value)}
                placeholder="e.g. Stripe, OpenAI, Datadog..."
                className="pro-input"
              />
            </div>
          )}

          <div className="mt-8 border-t border-slate-100 pt-6">
            <button
              type="button"
              disabled={!companyName}
              onClick={() => {
                sessionStorage.setItem("prepvoice_company", companyName);
                router.push("/company-interview/role");
              }}
              className="pro-btn-primary w-full text-xs font-bold"
            >
              Continue to Role Specification →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
