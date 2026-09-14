'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Locale = 'sw' | 'en'

const defaultLocale: Locale = 'sw'

export const dictionaries = {
    sw: {
        common: {
            language: 'Lugha',
            swahili: 'Kiswahili',
            english: 'English',
            searchPlaceholder: 'Tafuta nambari, mwanachama, shughuli...',
            settings: 'Mipangilio',
            signOut: 'Toka',
            cancel: 'Ghairi',
            submit: 'Wasilisha',
            home: 'Nyumbani',
            members: 'Wanachama',
            finance: 'Fedha',
            loans: 'Mikopo',
            more: 'Zaidi'
        },
        nav: {
            overview: 'Mapitio',
            dashboard: 'Dashibodi',
            vikoBaGroup: 'Kikundi cha VIKOBA',
            members: 'Wanachama',
            meetings: 'Mikutano',
            financeManagement: 'Usimamizi wa Fedha',
            contributions: 'Michango',
            shares: 'Hisa',
            payments: 'Malipo Yaliyopokelewa',
            expenses: 'Gharama Zilizowekwa',
            ledger: 'Akaunti za Kumbukumbu',
            loansRepayments: 'Mikopo na Rejesho',
            loanDashboard: 'Dashibodi ya Mikopo',
            applications: 'Maombi',
            communityPenalties: 'Jamii na Adhabu',
            jamiiFund: 'Mfuko wa Jamii',
            fines: 'Kufuatilia Faini',
            reportsAudits: 'Ripoti na Ukaguzi',
            reportsCenter: 'Kituo cha Ripoti',
            auditLogs: 'Vitendo vya Ukaguzi',
            administration: 'Utawala',
            systemUsers: 'Watumiaji wa Mfumo',
            roles: 'Majukumu na Ruhusa',
            groupSettings: 'Mipangilio ya Kundi',
            activeGroup: 'Kikundi Kinachotumika',
            notifications: 'Arifa'
        },
        marketing: {
            nav: {
                features: 'Vipengele',
                howItWorks: 'Inafanyaje Kazi',
                solutions: 'Suluhisho',
                pricing: 'Bei',
                about: 'Kuhusu',
                contact: 'Mawasiliano',
                signIn: 'Ingia',
                getStarted: 'Anza Sasa',
                exploreDashboard: 'Chunguza Dashibodi'
            },
            hero: {
                badge: 'Benki Dijitali ya VIKOBA',
                title: 'Dhibiti VIKOBA Yako.',
                highlight: 'Kukua Pamoja.',
                description: 'VIKOBA360 inafanya iwe rahisi kudhibiti michango, hisa, mikopo, faini, fedha za jamii, mikutano na fedha za kikundi—kote katika jukwaa moja salama.',
                ctaPrimary: 'Unda VIKOBA Yako',
                ctaSecondary: 'Tazama Dashibodi'
            },
            metrics: {
                easySetup: 'Rahisi Kutengeneza',
                secure: 'Salama kwa Muundo',
                compliant: 'Inakidhi Kanuni za Tanzania na Afrika Mashariki'
            },
            featuresHeading: 'Vipengele Vya Nguvu Vilivyotengenezwa kwa Vikundi vya Kisasa.',
            featuresText: 'Kutoka kwa ukusanyaji wa kila siku hadi ukaguzi wa akaunti na kufuatilia mikopo, VIKOBA360 hutoa kifurushi kamili cha kuwezesha usimamizi wa kundi lako la akiba.'
        },
        auth: {
            backHome: 'Rudi mwanzo', step: 'Hatua', of: 'ya', footer: 'Mfumo salama wa vikundi vya fedha za jamii',
            story: { badge: 'Ufikiaji salama', title: 'Uwazi huanza na kumbukumbu moja.', description: 'VIKOBA360 huleta watu, michango na maamuzi ya kikundi chako pamoja katika nafasi inayoweza kuaminika.', pointOne: 'Imejengwa kwa VICOBA', pointTwo: 'Rahisi kwa kila mwanachama', pointThree: 'Taarifa zilizo wazi', footer: 'Salama · Rahisi · Pamoja' },
            login: { eyebrow: 'Karibu tena', title: 'Ingia kwenye kikundi chako.', description: 'Tumia namba yako ya simu kuendelea kwenye dashibodi yako.', phone: 'Namba ya simu', placeholder: '255712345678', submit: 'Tuma msimbo wa kuingia', loading: 'Inakagua namba...', noAccount: 'Huna akaunti?', register: 'Unda akaunti', invalidPhone: 'Weka namba sahihi ya simu inayoanza na 255 na yenye tarakimu 9 baada yake.', error: 'Namba hii haijasajiliwa kwa kuingia.' },
            register: { eyebrow: 'Anza pamoja', title: 'Unda nafasi ya kikundi chako.', description: 'Fungua akaunti yako kisha tuanze kujenga rekodi iliyo wazi ya VICOBA yako.', name: 'Jina kamili', namePlaceholder: 'Asha Mwakalinga', email: 'Barua pepe', emailPlaceholder: 'asha@example.com', phone: 'Namba ya simu', submit: 'Endelea na usajili', loading: 'Inaunda akaunti...', haveAccount: 'Tayari una akaunti?', login: 'Ingia', agree: 'Nakubali Masharti na Sera ya Faragha.', requiredName: 'Weka jina lako kamili.', requiredEmail: 'Weka barua pepe yako.', requiredPhone: 'Weka namba sahihi ya simu.', requiredAgree: 'Kubali masharti na sera ya faragha ili kuendelea.' },
            otp: { eyebrow: 'Thibitisha utambulisho', titleLogin: 'Thibitisha kuingia kwako.', titleRegister: 'Thibitisha namba yako.', titleReset: 'Thibitisha msimbo wa kurejesha.', description: 'Weka msimbo wa tarakimu sita tuliotuma kwenye', secure: 'Uthibitisho salama', verify: 'Thibitisha msimbo', verifying: 'Inathibitisha...', resend: 'Tuma tena msimbo', sending: 'Inatuma...', backLogin: 'Rudi kuingia', invalid: 'Weka msimbo kamili wa tarakimu 6.', failed: 'Uthibitisho wa msimbo umeshindikana.', sent: 'Msimbo mpya umetumwa.' }
        },
        contributions: {
            title: 'Michango',
            subtitle: 'Fuatilia na udhibiti michango ya kila wiki, mwezi na ya dharura.',
            recordPayment: 'Rekodi Malipo',
            expectedThisPeriod: 'Kiasi Kinachotarajiwa kipindi hiki',
            collectedAmount: 'Kiasi Kilichokusanywa',
            totalOutstanding: 'Jumla ya Kiasi Kilichobaki',
            collectionRate: 'Kiwango cha Ukusanyaji',
            target: 'Lengo: 100%',
            searchPlaceholder: 'Tafuta kwa jina la mwanachama...',
            allStatuses: 'Hali Zote',
            member: 'Mwanachama',
            expectedAmount: 'Kiasi Kinachotarajiwa',
            paidAmount: 'Kiasi Kilicholipwa',
            balanceDue: 'Salio Lililobaki',
            lastPaymentDate: 'Tarehe ya Malipo ya Mwisho',
            status: 'Hali',
            action: 'Kitendo',
            noContributions: 'Hakuna michango iliyopatikana.',
            recordPay: 'Rekodi Malipo',
            paymentModalTitle: 'Rekodi Malipo / Amana',
            selectMember: 'Chagua Mwanachama *',
            chooseMember: 'Chagua mwanachama...',
            paymentType: 'Aina ya Malipo *',
            amount: 'Kiasi ({currency}) *',
            paymentMethod: 'Njia ya Malipo *',
            cancel: 'Ghairi',
            submitPayment: 'Wasilisha Malipo'
        }
    },
    en: {
        common: {
            language: 'Language',
            swahili: 'Kiswahili',
            english: 'English',
            searchPlaceholder: 'Search member, transaction or code...',
            settings: 'Settings',
            signOut: 'Sign Out',
            cancel: 'Cancel',
            submit: 'Submit',
            home: 'Home',
            members: 'Members',
            finance: 'Finance',
            loans: 'Loans',
            more: 'More'
        },
        nav: {
            overview: 'Overview',
            dashboard: 'Dashboard',
            vikoBaGroup: 'VIKOBA Group',
            members: 'Members',
            meetings: 'Meetings',
            financeManagement: 'Finance Management',
            contributions: 'Contributions',
            shares: 'Shares',
            payments: 'Payments Received',
            expenses: 'Expenses logged',
            ledger: 'Ledger Accounts',
            loansRepayments: 'Loans & Repayments',
            loanDashboard: 'Loan Dashboard',
            applications: 'Applications',
            communityPenalties: 'Community & Penalties',
            jamiiFund: 'Jamii Fund',
            fines: 'Fines Tracker',
            reportsAudits: 'Reports & Audits',
            reportsCenter: 'Reports Center',
            auditLogs: 'Audit Logs',
            administration: 'Administration',
            systemUsers: 'System Users',
            roles: 'Roles & Permissions',
            groupSettings: 'Group Settings',
            activeGroup: 'Active Group',
            notifications: 'Notifications'
        },
        marketing: {
            nav: {
                features: 'Features',
                howItWorks: 'How It Works',
                solutions: 'Solutions',
                pricing: 'Pricing',
                about: 'About',
                contact: 'Contact',
                signIn: 'Sign In',
                getStarted: 'Get Started',
                exploreDashboard: 'Explore Dashboard'
            },
            hero: {
                badge: 'Digital Banking for VIKOBA',
                title: 'Manage Your VIKOBA.',
                highlight: 'Grow Together.',
                description: 'VIKOBA360 makes it simple to manage contributions, shares, loans, fines, Jamii funds, meetings, and group finances—all in one secure platform.',
                ctaPrimary: 'Create Your VIKOBA',
                ctaSecondary: 'Explore Dashboard'
            },
            metrics: {
                easySetup: 'Easy to Set Up',
                secure: 'Secure by Design',
                compliant: 'Tanzanian & East African Compliant'
            },
            featuresHeading: 'Powerful Features built for Modern Groups.',
            featuresText: 'From daily collections to auditing accounts and tracking loans, VIKOBA360 provides the ultimate suite to automate your savings group.'
        },
        auth: {
            backHome: 'Back to home', step: 'Step', of: 'of', footer: 'Secure tools for community finance groups',
            story: { badge: 'Secure access', title: 'Transparency starts with one shared record.', description: 'VIKOBA360 brings your people, contributions and group decisions into a place everyone can trust.', pointOne: 'Built for VICOBA groups', pointTwo: 'Simple for every member', pointThree: 'Clear financial records', footer: 'Secure · Simple · Together' },
            login: { eyebrow: 'Welcome back', title: 'Sign in to your group.', description: 'Use your phone number to continue to your group dashboard.', phone: 'Phone number', placeholder: '255712345678', submit: 'Send sign-in code', loading: 'Checking number...', noAccount: "Don't have an account?", register: 'Create an account', invalidPhone: 'Enter a valid phone number starting with 255 and followed by 9 digits.', error: 'This phone number is not registered for login.' },
            register: { eyebrow: 'Start together', title: 'Create your group space.', description: 'Create your account, then build a clear shared record for your VICOBA.', name: 'Full name', namePlaceholder: 'Asha Mwakalinga', email: 'Email address', emailPlaceholder: 'asha@example.com', phone: 'Phone number', submit: 'Continue registration', loading: 'Creating account...', haveAccount: 'Already have an account?', login: 'Sign in', agree: 'I agree to the Terms and Privacy Policy.', requiredName: 'Please enter your full name.', requiredEmail: 'Please enter your email address.', requiredPhone: 'Please enter a valid phone number.', requiredAgree: 'Please accept the terms and privacy policy to continue.' },
            otp: { eyebrow: 'Confirm your identity', titleLogin: 'Confirm your sign in.', titleRegister: 'Confirm your number.', titleReset: 'Confirm your reset code.', description: 'Enter the six-digit code sent to', secure: 'Secure verification', verify: 'Verify code', verifying: 'Verifying...', resend: 'Resend code', sending: 'Sending...', backLogin: 'Back to sign in', invalid: 'Please enter the full 6-digit code.', failed: 'OTP verification failed.', sent: 'A new code has been sent.' }
        },
        contributions: {
            title: 'Contributions',
            subtitle: 'Track and manage weekly, monthly, and emergency contributions.',
            recordPayment: 'Record Payment',
            expectedThisPeriod: 'Expected This Period',
            collectedAmount: 'Collected Amount',
            totalOutstanding: 'Total Outstanding',
            collectionRate: 'Collection Rate',
            target: 'Target: 100%',
            searchPlaceholder: 'Search by member name...',
            allStatuses: 'All Statuses',
            member: 'Member',
            expectedAmount: 'Expected Amount',
            paidAmount: 'Paid Amount',
            balanceDue: 'Balance Due',
            lastPaymentDate: 'Last Payment Date',
            status: 'Status',
            action: 'Action',
            noContributions: 'No contributions found.',
            recordPay: 'Record Pay',
            paymentModalTitle: 'Record Payment / Deposit',
            selectMember: 'Select Member *',
            chooseMember: 'Choose a member...',
            paymentType: 'Payment Type *',
            amount: 'Amount ({currency}) *',
            paymentMethod: 'Payment Method *',
            cancel: 'Cancel',
            submitPayment: 'Submit Payment'
        }
    }
} as const

function lookup<T = string>(obj: Record<string, any>, path: string): T | undefined {
    return path.split('.').reduce<any>((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), obj)
}

const LanguageContext = createContext<{
    locale: Locale
    setLocale: (next: Locale) => void
    t: (path: string) => string
}>({
    locale: defaultLocale,
    setLocale: () => undefined,
    t: (path) => path
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(defaultLocale)

    useEffect(() => {
        if (typeof window === 'undefined') return

        const storedLocale = window.localStorage.getItem('v360_lang') as Locale | null
        if (storedLocale === 'sw' || storedLocale === 'en') {
            setLocaleState(storedLocale)
            return
        }

        setLocaleState(defaultLocale)
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return

        window.localStorage.setItem('v360_lang', locale)
        document.documentElement.lang = locale === 'sw' ? 'sw' : 'en'
    }, [locale])

    const value = useMemo(() => ({
        locale,
        setLocale: (next: Locale) => setLocaleState(next),
        t: (path: string) => {
            const value = lookup(dictionaries[locale], path)
            return typeof value === 'string' ? value : path
        }
    }), [locale])

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
    return useContext(LanguageContext)
}
