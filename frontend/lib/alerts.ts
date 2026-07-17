import api from './api';
import { Document } from './documents';

export type AlertStatus = 'pending' | 'resolved' | 'dismissed';

export interface Alert {
  _id: string;
  family: string;
  document: Pick<Document, '_id' | 'title' | 'category' | 'expiryDate'> | string;
  message: string;
  triggerDate: string;
  daysBeforeExpiry: number;
  status: AlertStatus;
  resolvedAt: string | null;
  createdAt: string;
}

export interface AlertsResponse {
  alerts: Alert[];
  total: number;
}

export const alertsApi = {
  list: () => api.get<AlertsResponse>('/alerts'),
  resolve: (id: string) => api.patch<{ message: string; alert: Alert }>(`/alerts/${id}/resolve`),
  dismiss: (id: string) => api.patch<{ message: string; alert: Alert }>(`/alerts/${id}/dismiss`),
  sweep: () => api.post<{ message: string; summary: Record<string, number> }>('/alerts/sweep'),
};

// ── Feed bucketing ────────────────────────────────────────────────────────────

export type FeedBucket = 'this-week' | 'this-month' | 'upcoming' | 'overdue';

export interface BucketedAlerts {
  overdue: Alert[];       // triggerDate in the past (or expiryDate already passed)
  thisWeek: Alert[];      // trigger date within 0–7 days from today
  thisMonth: Alert[];     // trigger date 8–30 days from today
  upcoming: Alert[];      // trigger date 31–90 days from today
}

/**
 * Splits a flat list of pending alerts into the three Feed sections.
 * Alerts are bucketed based on how many days until the EXPIRY DATE (not triggerDate),
 * so the card always reads "X days until expiry" which is what matters to the user.
 * 
 * Within each bucket, alerts are sorted by urgency (daysBeforeExpiry ascending):
 * most urgent (smallest daysBeforeExpiry) first.
 */
export const bucketAlerts = (alerts: Alert[]): BucketedAlerts => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result: BucketedAlerts = { overdue: [], thisWeek: [], thisMonth: [], upcoming: [] };

  for (const alert of alerts) {
    const doc = typeof alert.document === 'object' ? alert.document : null;
    const expiryDateStr = doc?.expiryDate ?? null;

    let daysToExpiry: number;
    if (expiryDateStr) {
      daysToExpiry = Math.ceil(
        (new Date(expiryDateStr).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
    } else {
      // No expiry on the document — fall back to days until triggerDate
      daysToExpiry = Math.ceil(
        (new Date(alert.triggerDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    if (daysToExpiry < 0) {
      result.overdue.push(alert);
    } else if (daysToExpiry <= 7) {
      result.thisWeek.push(alert);
    } else if (daysToExpiry <= 30) {
      result.thisMonth.push(alert);
    } else if (daysToExpiry <= 90) {
      result.upcoming.push(alert);
    }
    // Alerts with daysToExpiry > 90 are not shown on the feed — too far out
  }

  // Sort within each bucket by daysBeforeExpiry (ascending) — most urgent first
  const sortByUrgency = (a: Alert, b: Alert) => a.daysBeforeExpiry - b.daysBeforeExpiry;
  result.overdue.sort(sortByUrgency);
  result.thisWeek.sort(sortByUrgency);
  result.thisMonth.sort(sortByUrgency);
  result.upcoming.sort(sortByUrgency);

  return result;
};
