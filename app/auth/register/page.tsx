"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Mail, Phone, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearVikobaLocalState } from "@/lib/api/client";
import { authService } from "@/lib/api/services";
import { useLanguage } from "@/lib/i18n";
import { AuthShell } from "@/components/auth/auth-shell";

export default function RegisterPage() {
    const router = useRouter(); const { t } = useLanguage();
    const [form, setForm] = useState({ fullName: "", email: "", phone: "255", agree: false }); const [error, setError] = useState("");
    const formatPhone = (value: string) => { const digits = value.replace(/\D/g, "").slice(0, 12); return (digits.startsWith("255") ? digits : `255${digits.replace(/^255/, "")}`).slice(0, 12); };
    const registerMutation = useMutation({ mutationFn: (payload: { fullName: string; email: string; phone: string }) => authService.register(payload), onSuccess: (result, payload) => { if (result?.status !== true) { const message = result?.message || t("auth.register.requiredAgree"); setError(message); toast.error(message); return; } authService.saveSession(result); toast.success(result.message || t("auth.register.submit")); if (typeof window !== "undefined") { const hasExistingState = Boolean(localStorage.getItem("v360_access_token") || localStorage.getItem("v360_group_setup_complete") || localStorage.getItem("v360_group_setup_done")); if (hasExistingState) clearVikobaLocalState(); localStorage.setItem("v360_user", JSON.stringify({ name: payload.fullName, role: "Administrator", phone: payload.phone, email: payload.email })); } router.push(`/auth/verify-otp?action=register&phone=${encodeURIComponent(payload.phone)}`); }, onError: (err: Error) => { setError(err.message || t("auth.register.requiredAgree")); toast.error(err.message || t("auth.register.requiredAgree")); } });
    const handleSubmit = (event: React.FormEvent) => { event.preventDefault(); const fullName = form.fullName.trim(); const email = form.email.trim(); const phone = form.phone.trim(); if (!fullName) return setError(t("auth.register.requiredName")); if (!email) return setError(t("auth.register.requiredEmail")); if (!/^255\d{9}$/.test(phone)) return setError(t("auth.register.requiredPhone")); if (!form.agree) return setError(t("auth.register.requiredAgree")); setError(""); registerMutation.mutate({ fullName, email, phone }); };
    return <AuthShell eyebrow={t("auth.register.eyebrow")} title={t("auth.register.title")} description={t("auth.register.description")} step={1}><form className="auth-form-card auth-register-form" onSubmit={handleSubmit}><div className="auth-field"><label htmlFor="register-name">{t("auth.register.name")}</label><div className="auth-input-wrap"><UserRound size={17} /><Input id="register-name" required placeholder={t("auth.register.namePlaceholder")} value={form.fullName} onChange={event => setForm({ ...form, fullName: event.target.value })} /></div></div><div className="auth-field"><label htmlFor="register-email">{t("auth.register.email")}</label><div className="auth-input-wrap"><Mail size={17} /><Input id="register-email" type="email" required placeholder={t("auth.register.emailPlaceholder")} value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></div></div><div className="auth-field"><label htmlFor="register-phone">{t("auth.register.phone")}</label><div className="auth-input-wrap"><Phone size={17} /><Input id="register-phone" type="tel" required inputMode="numeric" maxLength={12} placeholder="255712345678" value={form.phone} onChange={event => setForm({ ...form, phone: formatPhone(event.target.value) })} /></div></div>{error && <div className="auth-alert" role="alert">{error}</div>}<label className="auth-consent"><input type="checkbox" checked={form.agree} onChange={event => setForm({ ...form, agree: event.target.checked })} /><span>{t("auth.register.agree")}</span></label><Button type="submit" disabled={registerMutation.isPending} className="auth-submit">{registerMutation.isPending ? t("auth.register.loading") : t("auth.register.submit")}<ArrowRight size={16} /></Button><p className="auth-switch">{t("auth.register.haveAccount")} <Link href="/auth/login">{t("auth.register.login")}</Link></p></form></AuthShell>;
}
