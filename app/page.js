"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    if (typeof window === "undefined") return; // ✅ Run only in browser

    // === Load persisted data ===
    let accounts = JSON.parse(localStorage.getItem("accounts")) || { "marwan_alsaadi": "Aladdin@0" };
    let assignments = JSON.parse(localStorage.getItem("assignments")) || [];
    let activity = JSON.parse(localStorage.getItem("activity")) || [];
    let chats = JSON.parse(localStorage.getItem("chats")) || [];
    let scheduleData = JSON.parse(localStorage.getItem("scheduleData")) || {
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
    };

    let currentChat = null, currentUser = null, isAdmin = false;

    function save() {
      localStorage.setItem("accounts", JSON.stringify(accounts));
      localStorage.setItem("assignments", JSON.stringify(assignments));
      localStorage.setItem("activity", JSON.stringify(activity));
      localStorage.setItem("chats", JSON.stringify(chats));
      localStorage.setItem("scheduleData", JSON.stringify(scheduleData));
    }

    // === LOGIN ===
    document.getElementById("loginBtn").addEventListener("click", () => {
      const u = document.getElementById("username").value.trim();
      const p = document.getElementById("password").value.trim();
      if (accounts[u] && accounts[u] === p) {
        currentUser = u;
        isAdmin = (u === "marwan_alsaadi");
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("mainHeader").classList.remove("hidden");
        document.getElementById("mainApp").classList.remove("hidden");
        if (isAdmin) document.getElementById("adminTabBtn").classList.remove("hidden");
        updateDashboard(); renderAssignments(); renderAccounts(); renderChatList(); renderSchedule();
        if (chats.length === 0) { newChat(); } else { currentChat = chats[chats.length - 1].id; renderMessages(); }
      } else alert("❌ Invalid login");
    });

    // === SWITCH TABS ===
    function switchTab(tab) {
      document.querySelectorAll(".tab").forEach(t => t.classList.add("hidden"));
      document.querySelectorAll("nav button").forEach(b => b.classList.remove("active"));
      document.getElementById(tab).classList.remove("hidden");
      document.querySelector(`nav button[data-tab="${tab}"]`).classList.add("active");
      document.getElementById("sidebar").classList.toggle("hidden", tab !== "aistudy");
    }
    document.querySelectorAll("nav button[data-tab]").forEach(btn => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });

    // === CHAT ===
    function newChat() {
      const id = Date.now();
      const c = { id, name: "New Chat", messages: [] };
      chats.push(c); currentChat = id; save(); renderChatList(); renderMessages();
    }
    function renderChatList() {
      const list = document.getElementById("chatList");
      list.innerHTML = "";
      chats.forEach(c => {
        const div = document.createElement("div");
        div.className = "chatItem";
        div.textContent = c.name;
        div.onclick = () => { currentChat = c.id; renderMessages(); };
        list.appendChild(div);
      });
    }
    function renderMessages() {
      const chat = chats.find(c => c.id === currentChat);
      const box = document.getElementById("chatBox");
      box.innerHTML = "";
      if (!chat) return;
      chat.messages.forEach(m => {
        const div = document.createElement("div");
        div.className = "msg " + m.role;
        div.textContent = m.text;
        box.appendChild(div);
      });
      setTimeout(() => { box.scrollTop = box.scrollHeight; }, 50); // auto-scroll
    }
    function addMessage(role, text) {
      const chat = chats.find(c => c.id === currentChat);
      if (!chat) return;
      chat.messages.push({ role, text });
      if (chat.name === "New Chat" && role === "user") chat.name = text.slice(0, 15) + "...";
      save(); renderChatList(); renderMessages();
    }

    let stopTyping = false;
    async function typeWriter(text) {
      const chat = chats.find(c => c.id === currentChat);
      if (!chat) return;
      let msg = { role: "ai", text: "" };
      chat.messages.push(msg);
      document.getElementById("stopBtn").style.display = "inline-block";
      for (let i = 0; i < text.length; i++) {
        if (stopTyping) { msg.text = text; renderMessages(); break; }
        msg.text += text[i]; renderMessages();
        await new Promise(r => setTimeout(r, 5));
      }
      stopTyping = false;
      document.getElementById("stopBtn").style.display = "none";
      save();
    }
    document.getElementById("stopBtn").addEventListener("click", () => { stopTyping = true; });

    // === ASK AI ===
    window.askAI = async function () {
      const q = document.getElementById("question").value.trim();
      if (!q) return;
      if (!currentChat) newChat();

      addMessage("user", q);
      addMessage("ai", "🤔 Thinking...");
      document.getElementById("question").value = "";

      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q, web: false })
        });
        const data = await res.json();
        typeWriter(data.reply);
      } catch (e) {
        addMessage("ai", "Error: " + e.message);
      }
    };

    // === WEB SEARCH ===
    async function webSearch() {
      const q = document.getElementById("question").value.trim(); if (!q) return;
      if (!currentChat) newChat();

      addMessage("user", q + " (search)");
      addMessage("search", "🌍 Searching the web...");
      document.getElementById("question").value = "";

      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q, web: true })
        });
        const data = await res.json();
        typeWriter("[Web] " + data.reply);
      } catch (e) { addMessage("search", "Search error: " + e.message); }
    }

    document.getElementById("searchBtn").addEventListener("click", webSearch);
    document.getElementById("question").addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); window.askAI(); }
    });

    document.getElementById("newChatBtn").addEventListener("click", newChat);
    // === DASHBOARD ===
    function updateDashboard() {
      document.getElementById("todayDate").textContent = "Today: " + new Date().toDateString();
      if (assignments.length > 0) {
        const next = assignments.sort((a, b) => new Date(a.date) - new Date(b.date))[0];
        document.getElementById("nextAssignment").textContent = `${next.title} (${next.type}) due ${next.date}`;
      }
      const feed = document.getElementById("activityFeed");
      feed.innerHTML = "";
      activity.slice(-5).reverse().forEach(a => {
        let li = document.createElement("li");
        li.textContent = a;
        feed.appendChild(li);
      });
    }

    // === ASSIGNMENTS ===
    function addAssignment() {
      const t = document.getElementById("assTitle").value.trim();
      const ty = document.getElementById("assType").value;
      const d = document.getElementById("assDate").value;
      if (!t || !d) return alert("Fill all fields");
      assignments.push({ title: t, type: ty, date: d, user: currentUser });
      activity.push(`${currentUser} added ${ty} → ${t}`);
      save(); renderAssignments(); updateDashboard();
    }
    function renderAssignments() {
      const list = document.getElementById("assignmentsList");
      list.innerHTML = "";
      assignments.forEach((a, i) => {
        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `<b>${a.title}</b> (${a.type}) due ${a.date}<br><small>by ${a.user}</small>`;
        if (isAdmin) {
          const btn = document.createElement("button");
          btn.textContent = "🗑";
          btn.onclick = () => { assignments.splice(i, 1); save(); renderAssignments(); updateDashboard(); };
          div.appendChild(btn);
        }
        list.appendChild(div);
      });
    }
    document.getElementById("addAssignmentBtn").addEventListener("click", addAssignment);

    // === ADMIN ===
    function renderAccounts() {
      const list = document.getElementById("accountsList");
      list.innerHTML = "";
      Object.keys(accounts).forEach(u => {
        if (u === "marwan_alsaadi") return;
        const div = document.createElement("div");
        const del = document.createElement("button");
        del.textContent = "Delete";
        del.onclick = () => { delete accounts[u]; save(); renderAccounts(); };
        div.innerHTML = `<b>${u}</b> `;
        div.appendChild(del);
        list.appendChild(div);
      });
    }
    document.getElementById("createAccountBtn").addEventListener("click", () => {
      if (!isAdmin) return;
      const u = document.getElementById("newUser").value.trim();
      const p = document.getElementById("newPass").value.trim();
      if (!u || !p) return alert("Fill fields");
      accounts[u] = p; save(); renderAccounts(); alert("✅ Created " + u);
    });

    // === SCHEDULE ===
    function renderSchedule() {
      const list = document.getElementById("scheduleList");
      list.innerHTML = "";
      Object.keys(scheduleData).forEach(day => {
        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `<h3>${day}</h3><ul>${scheduleData[day].map(c => "<li>" + c + "</li>").join("")}</ul>`;
        if (isAdmin) {
          const textarea = document.createElement("textarea");
          textarea.style.width = "100%";
          textarea.value = scheduleData[day].join("\n");
          const btn = document.createElement("button");
          btn.textContent = "💾 Save";
          btn.onclick = () => {
            scheduleData[day] = textarea.value.split("\n");
            save(); renderSchedule();
          };
          div.appendChild(textarea);
          div.appendChild(btn);
        }
        list.appendChild(div);
      });
    }
  }, []);

  // === RETURN JSX (UI) ===
  return (
    <div>
      <style>{`
        body {margin:0;font-family:'Segoe UI',sans-serif;background:linear-gradient(135deg,#1e3c72,#2a5298);color:#fff;display:flex;flex-direction:column;height:100vh;overflow:hidden;}
        header{padding:12px 20px;background:rgba(0,0,0,0.3);display:flex;justify-content:space-between;align-items:center;backdrop-filter:blur(10px);box-shadow:0 4px 15px rgba(0,0,0,0.3);}
        nav button{margin-left:10px;background:rgba(255,255,255,0.15);border:none;border-radius:6px;padding:8px 14px;color:#fff;cursor:pointer;transition:0.3s;}
        nav button:hover,nav button.active{background:#4c6ef5;}
        .container{flex:1;display:flex;overflow:hidden;}
        #sidebar{width:240px;background:rgba(0,0,0,0.25);padding:15px;display:flex;flex-direction:column;backdrop-filter:blur(8px);border-right:1px solid rgba(255,255,255,0.2);}
        #sidebar h2{font-size:16px;margin-bottom:12px;}
        .chatItem{background:rgba(255,255,255,0.1);padding:8px;border-radius:6px;margin-bottom:8px;cursor:pointer;}
        .chatItem:hover{background:rgba(255,255,255,0.25);}
        #newChatBtn{background:#238636;border:none;border-radius:6px;padding:10px;color:#fff;font-weight:bold;cursor:pointer;margin-top:auto;}
        #newChatBtn:hover{background:#2ea043;}
        .main{flex:1;padding:20px;overflow-y:auto;}
        .card{background:rgba(255,255,255,0.1);border-radius:12px;padding:20px;margin-bottom:20px;backdrop-filter:blur(12px);box-shadow:0 4px 20px rgba(0,0,0,0.3);}
        .hidden{display:none;}
        #chatBox{height:60vh;overflow-y:auto;background:rgba(0,0,0,0.2);padding:15px;border-radius:8px;display:flex;flex-direction:column;}
        .msg{margin:10px 0;padding:10px 14px;border-radius:8px;max-width:70%;}
        .user{background:#2563eb;color:#fff;margin-left:auto;text-align:right;}
        .ai{background:#2d2d2d;color:#f4c542;margin-right:auto;text-align:left;}
        .search{background:#3b3b98;color:#fff;margin-right:auto;text-align:left;}
        .chatInputBox{display:flex;margin-top:10px;gap:10px;}
        .chatInputBox input{flex:1;padding:12px;border:none;border-radius:8px;background:rgba(0,0,0,0.3);color:#fff;}
        .chatInputBox button{border:none;border-radius:8px;padding:12px 16px;font-weight:bold;cursor:pointer;}
        #searchBtn{background:#6e40c9;color:#fff;}
        #searchBtn:hover{background:#925ee4;}
        #stopBtn{display:none;background:#ff4d4d;color:#fff;}
        #stopBtn:hover{background:#ff6666;}
        #loginBox{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1e3c72,#2a5298);}
        #loginBox .card{width:300px;}
        input{width:100%;margin:6px 0;padding:10px;border:none;border-radius:6px;}
      `}</style>

      <div id="loginBox">
        <div className="card">
          <h2>Login</h2>
          <input id="username" placeholder="Username"/>
          <input type="password" id="password" placeholder="Password"/>
          <button id="loginBtn">Login</button>
          <p style={{fontSize:"12px",color:"#ccc"}}>Admin → <b>marwan_alsaadi</b> / <b>Aladdin@0</b></p>
        </div>
      </div>

      <header className="hidden" id="mainHeader">
        <h1>📚 AI Study Hub – 2nde 1</h1>
        <nav>
          <button data-tab="dashboard" className="active">🏠 Dashboard</button>
          <button data-tab="assignments">📘 Assignments</button>
          <button data-tab="aistudy">🤖 AI Study</button>
          <button data-tab="schedule">📅 Schedule</button>
          <button id="adminTabBtn" className="hidden" data-tab="admin">⚡ Admin</button>
        </nav>
      </header>

      <div className="container hidden" id="mainApp">
        <div id="sidebar" className="hidden">
          <h2>💬 Chats</h2>
          <div id="chatList"></div>
          <button id="newChatBtn">+ New Chat</button>
        </div>
        <div className="main">
          <div id="dashboard" className="tab card">
            <h2>📊 Dashboard</h2>
            <p id="todayDate"></p>
            <div className="card"><h3>Next Assignment</h3><p id="nextAssignment">No assignments yet.</p></div>
            <div className="card"><h3>Recent Activity</h3><ul id="activityFeed"></ul></div>
          </div>
          <div id="assignments" className="tab card hidden">
            <h2>Assignments</h2>
            <input id="assTitle" placeholder="Assignment Title"/>
            <select id="assType"><option>Homework</option><option>Exam</option><option>Project</option></select>
            <input type="date" id="assDate"/>
            <button id="addAssignmentBtn">Add Assignment</button>
            <div id="assignmentsList"></div>
          </div>
          <div id="aistudy" className="tab hidden">
            <h2>AI Study</h2>
            <div id="chatBox"></div>
            <div className="chatInputBox">
              <input id="question" placeholder="Ask your question..."/>
              <button onClick={()=>window.askAI()}>Ask AI</button>
              <button id="searchBtn">Web Search</button>
              <button id="stopBtn">⏹ Stop</button>
            </div>
          </div>
          <div id="schedule" className="tab card hidden">
            <h2>📅 Weekly Schedule</h2>
            <div id="scheduleList"></div>
          </div>
          <div id="admin" className="tab card hidden">
            <h2>Admin</h2>
            <div id="accountsList"></div>
            <input id="newUser" placeholder="New Username"/>
            <input id="newPass" placeholder="New Password"/>
            <button id="createAccountBtn">Create User</button>
          </div>
        </div>
      </div>
    </div>
  );
}
