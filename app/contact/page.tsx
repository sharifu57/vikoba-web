import type { Metadata } from "next";
import { ContactPage } from "@/components/public/public-pages";

export const metadata: Metadata = { title: "Contact VIKOBA360", description: "Contact the VIKOBA360 team about bringing your community finance group online." };
export default function ContactRoute() { return <ContactPage />; }
