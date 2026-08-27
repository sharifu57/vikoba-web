"use client";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Search } from "lucide-react";
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
import { memberService, type Member } from "@/lib/api/services";
type Env<T> = { data?: T; message?: string };
const unwrap = <T,>(v: T | Env<T>) =>
  (v && typeof v === "object" && "data" in v ? (v as Env<T>).data : v) as T;
export default function UsersAdministrationPage() {
  const qc = useQueryClient();
  const [groupId, setGroupId] = useState("");
  const [open, setOpen] = useState(false);
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
      <div className="mb-5 flex items-center rounded-xl border bg-white p-3">
        <Search size={15} className="mr-2 text-neutral-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          className="h-8 border-0 shadow-none"
        />
      </div>
      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-neutral-50 text-[10px] uppercase text-neutral-400">
              <th className="p-4">Member</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {members.isLoading && (
              <tr>
                <td colSpan={5} className="p-10 text-center">
                  <Loader2 className="mx-auto animate-spin" />
                </td>
              </tr>
            )}
            {visible.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="p-4 font-bold">
                  {m.name ||
                    m.fullName ||
                    `${m.firstName || ""} ${m.lastName || ""}`}
                </td>
                <td className="p-4">{m.phone || "—"}</td>
                <td className="p-4">{m.email || "—"}</td>
                <td className="p-4 font-bold">{m.role || "MEMBER"}</td>
                <td className="p-4">{m.status || "ACTIVE"}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                {(roles.data || []).map((r: any) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
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
    </main>
  );
}
