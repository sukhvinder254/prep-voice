
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TailoredResume } from "./ResumeEditor";

type ResumeVersion = {
  id: string;
  title: string;
  company: string;
  role: string;
  resume: TailoredResume;
  created_at: string;
};

type Props = {
  resume: TailoredResume;
  onRestore: (resume: TailoredResume) => void;
};

export default function ResumeVersionHistory({
  resume,
  onRestore,
}: Props) {
  const supabase = useMemo(() => createClient(), []);

  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("resume_versions")
      .select("id, title, company, role, resume, created_at")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setVersions([]);
    } else {
      setVersions((data ?? []) as ResumeVersion[]);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void fetchVersions();
  }, [fetchVersions]);

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Please enter a title for this resume version.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("Please log in to save your resume versions.");
        return;
      }

      const { error: insertError } = await supabase
        .from("resume_versions")
        .insert({
          user_id: user.id,
          title: title.trim(),
          company: company.trim(),
          role: role.trim(),
          resume,
        });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      setTitle("");
      setCompany("");
      setRole("");
      setSuccess("Resume version saved successfully!");

      await fetchVersions();
    } catch {
      setError("Something went wrong while saving your resume.");
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = (version: ResumeVersion) => {
    if (!version.resume) {
      setError("This saved version could not be restored.");
      return;
    }

    onRestore(version.resume);
    setSuccess(`"${version.title}" has been restored.`);
    setError("");
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this resume version?"
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError("");
    setSuccess("");

    const { error: deleteError } = await supabase
      .from("resume_versions")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      setVersions((previous) =>
        previous.filter((version) => version.id !== id)
      );
      setSuccess("Resume version deleted successfully.");
    }

    setDeletingId(null);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <section className="mt-8 space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl">
            💾
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Save Resume Version
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Save this tailored resume for a specific company or job role.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Version Title *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Google SDE Resume"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Company
            </label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Google"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Job Role
            </label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Software Development Engineer"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {success && (
          <p className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Resume Version"}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Resume Version History
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Access and restore your previously saved resumes.
            </p>
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
            {versions.length} Saved
          </span>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-slate-500">
            Loading your saved versions...
          </div>
        ) : versions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
            <div className="mb-3 text-3xl">📄</div>
            <h3 className="font-semibold text-slate-800">
              No saved versions yet
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Your saved resume versions will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((version) => (
              <div
                key={version.id}
                className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <h3 className="break-words font-semibold text-slate-900">
                    {version.title}
                  </h3>

                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                    {version.company && <span>{version.company}</span>}
                    {version.role && <span>{version.role}</span>}
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    Saved on {formatDate(version.created_at)}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleRestore(version)}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                  >
                    Restore
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(version.id)}
                    disabled={deletingId === version.id}
                    className="rounded-lg border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === version.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
