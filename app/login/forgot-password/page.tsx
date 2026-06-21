"use client";

import { useState } from "react";
import Link from "next/link";
import { useT } from "@/components/LocaleProvider";
import { AuthPageLayout, authInputClass, authPrimaryBtnClass } from "@/components/auth/AuthPageLayout";
import { PasswordInput } from "@/components/auth/PasswordInput";

export default function ForgotPasswordPage() {
  const t = useT();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-password-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOrPhone: emailOrPhone.trim(),
          oldPassword: oldPassword || undefined,
          newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? t("auth.forgot.sendFailed", "Failed to send request"));
        setLoading(false);
        return;
      }
      setSuccess(true);
    } catch {
      setError(t("auth.forgot.connectionError", "Connection error occurred"));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <AuthPageLayout title={t("auth.forgot.sentTitle", "Request sent")}>
        <div className="rounded-lg border border-green-200 bg-green-50/80 p-4 text-sm leading-relaxed text-green-800">
          {t(
            "auth.forgot.sentDescription",
            "Your password-change request has been sent to admin. Your data will be updated within hours.",
          )}
        </div>
        <Link href="/login" className={`${authPrimaryBtnClass} mt-6 block text-center`}>
          {t("auth.forgot.backToLogin", "Back to login")}
        </Link>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout title={t("auth.forgot.title", "Forgot password / Request account update")}>
      <p className="-mt-4 mb-6 text-center text-sm leading-relaxed text-slate-500">
        {t(
          "auth.forgot.subtitle",
          "Enter your registered email or phone and your new password. The request will be sent to admin.",
        )}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</div>
        ) : null}

        <input
          id="emailOrPhone"
          type="text"
          value={emailOrPhone}
          onChange={(e) => setEmailOrPhone(e.target.value)}
          required
          className={authInputClass}
          placeholder={t("auth.forgot.emailOrPhonePlaceholder", "example@email.com or 01xxxxxxxxx")}
          aria-label={t("auth.forgot.emailOrPhoneLabel", "Email or phone number")}
        />

        <PasswordInput
          id="oldPassword"
          value={oldPassword}
          onChange={setOldPassword}
          placeholder={t("auth.forgot.oldPasswordPlaceholder", "Shown to admin if provided")}
        />

        <PasswordInput
          id="newPassword"
          value={newPassword}
          onChange={setNewPassword}
          required
          minLength={6}
          autoComplete="new-password"
          placeholder={t("auth.forgot.newPasswordPlaceholder", "At least 6 characters")}
        />

        <button type="submit" disabled={loading} className={authPrimaryBtnClass}>
          {loading ? t("auth.forgot.submitting", "Sending...") : t("auth.forgot.submit", "Send request")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-semibold text-[var(--be-navy,#0c3d7a)] hover:underline">
          ← {t("auth.forgot.backToLogin", "Back to login")}
        </Link>
      </p>
    </AuthPageLayout>
  );
}
