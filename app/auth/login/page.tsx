"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Phone } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/api/services";
import { useLanguage } from "@/lib/i18n";
import { AuthShell } from "@/components/auth/auth-shell";

export default function LoginPage() {
    const router = useRouter(); const { t } = useLanguage();
    const [phone, setPhone] = useState("255"); const [error, setError] = useState("");
    const formatPhone = (value: string) => { const digits = value.replace(/\D/g, "").slice(0, 12); return (digits.startsWith("255") ? digits : `255${digits.replace(/^255/, "")}`).slice(0, 12); };
    const loginMutation = useMutation({ mutationFn: (value: string) => authService.login({ phone: value }), onSuccess: result => { if (result?.status !== true) { const message = result?.message || t("auth.login.error"); setError(message); toast.error(message); return; } authService.saveSession(result); toast.success(result.message || t("auth.login.submit")); router.push(`/auth/verify-otp?action=login&phone=${encodeURIComponent(phone)}`); }, onError: (err: Error) => { setError(err.message || t("auth.login.error")); toast.error(err.message || t("auth.login.error")); } });
    const handleSubmit = (event: React.FormEvent) => { event.preventDefault(); if (!/^255\d{9}$/.test(phone.trim())) { setError(t("auth.login.invalidPhone")); return; } setError(""); loginMutation.mutate(phone.trim()); };
    return <AuthShell eyebrow={t("auth.login.eyebrow")} title={t("auth.login.title")} description={t("auth.login.description")} step={1}><form className="auth-form-card" onSubmit={handleSubmit}><div className="auth-field"><label htmlFor="login-phone">{t("auth.login.phone")}</label><div className="auth-input-wrap"><Phone size={17} /><Input id="login-phone" type="tel" required inputMode="numeric" maxLength={12} placeholder={t("auth.login.placeholder")} value={phone} onChange={event => setPhone(formatPhone(event.target.value))} /></div><small>+255 · {t("auth.login.phone")}</small></div>{error && <div className="auth-alert" role="alert">{error}</div>}<Button type="submit" disabled={loginMutation.isPending} className="auth-submit">{loginMutation.isPending ? t("auth.login.loading") : t("auth.login.submit")}<ArrowRight size={16} /></Button><p className="auth-switch">{t("auth.login.noAccount")} <Link href="/auth/register">{t("auth.login.register")}</Link></p></form></AuthShell>;
}
