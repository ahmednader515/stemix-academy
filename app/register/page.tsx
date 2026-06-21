"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LocaleProvider";
import { isValidEgyptWhatsapp, normalizeEgyptWhatsapp } from "@/lib/whatsapp-phone";
import { AuthPageLayout, authInputClass, authPrimaryBtnClass } from "@/components/auth/AuthPageLayout";
import { PasswordInput } from "@/components/auth/PasswordInput";

export default function RegisterPage() {
  const t = useT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const digits = studentNumber.replace(/\D/g, "");
    if (digits.length !== 11) {
      setError(t("auth.register.phoneMustBe11", "Phone number must be 11 digits"));
      return;
    }
    if (!isValidEgyptWhatsapp(whatsappNumber)) {
      setError(
        t(
          "auth.register.whatsappInvalidFormat",
          "WhatsApp number must start with 20 and be 12 digits (e.g. 201012345678)",
        ),
      );
      return;
    }
    const normalizedWhatsapp = normalizeEgyptWhatsapp(whatsappNumber);
    if (!normalizedWhatsapp) {
      setError(
        t(
          "auth.register.whatsappInvalidFormat",
          "WhatsApp number must start with 20 and be 12 digits (e.g. 201012345678)",
        ),
      );
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        name,
        student_number: studentNumber.trim() || undefined,
        whatsapp_number: normalizedWhatsapp,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? t("auth.register.createFailed", "Failed to create account"));
      return;
    }
    router.push(
      `/login?message=${encodeURIComponent(t("auth.register.signupSuccessMessage", "Account created successfully, you can now log in"))}`,
    );
    router.refresh();
  }

  return (
    <AuthPageLayout title={t("auth.register.title", "Create account")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</div>
        ) : null}

        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          className={authInputClass}
          placeholder={t("auth.register.namePlaceholder", "Ahmed Mohamed")}
          aria-label={t("auth.register.nameLabel", "Name")}
        />

        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={authInputClass}
          placeholder="example@email.com"
          aria-label={t("auth.register.emailLabel", "Email")}
        />

        <input
          id="student_number"
          type="tel"
          inputMode="numeric"
          value={studentNumber}
          onChange={(e) => setStudentNumber(e.target.value)}
          required
          className={`${authInputClass} text-end`}
          placeholder="01234567890"
          aria-label={t("auth.register.phoneLabel", "Phone number")}
        />

        <div>
          <input
            id="whatsapp_number"
            type="tel"
            inputMode="numeric"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            required
            className={`${authInputClass} text-end`}
            placeholder={t("auth.register.whatsappPlaceholder", "201012345678")}
            aria-label={t("auth.register.whatsappLabel", "WhatsApp number")}
          />
          <p className="mt-1.5 text-end text-xs text-slate-500">
            {t("auth.register.whatsappHint", "Must start with country code 20 (12 digits total)")}
          </p>
        </div>

        <PasswordInput
          id="password"
          value={password}
          onChange={setPassword}
          required
          minLength={6}
          autoComplete="new-password"
          placeholder={t("auth.register.passwordPlaceholder", "At least 6 characters")}
        />

        <button type="submit" disabled={loading} className={authPrimaryBtnClass}>
          {loading ? t("auth.register.submitting", "Creating account...") : t("auth.register.submit", "Create account")}
        </button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-1 text-sm text-slate-600">
        <span>{t("auth.register.hasAccount", "Already have an account?")}</span>
        <Link href="/login" className="font-semibold text-[var(--be-navy,#0c3d7a)] hover:underline">
          {t("auth.register.login", "Log in")}
        </Link>
      </div>
    </AuthPageLayout>
  );
}
