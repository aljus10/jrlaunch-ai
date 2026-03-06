"use client";

import { useEffect, useState } from "react";
import ChatWidget from "../site/[slug]/ChatWidget";

type PreviewData = {
  slug: string;
  name: string;
  industry: string;
  location: string;
  hours: string;
  phone: string;
  email: string;
  services: string;
  faqs: string;
  generated: {
    tagline: string;
    about: string;
    services_intro: string;
    cta: string;
  };
};

export default function PreviewPage() {
  const [data, setData] = useState<PreviewData | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("jrlaunch_preview");
    if (raw) {
      try {
        setData(JSON.parse(raw));
      } catch {}
    }
  }, []);

  if (!data) {
    return (
      <main style={{ padding: 40, fontFamily: "Arial" }}>
        <h1>No preview data found.</h1>
        <p>Please go back and generate a website first.</p>
      </main>
    );
  }

  const services = (data.services || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", fontFamily: "Arial", padding: 16 }}>
      <h1 style={{ fontSize: 40 }}>{data.name}</h1>
      <p style={{ fontSize: 18, opacity: 0.8 }}>{data.generated.tagline}</p>

      <section style={{ marginTop: 30 }}>
        <h2>About</h2>
        <p>{data.generated.about}</p>
      </section>

      <section style={{ marginTop: 30 }}>
        <h2>Services</h2>
        <p>{data.generated.services_intro}</p>
        <ul>
          {services.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 30 }}>
        <h2>Contact</h2>
        <p><b>Location:</b> {data.location}</p>
        <p><b>Hours:</b> {data.hours}</p>
        <p><b>Phone:</b> {data.phone}</p>
        <p><b>Email:</b> {data.email}</p>
        <p style={{ marginTop: 16, fontWeight: 700 }}>{data.generated.cta}</p>
      </section>

      <ChatWidget slug={data.slug} businessData={data} />
    </main>
  );
}