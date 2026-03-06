import db from "../../../lib/db";

type ChatMessage = {
  role: "user" | "bot";
  text: string;
};

export async function POST(req: Request) {
  try {
    const { slug, question, history } = await req.json();

    if (!slug || !question) {
      return Response.json({ answer: "Missing slug or question." }, { status: 400 });
    }

    const row = db.prepare("SELECT * FROM business WHERE slug = ?").get(slug) as any;

    if (!row) {
      return Response.json({ answer: "Business not found." }, { status: 404 });
    }

    const safeHistory: ChatMessage[] = Array.isArray(history) ? history.slice(-6) : [];

    const historyText = safeHistory
      .map((m) => `${m.role === "user" ? "Customer" : "Assistant"}: ${m.text}`)
      .join("\n");

    const context = `
You are a customer support assistant for this business.

Use ONLY the business information, FAQs, and recent conversation below.
Reply with ONLY the final answer to the customer's latest message.

Rules:
- Be conversational and context-aware.
- If the customer says a greeting like "hi" or "hello", greet them briefly and ask how you can help.
- If the customer asks a follow-up like "ok then?" or "how about that?", use the recent conversation to understand what they mean.
- Do NOT explain your reasoning.
- Do NOT create examples unless asked.
- Keep the answer short, clear, and natural.
- Maximum 2 sentences.
- If the answer is not found, reply exactly:
I’m not sure. Please contact us.

Business Info:
Name: ${row.name}
Location: ${row.location}
Hours: ${row.hours}
Phone: ${row.phone}
Email: ${row.email}
Services: ${row.services}

FAQs:
${row.faqs}

Recent conversation:
${historyText}

Latest customer message:
${question}
`;

    const ollamaRes = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "phi3:mini",
        prompt: context,
        stream: false,
      }),
    });

    const raw = await ollamaRes.json();

    let answer = (raw?.response || "I’m not sure. Please contact us.").trim();

    answer = answer
      .replace(/^Answer:\s*/i, "")
      .replace(/^Bot:\s*/i, "")
      .replace(/^Response:\s*/i, "")
      .trim();

    return Response.json({ answer });
  } catch (error) {
    console.error("CHAT API ERROR:", error);
    return Response.json({ answer: "Server error in chatbot." }, { status: 500 });
  }
}