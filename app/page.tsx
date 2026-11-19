import type { Metadata } from "next";
import { PublicHome } from "@/components/public/public-home";

export const metadata: Metadata = {
    title: "VIKOBA360 — Your VICOBA. Your Money. Your Growth.",
    description: "Manage VICOBA group members, contributions, savings, shares, loans, fines, Jamii funds, meetings and reports with clarity.",
    openGraph: {
        title: "VIKOBA360 — Your VICOBA. Your Money. Your Growth.",
        description: "Manage VICOBA group members, contributions, savings, shares, loans, fines, Jamii funds, meetings and reports with clarity.",
    },
};

export default function HomePage() {
    return <PublicHome />;
}
