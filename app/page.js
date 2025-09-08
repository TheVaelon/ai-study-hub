"use client";
import { useState, useEffect } from "react";

export default function Home() {
  // === State ===
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [accounts, setAccounts] = useState({});
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [schedule, setSchedule] = useState({});

  // === API Helper ===
  async function apiCall(body) {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  // === LOGIN ===
  async function handleLogin() {
    const data = await apiCall({ action: "getAccounts" });
    const accs = data.accounts || { marwan_alsaadi: "Aladdin@0" };
    setAccounts(accs);

    if (accs[username] && accs[username] === password) {
      setCurrentUser(username);
      setIsAdmin(username === "marwan_alsaadi");

      document.getElementById("loginBox").style.display = "none";
      document.getElementById("mainHeader").classList.remove("hidden");
      document.getElementById("mainApp").classList.remove("hidden");
      if (username === "marwan_alsaadi") {
        document.getElementById("adminTabBtn").classList.remove("hidden");
      }

      loadAssignments();
      loadAccounts();
      loadSchedule();
      if (chats.length === 0) {
        newChat();
      } else {
        setCurrentChat(chats[chats.length - 1].id);
        renderMessages(chats[chats.length - 1].messages || []);
      }
    } else {
      alert("❌ Invalid login");
    }
  }

  // === CHAT ===
  async function newChat() {
    const id = Date.now();
    const newC = { id, name: "New Chat", messages: [] };
    setChats([...chats, newC]);
    setCurrentChat(id);
    renderMessages([]);
  }

  function renderMessages(msgs) {
    const box = document.getElementById("chatBox");
    if (!box) return;
    box.innerHTML = "";
    msgs.forEach((m) => {
      const div = document.createElement("div");
      div.className = "msg " + m.role;
      div.textContent = m.text;
      box.appendChild(div);
    });
    setTimeout(() => {
      box.scrollTop = box.scrollHeight;
    }, 50);
  }

  async function addMessage(role, text) {
    if (!currentChat) await newChat();
    await apiCall({
      action: "addMessage",
      chatId: currentChat,
      message: { role, text },
    });
    const data = await apiCall({ action: "getChat", chatId: currentChat });
    renderMessages(data.messages);
  }

  let stopTyping = false;
  async function typeWriter(text) {
    let msg = { role: "ai", text: "" };
    for (let i = 0; i < text.length; i++) {
      if (stopTyping) {
        msg.text = text;
        break;
      }
      msg.text += text[i];
      renderMessages(
        [...document.querySelectorAll("#chatBox .msg")].map((div) => ({
          role: div.classList[1],
          text: div.textContent,
        })).concat(msg)
      );
      await new Promise((r) => setTimeout(r, 5));
    }
    stopTyping = false;
  }

  function stopTypingNow() {
    stopTyping = true;
  }

  // === ASK AI ===
  async function askAI() {
    const q = document.getElementById("question").value.trim();
    if (!q) return;
    await addMessage("user", q);
    await addMessage("ai", "🤔 Thinking...");
    document.getElementById("question").value = "";
    const data = await apiCall({ q, web: false });
    typeWriter(data.reply);
  }

  // === WEB SEARCH ===
  async function webSearch() {
    const q = document.getElementById("question").value.trim();
    if (!q) return;
    await addMessage("user", q + " (search)");
    await addMessage("search", "🌍 Searching the web...");
    document.getElementById("question").value = "";
    const data = await apiCall({ q, web: true });
    typeWriter("[Web] " + data.reply);
  }

  // === ASSIGNMENTS ===
  async function loadAssignments() {
    const data = await apiCall({ action: "getAssignments" });
    setAssignments(data.assignments || []);
  }

  async function addAssignment() {
    const t = document.getElementById("assTitle").value.trim();
    const ty = document.getElementById("assType").value;
    const d = document.getElementById("assDate").value;
    if (!t || !d) return alert("Fill all fields");
    await apiCall({
      action: "addAssignment",
      title: t,
      type: ty,
      date: d,
      user: currentUser,
    });
    loadAssignments();
  }
  // === SCHEDULE ===
  async function loadSchedule() {
    const data = await apiCall({ action: "getSchedule" });
    setSchedule(data.schedule || {});
  }

  // === ADMIN ACCOUNTS ===
  async function loadAccounts() {
    const data = await apiCall({ action: "getAccounts" });
    setAccounts(data.accounts || {});
  }

  async function createAccount(u, p) {
    if (!isAdmin) return;
    await apiCall({ action: "createUser", username: u, password: p, caller: currentUser });
    loadAccounts();
  }

  async function deleteAccount(u) {
    if (!isAdmin) return;
    await apiCall({ action: "deleteUser", username: u, caller: currentUser });
    loadAccounts();
  }

  // === JSX RETURN ===
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

      {/* LOGIN */}
      {!currentUser && (
        <div id="loginBox">
          <div className="card">
            <h2>Login</h2>
            <input value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="Username"/>
            <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password"/>
            <button onClick={handleLogin}>Login</button>
            <p style={{fontSize:"12px",color:"#ccc"}}>Admin → <b>marwan_alsaadi</b> / <b>Aladdin@0</b></p>
          </div>
        </div>
      )}

      {/* HEADER */}
      {currentUser && (
        <header id="mainHeader">
          <h1>📚 AI Study Hub – 2nde 1</h1>
          <nav>
            <button data-tab="dashboard" className="active">🏠 Dashboard</button>
            <button data-tab="assignments">📘 Assignments</button>
            <button data-tab="aistudy">🤖 AI Study</button>
            <button data-tab="schedule">📅 Schedule</button>
            {isAdmin && <button id="adminTabBtn" data-tab="admin">⚡ Admin</button>}
          </nav>
        </header>
      )}

      {/* MAIN */}
      {currentUser && (
        <div className="container" id="mainApp">
          {/* Sidebar */}
          <div id="sidebar" className="hidden">
            <h2>💬 Chats</h2>
            <div id="chatList"></div>
            <button id="newChatBtn" onClick={newChat}>+ New Chat</button>
          </div>

          <div className="main">
            {/* Dashboard */}
            <div id="dashboard" className="tab card">
              <h2>📊 Dashboard</h2>
              <p id="todayDate">{new Date().toDateString()}</p>
              <div className="card"><h3>Next Assignment</h3><p id="nextAssignment">No assignments yet.</p></div>
              <div className="card"><h3>Recent Activity</h3><ul id="activityFeed"></ul></div>
            </div>

            {/* Assignments */}
            <div id="assignments" className="tab card hidden">
              <h2>Assignments</h2>
              <input id="assTitle" placeholder="Assignment Title"/>
              <select id="assType"><option>Homework</option><option>Exam</option><option>Project</option></select>
              <input type="date" id="assDate"/>
              <button id="addAssignmentBtn" onClick={addAssignment}>Add Assignment</button>
              <div id="assignmentsList">
                {assignments.map((a,i)=>(
                  <div key={i} className="card">
                    <b>{a.title}</b> ({a.type}) due {a.date} <br/>
                    <small>by {a.user}</small>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Study */}
            <div id="aistudy" className="tab hidden">
              <h2>AI Study</h2>
              <div id="chatBox"></div>
              <div className="chatInputBox">
                <input id="question" placeholder="Ask your question..."/>
                <button onClick={askAI}>Ask AI</button>
                <button id="searchBtn" onClick={webSearch}>Web Search</button>
                <button id="stopBtn" onClick={stopTypingNow}>⏹ Stop</button>
              </div>
            </div>

            {/* Schedule */}
            <div id="schedule" className="tab card hidden">
              <h2>📅 Weekly Schedule</h2>
              <div id="scheduleList"></div>
            </div>

            {/* Admin */}
            {isAdmin && (
              <div id="admin" className="tab card hidden">
                <h2>Admin</h2>
                <div id="accountsList"></div>
                <input id="newUser" placeholder="New Username"/>
                <input id="newPass" placeholder="New Password"/>
                <button onClick={()=>{
                  const u=document.getElementById("newUser").value.trim();
                  const p=document.getElementById("newPass").value.trim();
                  if(!u||!p)return alert("Fill fields");
                  createAccount(u,p);
                }}>Create User</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
