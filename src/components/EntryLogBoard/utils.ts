import type { KnownUser, LogEntry } from './types'

export const defaultFormatTimestamp = () => {
  const now = new Date()
  const yyyy = now.getFullYear()
  const MM = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return `${yyyy}-${MM}-${dd} ${hh}:${min}:${ss}`
}

export const toKnownUserKey = (user: Pick<KnownUser, 'userId' | 'joinedAt'>) => `${user.userId}-${user.joinedAt}`

export const areKnownUsersEqual = (a: KnownUser[], b: KnownUser[]) => {
  if (a.length !== b.length) return false

  const map = new Map<string, Pick<KnownUser, 'displayName' | 'avatarUrl'>>()
  a.forEach((user) => {
    map.set(toKnownUserKey(user), { displayName: user.displayName, avatarUrl: user.avatarUrl })
  })

  for (const user of b) {
    const current = map.get(toKnownUserKey(user))
    if (!current) return false
    if (current.displayName !== user.displayName) return false
    if (current.avatarUrl !== user.avatarUrl) return false
  }

  return true
}

export const getLeaderUserId = (users: Array<{ id: string }>) => users.map((user) => user.id).sort()[0]

const buildEntry = (
  type: LogEntry['type'],
  user: KnownUser,
  formatTimestamp: () => string,
): LogEntry => ({
  id: `${type}-${user.userId}-${user.joinedAt}`,
  userId: user.userId,
  displayName: user.displayName,
  type,
  timestamp: formatTimestamp(),
  avatarUrl: user.avatarUrl,
})

export const buildCurrentKnownUsers = (params: {
  users: Array<{ id: string; displayName: string; avatarUrl: string | null }>
  previousKnownUsers: KnownUser[]
  resolveDisplayName: (user: { displayName: string }) => string
  formatTimestamp: () => string
}): KnownUser[] => {
  const { users, previousKnownUsers, resolveDisplayName, formatTimestamp } = params
  const now = formatTimestamp()
  const previousByUserId = new Map(previousKnownUsers.map((user) => [user.userId, user]))

  return users.map((user) => {
    const existing = previousByUserId.get(user.id)
    return {
      userId: user.id,
      displayName: resolveDisplayName(user),
      avatarUrl: user.avatarUrl,
      joinedAt: existing?.joinedAt ?? now,
    }
  })
}

export const buildDiffEntries = (params: {
  prevKnownUsers: KnownUser[]
  currentKnownUsers: KnownUser[]
  formatTimestamp: () => string
}): LogEntry[] => {
  const { prevKnownUsers, currentKnownUsers, formatTimestamp } = params

  const prevMap = new Map(prevKnownUsers.map((user) => [toKnownUserKey(user), user]))
  const currentMap = new Map(currentKnownUsers.map((user) => [toKnownUserKey(user), user]))

  const entries: LogEntry[] = []

  // 新規ユーザーを検出 (JOIN ログ)
  for (const [key, user] of currentMap) {
    if (!prevMap.has(key)) {
      entries.push(buildEntry('join', user, formatTimestamp))
    }
  }

  // 退室ユーザーを検出 (LEAVE ログ)
  for (const [key, user] of prevMap) {
    if (!currentMap.has(key)) {
      entries.push({
        id: `leave-${user.userId}-${user.joinedAt}`,
        userId: user.userId,
        displayName: user.displayName,
        type: 'leave',
        timestamp: formatTimestamp(),
        avatarUrl: user.avatarUrl,
      })
    }
  }

  return entries
}
