"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Check, Landmark, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/auth/auth-shell";
import { selectActiveGroup, type GroupMembership } from "@/lib/api/active-group";

function groupDetails(membership: GroupMembership) {
    const group = membership.group ?? membership;
    return {
        id: String(group.groupId ?? group.id ?? ""),
        name: String(group.groupName ?? group.name ?? "Vikoba group"),
        organization: String(group.organizationName ?? ""),
        code: String(group.groupCode ?? group.code ?? ""),
        currency: String(group.currency ?? "TZS"),
        role: String(membership.role ?? "MEMBER").replaceAll("_", " "),
    };
}

export default function SelectGroupPage() {
    const router = useRouter();
    const [groups, setGroups] = useState<GroupMembership[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<string | null>(null);

    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem("v360_groups") || "[]");
            if (Array.isArray(saved)) setGroups(saved as GroupMembership[]);
        } catch {
            setGroups([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const choose = (membership: GroupMembership) => {
        if (selected) return;
        setSelected(groupDetails(membership).id);
        try {
            selectActiveGroup(localStorage, membership);
            const configured = membership.settingsConfigured === true || Boolean(membership.settings);
            router.replace(configured ? "/app/dashboard" : "/app/settings");
        } catch {
            setSelected(null);
        }
    };

    return (
        <AuthShell
            eyebrow="YOUR VIKOBA GROUPS"
            title="Choose your group"
            description="Your phone number gives you one secure sign-in. Choose which group workspace to open."
        >
            <div className="space-y-3">
                {loading ? (
                    <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">Loading your memberships...</div>
                ) : groups.length === 0 ? (
                    <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
                        No group memberships are linked to this account yet.
                        <Button className="mt-4 w-full" onClick={() => router.replace("/app/settings")}>Continue to setup <ArrowRight size={16} /></Button>
                    </div>
                ) : groups.map((membership) => {
                    const group = groupDetails(membership);
                    const isSelected = selected === group.id;
                    return (
                        <button
                            key={group.id}
                            type="button"
                            disabled={selected !== null}
                            onClick={() => choose(membership)}
                            className="group flex w-full items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-700 hover:shadow-md disabled:cursor-wait disabled:opacity-70 sm:p-5"
                        >
                            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 group-hover:bg-emerald-800 group-hover:text-white">
                                <Landmark size={21} />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-extrabold text-neutral-900">{group.name}</span>
                                <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
                                    {group.organization && <span className="inline-flex items-center gap-1"><Building2 size={12} />{group.organization}</span>}
                                    {group.code && <span>{group.code}</span>}
                                </span>
                                <span className="mt-3 flex flex-wrap gap-2">
                                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-900"><UsersRound size={12} />{group.role}</span>
                                    <span className="rounded-md bg-neutral-100 px-2 py-1 text-[10px] font-bold text-neutral-600">{group.currency}</span>
                                </span>
                            </span>
                            <span className="text-emerald-800">{isSelected ? <Check size={20} /> : <ArrowRight size={19} />}</span>
                        </button>
                    );
                })}
            </div>
            <p className="mt-4 text-center text-xs text-neutral-500">You can switch groups later from the workspace menu.</p>
        </AuthShell>
    );
}