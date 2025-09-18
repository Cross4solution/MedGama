import React from 'react';
import { createPortal } from 'react-dom';
import { Share2, Link as LinkIcon, Twitter, Facebook, Mail, Send, Copy } from 'lucide-react';

/**
 * @param {{ url?: string, title?: string, className?: string, showNative?: boolean, buttonClassName?: string }} props
 */
export default function ShareMenu({ url, title = 'Share', className = '', showNative = false, buttonClassName = '' }) {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef(null);
  const panelRef = React.useRef(null);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const [pos, setPos] = React.useState({ top: 0, left: 0, width: 260 });

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onClick = (e) => {
      if (!open) return;
      if (panelRef.current && !panelRef.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    try {
      const rect = btnRef.current?.getBoundingClientRect();
      if (!rect) return;
      const w = 260;
      const top = Math.min(window.innerHeight - 8, rect.bottom + 8);
      // Soldan hizala, pencere içine sığdır
      const left = Math.max(8, Math.min(window.innerWidth - w - 8, rect.left));
      setPos({ top, left, width: w });
    } catch {}
  }, [open]);

  const handleNativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url: shareUrl });
        setOpen(false);
        return;
      }
    } catch {}
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setOpen(false);
    } catch {}
  };

  const tw = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(shareUrl)}`;
  const mail = `mailto:?subject=${encodeURIComponent(document?.title || 'Check this out')}&body=${encodeURIComponent(shareUrl)}`;

  return (
    <div className={`relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center justify-center gap-2 py-2 px-3 rounded-full text-sm border border-transparent bg-white text-gray-800 font-medium transition-colors hover:rounded-md hover:border-gray-200 hover:bg-gray-100 ${buttonClassName}`.trim()}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Share2 className="w-5 h-5" strokeWidth={2.5} aria-hidden="true" />
        <span>{title}</span>
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          role="menu"
          aria-label="Share options"
          className="fixed z-50 rounded-xl border border-gray-200 bg-white/90 backdrop-blur-md shadow-lg ring-1 ring-black/5"
          style={{ top: pos.top, left: pos.left, width: pos.width }}
        >
          <div className="p-2">
            {showNative && (
              <button onClick={handleNativeShare} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
                <Send className="w-4 h-4" />
                <span>Paylaş (Sistem)</span>
              </button>
            )}
            <a href={tw} target="_blank" rel="noreferrer" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
              <Twitter className="w-4 h-4" />
              <span>Twitter</span>
            </a>
            <a href={fb} target="_blank" rel="noreferrer" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
              <Facebook className="w-4 h-4" />
              <span>Facebook</span>
            </a>
            <a href={wa} target="_blank" rel="noreferrer" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
              <Send className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
            <a href={mail} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
              <Mail className="w-4 h-4" />
              <span>E‑posta</span>
            </a>
            <button onClick={handleCopy} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
              <LinkIcon className="w-4 h-4" />
              <span>Linki Kopyala</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
