
"use client";

import { useEffect, useState } from "react";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { createClient } from "@/lib/supabase/client";
import type { TailoredResume } from "./ResumeEditor";

type Props = {
  resume: TailoredResume;
  jobDescription: string;
};

type SavedLetter = {
  id: string;
  company: string;
  role: string;
  content: string;
  created_at: string;
};

const tones = [
  {
    value: "Professional",
    description: "Formal and polished",
  },
  {
    value: "Confident",
    description: "Strong and persuasive",
  },
  {
    value: "Concise",
    description: "Short and direct",
  },
];

export default function CoverLetterStudio({
  resume,
  jobDescription,
}: Props) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [hiringManager, setHiringManager] = useState("");
  const [tone, setTone] = useState("Professional");

  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const [history, setHistory] = useState<SavedLetter[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadHistory();
    // Load saved letters when the component mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadHistory = async () => {
    setHistoryLoading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setHistory([]);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("cover_letter_versions")
        .select("id,company,role,content,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;

      setHistory((data || []) as SavedLetter[]);
    } catch (err) {
      console.error("Cover letter history error:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const generateCoverLetter = async () => {
    if (!company.trim() || !role.trim()) {
      setError("Please enter the company name and job position.");
      return;
    }

    if (jobDescription.trim().length < 30) {
      setError("A valid job description is required.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    setCopied(false);

    try {
      const response = await fetch("/api/cover-letter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resume,
          jobDescription,
          company,
          role,
          hiringManager,
          tone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to generate cover letter."
        );
      }

      if (!data.coverLetter) {
        throw new Error("The AI did not return a cover letter.");
      }

      setCoverLetter(data.coverLetter);
      setMessage("Your cover letter has been generated successfully.");
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

  const copyLetter = async () => {
    if (!coverLetter.trim()) return;

    try {
      await navigator.clipboard.writeText(coverLetter);
      setCopied(true);
      setMessage("Cover letter copied to clipboard.");
    } catch {
      setError("Unable to copy. Please select and copy the text manually.");
    }
  };

  const saveLetter = async () => {
    if (!coverLetter.trim()) {
      setError("Generate a cover letter before saving.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Please sign in to save your cover letter.");
      }

      const { error: insertError } = await supabase
        .from("cover_letter_versions")
        .insert({
          user_id: user.id,
          company: company.trim(),
          role: role.trim(),
          content: coverLetter,
        });

      if (insertError) throw insertError;

      setMessage("Cover letter saved successfully.");
      await loadHistory();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save cover letter."
      );
    } finally {
      setSaving(false);
    }
  };

  const restoreLetter = (item: SavedLetter) => {
    setCompany(item.company);
    setRole(item.role);
    setCoverLetter(item.content);
    setError("");
    setMessage(`Restored your ${item.role} cover letter.`);
  };

  const deleteLetter = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this saved cover letter?"
    );

    if (!confirmed) return;

    try {
      const { error: deleteError } = await supabase
        .from("cover_letter_versions")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      setHistory((previous) =>
        previous.filter((item) => item.id !== id)
      );

      setMessage("Saved cover letter deleted.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete this cover letter."
      );
    }
  };

  const downloadDocx = async () => {
    if (!coverLetter.trim()) return;

    setDownloadingDocx(true);
    setError("");

    try {
      const paragraphs = coverLetter
        .split(/\n\s*\n/)
        .filter((paragraph) => paragraph.trim())
        .map(
          (paragraph) =>
            new Paragraph({
              children: [
                new TextRun({
                  text: paragraph.trim(),
                  size: 22,
                  color: "334155",
                }),
              ],
              spacing: {
                after: 220,
                line: 340,
              },
            })
        );

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "COVER LETTER",
                    bold: true,
                    size: 30,
                    color: "3730A3",
                  }),
                ],
                spacing: { after: 400 },
              }),
              ...paragraphs,
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `Cover_Letter_${company.trim().replace(/[^a-z0-9]/gi, "_") || "PrepVoice"}.docx`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Cover letter DOCX error:", err);
      setError("Unable to create DOCX. Please try again.");
    } finally {
      setDownloadingDocx(false);
    }
  };

  const downloadPdf = () => {
    if (!coverLetter.trim()) return;

    const safeText = coverLetter.replace(
      /[&<>"']/g,
      (character) => {
        const entities: Record<string, string> = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        };

        return entities[character];
      }
    );

    const paragraphs = safeText
      .split(/\n\s*\n/)
      .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br/>")}</p>`)
      .join("");

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      setError("Please allow pop-ups to save the PDF.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cover Letter - ${company}</title>
          <meta charset="UTF-8"/>
          <style>
            @page { size: A4; margin: 24mm; }
            body {
              font-family: Arial, Helvetica, sans-serif;
              color: #1e293b;
              font-size: 11pt;
              line-height: 1.8;
            }
            h1 {
              color: #3730a3;
              font-size: 18pt;
              letter-spacing: 1px;
              border-bottom: 2px solid #4f46e5;
              padding-bottom: 12px;
              margin-bottom: 28px;
            }
            p { margin-bottom: 18px; }
          </style>
        </head>
        <body>
          <h1>COVER LETTER</h1>
          ${paragraphs}
          <script>
            window.onload = function() {
              window.focus();
              window.print();
            };
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
      {/* HEADER */}
      <div className="relative overflow-hidden border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-violet-50 p-5 sm:p-7">
        <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-indigo-100/50 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
              ✦ AI Writing Assistant
            </span>

            <h2 className="mt-3 font-heading text-2xl font-extrabold tracking-tight text-slate-900">
              Cover Letter <span className="text-indigo-600">Studio</span>
            </h2>

            <p className="mt-2 max-w-xl text-xs leading-6 text-slate-500">
              Turn your tailored resume into a personalized,
              professional cover letter for your next application.
            </p>
          </div>

          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-indigo-100 bg-white text-2xl text-indigo-600 shadow-sm">
            ✉
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[0.85fr_1.15fr]">
        {/* LEFT: INPUTS */}
        <div className="space-y-5">
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-extrabold text-slate-900">
                Application Details
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Tell us about the role you are applying for.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700">
                  Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  placeholder="e.g. Google"
                  maxLength={150}
                  className="pro-input w-full rounded-xl bg-slate-50/70 px-4 py-3 text-sm outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700">
                  Job Position <span className="text-rose-500">*</span>
                </label>
                <input
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  placeholder="e.g. Software Engineer"
                  maxLength={150}
                  className="pro-input w-full rounded-xl bg-slate-50/70 px-4 py-3 text-sm outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700">
                  Hiring Manager Name <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                <input
                  value={hiringManager}
                  onChange={(event) => setHiringManager(event.target.value)}
                  placeholder="e.g. Dear Alex Morgan"
                  maxLength={150}
                  className="pro-input w-full rounded-xl bg-slate-50/70 px-4 py-3 text-sm outline-none focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3">
              <h3 className="text-sm font-extrabold text-slate-900">
                Choose Writing Tone
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Select the style that suits your application.
              </p>
            </div>

            <div className="grid gap-2">
              {tones.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setTone(item.value)}
                  className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${
                    tone === item.value
                      ? "border-indigo-400 bg-indigo-50/70 ring-2 ring-indigo-100"
                      : "border-slate-200 bg-white hover:border-indigo-200"
                  }`}
                >
                  <div>
                    <p className={`text-xs font-bold ${
                      tone === item.value ? "text-indigo-800" : "text-slate-800"
                    }`}>
                      {item.value}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {item.description}
                    </p>
                  </div>

                  <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    tone === item.value
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-300"
                  }`}>
                    {tone === item.value ? "✓" : ""}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5">
            <div className="flex items-center gap-2">
              <span className="text-emerald-700">✓</span>
              <p className="text-xs font-bold text-emerald-800">
                Using your latest edited resume
              </p>
            </div>
            <p className="mt-1.5 text-[11px] leading-5 text-emerald-800/80">
              Your updated skills, projects and experience will be
              considered while generating the letter.
            </p>
          </div>

          <button
            onClick={generateCoverLetter}
            disabled={loading || !company.trim() || !role.trim()}
            className="pro-btn-primary flex w-full items-center justify-center gap-2 px-5 py-3.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Generating Cover Letter...
              </>
            ) : (
              <>
                ✦ Generate Cover Letter
                <span>→</span>
              </>
            )}
          </button>

          {loading && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs leading-5 text-indigo-800">
              Gemini AI is preparing a personalized letter using
              your resume and the target job description.
            </div>
          )}
        </div>

        {/* RIGHT: EDITOR AND PREVIEW */}
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Your Cover Letter
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Review and edit the generated content before using it.
              </p>
            </div>

            {coverLetter && (
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                EDITABLE DRAFT
              </span>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  ▤
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {company || "Your Company"}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {role || "Job Position"}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-semibold text-slate-400">
                DOCUMENT PREVIEW
              </span>
            </div>

            <textarea
              value={coverLetter}
              onChange={(event) => setCoverLetter(event.target.value)}
              placeholder={`Your personalized cover letter will appear here.

1. Enter the company and job position.
2. Choose your preferred writing tone.
3. Click Generate Cover Letter.

You can edit the generated letter before downloading or saving it.`}
              className="min-h-[430px] w-full resize-y bg-white p-5 text-sm leading-7 text-slate-700 outline-none placeholder:text-slate-400 sm:p-7"
            />

            <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 py-3">
              <span className="text-[10px] text-slate-400">
                {coverLetter.length} characters
              </span>
              <span className="text-[10px] text-slate-400">
                Editable text
              </span>
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-700">
              {message}
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              onClick={copyLetter}
              disabled={!coverLetter.trim()}
              className="pro-btn-secondary flex items-center justify-center gap-2 px-3 py-3 text-xs font-bold disabled:opacity-40"
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>

            <button
              onClick={downloadDocx}
              disabled={!coverLetter.trim() || downloadingDocx}
              className="pro-btn-secondary flex items-center justify-center gap-2 px-3 py-3 text-xs font-bold disabled:opacity-40"
            >
              {downloadingDocx ? "Preparing..." : "↓ DOCX"}
            </button>

            <button
              onClick={downloadPdf}
              disabled={!coverLetter.trim()}
              className="pro-btn-secondary flex items-center justify-center gap-2 px-3 py-3 text-xs font-bold disabled:opacity-40"
            >
              ↓ PDF
            </button>

            <button
              onClick={saveLetter}
              disabled={!coverLetter.trim() || saving}
              className="pro-btn-primary flex items-center justify-center gap-2 px-3 py-3 text-xs font-bold disabled:opacity-40"
            >
              {saving ? "Saving..." : "Save Letter"}
            </button>
          </div>

          <p className="mt-3 text-[10px] leading-5 text-slate-400">
            PDF opens your browser's print window. Choose
            "Save as PDF" to export your letter.
          </p>
        </div>
      </div>

      {/* SAVED LETTER HISTORY */}
      <div className="border-t border-slate-100 bg-slate-50/60 p-5 sm:p-7">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Saved Cover Letters
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Access and restore your previously saved applications.
            </p>
          </div>

          <button
            onClick={loadHistory}
            disabled={historyLoading}
            className="pro-btn-secondary px-3 py-2 text-xs font-semibold"
          >
            {historyLoading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>

        {historyLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-center text-xs text-slate-500">
            Loading saved cover letters...
          </div>
        ) : history.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-bold text-slate-900">
                      {item.role}
                    </h4>
                    <p className="mt-1 text-xs font-medium text-indigo-700">
                      {item.company}
                    </p>
                    <p className="mt-2 text-[10px] text-slate-400">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>

                  <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                    ✉
                  </span>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => restoreLetter(item)}
                    className="pro-btn-primary flex-1 px-3 py-2 text-xs font-bold"
                  >
                    Restore
                  </button>

                  <button
                    onClick={() => deleteLetter(item.id)}
                    className="rounded-lg border border-rose-100 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-7 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-xl text-indigo-600">
              ✉
            </div>
            <p className="mt-3 text-sm font-bold text-slate-800">
              No saved cover letters yet
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Generate and save your first cover letter to see it here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
