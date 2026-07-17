'use client';

import { Document as Doc, CATEGORY_ICONS, formatDate, expiryBadge, documentsApi } from '@/lib/documents';
import { useAuth } from '@/context/AuthContext';

interface Props {
  document: Doc;
  onEdit: () => void;
  onDelete: () => void;
}

export default function DocumentDetail({ document: doc, onEdit, onDelete }: Props) {
  const { user, role } = useAuth();

  const uploaderName =
    typeof doc.uploadedBy === 'object' ? doc.uploadedBy.name : 'Unknown';
  const uploaderId =
    typeof doc.uploadedBy === 'object' ? doc.uploadedBy._id : doc.uploadedBy;

  const canDelete = role === 'owner' || uploaderId === user?._id;
  const badge = expiryBadge(doc.expiryDate);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const fileViewUrl = `${apiBase}/documents/${doc._id}/file`;

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</span>
      <span className="text-sm text-gray-800 text-right max-w-[60%]">{value}</span>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Title + category */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{CATEGORY_ICONS[doc.category]}</span>
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {doc.category}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 leading-snug">{doc.title}</h3>
        {badge && (
          <span className={`inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
            {badge.label}
          </span>
        )}
      </div>

      {/* Detail rows */}
      <div className="bg-gray-50 rounded-xl px-4">
        {row('Issue date', formatDate(doc.issueDate))}
        {row('Expiry date', formatDate(doc.expiryDate))}
        {row('Renewal required', doc.renewalRequired ? 'Yes' : 'No')}
        {row('Added by', uploaderName)}
        {row('Added on', formatDate(doc.createdAt))}
      </div>

      {/* Notes */}
      {doc.notes && (
        <div className="bg-gray-50 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Notes</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{doc.notes}</p>
        </div>
      )}

      {/* File */}
      {doc.fileUrl && (
        <a
          href={fileViewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-orange-600 font-medium hover:underline"
        >
          <span>📄</span>
          {doc.file?.originalName || 'View file'}
          {doc.file?.sizeBytes && (
            <span className="text-gray-400 font-normal">
              ({(doc.file.sizeBytes / 1024).toFixed(0)} KB)
            </span>
          )}
        </a>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={onEdit}
          className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Edit details
        </button>
        {canDelete && (
          <button
            onClick={onDelete}
            className="py-2.5 px-4 rounded-lg border border-red-100 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
