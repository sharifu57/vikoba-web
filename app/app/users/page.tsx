"use client";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Search, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { memberService, type Member } from "@/lib/api/services";
type Env<T> = { data?: T; message?: string };
const unwrap = <T,>(v: T | Env<T>) =>
  (v && typeof v === "object" && "data" in v ? (v as Env<T>).data : v) as T;

const permissionHint = (permission: string) => {
  if (permission === "MEETING_MANAGE") return "Schedule meetings and record attendance";
  if (permission === "MEETING_MINUTES_MANAGE") return "Create and revise meeting minutes";
  return "Additional group-specific access";
};
export default function UsersAdministrationPage() {
  const qc = useQueryClient();
  const [groupId, setGroupId] = useState("");
  const [open, setOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [access, setAccess] = useState<{ roles: string[]; permissions: string[] }>({ roles: ["MEMBER"], permissions: [] });
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    email: "",
    nationalId: "",
    role: "MEMBER",
  });
  useEffect(() => {
    try {
      const g = JSON.parse(localStorage.getItem("v360_currentGroup") || "{}");
      setGroupId(
        String(
          g.id ??
            g.groupId ??
            localStorage.getItem("v360_currentGroupId") ??
            "",
        ),
      );
    } catch {}
  }, []);
  const members = useQuery({
    queryKey: ["members", groupId],
    queryFn: async () => unwrap(await memberService.list(groupId)) || [],
    enabled: /^\d+$/.test(groupId),
  });
  const roles = useQuery({
    queryKey: ["member-roles"],
    queryFn: async () => unwrap(await memberService.getRoles()) || [],
  });
  const permissions = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => unwrap(await memberService.getPermissions()) || [],
  });
  const updateAccess = useMutation({
    mutationFn: () => memberService.updateAccess(groupId, selectedMember!.id, access),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["members", groupId] }); window.dispatchEvent(new Event("vikoba:access-updated")); setAccessOpen(false); },
  });
  const add = useMutation({
    mutationFn: () =>
      memberService.create({
        ...form,
        groupId: Number(groupId),
        joinedDate: new Date().toISOString().slice(0, 10),
        membershipType: "ORDINARY",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members", groupId] });
      setOpen(false);
    },
  });
  const list = (members.data || []) as Member[];
  const visible = list.filter((m) =>
    `${m.name || m.fullName || ""} ${m.phone || ""} ${m.email || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const currentMembership = (() => { try { return (JSON.parse(localStorage.getItem("v360_groups") || "[]") as any[]).find((item) => String(item?.group?.groupId ?? item?.groupId) === groupId) } catch { return null } })();
  const canManageAccess = currentMembership?.roles?.includes("GROUP_ADMIN") || currentMembership?.role === "GROUP_ADMIN" || (currentMembership?.permissions || []).includes("USER_ROLE_MANAGE");
  const toggle = (key: "roles" | "permissions", value: string) => setAccess((current) => ({ ...current, [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value] }));
  const openAccess = (member: Member) => { setSelectedMember(member); setAccess({ roles: Array.from(new Set(["MEMBER", ...(member.roles || [member.role || "MEMBER"])])), permissions: member.permissions || [] }); setAccessOpen(true); };
  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-neutral-400">
            Administration / Users
          </p>
          <h1 className="mt-2 text-2xl font-black">Group users</h1>
          <p className="text-xs text-neutral-400">
            Register members and assign group roles.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={15} /> Add user
        </Button>
      </div>
      <div className="mb-5 flex items-center rounded-xl border border-border bg-card p-3 shadow-sm">
        <Search size={15} className="mr-2 text-neutral-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          className="h-10 border-0 bg-transparent shadow-none"
        />
      </div>
      <div className="relative z-10 overflow-hidden rounded-xl border border-border bg-card shadow-[0_12px_36px_rgba(16,36,29,0.12)]">
        <Table className="w-full text-left text-xs">
          <TableHeader>
            <TableRow className="bg-muted/70 text-xs uppercase text-foreground">
              <TableHead className="p-4">Member</TableHead>
              <TableHead className="p-4">Phone</TableHead>
              <TableHead className="p-4">Email</TableHead>
              <TableHead className="p-4">Roles</TableHead>
              <TableHead className="p-4">Status</TableHead>
              {canManageAccess && <TableHead className="p-4 text-right">Access</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.isLoading && (
              <TableRow>
                <TableCell colSpan={canManageAccess ? 6 : 5} className="p-10 text-center">
                  <Loader2 className="mx-auto animate-spin" />
                </TableCell>
              </TableRow>
            )}
            {!members.isLoading && members.isError && <TableRow><TableCell colSpan={canManageAccess ? 6 : 5} className="p-8 text-center text-destructive">Unable to load group users. Please retry.</TableCell></TableRow>}
            {!members.isLoading && !members.isError && visible.length === 0 && <TableRow><TableCell colSpan={canManageAccess ? 6 : 5} className="p-8 text-center text-muted-foreground">{search ? "No users match your search." : "No group users found."}</TableCell></TableRow>}
            {visible.map((m) => (
              <TableRow key={m.id} className="border-t">
                <TableCell className="p-4 font-bold">
                  {m.name ||
                    m.fullName ||
                    `${m.firstName || ""} ${m.lastName || ""}`}
                </TableCell>
                <TableCell className="p-4">{m.phone || "—"}</TableCell>
                <TableCell className="p-4">{m.email || "—"}</TableCell>
                <TableCell className="p-4"><div className="flex flex-wrap gap-1">{(m.roles || [m.role || "MEMBER"]).map(role => <Badge key={role} variant="secondary">{role.replaceAll("_", " ")}</Badge>)}</div></TableCell>
                <TableCell className="p-4"><Badge variant={(m.status || "ACTIVE") === "ACTIVE" ? "default" : "outline"}>{m.status || "ACTIVE"}</Badge></TableCell>
                {canManageAccess && <TableCell className="p-4 text-right"><Button variant="default" size="sm" className="min-w-28 font-bold" onClick={() => openAccess(m)}><ShieldCheck size={14} /> Manage</Button></TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register group user</DialogTitle>
            <DialogDescription>
              The user will be added as a member of this group.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (/^255\d{9}$/.test(form.phone)) add.mutate();
            }}
            className="grid grid-cols-2 gap-3"
          >
            {(
              [
                ["firstName", "First name"],
                ["middleName", "Middle name"],
                ["lastName", "Last name"],
                ["email", "Email"],
                ["nationalId", "National ID"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="text-xs font-bold">
                {label}
                <Input
                  required={key === "firstName" || key === "lastName"}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </label>
            ))}
            <label className="text-xs font-bold">
              Phone (255XXXXXXXXX)
              <Input
                required
                pattern="255[0-9]{9}"
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })
                }
              />
            </label>
            <label className="text-xs font-bold">
              Role
              <NativeSelect
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                {(roles.data || []).map((r: any) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </NativeSelect>
            </label>
            <DialogFooter className="col-span-2">
              <Button type="submit" disabled={add.isPending}>
                {add.isPending ? "Saving…" : "Register member"}
              </Button>
            </DialogFooter>
          </form>
          {add.isError && (
            <p className="text-xs text-red-600">
              {(add.error as Error).message}
            </p>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={accessOpen} onOpenChange={setAccessOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage member access</DialogTitle>
            <DialogDescription>Choose roles and additional permissions for {selectedMember?.fullName || selectedMember?.name}. The base MEMBER role stays assigned.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="min-w-0 border-border shadow-sm">
              <CardContent className="space-y-3 p-4 pt-4">
                <div className="flex items-center justify-between"><h3 className="font-bold text-foreground">Group roles</h3><Badge variant="secondary">{access.roles.length} selected</Badge></div>
                <p className="text-xs text-muted-foreground">Roles determine what this user can do in the group.</p>
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">{(roles.data || []).map((role: any) => {
                  const selected = access.roles.includes(role.value);
                  return <Label key={role.value} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors ${selected ? 'border-primary bg-primary-soft text-foreground' : 'border-border bg-card hover:bg-muted'}`}>
                    <Checkbox checked={selected} disabled={role.value === 'MEMBER'} onChange={() => toggle('roles', role.value)} aria-label={`Assign ${role.label} role`} />
                    <span className="font-semibold">{role.label}</span>{role.value === 'MEMBER' && <Badge variant="outline" className="ml-auto">Required</Badge>}
                  </Label>;
                })}</div>
              </CardContent>
            </Card>
            <Card className="min-w-0 border-border shadow-sm">
              <CardContent className="space-y-3 p-4 pt-4">
                <div className="flex items-center justify-between"><h3 className="font-bold text-foreground">Extra permissions</h3><Badge variant="secondary">{access.permissions.length} selected</Badge></div>
                <p className="text-xs text-muted-foreground">Grant specific actions beyond the selected roles.</p>
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">{(permissions.data || []).map((permission: string) => {
                  const selected = access.permissions.includes(permission);
                  return <Label key={permission} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${selected ? 'border-primary bg-primary-soft text-foreground' : 'border-border bg-card hover:bg-muted'}`}>
                    <Checkbox checked={selected} onChange={() => toggle('permissions', permission)} aria-label={`Grant ${permission} permission`} className="mt-0.5" />
                    <span><span className="block font-semibold">{permission.replaceAll('_', ' ')}</span><span className="mt-1 block text-xs font-normal text-muted-foreground">{permissionHint(permission)}</span></span>
                  </Label>;
                })}</div>
              </CardContent>
            </Card>
          </div>
          {updateAccess.isError && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{(updateAccess.error as Error).message}</p>}
          <DialogFooter className="gap-2 border-t border-border pt-4">
            <Button variant="outline" type="button" onClick={() => setAccessOpen(false)}>Cancel</Button>
            <Button type="button" onClick={() => updateAccess.mutate()} disabled={updateAccess.isPending}>{updateAccess.isPending ? <><Loader2 className="animate-spin" /> Saving…</> : 'Save access'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
