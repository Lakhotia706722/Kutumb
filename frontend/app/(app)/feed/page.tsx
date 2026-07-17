'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Alert, alertsApi, bucketAlerts } from '@/lib/alerts';
import { ScoreResult, scoreApi } from '@/lib/score';
import FeedCard from '@/components/FeedCard';
import ScoreWidget from '@/components/ScoreWidget';
import SkeletonCard from '@/components/SkeletonCard';
import Link from 'next/link';

export default function FeedPage() {
  const { family } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      // Load alerts and score in parallel
      const [alertsRes, scoreRes] = await Promise.all([
        alertsApi.list(),
        scoreApi.get(),
      ]);
      setAlerts(alertsRes.data.alerts);
      setScore(scoreRes.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load your feed.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Remove alert from local state, then refresh score (vault state may have changed)
  const handleAction = async (id: string, _action: 'resolved' | 'dismissed') => {
    setAlerts(prev => prev.filter(a => a._id !== id));
    // Refresh score silently in background — resolve doesn't change docs but
    // a dismissed expired alert means user has acknowledged, keeps score honest
    scoreApi.get().then(res => setScore(res.data)).catch(() => {});
  };

  if (loading) {
    return (
      <div className="space-y-5 pb-8">
        {/* Score widget skeleton */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-[88px] h-[88px] bg-gray-200 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-40" />
              <div className="h-3 bg-gray-100 rounded w-56" />
              <div className="h-3 bg-gray-100 rounded w-24" />
            </div>
          </div>
        </div>
        {/* Feed skeleton */}
        <div className="space-y-1.5">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-40 bg-gray-100 rounded animate-pulse mb-2" />
        </div>
        {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const buckets = bucketAlerts(alerts);
  const totalVisible =
    buckets.overdue.length +
    buckets.thisWeek.length +
    buckets.thisMonth.length +
    buckets.upcoming.length;

  return (
    <div className="space-y-5 pb-8">
      {/* ── Score widget — the emotional hook, always visible ── */}
      {score && <ScoreWidget result={score} />}

      {/* ── Feed header ── */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {family?.name ?? 'Family'} Feed
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          {totalVisible === 0
            ? "You're all caught up"
            : `${totalVisible} item${totalVisible === 1 ? '' : 's'} need${totalVisible === 1 ? 's' : ''} attention`}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}{' '}
          <button onClick={load} className="underline font-medium">Retry</button>
        </div>
      )}

      {totalVisible === 0 ? (
        <EmptyFeed />
      ) : (
        <>
          <FeedSection
            title="🚨 Overdue"
            subtitle="These have already expired — act now"
            alerts={buckets.overdue}
            onAction={handleAction}
            emptyHidden
          />
          <FeedSection
            title="This Week"
            subtitle="Expiring in the next 7 days"
            alerts={buckets.thisWeek}
            onAction={handleAction}
            emptyHidden
          />
          <FeedSection
            title="This Month"
            subtitle="Expiring in the next 8–30 days"
            alerts={buckets.thisMonth}
            onAction={handleAction}
            emptyHidden
          />
          <FeedSection
            title="Upcoming"
            subtitle="Expiring in the next 31–90 days"
            alerts={buckets.upcoming}
            onAction={handleAction}
            emptyHidden
          />
        </>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FeedSection({
  title,
  subtitle,
  alerts,
  onAction,
  emptyHidden = false,
}: {
  title: string;
  subtitle: string;
  alerts: Alert[];
  onAction: (id: string, action: 'resolved' | 'dismissed') => void;
  emptyHidden?: boolean;
}) {
  if (emptyHidden && alerts.length === 0) return null;

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-gray-800">
          {title}
          <span className="ml-2 text-xs font-normal text-gray-400">({alerts.length})</span>
        </h2>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
      <div className="space-y-2.5">
        {alerts.map(alert => (
          <FeedCard key={alert._id} alert={alert} onAction={onAction} />
        ))}
      </div>
    </section>
  );
}

function EmptyFeed() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <span className="text-3xl">✓</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">
        You&apos;re all caught up
      </h3>
      <p className="text-sm text-gray-500 max-w-xs mb-6">
        No renewals or expiries need attention right now. Add more documents
        to your vault and we&apos;ll alert you before anything lapses.
      </p>
      <Link href="/vault" className="text-sm font-medium text-orange-600 hover:underline">
        Go to Document Vault →
      </Link>
    </div>
  );
}
