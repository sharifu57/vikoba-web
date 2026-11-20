"use client";

import Link from "next/link";
import { ArrowRight, Check, HandCoins, ShieldCheck, Smartphone, WalletCards } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const FLUTTER_APP_URL = "https://app.vikoba360.com/";

export function FlutterAppLink() {
  const { locale } = useLanguage();
  const sw = locale === "sw";
  const benefits = sw
    ? ["Hisa zako", "Taarifa za mikopo", "Akaunti moja"]
    : ["Your shares", "Loan updates", "One account"];

  return (
    <section id="mobile-app" className="public-container android-section" aria-labelledby="mobile-app-title">
      <div className="android-download-panel">
        <div className="android-copy">
          <span className="android-eyebrow"><Smartphone size={15} />{sw ? "VIKOBA360 kwenye simu yako" : "VIKOBA360 for your phone"}</span>
          <h2 id="mobile-app-title">{sw ? "Kikundi chako. Kiganjani mwako." : "Your group. In your pocket."}</h2>
          <p className="android-description">{sw
            ? "Fungua app ya VIKOBA360 iliyoundwa kwa simu moja kwa moja kwenye kivinjari chako. Tumia akaunti yako ya kawaida."
            : "Open the phone-friendly VIKOBA360 app directly in your browser. Sign in with your usual account."}</p>
          <div className="android-benefits">{benefits.map((item) => <span key={item}><Check size={15} />{item}</span>)}</div>
          <div className="android-actions">
            <a className="android-download-button" href={FLUTTER_APP_URL} aria-label={sw ? "Fungua app ya VIKOBA360" : "Open the VIKOBA360 Flutter app"}>
              <Smartphone size={21} />
              <span><small>{sw ? "APP YA SIMU" : "PHONE APP"}</small><strong>{sw ? "Fungua VIKOBA360" : "Open VIKOBA360 app"}</strong></span>
              <ArrowRight size={19} />
            </a>
            <Link className="android-web-link" href="/auth/login">{sw ? "Ingia kwenye tovuti hii" : "Log in on this website"}<ArrowRight size={15} /></Link>
          </div>
          <p className="android-download-note">{sw ? "App hufunguka kwenye kivinjari cha simu yako." : "The app opens in your phone’s browser."}</p>
        </div>
        <div className="android-visual" aria-hidden="true">
          <div className="android-orbit android-orbit-one" />
          <div className="android-orbit android-orbit-two" />
          <div className="android-phone">
            <div className="android-phone-camera" />
            <div className="android-phone-screen">
              <div className="android-phone-brand"><img src="/logo.png" alt="" /><strong>VIKOBA360</strong></div>
              <span className="android-phone-welcome">{sw ? "Karibu kwenye kikundi chako" : "Welcome to your group"}</span>
              <h3>{sw ? "Taarifa zangu" : "My overview"}</h3>
              <div className="android-phone-feature"><span><WalletCards size={22} /></span><div><strong>{sw ? "Hisa zangu" : "My shares"}</strong><small>{sw ? "Rekodi zako sehemu moja" : "Your records in one place"}</small></div><ArrowRight size={15} /></div>
              <div className="android-phone-feature"><span><HandCoins size={22} /></span><div><strong>{sw ? "Mikopo yangu" : "My loans"}</strong><small>{sw ? "Fuatilia maendeleo yako" : "Follow your progress"}</small></div><ArrowRight size={15} /></div>
              <div className="android-phone-status"><ShieldCheck size={19} /><span>{sw ? "Ingia kwa uthibitisho wa SMS" : "Sign in with SMS verification"}</span></div>
              <p className="android-preview-label">{sw ? "Mfano wa matumizi" : "Illustrative preview"}</p>
            </div>
          </div>
          <span className="android-floating-label"><Check size={15} />{sw ? "Simu na wavuti" : "Phone and web"}</span>
        </div>
      </div>
    </section>
  );
}
