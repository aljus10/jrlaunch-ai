"use client";

import { useState } from "react";

type BusinessData = {
  name: string;
  location: string;
  hours: string;
  phone: string;
  email: string;
  services: string;
  faqs: string;
};

function normalize(text: string) {
  return (text || "").toLowerCase().trim();
}

function containsAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function parseFaqs(faqText: string) {
  return (faqText || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [q, ...rest] = line.split("|");
      return {
        q: (q || "").trim(),
        a: rest.join("|").trim(),
      };
    })
    .filter((item) => item.q && item.a);
}

function similarityScore(a: string, b: string) {
  const aa = normalize(a).split(/\W+/).filter(Boolean);
  const bb = normalize(b).split(/\W+/).filter(Boolean);

  let score = 0;
  for (const word of aa) {
    if (bb.includes(word)) score++;
  }
  return score;
}

function answerQuestion(question: string, business: BusinessData) {
  const q = normalize(question);
  const faqs = parseFaqs(business.faqs || "");

  if (containsAny(q, ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"])) {
    return `Hello! How can I help you with ${business.name || "our business"} today?`;
  }

  if (containsAny(q, ["hour", "open", "close", "closing", "opening", "time"])) {
    if (business.hours) return `Our business hours are ${business.hours}.`;
  }

  if (containsAny(q, ["where", "location", "address", "located"])) {
    if (business.location) return `We are located at ${business.location}.`;
  }

  if (containsAny(q, ["phone", "number", "contact number", "call"])) {
    if (business.phone) return `You can call us at ${business.phone}.`;
  }

  if (containsAny(q, ["email", "gmail", "mail"])) {
    if (business.email) return `You can email us at ${business.email}.`;
  }

  if (containsAny(q, ["service", "offer", "available", "what can you do"])) {
    if (business.services) return `Our services include ${business.services}.`;
  }

  let bestFaq = null;
  let bestScore = 0;

  for (const faq of faqs) {
    const score = similarityScore(q, faq.q);
    if (score > bestScore) {
      bestScore = score;
      bestFaq = faq;
    }
  }

  if (bestFaq && bestScore >= 1) return bestFaq.a;

  return "I’m not sure. Please contact us for more details.";
}

export default function ChatWidget({
  slug,
  businessData,
}: {
  slug: string;
  businessData?: BusinessData;
}) {
  const [q, setQ] = useState("");
  const [log, setLog] = useState<{ role: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);

  async function ask() {
    if (!q.trim()) return;

    const question = q;
    setQ("");
    setLog((prev) => [...prev, { role: "user", text: question }]);
    setLoading(true);

    try {
      if (businessData) {
        const answer = answerQuestion(question, businessData);
        setLog((prev) => [...prev, { role: "bot", text: answer }]);
      } else {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, question }),
        });

        const data = await res.json();
        setLog((prev) => [...prev, { role: "bot", text: data.answer || "No response." }]);
      }
    } catch {
      setLog((prev) => [...prev, { role: "bot", text: "Chat error. Please try again." }]);
    }

    setLoading(false);
  }

  return (
    <div
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        width: 360,
        background: "#ffffff",
        color: "#111111",
        border: "1px solid #ccc",
        borderRadius: 14,
        padding: 12,
        boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
        zIndex: 999999,
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 8, color: "#111111", fontSize: 20 }}>
        Chat with us
      </div>

      <div
        style={{
          height: 280,
          overflowY: "auto",
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 10,
          background: "#f7f7f7",
          color: "#111111",
          fontSize: 15,
          lineHeight: 1.5,
        }}
      >
        {log.map((m, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <span style={{ fontWeight: 700, color: "#111111" }}>
              {m.role === "user" ? "You" : "Bot"}:
            </span>{" "}
            <span style={{ color: "#111111" }}>{m.text}</span>
          </div>
        ))}
        {loading && <div style={{ color: "#111111" }}>Bot is typing...</div>}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") ask();
          }}
          placeholder="Ask a question..."
          style={{
            flex: 1,
            padding: "12px 14px",
            borderRadius: 10,
            border: "2px solid #111",
            background: "#ffffff",
            color: "#111111",
            outline: "none",
            fontSize: 15,
          }}
        />

        <button
          onClick={ask}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "2px solid #111",
            background: "#111111",
            color: "#ffffff",
            fontWeight: 800,
            cursor: "pointer",
            fontSize: 15,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}