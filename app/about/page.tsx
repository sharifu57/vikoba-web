import type { Metadata } from "next";
import { PublicPage } from "@/components/public/public-pages";

export const metadata: Metadata = { title: "About VIKOBA360", description: "Learn how VIKOBA360 supports transparent community finance groups." };
export default function AboutPage() { return <PublicPage kind="about" />; }
