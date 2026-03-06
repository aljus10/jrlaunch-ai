"use client";

import { useState } from "react";

export default function ChatWidget({ slug }: { slug: string }) {
  const [q, setQ] = useState("");
  const [log, setLog] = useState<{ role: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);

async function ask() {
  if (!q.trim()) return;

  const question = q;
  const nextLog = [...log, { role: "user", text: question }];

  setQ("");
  setLog(nextLog);
  setLoading(true);

  try {
    const history = nextLog.slice(-6); // last few messages only

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, question, history }),
    });

    const data = await res.json();

    setLog((prev) => [
      ...prev,
      { role: "bot", text: data.answer || "No response." },
    ]);
  } catch {
    setLog((prev) => [
      ...prev,
      { role: "bot", text: "Chat error. Please try again." },
    ]);
  }

  setLoading(false);
}

  return (
    <div
      style={{
        position: "fixed",
        right: 20,
        bottom: 20,
        width: 340,
        background: "#ffffff",
        color: "#111111",
        border: "1px solid #ccc",
        borderRadius: 14,
        padding: 12,
        boxShadow: "0 10px 25px rgba(0,0,0,0.35)",

        zIndex: 999999,
        pointerEvents: "auto",
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 8, color: "#111111" }}>
        Chat with us
      </div>

      <div
        style={{
          height: 210,
          overflowY: "auto",
          border: "1px solid #eee",
          borderRadius: 10,
          padding: 10,
          background: "#f7f7f7",
          color: "#111111",
          fontSize: 14,
          lineHeight: 1.4,
        }}
      >
        {log.map((m, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
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
          placeholder="Ask a question..."
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 10,
            border: "2px solid #111",
            background: "#ffffff",
            color: "#111111",
            outline: "none",
            fontSize: 14,
            pointerEvents: "auto",
          }}
        />

        <button
          onClick={ask}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "2px solid #111",
            background: "#111111",
            color: "#ffffff",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}