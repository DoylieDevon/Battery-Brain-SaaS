import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { token, serial } = await request.json();
  if (!token || !serial) return NextResponse.json({ error: "Missing token or serial" }, { status: 400 });

  try {
    const r = await fetch(`https://api.givenergy.cloud/v1/inverter/${serial}/system-data/latest`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!r.ok) return NextResponse.json({ error: "Could not connect — check your API key and inverter serial." }, { status: 400 });
    const data = await r.json();
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json({ error: "GivEnergy API unreachable" }, { status: 502 });
  }
}
