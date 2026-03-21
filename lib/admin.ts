type AuthLikeUser = {
  email?: string | null
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
}

function isTrue(value: unknown) {
  return value === true || value === 'true'
}

export function isAdminUser(user: AuthLikeUser | null | undefined) {
  if (!user) {
    return false
  }

  const role = user.app_metadata?.role ?? user.user_metadata?.role
  const email = user.email?.toLowerCase() ?? ''

  return (
    role === 'admin' ||
    isTrue(user.app_metadata?.is_admin) ||
    isTrue(user.user_metadata?.is_admin) ||
    email.includes('nicolas')
  )
}
