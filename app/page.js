"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    let currentChat = null, currentUser = null, isAdmin = false;

    // === Helper: API call to backend ===
    async function api(body) {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return res.json();
    }

    // === LOGIN ===
    document.getElementById("loginBtn").addEventListener("click", async () => {
      const u = document.getElementById("username").value.trim();
      const p = document.getElementById("password").value.trim();
      const res = await api({ action: "login", username: u, password: p });
      if (res.success) {
        currentUser = u; 
        isAdmin = (u === "marwan_alsaadi");
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("mainHeader").classList.remove("hidden");
        document.getElementById("mainApp").classList.remove("hidden");
        if (isAdmin) document.getElementById("adminTabBtn").classList.remove("hidden");
        updateDashboard(); renderAssignments(); renderAccounts(); renderChatList(); renderSchedule();
        if (!res.chats || res.chats.length === 0) { newChat(); } 
        else { currentChat = res.chats[res.chats.length - 1].id; renderMessages(res.chats); }
      } else {
        alert("❌ Invalid login");
      }
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
    async function newChat() {
      const id = Date.now();
      await api({ action: "newChat", id, caller: currentUser });
      currentChat = id; renderChatList(); renderMessages();
    }
    async function renderChatList() {
      const res = await api({ action: "getChats", caller: currentUser });
      const list = document.getElementById("chatList");
      list.innerHTML = "";
      res.chats.forEach(c => {
        const div = document.createElement("div");
        div.className = "chatItem";
        div.textContent = c.name;
        div.onclick = () => { currentChat = c.id; renderMessages(); };
        list.appendChild(div);
      });
    }
    async function renderMessages(chatsData) {
      const res = chatsData || await api({ action: "getChats", caller: currentUser });
      const chat = res.chats.find(c => c.id === currentChat);
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
    async function addMessage(role, text) {
      await api({ action: "addMessage", caller: currentUser, chatId: currentChat, role, text });
      renderChatList(); renderMessages();
    }
    let stopTyping = false;
    async function typeWriter(text) {
      const res = await api({ action: "addMessage", caller: currentUser, chatId: currentChat, role: "ai", text: "" });
      let msgText = "";
      document.getElementById("stopBtn").style.display = "inline-block";
      for (let i = 0; i < text.length; i++) {
        if (stopTyping) { msgText = text; break; }
        msgText += text[i];
        await api({ action: "updateLastMessage", caller: currentUser, chatId: currentChat, text: msgText });
        renderMessages();
        await new Promise(r => setTimeout(r, 5));
      }
      stopTyping = false;
      document.getElementById("stopBtn").style.display = "none";
    }
    document.getElementById("stopBtn").addEventListener("click", () => { stopTyping = true; });
"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    let currentChat = null, currentUser = null, isAdmin = false;

    // === Helper: API call to backend ===
    async function api(body) {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return res.json();
    }

    // === LOGIN ===
    document.getElementById("loginBtn").addEventListener("click", async () => {
      const u = document.getElementById("username").value.trim();
      const p = document.getElementById("password").value.trim();
      const res = await api({ action: "login", username: u, password: p });
      if (res.success) {
        currentUser = u; 
        isAdmin = (u === "marwan_alsaadi");
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("mainHeader").classList.remove("hidden");
        document.getElementById("mainApp").classList.remove("hidden");
        if (isAdmin) document.getElementById("adminTabBtn").classList.remove("hidden");
        updateDashboard(); renderAssignments(); renderAccounts(); renderChatList(); renderSchedule();
        if (!res.chats || res.chats.length === 0) { newChat(); } 
        else { currentChat = res.chats[res.chats.length - 1].id; renderMessages(res.chats); }
      } else {
        alert("❌ Invalid login");
      }
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
    async function newChat() {
      const id = Date.now();
      await api({ action: "newChat", id, caller: currentUser });
      currentChat = id; renderChatList(); renderMessages();
    }
    async function renderChatList() {
      const res = await api({ action: "getChats", caller: currentUser });
      const list = document.getElementById("chatList");
      list.innerHTML = "";
      res.chats.forEach(c => {
        const div = document.createElement("div");
        div.className = "chatItem";
        div.textContent = c.name;
        div.onclick = () => { currentChat = c.id; renderMessages(); };
        list.appendChild(div);
      });
    }
    async function renderMessages(chatsData) {
      const res = chatsData || await api({ action: "getChats", caller: currentUser });
      const chat = res.chats.find(c => c.id === currentChat);
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
    async function addMessage(role, text) {
      await api({ action: "addMessage", caller: currentUser, chatId: currentChat, role, text });
      renderChatList(); renderMessages();
    }
    let stopTyping = false;
    async function typeWriter(text) {
      const res = await api({ action: "addMessage", caller: currentUser, chatId: currentChat, role: "ai", text: "" });
      let msgText = "";
      document.getElementById("stopBtn").style.display = "inline-block";
      for (let i = 0; i < text.length; i++) {
        if (stopTyping) { msgText = text; break; }
        msgText += text[i];
        await api({ action: "updateLastMessage", caller: currentUser, chatId: currentChat, text: msgText });
        renderMessages();
        await new Promise(r => setTimeout(r, 5));
      }
      stopTyping = false;
      document.getElementById("stopBtn").style.display = "none";
    }
    document.getElementById("stopBtn").addEventListener("click", () => { stopTyping = true; });
    // === ADMIN: Schedule ===
    async function renderSchedule() {
      const res = await api({ action: "getSchedule" });
      const list = document.getElementById("scheduleList");
      list.innerHTML = "";
      Object.keys(res.schedule || {}).forEach(day => {
        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `<h3>${day}</h3><ul>${res.schedule[day].map(c => "<li>" + c + "</li>").join("")}</ul>`;
        if (isAdmin) {
          const textarea = document.createElement("textarea");
          textarea.style.width = "100%";
          textarea.value = res.schedule[day].join("\n");
          const btn = document.createElement("button");
          btn.textContent = "💾 Save";
          btn.onclick = async () => {
            await api({ action: "updateSchedule", password: textarea.value.split("\n"), username: day, caller: currentUser });
            renderSchedule();
          };
          div.appendChild(textarea);
          div.appendChild(btn);
        }
        list.appendChild(div);
      });
    }
  }, []);

  return (
    <div>
      <style>{`
        body {margin:0;font-family:'Segoe UI',sans-serif;background:linear-gradient(135deg,#1e3c72,#2a5298);color:#fff;height:100vh;overflow:hidden;}
        header{padding:12px 20px;background:rgba(0,0,0,0.3);display:flex;justify-content:space-between;align-items:center;backdrop-filter:blur(10px);box-shadow:0 4px 15px rgba(0,0,0,0.3);}
        nav button{margin-left:10px;background:rgba(255,255,255,0.15);border:none;border-radius:8px;padding:10px 16px;color:#fff;cursor:pointer;font-weight:600;transition:all 0.3s;}
        nav button:hover,nav button.active{background:#4c6ef5;transform:scale(1.05);}
        .container{flex:1;display:flex;overflow:hidden;}
        #sidebar{width:240px;background:rgba(0,0,0,0.25);padding:15px;display:flex;flex-direction:column;backdrop-filter:blur(8px);border-right:1px solid rgba(255,255,255,0.2);}
        #sidebar h2{font-size:16px;margin-bottom:12px;}
        .chatItem{background:rgba(255,255,255,0.1);padding:10px;border-radius:10px;margin-bottom:10px;cursor:pointer;transition:0.3s;}
        .chatItem:hover{background:rgba(255,255,255,0.25);transform:translateX(5px);}
        #newChatBtn{background:#238636;border:none;border-radius:8px;padding:12px;color:#fff;font-weight:bold;cursor:pointer;margin-top:auto;transition:0.3s;}
        #newChatBtn:hover{background:#2ea043;transform:scale(1.05);}
        .main{flex:1;padding:20px;overflow-y:auto;}
        .card{background:rgba(255,255,255,0.1);border-radius:14px;padding:20px;margin-bottom:20px;backdrop-filter:blur(12px);box-shadow:0 6px 25px rgba(0,0,0,0.35);transition:0.3s;}
        .card:hover{transform:scale(1.01);}
        .hidden{display:none;}
        #chatBox{height:60vh;overflow-y:auto;background:rgba(0,0,0,0.3);padding:15px;border-radius:10px;display:flex;flex-direction:column;}
        .msg{margin:10px 0;padding:12px 16px;border-radius:10px;max-width:75%;font-size:15px;line-height:1.4;}
        .user{background:#2563eb;color:#fff;margin-left:auto;text-align:right;}
        .ai{background:#2d2d2d;color:#f4c542;margin-right:auto;text-align:left;}
        .search{background:#3b3b98;color:#fff;margin-right:auto;text-align:left;}
        .chatInputBox{display:flex;margin-top:10px;gap:10px;}
        .chatInputBox input{flex:1;padding:14px;border:none;border-radius:10px;background:rgba(0,0,0,0.35);color:#fff;font-size:14px;}
        .chatInputBox button{border:none;border-radius:10px;padding:12px 16px;font-weight:bold;cursor:pointer;transition:0.3s;}
        #searchBtn{background:#6e40c9;color:#fff;} #searchBtn:hover{background:#925ee4;}
        #stopBtn{display:none;background:#ff4d4d;color:#fff;} #stopBtn:hover{background:#ff6666;}
        #loginBox{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1e3c72,#2a5298);}
        #loginBox .card{width:320px;}
        input{width:100%;margin:6px 0;padding:12px;border:none;border-radius:8px;}
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
            <textarea id="announceText" placeholder="Write announcement..."></textarea>
            <button id="announceBtn">Send Announcement</button>
          </div>
        </div>
      </div>
    </div>
  );
}
