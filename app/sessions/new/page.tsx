import { IntakeForm } from "@/components/IntakeForm";

export default function NewSessionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New session</h1>
        <p className="mt-1 text-gray-600">
          Share your background and target — MockIt will predict likely questions.
        </p>
      </div>
      <IntakeForm />
    </div>
  );
}
