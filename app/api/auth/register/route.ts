import { NextResponse } from "next/server";
import {
  AUTH_SESSION_COOKIE_NAME,
  AUTH_SESSION_TTL_SECONDS,
  createSessionToken,
} from "@/lib/auth/session";
import { AuthValidationError, registerUser } from "@/services";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          message: "Send registration details as JSON.",
          fields: { form: "The request body must be valid JSON." },
        },
      },
      { status: 400 },
    );
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json(
      {
        error: {
          message: "Send registration details as JSON.",
          fields: { form: "The request body must be a JSON object." },
        },
      },
      { status: 400 },
    );
  }

  const input = payload as Record<string, unknown>;
  const email = typeof input.email === "string" ? input.email : "";
  const password = typeof input.password === "string" ? input.password : "";
  const displayName =
    typeof input.displayName === "string" ? input.displayName : undefined;

  if (!email.trim() || !password) {
    return NextResponse.json(
      {
        error: {
          message: "Email and password are required.",
          fields: {
            ...(email.trim() ? {} : { email: "Email is required." }),
            ...(password ? {} : { password: "Password is required." }),
          },
        },
      },
      { status: 400 },
    );
  }

  try {
    const user = await registerUser({
      email,
      password,
      displayName,
    });
    const token = createSessionToken(user.id);
    const response = NextResponse.json({ user }, { status: 201 });

    response.cookies.set({
      name: AUTH_SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: AUTH_SESSION_TTL_SECONDS,
    });

    return response;
  } catch (error) {
    if (error instanceof AuthValidationError) {
      return NextResponse.json(
        {
          error: {
            message: error.message,
            fields: error.fields,
          },
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: {
          message: "Unable to create account right now.",
        },
      },
      { status: 500 },
    );
  }
}
