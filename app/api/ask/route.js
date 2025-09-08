import { NextResponse } from "next/server";

const OPENAI_KEY = "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";
const SERPER_KEY = "633291bddd7b0b925855867a58de4886e6e35953";

export async function POST(req) {
  const { q, web } = await req.json();

  if (web) {
    try {
      // 🔎 Search on Serper
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": SERPER_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q }),
      });

      const data = await res.json();
      const results = data.organic || [];

      // Only keep titles & snippets (no URLs)
      const snippets =
        results
          .slice(0, 5)
          .map((r) => `${r.title}: ${r.snippet}`)
          .join("\n\n") || "No useful results found.";

      // ✨ Summarize with GPT
      const summaryRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant. Summarize the following web search snippets into a clear and short answer. Do NOT include URLs, just give a natural summary.",
            },
            { role: "user", content: snippets },
          ],
        }),
      });

      const summaryData = await summaryRes.json();
      const summary =
        summaryData.choices?.[0]?.message?.content || "No summary available.";

      return NextResponse.json({ reply: summary });
    } catch (e) {
      return NextResponse.json({ reply: "❌ Web search error: " + e.message });
    }
  } else {
    // 🧠 Ask AI normally
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: q }],
        }),
      });

      const data = await res.json();
      return NextResponse.json({
        reply: data.choices?.[0]?.message?.content || "No reply from AI.",
      });
    } catch (e) {
      return NextResponse.json({ reply: "❌ OpenAI error: " + e.message });
    }
  }
}
