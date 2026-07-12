import { NextResponse } from "next/server";
import { getSessionUserIdFromRequest, getUserById } from "@/services";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
