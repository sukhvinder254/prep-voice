
"use client";

export type TailoredResume = {
  headline: string;
  professionalSummary: string;
  skills: string[];
  education: {
    degree: string;
    institution: string;
    dates: string;
    details: string[];
  }[];
  experience: {
    role: string;
    company: string;
    dates: string;
    bullets: string[];
  }[];
  projects: {
    name: string;
    technologies: string[];
    bullets: string[];
  }[];
  certifications: string[];
  achievements: string[];
};

type Props = {
  resume: TailoredResume;
  onChange: (resume: TailoredResume) => void;
};

export default function ResumeEditor({ resume, onChange }: Props) {
  const update = (changes: Partial<TailoredResume>) => {
    onChange({ ...resume, ...changes });
  };

  const fieldClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

  const labelClass =
    "mb-1.5 block text-xs font-bold text-slate-600";

  const sectionClass =
    "rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5";

  const updateListItem = (
    key: "skills" | "certifications" | "achievements",
    index: number,
    value: string
  ) => {
    const updated = [...resume[key]];
    updated[index] = value;
    update({ [key]: updated });
  };

  const removeListItem = (
    key: "skills" | "certifications" | "achievements",
    index: number
  ) => {
    update({
      [key]: resume[key].filter((_, i) => i !== index),
    });
  };

  const addListItem = (
    key: "skills" | "certifications" | "achievements"
  ) => {
    update({ [key]: [...resume[key], ""] });
  };

  const updateEducation = (
    index: number,
    field: "degree" | "institution" | "dates",
    value: string
  ) => {
    const updated = [...resume.education];
    updated[index] = { ...updated[index], [field]: value };
    update({ education: updated });
  };

  const updateEducationDetail = (
    index: number,
    detailIndex: number,
    value: string
  ) => {
    const updated = [...resume.education];
    const details = [...updated[index].details];
    details[detailIndex] = value;
    updated[index] = { ...updated[index], details };
    update({ education: updated });
  };

  const updateExperience = (
    index: number,
    field: "role" | "company" | "dates",
    value: string
  ) => {
    const updated = [...resume.experience];
    updated[index] = { ...updated[index], [field]: value };
    update({ experience: updated });
  };

  const updateExperienceBullet = (
    index: number,
    bulletIndex: number,
    value: string
  ) => {
    const updated = [...resume.experience];
    const bullets = [...updated[index].bullets];
    bullets[bulletIndex] = value;
    updated[index] = { ...updated[index], bullets };
    update({ experience: updated });
  };

  const updateProject = (
    index: number,
    field: "name",
    value: string
  ) => {
    const updated = [...resume.projects];
    updated[index] = { ...updated[index], [field]: value };
    update({ projects: updated });
  };

  const updateProjectList = (
    index: number,
    field: "technologies" | "bullets",
    itemIndex: number,
    value: string
  ) => {
    const updated = [...resume.projects];
    const items = [...updated[index][field]];
    items[itemIndex] = value;
    updated[index] = { ...updated[index], [field]: items };
    update({ projects: updated });
  };

  const addProject = () => {
    update({
      projects: [
        ...resume.projects,
        { name: "", technologies: [], bullets: [] },
      ],
    });
  };

  const addEducation = () => {
    update({
      education: [
        ...resume.education,
        { degree: "", institution: "", dates: "", details: [] },
      ],
    });
  };

  const addExperience = () => {
    update({
      experience: [
        ...resume.experience,
        { role: "", company: "", dates: "", bullets: [] },
      ],
    });
  };

  const removeEntry = (
    key: "education" | "experience" | "projects",
    index: number
  ) => {
    if (key === "education") {
      update({
        education: resume.education.filter((_, i) => i !== index),
      });
    } else if (key === "experience") {
      update({
        experience: resume.experience.filter((_, i) => i !== index),
      });
    } else {
      update({
        projects: resume.projects.filter((_, i) => i !== index),
      });
    }
  };

  const addEducationDetail = (index: number) => {
    const updated = [...resume.education];
    updated[index] = {
      ...updated[index],
      details: [...updated[index].details, ""],
    };
    update({ education: updated });
  };

  const removeEducationDetail = (index: number, itemIndex: number) => {
    const updated = [...resume.education];
    updated[index] = {
      ...updated[index],
      details: updated[index].details.filter((_, i) => i !== itemIndex),
    };
    update({ education: updated });
  };

  const addExperienceBullet = (index: number) => {
    const updated = [...resume.experience];
    updated[index] = {
      ...updated[index],
      bullets: [...updated[index].bullets, ""],
    };
    update({ experience: updated });
  };

  const removeExperienceBullet = (index: number, itemIndex: number) => {
    const updated = [...resume.experience];
    updated[index] = {
      ...updated[index],
      bullets: updated[index].bullets.filter((_, i) => i !== itemIndex),
    };
    update({ experience: updated });
  };

  const addProjectItem = (
    index: number,
    field: "technologies" | "bullets"
  ) => {
    const updated = [...resume.projects];

    if (field === "technologies") {
      updated[index] = {
        ...updated[index],
        technologies: [...updated[index].technologies, ""],
      };
    } else {
      updated[index] = {
        ...updated[index],
        bullets: [...updated[index].bullets, ""],
      };
    }

    update({ projects: updated });
  };

  const removeProjectItem = (
    index: number,
    field: "technologies" | "bullets",
    itemIndex: number
  ) => {
    const updated = [...resume.projects];

    if (field === "technologies") {
      updated[index] = {
        ...updated[index],
        technologies: updated[index].technologies.filter(
          (_, i) => i !== itemIndex
        ),
      };
    } else {
      updated[index] = {
        ...updated[index],
        bullets: updated[index].bullets.filter(
          (_, i) => i !== itemIndex
        ),
      };
    }

    update({ projects: updated });
  };

  const renderSimpleList = (
    title: string,
    key: "skills" | "certifications" | "achievements",
    placeholder: string
  ) => (
    <section className={sectionClass}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
        <button
          type="button"
          onClick={() => addListItem(key)}
          className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
        >
          + Add
        </button>
      </div>

      <div className="space-y-2">
        {resume[key].map((item, index) => (
          <div key={index} className="flex gap-2">
            <input
              className={fieldClass}
              value={item}
              placeholder={placeholder}
              onChange={(e) => updateListItem(key, index, e.target.value)}
            />
            <button
              type="button"
              onClick={() => removeListItem(key, index)}
              className="shrink-0 rounded-lg px-3 text-sm font-bold text-rose-600 hover:bg-rose-50"
              aria-label={`Remove ${title} item`}
            >
              ✕
            </button>
          </div>
        ))}

        {!resume[key].length && (
          <p className="text-xs text-slate-400">
            No entries yet. Click Add to create one.
          </p>
        )}
      </div>
    </section>
  );

  return (
    <div className="mt-7 space-y-5">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
            Customise your resume
          </span>
          <h3 className="mt-1 text-lg font-extrabold text-slate-900">
            Resume Editor
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Changes automatically update your resume preview and downloads.
          </p>
        </div>
        <span className="w-fit rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700">
          LIVE EDITING
        </span>
      </div>

      <section className={sectionClass}>
        <h3 className="mb-4 text-sm font-extrabold text-slate-900">
          Basic Information
        </h3>

        <label className={labelClass}>Resume Headline</label>
        <input
          className={fieldClass}
          value={resume.headline}
          onChange={(e) => update({ headline: e.target.value })}
          placeholder="Software Developer"
        />

        <label className={`${labelClass} mt-4`}>Professional Summary</label>
        <textarea
          className={`${fieldClass} min-h-32 resize-y leading-6`}
          value={resume.professionalSummary}
          onChange={(e) => update({ professionalSummary: e.target.value })}
          placeholder="Write a concise professional summary..."
        />
      </section>

      {renderSimpleList("Technical Skills", "skills", "e.g. React, Python, SQL")}

      <section className={sectionClass}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-sm font-extrabold text-slate-900">Education</h3>
          <button
            type="button"
            onClick={addEducation}
            className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
          >
            + Add Education
          </button>
        </div>

        {resume.education.map((item, index) => (
          <div key={index} className="mb-4 rounded-lg border border-slate-200 bg-white p-4 last:mb-0">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500">
                Education {index + 1}
              </p>
              <button
                type="button"
                onClick={() => removeEntry("education", index)}
                className="text-xs font-bold text-rose-600"
              >
                Remove
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Degree</label>
                <input
                  className={fieldClass}
                  value={item.degree}
                  onChange={(e) => updateEducation(index, "degree", e.target.value)}
                  placeholder="B.Tech Computer Science"
                />
              </div>
              <div>
                <label className={labelClass}>Dates</label>
                <input
                  className={fieldClass}
                  value={item.dates}
                  onChange={(e) => updateEducation(index, "dates", e.target.value)}
                  placeholder="2025 - 2029"
                />
              </div>
            </div>

            <label className={`${labelClass} mt-3`}>Institution</label>
            <input
              className={fieldClass}
              value={item.institution}
              onChange={(e) => updateEducation(index, "institution", e.target.value)}
              placeholder="University name"
            />

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <label className={labelClass}>Details</label>
                <button
                  type="button"
                  onClick={() => addEducationDetail(index)}
                  className="text-xs font-bold text-indigo-600"
                >
                  + Add detail
                </button>
              </div>
              {item.details.map((detail, detailIndex) => (
                <div key={detailIndex} className="mb-2 flex gap-2">
                  <input
                    className={fieldClass}
                    value={detail}
                    onChange={(e) =>
                      updateEducationDetail(index, detailIndex, e.target.value)
                    }
                    placeholder="Relevant coursework, grades or details"
                  />
                  <button
                    type="button"
                    onClick={() => removeEducationDetail(index, detailIndex)}
                    className="px-2 text-rose-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {!resume.education.length && (
          <p className="text-xs text-slate-400">No education entries yet.</p>
        )}
      </section>

      <section className={sectionClass}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-sm font-extrabold text-slate-900">Experience</h3>
          <button
            type="button"
            onClick={addExperience}
            className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
          >
            + Add Experience
          </button>
        </div>

        {resume.experience.map((item, index) => (
          <div key={index} className="mb-4 rounded-lg border border-slate-200 bg-white p-4 last:mb-0">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500">
                Experience {index + 1}
              </p>
              <button
                type="button"
                onClick={() => removeEntry("experience", index)}
                className="text-xs font-bold text-rose-600"
              >
                Remove
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Role</label>
                <input
                  className={fieldClass}
                  value={item.role}
                  onChange={(e) => updateExperience(index, "role", e.target.value)}
                  placeholder="Software Developer Intern"
                />
              </div>
              <div>
                <label className={labelClass}>Company</label>
                <input
                  className={fieldClass}
                  value={item.company}
                  onChange={(e) => updateExperience(index, "company", e.target.value)}
                  placeholder="Company name"
                />
              </div>
            </div>

            <label className={`${labelClass} mt-3`}>Dates</label>
            <input
              className={fieldClass}
              value={item.dates}
              onChange={(e) => updateExperience(index, "dates", e.target.value)}
              placeholder="June 2025 - August 2025"
            />

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <label className={labelClass}>Responsibilities / Achievements</label>
                <button
                  type="button"
                  onClick={() => addExperienceBullet(index)}
                  className="text-xs font-bold text-indigo-600"
                >
                  + Add bullet
                </button>
              </div>
              {item.bullets.map((bullet, bulletIndex) => (
                <div key={bulletIndex} className="mb-2 flex gap-2">
                  <textarea
                    className={`${fieldClass} min-h-16 resize-y`}
                    value={bullet}
                    onChange={(e) =>
                      updateExperienceBullet(index, bulletIndex, e.target.value)
                    }
                    placeholder="Describe your contribution or achievement"
                  />
                  <button
                    type="button"
                    onClick={() => removeExperienceBullet(index, bulletIndex)}
                    className="px-2 text-rose-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {!resume.experience.length && (
          <p className="text-xs text-slate-400">No experience entries yet.</p>
        )}
      </section>

      <section className={sectionClass}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-sm font-extrabold text-slate-900">Projects</h3>
          <button
            type="button"
            onClick={addProject}
            className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
          >
            + Add Project
          </button>
        </div>

        {resume.projects.map((item, index) => (
          <div key={index} className="mb-4 rounded-lg border border-slate-200 bg-white p-4 last:mb-0">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500">
                Project {index + 1}
              </p>
              <button
                type="button"
                onClick={() => removeEntry("projects", index)}
                className="text-xs font-bold text-rose-600"
              >
                Remove
              </button>
            </div>

            <label className={labelClass}>Project Name</label>
            <input
              className={fieldClass}
              value={item.name}
              onChange={(e) => updateProject(index, "name", e.target.value)}
              placeholder="Project name"
            />

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <label className={labelClass}>Technologies</label>
                <button
                  type="button"
                  onClick={() => addProjectItem(index, "technologies")}
                  className="text-xs font-bold text-indigo-600"
                >
                  + Add technology
                </button>
              </div>
              {item.technologies.map((technology, technologyIndex) => (
                <div key={technologyIndex} className="mb-2 flex gap-2">
                  <input
                    className={fieldClass}
                    value={technology}
                    onChange={(e) =>
                      updateProjectList(index, "technologies", technologyIndex, e.target.value)
                    }
                    placeholder="React, Node.js, MongoDB"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      removeProjectItem(index, "technologies", technologyIndex)
                    }
                    className="px-2 text-rose-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <label className={labelClass}>Project Details</label>
                <button
                  type="button"
                  onClick={() => addProjectItem(index, "bullets")}
                  className="text-xs font-bold text-indigo-600"
                >
                  + Add bullet
                </button>
              </div>
              {item.bullets.map((bullet, bulletIndex) => (
                <div key={bulletIndex} className="mb-2 flex gap-2">
                  <textarea
                    className={`${fieldClass} min-h-16 resize-y`}
                    value={bullet}
                    onChange={(e) =>
                      updateProjectList(index, "bullets", bulletIndex, e.target.value)
                    }
                    placeholder="Describe what the project does and your contribution"
                  />
                  <button
                    type="button"
                    onClick={() => removeProjectItem(index, "bullets", bulletIndex)}
                    className="px-2 text-rose-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {!resume.projects.length && (
          <p className="text-xs text-slate-400">No projects added yet.</p>
        )}
      </section>

      {renderSimpleList("Certifications", "certifications", "Certification name")}

      {renderSimpleList(
        "Achievements",
        "achievements",
        "Achievement or accomplishment"
      )}

      <p className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
        Review all information carefully. Only include skills, experience,
        qualifications and achievements that are accurate and that you can
        support.
      </p>
    </div>
  );
}
