export async function aiPrompt({
  prompt,
}: {
  prompt: string
}) {
  const trimmed = prompt.trim()
  if (!trimmed) {
    throw new Error("AI Prompt: enter a prompt for this step")
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is missing from the Trigger.dev environment. Add it as a secret and redeploy the task."
    )
  }

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash"
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: trimmed }] }],
      generationConfig: { temperature: 0.2 },
    }),
    }
  )

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    error?: { message?: string }
  }

  if (!response.ok) {
    throw new Error(
      `Gemini request failed (${response.status}): ${payload.error?.message ?? "Unknown error"}`
    )
  }

  const result = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim()
  if (!result) throw new Error("Gemini returned an empty result")

  return { result, model }
}