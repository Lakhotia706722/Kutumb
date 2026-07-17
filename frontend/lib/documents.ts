import api from './api';

export const CATEGORIES = [
  'Property',
  'Insurance',
  'Investments',
  'Vehicles',
  'Government IDs',
  'Legal',
  'Education',
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface DocumentFile {
  driver: 'local' | 's3';
  originalName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
}

export interface Document {
  _id: string;
  family: string;
  uploadedBy: { _id: string; name: string } | string;
  category: Category;
  title: string;
  issueDate: string | null;
  expiryDate: string | null;
  renewalRequired: boolean;
  notes: string;
  file: DocumentFile;
  fileUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DocumentsByCategory = Record<Category, Document[]>;

export interface ListResponse {
  documents: DocumentsByCategory;
  total: number;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

export const documentsApi = {
  list: () => api.get<ListResponse>('/documents'),

  get: (id: string) => api.get<{ document: Document }>(`/documents/${id}`),

  create: (data: FormData) =>
    api.post<{ message: string; document: Document }>('/documents', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (
    id: string,
    data: Partial<Pick<Document, 'category' | 'title' | 'issueDate' | 'expiryDate' | 'renewalRequired' | 'notes'>>
  ) => api.patch<{ message: string; document: Document }>(`/documents/${id}`, data),

  delete: (id: string) => api.delete<{ message: string }>(`/documents/${id}`),

  fileUrl: (id: string) =>
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/documents/${id}/file`,
};

// ─── Formatting helpers ───────────────────────────────────────────────────────

export const CATEGORY_ICONS: Record<Category, string> = {
  Property: '🏠',
  Insurance: '🛡️',
  Investments: '📈',
  Vehicles: '🚗',
  'Government IDs': '🪪',
  Legal: '⚖️',
  Education: '🎓',
};

export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const daysUntilExpiry = (dateStr: string | null | undefined): number | null => {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const expiryStatus = (
  dateStr: string | null | undefined
): 'expired' | 'critical' | 'warning' | 'ok' | 'none' => {
  const days = daysUntilExpiry(dateStr);
  if (days === null) return 'none';
  if (days < 0) return 'expired';
  if (days <= 7) return 'critical';
  if (days <= 30) return 'warning';
  return 'ok';
};

export const expiryBadge = (
  dateStr: string | null | undefined
): { label: string; className: string } | null => {
  const days = daysUntilExpiry(dateStr);
  if (days === null) return null;
  if (days < 0)
    return { label: 'Expired', className: 'bg-red-100 text-red-700' };
  if (days === 0)
    return { label: 'Expires today', className: 'bg-red-100 text-red-700' };
  if (days <= 7)
    return { label: `${days}d left`, className: 'bg-red-100 text-red-700' };
  if (days <= 30)
    return { label: `${days}d left`, className: 'bg-amber-100 text-amber-700' };
  if (days <= 90)
    return { label: `${days}d left`, className: 'bg-yellow-50 text-yellow-700' };
  return null; // no badge needed for far-future dates
};
