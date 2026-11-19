import type { Metadata } from "next";
import { PrivacyPage } from "@/components/public/public-legal-pages";

export const metadata:Metadata={title:"Privacy notice | VIKOBA360",description:"Learn what information VIKOBA360 uses and how to make a privacy or data request."};
export default function PrivacyRoute(){return <PrivacyPage/>}
