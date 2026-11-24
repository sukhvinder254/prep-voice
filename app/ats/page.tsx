
"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

import ResumeEditor, {
  type TailoredResume,
} from "./ResumeEditor";

import ResumeVersionHistory from "./ResumeVersionHistory";
import CoverLetterStudio from "./CoverLetterStudio";

type Tab = "analysis" | "resume" | "cover-letter";

type Analysis = {
  overallScore: number;
  scoreLabel: string;
  summary: string;
  breakdown: {
    keywordMatch: number;
    skillsMatch: number;
    experienceRelevance: number;
    formatting: number;
  };
  matchedKeywords: {
    keyword: string;
    evidence: string;
  }[];
  missingKeywords: {
    keyword: string;
    importance: string;
    reason: string;
  }[];
  atsChecks: {
    name: string;
    status: string;
    feedback: string;
  }[];
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  tailoredResume: TailoredResume;
  integrityNotes: string[];
};

const scoreItems = [
  { key: "keywordMatch", label: "Keyword Match" },
  { key: "skillsMatch", label: "Skills Match" },
  { key: "experienceRelevance", label: "Experience Relevance" },
  { key: "formatting", label: "Formatting" },
] as const;

const workspaceTabs = [
  {
    id: "analysis" as const,
    label: "ATS Analysis",
    description: "Score & insights",
    icon: "◎",
  },
  {
    id: "resume" as const,
    label: "Resume Builder",
    description: "Edit & download",
    icon: "▤",
  },
  {
    id: "cover-letter" as const,
    label: "Cover Letter",
    description: "Create application letter",
    icon: "✉",
  },
];

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

