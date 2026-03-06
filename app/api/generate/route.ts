import db from "../../../lib/db";

function slugify(str: string) {
  return (str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function safeJsonFromModel(text: string) {
  // 1) normalize
  let t = String(text || "").trim();

  // 2) remove markdown code fences if present
  t = t.replace(/```json/gi, "```").replace(/```/g, "").trim();

  // 3) try to extract the first JSON object block
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    t = t.slice(start, end + 1);
  }

  // 4) parse
  return JSON.parse(t);
}

export async function POST(req: Request) {
  const body = await req.json();

  const slug =
    slugify(body.name || "business") + "-" + Math.floor(Math.random() * 10000);

  const prompt = `
Return STRICT JSON only.
Do NOT include markdown.
Do NOT include backticks.
Do NOT include explanation text.

JSON format:
{
  "tagline": string,
  "about": string,
  "services_intro": string,
  "cta": string
}

Business Information:
Name: ${body.name}
Industry: ${body.industry}
Location: ${body.location}
Hours: ${body.hours}
Phone: ${body.phone}
Email: ${body.email}
Services: ${body.services}
FAQs:
${body.faqs}

Write short, professional website copy.
`;

  // default fallback (always valid)
  const fallbackGenerated = {
    tagline: `Welcome to ${body.name}`,
    about: `We are a ${body.industry} business located in ${body.location}.`,
    services_intro: `Here are the services we offer:`,
    cta: `Contact us to book or inquire.`,
  };

  // Call Ollama
  let modelText = "";
  try {
    const ollamaRes = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "phi3:mini", // MUST match `ollama list`
        prompt,
        stream: false,
      }),
    });

    const raw = await ollamaRes.json();
    modelText = raw?.response || "";
  } catch (e) {
    console.error("Ollama fetch failed:", e);
  }

  // Parse model output into JSON
  let generated = fallbackGenerated;
  if (modelText.trim()) {
    try {
      const parsed = safeJsonFromModel(modelText);

      generated = {
        tagline: String(parsed.tagline || fallbackGenerated.tagline),
        about: String(parsed.about || fallbackGenerated.about),
        services_intro: String(parsed.services_intro || fallbackGenerated.services_intro),
        cta: String(parsed.cta || fallbackGenerated.cta),
      };
    } catch (e) {
      console.error("Model JSON parse failed, using fallback:", e);
    }
  }

  // Save to DB
  const stmt = db.prepare(`
    INSERT INTO business
      (slug, name, industry, location, hours, phone, email, services, faqs, generated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    slug,
    body.name,
    body.industry,
    body.location,
    body.hours,
    body.phone,
    body.email,
    body.services,
    body.faqs,
    JSON.stringify(generated)
  );

  return Response.json({ ok: true, slug });
}