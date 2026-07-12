"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import type { LocaleCode } from "@/lib/i18n/locales";

type AuthFormMode = "login" | "register";

type AuthFormProps = {
  locale: LocaleCode;
  mode: AuthFormMode;
  nextPath: string;
  draftToken?: string;
};

type AuthErrorBody = {
  error?: {
    message?: string;
    fields?: Record<string, string>;
  };
};

export function AuthForm({
  locale,
  mode,
  nextPath,
  draftToken,
}: AuthFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = mode === "login" ? "Sign in" : "Create account";
  const subtitle =
    mode === "login"
      ? "Sign in to generate and save your kundli charts."
      : "Create an account to generate and store your kundli charts.";
  const submitText = mode === "login" ? "Sign in" : "Create account";
  const alternatePath =
    mode === "login"
      ? `/${locale}/register${buildQuery(nextPath, draftToken)}`
      : `/${locale}/login${buildQuery(nextPath, draftToken)}`;
  const alternateLabel =
    mode === "login"
      ? "Need an account? Register"
      : "Already have an account? Sign in";

  const successRedirectPath = useMemo(() => {
    if (!draftToken) {
      return nextPath;
    }

    const separator = nextPath.includes("?") ? "&" : "?";
    return `${nextPath}${separator}draft=${encodeURIComponent(draftToken)}`;
  }, [draftToken, nextPath]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    const payload: Record<string, string> = {
      email,
      password,
    };

    if (mode === "register" && displayName.trim()) {
      payload.displayName = displayName.trim();
    }

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const body = (await response.json()) as AuthErrorBody;
      if (!response.ok) {
        setFormError(body.error?.message ?? "Authentication failed.");
        setFieldErrors(body.error?.fields ?? {});
        return;
      }

      router.replace(successRedirectPath);
      router.refresh();
    } catch {
      setFormError("Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6">
        <section className="w-full max-w-md border border-foreground/15 bg-background p-6 sm:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-foreground/50">
            Kundli account
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-foreground/65">{subtitle}</p>

          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            {mode === "register" ? (
              <Field
                error={fieldErrors.displayName}
                htmlFor="displayName"
                label="Display name"
              >
                <input
                  className={inputClassName}
                  id="displayName"
                  name="displayName"
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Your name"
                  type="text"
                  value={displayName}
                />
              </Field>
            ) : null}

            <Field error={fieldErrors.email} htmlFor="email" label="Email">
              <input
                autoComplete="email"
                className={inputClassName}
                id="email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </Field>

            <Field
              error={fieldErrors.password}
              htmlFor="password"
              label="Password"
            >
              <input
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                className={inputClassName}
                id="password"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                required
                type="password"
                value={password}
              />
            </Field>

            {formError ? (
              <p className="border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200">
                {formError}
              </p>
            ) : null}

            <button
              className="bg-foreground px-4 py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Please wait" : submitText}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between gap-3 text-sm">
            <Link
              className="text-foreground/75 underline-offset-4 hover:underline"
              href={`/${locale}`}
            >
              Back to landing
            </Link>
            <Link
              className="text-foreground/75 underline-offset-4 hover:underline"
              href={alternatePath}
            >
              {alternateLabel}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({
  children,
  error,
  htmlFor,
  label,
}: {
  children: ReactNode;
  error?: string;
  htmlFor: string;
  label: string;
}) {
  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-medium" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
      ) : null}
    </div>
  );
}

function buildQuery(nextPath: string, draftToken?: string) {
  const params = new URLSearchParams();
  params.set("next", nextPath);

  if (draftToken) {
    params.set("draft", draftToken);
  }

  return `?${params.toString()}`;
}

const inputClassName =
  "h-10 w-full border border-foreground/20 bg-background px-3 text-sm text-foreground outline-none transition focus:border-foreground disabled:opacity-60";
