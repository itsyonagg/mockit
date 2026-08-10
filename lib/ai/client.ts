import OpenAI from "openai";

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({ apiKey });
}

export function getModel() {
  return process.env.OPENAI_MODEL ?? "gpt-4o-mini";
}

export async function chatJson<T>(
  system: string,
  user: string,
): Promise<T> {
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: getModel(),
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");
  return JSON.parse(content) as T;
}
