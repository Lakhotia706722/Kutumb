'use client';

import { useState } from 'react';
import { ScoreResult, ScoreBreakdownItem, scoreColour, scoreRingColour, scoreBand } from '@/lib/score';
import Link from 'next/link';

interface Props {
  result: ScoreResult;
}

export default function ScoreWidget({ result }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { score, topHint, topHintPoints, breakdown, meta } = result;

  // SVG circular progress ring
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      {/* Top row: ring + score + label + hint */}
      <div className="flex items-center gap-4">
        {/* Circular ring */}
        <div className="shrink-0">
          <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden="true">
            {/* Track */}
            <circle
              cx="44" cy="44" r={radius}
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="8"
            />
            {/* Progress */}
            <circle
              cx="44" cy="44" r={radius}
              fill="none"
              className={scoreRingColour(score)}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={progress}
              transform="rotate(-90 44 44)"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
            {/* Score number */}
            <text
              x="44" y="44"
              textAnchor="middle"
              dominantBaseline="central"
              className={`text-xl font-bold fill-current ${scoreColour(score)}`}
              style={{ fontSize: '20px', fontWeight: 700 }}
              fill="currentColor"
            >
              {score}
            </text>
          </svg>
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-gray-900">
              Inheritance Readiness
            </h2>
            <span className={`text-xs font-medium ${scoreColour(score)}`}>
              {scoreBand(score)}
            </span>
          </div>

          {/* Top hint — the single most impactful action */}
          {topHint ? (
            <p className="text-xs text-gray-600 mt-1 leading-snug">
              <span className="font-medium text-orange-600">+{topHintPoints} pts: </span>
              {topHint}
            </p>
          ) : (
            <p className="text-xs text-green-600 mt-1 font-medium">
              Your vault is in great shape 🎉
            </p>
          )}

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(e => !e)}
            className="mt-2 text-xs text-gray-400 hover:text-orange-600 transition-colors"
          >
            {expanded ? 'Hide breakdown ↑' : 'See breakdown ↓'}
          </button>
        </div>
      </div>

      {/* Breakdown — expandable */}
      {expanded && (
        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          {groupByPillar(breakdown).map(({ pillar, items }) => (
            <div key={pillar}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                {pillar}
              </p>
              <div className="space-y-1.5">
                {items.map((item) => (
                  <BreakdownRow key={item.label} item={item} />
                ))}
              </div>
            </div>
          ))}

          {/* Quick stats footer */}
          <div className="flex gap-4 pt-2 border-t border-gray-100 text-xs text-gray-400">
            <span>{meta.totalDocuments} document{meta.totalDocuments !== 1 ? 's' : ''}</span>
            <span>{meta.memberCount} member{meta.memberCount !== 1 ? 's' : ''}</span>
            {meta.expiredCount > 0 && (
              <span className="text-red-500">{meta.expiredCount} expired</span>
            )}
            {meta.criticalCount > 0 && (
              <span className="text-amber-600">{meta.criticalCount} expiring soon</span>
            )}
          </div>
          <Link
            href="/vault"
            className="block text-center text-xs font-medium text-orange-600 hover:underline pt-1"
          >
            Open Vault to improve your score →
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BreakdownRow({ item }: { item: ScoreBreakdownItem }) {
  const pct = item.max > 0 ? (item.earned / item.max) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      {/* Tick / cross */}
      <span className={`text-xs shrink-0 w-4 text-center ${item.done ? 'text-green-500' : 'text-gray-300'}`}>
        {item.done ? '✓' : '○'}
      </span>

      {/* Label */}
      <span className={`text-xs flex-1 leading-snug ${item.done ? 'text-gray-600' : 'text-gray-500'}`}>
        {item.label}
      </span>

      {/* Points */}
      <span className={`text-xs font-medium shrink-0 tabular-nums ${item.done ? 'text-green-600' : 'text-gray-300'}`}>
        {item.earned}/{item.max}
      </span>

      {/* Mini bar */}
      <div className="w-12 h-1.5 bg-gray-100 rounded-full shrink-0 overflow-hidden">
        <div
          className={`h-full rounded-full ${item.done ? 'bg-green-400' : pct > 0 ? 'bg-amber-400' : 'bg-gray-200'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// Groups breakdown items by pillar, preserving insertion order
function groupByPillar(items: ScoreBreakdownItem[]) {
  const map = new Map<string, ScoreBreakdownItem[]>();
  for (const item of items) {
    if (!map.has(item.pillar)) map.set(item.pillar, []);
    map.get(item.pillar)!.push(item);
  }
  return Array.from(map.entries()).map(([pillar, items]) => ({ pillar, items }));
}
