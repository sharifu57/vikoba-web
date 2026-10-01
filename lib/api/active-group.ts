/** Resolve the database group ID even if an older UI stored a demo group slug. */
export type GroupMembership = Record<string, unknown> & {
  group?: Record<string, unknown>;
  settings?: Record<string, unknown> | null;
  settingsConfigured?: boolean;
  groupMemberId?: string | number;
  role?: string;
  roles?: string[];
  permissions?: string[];
};

export function selectActiveGroup(
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">,
  membership: GroupMembership,
): string {
  const group =
    membership.group && typeof membership.group === "object"
      ? membership.group
      : membership;
  const rawId = group.groupId ?? group.id;
  const id = rawId == null ? "" : String(rawId);
  if (!/^\d+$/.test(id))
    throw new Error("This group has an invalid identifier.");

  const name = String(group.groupName ?? group.name ?? "My Group");
  const currency = String(group.currency ?? "TZS");
  const settings =
    membership.settings && typeof membership.settings === "object"
      ? membership.settings
      : null;
  const roles = Array.isArray(membership.roles)
    ? membership.roles.map(String)
    : [String(membership.role ?? "MEMBER")];
  const role = String(membership.role ?? roles[0] ?? "MEMBER");
  const permissions = Array.isArray(membership.permissions)
    ? membership.permissions.map(String)
    : [];
  const memberId = membership.groupMemberId;

  storage.setItem("v360_currentGroupId", id);
  storage.setItem(
    "v360_currentGroup",
    JSON.stringify({
      ...group,
      id,
      groupId: id,
      name,
      groupName: name,
      currency,
      role,
    }),
  );
  storage.setItem("v360_currentGroupRole", role);
  storage.setItem("v360_currentGroupRoles", JSON.stringify(roles));
  storage.setItem("v360_currentGroupPermissions", JSON.stringify(permissions));
  if (memberId != null)
    storage.setItem("v360_currentGroupMemberId", String(memberId));
  else storage.removeItem("v360_currentGroupMemberId");
  storage.setItem("v360_currentGroupCurrency", currency);
  if (settings)
    storage.setItem("v360_group_settings", JSON.stringify(settings));
  else storage.removeItem("v360_group_settings");

  if (membership.settingsConfigured === true || settings) {
    storage.setItem("v360_group_setup_complete", "true");
    storage.setItem("v360_group_setup_done", "true");
  } else {
    storage.removeItem("v360_group_setup_complete");
    storage.removeItem("v360_group_setup_done");
  }
  return id;
}

export function resolveActiveGroupId(
  storage: Pick<Storage, "getItem" | "setItem">,
): string | null {
  const selected = storage.getItem("v360_currentGroupId") || "";
  if (/^\d+$/.test(selected)) return selected;

  try {
    const current = JSON.parse(
      storage.getItem("v360_currentGroup") || "null",
    ) as Record<string, unknown> | null;
    const nested =
      current?.group && typeof current.group === "object"
        ? (current.group as Record<string, unknown>)
        : null;
    const id = [
      current?.groupId,
      current?.id,
      nested?.groupId,
      nested?.id,
    ].find((value) => value != null && /^\d+$/.test(String(value)));
    if (id != null) {
      storage.setItem("v360_currentGroupId", String(id));
      return String(id);
    }
  } catch {
    /* Fall back to the authenticated group list. */
  }

  try {
    const current = JSON.parse(
      storage.getItem("v360_currentGroup") || "null",
    ) as Record<string, unknown> | null;
    const groups = JSON.parse(storage.getItem("v360_groups") || "[]") as Array<
      Record<string, unknown>
    >;
    const normalized = groups
      .map((entry) => {
        const group = (entry.group || entry) as Record<string, unknown>;
        const id = [group.groupId, group.id].find(
          (value) => value != null && /^\d+$/.test(String(value)),
        );
        return {
          id,
          name: String(group.groupName ?? group.name ?? ""),
          code: String(group.groupCode ?? group.code ?? ""),
        };
      })
      .filter((group) => group.id != null);
    const slug = (value: string) =>
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    const selectedName = String(current?.groupName ?? current?.name ?? "");
    const match =
      normalized.find(
        (group) =>
          (selectedName && slug(group.name) === slug(selectedName)) ||
          (selected &&
            (slug(group.name) === slug(selected) ||
              slug(group.name).startsWith(slug(selected) + "-") ||
              slug(group.code) === slug(selected))),
      ) || (normalized.length === 1 ? normalized[0] : null);
    if (match) {
      const id = String(match.id);
      storage.setItem("v360_currentGroupId", id);
      return id;
    }
  } catch {
    /* No authenticated group information is available. */
  }
  return null;
}
