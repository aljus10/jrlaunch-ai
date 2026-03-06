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
  const daysText = days.join(", ");
  return `${daysText} ${start}–${end}`;
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
    hours: "", // auto-generated from picker
    phone: "",
    email: "",
    services: "",
    faqs: "", // auto-generated from FAQ builder
  });

  // Hours picker state
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");

  // FAQ builder state (starts with 2 guided rows)
  const [faqsList, setFaqsList] = useState<FAQ[]>([
    { q: "Do you accept GCash?", a: "Yes, we accept GCash." },
    { q: "Do you deliver?", a: "Yes, within 3km." },
  ]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // progress (simple)
  const progress = useMemo(() => {
    const keys = ["name", "industry", "location", "phone", "email", "services"] as const;
    const filled = keys.filter((k) => String((form as any)[k]).trim().length > 0).length;

    const hoursReady = selectedDays.length > 0 && startTime && endTime;
    const faqsReady = buildFaqsText(faqsList).trim().length > 0;

    const total = keys.length + 2; // +hours +faqs
    const done = filled + (hoursReady ? 1 : 0) + (faqsReady ? 1 : 0);
    return Math.round((done / total) * 100);
  }, [form, selectedDays, startTime, endTime, faqsList]);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 12px",
    background: "rgba(255,255,255,0.06)",
    color: COLORS.text,
    border: `1px solid rgba(211,217,212,0.18)`,
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
    setResult(null);
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function toggleDay(day: string) {
    setSelectedDays((prev) => {
      const has = prev.includes(day);
      const next = has ? prev.filter((d) => d !== day) : [...prev, day];
      // update form.hours as well
      const hoursText = buildHours(next, startTime, endTime);
      setField("hours", hoursText);
      return next;
    });
  }

  function updateTime(which: "start" | "end", value: string) {
    if (which === "start") setStartTime(value);
    else setEndTime(value);

    const s = which === "start" ? value : startTime;
    const e = which === "end" ? value : endTime;

    const hoursText = buildHours(selectedDays, s, e);
    setField("hours", hoursText);
  }

  function updateFaq(idx: number, key: keyof FAQ, value: string) {
    setFaqsList((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [key]: value };
      // update form.faqs text for backend
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

    const faqsText = buildFaqsText(faqsList).trim();
    if (!faqsText) return "Please add at least 1 FAQ (Question + Answer).";

    return null;
  }

  async function generate() {
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    // Ensure backend fields are up-to-date
    const hoursText = buildHours(selectedDays, startTime, endTime);
    const faqsText = buildFaqsText(faqsList);

    const payload = {
      ...form,
      hours: hoursText,
      faqs: faqsText,
    };

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Generate failed.");
        return;
      }
      setResult(data.slug);
    } catch (e: any) {
      setError(String(e));
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
        {/* Top bar */}
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
            backdropFilter: "blur(8px)",
          }}
        >
          {/* Logo (separate + clear) */}
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
                boxShadow: "0 10px 24px rgba(18,78,102,0.35)",
              }}
              title="JuztiLaunch AI"
            >
              JL
            </div>

            <div style={{ lineHeight: 1.05 }}>
              <div style={{ fontWeight: 900, letterSpacing: 0.3, fontSize: 16 }}>
                <span>JuztiLaunch</span>{" "}
                <span style={{ color: COLORS.muted, fontWeight: 800, fontSize: 12 }}>AI</span>
              </div>
              <div style={{ fontSize: 12, color: "rgba(211,217,212,0.75)" }}>
                Offline-first website + chatbot generator
              </div>
            </div>
          </div>

          {/* Progress */}
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
              title={`Setup progress: ${progress}%`}
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

        {/* Hero + How it works */}
        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 16,
          }}
        >
          {/* Hero */}
          <div
            style={{
              background: COLORS.card,
              border: "1px solid rgba(211,217,212,0.14)",
              borderRadius: 22,
              padding: 22,
            }}
          >
            <h1 style={{ margin: 0, fontSize: 44, lineHeight: 1.08, letterSpacing: -0.5 }}>
              Launch your business online in{" "}
              <span style={{ color: "#9fd3e6" }}>seconds</span>.
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
                  boxShadow: "0 12px 26px rgba(18,78,102,0.32)",
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

            {result && (
              <div
                style={{
                  marginTop: 14,
                  padding: "12px 12px",
                  borderRadius: 14,
                  border: "1px solid rgba(159,211,230,0.35)",
                  background: "rgba(18,78,102,0.18)",
                  color: "rgba(211,217,212,0.95)",
                  fontSize: 13,
                }}
              >
                ✅ Published:{" "}
                <a
                  href={`/site/${result}`}
                  style={{ color: "#9fd3e6", fontWeight: 900, textDecoration: "none" }}
                >
                  /site/{result}
                </a>
              </div>
            )}
          </div>

          {/* How it works (NO extra big gray box anymore) */}
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
              { n: "2", t: "AI generates copy", d: "Tagline, About, CTA (offline-first)" },
              { n: "3", t: "Publish + Chatbot", d: "Share the link with customers instantly" },
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
                    flex: "0 0 auto",
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

        {/* Form */}
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
                placeholder="e.g., Juzti Barber Studio"
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

            {/* HOURS PICKER */}
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
                  <div style={{ fontSize: 12, color: "rgba(211,217,212,0.75)", marginBottom: 6 }}>
                    Start
                  </div>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => updateTime("start", e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "rgba(211,217,212,0.75)", marginBottom: 6 }}>
                    End
                  </div>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => updateTime("end", e.target.value)}
                    style={inputStyle}
                  />
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

          {/* FAQ BUILDER */}
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
                    placeholder="Question (e.g., Do you accept GCash?)"
                    value={f.q}
                    onChange={(e) => updateFaq(idx, "q", e.target.value)}
                  />
                  <input
                    style={inputStyle}
                    placeholder="Answer (e.g., Yes, we accept GCash.)"
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
                    title="Remove FAQ"
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
          © {new Date().getFullYear()} JuztiLaunch AI — Prototype build
        </div>
      </div>
    </main>
  );
}