"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { AppStrings } from "@/lib/i18n/app-strings";
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
  const messages = AppStrings.forLocale(locale);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title =
    mode === "login" ? messages.auth.signInTitle : messages.auth.registerTitle;
  const submitText =
    mode === "login"
      ? messages.auth.submitSignIn
      : messages.auth.submitRegister;
  const alternatePath =
    mode === "login"
      ? `/${locale}/register${buildQuery(nextPath, draftToken)}`
      : `/${locale}/login${buildQuery(nextPath, draftToken)}`;
  const alternateLabel =
    mode === "login"
      ? messages.auth.needAccount
      : messages.auth.alreadyHaveAccount;

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
        setFormError(body.error?.message ?? messages.auth.authFailed);
        setFieldErrors(body.error?.fields ?? {});
        return;
      }

      router.replace(successRedirectPath);
      router.refresh();
    } catch {
      setFormError(messages.auth.authFailedRetry);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="app-surface relative isolate min-h-screen overflow-hidden text-[var(--ink)]">
      <div
        aria-hidden="true"
        className="app-grid absolute inset-0 opacity-60"
      />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
        <header className="py-5 sm:py-7">
          <Link className="inline-block" href={`/${locale}`}>
            <p className="font-display text-2xl leading-none font-semibold sm:text-3xl">
              {messages.app.title}
            </p>
            <p className="mt-1 hidden text-[0.65rem] font-semibold uppercase text-[var(--ink-muted)] sm:block">
              {messages.app.eyebrow}
            </p>
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center py-10 sm:py-14">
          <section className="w-full max-w-md rounded-md border border-[var(--line)] bg-[var(--paper)] p-5 shadow-[0_24px_70px_rgba(48,37,26,0.09)] sm:p-8">
            <h1 className="font-display text-4xl leading-tight font-medium">
              {title}
            </h1>

            <form className="mt-7 grid gap-4" onSubmit={handleSubmit}>
              {mode === "register" ? (
                <Field
                  error={fieldErrors.displayName}
                  htmlFor="displayName"
                  label={messages.auth.displayName}
                >
                  <input
                    className={inputClassName}
                    id="displayName"
                    name="displayName"
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder={messages.auth.displayNamePlaceholder}
                    type="text"
                    value={displayName}
                  />
                </Field>
              ) : null}

              <Field
                error={fieldErrors.email}
                htmlFor="email"
                label={messages.auth.email}
              >
                <input
                  autoComplete="email"
                  className={inputClassName}
                  id="email"
                  name="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={messages.auth.emailPlaceholder}
                  required
                  type="email"
                  value={email}
                />
              </Field>

              <Field
                error={fieldErrors.password}
                htmlFor="password"
                label={messages.auth.password}
              >
                <input
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  className={inputClassName}
                  id="password"
                  name="password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={messages.auth.passwordPlaceholder}
                  required
                  type="password"
                  value={password}
                />
              </Field>

              {formError ? (
                <p className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </p>
              ) : null}

              <button
                className="min-h-12 rounded-sm bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-55"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? messages.auth.submitting : submitText}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-end text-sm">
              <Link
                className="font-medium text-[var(--ink-muted)] underline-offset-4 hover:text-[var(--ink)] hover:underline"
                href={alternatePath}
              >
                {alternateLabel}
              </Link>
            </div>
          </section>
        </div>
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
      <label
        className="text-sm font-medium text-[var(--ink)]"
        htmlFor={htmlFor}
      >
        {label}
      </label>
      {children}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
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
  "h-12 w-full rounded-sm border border-[var(--line-strong)] bg-white px-3 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] disabled:opacity-60";
