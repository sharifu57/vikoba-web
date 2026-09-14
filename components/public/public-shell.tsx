"use client";

import Link from "next/link";
import { Menu, Moon, Sun, Monitor, X } from "lucide-react";
import { useEffect, useState } from "react";
import { LanguageSwitcher, VikobaLogo } from "@/components/brand";
import { useLanguage } from "@/lib/i18n";
import { getPublicContent } from "@/lib/public-content";

export function ThemeSelector() {
    const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

    useEffect(() => {
        const saved = localStorage.getItem("v360_theme");
        const next = saved === "light" || saved === "dark" ? saved : "system";
        setTheme(next);
        applyTheme(next);
    }, []);

    const choose = (next: "light" | "dark" | "system") => {
        setTheme(next);
        localStorage.setItem("v360_theme", next);
        applyTheme(next);
    };

    return (
        <div className="public-theme-picker" role="group" aria-label="Theme">
            {(["light", "dark", "system"] as const).map((option) => {
                const Icon = option === "light" ? Sun : option === "dark" ? Moon : Monitor;
                return <button key={option} type="button" onClick={() => choose(option)} aria-label={option} aria-pressed={theme === option}><Icon size={14} /></button>;
            })}
        </div>
    );
}

function applyTheme(theme: "light" | "dark" | "system") {
    const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
}

export function PublicShell({ children }: { children: React.ReactNode }) {
    const { locale } = useLanguage();
    const content = getPublicContent(locale);
    const [open, setOpen] = useState(false);

    return <div className="public-site min-h-screen bg-background text-foreground">
        <header className="public-header">
            <div className="public-header-inner">
                <Link href="/" aria-label="VIKOBA360 home"><VikobaLogo /></Link>
                <nav className="public-nav" aria-label="Primary navigation">
                    <Link href="/features">{content.nav.features}</Link><a href="/#how">{content.nav.how}</a><Link href="/about">{content.nav.about}</Link><a href="/#faq">{content.nav.faq}</a><Link href="/contact">{content.nav.contact}</Link>
                </nav>
                <div className="public-actions"><LanguageSwitcher /><ThemeSelector /><Link className="public-login" href="/auth/login">{content.nav.login}</Link><Link className="public-button public-button-primary" href="/auth/register">{content.nav.start}</Link></div>
                <button className="public-menu-button" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
            </div>
            {open && <div className="public-mobile-menu"><Link onClick={() => setOpen(false)} href="/features">{content.nav.features}</Link><a onClick={() => setOpen(false)} href="/#how">{content.nav.how}</a><Link onClick={() => setOpen(false)} href="/about">{content.nav.about}</Link><a onClick={() => setOpen(false)} href="/#faq">{content.nav.faq}</a><Link onClick={() => setOpen(false)} href="/contact">{content.nav.contact}</Link><div className="public-mobile-controls"><LanguageSwitcher /><ThemeSelector /></div><Link className="public-button public-button-primary" onClick={() => setOpen(false)} href="/auth/register">{content.nav.start}</Link></div>}
        </header>
        {children}
    </div>;
}

export function PublicFooter() {
    const { locale } = useLanguage(); const content = getPublicContent(locale); const year = new Date().getFullYear();
    return <footer className="public-footer"><div><VikobaLogo /><p>{content.footer.description}</p></div><div className="public-footer-links"><div><strong>{content.footer.platform}</strong><Link href="/features">{content.footer.links[0]}</Link><a href="/#how">{content.footer.links[1]}</a></div><div><strong>{content.footer.company}</strong><Link href="/about">{content.footer.links[2]}</Link><Link href="/contact">{content.footer.links[3]}</Link></div><div><strong>{content.footer.support}</strong><a href="/#faq">{content.footer.links[4]}</a><Link href="/auth/login">{content.nav.login}</Link></div></div><div className="public-footer-bottom"><span>© {year} VIKOBA360</span><span>Tanzania · Community finance, made clearer.</span></div></footer>;
}
