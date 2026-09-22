import { useState } from 'react';
import type { FormEvent } from 'react';

import { api } from '../api/api';

import type { DemoUser } from '../data/demoUsers';

interface LoginFormProps {
  onLogin: (user: DemoUser) => void;
}

interface LoginResponse {
  success: boolean;
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: 'Admin' | 'Lecturer' | 'Student';
    student_group_id?: number | null;
  };
}

const roleMap: Record<
  LoginResponse['user']['role'],
  DemoUser['role']
> = {
  Admin: 'admin',
  Lecturer: 'lecturer',
  Student: 'student',
};

export default function LoginForm({
  onLogin,
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');

      const response =
        (await api.login({
          email: email.trim(),
          password,
        })) as LoginResponse;

      if (!response.success || !response.user) {
        setError(
          response.message ||
            'Invalid email or password.'
        );
        return;
      }

      const backendUser = response.user;

      const demoUser: DemoUser = {
        id: backendUser.id,
        name: backendUser.name,
        email: backendUser.email,
        password: '',
        role: roleMap[backendUser.role],
        studentGroupId:
          backendUser.student_group_id ??
          undefined,
      };

      onLogin(demoUser);

    } catch (err) {
      console.error('Login error:', err);

      setError(
        err instanceof Error
          ? err.message
          : 'Invalid email or password.'
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">

          <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mb-3 shadow-md">
            st
          </div>

          <h1 className="text-2xl font-bold text-slate-800">
            Smart Timetable
          </h1>

          <p className="text-slate-500 text-sm mt-1">
            Sign in to your account
          </p>

        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
              disabled={loading}
              placeholder="student@smart.edu"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
              disabled={loading}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition duration-200 shadow-md mt-2"
          >
            {loading
              ? 'Signing in...'
              : 'Sign In'}
          </button>

        </form>

        {/* Backend Login Info */}
        <div className="mt-6 border-t border-slate-100 pt-4">

          <p className="text-xs font-semibold text-slate-500 mb-2">
            Backend authentication
          </p>

          <p className="text-xs text-slate-400">
            Sign in using an account stored in
            the Smart Timetable database.
          </p>

        </div>

      </div>

    </div>
  );
}
