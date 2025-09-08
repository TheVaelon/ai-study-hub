"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    let currentChat = null, currentUser = null, isAdmin = false;

    // === Helpers ===
    async function apiCall(body) {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return res.json();
    }

    // LOGIN
    document.getElementById("loginBtn").addEventListener("click", async () => {
      const u = document.getElementById("username").value.trim();
      const p = document.getElementById("password").value.trim();
      const data = await apiCall({ action: "login", username: u, password: p });
      if (data.success) {
        currentUser = u; isAdmin = data.admin;
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("mainHeader").classList.remove("hidden");
        document.getElementById("mainApp").classList.remove("hidden");
        if (isAdmin) document.getElementById("adminTabBtn").classList.remove("hidden");
        loadAssignments(); renderChatList(); loadSchedule();
      } else alert("❌ Invalid login");
    });

    // SWITCH TABS
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
    async function newChat() {
      currentChat = Date.now();
      renderMessages([]);
    }
    function renderMessages(msgs) {
      const box = document.getElementById("chatBox");
      box.innerHTML = "";
      msgs.forEach(m => {
        const div = document.createElement("div");
        div.className = "msg " + m.role;
        div.textContent = m.text;
        box.appendChild(div);
      });
      setTimeout(() => { box.scrollTop = box.scrollHeight; }, 50);
    }
    async function addMessage(role, text) {
      if (!currentChat) await newChat();
      await apiCall({ action: "addMessage", chatId: currentChat, message: { role, text } });
      const data = await apiCall({ action: "getChat", chatId: currentChat });
      renderMessages(data.messages);
    }
    let stopTyping = false;
    async function typeWriter(text) {
      let msg = { role: "ai", text: "" };
      for (let i = 0; i < text.length; i++) {
        if (stopTyping) { msg.text = text; break; }
        msg.text += text[i];
        renderMessages([...document.querySelectorAll("#chatBox .msg")].map(div => ({ role: div.classList[1], text: div.textContent })).concat(msg));
        await new Promise(r => setTimeout(r, 5));
      }
      stopTyping = false;
    }
    document.getElementById("stopBtn").addEventListener("click", () => { stopTyping = true; });

    // ASK AI
    window.askAI = async function () {
      const q = document.getElementById("question").value.trim();
      if (!q) return;
      await addMessage("user", q);
      await addMessage("ai", "🤔 Thinking...");
      document.getElementById("question").value = "";
      const data = await apiCall({ q, web: false });
      typeWriter(data.reply);
    };

    // WEB SEARCH
    async function webSearch() {
      const q = document.getElementById("question").value.trim(); if (!q) return;
      await addMessage("user", q + " (search)");
      await addMessage("search", "🌍 Searching the web...");
      document.getElementById("question").value = "";
      const data = await apiCall({ q, web: true });
      typeWriter("[Web] " + data.reply);
    }
    document.getElementById("searchBtn").addEventListener("click", webSearch);
    document.getElementById("question").addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); window.askAI(); }
    });

    document.getElementById("newChatBtn").addEventListener("click", newChat);
    // === DASHBOARD ===
    async function loadAssignments() {
      const data = await apiCall({ action: "getAssignments" });
      renderAssignments(data.assignments || []);
    }
    function renderAssignments(assignments) {
      const list = document.getElementById("assignmentsList");
      list.innerHTML = "";
      assignments.forEach((a, i) => {
        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `<b>${a.title}</b> (${a.type}) due ${a.date}<br><small>by ${a.user}</small>`;
        if (isAdmin) {
          const btn = document.createElement("button");
          btn.textContent = "🗑";
          btn.onclick = async () => {
            await apiCall({ action: "deleteAssignment", index: i });
            loadAssignments();
          };
          div.appendChild(btn);
        }
        list.appendChild(div);
      });
    }
    document.getElementById("addAssignmentBtn").addEventListener("click", async () => {
      const t = document.getElementById("assTitle").value.trim();
      const ty = document.getElementById("assType").value;
      const d = document.getElementById("assDate").value;
      if (!t || !d) return alert("Fill all fields");
      await apiCall({ action: "addAssignment", title: t, type: ty, date: d, user: currentUser });
      loadAssignments();
    });

    // === SCHEDULE ===
    async function loadSchedule() {
      const data = await apiCall({ action: "getSchedule" });
      renderSchedule(data.schedule || {});
    }
    function renderSchedule(schedule) {
      const list = document.getElementById("scheduleList");
      list.innerHTML = "";
      Object.keys(schedule).forEach(day => {
        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `<h3>${day}</h3><ul>${schedule[day].map(c => "<li>" + c + "</li>").join("")}</ul>`;
        if (isAdmin) {
          const textarea = document.createElement("textarea");
          textarea.style.width = "100%";
          textarea.value = schedule[day].join("\n");
          const btn = document.createElement("button");
          btn.textContent = "💾 Save";
          btn.onclick = async () => {
            await apiCall({ action: "updateSchedule", username: "dummy", password: textarea.value.split("\n"), caller: currentUser });
            loadSchedule();
          };
          div.appendChild(textarea);
          div.appendChild(btn);
        }
        list.appendChild(div);
      });
    }

    // === ADMIN ===
    async function loadAccounts() {
      const data = await apiCall({ action: "getAccounts" });
      renderAccounts(data.accounts || {});
    }
    function renderAccounts(accounts) {
      const list = document.getElementById("accountsList");
      list.innerHTML = "";
      Object.keys(accounts).forEach(u => {
        if (u === "marwan_alsaadi") return;
        const div = document.createElement("div");
        div.innerHTML = `<b>${u}</b>`;
        if (isAdmin) {
          const del = document.createElement("button");
          del.textContent = "Delete";
          del.onclick = async () => {
            await apiCall({ action: "deleteUser", username: u, caller: currentUser });
            loadAccounts();
          };
          div.appendChild(del);
        }
        list.appendChild(div);
      });
    }
    document.getElementById("createAccountBtn").addEventListener("click", async () => {
      if (!isAdmin) return;
      const u = document.getElementById("newUser").value.trim();
      const p = document.getElementById("newPass").value.trim();
      if (!u || !p) return alert("Fill fields");
      await apiCall({ action: "createUser", username: u, password: p, caller: currentUser });
      loadAccounts();
    });
  }, []);

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

      {/* Login */}
      <div id="loginBox">
        <div className="card">
          <h2>Login</h2>
          <input id="username" placeholder="Username"/>
          <input type="password" id="password" placeholder="Password"/>
          <button id="loginBtn">Login</button>
          <p style={{fontSize:"12px",color:"#ccc"}}>Admin → <b>marwan_alsaadi</b> / <b>Aladdin@0</b></p>
        </div>
      </div>

      {/* Header */}
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

      {/* Main */}
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
