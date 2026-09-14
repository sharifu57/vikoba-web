import type { Metadata } from "next";
import { PublicHome } from "@/components/public/public-home";

export const metadata: Metadata = {
    title: "VIKOBA360 | Digital VICOBA Management Platform",
    description: "Manage members, contributions, shares, loans, meetings and financial records for your VICOBA in one secure digital platform.",
    openGraph: { title: "VIKOBA360 | Manage your VICOBA. Grow together.", description: "Digital tools for transparent, growing community finance groups." },
};

export default function HomePage() {
    return <PublicHome />;
}
