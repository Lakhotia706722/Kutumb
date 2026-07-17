'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/Spinner';

type Action = 'create' | 'join';

const passwordStrength = (pw: string): { label: string; colour: string; width: string } => {
  if (pw.length === 0) return { label: '', colour: '', width: 'w-0' };
  if (pw.length < 8)   return { label: 'Too short', colour: 'bg-red-400', width: 'w-1/4' };
  const strong = /[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw);
  const medium = /[A-Z]/.test(pw) || /[0-9]/.test(pw);
  if (strong) return { label: 'Strong', colour: 'bg-green-500', width: 'w-full' };
  if (medium) return { label: 'Medium', colour: 'bg-amber-400', width: 'w-1/2' };
  return { label: 'Weak', colour: 'bg-red-400', width: 'w-1/4' };
};

export default function SignupPage() {
  const { user, loading: authLoading, refresh } = useAuth();
  const router = useRouter();

  const [action, setAction] = useState<Action>('create');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect already-logged-in users
  useEffect(() => {
    if (!authLoading && user) router.replace('/feed');
  }, [user, authLoading, router]);

  const pwStrength = passwordStrength(password);

  const validate = (): string | null => {
    if (!name.trim()) return 'Please enter your name.';
    if (!email.trim()) return 'Please enter your email.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Please enter a valid email address.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (action === 'create' && !familyName.trim()) return 'Please enter a family name.';
    if (action === 'join' && !inviteCode.trim()) return 'Please enter the invite code.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      await authApi.signup({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        action,
        familyName: action === 'create' ? familyName.trim() : undefined,
        inviteCode: action === 'join' ? inviteCode.trim() : undefined,
      });
      await refresh();
      router.push('/feed');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      {/* Brand */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-orange-600 mb-1">कुटुम्ब</h1>
        <p className="text-gray-500 text-sm">Your family&apos;s life, organised.</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Create your account</h2>

        {/* Action selector */}
        <div className="flex rounded-lg border border-gray-200 p-1 mb-5">
          <button
            type="button"
            onClick={() => { setAction('create'); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              action === 'create' ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Create a family
          </button>
          <button
            type="button"
            onClick={() => { setAction('join'); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              action === 'join' ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Join with invite
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
            <input
              id="name" type="text" autoComplete="name"
              value={name} onChange={e => setName(e.target.value)}
              className={inputClass} placeholder="Rahul Sharma"
              aria-required="true"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email" type="email" autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              className={inputClass} placeholder="you@example.com"
              aria-required="true"
            />
          </div>

          {/* Password + strength indicator */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-gray-400 font-normal">(min 8 characters)</span>
            </label>
            <input
              id="password" type="password" autoComplete="new-password"
              value={password} onChange={e => setPassword(e.target.value)}
              className={inputClass} placeholder="••••••••"
              aria-required="true"
            />
            {password.length > 0 && (
              <div className="mt-1.5 space-y-0.5">
                <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${pwStrength.colour} ${pwStrength.width}`} />
                </div>
                <p className={`text-xs ${pwStrength.colour.replace('bg-', 'text-').replace('-500', '-600').replace('-400', '-600')}`}>
                  {pwStrength.label}
                </p>
              </div>
            )}
          </div>

          {/* Conditional field */}
          {action === 'create' ? (
            <div>
              <label htmlFor="familyName" className="block text-sm font-medium text-gray-700 mb-1">Family name</label>
              <input
                id="familyName" type="text"
                value={familyName} onChange={e => setFamilyName(e.target.value)}
                className={inputClass} placeholder="e.g. The Sharma Family"
                aria-required="true"
              />
              <p className="mt-1 text-xs text-gray-400">
                You can invite your spouse or another member after signing up.
              </p>
            </div>
          ) : (
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-1">Invite code</label>
              <input
                id="inviteCode" type="text"
                value={inviteCode} onChange={e => setInviteCode(e.target.value)}
                className={`${inputClass} font-mono tracking-widest`}
                placeholder="e.g. V1StGXR8_Z"
                aria-required="true"
              />
              <p className="mt-1 text-xs text-gray-400">
                Ask your family member to share their invite code from the Family page.
              </p>
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg py-2.5 text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <Spinner size="sm" />}
            {loading
              ? 'Creating account…'
              : action === 'create' ? 'Create family & account' : 'Join family'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-orange-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
