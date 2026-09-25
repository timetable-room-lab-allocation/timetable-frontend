import { useState } from 'react'
import type { FormEvent } from 'react'

import { api } from '@/api/api'
import {
  saveAuth,
  type AuthUser,
} from '@/auth/auth'

interface LoginFormProps {
  onLogin: (user: AuthUser) => void
}

interface LoginResponse {
  success: boolean
  message: string
  user: AuthUser
}

export default function LoginForm({
  onLogin,
}: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    setError('')
    setLoading(true)

    try {
      const response =
        (await api.login({
          email: email.trim(),
          password,
        })) as LoginResponse

      if (!response.success || !response.user) {
        setError(
          response.message ||
            'Invalid email or password.'
        )
        return
      }

      // The university/backend provides the role.
      // The user does not choose a role.
      saveAuth(response.user)

      onLogin(response.user)
    } catch (error) {
      console.error('Login error:', error)

      setError(
        error instanceof Error
          ? error.message
          : 'Login failed.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-2xl font-bold text-white">
            ST
          </div>

          <h1 className="text-2xl font-bold text-slate-800">
            Smart Timetable
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Sign in using your university account
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              University Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="yourname@university.edu"
              required
              disabled={loading}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter your university password"
              required
              disabled={loading}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? 'Signing in...'
              : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-4 text-center">
          <p className="text-xs text-slate-400">
            Use the email and password provided by your university.
          </p>
        </div>
      </div>
    </div>
  )
}
