import db from "../../../lib/db";

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

export async function POST(req: Request) {
  try {
    const { slug, question } = await req.json();

    if (!slug || !question) {
      return Response.json({ answer: "Missing slug or question." }, { status: 400 });
    }

    const row = db.prepare("SELECT * FROM business WHERE slug = ?").get(slug) as any;

    if (!row) {
      return Response.json({ answer: "Business not found." }, { status: 404 });
    }

    const q = normalize(question);
    const faqs = parseFaqs(row.faqs || "");

    // 1. Greetings
    if (containsAny(q, ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"])) {
      return Response.json({
        answer: `Hello! How can I help you with ${row.name || "our business"} today?`,
      });
    }

    // 2. Hours
    if (containsAny(q, ["hour", "open", "close", "closing", "opening", "time"])) {
      if (row.hours) {
        return Response.json({
          answer: `Our business hours are ${row.hours}.`,
        });
      }
    }

    // 3. Location / address
    if (containsAny(q, ["where", "location", "address", "located"])) {
      if (row.location) {
        return Response.json({
          answer: `We are located at ${row.location}.`,
        });
      }
    }

    // 4. Phone / contact number
    if (containsAny(q, ["phone", "number", "contact number", "call"])) {
      if (row.phone) {
        return Response.json({
          answer: `You can call us at ${row.phone}.`,
        });
      }
    }

    // 5. Email
    if (containsAny(q, ["email", "gmail", "mail", "contact email"])) {
      if (row.email) {
        return Response.json({
          answer: `You can email us at ${row.email}.`,
        });
      }
    }

    // 6. Services
    if (containsAny(q, ["service", "offer", "do you have", "what do you do", "available"])) {
      if (row.services) {
        return Response.json({
          answer: `Our services include ${row.services}.`,
        });
      }
    }

    // 7. FAQ matching
    let bestFaq = null;
    let bestScore = 0;

    for (const faq of faqs) {
      const score = similarityScore(q, faq.q);
      if (score > bestScore) {
        bestScore = score;
        bestFaq = faq;
      }
    }

    if (bestFaq && bestScore >= 1) {
      return Response.json({
        answer: bestFaq.a,
      });
    }

    // 8. Simple fallback by checking if question contains FAQ keywords
    for (const faq of faqs) {
      const faqQuestion = normalize(faq.q);
      if (
        faqQuestion.includes(q) ||
        q.includes(faqQuestion) ||
        faqQuestion.split(/\W+/).some((word) => word && q.includes(word))
      ) {
        return Response.json({
          answer: faq.a,
        });
      }
    }

    // 9. Final fallback
    return Response.json({
      answer: "I’m not sure. Please contact us for more details.",
    });
  } catch (error) {
    console.error("CHAT API ERROR:", error);
    return Response.json(
      { answer: "Server error in chatbot." },
      { status: 500 }
    );
  }
}