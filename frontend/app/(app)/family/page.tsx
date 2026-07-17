'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { familyApi } from '@/lib/auth';
import Spinner from '@/components/Spinner';

interface Member {
  _id: string;
  name: string;
  email: string;
  role: 'owner' | 'member';
  joinedAt: string;
}

interface FamilyDetail {
  _id: string;
  name: string;
  inviteCode: string;
  inviteCodeExpiresAt: string;
  createdAt: string;
}

export default function FamilyPage() {
  const { role } = useAuth();
  const [family, setFamily] = useState<FamilyDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await familyApi.getMyFamily();
      setFamily(res.data.family);
      setMembers(res.data.members);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load family details.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefreshCode = async () => {
    setRefreshing(true);
    try {
      const res = await familyApi.refreshInviteCode();
      setFamily((prev) =>
        prev
          ? { ...prev, inviteCode: res.data.inviteCode, inviteCodeExpiresAt: res.data.inviteCodeExpiresAt }
          : prev
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not refresh invite code.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCopy = async () => {
    if (!family?.inviteCode) return;
    try {
      await navigator.clipboard.writeText(family.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const el = document.createElement('input');
      el.value = family.inviteCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const expiryLabel = (dateStr: string) => {
    const diff = Math.round((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Expired';
    if (diff === 0) return 'Expires today';
    return `Expires in ${diff} day${diff === 1 ? '' : 's'}`;
  };

  if (loading) {
    return (
      <div className="space-y-5">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
            <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
            <div className="h-6 w-40 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center justify-between gap-3">
        <span>{error}</span>
        <button onClick={load} className="shrink-0 text-xs font-medium underline hover:no-underline">
          Retry
        </button>
      </div>
    );
  }

  if (!family) return null;

  return (
    <div className="space-y-6">
      {/* Family name card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Family</p>
        <h2 className="text-2xl font-bold text-gray-900">{family.name}</h2>
        <p className="text-xs text-gray-400 mt-1">
          Created {new Date(family.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Members */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Members ({members.length})</h3>
        <ul className="space-y-3">
          {members.map((m) => (
            <li key={m._id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{m.name}</p>
                <p className="text-xs text-gray-400">{m.email}</p>
              </div>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  m.role === 'owner'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {m.role === 'owner' ? 'Owner' : 'Member'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Invite code — visible to all, but only owner can refresh */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">Invite a family member</h3>
        <p className="text-xs text-gray-400 mb-4">
          Share this code. Anyone who signs up with it will join your family.
        </p>

        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 font-mono text-lg tracking-widest text-gray-800 text-center select-all">
            {family.inviteCode}
          </div>
          <button
            onClick={handleCopy}
            className="px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors min-w-[72px]"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        <p className="text-xs text-gray-400 mb-4">
          {expiryLabel(family.inviteCodeExpiresAt)}
        </p>

        {role === 'owner' && (
          <button
            onClick={handleRefreshCode}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-600 transition-colors disabled:opacity-50"
          >
            {refreshing && <Spinner size="sm" />}
            Generate a new code
          </button>
        )}
      </div>
    </div>
  );
}
