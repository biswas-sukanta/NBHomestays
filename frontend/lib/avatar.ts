function buildInitials(displayName?: string | null) {
  if (!displayName || !displayName.trim()) {
    return 'NB'
  }
  const initials = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
  return initials || 'NB'
}

function hsl(hue: number, saturation: number, lightness: number) {
  return `hsl(${hue} ${saturation}% ${lightness}%)`
}

export function generateFallbackAvatar(userId?: string | null, displayName?: string | null) {
  const seed = userId && userId.trim() ? userId : 'guest'
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
    hash |= 0
  }
  hash = Math.abs(hash)
  const topColor = hsl(hash % 360, 62, 52)
  const bottomColor = hsl((hash + 47) % 360, 68, 38)
  const initials = buildInitials(displayName)
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${topColor}"/>
          <stop offset="100%" stop-color="${bottomColor}"/>
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="80" fill="url(#g)"/>
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
            fill="#ffffff" font-family="Arial, sans-serif" font-size="52" font-weight="700">${initials}</text>
    </svg>
  `.trim()

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export function resolveAvatarUrl(userId?: string | null, avatarUrl?: string | null, displayName?: string | null) {
  if (avatarUrl && avatarUrl.trim()) {
    return avatarUrl
  }
  return generateFallbackAvatar(userId, displayName)
}
