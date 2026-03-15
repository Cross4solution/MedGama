import React, { useState, useEffect, useCallback } from 'react';
import {
  HelpCircle, Plus, Search, ChevronDown, ChevronUp, X,
  Loader2, Edit3, Trash2, Check, BookOpen, Globe,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { faqAPI } from '../../lib/api';

// ─── FAQ Accordion Item ──────────────────────────────────────
const FaqItem = ({ faq, isOpen, onToggle, isAdmin, onEdit, onDelete, lang }) => {
  const question = faq.question?.[lang] || faq.question?.en || '';
  const answer = faq.answer?.[lang] || faq.answer?.en || '';

  return (
    <div className="border border-gray-200/60 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
      <button onClick={onToggle} className="w-full text-left px-5 py-4 flex items-center gap-3 bg-white hover:bg-gray-50/50 transition-colors">
        <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
          <HelpCircle className="w-4 h-4 text-teal-600" />
        </div>
        <span className="flex-1 text-sm font-semibold text-gray-900">{question}</span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {isOpen && (
        <div className="px-5 pb-4 pt-0 bg-gray-50/30 border-t border-gray-100">
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap pl-11">{answer}</p>
          {isAdmin && (
            <div className="flex items-center gap-2 pl-11 mt-3">
              <button onClick={() => onEdit(faq)} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                <Edit3 className="w-3 h-3" /> Edit
              </button>
              <button onClick={() => onDelete(faq.id)} className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium">
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── FAQ Editor Modal ────────────────────────────────────────
const FaqEditorModal = ({ faq, onClose, onSaved, t }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    question_en: faq?.question?.en || '',
    question_tr: faq?.question?.tr || '',
    answer_en: faq?.answer?.en || '',
    answer_tr: faq?.answer?.tr || '',
    category: faq?.category || '',
    sort_order: faq?.sort_order || 0,
    is_published: faq?.is_published ?? true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.question_en.trim() || !form.answer_en.trim()) return;
    setLoading(true);
    try {
      const payload = {
        question: { en: form.question_en, tr: form.question_tr || form.question_en },
        answer: { en: form.answer_en, tr: form.answer_tr || form.answer_en },
        category: form.category || null,
        sort_order: parseInt(form.sort_order) || 0,
        is_published: form.is_published,
      };
      if (faq?.id) {
        await faqAPI.update(faq.id, payload);
      } else {
        await faqAPI.create(payload);
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
          <h2 className="text-base font-bold text-gray-900">{faq?.id ? t('crm.support.editFaq', 'Edit FAQ') : t('crm.support.addFaq', 'Add FAQ')}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* EN */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500"><Globe className="w-3 h-3" /> English</div>
            <input type="text" value={form.question_en} onChange={e => setForm(f => ({ ...f, question_en: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
              placeholder="Question (EN)" required />
            <textarea value={form.answer_en} onChange={e => setForm(f => ({ ...f, answer_en: e.target.value }))} rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none"
              placeholder="Answer (EN)" required />
          </div>
          {/* TR */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500"><Globe className="w-3 h-3" /> Türkçe</div>
            <input type="text" value={form.question_tr} onChange={e => setForm(f => ({ ...f, question_tr: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
              placeholder="Soru (TR)" />
            <textarea value={form.answer_tr} onChange={e => setForm(f => ({ ...f, answer_tr: e.target.value }))} rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none resize-none"
              placeholder="Cevap (TR)" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{t('crm.support.faqCategory', 'Category')}</label>
              <input type="text" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="General, Billing, ..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{t('crm.support.sortOrder', 'Sort Order')}</label>
              <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
              className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500" />
            <span className="text-xs font-medium text-gray-700">{t('crm.support.published', 'Published')}</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">{t('common.cancel', 'Cancel')}</button>
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
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'superAdmin' || user?.role_id === 'superAdmin' || user?.role === 'saasAdmin' || user?.role_id === 'saasAdmin';
  const lang = i18n.language || 'en';

  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editingFaq, setEditingFaq] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const res = isAdmin ? await faqAPI.adminList() : await faqAPI.list();
      const d = res?.data || res;
      setFaqs(Array.isArray(d) ? d : []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [isAdmin]);

  useEffect(() => { fetchFaqs(); }, [fetchFaqs]);

  const categories = [...new Set(faqs.map(f => f.category).filter(Boolean))];

  const filtered = faqs.filter(f => {
    if (categoryFilter && f.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const qText = (f.question?.[lang] || f.question?.en || '').toLowerCase();
      const aText = (f.answer?.[lang] || f.answer?.en || '').toLowerCase();
      if (!qText.includes(q) && !aText.includes(q)) return false;
    }
    return true;
  });

  const handleDelete = async (id) => {
    if (!window.confirm(t('crm.support.confirmDeleteFaq', 'Delete this FAQ?'))) return;
    try {
      await faqAPI.delete(id);
      fetchFaqs();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('crm.support.faqTitle', 'Frequently Asked Questions')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('crm.support.faqSubtitle', 'Find answers to common questions')}</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setEditingFaq(null); setShowEditor(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            {t('crm.support.addFaq', 'Add FAQ')}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1.5 flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-gray-400" />
          <input type="text" placeholder={t('crm.support.searchFaq', 'Search FAQs...')} value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-gray-700 placeholder:text-gray-400 outline-none w-full" />
        </div>
        {categories.length > 0 && (
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600">
            <option value="">{t('crm.support.allCategories', 'All Categories')}</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* FAQ List */}
      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="w-7 h-7 text-teal-500 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-200/60">
          <BookOpen className="w-12 h-12 mb-3 text-gray-300" />
          <p className="text-sm font-medium">{t('crm.support.noFaqs', 'No FAQs found')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(faq => (
            <FaqItem
              key={faq.id}
              faq={faq}
              isOpen={openId === faq.id}
              onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
              isAdmin={isAdmin}
              onEdit={(f) => { setEditingFaq(f); setShowEditor(true); }}
              onDelete={handleDelete}
              lang={lang}
            />
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <FaqEditorModal faq={editingFaq} onClose={() => { setShowEditor(false); setEditingFaq(null); }} onSaved={fetchFaqs} t={t} />
      )}
    </div>
  );
};

export default CRMFaq;
