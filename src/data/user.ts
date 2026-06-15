interface User { name: string }

const KEY = 'av_user'

export function getUser(): User | null {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as User } catch { return null }
}

export function saveUser(u: User | null): void {
  if (u === null) localStorage.removeItem(KEY)
  else localStorage.setItem(KEY, JSON.stringify(u))
}
