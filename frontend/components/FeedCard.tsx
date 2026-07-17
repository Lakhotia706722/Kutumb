'use client';

import { useState } from 'react';
import { Alert, alertsApi } from '@/lib/alerts';
import { CATEGORY_ICONS, Category, daysUntilExpiry } from '@/lib/documents';
import Spinner from './Spinner';

interface Props {
  alert: Alert;
  onAction: (id: string, action: 'resolved' | 'dismissed') => void;
}

export default function FeedCard({ alert, onAction }: Props) {
  const [loading, setLoading] = useState<'resolve' | 'dismiss' | null>(null);
  const [error, setError] = useState('');

  const doc = typeof alert.document === 'object' ? alert.document : null;
  const category = doc?.category as Category | undefined;
  const icon = category ? CATEGORY_ICONS[category] : '📄';

  // Days until expiry — drives the urgency colouring
  const daysLeft = doc?.expiryDate ? daysUntilExpiry(doc.expiryDate) : null;

  const urgency = (() => {
    if (daysLeft === null) return 'neutral';
    if (daysLeft < 0) return 'expired';
    if (daysLeft <= 7) return 'critical';
    if (daysLeft <= 30) return 'warning';
    return 'neutral';
  })();

  const borderColour = {
    expired: 'border-l-red-500',
    critical: 'border-l-red-400',
    warning: 'border-l-amber-400',
    neutral: 'border-l-gray-200',
  }[urgency];

  const badgeColour = {
    expired: 'bg-red-100 text-red-700',
    critical: 'bg-red-100 text-red-700',
    warning: 'bg-amber-100 text-amber-700',
    neutral: 'bg-gray-100 text-gray-500',
  }[urgency];

  const badgeText = (() => {
    if (daysLeft === null) return null;
    if (daysLeft < 0) return `Expired ${Math.abs(daysLeft)}d ago`;
    if (daysLeft === 0) return 'Expires today';
    return `${daysLeft}d left`;
  })();

  const handleResolve = async () => {
    setError('');
    setLoading('resolve');
    try {
      await alertsApi.resolve(alert._id);
      onAction(alert._id, 'resolved');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action failed.');
      setLoading(null);
    }
  };

  const handleDismiss = async () => {
    setError('');
    setLoading('dismiss');
    try {
      await alertsApi.dismiss(alert._id);
      onAction(alert._id, 'dismissed');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action failed.');
      setLoading(null);
    }
  };

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 border-l-4 ${borderColour} px-4 py-3 space-y-2`}
    >
      {/* Top row: icon + message + badge */}
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0 mt-0.5" aria-hidden="true">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 leading-snug">{alert.message}</p>
          {doc?.title && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{doc.title}</p>
          )}
        </div>
        {badgeText && (
          <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColour}`}>
            {badgeText}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{error}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-0.5">
        {/* Primary: view the document */}
        {doc?._id && (
          <a
            href={`${apiBase}/documents/${doc._id}/file`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-medium transition-colors"
          >
            View document
          </a>
        )}

        {/* Resolve — "Done, I've renewed it" */}
        <button
          onClick={handleResolve}
          disabled={loading !== null}
          className="flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium transition-colors disabled:opacity-50"
          aria-label="Mark as resolved"
        >
          {loading === 'resolve' ? <Spinner size="sm" /> : '✓'}
          Done
        </button>

        {/* Dismiss — "I know, don't remind me again" */}
        <button
          onClick={handleDismiss}
          disabled={loading !== null}
          className="py-1.5 px-3 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 text-xs font-medium transition-colors disabled:opacity-50"
          aria-label="Dismiss this alert"
        >
          {loading === 'dismiss' ? <Spinner size="sm" /> : '✕'}
        </button>
      </div>
    </div>
  );
}
