"use client";

import { useState, Suspense, useEffect } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CONCURRENT_SESSION_ERROR } from "@/lib/auth-constants";
import { useT } from "@/components/LocaleProvider";
import { AuthPageLayout, authInputClass, authPrimaryBtnClass } from "@/components/auth/AuthPageLayout";
import { PasswordInput } from "@/components/auth/PasswordInput";

const REMEMBER_EMAIL_KEY = "remembered_login_email";

function LoginForm() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [concurrentSession, setConcurrentSession] = useState(false);
  const [forceLogoutLoading, setForceLogoutLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const reasonElsewhere = searchParams.get("reason") === "session_ended_elsewhere";

  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (saved) {
        setEmail(saved);
        setRememberMe(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setConcurrentSession(false);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error === CONCURRENT_SESSION_ERROR) {
        setConcurrentSession(true);
        setLoading(false);
        return;
      }
      if (res?.error) {
        setError(t("auth.login.invalidCredentials", "Email/phone or password is incorrect"));
        setLoading(false);
        return;
      }
      try {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      } catch {
        /* ignore */
      }
      router.push(callbackUrl);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleForceLogoutOther(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setForceLogoutLoading(true);
    try {
      const r = await fetch("/api/auth/force-logout-other", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(data.error ?? t("auth.login.forceLogoutFailed", "Failed to log out the other device"));
        return;
      }
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        setError(t("auth.login.loginAfterForceLogoutFailed", "Failed to log in after logging out the other device"));
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } finally {
      setForceLogoutLoading(false);
    }
  }

  if (concurrentSession) {
    return (
      <AuthPageLayout title={t("auth.login.concurrentTitle", "This account is active on another device")}>
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-5 sm:p-6">
          <p className="text-sm leading-relaxed text-amber-800">
            {t(
              "auth.login.concurrentDescription",
              "This account is currently logged in from another device or browser. To continue here, log out the other device first.",
            )}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-amber-700">
            {t(
              "auth.login.concurrentSecurityHint",
              'If you suspect your account was compromised, update your password from "Edit account" after logging in.',
            )}
          </p>
          {error ? (
            <div className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</div>
          ) : null}
          <form onSubmit={handleForceLogoutOther} className="mt-6">
            <button type="submit" disabled={forceLogoutLoading} className={authPrimaryBtnClass}>
              {forceLogoutLoading
                ? t("auth.login.concurrentActionLoading", "Processing...")
                : t("auth.login.concurrentAction", "Log out the other device and continue here")}
            </button>
          </form>
          <button
            type="button"
            onClick={() => setConcurrentSession(false)}
            className="mt-4 w-full text-sm text-slate-500 hover:text-[var(--color-primary)] hover:underline"
          >
            {t("auth.login.concurrentCancel", "Cancel and go back to login")}
          </button>
        </div>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout title={t("auth.login.title", "Log in")}>
      {reasonElsewhere ? (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-800">
          {t(
            "auth.login.sessionEndedElsewhere",
            "You were logged out because this account was opened on another device. Log in again here if you want.",
          )}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</div>
        ) : null}

        <div>
          <input
            id="email"
            type="text"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={authInputClass}
            placeholder={t("auth.login.emailOrPhonePlaceholder", "Enter email or username")}
          />
        </div>

        <div>
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            required
            placeholder={t("auth.login.passwordPlaceholder", "Enter password")}
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
          />
          {t("auth.login.rememberMe", "Remember me")}
        </label>

        <button type="submit" disabled={loading} className={authPrimaryBtnClass}>
          {loading ? t("auth.login.submitting", "Logging in...") : t("auth.login.submit", "Log in")}
        </button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link href="/login/forgot-password" className="text-slate-600 hover:text-[var(--color-primary)]">
          {t("auth.login.forgotPassword", "Forgot password?")}
        </Link>
        <p className="text-slate-600">
          {t("auth.login.newCustomer", "New customer?")}{" "}
          <Link href="/register" className="font-semibold text-[var(--be-navy,#0c3d7a)] hover:underline">
            {t("auth.login.createAccount", "Create account")}
          </Link>
        </p>
      </div>
    </AuthPageLayout>
  );
}

function LoginFallback() {
  return (
    <AuthPageLayout title="…">
      <div className="space-y-4">
        <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-12 animate-pulse rounded-lg bg-slate-100" />
      </div>
    </AuthPageLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
