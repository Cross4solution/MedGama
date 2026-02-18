import React, { useState, useRef, useCallback } from 'react';
import { Paperclip, Image as ImageIcon, Send, X, FileText, Film, Music, File, AlertCircle } from 'lucide-react';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 10;
const IMAGE_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif';
const FILE_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.zip,.rar,.mp4,.mov,.webm,.mp3,.wav,.ogg';

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileIcon(file) {
  const t = file.type || '';
  if (t.startsWith('image/')) return ImageIcon;
  if (t.startsWith('video/')) return Film;
  if (t.startsWith('audio/')) return Music;
  if (t.includes('pdf') || t.includes('document') || t.includes('sheet') || t.includes('presentation')) return FileText;
  return File;
}

function getFileColor(file) {
  const t = file.type || '';
  if (t.startsWith('image/')) return 'bg-blue-500';
  if (t.startsWith('video/')) return 'bg-purple-500';
  if (t.startsWith('audio/')) return 'bg-amber-500';
  if (t.includes('pdf')) return 'bg-red-500';
  return 'bg-gray-500';
}

export default function ChatInput({ message, onChange, onSend, sending = false }) {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const addFiles = useCallback((newFiles) => {
    setError('');
    const incoming = Array.from(newFiles);
    const totalCount = files.length + incoming.length;

    if (totalCount > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    const tooBig = incoming.find(f => f.size > MAX_FILE_SIZE);
    if (tooBig) {
      setError(`"${tooBig.name}" is too large (${formatSize(tooBig.size)}). Max: 50 MB`);
      return;
    }

    // Generate previews for images
    const newPreviews = incoming.map(f => {
      if (f.type.startsWith('image/')) {
        return URL.createObjectURL(f);
      }
      return null;
    });

    setFiles(prev => [...prev, ...incoming]);
    setPreviews(prev => [...prev, ...newPreviews]);
  }, [files.length]);

  const removeFile = useCallback((index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
    setError('');
  }, []);

  const clearFiles = useCallback(() => {
    previews.forEach(url => { if (url) URL.revokeObjectURL(url); });
    setFiles([]);
    setPreviews([]);
    setError('');
  }, [previews]);

  const handleSend = useCallback(() => {
    const text = message?.trim();
    if (!text && files.length === 0) return;
    if (sending) return;
    onSend?.(files.length > 0 ? files : undefined);
    clearFiles();
  }, [message, files, sending, onSend, clearFiles]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Drag & drop handlers
  const handleDragOver = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }, []);
  const handleDragLeave = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }, []);
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer?.files?.length) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const hasFiles = files.length > 0;

  return (
    <div
      ref={dropZoneRef}
      className={`border-t border-gray-100 bg-white rounded-b-2xl flex-shrink-0 transition-colors ${dragOver ? 'bg-teal-50/50 border-teal-300' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {dragOver && (
        <div className="px-4 py-3 text-center">
          <div className="border-2 border-dashed border-teal-400 rounded-xl py-6 bg-teal-50/60">
            <Paperclip className="w-6 h-6 text-teal-500 mx-auto mb-1" />
            <p className="text-sm font-medium text-teal-700">Drop files here</p>
            <p className="text-xs text-teal-500 mt-0.5">Max 50 MB per file · Up to 10 files</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="px-4 pt-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} className="ml-auto p-0.5 hover:bg-red-100 rounded">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* File preview strip */}
      {hasFiles && !dragOver && (
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {files.map((file, i) => {
              const isImage = file.type.startsWith('image/');
              const Icon = getFileIcon(file);
              const color = getFileColor(file);

              return (
                <div key={i} className="relative flex-shrink-0 group">
                  {isImage && previews[i] ? (
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                      <img src={previews[i]} alt={file.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg border border-gray-200 shadow-sm bg-gray-50 flex flex-col items-center justify-center gap-1 px-1">
                      <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center`}>
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <p className="text-[8px] text-gray-500 truncate w-full text-center leading-tight">{file.name.length > 10 ? file.name.slice(0, 8) + '…' : file.name}</p>
                    </div>
                  )}
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-800/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 shadow"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {/* File size badge */}
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[7px] bg-black/60 text-white px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {formatSize(file.size)}
                  </span>
                </div>
              );
            })}

            {/* Add more button */}
            {files.length < MAX_FILES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:text-teal-500 hover:border-teal-300 transition-colors flex-shrink-0"
              >
                <span className="text-xl font-light">+</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Input row */}
      {!dragOver && (
        <div className="px-4 py-3">
          <div className="flex items-center gap-2">
            {/* Attach file button */}
            <button
              type="button"
              aria-label="Attach file"
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-[18px] h-[18px]" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={FILE_ACCEPT + ',' + IMAGE_ACCEPT}
              className="hidden"
              onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ''; }}
            />

            {/* Insert image button */}
            <button
              type="button"
              aria-label="Insert image"
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => imageInputRef.current?.click()}
            >
              <ImageIcon className="w-[18px] h-[18px]" />
            </button>
            <input
              ref={imageInputRef}
              type="file"
              multiple
              accept={IMAGE_ACCEPT}
              className="hidden"
              onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ''; }}
            />

            {/* Text input */}
            <input
              type="text"
              value={message}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder={hasFiles ? 'Add a caption...' : 'Type your message...'}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50/50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 focus:bg-white transition-all placeholder:text-gray-400"
              onKeyDown={handleKeyDown}
              disabled={sending}
            />

            {/* Send button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || (!message?.trim() && !hasFiles)}
              className={`p-2.5 rounded-xl text-white shadow-md transition-all duration-200 ${
                sending || (!message?.trim() && !hasFiles)
                  ? 'bg-gray-300 shadow-none cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-teal-200/50 hover:shadow-lg'
              }`}
              aria-label="Send message"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
