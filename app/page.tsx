import Link from "next/link";
import { listSessions } from "@/lib/services/session-service";
import { formatDate } from "@/lib/utils";

export default async function HomePage() {
  let recentSessions: Awaited<ReturnType<typeof listSessions>> = [];
  try {
    recentSessions = await listSessions();
  } catch {
    // DB not initialized yet — fine on first load before npm install
  }

  return (
    <div className="space-y-10">
      <section className="card text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Prepare for your next interview
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-gray-600">
          MockIt predicts likely questions for your specific company, school, and
          industry, runs realistic mock interviews (text or voice), scores answers
          with structured rubrics, and coaches you through a personalized dashboard.
        </p>
        <div className="mt-6">
          <Link href="/sessions/new" className="btn-primary">
            Start new session
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            title: "Predict questions",
            desc: "Tailored to company, school, industry, and your profile — with rationale.",
          },
          {
            title: "Mock interview",
            desc: "Text or voice mode, dynamic follow-ups, and push-harder coaching.",
          },
          {
            title: "Coaching dashboard",
            desc: "Structured rubrics, priority improvements, and action plans.",
          },
        ].map((item) => (
          <div key={item.title} className="card">
            <h2 className="font-semibold text-gray-900">{item.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
          </div>
        ))}
      </section>

      <section className="card">
        <h2 className="mb-3 font-semibold">Built for</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          {[
            "Students",
            "MBA applicants",
            "Consulting candidates",
            "Software engineering",
            "Career switchers",
            "Experienced professionals",
          ].map((label) => (
            <span key={label} className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
              {label}
            </span>
          ))}
        </div>
      </section>

      {recentSessions.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Recent sessions</h2>
          <ul className="space-y-2">
            {recentSessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/sessions/${s.id}/summary`}
                  className="card flex items-center justify-between py-4 transition hover:border-brand-300"
                >
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-sm text-gray-500">
                      {s.targetCompanyOrSchool} · {s.status}
                    </p>
                  </div>
                  <span className="text-sm text-gray-400">
                    {formatDate(s.updatedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
