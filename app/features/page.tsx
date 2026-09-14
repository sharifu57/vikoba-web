import type { Metadata } from "next";
import { PublicPage } from "@/components/public/public-pages";

export const metadata: Metadata = { title: "VIKOBA360 Features", description: "Explore the tools VIKOBA360 gives VICOBA groups for members, contributions, shares, loans and reports." };
export default function FeaturesPage() { return <PublicPage kind="features" />; }
