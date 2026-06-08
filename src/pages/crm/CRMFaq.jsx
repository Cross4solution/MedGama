import React, { useState, useEffect, useCallback } from 'react';
import {
  HelpCircle, Plus, Search, ChevronDown, ChevronUp, X,
  Loader2, Edit3, Trash2, GripVertical, Eye, EyeOff, MessageCircleQuestion,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { doctorProfileAPI } from '../../lib/api';

// ─── FAQ Editor Modal ────────────────────────────────────────
const FaqEditorModal = ({ faq, onClose, onSaved, t }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    question: faq?.question || '',
    answer: faq?.answer || '',
    is_active: faq?.is_active ?? true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) return;
    setLoading(true);
    try {
      if (faq?.id) {
        await doctorProfileAPI.updateFaq(faq.id, form);
      } else {
        await doctorProfileAPI.createFaq(form);
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error('FAQ save error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">
            {faq?.id ? t('crm.faq.edit', 'Edit FAQ') : t('crm.faq.add', 'Add FAQ')}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('crm.faq.question', 'Question')}</label>
            <input
              type="text"
              value={form.question}
              onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
              placeholder={t('crm.faq.questionPlaceholder', 'e.g. What should I expect during a consultation?')}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('crm.faq.answer', 'Answer')}</label>
            <textarea
              value={form.answer}
              onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
              rows={5}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none transition-all"
              placeholder={t('crm.faq.answerPlaceholder', 'Provide a detailed answer for your patients...')}
              required
            />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
            />
            <span className="text-xs font-medium text-gray-700">{t('crm.faq.visible', 'Visible on public profile')}</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
              {t('common.cancel', 'Cancel')}
            </button>
            <button type="submit" disabled={loading}
              className="px-5 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('common.save', 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────
const CRMFaq = () => {
  const { t } = useTranslation();

  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingFaq, setEditingFaq] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await doctorProfileAPI.getFaqs();
      const d = res?.data?.data || res?.data || [];
      setFaqs(Array.isArray(d) ? d : []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFaqs(); }, [fetchFaqs]);

  const filtered = faqs.filter(f => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return f.question?.toLowerCase().includes(q) || f.answer?.toLowerCase().includes(q);
  });

  const handleDelete = async (id) => {
    if (!window.confirm(t('crm.faq.confirmDelete', 'Delete this FAQ?'))) return;
    try {
      await doctorProfileAPI.deleteFaq(id);
      fetchFaqs();
    } catch (err) { console.error(err); }
  };

  const handleToggleActive = async (faq) => {
    try {
      await doctorProfileAPI.updateFaq(faq.id, { is_active: !faq.is_active });
      fetchFaqs();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {t('crm.faq.title', 'Frequently Asked Questions')}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('crm.faq.subtitle', 'Help your patients find quick answers to common questions')}
          </p>
        </div>
        <button
          onClick={() => { setEditingFaq(null); setShowEditor(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {t('crm.faq.add', 'Add FAQ')}
        </button>
      </div>

      {/* Search */}
      {faqs.length > 0 && (
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3.5 py-2 max-w-md">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('crm.faq.search', 'Search FAQs...')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm text-gray-700 placeholder:text-gray-400 outline-none w-full"
          />
        </div>
      )}

      {/* FAQ List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-7 h-7 text-teal-500 animate-spin" />
        </div>
      ) : faqs.length === 0 ? (
        /* ── Empty State ── */
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center mb-5">
            <MessageCircleQuestion className="w-10 h-10 text-teal-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1.5">
            {t('crm.faq.emptyTitle', 'No FAQs yet')}
          </h3>
          <p className="text-sm text-gray-500 mb-6 text-center max-w-sm">
            {t('crm.faq.emptyDesc', 'Add frequently asked questions to help patients learn about your practice before booking.')}
          </p>
          <button
            onClick={() => { setEditingFaq(null); setShowEditor(true); }}
            className="inline-flex items-center gap-2 px-5 py-3 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            {t('crm.faq.addFirst', 'Add Your First FAQ')}
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-200/60">
          <Search className="w-10 h-10 mb-3 text-gray-300" />
          <p className="text-sm font-medium">{t('crm.faq.noMatch', 'No FAQs match your search')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(faq => (
            <div key={faq.id} className={`border rounded-xl overflow-hidden transition-all ${faq.is_active ? 'border-gray-200/60 hover:shadow-sm' : 'border-gray-200/40 opacity-60'}`}>
              <button
                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                className="w-full text-left px-5 py-4 flex items-center gap-3 bg-white hover:bg-gray-50/50 transition-colors"
              >
                <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-4 h-4 text-teal-600" />
                </div>
                <span className="flex-1 text-sm font-semibold text-gray-900">{faq.question}</span>
                {!faq.is_active && (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full mr-1">
                    {t('crm.faq.hidden', 'Hidden')}
                  </span>
                )}
                {openId === faq.id
                  ? <ChevronUp className="w-4 h-4 text-gray-400" />
                  : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {openId === faq.id && (
                <div className="px-5 pb-4 pt-0 bg-gray-50/30 border-t border-gray-100">
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap pl-[3.25rem]">{faq.answer}</p>
                  <div className="flex items-center gap-2 pl-[3.25rem] mt-3">
                    <button
                      onClick={() => { setEditingFaq(faq); setShowEditor(true); }}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      <Edit3 className="w-3 h-3" /> {t('common.edit', 'Edit')}
                    </button>
                    <button
                      onClick={() => handleToggleActive(faq)}
                      className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
                    >
                      {faq.is_active
                        ? <><EyeOff className="w-3 h-3" /> {t('crm.faq.hide', 'Hide')}</>
                        : <><Eye className="w-3 h-3" /> {t('crm.faq.show', 'Show')}</>}
                    </button>
                    <button
                      onClick={() => handleDelete(faq.id)}
                      className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> {t('common.delete', 'Delete')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <FaqEditorModal
          faq={editingFaq}
          onClose={() => { setShowEditor(false); setEditingFaq(null); }}
          onSaved={fetchFaqs}
          t={t}
        />
      )}
    </div>
  );
};

export default CRMFaq;
