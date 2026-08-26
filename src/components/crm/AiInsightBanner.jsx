import React, { useState, useMemo, useEffect } from 'react';
import { Sparkles, ChevronRight, AlertTriangle, CalendarDays, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * AiInsightBanner — Google Drive-style AI summary widget for CRM dashboard.
 *
 * Accepts dashboard context (appointments, alerts, stats, patients) and
 * produces a concise, rotating insight. Currently client-side; designed to
 * be swapped for a real LLM endpoint later.
 */

// ── Insight generation (client-side) ─────────────────────────
function generateInsights({ appointments, randevularBiliniyor, alerts, stats, patients, t }) {
  const insights = [];
  // Şerit iki dil biliyordu: Türkçe değilse İngilizce. Dokuz dil destekleniyor,
  // yani Almanca ya da Arapça arayüzde İngilizce metin çıkıyordu. Metinler artık
  // çeviri anahtarından geliyor; sayı ve ad ara-değer, çoğul eki i18next'in
  // dil kuralına bırakılmış (İngilizce "s" eki elle ekleniyordu — Rusçada üç,
  // Arapçada altı çoğul biçimi var).
  const ic = (anahtar, yedek, degerler) => t(`yapayZekaIcgoru.${anahtar}`, { ...degerler, defaultValue: yedek });

  // 1. Urgent / critical alerts
  const unreadCritical = (alerts || []).filter((a) => !a.read && a.type === 'critical');
  const unreadWarning = (alerts || []).filter((a) => !a.read && a.type === 'warning');

  if (unreadCritical.length > 0) {
    insights.push({
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      text: unreadCritical[0].message,
      sub: ic('criticalAlerts', '{{count}} critical alert requires your attention', { count: unreadCritical.length }),
      priority: 10,
      tag: 'urgent',
    });
  }

  if (unreadWarning.length > 0) {
    insights.push({
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
      text: unreadWarning[0].message,
      sub: ic('pendingWarnings', '{{count}} pending warning to review', { count: unreadWarning.length }),
      priority: 8,
      tag: 'warning',
    });
  }

  // 2. Appointment summary
  // "Bugün" gerçekten bugün: eskiden gelen listenin tamamı bugünmüş gibi
  // sayılıyordu, panelin kutusu 1 derken şerit 2 yazıyordu.
  const bugun = new Date().toISOString().slice(0, 10);
  const bugunkuler = (appointments || []).filter((a) => String(a.date || '').slice(0, 10) === bugun);

  const upcoming = bugunkuler.filter((a) => a.status === 'upcoming' || a.status === 'confirmed' || a.status === 'pending');
  const inProgress = bugunkuler.filter((a) => a.status === 'in-progress');
  const completed = bugunkuler.filter((a) => a.status === 'completed');
  const cancelled = bugunkuler.filter((a) => a.status === 'cancelled');
  const total = bugunkuler.length;

  if (inProgress.length > 0) {
    insights.push({
      icon: CalendarDays,
      iconColor: 'text-blue-500',
      text: ic('inSession', '{{hasta}} is currently in session ({{tur}}).', {
        hasta: inProgress[0].patient,
        tur: inProgress[0].type,
      }),
      sub: ic('moreAhead', '{{count}} more appointment ahead today', { count: upcoming.length }),
      priority: 7,
      tag: 'schedule',
    });
  } else if (upcoming.length > 0) {
    const next = upcoming[0];
    insights.push({
      icon: CalendarDays,
      iconColor: 'text-teal-500',
      text: ic('nextUp', 'Next up: {{hasta}} at {{saat}} — {{tur}}.', {
        hasta: next.patient, saat: next.time, tur: next.type,
      }),
      sub: cancelled.length > 0
        ? ic('todayTotalsWithCancelled',
            '{{toplam}} total appointments today, {{tamamlanan}} completed, {{iptal}} cancelled',
            { toplam: total, tamamlanan: completed.length, iptal: cancelled.length })
        : ic('todayTotals', '{{toplam}} total appointments today, {{tamamlanan}} completed',
            { toplam: total, tamamlanan: completed.length }),
      priority: 6,
      tag: 'schedule',
    });
  }

  // "Yüksek riskli hasta" çıkarımı kaldırıldı: risk hesaplayan bir şey yok,
  // veri de gelmiyor. Tıbbi bir değerlendirmeyi uydurmak kabul edilemez.

  // Gelir trendi çıkarımı da kaldırıldı: "dün ile karşılaştırma" verisi
  // hiç üretilmiyordu, uydurma bir yüzdeye dayanıyordu.

  // 5. Day overview (always present as fallback)
  // "Onay bekleyen" sayısı kaldırıldı: randevular doğrudan onaylı geliyor,
  // onay diye bir adım kalmadı.
  // Randevu verisi GELMEDİYSE günlük özet çıkarımı yapılmıyor.
  //
  // Bu dosya benzer uydurmaları zaten temizlemiş — "yüksek riskli hasta" ve
  // "gelir trendi" çıkarımları, dayanacak veri olmadığı için kaldırılmıştı.
  // Aynı sorun burada kalmıştı: sunucuya ulaşılamadığında liste boş geliyor,
  // banner de "Bugün randevunuz yok, takviminiz boş" diye HÜKÜM veriyordu.
  // Boş liste ile bilinmeyen liste aynı şey değil.
  if (randevularBiliniyor) {
  insights.push({
    icon: Sparkles,
    iconColor: 'text-violet-500',
    text: total === 0
      ? ic('noAppointmentsToday', 'You have no appointments today.')
      : ic('haveAppointments', 'You have {{count}} appointment today.', { count: total }),
    sub: total === 0
      ? ic('calendarClear', 'Your calendar is clear.')
      : (cancelled.length
          ? ic('doneUpcomingCancelled', '{{tamamlanan}} done, {{sirada}} upcoming, {{iptal}} cancelled.',
              { tamamlanan: completed.length, sirada: upcoming.length, iptal: cancelled.length })
          : ic('doneUpcoming', '{{tamamlanan}} done, {{sirada}} upcoming.',
              { tamamlanan: completed.length, sirada: upcoming.length })),
    priority: 3,
    tag: 'overview',
  });
  }

  // Sort by priority desc and return
  return insights.sort((a, b) => b.priority - a.priority);
}

// ── Component ────────────────────────────────────────────────
export default function AiInsightBanner({ appointments, randevularBiliniyor = true, alerts, stats, patients }) {
  const { t, i18n } = useTranslation();

  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const insights = useMemo(
    () => generateInsights({ appointments, randevularBiliniyor, alerts, stats, patients, t }),
    [appointments, randevularBiliniyor, alerts, stats, patients, t],
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

  if (insights.length === 0) return null;

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
            aria-label={t('crm.dashboard.nextInsight', 'Next insight')}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress dots */}
      {insights.length > 1 && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center">
          {insights.map((_, i) => (
            /* Vuruş alanı 24px, nokta yine 4px.
               Düğmenin kendisi `w-1 h-1` idi: parmakla 4 piksellik bir hedefe
               isabet ettirmek mümkün değil. Nokta artık düğmenin İÇİNDE bir
               span; görünüm birebir aynı, dokunulabilir alan WCAG 2.2 AA'nın
               istediği 24×24'e çıktı. */
            <button
              key={i}
              type="button"
              onClick={() => {
                setIsAnimating(true);
                setTimeout(() => { setActiveIndex(i); setIsAnimating(false); }, 200);
              }}
              className="flex h-6 w-6 items-center justify-center"
              aria-label={t('crm.dashboard.insightN', 'Insight {{n}}', { n: i + 1 })}
            >
              <span
                aria-hidden="true"
                className={`block rounded-full transition-all duration-300 ${
                  i === activeIndex % insights.length
                    ? 'w-4 h-1 bg-violet-400'
                    : 'w-1 h-1 bg-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
