import { NextResponse } from "next/server";
import redis from "@/lib/redis";

const OPENAI_KEY = process.env.OPENAI_KEY;
const SERPER_KEY = process.env.SERPER_KEY;

export async function POST(req) {
  const { q, web, action, username, password, caller, chatId, assignment, message } = await req.json();

  // 👑 ADMIN actions (only you)
  if (action && caller === "marwan_alsaadi") {
    if (action === "createUser") {
      await redis.hset("accounts", username, password);
      return NextResponse.json({ reply: `✅ User ${username} created` });
    }
    if (action === "deleteUser") {
      await redis.hdel("accounts", username);
      return NextResponse.json({ reply: `🗑 User ${username} deleted` });
    }
    if (action === "updateSchedule") {
      await redis.set("schedule", JSON.stringify(password)); // password reused to pass JSON schedule
      return NextResponse.json({ reply: "📅 Schedule updated globally" });
    }
    if (action === "announce") {
      await redis.rpush("announcements", q);
      return NextResponse.json({ reply: "📢 Announcement sent" });
    }
    if (action === "resetAssignments") {
      await redis.del("assignments");
      return NextResponse.json({ reply: "🧹 Assignments reset" });
    }
  }
  // 📝 Assignments
  if (action === "addAssignment") {
    await redis.rpush("assignments", JSON.stringify({ ...assignment, user: caller }));
    return NextResponse.json({ reply: "📘 Assignment added" });
  }
  if (action === "getAssignments") {
    const data = await redis.lrange("assignments", 0, -1);
    return NextResponse.json({ assignments: data.map((x) => JSON.parse(x)) });
  }

  // 💬 Chats
  if (action === "addMessage") {
    const key = `chat:${chatId}`;
    await redis.rpush(key, JSON.stringify(message));
    return NextResponse.json({ reply: "💬 Message added" });
  }
  if (action === "getChat") {
    const key = `chat:${chatId}`;
    const data = await redis.lrange(key, 0, -1);
    return NextResponse.json({ messages: data.map((x) => JSON.parse(x)) });
  }

  // 👤 Accounts (login)
  if (action === "login") {
    const stored = await redis.hget("accounts", username);
    if (stored && stored === password) {
      return NextResponse.json({ success: true, admin: username === "marwan_alsaadi" });
    } else {
      return NextResponse.json({ success: false });
    }
  }
  // 🌐 Web search
  if (web) {
    try {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: { "X-API-KEY": SERPER_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ q }),
      });
      const data = await res.json();
      const results = data.organic || [];
      const snippets = results.slice(0, 5).map((r) => `${r.title}: ${r.snippet}`).join("\n") || "No results found.";

      const summaryRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Summarize these search results clearly. No links." },
            { role: "user", content: snippets },
          ],
        }),
      });

      const summaryData = await summaryRes.json();
      const summary = summaryData.choices?.[0]?.message?.content || "No summary available.";
      return NextResponse.json({ reply: summary });
    } catch (e) {
      return NextResponse.json({ reply: "❌ Search error: " + e.message });
    }
  }

  // 🧠 Normal AI Q&A
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: q }],
      }),
    });
    const data = await res.json();
    return NextResponse.json({
      reply: data.choices?.[0]?.message?.content || "No reply from AI",
    });
  } catch (e) {
    return NextResponse.json({ reply: "❌ OpenAI error: " + e.message });
  }
}
