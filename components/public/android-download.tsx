'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowDownToLine, ArrowRight, Check, Smartphone, WalletCards, HandCoins, ShieldCheck } from 'lucide-react'
import { useLanguage } from '@/lib/i18n'
type Release = { available: boolean; url?: string; sizeBytes?: number }

export function AndroidDownload() {
  const { locale } = useLanguage()
  const sw = locale === 'sw'
  const [release, setRelease] = useState<Release | null>(null)
  useEffect(() => {
    let active = true
    fetch('/api/android-release', { cache: 'no-store' }).then(response => {
      if (!response.ok) throw new Error('Unavailable')
      return response.json() as Promise<Release>
    }).then(data => { if (active) setRelease(data) }).catch(() => { if (active) setRelease({ available: false }) })
    return () => { active = false }
  }, [])
  const steps = sw ? [
    ['Pakua app', 'Pakua faili la APK kutoka kwenye tovuti hii.'],
    ['Ruhusu usakinishaji', 'Android ikiuliza, ruhusu kivinjari chako kusakinisha app hii.'],
    ['Ingia kwenye kikundi', 'Fungua VIKOBA360, ingia kwa namba iliyosajiliwa na uthibitishe kwa SMS.'],
  ] : [
    ['Download the app', 'Get the APK file directly from this website.'],
    ['Allow installation', 'If Android asks, allow your browser to install this app.'],
    ['Join your group', 'Open VIKOBA360, enter your registered phone number and verify by SMS.'],
  ]
  return <section id="android-app" className="public-container android-section" aria-labelledby="android-title">
    <div className="android-download-panel"><div className="android-copy">
      <span className="android-eyebrow"><Smartphone size={15} />{sw ? 'VIKOBA360 kwa Android' : 'VIKOBA360 for Android'}</span>
      <h2 id="android-title">{sw ? 'Kikundi chako. Kiganjani mwako.' : 'Your group. In your pocket.'}</h2>
      <p className="android-description">{sw ? 'Fuatilia hisa, mikopo na taarifa za kikundi chako kupitia app. Ingia kwa akaunti ileile unayotumia kwenye wavuti.' : 'Keep your shares, loans and group records close. Sign in with the same account you use on the web.'}</p>
      <div className="android-benefits">{(sw ? ['Hisa zako', 'Taarifa za mikopo', 'Akaunti moja'] : ['Your shares', 'Loan updates', 'One account']).map(item => <span key={item}><Check size={15} />{item}</span>)}</div>
      <div className="android-actions">{release?.available && release.url ? <a className="android-download-button" href={release.url} download="VIKOBA360.apk"><ArrowDownToLine size={21} /><span><small>{sw ? 'PAKUA MOJA KWA MOJA' : 'DIRECT DOWNLOAD'}</small><strong>{sw ? 'Pakua kwa Android' : 'Download for Android'}</strong></span><ArrowRight size={19} /></a> : <button className="android-download-button" disabled><Smartphone size={21} /><span><small>ANDROID APK</small><strong>{release === null ? (sw ? 'Inakagua upatikanaji…' : 'Checking availability…') : (sw ? 'App ya Android inaandaliwa' : 'Android download coming soon')}</strong></span></button>}<Link className="android-web-link" href="/auth/login">{sw ? 'Tumia kwenye wavuti' : 'Use the web app'}<ArrowRight size={15} /></Link></div>
      <p className="android-download-note">{release?.available ? `${sw ? 'Faili la APK' : 'APK file'}${release.sizeBytes ? ` · ${(release.sizeBytes / 1024 / 1024).toFixed(1)} MB` : ''} · ${sw ? 'Kwa simu za Android' : 'For Android phones'}` : (sw ? 'Unaweza kutumia VIKOBA360 kwenye kivinjari chako sasa.' : 'You can use VIKOBA360 in your browser right now.')}</p>
    </div><div className="android-visual" aria-hidden="true"><div className="android-orbit android-orbit-one" /><div className="android-orbit android-orbit-two" /><div className="android-phone"><div className="android-phone-camera" /><div className="android-phone-screen"><div className="android-phone-brand"><img src="/logo.png" alt="" /><strong>VIKOBA360</strong></div><span className="android-phone-welcome">{sw ? 'Karibu kwenye kikundi chako' : 'Welcome to your group'}</span><h3>{sw ? 'Taarifa zangu' : 'My overview'}</h3><div className="android-phone-feature"><span><WalletCards size={22} /></span><div><strong>{sw ? 'Hisa zangu' : 'My shares'}</strong><small>{sw ? 'Rekodi zako sehemu moja' : 'Your records in one place'}</small></div><ArrowRight size={15} /></div><div className="android-phone-feature"><span><HandCoins size={22} /></span><div><strong>{sw ? 'Mikopo yangu' : 'My loans'}</strong><small>{sw ? 'Fuatilia maendeleo yako' : 'Follow your progress'}</small></div><ArrowRight size={15} /></div><div className="android-phone-status"><ShieldCheck size={19} /><span>{sw ? 'Ingia kwa uthibitisho wa SMS' : 'Sign in with SMS verification'}</span></div><p className="android-preview-label">{sw ? 'Mfano wa matumizi' : 'Illustrative preview'}</p></div></div><span className="android-floating-label"><Check size={15} />{sw ? 'Simu + wavuti' : 'Mobile + web'}</span></div></div>
    <div className="android-install-header"><h3>{sw ? 'Hatua tatu. Uko tayari.' : 'Three steps. You’re ready.'}</h3><p>{sw ? 'Usakinishaji wa moja kwa moja, bila kupitia Play Store.' : 'Install directly, without going through the Play Store.'}</p></div>
    <ol className="android-install-steps">{steps.map(([title, description], index) => <li key={title}><span className="android-step-number">0{index + 1}</span><div><h4>{title}</h4><p>{description}</p></div></li>)}</ol>
    <details className="android-install-help"><summary>{sw ? 'Android ikiomba ruhusa ya usakinishaji' : 'If Android asks for installation permission'}</summary><p>{sw ? 'Chagua Mipangilio kwenye ujumbe wa Android, kisha ruhusu usakinishaji kutoka kwenye kivinjari unachotumia. Rudi kwenye faili la APK na uchague Sakinisha. Ukimaliza, unaweza kuzima ruhusa hiyo tena. Pakua kutoka vikoba360.com pekee. Ikiwa simu yako inasimamiwa na taasisi, huenda usakinishaji usiruhusiwe.' : 'Choose Settings in the Android prompt, then allow installation from the browser you are using. Return to the APK and choose Install. Afterwards, you can turn that permission off again. Download only from vikoba360.com. Installation may be restricted on an organization-managed phone.'}</p></details>
  </section>
}
