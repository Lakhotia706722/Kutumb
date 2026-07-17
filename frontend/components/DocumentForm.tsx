'use client';

import { useState, useRef } from 'react';
import { CATEGORIES, Category, Document as Doc, documentsApi } from '@/lib/documents';
import Spinner from './Spinner';

interface Props {
  /** Pass an existing document to edit; omit for "add" mode */
  document?: Doc;
  onSuccess: (doc: Doc) => void;
  onCancel: () => void;
}

interface FieldErrors {
  [key: string]: string;
}

export default function DocumentForm({ document, onSuccess, onCancel }: Props) {
  const isEdit = Boolean(document);

  const [category, setCategory] = useState<Category>(document?.category ?? 'Insurance');
  const [title, setTitle] = useState(document?.title ?? '');
  const [issueDate, setIssueDate] = useState(document?.issueDate?.slice(0, 10) ?? '');
  const [expiryDate, setExpiryDate] = useState(document?.expiryDate?.slice(0, 10) ?? '');
  const [renewalRequired, setRenewalRequired] = useState(document?.renewalRequired ?? false);
  const [notes, setNotes] = useState(document?.notes ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const validate = (): { valid: boolean; fieldErrors?: FieldErrors; message?: string } => {
    const errors: FieldErrors = {};

    if (!title.trim()) {
      errors.title = 'Please enter a document title.';
    }
    
    if (!isEdit && !file) {
      errors.file = 'Please select a file to upload (PDF, JPG, or PNG).';
    }
    
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        errors.file = `File is too large (${Math.round(file.size / 1024 / 1024)} MB). Maximum size is 20 MB.`;
      } else if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
        errors.file = `Invalid file type: ${file.type || 'unknown'}. Only PDF, JPG, and PNG are supported.`;
      }
    }
    
    if (issueDate && expiryDate && new Date(issueDate) > new Date(expiryDate)) {
      errors.expiryDate = 'Expiry date cannot be before issue date.';
    }

    if (Object.keys(errors).length > 0) {
      return { valid: false, fieldErrors: errors };
    }
    
    return { valid: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    
    const validation = validate();
    if (!validation.valid) {
      setFieldErrors(validation.fieldErrors || {});
      if (validation.fieldErrors?.title) setError(validation.fieldErrors.title);
      else if (validation.fieldErrors?.file) setError(validation.fieldErrors.file);
      else if (validation.fieldErrors?.expiryDate) setError(validation.fieldErrors.expiryDate);
      return;
    }

    setLoading(true);
    try {
      if (isEdit && document) {
        // Metadata-only update
        const res = await documentsApi.update(document._id, {
          category,
          title: title.trim(),
          issueDate: issueDate || undefined,
          expiryDate: expiryDate || undefined,
          renewalRequired,
          notes,
        });
        onSuccess(res.data.document);
      } else {
        // New document — multipart upload
        const formData = new FormData();
        formData.append('category', category);
        formData.append('title', title.trim());
        if (issueDate) formData.append('issueDate', issueDate);
        if (expiryDate) formData.append('expiryDate', expiryDate);
        formData.append('renewalRequired', String(renewalRequired));
        formData.append('notes', notes);
        if (file) formData.append('file', file);
        const res = await documentsApi.create(formData);
        onSuccess(res.data.document);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
      // If it's a file-related error, highlight the file field
      if (message.toLowerCase().includes('file')) {
        setFieldErrors(prev => ({ ...prev, file: message }));
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (fieldName?: string): string => {
    const base = 'w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent';
    const hasError = fieldErrors[fieldName || ''];
    return hasError
      ? `${base} border-red-300 focus:ring-red-400`
      : `${base} border-gray-300 focus:ring-orange-400`;
  };
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Category */}
      <div>
        <label htmlFor="doc-category" className={labelClass}>Category</label>
        <select
          id="doc-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className={inputClass()}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="doc-title" className={labelClass}>Title</label>
        <input
          id="doc-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass('title')}
          placeholder="e.g. Car Insurance – Maruti Swift 2024"
          aria-required="true"
        />
        {fieldErrors.title && (
          <p className="text-xs text-red-600 mt-1">{fieldErrors.title}</p>
        )}
      </div>

      {/* Issue date + expiry date — stacked on very small screens, side-by-side on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="doc-issue" className={labelClass}>Issue date <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            id="doc-issue"
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            className={inputClass('issueDate')}
          />
        </div>
        <div>
          <label htmlFor="doc-expiry" className={labelClass}>Expiry date <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            id="doc-expiry"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className={inputClass('expiryDate')}
          />
          {fieldErrors.expiryDate && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.expiryDate}</p>
          )}
        </div>
      </div>

      {/* Renewal required checkbox */}
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={renewalRequired}
          onChange={(e) => setRenewalRequired(e.target.checked)}
          className="rounded border-gray-300 text-orange-500 focus:ring-orange-400 h-4 w-4"
        />
        <span className="text-sm text-gray-700">Renewal required on expiry</span>
      </label>

      {/* Notes */}
      <div>
        <label htmlFor="doc-notes" className={labelClass}>Notes <span className="text-gray-400 font-normal">(optional)</span></label>
        <textarea
          id="doc-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className={inputClass()}
          placeholder="Policy number, insurer contact, etc."
        />
      </div>

      {/* File upload — only shown on add */}
      {!isEdit && (
        <div>
          <label className={labelClass}>File <span className="text-gray-400 font-normal">(PDF, JPG, PNG — max 20 MB)</span></label>
          <div
            onClick={() => fileRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
              fieldErrors.file
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200 hover:border-orange-300'
            }`}
          >
            {file ? (
              <p className="text-sm text-gray-700 font-medium truncate">{file.name}</p>
            ) : (
              <p className="text-sm text-gray-400">Tap to select a file</p>
            )}
          </div>
          {fieldErrors.file && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.file}</p>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setFieldErrors(prev => ({ ...prev, file: '' }));
            }}
          />
        </div>
      )}

      {isEdit && (
        <p className="text-xs text-gray-400">
          To replace the file, delete this document and re-add it with the new file.
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
        >
          {loading && <Spinner size="sm" />}
          {loading
            ? isEdit ? 'Saving…' : 'Uploading…'
            : isEdit ? 'Save changes' : 'Add document'}
        </button>
      </div>
    </form>
  );
}
