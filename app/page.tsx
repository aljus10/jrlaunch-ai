"use client";

import React, { useMemo, useState } from "react";

type FAQ = { q: string; a: string };

const COLORS = {
  bg: "#212A31",
  card: "#2E3944",
  accent: "#124E66",
  muted: "#748D92",
  text: "#D3D9D4",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function buildHours(days: string[], start: string, end: string) {
  if (!days.length || !start || !end) return "";
  return `${days.join(", ")} ${start}–${end}`;
}

function buildFaqsText(faqs: FAQ[]) {
  return faqs
    .map((f) => ({ q: f.q.trim(), a: f.a.trim() }))
    .filter((f) => f.q && f.a)
    .map((f) => `${f.q}|${f.a}`)
    .join("\n");
}

export default function Home() {
  const [form, setForm] = useState({
    name: "",
    industry: "",
    location: "",
    hours: "",
    phone: "",
    email: "",
    services: "",
    faqs: "",
  });

  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");

  const [faqsList, setFaqsList] = useState<FAQ[]>([
    { q: "Do you accept GCash?", a: "Yes, we accept GCash." },
    { q: "Do you deliver?", a: "Yes, within 3km." },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progress = useMemo(() => {
    const keys = ["name", "industry", "location", "phone", "email", "services"] as const;
    const filled = keys.filter((k) => String((form as any)[k]).trim().length > 0).length;
    const hoursReady = selectedDays.length > 0 && startTime && endTime;
    const faqsReady = buildFaqsText(faqsList).trim().length > 0;
    const total = keys.length + 2;
    const done = filled + (hoursReady ? 1 : 0) + (faqsReady ? 1 : 0);
    return Math.round((done / total) * 100);
  }, [form, selectedDays, startTime, endTime, faqsList]);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 12px",
    background: "rgba(255,255,255,0.06)",
    color: COLORS.text,
    border: "1px solid rgba(211,217,212,0.18)",
    borderRadius: 12,
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontWeight: 800,
    color: "rgba(211,217,212,0.92)",
    fontSize: 12,
    letterSpacing: 0.6,
    marginBottom: 6,
    textTransform: "uppercase",
  };

  function setField(name: string, value: string) {
    setError(null);
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function toggleDay(day: string) {
    setSelectedDays((prev) => {
      const has = prev.includes(day);
      const next = has ? prev.filter((d) => d !== day) : [...prev, day];
      setField("hours", buildHours(next, startTime, endTime));
      return next;
    });
  }

  function updateTime(which: "start" | "end", value: string) {
    const s = which === "start" ? value : startTime;
    const e = which === "end" ? value : endTime;

    if (which === "start") setStartTime(value);
    else setEndTime(value);

    setField("hours", buildHours(selectedDays, s, e));
  }

  function updateFaq(idx: number, key: keyof FAQ, value: string) {
    setFaqsList((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [key]: value };
      setField("faqs", buildFaqsText(copy));
      return copy;
    });
  }

  function addFaq() {
    setFaqsList((prev) => {
      const next = [...prev, { q: "", a: "" }];
      setField("faqs", buildFaqsText(next));
      return next;
    });
  }

  function removeFaq(idx: number) {
    setFaqsList((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      setField("faqs", buildFaqsText(next));
      return next;
    });
  }

  function validate() {
    if (!form.name.trim()) return "Business name is required.";
    if (!form.services.trim()) return "Please add at least 1 service.";
    if (!selectedDays.length) return "Select business days for Hours.";
    if (!startTime || !endTime) return "Select start and end time for Hours.";
    if (!buildFaqsText(faqsList).trim()) return "Please add at least 1 FAQ.";
    return null;
  }

  async function generate() {
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const hoursText = buildHours(selectedDays, startTime, endTime);
      const faqsText = buildFaqsText(faqsList);
      const servicesList = (form.services || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const primaryService = servicesList[0] || "services";

      const previewData = {
        slug: `${(form.name || "business").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Math.floor(
          Math.random() * 10000
        )}`,
        name: form.name,
        industry: form.industry,
        location: form.location,
        hours: hoursText,
        phone: form.phone,
        email: form.email,
        services: form.services,
        faqs: faqsText,
        generated: {
          tagline: `Trusted ${form.industry || "business"} solutions for your everyday needs.`,
          about: `${form.name || "This business"} is a ${form.industry || "local business"} based in ${
            form.location || "your area"
          }, committed to providing reliable ${primaryService.toLowerCase()} and quality customer service.`,
          services_intro: servicesList.length
            ? `We offer the following services: ${servicesList.join(", ")}.`
            : `We offer reliable services tailored to your needs.`,
          cta: form.phone
            ? `Contact us today at ${form.phone} for inquiries and bookings.`
            : `Contact us today for inquiries and bookings.`,
        },
      };

      localStorage.setItem("jrlaunch_preview", JSON.stringify(previewData));
      window.location.href = "/preview";
    } catch (e: any) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        color: COLORS.text,
        padding: 24,
        fontFamily: "Arial",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            padding: "12px 14px",
            border: "1px solid rgba(211,217,212,0.14)",
            borderRadius: 16,
            background: "rgba(46,57,68,0.65)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                background: COLORS.accent,
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
                color: COLORS.text,
              }}
            >
              JR
            </div>

            <div style={{ lineHeight: 1.05 }}>
              <div style={{ fontWeight: 900, letterSpacing: 0.3, fontSize: 16 }}>
                <span>JRLaunch</span>{" "}
                <span style={{ color: COLORS.muted, fontWeight: 800, fontSize: 12 }}>AI</span>
              </div>
              <div style={{ fontSize: 12, color: "rgba(211,217,212,0.75)" }}>
                Offline-first website + chatbot generator
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 170,
                height: 10,
                borderRadius: 999,
                border: "1px solid rgba(211,217,212,0.16)",
                background: "rgba(255,255,255,0.05)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: COLORS.accent,
                }}
              />
            </div>
            <span style={{ fontSize: 12, color: "rgba(211,217,212,0.75)", width: 42 }}>
              {progress}%
            </span>
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 16,
          }}
        >
          <div
            style={{
              background: COLORS.card,
              border: "1px solid rgba(211,217,212,0.14)",
              borderRadius: 22,
              padding: 22,
            }}
          >
            <h1 style={{ margin: 0, fontSize: 44, lineHeight: 1.08, letterSpacing: -0.5 }}>
              Launch your business online in <span style={{ color: "#9fd3e6" }}>seconds</span>.
            </h1>

            <p style={{ marginTop: 12, color: "rgba(211,217,212,0.78)", lineHeight: 1.6 }}>
              Fill up a short form. We generate a clean one-page website and a customer FAQ chatbot.
              Built for small businesses.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
              {["One-page site generator", "FAQ chatbot", "Offline-first AI", "Open-source stack"].map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 12,
                    padding: "7px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(211,217,212,0.14)",
                    background: "rgba(255,255,255,0.04)",
                    color: "rgba(211,217,212,0.9)",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18 }}>
              <button
                onClick={generate}
                disabled={loading}
                style={{
                  padding: "12px 16px",
                  fontWeight: 900,
                  borderRadius: 14,
                  border: "none",
                  background: loading ? "rgba(255,255,255,0.10)" : COLORS.accent,
                  color: COLORS.text,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Launching..." : "Launch Website"}
              </button>

              <div style={{ fontSize: 12, color: "rgba(211,217,212,0.70)" }}>
                Tip: Add 2–3 FAQs for best chatbot answers.
              </div>
            </div>

            {error && (
              <div
                style={{
                  marginTop: 14,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,120,120,0.35)",
                  background: "rgba(255,120,120,0.10)",
                  color: "rgba(255,220,220,0.95)",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}
          </div>

          <div
            style={{
              background: COLORS.card,
              border: "1px solid rgba(211,217,212,0.14)",
              borderRadius: 22,
              padding: 18,
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 10 }}>How it works</div>

            {[
              { n: "1", t: "Fill business details", d: "Name, location, hours, services, FAQs" },
              { n: "2", t: "Generate website copy", d: "Tagline, About, CTA" },
              { n: "3", t: "Preview + Chatbot", d: "Instant browser-based demo" },
            ].map((s) => (
              <div
                key={s.n}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: 12,
                  borderRadius: 16,
                  border: "1px solid rgba(211,217,212,0.12)",
                  background: "rgba(255,255,255,0.03)",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    background: COLORS.accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    color: COLORS.text,
                  }}
                >
                  {s.n}
                </div>
                <div>
                  <div style={{ fontWeight: 900 }}>{s.t}</div>
                  <div style={{ fontSize: 12, color: "rgba(211,217,212,0.70)", marginTop: 2 }}>
                    {s.d}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            background: COLORS.card,
            border: "1px solid rgba(211,217,212,0.14)",
            borderRadius: 22,
            padding: 22,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Business Setup</div>
              <div style={{ fontSize: 12, color: "rgba(211,217,212,0.70)", marginTop: 4 }}>
                Enter only what you want to show publicly.
              </div>
            </div>
            <div style={{ fontSize: 12, color: "rgba(211,217,212,0.70)" }}>
              Required: <b>Name</b>, <b>Services</b>, <b>FAQs</b>
            </div>
          </div>

          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>Business Name</label>
              <input
                style={inputStyle}
                placeholder="e.g., Justin Barber Studio"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
              />
            </div>

            <div>
              <label style={labelStyle}>Industry</label>
              <input
                style={inputStyle}
                placeholder="e.g., Barbershop, Milk Tea, Repair Shop"
                value={form.industry}
                onChange={(e) => setField("industry", e.target.value)}
              />
            </div>

            <div>
              <label style={labelStyle}>Location</label>
              <input
                style={inputStyle}
                placeholder="e.g., Diliman, Quezon City"
                value={form.location}
                onChange={(e) => setField("location", e.target.value)}
              />
            </div>

            <div>
              <label style={labelStyle}>Hours (pick days + time)</label>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                {DAYS.map((d) => {
                  const active = selectedDays.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDay(d)}
                      style={{
                        padding: "7px 10px",
                        borderRadius: 999,
                        border: `1px solid ${active ? "rgba(159,211,230,0.55)" : "rgba(211,217,212,0.16)"}`,
                        background: active ? "rgba(18,78,102,0.38)" : "rgba(255,255,255,0.04)",
                        color: COLORS.text,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "rgba(211,217,212,0.75)", marginBottom: 6 }}>Start</div>
                  <input type="time" value={startTime} onChange={(e) => updateTime("start", e.target.value)} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "rgba(211,217,212,0.75)", marginBottom: 6 }}>End</div>
                  <input type="time" value={endTime} onChange={(e) => updateTime("end", e.target.value)} style={inputStyle} />
                </div>
              </div>

              <div style={{ marginTop: 8, fontSize: 12, color: "rgba(211,217,212,0.70)" }}>
                Preview: <b>{form.hours || "—"}</b>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Phone</label>
              <input
                style={inputStyle}
                placeholder="e.g., 09xx xxx xxxx"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
              />
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input
                style={inputStyle}
                placeholder="e.g., hello@business.com"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={labelStyle}>Services (comma separated)</label>
            <input
              style={inputStyle}
              placeholder="e.g., Haircut, Hair color, Manicure"
              value={form.services}
              onChange={(e) => setField("services", e.target.value)}
            />
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={labelStyle}>FAQs (easy builder)</label>
            <div style={{ fontSize: 12, color: "rgba(211,217,212,0.70)", marginBottom: 10 }}>
              Add questions + answers. We will auto-format it for the chatbot.
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {faqsList.map((f, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr auto",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <input
                    style={inputStyle}
                    placeholder="Question"
                    value={f.q}
                    onChange={(e) => updateFaq(idx, "q", e.target.value)}
                  />
                  <input
                    style={inputStyle}
                    placeholder="Answer"
                    value={f.a}
                    onChange={(e) => updateFaq(idx, "a", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeFaq(idx)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(211,217,212,0.16)",
                      background: "rgba(255,255,255,0.05)",
                      color: COLORS.text,
                      cursor: "pointer",
                      fontWeight: 900,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
              <button
                type="button"
                onClick={addFaq}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "none",
                  background: COLORS.accent,
                  color: COLORS.text,
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                + Add FAQ
              </button>

              <div style={{ fontSize: 12, color: "rgba(211,217,212,0.70)" }}>
                Stored format (auto): <b>Question|Answer</b>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, textAlign: "center", color: "rgba(211,217,212,0.60)", fontSize: 12 }}>
          © {new Date().getFullYear()} JRLaunch AI — Prototype build
        </div>
      </div>
    </main>
  );
}