'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  CATEGORIES,
  Category,
  Document as Doc,
  DocumentsByCategory,
  documentsApi,
  CATEGORY_ICONS,
  expiryBadge,
  formatDate,
} from '@/lib/documents';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import DocumentForm from '@/components/DocumentForm';
import DocumentDetail from '@/components/DocumentDetail';
import SkeletonCard from '@/components/SkeletonCard';
import Spinner from '@/components/Spinner';

type ModalState =
  | { type: 'none' }
  | { type: 'add' }
  | { type: 'view'; doc: Doc }
  | { type: 'edit'; doc: Doc };

export default function VaultPage() {
  const [byCategory, setByCategory] = useState<DocumentsByCategory | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const [deleteTarget, setDeleteTarget] = useState<Doc | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await documentsApi.list();
      setByCategory(res.data.documents);
      setTotal(res.data.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not load documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const closeModal = () => setModal({ type: 'none' });

  const handleAdded = (doc: Doc) => {
    setByCategory((prev) => {
      if (!prev) return prev;
      return { ...prev, [doc.category]: [doc, ...prev[doc.category]] };
    });
    setTotal((t) => t + 1);
    closeModal();
  };

  const handleUpdated = (doc: Doc) => {
    setByCategory((prev) => {
      if (!prev) return prev;
      // The category might have changed, so rebuild carefully
      const next = { ...prev };
      for (const cat of CATEGORIES) {
        next[cat] = next[cat].filter((d) => d._id !== doc._id);
      }
      next[doc.category] = [doc, ...next[doc.category]];
      return next;
    });
    setModal({ type: 'view', doc });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await documentsApi.delete(deleteTarget._id);
      setByCategory((prev) => {
        if (!prev) return prev;
        const next = { ...prev };
        next[deleteTarget.category] = next[deleteTarget.category].filter(
          (d) => d._id !== deleteTarget._id
        );
        return next;
      });
      setTotal((t) => t - 1);
      closeModal();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-9 w-16 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Document Vault</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {total === 0 ? 'No documents yet' : `${total} document${total === 1 ? '' : 's'}`}
          </p>
        </div>
        <button
          onClick={() => setModal({ type: 'add' })}
          className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <span>+</span> Add
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button onClick={load} className="shrink-0 text-xs font-medium underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      {/* Category sections */}
      {total === 0 ? (
        <EmptyVault onAdd={() => setModal({ type: 'add' })} />
      ) : (
        CATEGORIES.map((cat) => {
          const docs = byCategory?.[cat] ?? [];
          if (docs.length === 0) return null;
          return (
            <CategorySection
              key={cat}
              category={cat}
              documents={docs}
              onView={(doc) => setModal({ type: 'view', doc })}
            />
          );
        })
      )}

      {/* Add document modal */}
      <Modal
        open={modal.type === 'add'}
        onClose={closeModal}
        title="Add document"
      >
        <DocumentForm onSuccess={handleAdded} onCancel={closeModal} />
      </Modal>

      {/* View document modal */}
      <Modal
        open={modal.type === 'view'}
        onClose={closeModal}
        title="Document details"
      >
        {modal.type === 'view' && (
          <DocumentDetail
            document={modal.doc}
            onEdit={() => setModal({ type: 'edit', doc: modal.doc })}
            onDelete={() => { setDeleteTarget(modal.doc); }}
          />
        )}
      </Modal>

      {/* Edit document modal */}
      <Modal
        open={modal.type === 'edit'}
        onClose={closeModal}
        title="Edit document"
      >
        {modal.type === 'edit' && (
          <DocumentForm
            document={modal.doc}
            onSuccess={handleUpdated}
            onCancel={() => setModal({ type: 'view', doc: modal.doc })}
          />
        )}
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete document?"
        message={`"${deleteTarget?.title}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CategorySection({
  category,
  documents,
  onView,
}: {
  category: Category;
  documents: Doc[];
  onView: (doc: Doc) => void;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{CATEGORY_ICONS[category]}</span>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {category}
        </h2>
        <span className="text-xs text-gray-400">({documents.length})</span>
      </div>
      <div className="space-y-2">
        {documents.map((doc) => (
          <DocumentCard key={doc._id} doc={doc} onClick={() => onView(doc)} />
        ))}
      </div>
    </section>
  );
}

function DocumentCard({ doc, onClick }: { doc: Doc; onClick: () => void }) {
  const badge = expiryBadge(doc.expiryDate);

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-orange-300 hover:shadow-sm transition-all flex items-center justify-between gap-3"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
        {doc.expiryDate && (
          <p className="text-xs text-gray-400 mt-0.5">
            Expires {formatDate(doc.expiryDate)}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {badge && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
            {badge.label}
          </span>
        )}
        {doc.fileUrl && <span className="text-gray-300">📎</span>}
        <span className="text-gray-300 text-sm">›</span>
      </div>
    </button>
  );
}

function EmptyVault({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4">🗄️</span>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Your vault is empty</h3>
      <p className="text-sm text-gray-500 max-w-xs mb-6">
        Add your family&apos;s important documents — insurance policies, property
        papers, passports — to keep them organised and never miss a renewal.
      </p>
      <button
        onClick={onAdd}
        className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
      >
        Add your first document
      </button>
    </div>
  );
}
