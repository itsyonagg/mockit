"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  INDUSTRIES,
  INDUSTRY_LABELS,
  PERSONA_DEFAULT_INTERVIEW,
  PERSONA_DESCRIPTIONS,
  PERSONA_LABELS,
  USER_PERSONAS,
  type Industry,
  type UserPersona,
} from "@/lib/constants/personas";
import {
  INTERVIEW_TYPE_LABELS,
} from "@/lib/validations/session";

const INTERVIEW_TYPES = Object.keys(INTERVIEW_TYPE_LABELS) as Array<
  keyof typeof INTERVIEW_TYPE_LABELS
>;

const ACCEPTED_DOCS = ".pdf,.docx,.txt,.md";

function ModeToggle({
  mode,
  onChange,
}: {
  mode: "upload" | "paste";
  onChange: (mode: "upload" | "paste") => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 p-0.5 text-xs">
      <button
        type="button"
        onClick={() => onChange("upload")}
        className={`rounded-md px-3 py-1.5 ${
          mode === "upload" ? "bg-brand-600 text-white" : "text-gray-600"
        }`}
      >
        Upload file
      </button>
      <button
        type="button"
        onClick={() => onChange("paste")}
        className={`rounded-md px-3 py-1.5 ${
          mode === "paste" ? "bg-brand-600 text-white" : "text-gray-600"
        }`}
      >
        Paste text
      </button>
    </div>
  );
}

export function IntakeForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [persona, setPersona] = useState<UserPersona | "">("");
  const [interviewType, setInterviewType] = useState<string>("behavioral");
  const [resumeMode, setResumeMode] = useState<"upload" | "paste">("upload");
  const [personalStatementMode, setPersonalStatementMode] = useState<"upload" | "paste">("upload");

  function handlePersonaChange(value: string) {
    setPersona(value as UserPersona | "");
    if (value && PERSONA_DEFAULT_INTERVIEW[value as UserPersona]) {
      setInterviewType(PERSONA_DEFAULT_INTERVIEW[value as UserPersona]!);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    if (resumeMode === "upload") {
      formData.delete("resumeText");
    } else {
      formData.delete("resumeFile");
    }

    if (personalStatementMode === "upload") {
      formData.delete("personalStatement");
    } else {
      formData.delete("personalStatementFile");
    }

    try {
      const res = await fetch("/api/v1/sessions", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create session");

      await fetch(`/api/v1/sessions/${data.sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analyze" }),
      });

      router.push(`/sessions/${data.sessionId}/questions`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-8">
      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">About you</h2>
        <div>
          <label className="label" htmlFor="userPersona">
            I am a…
          </label>
          <select
            id="userPersona"
            name="userPersona"
            value={persona}
            onChange={(e) => handlePersonaChange(e.target.value)}
            className="input-field"
          >
            <option value="">Select your profile (optional)</option>
            {USER_PERSONAS.map((p) => (
              <option key={p} value={p}>
                {PERSONA_LABELS[p]}
              </option>
            ))}
          </select>
          {persona && (
            <p className="mt-1 text-xs text-gray-500">
              {PERSONA_DESCRIPTIONS[persona]}
            </p>
          )}
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">Target</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="targetCompanyOrSchool">
              Company / school *
            </label>
            <input
              id="targetCompanyOrSchool"
              name="targetCompanyOrSchool"
              required
              className="input-field"
              placeholder="McKinsey, Stanford GSB, Google..."
            />
          </div>
          <div>
            <label className="label" htmlFor="targetRoleOrProgram">
              Role / program *
            </label>
            <input
              id="targetRoleOrProgram"
              name="targetRoleOrProgram"
              required
              className="input-field"
              placeholder="Business Analyst, MBA, PM..."
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="targetIndustry">
              Industry
            </label>
            <select id="targetIndustry" name="targetIndustry" className="input-field">
              <option value="">Select industry (optional)</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {INDUSTRY_LABELS[ind]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="interviewType">
              Interview type *
            </label>
            <select
              id="interviewType"
              name="interviewType"
              required
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value)}
              className="input-field"
            >
              {INTERVIEW_TYPES.map((t) => (
                <option key={t} value={t}>
                  {INTERVIEW_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="specificConcerns">
            Specific concerns (optional)
          </label>
          <textarea
            id="specificConcerns"
            name="specificConcerns"
            rows={2}
            className="input-field"
            placeholder="Tell me about yourself, STAR stories, case structure..."
          />
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold">Materials</h2>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="label mb-0" htmlFor="resumeFile">
              Resume / CV *
            </label>
            <ModeToggle mode={resumeMode} onChange={setResumeMode} />
          </div>
          {resumeMode === "upload" ? (
            <>
              <input
                id="resumeFile"
                name="resumeFile"
                type="file"
                accept={ACCEPTED_DOCS}
                required
                className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
              />
              <p className="text-xs text-gray-500">PDF, DOCX, TXT, or MD — max 10 MB</p>
            </>
          ) : (
            <textarea
              id="resumeText"
              name="resumeText"
              required
              minLength={100}
              rows={8}
              className="input-field font-mono text-xs"
              placeholder="Paste your resume text here..."
            />
          )}
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="label mb-0" htmlFor="personalStatementFile">
              Personal statement (optional)
            </label>
            <ModeToggle mode={personalStatementMode} onChange={setPersonalStatementMode} />
          </div>
          {personalStatementMode === "upload" ? (
            <>
              <input
                id="personalStatementFile"
                name="personalStatementFile"
                type="file"
                accept={ACCEPTED_DOCS}
                className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
              />
              <p className="text-xs text-gray-500">PDF, DOCX, TXT, or MD — max 10 MB</p>
            </>
          ) : (
            <textarea
              id="personalStatement"
              name="personalStatement"
              rows={5}
              className="input-field font-mono text-xs"
              placeholder="Paste your personal statement..."
            />
          )}
        </div>

        <div>
          <label className="label" htmlFor="linkedinUrl">
            LinkedIn profile URL
          </label>
          <input
            id="linkedinUrl"
            name="linkedinUrl"
            type="url"
            className="input-field"
            placeholder="https://www.linkedin.com/in/your-profile"
          />
          <p className="mt-1 text-xs text-gray-500">
            Paste your public LinkedIn profile link.
          </p>
        </div>

        <div>
          <label className="label" htmlFor="jobOrProgramDescription">
            Job / program description
          </label>
          <textarea
            id="jobOrProgramDescription"
            name="jobOrProgramDescription"
            rows={6}
            className="input-field font-mono text-xs"
            placeholder="Paste the job posting or program description..."
          />
        </div>
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
        {loading ? "Analyzing..." : "Analyze & predict questions"}
      </button>
    </form>
  );
}
