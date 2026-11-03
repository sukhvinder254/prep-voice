
"use client";

import { jsPDF } from "jspdf";

interface DownloadReportButtonProps {
  report: {
    id: string;
    created_at: string;
    match_score: number;
    summary: string;
    job_description: string;
    matched_skills: unknown[];
    partial_skills: unknown[];
    missing_skills: unknown[];
    learning_roadmap: unknown[];
  };
}

export default function DownloadReportButton({
  report,
}: DownloadReportButtonProps) {
  const getText = (item: unknown): string => {
    if (typeof item === "string") return item;

    if (item && typeof item === "object") {
      const data = item as Record<string, unknown>;

      return String(
        data.skill ??
          data.name ??
          data.title ??
          data.topic ??
          data.description ??
          "Skill"
      );
    }

    return String(item);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    const addHeading = (heading: string) => {
      if (y > 265) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(heading, margin, y);
      y += 9;
    };

    const addParagraph = (content: string) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const lines = doc.splitTextToSize(content, contentWidth);

      if (y + lines.length * 6 > 280) {
        doc.addPage();
        y = 20;
      }

      doc.text(lines, margin, y);
      y += lines.length * 6 + 5;
    };

    const addSkillList = (heading: string, skills: unknown[]) => {
      addHeading(heading);

      if (!skills?.length) {
        addParagraph("No skills listed.");
        return;
      }

      skills.forEach((skill, index) => {
        addParagraph(`${index + 1}. ${getText(skill)}`);
      });
    };

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("PrepVoice", margin, y);
    y += 10;

    doc.setFontSize(12);
    doc.text("Skill Gap Analysis Report", margin, y);
    y += 12;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      `Analysis Date: ${new Date(report.created_at).toLocaleDateString()}`,
      margin,
      y
    );
    y += 12;

    // Match Score
    addHeading("Overall Skill Match Score");
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(`${report.match_score}%`, margin, y);
    y += 15;

    // Summary
    addHeading("Analysis Summary");
    addParagraph(report.summary || "No summary available.");

    // Skills
    addSkillList("Matched Skills", report.matched_skills);
    addSkillList("Partially Matched Skills", report.partial_skills);
    addSkillList("Missing Skills", report.missing_skills);

    // Roadmap
    addHeading("Personalized Learning Roadmap");

    if (!report.learning_roadmap?.length) {
      addParagraph("No learning roadmap available.");
    } else {
      report.learning_roadmap.forEach((step, index) => {
        addParagraph(`${index + 1}. ${getText(step)}`);

        if (step && typeof step === "object") {
          const data = step as Record<string, unknown>;
          const description = data.description ?? data.details;

          if (description) {
            addParagraph(String(description));
          }
        }
      });
    }

    // Job Description
    addHeading("Job Description");
    addParagraph(report.job_description || "Not available.");

    doc.save("PrepVoice-Skill-Gap-Report.pdf");
  };

  return (
    <button
      onClick={downloadPDF}
      className="rounded-lg bg-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700"
    >
      ↓ Download PDF Report
    </button>
  );
}
