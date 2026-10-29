
"use client";

import { useState } from "react";

const questionCategories = [
  {
    name: "Technical",
    icon: "💻",
    description: "Programming, DSA, DBMS, OOP and more",
    color: "bg-purple-100",
    questions: [
      "What is the difference between let, const and var in JavaScript?",
      "Explain the concept of Object-Oriented Programming.",
      "What is the difference between SQL and NoSQL?",
      "What is a REST API?",
      "Explain the time complexity of binary search.",
      "What is the difference between stack and queue?",
    ],
  },
  {
    name: "HR",
    icon: "🤝",
    description: "Common HR and personal interview questions",
    color: "bg-pink-100",
    questions: [
      "Tell me about yourself.",
      "What are your greatest strengths?",
      "What is one weakness you are working on?",
      "Why should we hire you?",
      "Where do you see yourself in five years?",
      "Why do you want to join our company?",
    ],
  },
  {
    name: "Behavioural",
    icon: "🎯",
    description: "Teamwork, leadership and problem-solving",
    color: "bg-blue-100",
    questions: [
      "Tell me about a time you faced a difficult challenge.",
      "Describe a situation where you worked in a team.",
      "How do you handle disagreements with teammates?",
      "Tell me about a time you demonstrated leadership.",
      "How do you manage deadlines and pressure?",
      "Describe a mistake you made and what you learned.",
    ],
  },
  {
    name: "Role-Based",
    icon: "🚀",
    description: "Questions for specific technical roles",
    color: "bg-amber-100",
    questions: [
      "How would you design a scalable web application?",
      "Explain the React component lifecycle.",
      "What happens when you enter a URL in a browser?",
      "How would you debug a slow API?",
      "What is the difference between frontend and backend?",
      "How do you secure a web application?",
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
    <main className="min-h-screen bg-[#f8f7ff] p-5 md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="font-semibold text-purple-700">
            PREPVOICE WORKSPACE
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-gray-900 md:text-4xl">
            Interview Question Bank
          </h1>
          <p className="mt-2 text-gray-600">
            Explore questions, prepare smarter and build interview confidence.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {questionCategories.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                setSelectedCategory(item.name);
                setSearch("");
              }}
              className={`rounded-2xl border p-5 text-left transition hover:-translate-y-1 hover:shadow-md ${
                selectedCategory === item.name
                  ? "border-purple-500 bg-white shadow-md ring-2 ring-purple-200"
                  : "border-purple-100 bg-white"
              }`}
            >
              <div
                className={`${item.color} flex h-12 w-12 items-center justify-center rounded-xl text-2xl`}
              >
                {item.icon}
              </div>
              <h2 className="mt-4 font-bold text-gray-900">
                {item.name}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {item.description}
              </p>
              <p className="mt-3 text-sm font-semibold text-purple-700">
                {item.questions.length} Questions →
              </p>
            </button>
          ))}
        </div>

        <section className="mt-8 rounded-2xl border border-purple-100 bg-white p-5 shadow-sm md:p-7">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {category?.icon} {selectedCategory} Questions
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Select a question to prepare your answer.
              </p>
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="w-full rounded-xl border border-purple-200 px-4 py-3 text-gray-800 outline-none focus:border-purple-500 md:max-w-xs"
            />
          </div>

          <div className="mt-6 space-y-3">
            {filteredQuestions.length > 0 ? (
              filteredQuestions.map((question, index) => (
                <div
                  key={question}
                  className="flex items-start gap-3 rounded-xl bg-purple-50 p-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-200 text-sm font-bold text-purple-900">
                    {index + 1}
                  </span>
                  <p className="pt-1 font-medium text-gray-800">
                    {question}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-xl bg-purple-50 p-6 text-center text-gray-600">
                No questions found. Try another search.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