export default function ATSPage() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [editedResume, setEditedResume] =
    useState<TailoredResume | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>("analysis");

  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentResume =
    editedResume ?? analysis?.tailoredResume ?? null;

  // -----------------------------------------
  // FILE UPLOAD
  // -----------------------------------------

  const selectFile = (selectedFile?: File) => {
    if (!selectedFile) return;

    if (
      selectedFile.type !== "application/pdf" &&
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please upload a PDF file only.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size must be smaller than 5 MB.");
      return;
    }

    setFile(selectedFile);
    setError("");
    setAnalysis(null);
    setEditedResume(null);
    setActiveTab("analysis");
  };

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    selectFile(event.target.files?.[0]);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  };

  // -----------------------------------------
  // ATS ANALYSIS
  // -----------------------------------------

  const analyzeResume = async () => {
    if (!file) {
      setError("Please upload your resume PDF first.");
      return;
    }

    if (jobDescription.trim().length < 30) {
      setError(
        "Please enter a complete job description (at least 30 characters)."
      );
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);
    setEditedResume(null);

    try {
      const formData = new FormData();

      formData.append("resume", file);
      formData.append("jobDescription", jobDescription);

      const response = await fetch("/api/ats", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "ATS analysis failed.");
      }

      if (!data.analysis?.tailoredResume) {
        throw new Error(
          "The AI response did not contain a resume."
        );
      }

      setAnalysis(data.analysis);
      setEditedResume(data.analysis.tailoredResume);
      setActiveTab("analysis");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------
  // RESET
  // -----------------------------------------

  const resetAnalysis = () => {
    setFile(null);
    setJobDescription("");
    setAnalysis(null);
    setEditedResume(null);
    setError("");
    setActiveTab("analysis");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // -----------------------------------------
  // STATUS STYLES
  // -----------------------------------------

  const getStatusStyle = (status: string) => {
    const value = status.toLowerCase();

    if (value === "pass") {
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    }

    if (value === "warning") {
      return "border-amber-100 bg-amber-50 text-amber-700";
    }

    return "border-rose-100 bg-rose-50 text-rose-700";
  };

  const getImportanceStyle = (importance: string) => {
    const value = importance.toLowerCase();

    if (value === "high") {
      return "bg-rose-50 text-rose-700";
    }

    if (value === "medium") {
      return "bg-amber-50 text-amber-700";
    }

    return "bg-slate-100 text-slate-600";
  };

  const scoreColor =
    analysis && analysis.overallScore >= 75
      ? "text-emerald-600"
      : analysis && analysis.overallScore >= 50
        ? "text-amber-600"
        : "text-rose-600";

  // -----------------------------------------
  // DOCX DOWNLOAD
  // -----------------------------------------

  const downloadDocx = async () => {
    if (!currentResume) return;

    setDownloadingDocx(true);
    setError("");

    try {
      const resume = currentResume;
      const paragraphs: Paragraph[] = [];

      const addHeading = (text: string) => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: text.toUpperCase(),
                bold: true,
                color: "3730A3",
                size: 23,
              }),
            ],
            spacing: {
              before: 280,
              after: 120,
            },
            border: {
              bottom: {
                color: "CBD5E1",
                size: 5,
                style: "single",
                space: 5,
              },
            },
          })
        );
      };

      const addText = (text: string, bold = false) => {
        if (!text?.trim()) return;

        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text,
                bold,
                size: 21,
                color: "1E293B",
              }),
            ],
            spacing: {
              after: 100,
            },
          })
        );
      };

      const addBullet = (text: string) => {
        if (!text?.trim()) return;

        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `•  ${text}`,
                size: 20,
                color: "334155",
              }),
            ],
            spacing: {
              after: 80,
            },
            indent: {
              left: 280,
            },
          })
        );
      };

      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: resume.headline || "Professional Resume",
              bold: true,
              size: 36,
              color: "0F172A",
            }),
          ],
          spacing: {
            after: 180,
          },
        })
      );

      addText(resume.professionalSummary);

      if (resume.skills.length) {
        addHeading("Technical Skills");
        addText(
          resume.skills.filter(Boolean).join("  |  ")
        );
      }

      if (resume.education.length) {
        addHeading("Education");

        resume.education.forEach((item) => {
          addText(item.degree, true);
          addText(item.institution);
          addText(item.dates);
          item.details.forEach(addBullet);
        });
      }

      if (resume.experience.length) {
        addHeading("Experience");

        resume.experience.forEach((item) => {
          addText(
            `${item.role}${item.company ? ` — ${item.company}` : ""}`,
            true
          );

          addText(item.dates);
          item.bullets.forEach(addBullet);
        });
      }

      if (resume.projects.length) {
        addHeading("Projects");

        resume.projects.forEach((item) => {
          addText(item.name, true);

          if (item.technologies.length) {
            addText(
              `Technologies: ${item.technologies
                .filter(Boolean)
                .join(", ")}`
            );
          }

          item.bullets.forEach(addBullet);
        });
      }

      if (resume.certifications.length) {
        addHeading("Certifications");
        resume.certifications.forEach(addBullet);
      }

      if (resume.achievements.length) {
        addHeading("Achievements");
        resume.achievements.forEach(addBullet);
      }

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "PrepVoice_ATS_Resume.docx";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      console.error("DOCX download failed:", err);
      setError("Unable to generate DOCX. Please try again.");
    } finally {
      setDownloadingDocx(false);
    }
  };

  // -----------------------------------------
  // PDF DOWNLOAD
  // -----------------------------------------

  const downloadPdf = () => {
    if (!currentResume) return;

    setDownloadingPdf(true);
    setError("");

    try {
      const resume = currentResume;

      const section = (title: string, content: string) =>
        content
          ? `<section><h2>${escapeHtml(title)}</h2>${content}</section>`
          : "";

      const bullets = (items: string[]) =>
        items.length
          ? `<ul>${items
              .filter(Boolean)
              .map((item) => `<li>${escapeHtml(item)}</li>`)
              .join("")}</ul>`
          : "";

      const education = resume.education
        .map(
          (item) => `
            <div class="entry">
              <h3>${escapeHtml(item.degree)}</h3>
              <p>${escapeHtml(item.institution)}</p>
              <p>${escapeHtml(item.dates)}</p>
              ${bullets(item.details)}
            </div>
          `
        )
        .join("");

      const experience = resume.experience
        .map(
          (item) => `
            <div class="entry">
              <h3>
                ${escapeHtml(item.role)}
                ${item.company ? ` — ${escapeHtml(item.company)}` : ""}
              </h3>
              <p>${escapeHtml(item.dates)}</p>
              ${bullets(item.bullets)}
            </div>
          `
        )
        .join("");

      const projects = resume.projects
        .map(
          (item) => `
            <div class="entry">
              <h3>${escapeHtml(item.name)}</h3>
              ${
                item.technologies.length
                  ? `<p>Technologies: ${item.technologies
                      .filter(Boolean)
                      .map(escapeHtml)
                      .join(", ")}</p>`
                  : ""
              }
              ${bullets(item.bullets)}
            </div>
          `
        )
        .join("");

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8" />
          <title>PrepVoice ATS Resume</title>
          <style>
            @page {
              size: A4;
              margin: 18mm;
            }

            body {
              font-family: Arial, Helvetica, sans-serif;
              color: #1e293b;
              line-height: 1.5;
              font-size: 10.5pt;
            }

            h1 {
              font-size: 23pt;
              color: #0f172a;
              margin-bottom: 10px;
            }

            h2 {
              font-size: 12pt;
              color: #3730a3;
              text-transform: uppercase;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 5px;
              margin-top: 22px;
            }

            h3 {
              font-size: 10.5pt;
              margin-bottom: 3px;
            }

            p {
              margin: 3px 0;
              color: #475569;
            }

            ul {
              padding-left: 20px;
              margin-top: 5px;
            }

            li {
              margin-bottom: 4px;
            }

            .summary {
              border-bottom: 2px solid #4f46e5;
              padding-bottom: 14px;
            }

            .entry {
              margin-bottom: 13px;
              break-inside: avoid;
            }
          </style>
        </head>
        <body>
          <div class="summary">
            <h1>${escapeHtml(
              resume.headline || "Professional Resume"
            )}</h1>
            <p>${escapeHtml(resume.professionalSummary)}</p>
          </div>

          ${
            resume.skills.length
              ? section(
                  "Technical Skills",
                  `<p>${resume.skills
                    .filter(Boolean)
                    .map(escapeHtml)
                    .join(" | ")}</p>`
                )
              : ""
          }

          ${section("Education", education)}
          ${section("Experience", experience)}
          ${section("Projects", projects)}

          ${
            resume.certifications.length
              ? section(
                  "Certifications",
                  bullets(resume.certifications)
                )
              : ""
          }

          ${
            resume.achievements.length
              ? section(
                  "Achievements",
                  bullets(resume.achievements)
                )
              : ""
          }
        </body>
        </html>
      `;

      const printWindow = window.open("", "_blank");

      if (!printWindow) {
        setError(
          "Please allow pop-ups in your browser to save the PDF."
        );
        setDownloadingPdf(false);
        return;
      }

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      let printStarted = false;

      const startPrint = () => {
        if (printStarted || printWindow.closed) return;

        printStarted = true;
        printWindow.focus();
        printWindow.print();
        setDownloadingPdf(false);
      };

      printWindow.onload = startPrint;

      window.setTimeout(startPrint, 1000);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setError("Unable to prepare the PDF. Please try again.");
      setDownloadingPdf(false);
    }
  };

  // -----------------------------------------
  // REUSABLE WORKSPACE NAVIGATION
  // -----------------------------------------

  const WorkspaceNavigation = () => (
    <nav className="sticky top-3 z-30 mb-6 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-lg shadow-slate-200/40 backdrop-blur-xl">
      <div className="grid grid-cols-3 gap-1.5">
        {workspaceTabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setError("");
              }}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 text-center transition-all duration-200 sm:flex-row sm:gap-3 sm:px-4 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                  : "text-slate-500 hover:bg-indigo-50 hover:text-indigo-700"
              }`}
            >
              <span className="text-lg leading-none">
                {tab.icon}
              </span>

              <span className="min-w-0">
                <span className="block text-[11px] font-extrabold sm:text-sm">
                  {tab.label}
                </span>
                <span
                  className={`mt-0.5 hidden text-[10px] sm:block ${
                    isActive ? "text-indigo-100" : "text-slate-400"
                  }`}
                >
                  {tab.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );

  // -----------------------------------------
  // MAIN UI
  // -----------------------------------------

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-7 text-slate-800 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">

        {/* PAGE HEADER */}

        <header className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
              <span className="text-sm">✦</span>
              PrepVoice Intelligence Suite
            </div>

            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              ATS Resume{" "}
              <span className="text-indigo-600">Studio</span>
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Analyse your resume, discover missing keywords,
              build an ATS-friendly resume and create a
              professional cover letter — all in one workspace.
            </p>
          </div>

          {analysis && (
            <button
              onClick={resetAnalysis}
              className="pro-btn-secondary inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold"
            >
              <span>＋</span>
              New Analysis
            </button>
          )}
        </header>

        {/* INITIAL FEATURE OVERVIEW */}

        {!analysis && (
          <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                icon: "◎",
                title: "ATS Compatibility",
                description: "Evaluate resume structure and compatibility.",
              },
              {
                icon: "⌕",
                title: "Keyword Intelligence",
                description: "Identify relevant and missing job skills.",
              },
              {
                icon: "✧",
                title: "Resume & Cover Letter",
                description: "Prepare job-specific application documents.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="pro-card group flex items-center gap-4 p-4 transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xl font-semibold text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                  {item.icon}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* UPLOAD AND JOB DESCRIPTION */}

        {!analysis && (
          <>
            <section className="grid gap-5 lg:grid-cols-2">

              {/* RESUME UPLOAD */}

              <div className="pro-card p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="brand-icon flex h-11 w-11 items-center justify-center rounded-xl text-lg">
                    ↑
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Upload Your Resume
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Select your existing resume for analysis
                    </p>
                  </div>
                </div>

                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
                    dragging
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-200 bg-slate-50/70 hover:border-indigo-300 hover:bg-indigo-50/40"
                  }`}
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl text-indigo-600">
                    ▤
                  </div>

                  <h3 className="text-sm font-bold text-slate-800">
                    {dragging
                      ? "Drop your resume here"
                      : "Drag and drop your resume"}
                  </h3>

                  <p className="mt-2 text-xs text-slate-500">
                    Or browse files from your device
                  </p>

                  <span className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700">
                    Browse PDF
                  </span>

                  <p className="mt-4 text-[11px] text-slate-400">
                    PDF format only · Maximum file size 5 MB
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {file && (
                  <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-extrabold text-rose-600 shadow-sm">
                        PDF
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800">
                          {file.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB · Ready to analyse
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        setFile(null);
                        setError("");

                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      className="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* JOB DESCRIPTION */}

              <div className="pro-card p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-xl text-violet-600">
                    ▤
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Target Job Description
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Add the job description you want to target
                    </p>
                  </div>
                </div>

                <textarea
                  value={jobDescription}
                  onChange={(event) =>
                    setJobDescription(event.target.value)
                  }
                  placeholder={`Paste the complete job description here...

Example:
We are looking for a Software Developer with knowledge of JavaScript, React, Node.js, REST APIs and databases...`}
                  maxLength={12000}
                  className="pro-input min-h-[260px] w-full resize-y bg-slate-50/70 p-4 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:bg-white"
                />

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Minimum 30 characters required</span>
                  <span className="font-medium tabular-nums">
                    {jobDescription.length}/12000
                  </span>
                </div>
              </div>
            </section>

            {/* ERROR */}

            {error && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <span className="font-bold">!</span>
                <p>{error}</p>
              </div>
            )}

            {/* ANALYSE ACTION */}

            <section className="mt-6 overflow-hidden rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      ✦
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      Ready to optimise your resume?
                    </h3>
                  </div>

                  <p className="mt-2 max-w-xl text-xs leading-5 text-slate-500">
                    Gemini AI will compare your resume with the target
                    job description and generate actionable insights.
                  </p>
                </div>

                <button
                  onClick={analyzeResume}
                  disabled={
                    loading ||
                    !file ||
                    jobDescription.trim().length < 30
                  }
                  className="pro-btn-primary flex w-full items-center justify-center gap-2 px-7 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Analysing Resume...
                    </>
                  ) : (
                    <>
                      <span>✦</span>
                      Analyse My Resume
                      <span>→</span>
                    </>
                  )}
                </button>
              </div>

              {loading && (
                <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
                  <div className="flex items-center gap-3">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                    <div>
                      <p className="text-sm font-bold text-indigo-800">
                        Gemini AI is reviewing your resume
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Checking keywords, skills, job relevance and
                        resume content. This may take a little time.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        {/* RESULTS WORKSPACE */}

        {analysis && currentResume && (
          <>
            {/* WORKSPACE SUMMARY */}

            <section className="mb-5 flex flex-col justify-between gap-4 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-600">
                  ✓
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">
                    Your workspace is ready
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Switch between your ATS report, resume and cover letter.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                  ATS Score: {analysis.overallScore}/100
                </span>
                <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                  Analysis Completed
                </span>
              </div>
            </section>

            {/* WORKSPACE TABS */}

            <WorkspaceNavigation />

            {/* TAB ERROR */}

            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <span className="font-bold">!</span>
                <p>{error}</p>
              </div>
            )}

            {/* ================================= */}
            {/* ATS ANALYSIS TAB */}
            {/* ================================= */}

            {activeTab === "analysis" && (
              <div className="space-y-6">

                {/* REPORT HEADER */}

                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <span className="eyebrow">ATS PERFORMANCE REPORT</span>
                    <h2 className="mt-2 font-heading text-xl font-extrabold text-slate-900 sm:text-2xl">
                      Your Resume Analysis
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      AI-generated insights based on your resume and target role.
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab("resume")}
                    className="pro-btn-primary inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold"
                  >
                    Open Resume Builder →
                  </button>
                </div>

                {/* SCORE AND BREAKDOWN */}

                <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
                  <section className="pro-card p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Overall ATS Compatibility
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Your resume match score
                        </p>
                      </div>
                      <div className="brand-icon flex h-9 w-9 items-center justify-center rounded-lg">
                        ◎
                      </div>
                    </div>

                    <div className="my-7 flex justify-center">
                      <div
                        className="flex h-44 w-44 items-center justify-center rounded-full"
                        style={{
                          background: `conic-gradient(#4f46e5 ${Math.max(
                            0,
                            Math.min(100, analysis.overallScore)
                          ) * 3.6}deg, #e2e8f0 0deg)`,
                        }}
                      >
                        <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full bg-white shadow-inner">
                          <span className={`text-5xl font-extrabold tracking-tight ${scoreColor}`}>
                            {analysis.overallScore}
                          </span>
                          <span className="mt-1 text-[10px] font-bold tracking-widest text-slate-400">
                            OUT OF 100
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700">
                        {analysis.scoreLabel}
                      </span>
                      <p className="mt-4 text-sm leading-6 text-slate-500">
                        {analysis.summary}
                      </p>
                    </div>
                  </section>

                  <section className="pro-card p-6">
                    <div className="mb-7 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Score Breakdown
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Performance across key resume parameters
                        </p>
                      </div>
                      <div className="brand-icon flex h-9 w-9 items-center justify-center rounded-lg">
                        ↗
                      </div>
                    </div>

                    <div className="space-y-6">
                      {scoreItems.map((item) => {
                        const value = analysis.breakdown[item.key];

                        return (
                          <div key={item.key}>
                            <div className="mb-2 flex justify-between text-xs">
                              <span className="font-semibold text-slate-600">
                                {item.label}
                              </span>
                              <span className="font-bold tabular-nums text-slate-900">
                                {value}%
                              </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-700 transition-all duration-700"
                                style={{
                                  width: `${Math.max(0, Math.min(100, value))}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-7 flex items-start gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
                      <span className="text-indigo-600">ⓘ</span>
                      <p className="text-[11px] leading-5 text-indigo-800">
                        These scores are AI-generated estimates based on
                        extracted resume text, not an official ATS test.
                      </p>
                    </div>
                  </section>
                </div>

                {/* KEYWORD ANALYSIS */}

                <div className="grid gap-5 lg:grid-cols-2">
                  <section className="pro-card p-5 sm:p-6">
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Matched Keywords
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Skills found in your resume
                        </p>
                      </div>
                      <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
                        {analysis.matchedKeywords.length} Found
                      </span>
                    </div>

                    {analysis.matchedKeywords.length ? (
                      <div className="space-y-3">
                        {analysis.matchedKeywords.map((item, index) => (
                          <div
                            key={`${item.keyword}-${index}`}
                            className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5 transition hover:bg-emerald-50/70"
                          >
                            <p className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                              <span>✓</span>
                              {item.keyword}
                            </p>
                            <p className="mt-1.5 text-xs leading-5 text-slate-500">
                              {item.evidence}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl bg-slate-50 p-5 text-center text-xs text-slate-500">
                        No matched keywords were identified.
                      </p>
                    )}
                  </section>

                  <section className="pro-card p-5 sm:p-6">
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Missing Keywords
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Skills to review for your target role
                        </p>
                      </div>
                      <span className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-700">
                        {analysis.missingKeywords.length} Missing
                      </span>
                    </div>

                    {analysis.missingKeywords.length ? (
                      <div className="space-y-3">
                        {analysis.missingKeywords.map((item, index) => (
                          <div
                            key={`${item.keyword}-${index}`}
                            className="rounded-xl border border-slate-100 bg-white p-3.5 transition hover:border-indigo-100"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-bold text-slate-800">
                                {item.keyword}
                              </p>
                              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${getImportanceStyle(item.importance)}`}>
                                {item.importance}
                              </span>
                            </div>
                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              {item.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl bg-slate-50 p-5 text-center text-xs text-slate-500">
                        No missing keywords were identified.
                      </p>
                    )}
                  </section>
                </div>

                {/* ATS CHECKS */}

                <section className="pro-card p-5 sm:p-6">
                  <div className="mb-5">
                    <h3 className="text-sm font-bold text-slate-900">
                      ATS Compatibility Checks
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Review the technical and structural checks for your resume.
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {analysis.atsChecks.map((item, index) => (
                      <div
                        key={`${item.name}-${index}`}
                        className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-indigo-100 hover:bg-white"
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-slate-800">
                            {item.name}
                          </h4>
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusStyle(item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-xs leading-5 text-slate-500">
                          {item.feedback}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* STRENGTHS AND GAPS */}

                <div className="grid gap-5 lg:grid-cols-2">
                  <section className="pro-card p-5 sm:p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        ✓
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Resume Strengths
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          What is already working well
                        </p>
                      </div>
                    </div>

                    <ul className="space-y-3">
                      {analysis.strengths.map((item, index) => (
                        <li key={index} className="flex gap-3 text-xs leading-6 text-slate-600">
                          <span className="mt-0.5 font-bold text-emerald-600">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="pro-card p-5 sm:p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        !
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Areas to Improve
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Opportunities to strengthen your profile
                        </p>
                      </div>
                    </div>

                    <ul className="space-y-3">
                      {analysis.gaps.map((item, index) => (
                        <li key={index} className="flex gap-3 text-xs leading-6 text-slate-600">
                          <span className="mt-0.5 font-bold text-amber-600">!</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>

                {/* AI RECOMMENDATIONS */}

                <section className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
                  <div className="border-b border-indigo-100 bg-indigo-50/60 px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                        ✦
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          AI Improvement Recommendations
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Actionable suggestions to improve your resume
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 p-5 sm:p-6">
                    {analysis.recommendations.map((item, index) => (
                      <div
                        key={index}
                        className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3.5"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700">
                          {index + 1}
                        </span>
                        <p className="text-xs leading-6 text-slate-600">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* QUICK ACTIONS */}

                <section className="grid gap-4 sm:grid-cols-2">
                  <button
                    onClick={() => setActiveTab("resume")}
                    className="group flex items-center justify-between rounded-2xl border border-indigo-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-xl text-indigo-600">
                        ▤
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">
                          Build Your Resume
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Edit, save and download your resume
                        </p>
                      </div>
                    </div>
                    <span className="text-lg text-indigo-600 transition group-hover:translate-x-1">→</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("cover-letter")}
                    className="group flex items-center justify-between rounded-2xl border border-indigo-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-xl text-violet-600">
                        ✉
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">
                          Create Cover Letter
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Generate a job-specific cover letter
                        </p>
                      </div>
                    </div>
                    <span className="text-lg text-indigo-600 transition group-hover:translate-x-1">→</span>
                  </button>
                </section>
              </div>
            )}

            {/* ================================= */}
            {/* RESUME BUILDER TAB */}
            {/* ================================= */}

            {activeTab === "resume" && (
              <section className="space-y-6">

                {/* RESUME HEADER */}

                <div className="pro-card flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
                  <div>
                    <span className="eyebrow">RESUME WORKSPACE</span>
                    <h2 className="mt-2 font-heading text-xl font-extrabold text-slate-900">
                      Your ATS-Friendly Resume
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Review, edit, save and download your tailored resume.
                    </p>
                  </div>

                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                    ✓ Draft Generated
                  </span>
                </div>

                {/* RESUME DOCUMENT PREVIEW */}

                <div className="pro-card p-4 sm:p-7">
                  <div className="mx-auto max-w-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-9">

                    {/* HEADLINE AND SUMMARY */}

                    <div className="border-b-2 border-indigo-700 pb-5">
                      <h1 className="font-heading text-2xl font-extrabold text-slate-900">
                        {currentResume.headline || "Professional Resume"}
                      </h1>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                        {currentResume.professionalSummary}
                      </p>
                    </div>

                    {/* SKILLS */}

                    {currentResume.skills.length > 0 && (
                      <div className="mt-6">
                        <h4 className="mb-3 border-b border-slate-200 pb-2 text-xs font-extrabold uppercase tracking-widest text-indigo-700">
                          Technical Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {currentResume.skills.filter(Boolean).map((skill, index) => (
                            <span
                              key={`${skill}-${index}`}
                              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* EDUCATION */}

                    {currentResume.education.length > 0 && (
                      <div className="mt-6">
                        <h4 className="mb-3 border-b border-slate-200 pb-2 text-xs font-extrabold uppercase tracking-widest text-indigo-700">
                          Education
                        </h4>
                        <div className="space-y-4">
                          {currentResume.education.map((item, index) => (
                            <div key={index}>
                              <div className="flex flex-wrap justify-between gap-2">
                                <p className="text-sm font-bold text-slate-800">
                                  {item.degree}
                                </p>
                                <span className="text-xs text-slate-500">
                                  {item.dates}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-slate-600">
                                {item.institution}
                              </p>
                              {item.details.filter(Boolean).map((detail, i) => (
                                <p key={i} className="mt-1 text-xs leading-5 text-slate-500">
                                  • {detail}
                                </p>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* EXPERIENCE */}

                    {currentResume.experience.length > 0 && (
                      <div className="mt-6">
                        <h4 className="mb-3 border-b border-slate-200 pb-2 text-xs font-extrabold uppercase tracking-widest text-indigo-700">
                          Experience
                        </h4>
                        <div className="space-y-5">
                          {currentResume.experience.map((item, index) => (
                            <div key={index}>
                              <div className="flex flex-wrap justify-between gap-2">
                                <p className="text-sm font-bold text-slate-800">
                                  {item.role}{item.company && ` — ${item.company}`}
                                </p>
                                <span className="text-xs text-slate-500">
                                  {item.dates}
                                </span>
                              </div>
                              <ul className="mt-2 space-y-1">
                                {item.bullets.filter(Boolean).map((bullet, i) => (
                                  <li key={i} className="text-xs leading-6 text-slate-600">
                                    • {bullet}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* PROJECTS */}

                    {currentResume.projects.length > 0 && (
                      <div className="mt-6">
                        <h4 className="mb-3 border-b border-slate-200 pb-2 text-xs font-extrabold uppercase tracking-widest text-indigo-700">
                          Projects
                        </h4>
                        <div className="space-y-5">
                          {currentResume.projects.map((item, index) => (
                            <div key={index}>
                              <p className="text-sm font-bold text-slate-800">
                                {item.name}
                              </p>
                              {item.technologies.filter(Boolean).length > 0 && (
                                <p className="mt-1 text-xs text-slate-500">
                                  Technologies: {item.technologies.filter(Boolean).join(", ")}
                                </p>
                              )}
                              <ul className="mt-2 space-y-1">
                                {item.bullets.filter(Boolean).map((bullet, i) => (
                                  <li key={i} className="text-xs leading-6 text-slate-600">
                                    • {bullet}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CERTIFICATIONS */}

                    {currentResume.certifications.filter(Boolean).length > 0 && (
                      <div className="mt-6">
                        <h4 className="mb-3 border-b border-slate-200 pb-2 text-xs font-extrabold uppercase tracking-widest text-indigo-700">
                          Certifications
                        </h4>
                        <ul className="space-y-1">
                          {currentResume.certifications.filter(Boolean).map((item, index) => (
                            <li key={index} className="text-xs leading-6 text-slate-600">
                              • {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* ACHIEVEMENTS */}

                    {currentResume.achievements.filter(Boolean).length > 0 && (
                      <div className="mt-6">
                        <h4 className="mb-3 border-b border-slate-200 pb-2 text-xs font-extrabold uppercase tracking-widest text-indigo-700">
                          Achievements
                        </h4>
                        <ul className="space-y-1">
                          {currentResume.achievements.filter(Boolean).map((item, index) => (
                            <li key={index} className="text-xs leading-6 text-slate-600">
                              • {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* INTERACTIVE RESUME EDITOR */}

                <div className="pro-card p-5 sm:p-7">
                  <div className="mb-5">
                    <span className="eyebrow">CUSTOMIZE YOUR CONTENT</span>
                    <h3 className="mt-2 text-lg font-extrabold text-slate-900">
                      Resume Editor
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Make changes to your resume before downloading it.
                    </p>
                  </div>

                  <ResumeEditor
                    resume={currentResume}
                    onChange={setEditedResume}
                  />
                </div>

                {/* RESUME VERSION HISTORY */}

                <div className="pro-card p-5 sm:p-7">
                  <div className="mb-5">
                    <span className="eyebrow">YOUR SAVED WORK</span>
                    <h3 className="mt-2 text-lg font-extrabold text-slate-900">
                      Resume Version History
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Restore a previously saved version whenever you need it.
                    </p>
                  </div>

                  <ResumeVersionHistory
                    resume={currentResume}
                    onRestore={(restoredResume) => {
                      setEditedResume(restoredResume);
                      setError("");
                    }}
                  />
                </div>

                {/* INTEGRITY NOTES */}

                {analysis.integrityNotes.length > 0 && (
                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-700">ⓘ</span>
                      <h4 className="text-sm font-bold text-amber-800">
                        Please Verify These Details
                      </h4>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {analysis.integrityNotes.map((item, index) => (
                        <li key={index} className="text-xs leading-5 text-amber-800">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* DOWNLOAD SECTION */}

                <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
                  <div className="border-b border-indigo-100 bg-indigo-50/60 p-5 sm:p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-xl text-indigo-700">
                        ↓
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">
                          Your ATS-Friendly Resume is Ready!
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Download your latest edited resume.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-xl text-indigo-600 shadow-sm">
                        ▤
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-900">
                          PrepVoice_ATS_Resume
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Your updated resume · Ready to export
                        </p>
                      </div>
                      <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                        READY
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        onClick={downloadDocx}
                        disabled={downloadingDocx}
                        className="pro-btn-primary flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {downloadingDocx ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            Generating DOCX...
                          </>
                        ) : (
                          <>
                            <span>↓</span>
                            Download DOCX
                          </>
                        )}
                      </button>

                      <button
                        onClick={downloadPdf}
                        disabled={downloadingPdf}
                        className="pro-btn-secondary flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {downloadingPdf ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                            Preparing PDF...
                          </>
                        ) : (
                          <>
                            <span>▤</span>
                            Save as PDF
                          </>
                        )}
                      </button>
                    </div>

                    <p className="mt-4 text-center text-[11px] leading-5 text-slate-400">
                      DOCX is editable in Microsoft Word. For PDF,
                      select "Save as PDF" in your browser's print window.
                    </p>
                  </div>
                </div>

                {/* GO TO COVER LETTER */}

                <button
                  onClick={() => setActiveTab("cover-letter")}
                  className="group flex w-full items-center justify-between rounded-2xl border border-indigo-100 bg-white p-5 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-xl text-violet-600">
                      ✉
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">
                        Continue to Cover Letter Studio
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Create a matching cover letter for your target role.
                      </p>
                    </div>
                  </div>
                  <span className="text-lg text-indigo-600 transition group-hover:translate-x-1">
                    →
                  </span>
                </button>
              </section>
            )}

            {/* ================================= */}
            {/* COVER LETTER TAB */}
            {/* ================================= */}

            {activeTab === "cover-letter" && (
              <section className="space-y-5">

                {/* COVER LETTER INTRO */}

                <div className="pro-card flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
                  <div>
                    <span className="eyebrow">APPLICATION DOCUMENTS</span>
                    <h2 className="mt-2 font-heading text-xl font-extrabold text-slate-900 sm:text-2xl">
                      Cover Letter Studio
                    </h2>
                    <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                      Generate, customize and save a professional cover
                      letter using your tailored resume and target job description.
                    </p>
                  </div>

                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-600">
                    ✉
                  </div>
                </div>

                {/* COVER LETTER COMPONENT */}

                <div className="pro-card p-4 sm:p-6">
                  <CoverLetterStudio
                    resume={currentResume}
                    jobDescription={jobDescription}
                  />
                </div>

                {/* BACK TO RESUME */}

                <div className="flex flex-col justify-between gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center">
                  <button
                    onClick={() => setActiveTab("resume")}
                    className="pro-btn-secondary inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold"
                  >
                    ← Back to Resume Builder
                  </button>

                  <button
                    onClick={() => setActiveTab("analysis")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
                  >
                    View ATS Report
                    →
                  </button>
                </div>
              </section>
            )}
          </>
        )}

        {/* FOOTER */}

        <footer className="mt-10 border-t border-slate-200 pt-5 text-center">
          <p className="text-[11px] leading-5 text-slate-400">
            PrepVoice ATS Studio · AI-generated compatibility
            estimates are informational and do not guarantee
            selection by an employer.
          </p>
        </footer>
      </div>
    </main>
  );
}
