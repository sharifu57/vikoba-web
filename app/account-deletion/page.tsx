import type { Metadata } from "next";
import { AccountDeletionPage } from "@/components/public/public-legal-pages";

export const metadata:Metadata={title:"Account and data deletion | VIKOBA360",description:"Learn how to request VIKOBA360 account or personal data deletion."};
export default function AccountDeletionRoute(){return <AccountDeletionPage/>}
