import React, { useState } from 'react';
import { X, Send, Loader2, CheckCircle2, Paperclip, Image } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { chatAPI } from '../../lib/api';

export default function SendMessageModal({ open, onClose, targetId, targetName, targetType = 'doctor' }) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isTr = i18n.language?.startsWith('tr');

  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    setError(null);

    try {
      // Start or find existing conversation via chatAPI
      const convRes = await chatAPI.startConversation({ recipient_id: targetId });
      const conv = convRes?.data || convRes;
      const conversationId = conv?.id;

      if (conversationId) {
        await chatAPI.sendMessage(conversationId, { content: message.trim() });
      }
      setSent(true);
    } catch (err) {
      const status = err?.response?.status || err?.status;
      if (status === 403) {
        setError(isTr
          ? 'Sadece randevulu doktorlarınızla mesajlaşabilirsiniz.'
          : 'You can only message doctors you have an appointment with.');
      } else {
        setError(isTr ? 'Mesaj gönderilemedi.' : 'Failed to send message.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setSubject('');
    setSent(false);
    setError(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10">
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
                  ? `Mesajınız ${targetName} kişisine başarıyla iletildi.`
                  : `Your message has been sent to ${targetName}.`}
              </p>
              <div className="flex gap-3">
                <button onClick={handleClose} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
                  {isTr ? 'Kapat' : 'Close'}
                </button>
                <button
                  onClick={() => { handleClose(); navigate('/doctor-chat'); }}
                  className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors"
                >
                  {isTr ? 'Mesajlara Git' : 'Go to Messages'}
                </button>
              </div>
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
                  rows={5}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-xs text-red-600 font-medium">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1">
                  <button type="button" className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors" title={isTr ? 'Dosya Ekle' : 'Attach File'}>
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button type="button" className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors" title={isTr ? 'Resim Ekle' : 'Attach Image'}>
                    <Image className="w-4 h-4" />
                  </button>
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
