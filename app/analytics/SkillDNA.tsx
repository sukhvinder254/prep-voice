
type Feedback = {
  relevance?: number | string | null;
  structure?: number | string | null;
  completeness?: number | string | null;
  technicalAccuracy?: number | string | null;
};

type Interview = {
  id: string;
  feedback: Feedback | string | null;
};

type SkillDNAProps = {
  interviews: Interview[];
};

const skills = [
  { key: "relevance", label: "Answer Relevance" },
  { key: "structure", label: "Answer Structure" },
  { key: "completeness", label: "Completeness" },
  { key: "technicalAccuracy", label: "Technical Accuracy" },
] as const;

function getFeedback(value: Feedback | string | null): Feedback | null {
  if (!value) return null;

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Feedback;
    } catch {
      return null;
    }
  }

  return value;
}

export default function SkillDNA({ interviews }: SkillDNAProps) {
  const results = skills.map((skill) => {
    const values = interviews
      .map((interview) => {
        const feedback = getFeedback(interview.feedback);
        const value = Number(feedback?.[skill.key]);

        return Number.isFinite(value) && feedback?.[skill.key] !== null &&
          feedback?.[skill.key] !== undefined &&
          feedback?.[skill.key] !== ""
          ? value
          : null;
      })
      .filter((value): value is number => value !== null);

    return {
      ...skill,
      average: values.length
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : null,
      count: values.length,
    };
  });

  const available = results.filter((item) => item.average !== null);

  const chartPoints = available.map((item, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(available.length, 1) - Math.PI / 2;
    const radius = 90 * ((item.average ?? 0) / 10);

    return {
      x: 110 + radius * Math.cos(angle),
      y: 110 + radius * Math.sin(angle),
    };
  });

  const polygon = chartPoints.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <section className="mt-8 rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold text-purple-600">PERFORMANCE INTELLIGENCE</p>
        <h2 className="mt-1 text-xl font-bold text-gray-800">Your Skill DNA</h2>
        <p className="mt-2 text-sm text-gray-500">
          A breakdown of your AI-evaluated interview skills.
        </p>
      </div>

      {available.length === 0 ? (
        <p className="py-8 text-center text-gray-400">
          Skill insights will appear when your interview feedback contains numeric skill scores.
        </p>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div className="flex justify-center">
            <svg viewBox="0 0 220 220" className="w-full max-w-xs" role="img" aria-label="Skill DNA radar chart">
              {[25, 50, 75, 100].map((scale) => (
                <circle
                  key={scale}
                  cx="110"
                  cy="110"
                  r={90 * (scale / 100)}
                  fill="none"
                  stroke="#e9d5ff"
                  strokeWidth="1"
                />
              ))}
              <line x1="110" y1="15" x2="110" y2="205" stroke="#e9d5ff" />
              <line x1="15" y1="110" x2="205" y2="110" stroke="#e9d5ff" />

              {available.length >= 3 && (
                <polygon
                  points={polygon}
                  fill="#a78bfa"
                  fillOpacity="0.3"
                  stroke="#7c3aed"
                  strokeWidth="2"
                />
              )}

              {chartPoints.map((point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="#7c3aed"
                />
              ))}

              <circle cx="110" cy="110" r="3" fill="#7c3aed" />
            </svg>
          </div>

          <div className="space-y-5">
            {results.map((skill) => (
              <div key={skill.key}>
                <div className="mb-2 flex justify-between gap-3 text-sm">
                  <span className="font-semibold text-gray-700">{skill.label}</span>
                  <span className="font-semibold text-purple-700">
                    {skill.average === null
                      ? "Not available"
                      : `${skill.average.toFixed(1)}/10`}
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-purple-100">
                  <div
                    className="h-full rounded-full bg-purple-600"
                    style={{
                      width: `${Math.max(0, Math.min(100, ((skill.average ?? 0) / 10) * 100))}%`,
                    }}
                  />
                </div>

                <p className="mt-1 text-xs text-gray-400">
                  Based on {skill.count} evaluated interviews
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
