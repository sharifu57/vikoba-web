"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BarChart3, CalendarDays, Check, ChartNoAxesCombined, FileText, HandCoins, ShieldCheck, Users, WalletCards } from "lucide-react";
import { PublicFooter, PublicShell } from "./public-shell";
import { useLanguage } from "@/lib/i18n";
import { getPublicContent } from "@/lib/public-content";
import { getPublicPlatformData, type PublicPlatformData } from "@/lib/api/public";

const icons = { Users, WalletCards, ChartNoAxesCombined, HandCoins, CalendarDays, FileText };

export function PublicHome() {
    const { locale } = useLanguage(); const content = getPublicContent(locale);
    const [data, setData] = useState<PublicPlatformData | null>(null); const [failed, setFailed] = useState(false);
    useEffect(() => { getPublicPlatformData().then(setData).catch(() => setFailed(true)); }, []);
    return <PublicShell><main>
        <section className="public-hero public-container"><div className="public-hero-copy"><span className="public-eyebrow">{content.hero.eyebrow}</span><h1>{content.hero.title}</h1><p>{content.hero.body}</p><div className="public-hero-actions"><Link className="public-button public-button-primary" href="/auth/register">{content.hero.primary}<ArrowRight size={17} /></Link><a className="public-button public-button-quiet" href="#features">{content.hero.secondary}</a></div><div className="public-hero-note"><Check size={15} /> {content.hero.note}</div></div><DashboardPreview /></section>
        <section className="public-stat-band public-container" aria-labelledby="public-stats-title"><div className="public-section-intro"><span className="public-eyebrow">{content.stats.eyebrow}</span><h2 id="public-stats-title">{content.stats.title}</h2></div>{failed ? <p className="public-muted">{content.stats.unavailable}</p> : <div className="public-stats-grid">{data ? <><Stat label={locale === "sw" ? "Vikundi" : "Groups"} value={data.statistics.totalGroups} /><Stat label={locale === "sw" ? "Wanachama" : "Members"} value={data.statistics.totalMembers} /><Stat label={locale === "sw" ? "Michango inayosimamiwa" : "Contributions managed"} value={data.statistics.totalContributions} money /><Stat label={locale === "sw" ? "Mikopo iliyotolewa" : "Loans facilitated"} value={data.statistics.totalLoanAmount} money /></> : <><Skeleton /><Skeleton /><Skeleton /><Skeleton /></>}</div>}</section>
        <section className="public-section public-container" id="features"><div className="public-section-intro"><span className="public-eyebrow">{content.features.eyebrow}</span><h2>{content.features.title}</h2><p>{content.features.body}</p></div><div className="public-feature-grid">{content.features.items.map(([title, text, iconName]) => { const Icon = icons[iconName as keyof typeof icons]; return <article className="public-feature" key={title}><span className="public-icon"><Icon size={21} /></span><h3>{title}</h3><p>{text}</p><ArrowRight className="public-feature-arrow" size={17} /></article>; })}</div></section>
        <section className="public-process" id="how"><div className="public-container"><div className="public-section-intro"><span className="public-eyebrow">{content.process.eyebrow}</span><h2>{content.process.title}</h2></div><div className="public-steps">{content.process.steps.map(([number, title, text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
        <section className="public-trust public-container"><div><span className="public-eyebrow public-eyebrow-light">{content.trust.eyebrow}</span><h2>{content.trust.title}</h2><p>{content.trust.body}</p><div className="public-trust-list">{content.trust.items.map(item => <span key={item}><ShieldCheck size={16} /> {item}</span>)}</div></div><div className="public-trust-mark"><ShieldCheck size={52} /><span>VIKOBA360</span><small>Built for accountability</small></div></section>
        <section className="public-section public-container" id="faq"><div className="public-section-intro"><span className="public-eyebrow">{content.faq.eyebrow}</span><h2>{content.faq.title}</h2></div><div className="public-faq">{content.faq.items.map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></section>
        <section className="public-cta public-container"><div><h2>{content.cta.title}</h2><p>{content.cta.body}</p></div><div><Link className="public-button public-button-light" href="/auth/register">{content.cta.primary}<ArrowRight size={17} /></Link><Link className="public-cta-login" href="/auth/login">{content.cta.secondary}</Link></div></section>
    </main><PublicFooter /></PublicShell>;
}

function DashboardPreview() { return <div className="public-dashboard-preview"><div className="public-preview-top"><span><b>V</b> Umoja VICOBA</span><span className="public-avatar">JM</span></div><div className="public-preview-heading"><small>Group overview</small><strong>TZS 27,840,000</strong><span>+12.8% this quarter</span></div><div className="public-preview-chart"><div><strong>Contribution rhythm</strong><small>Last 6 months</small></div><div className="public-bars">{[34, 48, 42, 68, 58, 84].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div></div><div className="public-preview-kpis"><span><small>Active members</small><b>42</b></span><span><small>Outstanding loans</small><b>TZS 8.2M</b></span></div><div className="public-preview-footer"><span><BarChart3 size={15} /> Shared financial picture</span><span>Updated today</span></div></div>; }
function Stat({ label, value, money = false }: { label: string; value: number; money?: boolean }) { return <div className="public-stat"><strong>{money ? formatCompactCurrency(value) : formatNumber(value)}</strong><span>{label}</span></div>; }
function Skeleton() { return <div className="public-stat public-skeleton" aria-label="Loading statistic"><i /><i /></div>; }
function formatNumber(value: number) { return new Intl.NumberFormat("en-TZ", { notation: "compact", maximumFractionDigits: 1 }).format(value); }
function formatCompactCurrency(value: number) { return `TZS ${new Intl.NumberFormat("en-TZ", { notation: "compact", maximumFractionDigits: 1 }).format(value)}`; }
