import { NextResponse } from "next/server";
import {
  AUTH_SESSION_COOKIE_NAME,
  AUTH_SESSION_TTL_SECONDS,
  createSessionToken,
} from "@/lib/auth/session";
import {
  AuthCredentialsError,
  AuthValidationError,
  loginUser,
} from "@/services";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          message: "Send login details as JSON.",
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
          message: "Send login details as JSON.",
          fields: { form: "The request body must be a JSON object." },
        },
      },
      { status: 400 },
    );
  }

  const input = payload as Record<string, unknown>;
  const email = typeof input.email === "string" ? input.email : "";
  const password = typeof input.password === "string" ? input.password : "";

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
    const user = await loginUser({ email, password });
    const token = createSessionToken(user.id);
    const response = NextResponse.json({ user });

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
    if (error instanceof AuthCredentialsError) {
      return NextResponse.json(
        {
          error: {
            message: error.message,
          },
        },
        { status: 401 },
      );
    }

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
          message: "Unable to sign in right now.",
        },
      },
      { status: 500 },
    );
  }
}
