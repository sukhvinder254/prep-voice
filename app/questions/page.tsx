"use client";

import { useState } from "react";
import Link from "next/link";

const questionCategories = [
  {
    name: "Technical",
    short: "Tech",
    description: "Data structures, algorithms, system design, databases, and OOP paradigms",
    questions: [
      "What is the difference between let, const and var in JavaScript?",
      "Explain the concept of Object-Oriented Programming and polymorphism.",
      "What is the architectural difference between SQL and NoSQL databases?",
      "What is a RESTful API and how does it compare to GraphQL?",
      "Explain the time complexity and memory characteristics of binary search.",
      "What is the fundamental difference between stack and queue data structures?",
    ],
  },
  {
    name: "HR / Culture",
    short: "HR",
    description: "Core behavioral inquiries, self-awareness, motivations, and culture add",
    questions: [
      "Tell me about yourself and your professional journey so far.",
      "What are your greatest core technical strengths and how do you leverage them?",
      "What is one technical weakness you are actively developing?",
      "Why should our engineering team hire you for this position?",
      "Where do you envision your career trajectory over the next three to five years?",
      "Why are you interested in joining our company and working on our mission?",
    ],
  },
  {
    name: "Behavioral & STAR",
    short: "Behavioral",
    description: "Conflict resolution, leadership under pressure, cross-functional teamwork",
    questions: [
      "Tell me about a high-stakes technical challenge you faced and how you resolved it.",
      "Describe a project where you collaborated with difficult stakeholders.",
      "How do you handle technical disagreements or architectural debates with teammates?",
      "Describe a time you demonstrated leadership without formal authority.",
      "How do you prioritize competing deadlines under tight production schedules?",
      "Describe a critical mistake or bug you introduced and the retrospective lessons learned.",
    ],
  },
  {
    name: "System & Architecture",
    short: "Architecture",
    description: "High-scale engineering, distributed latency, caching, and resiliency",
    questions: [
      "How would you design a scalable web application handling 100k requests per second?",
      "Explain the React component lifecycle and modern concurrent rendering.",
      "What exact network and rendering steps occur when you enter a URL in a browser?",
      "How would you diagnose and resolve a severe latency bottleneck in a distributed API?",
      "What architectural considerations dictate choosing between microservices and monolith?",
      "How do you ensure end-to-end security, OAuth verification, and data encryption in web apps?",
    ],
  },
];

export default function QuestionsPage() {
  const [selectedCategory, setSelectedCategory] = useState("Technical");
  const [search, setSearch] = useState("");

  const category = questionCategories.find(
    (item) => item.name === selectedCategory
  );

  const filteredQuestions = (category?.questions ?? []).filter((question) =>
    question.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/70 px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-100">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
              Curated Curriculum
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">24 Industry Standards</span>
          </div>

          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Interview Question Repository
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Browse verified interview prompts across technical, behavioral, and architectural domains.
          </p>
        </div>

        {/* Category Cards */}
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {questionCategories.map((item) => {
            const isSelected = selectedCategory === item.name;

            return (
              <button
                key={item.name}
                onClick={() => {
                  setSelectedCategory(item.name);
                  setSearch("");
                }}
                className={`pro-card p-4.5 text-left transition-all duration-150 ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-600"
                    : "hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-white border border-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                    {item.short}
                  </span>
                  <span className="text-xs font-bold text-indigo-600">
                    {item.questions.length} Qs
                  </span>
                </div>

                <h2 className="mt-2.5 text-sm font-bold text-slate-900">
                  {item.name}
                </h2>
                <p className="mt-1 text-xs text-slate-500 leading-normal line-clamp-2">
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Active Category Questions */}
        <section className="mt-8 pro-card p-6 sm:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {selectedCategory} Question Track
              </h2>
              <p className="text-xs text-slate-500">
                Practice each prompt aloud or load directly into the voice simulator.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search prompt keywords..."
                className="pro-input text-xs"
              />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {filteredQuestions.length > 0 ? (
              filteredQuestions.map((question, index) => (
                <div
                  key={question}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-xs font-bold text-indigo-700">
                      {index + 1}
                    </span>
                    <p className="text-xs font-semibold text-slate-800 leading-relaxed pt-1">
                      {question}
                    </p>
                  </div>

                  <Link
                    href="/interview"
                    className="self-end sm:self-auto shrink-0 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition"
                  >
                    Practice Aloud →
                  </Link>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-xs text-slate-500">
                No questions matching &quot;{search}&quot;. Try adjusting your search term.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
