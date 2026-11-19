import type { Metadata } from "next";
import { TermsPage } from "@/components/public/public-legal-pages";

export const metadata:Metadata={title:"Terms of use | VIKOBA360",description:"Read the basic terms for using the VIKOBA360 website and group management service."};
export default function TermsRoute(){return <TermsPage/>}
