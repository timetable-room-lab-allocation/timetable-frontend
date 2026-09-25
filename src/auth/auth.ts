export type UserRole =
  | 'Admin'
  | 'Coordinator'
  | 'Lecturer'
  | 'Student'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: UserRole
  student_group_id: number | null
}

const AUTH_KEY = 'timetable_auth'

export function saveAuth(user: AuthUser) {
  localStorage.setItem(
    AUTH_KEY,
    JSON.stringify(user)
  )
}

export function getAuth(): AuthUser | null {
  const storedUser =
    localStorage.getItem(AUTH_KEY)

  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser) as AuthUser
  } catch {
    localStorage.removeItem(AUTH_KEY)
    return null
  }
}

export function logout() {
  localStorage.removeItem(AUTH_KEY)
}
