"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const whatsappUrl = "https://wa.me/255785322079";

export function SupportCenter() {
  const { locale } = useLanguage();
  const sw = locale === "sw";
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState("");
  const questions = sw
    ? ["Ninaanzaje kutumia VIKOBA360?", "Nimekwama kuingia au kupata OTP", "Nawezaje kuwasiliana na timu?", "Je, taarifa zangu ziko salama?"]
    : ["How do I get started with VIKOBA360?", "I can’t log in or receive my OTP", "How can I contact the team?", "Is my information secure?"];
  const answers = sw
    ? ["Unda akaunti kwa namba yako ya simu, thibitisha OTP, kisha weka taarifa za kikundi chako.", "Hakikisha namba yako inaanza na 255. Subiri muda wa kutuma tena OTP uishe; ukiendelea kupata tatizo, tutumie ujumbe WhatsApp.", "Tupigie +255 785 322 079 au tuma ujumbe WhatsApp kwa timu yetu.", "VIKOBA360 hutumia uthibitishaji wa simu. Usimshirikishe mtu yeyote nenosiri au OTP yako."]
    : ["Create an account with your phone number, verify the OTP, then set up your group details.", "Check that your number starts with 255. Wait for the resend timer; if it still fails, message us on WhatsApp.", "Call +255 785 322 079 or message our team on WhatsApp.", "VIKOBA360 uses phone verification. Never share your password or OTP with anyone."];

  return (
    <div className="support-center">
      {open && <section className="support-panel" aria-label={sw ? "Kituo cha msaada" : "Support center"}>
        <header className="support-header"><span className="support-avatar"><MessageCircle size={18} /></span><div><strong>{sw ? "Msaada wa VIKOBA360" : "VIKOBA360 Support"}</strong><small>{sw ? "Tunaweza kukusaidia?" : "How can we help?"}</small></div><button aria-label={sw ? "Funga" : "Close"} onClick={() => setOpen(false)}><X size={18} /></button></header>
        <div className="support-content"><p>{sw ? "Chagua swali ili upate jibu la haraka." : "Choose a question for a quick answer."}</p><div className="support-questions">{questions.map((question, index) => <button key={question} onClick={() => setAnswer(answers[index])}>{question}</button>)}</div>{answer && <p className="support-answer" role="status">{answer}</p>}<a className="support-whatsapp" href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={17} />{sw ? "Ongea nasi WhatsApp" : "Chat with us on WhatsApp"}</a><small className="support-safety">{sw ? "Usitume nenosiri au OTP kupitia WhatsApp." : "Do not send passwords or OTPs on WhatsApp."}</small></div>
      </section>}
      <button className="support-launcher" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-label={open ? (sw ? "Funga kituo cha msaada" : "Close support center") : (sw ? "Fungua kituo cha msaada" : "Open support center")}>
        {open ? <X size={21} /> : <MessageCircle size={21} />}<span>{sw ? "Msaada" : "Support"}</span>
      </button>
    </div>
  );
}
