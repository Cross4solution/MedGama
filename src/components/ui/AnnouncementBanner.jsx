import React, { useState, useEffect } from 'react';
import { Info, AlertTriangle, CheckCircle, AlertCircle, X, ExternalLink } from 'lucide-react';
import { announcementAPI } from '../../lib/api';

const TYPE_CONFIG = {
  info:    { bg: 'bg-blue-50',    text: 'text-blue-800',    border: 'border-blue-200',    icon: Info,          iconColor: 'text-blue-500' },
  warning: { bg: 'bg-amber-50',   text: 'text-amber-800',   border: 'border-amber-200',   icon: AlertTriangle, iconColor: 'text-amber-500' },
  success: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', icon: CheckCircle,   iconColor: 'text-emerald-500' },
  error:   { bg: 'bg-red-50',     text: 'text-red-800',     border: 'border-red-200',     icon: AlertCircle,   iconColor: 'text-red-500' },
};

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dismissed_announcements') || '[]');
    } catch { return []; }
  });

  useEffect(() => {
    announcementAPI.list()
      .then(res => {
        const data = res?.data || res || [];
        setAnnouncements(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  const handleDismiss = (id) => {
    const updated = [...dismissed, id];
    setDismissed(updated);
    localStorage.setItem('dismissed_announcements', JSON.stringify(updated));
  };

  const visible = announcements.filter(a => !dismissed.includes(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {visible.map(ann => {
        const cfg = TYPE_CONFIG[ann.type] || TYPE_CONFIG.info;
        const Icon = cfg.icon;

        return (
          <div key={ann.id} className={`${cfg.bg} ${cfg.border} border rounded-xl px-4 py-3 flex items-start gap-3`}>
            <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.iconColor}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${cfg.text}`}>{ann.title}</p>
              <p className={`text-xs mt-0.5 ${cfg.text} opacity-80`}>{ann.body}</p>
              {ann.link_url && (
                <a href={ann.link_url} target="_blank" rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 text-xs font-medium mt-1.5 underline ${cfg.text} opacity-90 hover:opacity-100`}>
                  {ann.link_label || 'Learn more'} <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            {ann.is_dismissible && (
              <button onClick={() => handleDismiss(ann.id)}
                className={`p-1 rounded-lg hover:bg-black/5 transition-colors flex-shrink-0 ${cfg.text} opacity-50 hover:opacity-80`}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
