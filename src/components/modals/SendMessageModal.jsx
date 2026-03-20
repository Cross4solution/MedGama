import React, { useState, useRef, useCallback } from 'react';
import { X, Send, Loader2, CheckCircle2, Paperclip, Image as ImageIcon, FileText, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { contactMessageAPI } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 5;
const ALLOWED_IMAGE = 'image/jpeg,image/png,image/webp,image/gif';
const ALLOWED_DOC = '.pdf,.doc,.docx,.xls,.xlsx,image/jpeg,image/png,image/webp,image/gif';

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function SendMessageModal({ open, onClose, targetId, targetName, targetType = 'doctor' }) {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const { notify } = useToast();

  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const addFiles = useCallback((newFiles) => {
    setError(null);
    const incoming = Array.from(newFiles);
    setFiles(prev => {
      const combined = [...prev];
      for (const f of incoming) {
        if (combined.length >= MAX_FILES) {
          setError(isTr ? `En fazla ${MAX_FILES} dosya ekleyebilirsiniz.` : `Maximum ${MAX_FILES} files allowed.`);
          break;
        }
        if (f.size > MAX_FILE_SIZE) {
          setError(isTr ? `"${f.name}" 5 MB sınırını aşıyor.` : `"${f.name}" exceeds 5 MB limit.`);
          continue;
        }
        if (combined.some(x => x.name === f.name && x.size === f.size)) continue;
        combined.push(f);
      }
      return combined;
    });
  }, [isTr]);

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('receiver_id', targetId);
      fd.append('receiver_type', targetType);
      fd.append('body', message.trim());
      if (subject.trim()) fd.append('subject', subject.trim());
      files.forEach(f => fd.append('attachments[]', f));

      await contactMessageAPI.send(fd);
      setSent(true);
      notify({
        type: 'success',
        message: isTr ? 'Mesajınız kliniğe iletildi.' : 'Your message has been delivered.',
      });
    } catch (err) {
      const msg = err?.response?.data?.message;
      setError(msg || (isTr ? 'Mesaj gönderilemedi.' : 'Failed to send message.'));
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setSubject('');
    setFiles([]);
    setSent(false);
    setError(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 lg:pl-64">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10">
        {/* Hidden file inputs */}
        <input ref={fileInputRef} type="file" multiple accept={ALLOWED_DOC} className="hidden"
          onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
        <input ref={imageInputRef} type="file" multiple accept={ALLOWED_IMAGE} className="hidden"
          onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />

        {/* Header */}
        <div className="border-b border-gray-100 px-5 py-4 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">{isTr ? 'Mesaj Gönder' : 'Send Message'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{isTr ? 'Alıcı' : 'To'}: {targetName}</p>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="p-5">
          {/* Success */}
          {sent ? (
            <div className="py-6 text-center">
              <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{isTr ? 'Mesaj Gönderildi!' : 'Message Sent!'}</h3>
              <p className="text-sm text-gray-500 mb-6">
                {isTr
                  ? `Mesajınız ${targetName} adresine başarıyla iletildi.`
                  : `Your message has been sent to ${targetName}.`}
              </p>
              <button onClick={handleClose} className="w-full py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors">
                {isTr ? 'Kapat' : 'Close'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Subject */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{isTr ? 'Konu (isteğe bağlı)' : 'Subject (optional)'}</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder={isTr ? 'Mesaj konusu...' : 'Message subject...'}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">{isTr ? 'Mesajınız' : 'Your Message'} *</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={isTr ? 'Mesajınızı yazın...' : 'Type your message...'}
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 resize-none"
                />
              </div>

              {/* File chips */}
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {files.map((f, idx) => {
                    const isImg = f.type.startsWith('image/');
                    return (
                      <div key={idx} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 max-w-[200px]">
                        {isImg ? (
                          <img src={URL.createObjectURL(f)} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-medium text-gray-700 truncate">{f.name}</p>
                          <p className="text-[10px] text-gray-400">{formatBytes(f.size)}</p>
                        </div>
                        <button onClick={() => removeFile(idx)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-xs text-red-600 font-medium">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={files.length >= MAX_FILES}
                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30"
                    title={isTr ? 'Dosya Ekle' : 'Attach File'}
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={files.length >= MAX_FILES}
                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30"
                    title={isTr ? 'Resim Ekle' : 'Attach Image'}
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  {files.length > 0 && (
                    <span className="text-[10px] text-gray-400 ml-1">{files.length}/{MAX_FILES}</span>
                  )}
                </div>
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || sending}
                  className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isTr ? 'Gönder' : 'Send'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
