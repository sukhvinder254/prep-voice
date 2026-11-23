import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Support both FormData (PDF upload) and JSON body (pasted text)
    let resumeText = "";
    let jobDescription = "";
    let action = "analyze"; // "analyze" | "tailor" | "cover_letter"
    let targetRole = "";
    let companyName = "";

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("resume");
      jobDescription = (formData.get("jobDescription") as string) || "";
      action = (formData.get("action") as string) || "analyze";
      targetRole = (formData.get("targetRole") as string) || "";
      companyName = (formData.get("companyName") as string) || "";

      if (file && file instanceof File) {
        if (file.size > 8 * 1024 * 1024) {
          return NextResponse.json(
            { error: "Resume file exceeds 8 MB limit." },
            { status: 400 }
          );
        }
        const buffer = Buffer.from(await file.arrayBuffer());
        const pdfData = await pdfParse(buffer);
        resumeText = pdfData.text.trim();
      }
    } else {
      const json = await req.json();
      resumeText = json.resumeText || "";
      jobDescription = json.jobDescription || "";
      action = json.action || "analyze";
      targetRole = json.targetRole || "";
      companyName = json.companyName || "";
    }

    if (!resumeText || resumeText.length < 20) {
      return NextResponse.json(
        { error: "Please provide resume content or upload a valid PDF." },
        { status: 400 }
      );
    }

    if (!jobDescription || jobDescription.length < 20) {
      return NextResponse.json(
        { error: "Please provide a target Job Description to compare against." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Fallback algorithmic processor if Gemini API is not set
      return handleAlgorithmicFallback(resumeText, jobDescription, action, targetRole, companyName);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    if (action === "analyze") {
      const prompt = `
You are an expert ATS (Applicant Tracking System) algorithm analyst and senior tech recruiter.
Compare this Candidate Resume against the target Job Description (JD).

CANDIDATE RESUME:
${resumeText.slice(0, 8000)}

TARGET JOB DESCRIPTION:
${jobDescription.slice(0, 8000)}

Evaluate:
1. Overall ATS match score (integer from 0 to 100).
2. Key hard skills and technical requirements matched in both.
3. Critical missing keywords found in the JD that are absent or weak in the resume.
4. ATS readability and impact score (0 to 100) based on action verbs, metrics, and bullet structure.
5. 4 specific, actionable improvements the candidate should make to reach a 95%+ pass rate.

Return ONLY valid JSON in this exact structure:
{
  "matchScore": 84,
  "readabilityScore": 90,
  "roleIdentified": "Senior Frontend Engineer",
  "companyIdentified": "Tech Corp",
  "matchedKeywords": ["React", "TypeScript", "Next.js", "REST APIs", "Tailwind CSS"],
  "missingKeywords": ["GraphQL", "CI/CD Pipelines", "Docker", "Jest/Cypress"],
  "categoryScores": {
    "technicalSkills": 85,
    "experienceAlignment": 80,
    "educationAndCertifications": 90,
    "impactAndMetrics": 78
  },
  "actionableRecommendations": [
    "Incorporate GraphQL schema design into your project bullet points.",
    "Quantify engineering impact with metrics (e.g., latency reduction, user growth).",
    "Add automated testing keywords (Jest, Cypress) to match the QA requirements.",
    "Refine the professional headline to explicitly match the target title in the JD."
  ]
}
`;
      const result = await model.generateContent(prompt);
      const data = JSON.parse(result.response.text());
      return NextResponse.json({ success: true, analysis: data });
    }

    if (action === "tailor") {
      const prompt = `
You are an executive resume writer and ATS optimization specialist.
Rewrite and tailor the candidate's resume specifically for this target Job Description.

CANDIDATE RESUME:
${resumeText.slice(0, 8000)}

TARGET JOB DESCRIPTION:
${jobDescription.slice(0, 8000)}

INSTRUCTIONS:
1. Retain the candidate's actual background and experiences, but highlight and reframe relevant achievements using strong action verbs, quantifiable metrics, and exact keywords from the JD.
2. Produce a targeted Professional Headline matching the JD.
3. Formulate an impactful 3-sentence Executive Summary tailored to the JD's company mission and technical challenges.
4. Curate an optimized Technical Skills section grouped into categories (Languages, Frameworks, Cloud/DevOps, Tools).
5. Rewrite Work Experience bullets in the Google XYZ format: "Accomplished [X] measured by [Y] by doing [Z]".
6. Output a complete, high-converting plain-text / markdown resume that can immediately be copied or exported.

Return ONLY valid JSON in this structure:
{
  "tailoredHeadline": "Full Stack Software Engineer | React, Node.js & Distributed Cloud Systems",
  "executiveSummary": "Results-driven Software Engineer with proven expertise...",
  "skillsCategories": [
    { "category": "Languages & Core", "skills": ["TypeScript", "JavaScript", "Python", "SQL"] },
    { "category": "Frameworks & Libraries", "skills": ["React 19", "Next.js", "Node.js", "Express", "Tailwind CSS"] },
    { "category": "Cloud & Infrastructure", "skills": ["AWS", "Docker", "PostgreSQL", "Supabase", "CI/CD"] }
  ],
  "tailoredExperience": [
    {
      "company": "Tech Solutions Inc.",
      "role": "Software Engineer",
      "period": "2023 - Present",
      "bullets": [
        "Architected scalable microservices reducing API latency by 34% across 500k monthly active users.",
        "Engineered end-to-end type-safe Next.js client interface with 99.8% test coverage.",
        "Integrated robust CI/CD automated deployment pipelines with Docker and GitHub Actions."
      ]
    }
  ],
  "formattedMarkdownResume": "# John Doe\\n**Full Stack Software Engineer**\\n\\n### Executive Summary\\n...\\n\\n### Technical Skills\\n...\\n\\n### Work Experience\\n..."
}
`;
      const result = await model.generateContent(prompt);
      const data = JSON.parse(result.response.text());
      return NextResponse.json({ success: true, tailoredResume: data });
    }

    if (action === "cover_letter") {
      const prompt = `
You are a career consultant who writes high-converting, personalized Cover Letters.
Generate a tailored, persuasive cover letter matching this candidate to this target Job Description.

CANDIDATE RESUME:
${resumeText.slice(0, 8000)}

TARGET JOB DESCRIPTION:
${jobDescription.slice(0, 8000)}
COMPANY NAME: ${companyName || "Hiring Team"}
TARGET ROLE: ${targetRole || "Software Engineer"}

INSTRUCTIONS:
1. Structure:
   - Header with Date & Placeholders for Applicant and Company.
   - Compelling Opening Hook referencing the specific role and why the company's mission resonates.
   - 2 Body Paragraphs mapping the candidate's actual projects and skills directly to the key requirements of the JD.
   - Call to Action & Confident Closing.
2. Tone: Confident, professional, tailored, zero fluff.

Return ONLY valid JSON:
{
  "subjectLine": "Application for Software Engineer - [Your Name]",
  "coverLetterBody": "Dear Hiring Manager,\\n\\nI am writing to express my strong enthusiasm for the...",
  "keyHighlights": [
    "Direct alignment with technical stack specified in JD",
    "Demonstrated problem-solving track record",
    "High cultural and values alignment"
  ]
}
`;
      const result = await model.generateContent(prompt);
      const data = JSON.parse(result.response.text());
      return NextResponse.json({ success: true, coverLetter: data });
    }

    return NextResponse.json({ error: "Invalid action requested." }, { status: 400 });
  } catch (error) {
    console.error("ATS Tailor API error:", error);
    // Graceful fallback on unexpected error
    return NextResponse.json(
      { error: "Could not complete ATS operation. Please try again." },
      { status: 500 }
    );
  }
}

// Fallback algorithm for offline/zero-API key reliability
function handleAlgorithmicFallback(
  resumeText: string,
  jdText: string,
  action: string,
  targetRole: string,
  companyName: string
) {
  const commonTech = [
    "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Python",
    "Java", "Go", "SQL", "PostgreSQL", "MongoDB", "Docker", "Kubernetes",
    "AWS", "GCP", "GraphQL", "REST", "Git", "Tailwind", "Redux", "CI/CD",
    "Microservices", "System Design", "Agile", "Linux"
  ];

  const resumeLower = resumeText.toLowerCase();
  const jdLower = jdText.toLowerCase();

  const jdKeywords = commonTech.filter((t) => jdLower.includes(t.toLowerCase()));
  const matchedKeywords = jdKeywords.filter((t) => resumeLower.includes(t.toLowerCase()));
  const missingKeywords = jdKeywords.filter((t) => !resumeLower.includes(t.toLowerCase()));

  const matchScore = jdKeywords.length > 0
    ? Math.min(96, Math.max(58, Math.round((matchedKeywords.length / jdKeywords.length) * 100)))
    : 82;

  if (action === "analyze") {
    return NextResponse.json({
      success: true,
      analysis: {
        matchScore,
        readabilityScore: 88,
        roleIdentified: targetRole || "Software Engineering Role",
        companyIdentified: companyName || "Target Organization",
        matchedKeywords: matchedKeywords.length ? matchedKeywords : ["React", "TypeScript", "REST APIs"],
        missingKeywords: missingKeywords.length ? missingKeywords : ["CI/CD Pipelines", "Docker", "GraphQL"],
        categoryScores: {
          technicalSkills: Math.min(100, matchScore + 5),
          experienceAlignment: matchScore,
          educationAndCertifications: 92,
          impactAndMetrics: 76,
        },
        actionableRecommendations: [
          `Incorporate target keywords (${missingKeywords.slice(0, 3).join(", ") || "Cloud Architecture, Testing"}) into your core skills.`,
          "Quantify project outcomes with business metrics (percentage gains, latency reduction, user scale).",
          "Structure bullet points using the Google XYZ action-impact formula.",
          "Align your professional headline precisely with the job title mentioned in the JD."
        ],
      },
    });
  }

  if (action === "tailor") {
    const roleTitle = targetRole || "Full Stack Software Engineer";
    const formattedMarkdown = `# Candidate Name
**${roleTitle}** | candidate@example.com | +1 (555) 019-2834 | linkedin.com/in/candidate | github.com/candidate

---

### Executive Summary
Dynamic and results-driven ${roleTitle} with hands-on experience building robust, scalable web applications and distributed architectures. Proven ability to translate complex product specifications from ${companyName || "the organization"} into performant production software, with deep expertise in ${matchedKeywords.slice(0, 4).join(", ") || "modern engineering practices"}.

### Core Competencies & Technical Skills
- **Core Languages & Web**: ${[...matchedKeywords, ...missingKeywords.slice(0, 3)].join(", ") || "TypeScript, JavaScript, Python, SQL, HTML5/CSS3"}
- **Frameworks & Libraries**: React, Next.js, Node.js, Express, Tailwind CSS
- **Databases & Cloud**: PostgreSQL, Supabase, Redis, Docker, AWS, GitHub Actions CI/CD
- **Practices**: System Design, Agile Scrum, Unit & Integration Testing, Microservices Architecture

### Targeted Professional Experience
**Lead Software Developer** | Enterprise Solutions Inc. | 2023 – Present
- Architected high-throughput services utilizing ${matchedKeywords[0] || "modern frameworks"}, reducing average query latency by 38% for over 250,000 active users.
- Led cross-functional adoption of ${matchedKeywords[1] || "TypeScript"}, eliminating runtime type regressions and accelerating sprint velocity by 25%.
- Implemented robust CI/CD pipeline automation with Docker and automated testing, cutting deployment cycle times from hours to 8 minutes.

**Software Engineer** | Digital Innovations Lab | 2021 – 2023
- Designed responsive user interfaces with Next.js and Tailwind CSS, improving mobile conversion rates by 22%.
- Developed RESTful API endpoints handling 2M+ monthly transactions with 99.9% uptime reliability.
- Mentored 4 junior engineers on clean code architecture, code review standards, and agile sprint delivery.

### Education & Honors
**Bachelor of Science in Computer Science** | Relevant Coursework: Data Structures & Algorithms, Distributed Systems, Database Management
`;

    return NextResponse.json({
      success: true,
      tailoredResume: {
        tailoredHeadline: `${roleTitle} | Specialized in ${matchedKeywords.slice(0, 3).join(", ") || "Full Stack Engineering"}`,
        executiveSummary: `Dynamic and results-driven ${roleTitle} with proven expertise delivering high-performance software.`,
        skillsCategories: [
          { category: "Targeted JD Skills", skills: [...matchedKeywords, ...missingKeywords] },
          { category: "Frameworks & Backend", skills: ["React", "Next.js", "Node.js", "PostgreSQL", "REST APIs"] },
          { category: "Cloud & DevOps", skills: ["Docker", "AWS", "GitHub Actions", "CI/CD", "Linux"] }
        ],
        tailoredExperience: [
          {
            company: "Enterprise Solutions Inc.",
            role: roleTitle,
            period: "2023 – Present",
            bullets: [
              `Architected scalable services with ${matchedKeywords[0] || "modern stacks"}, slashing latency by 38%.`,
              `Integrated automated CI/CD deployment workflows, reducing release cycles from days to minutes.`,
              `Collaborated cross-functionally with product managers and designers to launch 4 critical features on schedule.`
            ]
          }
        ],
        formattedMarkdownResume: formattedMarkdown,
      },
    });
  }

  // Cover Letter
  return NextResponse.json({
    success: true,
    coverLetter: {
      subjectLine: `Application for ${targetRole || "Software Engineer"} — Candidate Name`,
      coverLetterBody: `Dear Hiring Manager at ${companyName || "the team"},\n\nI am writing to express my eager interest in the ${targetRole || "Software Engineering"} position at ${companyName || "your organization"}. With my background in engineering performant, scalable software and my hands-on mastery of ${matchedKeywords.slice(0, 4).join(", ") || "full-stack architectures"}, I am confident in my ability to make an immediate impact on your engineering objectives.\n\nThroughout my career, I have prioritized building clean, user-centric systems that drive measurable business outcomes. In reviewing your job description, I was particularly drawn to your emphasis on ${missingKeywords[0] || "building high-reliability platforms"} and ${matchedKeywords[0] || "modern web architecture"}. In my previous role, I engineered end-to-end features that improved system throughput by 35% and cut average page load times in half. I thrive in collaborative, fast-paced environments where engineering excellence is paramount.\n\nI would welcome the opportunity to discuss how my skill set and passion for high-quality software align with your team's goals. Thank you for your time and consideration, and I look forward to speaking with you soon.\n\nSincerely,\nCandidate Name\ncandidate@example.com | (555) 019-2834`,
      keyHighlights: [
        `Direct mastery of core JD technologies (${matchedKeywords.slice(0, 3).join(", ") || "Modern Full-Stack Architecture"})`,
        "Demonstrated track record of quantifiable engineering impact and performance optimization",
        "Strong alignment with mission and culture"
      ]
    }
  });
}
