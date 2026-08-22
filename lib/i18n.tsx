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
