"use client";

import Link from "next/link";
import { Menu, Moon, Sun, Monitor, X } from "lucide-react";
import { useEffect, useState } from "react";
import { LanguageSwitcher, VikobaLogo } from "@/components/brand";
import { useLanguage } from "@/lib/i18n";

// Kept for the existing auth screens, which retain their original theme controls.
export function ThemeSelector() {
  const [theme,setTheme]=useState<"light"|"dark"|"system">("system");
  useEffect(()=>{const saved=localStorage.getItem("v360_theme");const next=saved==="light"||saved==="dark"?saved:"system";setTheme(next);applyAuthTheme(next)},[]);
  const choose=(next:"light"|"dark"|"system")=>{setTheme(next);localStorage.setItem("v360_theme",next);applyAuthTheme(next)};
  return <div className="public-theme-picker" role="group" aria-label="Theme">{(["light","dark","system"] as const).map(option=>{const Icon=option==="light"?Sun:option==="dark"?Moon:Monitor;return <button key={option} type="button" onClick={()=>choose(option)} aria-label={option} aria-pressed={theme===option}><Icon size={14}/></button>})}</div>;
}
function applyAuthTheme(theme:"light"|"dark"|"system"){const dark=theme==="dark"||(theme==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",dark)}

function PublicThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.classList.contains("dark")); }, []);
  const toggle = () => { const next=!dark; setDark(next); localStorage.setItem("v360_theme",next?"dark":"light"); document.documentElement.classList.toggle("dark",next); };
  return <button type="button" className="public-theme-toggle" onClick={toggle} aria-label={dark?"Switch to light theme":"Switch to dark theme"} title={dark?"Light theme":"Dark theme"}>{dark?<Sun size={17}/>:<Moon size={17}/>}</button>;
}

export function PublicShell({children}:{children:React.ReactNode}) {
  const {locale}=useLanguage(); const sw=locale==="sw"; const [open,setOpen]=useState(false);
  useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")setOpen(false)};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)},[]);
  const items=[[sw?"Nyumbani":"Home","/"],[sw?"Vipengele":"Features","/features"],[sw?"Inavyofanya kazi":"How it works","/#how"],[sw?"Faida":"Benefits","/#benefits"],[sw?"Kuhusu":"About","/about"],[sw?"Mawasiliano":"Contact","/contact"]];
  const nav=<>{items.map(([label,href])=>href.startsWith("/")&&href!=="/#how"&&href!=="/#benefits"?<Link key={href} href={href}>{label}</Link>:<a key={href} href={href}>{label}</a>)}</>;
  return <div className="public-site"><header className="public-header"><div className="public-header-inner"><Link href="/" aria-label="VIKOBA360 home"><VikobaLogo/></Link><nav className="public-nav" aria-label="Primary navigation">{nav}</nav><div className="public-actions"><LanguageSwitcher/><PublicThemeToggle/><Link className="public-login" href="/auth/login">{sw?"Ingia":"Log in"}</Link><Link className="public-button public-button-primary" href="/auth/register">{sw?"Anza":"Get started"}</Link></div><button className="public-menu-button" type="button" aria-label={open?"Close menu":"Open menu"} aria-expanded={open} aria-controls="public-mobile-menu" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></div>{open&&<nav className="public-mobile-menu" id="public-mobile-menu" aria-label="Mobile navigation">{nav}<div className="public-mobile-controls"><LanguageSwitcher/><PublicThemeToggle/><Link href="/auth/login" onClick={()=>setOpen(false)}>{sw?"Ingia":"Log in"}</Link></div><Link className="public-button public-button-primary" onClick={()=>setOpen(false)} href="/auth/register">{sw?"Anza":"Get started"}</Link></nav>}</header>{children}</div>;
}

export function PublicFooter() {
  const {locale}=useLanguage(); const sw=locale==="sw"; const year=new Date().getFullYear();
  return <footer className="public-footer"><div className="public-footer-main"><div className="public-footer-brand"><Link href="/" aria-label="VIKOBA360 home"><VikobaLogo/></Link><p>{sw?"Simamia wanachama, michango, hisa, mikopo na mikutano ya kikundi chako kwa uwazi.":"Manage your group’s members, contributions, shares, loans and meetings with clarity."}</p><a className="public-footer-phone" href="tel:+255785322079">+255 785 322 079</a></div><div className="public-footer-links"><div><strong>{sw?"Jukwaa":"Platform"}</strong><Link href="/features">{sw?"Vipengele":"Features"}</Link><a href="/#how">{sw?"Inavyofanya kazi":"How it works"}</a><a href="/#pricing">{sw?"Mipango":"Plans"}</a></div><div><strong>{sw?"Kampuni":"Company"}</strong><Link href="/about">{sw?"Kuhusu":"About"}</Link><Link href="/contact">{sw?"Wasiliana nasi":"Contact"}</Link><Link href="/contact">{sw?"Msaada":"Support"}</Link></div><div><strong>{sw?"Taarifa":"Information"}</strong><a href="/#faq">FAQ</a><Link href="/privacy">{sw?"Faragha":"Privacy"}</Link><Link href="/terms">{sw?"Masharti":"Terms"}</Link><Link href="/account-deletion">{sw?"Futa akaunti":"Account deletion"}</Link><Link href="/auth/login">{sw?"Ingia":"Log in"}</Link></div></div></div><div className="public-footer-bottom"><span>© {year} VIKOBA360</span><span>{sw?"Vikundi imara, ukuaji wa pamoja.":"Community finance, made clearer."}</span></div></footer>;
}
