import db from "../../../lib/db";

function slugify(str: string) {
  return (str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function cleanList(text: string) {
  return (text || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const slug =
      slugify(body.name || "business") + "-" + Math.floor(Math.random() * 10000);

    const services = cleanList(body.services || "");
    const primaryService = services[0] || "services";

    const generated = {
      tagline: `Trusted ${body.industry || "business"} solutions for your everyday needs.`,
      about: `${body.name || "This business"} is a ${body.industry || "local business"} based in ${body.location || "your area"}, committed to providing reliable ${primaryService.toLowerCase()} and quality customer service.`,
      services_intro: services.length
        ? `We offer the following services: ${services.join(", ")}.`
        : `We offer reliable services tailored to your needs.`,
      cta: body.phone
        ? `Contact us today at ${body.phone} for inquiries and bookings.`
        : `Contact us today for inquiries and bookings.`,
    };

    const stmt = db.prepare(`
      INSERT INTO business
        (slug, name, industry, location, hours, phone, email, services, faqs, generated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      slug,
      body.name || "",
      body.industry || "",
      body.location || "",
      body.hours || "",
      body.phone || "",
      body.email || "",
      body.services || "",
      body.faqs || "",
      JSON.stringify(generated)
    );

    return Response.json({ ok: true, slug });
  } catch (error) {
    console.error("GENERATE API ERROR:", error);
    return Response.json(
      { ok: false, error: "Failed to generate website." },
      { status: 500 }
    );
  }
}