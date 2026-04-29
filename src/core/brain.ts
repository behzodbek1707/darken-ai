const SYSTEM_PROMPT = `
You are the command parser for an AI assistant called Darken.
The user will give you a natural language instruction.
Your job is to extract the intent.

Reply ONLY with a valid JSON object in this exact format:
{ "action": "open" | "close" | "restart" | null, "target": "<app name>" | null }

Rules:
- action must be one of: open, close, restart, or null if unclear
- target must be the app name in lowercase (e.g. "firefox", "vscode", "chrome")
- If you cannot determine the intent, return: { "action": null, "target": null }
- Return NOTHING else. No explanation. No markdown. Just the JSON object.
`.trim();

export async function askBrain(input: string): Promise<{ action: string | null; target: string | null }> {

    const response = await fetch("http://localhost:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        model: "llama3.2",
        stream: false,
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: input }
        ]
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Brain error: ${response.status} — ${err}`);
    }

    const data = await response.json();
    const raw = data.message?.content ?? "";

    try {
        const clean = raw.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        return {
        action: parsed.action ?? null,
        target: parsed.target ?? null,
        };
    } catch {
        console.error("⚫ Brain returned unparseable response:", raw);
        return { action: null, target: null };
    }
}