import React from 'react';
import { createPortal } from 'react-dom';
import { Share2, Link as LinkIcon, Facebook, Mail } from 'lucide-react';

/**
 * @param {{ url?: string, title?: string, className?: string, showNative?: boolean, buttonClassName?: string }} props
 */
export default function ShareMenu({ url, title = 'Share', className = '', showNative = false, buttonClassName = '' }) {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef(null);
  const panelRef = React.useRef(null);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const [pos, setPos] = React.useState({ top: 0, left: 0, width: 256 });

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

  const updatePos = React.useCallback(() => {
    try {
      const btn = btnRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const w = 256;
      const gutter = 8;
      const top = Math.min(window.innerHeight - gutter, rect.bottom + gutter);
      const left = Math.max(gutter, Math.min(window.innerWidth - w - gutter, rect.left));
      setPos({ top, left, width: w });
    } catch {}
  }, []);

  React.useEffect(() => {
    if (!open) return;
    updatePos();
    const onScroll = () => updatePos();
    const onResize = () => updatePos();
    // Use capture to catch scrolls on nested containers
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, updatePos]);

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

  // X (Twitter) still uses the same share endpoint
  const xUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(shareUrl)}`;
  const mail = `mailto:?subject=${encodeURIComponent(document?.title || 'Check this out')}&body=${encodeURIComponent(shareUrl)}`;

  // Inline icons for X and WhatsApp
  const XIcon = (props) => (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M18.244 2H21l-6.5 7.43L22 22h-6.8l-4.4-6-5.04 6H3l7.02-8.37L2 2h6.8l4 5.6L18.244 2zm-1.19 18h1.59L8.03 4H6.44l10.61 16z" />
    </svg>
  );
  const WhatsAppIcon = (props) => (
    <svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M19.11 17.54c-.3-.15-1.76-.86-2.03-.96-.27-.1-.47-.15-.66.15-.2.3-.76.95-.92 1.15-.17.2-.34.22-.64.08-.3-.15-1.26-.46-2.4-1.47-.88-.78-1.47-1.74-1.65-2.03-.17-.3-.02-.46.13-.61.14-.14.3-.34.45-.51.15-.17.2-.3.3-.5.1-.2.05-.38-.02-.53-.07-.15-.66-1.59-.9-2.18-.24-.58-.48-.5-.66-.51-.17-.01-.37-.01-.57-.01-.2 0-.53.08-.81.38-.27.3-1.06 1.04-1.06 2.54 0 1.5 1.09 2.95 1.25 3.15.15.2 2.15 3.28 5.2 4.59.73.32 1.3.51 1.74.65.73.23 1.4.2 1.93.12.59-.09 1.76-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.26-.2-.56-.34z" />
      <path fill="currentColor" d="M27.1 4.9A13.9 13.9 0 0 0 16 0C7.2 0 .1 7.1.1 15.9 0 19 .8 21.9 2.3 24.4L0 32l7.8-2.3A15.8 15.8 0 0 0 16 31.8c8.8 0 15.9-7.1 15.9-15.9 0-4.2-1.6-8.1-4.8-11zM16 29.2c-2.5 0-4.9-.7-7-2.1l-.5-.3-4.7 1.4 1.4-4.6-.3-.5a13.2 13.2 0 1 1 11.1 6.1z" />
    </svg>
  );

  return (
    <div className={`relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm text-gray-600 font-medium transition-colors hover:bg-gray-50 ${buttonClassName}`.trim()}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Share2 className="w-4 h-4" strokeWidth={1.8} aria-hidden="true" />
        <span>{title}</span>
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          role="menu"
          aria-label="Share options"
          className="fixed z-[9999] rounded-xl border border-gray-200 bg-white shadow-xl ring-1 ring-black/5"
          style={{ top: pos.top, left: pos.left, width: pos.width }}
        >
          <div className="px-1.5 py-1.5">
            <p className="px-3 py-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Share via</p>
            {showNative && (
              <button onClick={handleNativeShare} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700 text-sm transition-colors">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                    <path d="M22 2L11 13"></path>
                    <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
                  </svg>
                </span>
                <span>Share (System)</span>
              </button>
            )}
            <a href={xUrl} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700 text-sm transition-colors">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-900"><XIcon className="w-4 h-4 text-white" /></span>
              <span>X</span>
            </a>
            <a href={fb} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700 text-sm transition-colors">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600"><Facebook className="w-4 h-4 text-white" /></span>
              <span>Facebook</span>
            </a>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700 text-sm transition-colors">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-500"><WhatsAppIcon className="w-4 h-4 text-white" /></span>
              <span>WhatsApp</span>
            </a>
            <a href={mail} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700 text-sm transition-colors">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100"><Mail className="w-4 h-4 text-orange-600" /></span>
              <span>Email</span>
            </a>
            <div className="mx-2 my-1 border-t border-gray-100" />
            <button onClick={handleCopy} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700 text-sm transition-colors">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100"><LinkIcon className="w-4 h-4 text-gray-600" /></span>
              <span>Copy Link</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
