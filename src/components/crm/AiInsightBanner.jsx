import React, { useState, useMemo, useEffect } from 'react';
import { Sparkles, X, ChevronRight, AlertTriangle, CalendarDays, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * AiInsightBanner — Google Drive-style AI summary widget for CRM dashboard.
 *
 * Accepts dashboard context (appointments, alerts, stats, patients) and
 * produces a concise, rotating insight. Currently client-side; designed to
 * be swapped for a real LLM endpoint later.
 */

// ── Insight generation (client-side) ─────────────────────────
function generateInsights({ appointments, alerts, stats, patients, t }) {
  const insights = [];
  const now = new Date();
  const hour = now.getHours();

  // 1. Urgent / critical alerts
  const unreadCritical = (alerts || []).filter((a) => !a.read && a.type === 'critical');
  const unreadWarning = (alerts || []).filter((a) => !a.read && a.type === 'warning');

  if (unreadCritical.length > 0) {
    insights.push({
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      text: unreadCritical[0].message,
      sub: `${unreadCritical.length} critical alert${unreadCritical.length > 1 ? 's' : ''} require your attention`,
      priority: 10,
      tag: 'urgent',
    });
  }

  if (unreadWarning.length > 0) {
    insights.push({
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
      text: unreadWarning[0].message,
      sub: `${unreadWarning.length} pending warning${unreadWarning.length > 1 ? 's' : ''} to review`,
      priority: 8,
      tag: 'warning',
    });
  }

  // 2. Appointment summary
  const upcoming = (appointments || []).filter((a) => a.status === 'upcoming');
  const inProgress = (appointments || []).filter((a) => a.status === 'in-progress');
  const completed = (appointments || []).filter((a) => a.status === 'completed');
  const cancelled = (appointments || []).filter((a) => a.status === 'cancelled');
  const total = (appointments || []).length;

  if (inProgress.length > 0) {
    insights.push({
      icon: CalendarDays,
      iconColor: 'text-blue-500',
      text: `${inProgress[0].patient} is currently in session (${inProgress[0].type}).`,
      sub: `${upcoming.length} more appointment${upcoming.length !== 1 ? 's' : ''} ahead today`,
      priority: 7,
      tag: 'schedule',
    });
  } else if (upcoming.length > 0) {
    const next = upcoming[0];
    insights.push({
      icon: CalendarDays,
      iconColor: 'text-teal-500',
      text: `Next up: ${next.patient} at ${next.time} — ${next.type}.`,
      sub: `${total} total appointments today, ${completed.length} completed${cancelled.length > 0 ? `, ${cancelled.length} cancelled` : ''}`,
      priority: 6,
      tag: 'schedule',
    });
  }

  // 3. High-risk patients
  const highRisk = (patients || []).filter((p) => p.risk === 'high');
  if (highRisk.length > 0) {
    insights.push({
      icon: AlertTriangle,
      iconColor: 'text-orange-500',
      text: `${highRisk[0].name} is flagged as high-risk (${highRisk[0].condition}).`,
      sub: `${highRisk.length} high-risk patient${highRisk.length > 1 ? 's' : ''} in your recent list`,
      priority: 9,
      tag: 'patient',
    });
  }

  // 4. Revenue trend
  const revenueStat = (stats || []).find((s) => s.label?.includes('Revenue'));
  if (revenueStat && revenueStat.trend === 'up') {
    insights.push({
      icon: TrendingUp,
      iconColor: 'text-emerald-500',
      text: `Today's revenue is ${revenueStat.value} (${revenueStat.change} vs yesterday).`,
      sub: 'Your daily trend is looking positive — keep it up!',
      priority: 4,
      tag: 'revenue',
    });
  }

  // 5. Day overview (always present as fallback)
  const pendingStat = (stats || []).find((s) => s.label?.includes('Pending'));
  insights.push({
    icon: Sparkles,
    iconColor: 'text-violet-500',
    text: `You have ${total} appointments today with ${(pendingStat?.value) || 0} pending approvals.`,
    sub: `${completed.length} done, ${upcoming.length} upcoming${cancelled.length ? `, ${cancelled.length} cancelled` : ''} — ${hour < 12 ? 'morning is busy' : hour < 17 ? 'afternoon ahead' : 'wrapping up'}.`,
    priority: 3,
    tag: 'overview',
  });

  // Sort by priority desc and return
  return insights.sort((a, b) => b.priority - a.priority);
}

// ── Component ────────────────────────────────────────────────
export default function AiInsightBanner({ appointments, alerts, stats, patients }) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const insights = useMemo(
    () => generateInsights({ appointments, alerts, stats, patients, t }),
    [appointments, alerts, stats, patients, t],
  );

  // Auto-rotate every 8 seconds
  useEffect(() => {
    if (insights.length <= 1) return;
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % insights.length);
        setIsAnimating(false);
      }, 300);
    }, 8000);
    return () => clearInterval(timer);
  }, [insights.length]);

  if (dismissed || insights.length === 0) return null;

  const current = insights[activeIndex % insights.length];
  const Icon = current.icon;

  return (
    <div className="relative group bg-gradient-to-r from-violet-50 via-blue-50/60 to-teal-50/40 border border-violet-200/50 rounded-2xl px-4 sm:px-5 py-3.5 flex items-start gap-3 overflow-hidden transition-all duration-300">
      {/* Subtle shimmer accent */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-400/5 via-transparent to-teal-400/5 pointer-events-none" />

      {/* AI icon */}
      <div className="relative flex-shrink-0 w-9 h-9 rounded-xl bg-white/80 backdrop-blur-sm border border-violet-200/40 flex items-center justify-center shadow-sm">
        <Sparkles className="w-4.5 h-4.5 text-violet-500" />
      </div>

      {/* Content */}
      <div className={`relative flex-1 min-w-0 transition-opacity duration-300 ${isAnimating ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-bold tracking-wider uppercase text-violet-500/80">{t('crm.dashboard.aiAssistant')}</span>
          <span className="text-[9px] text-gray-400 font-medium">•</span>
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
            current.tag === 'urgent' ? 'text-red-500' :
            current.tag === 'warning' ? 'text-amber-600' :
            current.tag === 'patient' ? 'text-orange-500' :
            current.tag === 'schedule' ? 'text-blue-500' :
            current.tag === 'revenue' ? 'text-emerald-500' :
            'text-gray-400'
          }`}>
            <Icon className="w-3 h-3" />
            {t(`crm.dashboard.aiTag${current.tag.charAt(0).toUpperCase() + current.tag.slice(1)}`)}
          </span>
          {insights.length > 1 && (
            <span className="text-[9px] text-gray-400 ml-auto hidden sm:inline">
              {activeIndex + 1}/{insights.length}
            </span>
          )}
        </div>

        <p className="text-[13px] font-medium text-gray-800 leading-snug line-clamp-1">
          {current.text}
        </p>
        <p className="text-[11px] text-gray-500 leading-snug mt-0.5 line-clamp-1">
          {current.sub}
        </p>
      </div>

      {/* Navigation + dismiss */}
      <div className="relative flex items-center gap-1 flex-shrink-0 self-center">
        {insights.length > 1 && (
          <button
            type="button"
            onClick={() => {
              setIsAnimating(true);
              setTimeout(() => {
                setActiveIndex((prev) => (prev + 1) % insights.length);
                setIsAnimating(false);
              }, 200);
            }}
            className="w-7 h-7 rounded-lg hover:bg-white/60 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Next insight"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="w-7 h-7 rounded-lg hover:bg-white/60 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress dots */}
      {insights.length > 1 && (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1">
          {insights.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setIsAnimating(true);
                setTimeout(() => { setActiveIndex(i); setIsAnimating(false); }, 200);
              }}
              className={`rounded-full transition-all duration-300 ${
                i === activeIndex % insights.length
                  ? 'w-4 h-1 bg-violet-400'
                  : 'w-1 h-1 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Insight ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
