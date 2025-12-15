import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Flag, LogIn } from 'lucide-react';
import Modal from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function ReportReviewModal({ open, onClose, review }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useToast();

  const displayName = useMemo(() => {
    if (!review) return '';
    return review.user || review.name || 'User';
  }, [review]);

  const displayDate = useMemo(() => {
    if (!review) return '';
    return review.date || '';
  }, [review]);

  const displayText = useMemo(() => {
    if (!review) return '';
    return review.text || review.comment || '';
  }, [review]);

  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (!open) return;
    setReason('');
    setDetails('');
  }, [open, review]);

  const canSubmit = !!user && !!reason;

  const handleSubmit = () => {
    if (!user) {
      notify({ type: 'error', message: 'You must be logged in to submit a report.' });
      return;
    }
    if (!reason) {
      notify({ type: 'error', message: 'Please select a reason.' });
      return;
    }

    notify({ type: 'success', message: 'Report submitted. Thank you.' });
    onClose();
  };

  const footer = (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 text-sm"
        onClick={onClose}
      >
        Cancel
      </button>
      <button
        type="button"
        className="px-3 py-1.5 rounded-lg bg-[#1C6A83] text-white text-sm hover:bg-[#0F4A5C] disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        Submit
      </button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          <Flag className="w-4 h-4 text-[#1C6A83]" />
          Reports
        </span>
      }
      footer={footer}
    >
      <div className="space-y-3">
        <div className="rounded-lg border bg-gray-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{displayName}</div>
              <div className="text-xs text-gray-500">{displayDate}</div>
            </div>
          </div>
          {displayText && <div className="mt-2 text-sm text-gray-700">{displayText}</div>}
        </div>

        {!user && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="text-sm font-medium text-amber-900">Login required</div>
            <div className="text-sm text-amber-800 mt-1">You must be logged in to report a review.</div>
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  notify({ type: 'info', message: 'Redirecting to login…' });
                  onClose();
                  navigate('/login');
                }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border hover:bg-amber-100 text-sm"
              >
                <LogIn className="w-4 h-4" /> Login
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Reason</label>
          <div className="relative">
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-10 pl-3 pr-10 border rounded-lg text-sm bg-white appearance-none focus:outline-none focus:ring-4 focus:ring-[#1C6A83]/15 focus:border-[#1C6A83]/40 disabled:bg-gray-50 disabled:text-gray-400"
              disabled={!user}
            >
              <option value="">Select…</option>
              <option value="spam">Spam</option>
              <option value="fake">Fake / misleading</option>
              <option value="hate">Hate speech</option>
              <option value="harassment">Harassment / bullying</option>
              <option value="privacy">Shares personal information</option>
              <option value="other">Other</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Details (optional)</label>
          <textarea
            rows={4}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Briefly describe…"
            className="w-full px-3 py-2 border rounded-lg text-sm resize-y focus:outline-none focus:ring-4 focus:ring-[#1C6A83]/15 focus:border-[#1C6A83]/40"
            disabled={!user}
          />
        </div>
      </div>
    </Modal>
  );
}
