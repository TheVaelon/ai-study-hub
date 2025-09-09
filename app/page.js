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
  const [activeTab, setActiveTab] = useState("dashboard");
  const [question, setQuestion] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [assTitle, setAssTitle] = useState("");
  const [assType, setAssType] = useState("Homework");
  const [assDate, setAssDate] = useState("");
  const [newUser, setNewUser] = useState("");
  const [newPass, setNewPass] = useState("");

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
	  setActiveTab("dashboard");
	  loadAssignments();
	  loadAccounts();
	  loadSchedule();
	  if (chats.length === 0) {
		newChat();
	  } else {
		setCurrentChat(chats[chats.length - 1].id);
		setChatMessages(chats[chats.length - 1].messages || []);
	  }
	} else {
	  alert("❌ Invalid login");
	}
  }

  // === CHAT ===
  async function newChat() {
	const id = Date.now();
	const newC = { id, name: "New Chat", messages: [] };
	setChats((prev) => [...prev, newC]);
	setCurrentChat(id);
	setChatMessages([]);
  }

  async function addMessage(role, text) {
	let chatId = currentChat;
	if (!chatId) {
	  await newChat();
	  chatId = currentChat;
	}
	await apiCall({
	  action: "addMessage",
	  chatId: chatId,
	  message: { role, text },
	});
	const data = await apiCall({ action: "getChat", chatId: chatId });
	setChatMessages(data.messages);
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
	  setChatMessages((prevMsgs) => {
		const baseMsgs = prevMsgs.filter((m, idx) => idx !== prevMsgs.length - 1 || m.role !== "ai");
		return [...baseMsgs, msg];
	  });
	  await new Promise((r) => setTimeout(r, 5));
	}
	stopTyping = false;
  }
  function stopTypingNow() {
	stopTyping = true;
  }

  // === ASK AI ===
  async function askAI() {
	if (!question.trim()) return;
	await addMessage("user", question.trim());
	await addMessage("ai", "🤔 Thinking...");
	setQuestion("");
	const data = await apiCall({ q: question.trim(), web: false });
	typeWriter(data.reply);
  }

  // === WEB SEARCH ===
  async function webSearch() {
	if (!question.trim()) return;
	await addMessage("user", question.trim() + " (search)");
	await addMessage("search", "🌍 Searching the web...");
	setQuestion("");
	const data = await apiCall({ q: question.trim(), web: true });
	typeWriter("[Web] " + data.reply);
  }

  // === ASSIGNMENTS ===
  async function loadAssignments() {
	const data = await apiCall({ action: "getAssignments" });
	setAssignments(data.assignments || []);
  }
  async function addAssignment() {
	if (!assTitle.trim() || !assDate) return alert("Fill all fields");
	await apiCall({
	  action: "addAssignment",
	  title: assTitle.trim(),
	  type: assType,
	  date: assDate,
	  user: currentUser,
	});
	setAssTitle("");
	setAssType("Homework");
	setAssDate("");
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
	await apiCall({
	  action: "createUser",
	  username: u,
	  password: p,
	  caller: currentUser,
	});
	setNewUser("");
	setNewPass("");
	loadAccounts();
  }
  async function deleteAccount(u) {
	if (!isAdmin) return;
	await apiCall({
	  action: "deleteUser",
	  username: u,
	  caller: currentUser,
	});
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
			<button
			  data-tab="dashboard"
			  className={activeTab === "dashboard" ? "active" : ""}
			  onClick={() => setActiveTab("dashboard")}
			>
			  🏠 Dashboard
			</button>
			<button
			  data-tab="assignments"
			  className={activeTab === "assignments" ? "active" : ""}
			  onClick={() => setActiveTab("assignments")}
			>
			  📘 Assignments
			</button>
			<button
			  data-tab="aistudy"
			  className={activeTab === "aistudy" ? "active" : ""}
			  onClick={() => setActiveTab("aistudy")}
			>
			  🤖 AI Study
			</button>
			<button
			  data-tab="schedule"
			  className={activeTab === "schedule" ? "active" : ""}
			  onClick={() => setActiveTab("schedule")}
			>
			  📅 Schedule
			</button>
			{isAdmin && (
			  <button
				id="adminTabBtn"
				data-tab="admin"
				className={activeTab === "admin" ? "active" : ""}
				onClick={() => setActiveTab("admin")}
			  >
				⚡ Admin
			  </button>
			)}
		  </nav>
		</header>
	  )}
	  {/* MAIN */}
	  {currentUser && (
		<div className="container" id="mainApp">
		  {/* Sidebar */}
		  <div id="sidebar" className={activeTab === "aistudy" ? "" : "hidden"}>
			<h2>💬 Chats</h2>
			{/* Chat list rendering can go here */}
			<button id="newChatBtn" onClick={newChat}>+ New Chat</button>
		  </div>
		  <div className="main">
			{/* Dashboard */}
			{activeTab === "dashboard" && (
			  <div id="dashboard" className="tab card">
				<h2>📊 Dashboard</h2>
				<p id="todayDate">{new Date().toDateString()}</p>
				<div className="card"><h3>Next Assignment</h3><p id="nextAssignment">No assignments yet.</p></div>
				<div className="card"><h3>Recent Activity</h3><ul id="activityFeed"></ul></div>
			  </div>
			)}
			{/* Assignments */}
			{activeTab === "assignments" && (
			  <div id="assignments" className="tab card">
				<h2>Assignments</h2>
				<input value={assTitle} onChange={e=>setAssTitle(e.target.value)} placeholder="Assignment Title"/>
				<select value={assType} onChange={e=>setAssType(e.target.value)}><option>Homework</option><option>Exam</option><option>Project</option></select>
				<input type="date" value={assDate} onChange={e=>setAssDate(e.target.value)}/>
				<button id="addAssignmentBtn" onClick={addAssignment}>Add Assignment</button>
				<div id="assignmentsList">
				  {assignments.map((a,i)=>(
					<div key={i} className="card">
					  <b>{a.title}</b> ({a.type}) due {a.date}
					  <br/>
					  <small>by {a.user}</small>
					</div>
				  ))}
				</div>
			  </div>
			)}
			{/* AI Study */}
			{activeTab === "aistudy" && (
			  <div id="aistudy" className="tab">
				<h2>AI Study</h2>
				<div id="chatBox">
				  {chatMessages.map((m, i) => (
					<div key={i} className={"msg " + m.role}>{m.text}</div>
				  ))}
				</div>
				<div className="chatInputBox">
				  <input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask your question..."/>
				  <button onClick={askAI}>Ask AI</button>
				  <button id="searchBtn" onClick={webSearch}>Web Search</button>
				  <button id="stopBtn" onClick={stopTypingNow}>⏹ Stop</button>
				</div>
			  </div>
			)}
			{/* Schedule */}
			{activeTab === "schedule" && (
			  <div id="schedule" className="tab card">
				<h2>📅 Weekly Schedule</h2>
				<div id="scheduleList">
				  {Object.entries(schedule).length === 0 ? (
					<p>No schedule available.</p>
				  ) : (
					Object.entries(schedule).map(([day, events], idx) => (
					  <div key={idx} className="card">
						<b>{day}</b>
						<ul>
						  {events.map((ev, i) => <li key={i}>{ev}</li>)}
						</ul>
					  </div>
					))
				  )}
				</div>
			  </div>
			)}
			{/* Admin */}
			{isAdmin && activeTab === "admin" && (
			  <div id="admin" className="tab card">
				<h2>Admin</h2>
				<div id="accountsList">
				  {Object.entries(accounts).map(([u, p], i) => (
					<div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
					  <span>{u}</span>
					  <button style={{marginLeft:8}} onClick={()=>deleteAccount(u)}>Delete</button>
					</div>
				  ))}
				</div>
				<input value={newUser} onChange={e=>setNewUser(e.target.value)} placeholder="New Username"/>
				<input value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="New Password"/>
				<button onClick={()=>{
				  if(!newUser.trim()||!newPass.trim())return alert("Fill fields");
				  createAccount(newUser.trim(),newPass.trim());
				}}>Create User</button>
			  </div>
			)}
		  </div>
		</div>
	  )}
	</div>
  );
}