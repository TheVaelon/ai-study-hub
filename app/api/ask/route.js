// app/api/ask/route.js
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SERPER_KEY = process.env.SERPER_KEY;

// === File Helpers ===
const dataFile = path.join(process.cwd(), "data.json");

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(dataFile, "utf-8"));
  } catch {
    // Default structure if file doesn't exist yet
    return {
      accounts: { "marwan_alsaadi": "Aladdin@0" },
      assignments: [],
      schedule: {
        "Dimanche 7 septembre 2025": [
          "08:30-10:25 Histoire-Géo (D13) → Introduction au monde Grec | À faire: Guerres Médiques",
          "10:40-11:35 Mathématiques (D21) → Calculs littéraux",
          "11:40-12:35 Physique-Chimie (B21-PC) → Cours | À faire: Exercices",
          "14:25-15:20 EMC (D15-Info) → Axe Les libertés | À faire: Recherche",
          "15:25-16:20 SES (D11)"
        ],
        "Lundi 8 septembre 2025": [
          "08:30-09:25 Anglais (D14) → Commonwealth Nations | À faire: Bring laptop",
          "09:30-10:25 Mathématiques (D29)",
          "10:40-11:35 SVT (B23-SVT)",
          "11:40-12:35 SES (D29)"
        ]
      },
      chats: [],
      activity: []
    };
  }
}

function saveData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

export async function POST(req) {
  const { q, web, action, username, password, caller, chatId, message, title, type, date, user, index } = await req.json();

  let data = loadData();
  let { accounts, assignments, schedule, chats, activity } = data;

  // === Admin actions (only you) ===
  if (action && caller === "marwan_alsaadi") {
    if (action === "createUser") {
      accounts[username] = password;
      saveData(data);
      return NextResponse.json({ reply: `✅ User ${username} created`, accounts });
    }
    if (action === "deleteUser") {
      delete accounts[username];
      saveData(data);
      return NextResponse.json({ reply: `🗑 User ${username} deleted`, accounts });
    }
    if (action === "updateSchedule") {
      schedule = password; // replace schedule with provided JSON
      data.schedule = schedule;
      saveData(data);
      return NextResponse.json({ reply: "📅 Schedule updated", schedule });
    }
    if (action === "announce") {
      activity.push("📢 " + q);
      saveData(data);
      return NextResponse.json({ reply: "📢 Announcement sent", activity });
    }
    if (action === "resetAssignments") {
      assignments = [];
      data.assignments = assignments;
      saveData(data);
      return NextResponse.json({ reply: "🧹 Assignments reset" });
    }
  }

  // === Assignments ===
  if (action === "addAssignment") {
    assignments.push({ title, type, date, user });
    activity.push(`${user} added ${type} → ${title}`);
    saveData(data);
    return NextResponse.json({ assignments });
  }
  if (action === "getAssignments") {
    return NextResponse.json({ assignments });
  }
  if (action === "deleteAssignment") {
    assignments.splice(index, 1);
    saveData(data);
    return NextResponse.json({ assignments });
  }

  // === Accounts ===
  if (action === "getAccounts") {
    return NextResponse.json({ accounts });
  }

  // === Schedule ===
  if (action === "getSchedule") {
    return NextResponse.json({ schedule });
  }

  // === Chats ===
  if (action === "addMessage") {
    let chat = chats.find(c => c.id === chatId);
    if (!chat) {
      chat = { id: chatId, messages: [] };
      chats.push(chat);
    }
    chat.messages.push(message);
    saveData(data);
    return NextResponse.json({ success: true });
  }
  if (action === "getChat") {
    let chat = chats.find(c => c.id === chatId);
    return NextResponse.json(chat || { id: chatId, messages: [] });
  }

  // === Web search ===
  if (web) {
    try {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: { "X-API-KEY": SERPER_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ q }),
      });
      const searchData = await res.json();
      const results = searchData.organic || [];
      const snippets = results.slice(0, 5).map(r => `${r.title}: ${r.snippet}`).join("\n") || "No results found.";

      const summaryRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_KEY}` },
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

// === Normal AI Q&A ===
try {
  console.log('Sending to OpenAI:', q);
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: q }],
    }),
  });
  const data = await res.json();
  console.log('OpenAI response:', data);
  if (data.error) {
    return NextResponse.json({ reply: `❌ OpenAI error: ${data.error.message}` });
  }
  return NextResponse.json({
    reply: data.choices?.[0]?.message?.content || "No reply from AI",
  });
} catch (e) {
  console.error('OpenAI error:', e);
  return NextResponse.json({ reply: "❌ OpenAI error: " + e.message });
}
