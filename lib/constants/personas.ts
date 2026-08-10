export const USER_PERSONAS = [
  "student",
  "mba_applicant",
  "consulting",
  "software_engineering",
  "career_switcher",
  "experienced_professional",
] as const;

export type UserPersona = (typeof USER_PERSONAS)[number];

export const PERSONA_LABELS: Record<UserPersona, string> = {
  student: "Student / intern",
  mba_applicant: "MBA applicant",
  consulting: "Consulting candidate",
  software_engineering: "Software engineering",
  career_switcher: "Career switcher",
  experienced_professional: "Experienced professional",
};

export const PERSONA_DESCRIPTIONS: Record<UserPersona, string> = {
  student: "Internships, new grad, campus recruiting",
  mba_applicant: "Business school admissions and post-MBA roles",
  consulting: "Case, behavioral, and fit for MBB and boutique firms",
  software_engineering: "Technical screens, system design, coding narratives",
  career_switcher: "Pivot stories, transferable skills, motivation",
  experienced_professional: "Leadership, scope, executive presence",
};

export const INDUSTRIES = [
  "consulting",
  "technology",
  "finance",
  "healthcare",
  "consumer_retail",
  "education",
  "government_nonprofit",
  "manufacturing",
  "media_entertainment",
  "other",
] as const;

export type Industry = (typeof INDUSTRIES)[number];

export const INDUSTRY_LABELS: Record<Industry, string> = {
  consulting: "Consulting",
  technology: "Technology",
  finance: "Finance & banking",
  healthcare: "Healthcare & life sciences",
  consumer_retail: "Consumer & retail",
  education: "Education",
  government_nonprofit: "Government & nonprofit",
  manufacturing: "Manufacturing & industrials",
  media_entertainment: "Media & entertainment",
  other: "Other",
};

export const PERSONA_DEFAULT_INTERVIEW: Partial<Record<UserPersona, string>> = {
  mba_applicant: "admissions",
  consulting: "case",
  software_engineering: "technical",
};

export const PERSONA_QUESTION_HINTS: Record<UserPersona, string[]> = {
  student: [
    "Campus involvement and internship impact",
    "Learning agility and growth mindset",
    "Why this company/industry",
  ],
  mba_applicant: [
    "Why MBA, why now, why this school",
    "Leadership with measurable impact",
    "Post-MBA goals and recruiting strategy",
  ],
  consulting: [
    "Case structure and hypothesis-driven thinking",
    "Client impact and teamwork under pressure",
    "Why consulting and firm-specific fit",
  ],
  software_engineering: [
    "System design tradeoffs",
    "Debugging and ownership stories",
    "Technical depth vs communication balance",
  ],
  career_switcher: [
    "Motivation for pivot with credible bridge",
    "Transferable skills mapped to role",
    "Risk mitigation and learning plan",
  ],
  experienced_professional: [
    "Scope, stakeholders, and org impact",
    "Strategic decisions and tradeoffs",
    "Leadership philosophy and succession",
  ],
};
