import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FileText, Film, Music, File, Download, X, ExternalLink } from 'lucide-react';

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getAttachmentIcon(type) {
  if (!type) return File;
  if (type.startsWith('video/')) return Film;
  if (type.startsWith('audio/')) return Music;
  if (type.includes('pdf') || type.includes('document') || type.includes('sheet')) return FileText;
  return File;
}

function getAttachmentColor(type) {
  if (!type) return 'bg-gray-500';
  if (type.startsWith('image/')) return 'bg-blue-500';
  if (type.startsWith('video/')) return 'bg-purple-500';
  if (type.startsWith('audio/')) return 'bg-amber-500';
  if (type.includes('pdf')) return 'bg-red-500';
  return 'bg-gray-500';
}

function ImageLightbox({ src, alt, onClose }) {
  // Prevent body scroll while lightbox is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleBackdropClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onClose();
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={handleBackdropClick}>
      <button
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); onClose(); }}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
      >
        <X className="w-5 h-5" />
      </button>
      <img src={src} alt={alt} className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }} />
      <a href={src} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="absolute bottom-6 right-6 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm flex items-center gap-2 transition-colors z-10">
        <ExternalLink className="w-4 h-4" /> Open original
      </a>
    </div>,
    document.body
  );
}

function AttachmentPreview({ attachment, isDoctor }) {
  const [lightbox, setLightbox] = useState(false);
  const isImage = attachment.file_type?.startsWith('image/');
  const isVideo = attachment.file_type?.startsWith('video/');
  const isAudio = attachment.file_type?.startsWith('audio/');
  const url = attachment.url || attachment.thumb_url;
  const fullUrl = attachment.url;

  if (isImage && url) {
    return (
      <>
        <div className="mt-1.5 cursor-pointer" onClick={(e) => { e.stopPropagation(); setLightbox(true); }}>
          <img
            src={attachment.thumb_url || url}
            alt={attachment.file_name}
            className="max-w-[240px] max-h-[200px] rounded-lg object-cover border border-white/10 shadow-sm hover:opacity-90 transition-opacity"
            loading="lazy"
          />
        </div>
        {lightbox && <ImageLightbox src={fullUrl} alt={attachment.file_name} onClose={() => setLightbox(false)} />}
      </>
    );
  }

  if (isVideo && fullUrl) {
    return (
      <div className="mt-1.5">
        <video
          src={fullUrl}
          controls
          preload="metadata"
          className="max-w-[280px] max-h-[200px] rounded-lg border border-white/10 shadow-sm"
        />
      </div>
    );
  }

  if (isAudio && fullUrl) {
    return (
      <div className="mt-1.5">
        <audio src={fullUrl} controls preload="metadata" className="max-w-[260px] h-10" />
      </div>
    );
  }

  // Generic file card
  const Icon = getAttachmentIcon(attachment.file_type);
  const color = getAttachmentColor(attachment.file_type);
  const ext = attachment.file_name?.split('.').pop()?.toUpperCase() || 'FILE';

  return (
    <div className="mt-1.5">
      <a
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-colors ${
          isDoctor
            ? 'border-white/15 bg-white/10 hover:bg-white/15'
            : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
        }`}
      >
        <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium truncate ${isDoctor ? 'text-white' : 'text-gray-800'}`}>
            {attachment.file_name || 'File'}
          </p>
          <p className={`text-[10px] ${isDoctor ? 'text-teal-200' : 'text-gray-400'}`}>
            {ext} {attachment.file_size ? `· ${formatSize(attachment.file_size)}` : ''}
          </p>
        </div>
        <Download className={`w-3.5 h-3.5 flex-shrink-0 ${isDoctor ? 'text-teal-200' : 'text-gray-400'}`} />
      </a>
    </div>
  );
}

function ChatMessage({ message, leftAvatar, rightAvatar }) {
  const isDoctor = message.sender === 'doctor';
  const attachments = message.attachments || [];
  const hasText = message.text?.trim();
  const isSending = message.status === 'sending';
  const isFailed = message.status === 'failed';

  return (
    <div className={`flex ${isDoctor ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-end max-w-xs lg:max-w-md gap-2.5 ${isDoctor ? 'flex-row-reverse' : ''}`}>
        {!isDoctor && (
          <img src={leftAvatar} alt="Contact" className="w-8 h-8 rounded-lg object-cover ring-1 ring-white shadow-sm flex-shrink-0" loading="lazy" style={{ objectPosition: 'center 20%' }} />
        )}
        {isDoctor && (
          <img src={rightAvatar} alt="You" className="w-8 h-8 rounded-lg object-cover ring-1 ring-white shadow-sm flex-shrink-0" loading="lazy" style={{ objectPosition: 'center 20%' }} />
        )}
        <div className={`rounded-2xl px-4 py-2.5 shadow-sm ${
          isDoctor
            ? 'bg-gradient-to-br from-teal-600 to-emerald-600 text-white rounded-br-md'
            : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md'
        } ${isSending ? 'opacity-70' : ''} ${isFailed ? 'ring-2 ring-red-300' : ''}`}>
          {hasText && (
            <p className="text-[13px] leading-relaxed whitespace-pre-line">{message.text}</p>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className={`${hasText ? 'mt-1' : ''} space-y-1`}>
              {attachments.map((att, i) => (
                <AttachmentPreview key={att.id || i} attachment={att} isDoctor={isDoctor} />
              ))}
            </div>
          )}

          <p className={`text-[10px] mt-1.5 flex items-center gap-2 ${isDoctor ? 'text-teal-100' : 'text-gray-400'}`}>
            <span>{message.time}</span>
            {isSending && <span className="italic">Sending...</span>}
            {isFailed && <span className="text-red-300 font-medium">Failed</span>}
            {!isDoctor && !isSending && !isFailed && (
              <span className="inline-flex items-center gap-1">
                {message.status === 'sent' && <span title="Sent">✓</span>}
                {message.status === 'delivered' && <span title="Delivered">✓✓</span>}
                {message.status === 'read' && <span title="Read" className="text-teal-500">✓✓</span>}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default React.memo(ChatMessage);
