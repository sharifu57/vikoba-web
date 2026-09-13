/** Resolve the database group ID even if an older UI stored a demo group slug. */
export function resolveActiveGroupId(storage: Pick<Storage, 'getItem' | 'setItem'>): string | null {
  const selected = storage.getItem('v360_currentGroupId') || ''
  if (/^\d+$/.test(selected)) return selected

  try {
    const current = JSON.parse(storage.getItem('v360_currentGroup') || 'null') as Record<string, unknown> | null
    const id = [current?.groupId, current?.id].find(value => value != null && /^\d+$/.test(String(value)))
    if (id != null) {
      storage.setItem('v360_currentGroupId', String(id))
      return String(id)
    }
  } catch { /* Fall back to the authenticated group list. */ }

  try {
    const current = JSON.parse(storage.getItem('v360_currentGroup') || 'null') as Record<string, unknown> | null
    const groups = JSON.parse(storage.getItem('v360_groups') || '[]') as Array<Record<string, unknown>>
    const normalized = groups.map(entry => {
      const group = (entry.group || entry) as Record<string, unknown>
      const id = [group.groupId, group.id].find(value => value != null && /^\d+$/.test(String(value)))
      return { id, name: String(group.groupName ?? group.name ?? ''), code: String(group.groupCode ?? group.code ?? '') }
    }).filter(group => group.id != null)
    const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const selectedName = String(current?.groupName ?? current?.name ?? '')
    const match = normalized.find(group =>
      (selectedName && slug(group.name) === slug(selectedName)) ||
      (selected && (slug(group.name) === slug(selected) || slug(group.name).startsWith(slug(selected) + '-') || slug(group.code) === slug(selected))))
      || (normalized.length === 1 ? normalized[0] : null)
    if (match) {
      const id = String(match.id)
      storage.setItem('v360_currentGroupId', id)
      return id
    }
  } catch { /* No authenticated group information is available. */ }
  return null
}
