import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
};

export class AuthValidationError extends Error {
  readonly fields: Record<string, string>;

  constructor(fields: Record<string, string>) {
    super("Please check the highlighted auth fields.");
    this.name = "AuthValidationError";
    this.fields = fields;
  }
}

export class AuthCredentialsError extends Error {
  constructor(message = "Invalid email or password.") {
    super(message);
    this.name = "AuthCredentialsError";
  }
}

export async function registerUser(payload: {
  email: string;
  password: string;
  displayName?: string;
}) {
  const email = payload.email.trim().toLowerCase();
  const displayName = payload.displayName?.trim() || null;
  const fields: Record<string, string> = {};

  if (!isValidEmail(email)) {
    fields.email = "Use a valid email address.";
  }

  if (!isStrongEnoughPassword(payload.password)) {
    fields.password = "Password must be at least 8 characters.";
  }

  if (Object.keys(fields).length > 0) {
    throw new AuthValidationError(fields);
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    throw new AuthValidationError({
      email: "This email is already registered.",
    });
  }

  const user = await db.user.create({
    data: {
      email,
      displayName,
      passwordHash: hashPassword(payload.password),
    },
    select: {
      id: true,
      email: true,
      displayName: true,
    },
  });

  return user satisfies AuthUser;
}

export async function loginUser(payload: { email: string; password: string }) {
  const email = payload.email.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email } });

  if (!user || !verifyPassword(payload.password, user.passwordHash)) {
    throw new AuthCredentialsError();
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  } satisfies AuthUser;
}

export async function getUserById(userId: string) {
  if (!userId) {
    return null;
  }

  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      displayName: true,
    },
  });
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isStrongEnoughPassword(value: string) {
  return value.trim().length >= 8;
}
