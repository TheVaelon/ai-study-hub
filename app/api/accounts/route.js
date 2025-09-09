import { NextResponse } from "next/server";

let accounts = { "marwan_alsaadi": "Aladdin@0" }; // default admin

export async function GET() {
  return NextResponse.json({ accounts });
}

export async function POST(req) {
  const body = await req.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Add or update account
  accounts[username] = password;

  return NextResponse.json({ success: true, accounts });
}

export async function DELETE(req) {
  const body = await req.json();
  const { username } = body;

  if (username && accounts[username]) {
    delete accounts[username];
    return NextResponse.json({ success: true, accounts });
  }

  return NextResponse.json({ error: "User not found" }, { status: 404 });
}
