"use client";

import Link from "next/link";
import { ArrowLeft, Check, LockKeyhole } from "lucide-react";
import { VikobaLogo, LanguageSwitcher } from "@/components/brand";
import { ThemeSelector } from "@/components/public/public-shell";
import { useLanguage } from "@/lib/i18n";

export function AuthShell({
    eyebrow,
    title,
    description,
    children,
    step,
}: {
    eyebrow: string;
    title: string;
    description: string;
    children: React.ReactNode;
    step?: 1 | 2;
}) {
    const { t } = useLanguage();
    return <div className="auth-experience">
        <aside className="auth-story">
            <Link href="/" aria-label="VIKOBA360 home"><VikobaLogo light /></Link>
            <div className="auth-story-copy">
                <span className="auth-story-badge"><LockKeyhole size={14} /> {t("auth.story.badge")}</span>
                <h1>{t("auth.story.title")}</h1>
                <p>{t("auth.story.description")}</p>
                <div className="auth-story-points"><span><Check size={15} /> {t("auth.story.pointOne")}</span><span><Check size={15} /> {t("auth.story.pointTwo")}</span><span><Check size={15} /> {t("auth.story.pointThree")}</span></div>
            </div>
            <div className="auth-story-footer"><span>VIKOBA360</span><span>{t("auth.story.footer")}</span></div>
            <div className="auth-orbit auth-orbit-one" /><div className="auth-orbit auth-orbit-two" />
        </aside>
        <main className="auth-panel">
            <div className="auth-toolbar"><Link href="/" className="auth-mobile-logo"><VikobaLogo compact /></Link><div className="auth-controls"><LanguageSwitcher /><ThemeSelector /></div></div>
            <div className="auth-panel-inner">
                <Link href="/" className="auth-home-link"><ArrowLeft size={14} /> {t("auth.backHome")}</Link>
                <div className="auth-heading"><span className="auth-eyebrow">{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>
                {step && <div className="auth-progress" aria-label={`${t("auth.step")} ${step} ${t("auth.of")} 2`}><span className={step >= 1 ? "active" : ""} /><span className={step >= 2 ? "active" : ""} /><small>{t("auth.step")} {step} {t("auth.of")} 2</small></div>}
                {children}
            </div>
            <p className="auth-copyright">© {new Date().getFullYear()} VIKOBA360 · {t("auth.footer")}</p>
        </main>
    </div>;
}
