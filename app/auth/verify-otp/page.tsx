"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, Suspense } from "react";
import { ArrowRight, CheckCircle2, TimerReset } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/lib/api/services";
import { useLanguage } from "@/lib/i18n";
import { AuthShell } from "@/components/auth/auth-shell";
import { systemAdmin } from "@/lib/api/system-admin";
import type { ApiError } from "@/lib/api/client";

export default function VerifyOtpPage() { return <Suspense fallback={<div className="auth-loading"><div className="auth-loading-card"><span className="auth-loading-mark">V</span><p>Loading secure verification...</p></div></div>}><VerifyOtpContent /></Suspense>; }

function VerifyOtpContent() {
    const router = useRouter(); const searchParams = useSearchParams(); const { t } = useLanguage();
    const action = searchParams.get("action"); const phone = searchParams.get("phone") || "your phone";
    const [otp, setOtp] = useState(["", "", "", "", "", ""]); const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const [resending, setResending] = useState(false);
    const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));
    const [resendDeadline, setResendDeadline] = useState(0);
    const [resendSeconds, setResendSeconds] = useState(60);
    useEffect(() => { setResendDeadline(Date.now() + 60_000); }, [phone]);
    useEffect(() => {
        const update = () => setResendSeconds(Math.max(0, Math.ceil((resendDeadline - Date.now()) / 1000)));
        update();
        const timer = window.setInterval(update, 1000);
        return () => window.clearInterval(timer);
    }, [resendDeadline]);
    const title = action === "register" ? t("auth.otp.titleRegister") : action === "reset" ? t("auth.otp.titleReset") : t("auth.otp.titleLogin");
    const handleChange = (index: number, value: string) => { const digit = value.replace(/\D/g, "").slice(-1); const next = [...otp]; next[index] = digit; setOtp(next); if (digit && index < 5) refs[index + 1].current?.focus(); };
    const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => { if (event.key === "Backspace" && !otp[index] && index > 0) refs[index - 1].current?.focus(); };
    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => { const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6); if (!digits) return; event.preventDefault(); setOtp(Array.from({ length: 6 }, (_, index) => digits[index] || "")); refs[Math.min(digits.length, 6) - 1]?.current?.focus(); };
    const handleVerify = async (event: React.FormEvent) => {
        event.preventDefault();
        const code = otp.join("");
        if (code.length < 6) return setError(t("auth.otp.invalid"));
        setLoading(true);
        setError("");
        try {
            const result = await authService.verifyOtp({ phone, code, purpose: action === "register" ? "phone_verification" : action === "login" ? "login" : "verify" });
            if (result?.status !== true) {
                const message = result?.message || t("auth.otp.failed");
                setError(message);
                toast.error(message);
                return;
            }
            authService.saveSession(result);
            if (action !== "reset") {
                const access = await systemAdmin.access().catch(() => null);
                if (access?.data.superAdmin) { router.push("/system"); return; }
            }
            toast.success(result.message || t("auth.otp.verify"));
            const groups = (result.data as { groups?: unknown[] } | undefined)?.groups;
            if (action === "reset") router.push("/auth/reset-password");
            else if (Array.isArray(groups) && groups.length > 1) router.push("/auth/select-group");
            else {
                const setupComplete = typeof window !== "undefined" && (localStorage.getItem("v360_group_setup_complete") === "true" || localStorage.getItem("v360_group_setup_done") === "true");
                router.push(setupComplete ? "/app/dashboard" : "/app/settings");
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : t("auth.otp.failed");
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };
    const handleResend = async () => { if (resending || resendSeconds > 0) return; setResending(true); setError(""); try { const result = await authService.resendOtp({ phone, purpose: action === "register" ? "phone_verification" : action === "login" ? "login" : "verify" }); if (result?.status !== true) { const message = result?.message || t("auth.otp.failed"); setError(message); toast.error(message); return; } setOtp(["", "", "", "", "", ""]); refs[0].current?.focus(); setResendDeadline(Date.now() + 60_000); toast.success(result.message || t("auth.otp.sent")); } catch (err) { if ((err as ApiError)?.status === 429) setResendDeadline(Date.now() + ((err as ApiError).retryAfterSeconds || 60) * 1000); const message = err instanceof Error ? err.message : t("auth.otp.failed"); setError(message); toast.error(message); } finally { setResending(false); } };
    return <AuthShell eyebrow={t("auth.otp.eyebrow")} title={title} description={`${t("auth.otp.description")} ${phone}.`} step={2}><form className="auth-form-card auth-otp-form" onSubmit={handleVerify}><div className="auth-otp-intro"><span className="auth-otp-icon"><CheckCircle2 size={24} /></span><div><strong>{t("auth.otp.secure")}</strong><small>6-digit one-time password</small></div></div><div className="auth-otp-grid">{otp.map((digit, index) => <Input key={index} ref={refs[index]} className={`auth-otp-input ${digit ? "filled" : ""}`} type="text" inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} maxLength={1} value={digit} aria-label={`Verification code digit ${index + 1}`} onChange={event => handleChange(index, event.target.value)} onKeyDown={event => handleKeyDown(index, event)} onPaste={handlePaste} />)}</div>{error && <div className="auth-alert" role="alert">{error}</div>}<Button type="submit" disabled={loading} className="auth-submit">{loading ? t("auth.otp.verifying") : t("auth.otp.verify")}<ArrowRight size={16} /></Button><div className="auth-otp-actions"><button type="button" onClick={handleResend} disabled={resending || resendSeconds > 0}><TimerReset size={15} /> {resending ? t("auth.otp.sending") : resendSeconds > 0 ? `${t("auth.otp.resend")} (${resendSeconds}s)` : t("auth.otp.resend")}</button><Link href="/auth/login">{t("auth.otp.backLogin")}</Link></div></form></AuthShell>;
}
