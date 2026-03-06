import db from "../../../lib/db";
import ChatWidget from "./ChatWidget";

export default async function SitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const row = db
    .prepare("SELECT * FROM business WHERE slug = ?")
    .get(slug) as any;

  if (!row) return <div style={{ padding: 40 }}>Not found</div>;

  const generated = JSON.parse(row.generated || "{}");
  const services = (row.services || "")
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", fontFamily: "Arial", padding: 16 }}>
      <h1 style={{ fontSize: 40 }}>{row.name}</h1>
      <p style={{ fontSize: 18, opacity: 0.8 }}>{generated.tagline}</p>

      <section style={{ marginTop: 30 }}>
        <h2>About</h2>
        <p>{generated.about}</p>
      </section>

      <section style={{ marginTop: 30 }}>
        <h2>Services</h2>
        <p>{generated.services_intro}</p>
        <ul>
          {services.map((s: string) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 30 }}>
        <h2>Contact</h2>
        <p><b>Location:</b> {row.location}</p>
        <p><b>Hours:</b> {row.hours}</p>
        <p><b>Phone:</b> {row.phone}</p>
        <p><b>Email:</b> {row.email}</p>
        <p style={{ marginTop: 16, fontWeight: 700 }}>{generated.cta}</p>
      </section>
      <ChatWidget slug={slug} />
    </main>
  );
}