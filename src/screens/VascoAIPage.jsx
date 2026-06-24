'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from '@/compat/router';
import { Bot, ListChecks, Compass, Languages, Info, Send, Loader2, Stethoscope, Star, Video, BadgeCheck, ShieldCheck, Sparkles } from 'lucide-react';
import { vascoAPI } from '../lib/api';
import resolveStorageUrl from '../utils/resolveStorageUrl';
// SEO meta + canonical app/[locale]/vasco-ai/page.jsx generateMetadata ile sunucuda üretiliyor.

const EXAMPLES = [
  'Dişimde şiddetli ağrı var',
  'Cildimde kaşıntılı döküntüler çıktı',
  'Göğsümde baskı ve çarpıntı',
  'Sürekli baş ağrım ve baş dönmem var',
  'Gözlerim bulanık görüyor',
];

function VascoAssistant() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = (i18n.language || 'tr').split('-')[0];
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const loc = (n) => (typeof n === 'string' ? n : (n?.[lang] || n?.en || n?.tr || (n ? Object.values(n)[0] : '')));

  // One-time typewriter placeholder on first open (after the header shimmer).
  const [animPh, setAnimPh] = useState('');
  const typedRef = useRef(false);
  useEffect(() => {
    if (typedRef.current) return;
    typedRef.current = true;
    const word = t('vascoAI.typeExample', 'Dişimde iki gündür şiddetli ağrı var');
    let i = 0;
    let clearId;
    const start = setTimeout(() => {
      const id = setInterval(() => {
        i += 1;
        setAnimPh(word.slice(0, i));
        if (i >= word.length) { clearInterval(id); clearId = setTimeout(() => setAnimPh(''), 1800); }
      }, 55);
    }, 1100); // let the shimmer pass first
    return () => { clearTimeout(start); clearTimeout(clearId); };
  }, [t]);

  const ask = async (q) => {
    const query = (q ?? text).trim();
    if (query.length < 3 || loading) return;
    if (q) setText(q);
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await vascoAPI.suggest(query, lang);
      setResult(res?.data || res);
    } catch {
      setError(t('vascoAI.error', 'Bir sorun oluştu, tekrar deneyin.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-gray-200 shadow-xl shadow-teal-900/5 overflow-hidden bg-white">
      <style>{`
        @keyframes vascoShimmer{0%{left:-15%;opacity:0}15%{opacity:.85}85%{opacity:.85}100%{left:115%;opacity:0}}
        @keyframes vascoDot{0%,80%,100%{opacity:.25}40%{opacity:1}}
        .vasco-shimmer{animation:vascoShimmer 1.9s ease-in-out 1 forwards}
        .vasco-dots i{display:inline-block;width:4px;height:4px;border-radius:50%;background:currentColor;margin:0 1px;animation:vascoDot 1.4s infinite}
        .vasco-dots i:nth-child(2){animation-delay:.2s}.vasco-dots i:nth-child(3){animation-delay:.4s}
      `}</style>
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-600 to-emerald-600 px-5 sm:px-7 py-4 flex items-center gap-2.5 text-white">
        <span aria-hidden="true" className="vasco-shimmer pointer-events-none absolute inset-y-0 w-16 bg-white/25 blur-md" />
        <div className="relative w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
          <Bot className="w-4 h-4" />
        </div>
        <span className="relative font-semibold text-[15px] flex items-center gap-1.5">
          {loading ? (
            <>{t('vascoAI.thinking', 'Vasco düşünüyor')}<span className="vasco-dots" aria-hidden="true"><i /><i /><i /></span></>
          ) : t('vascoAI.assistantTitle', 'Şikâyetinizi yazın, doğru uzmanı bulalım')}
        </span>
      </div>
      <div className="p-5 sm:p-7">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) ask(); }}
            rows={2}
            placeholder={animPh || t('vascoAI.placeholder', 'ör. İki gündür göğsümde ağrı ve çarpıntı var...')}
            className="flex-1 resize-none border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none"
          />
          <button onClick={() => ask()} disabled={loading || text.trim().length < 3}
            className="h-12 px-5 rounded-2xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 disabled:opacity-50 inline-flex items-center gap-1.5 transition-colors">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {t('vascoAI.ask', 'Öner')}
          </button>
        </div>

        {/* Quick examples */}
        {!result && !loading && (
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex} type="button" onClick={() => ask(ex)}
                className="px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-xs text-gray-600 hover:border-teal-300 hover:text-teal-700 transition-colors">
                {ex}
              </button>
            ))}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {result && (
          <div className="mt-5">
            {result.specialty ? (
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-sm font-semibold border border-teal-100">
                  <Stethoscope className="w-4 h-4" /> {loc(result.specialty.name)}
                </span>
                {result.rationale && <span className="text-sm text-gray-500">{result.rationale}</span>}
              </div>
            ) : (
              <p className="text-sm text-gray-700 mb-3">{result.follow_up || t('vascoAI.vague', 'Şikâyetinizi biraz daha açıklar mısınız?')}</p>
            )}

            {result.doctors?.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-3">
                {result.doctors.map((d) => (
                  <button key={d.id} type="button" onClick={() => navigate(`/doctor/${d.id}`)}
                    className="text-left bg-gray-50 border border-gray-200 rounded-2xl p-3 flex items-center gap-3 hover:border-teal-300 hover:bg-teal-50/30 transition-all">
                    <img src={resolveStorageUrl(d.avatar)} alt={d.fullname} loading="lazy"
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      onError={(e) => { e.currentTarget.src = '/images/default/default-avatar.svg'; }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold text-gray-900 truncate">{d.fullname}</span>
                        {d.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />}
                      </div>
                      {d.specialty && <p className="text-xs text-gray-500 truncate">{d.specialty}</p>}
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                        {d.rating ? (<span className="inline-flex items-center gap-0.5"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{d.rating}</span>) : null}
                        {d.online && <span className="inline-flex items-center gap-0.5 text-teal-600"><Video className="w-3 h-3" />Online</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {result.specialty && result.doctors?.length === 0 && (
              <Link to="/search" className="inline-block text-sm text-teal-600 font-medium hover:underline">
                {t('vascoAI.browseDoctors', 'Bu branştaki doktorları görüntüle →')}
              </Link>
            )}

            <button type="button" onClick={() => { setResult(null); setText(''); }}
              className="mt-3 block text-xs font-medium text-gray-400 hover:text-gray-700">
              {t('vascoAI.askAnother', '↺ Yeni şikâyet')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Step({ n, icon: Icon, title, desc }) {
  return (
    <div className="relative rounded-2xl border border-gray-100 bg-white p-5">
      <div className="absolute -top-3 left-5 w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center">{n}</div>
      <Icon className="h-6 w-6 text-teal-600 mt-2" />
      <h3 className="mt-2 font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-600">{desc}</p>
    </div>
  );
}

export default function VascoAIPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/50 via-white to-white">
      {/* Hero + assistant */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-10 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100/70 text-teal-700 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" /> {t('vascoAI.badge', 'Yapay Zekâ Yönlendirme Asistanı')}
        </span>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">{t('vascoAI.title', 'Vasco AI')}</h1>
        <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
          {t('vascoAI.hero', 'Şikâyetinizi kendi cümlelerinizle yazın; Vasco doğru uzmanlık alanını ve platformdaki en uygun doktorları önersin. Tanı koymaz — doğru doktora ulaştırır.')}
        </p>
        <div className="mt-8 text-left">
          <VascoAssistant />
        </div>
        <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5" /> {t('vascoAI.trust', 'Tanı koymaz · Çok dilli · Şikâyetiniz gizli tutulur')}
        </p>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <h2 className="text-center text-2xl font-bold text-gray-900 mb-8">{t('vascoAI.howTitle', 'Nasıl çalışır?')}</h2>
        <div className="grid gap-5 sm:grid-cols-3">
          <Step n="1" icon={ListChecks} title={t('vascoAI.step1Title', 'Şikâyetinizi anlatın')} desc={t('vascoAI.step1Desc', 'Serbest metinle, kendi dilinizde yazarsınız.')} />
          <Step n="2" icon={Compass} title={t('vascoAI.step2Title', 'Branş önerilir')} desc={t('vascoAI.step2Desc', 'Vasco doğru tıbbi branşı belirler.')} />
          <Step n="3" icon={Stethoscope} title={t('vascoAI.step3Title', 'Uzmana ulaşın')} desc={t('vascoAI.step3Desc', 'En uygun doktorları görüp randevu alırsınız.')} />
        </div>
      </section>

      {/* Capabilities */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Languages className="w-4 h-4 text-teal-600" />{t('vascoAI.canTitle', 'Neler yapar')}</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600 list-disc pl-5">
              <li>{t('vascoAI.can1', 'Şikâyete göre olası branşı önerir')}</li>
              <li>{t('vascoAI.can2', 'Sizi uzman doktor ve kliniklere yönlendirir')}</li>
              <li>{t('vascoAI.can3', 'Birçok dilde çalışır (sağlık turizmi dostu)')}</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Info className="w-4 h-4 text-amber-600" />{t('vascoAI.cantTitle', 'Neler yapmaz')}</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600 list-disc pl-5">
              <li>{t('vascoAI.cant1', 'Tanı koymaz')}</li>
              <li>{t('vascoAI.cant2', 'İlaç veya tedavi önermez')}</li>
              <li>{t('vascoAI.cant3', 'Hekim muayenesinin yerine geçmez')}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-5">{t('vascoAI.faqTitle', 'Sık Sorulan Sorular')}</h2>
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <h3 className="font-semibold text-gray-900">{t('vascoAI.q1', 'Vasco AI tanı koyar mı?')}</h3>
            <p className="mt-1.5 text-sm text-gray-600">{t('vascoAI.a1', 'Hayır. Vasco AI tanı koymaz, tedavi önermez ve tıbbi tavsiye vermez. Yalnızca sizi uygun branş ve uzmanlara yönlendiren bir araçtır.')}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <h3 className="font-semibold text-gray-900">{t('vascoAI.q2', 'Yönlendirme sonrası ne yapmalıyım?')}</h3>
            <p className="mt-1.5 text-sm text-gray-600">
              {t('vascoAI.a2', 'Önerilen branştaki uzmanları inceleyip')}{' '}
              <Link to="/search" className="text-teal-600 hover:underline">{t('vascoAI.appointment', 'randevu')}</Link>{' '}
              {t('vascoAI.a2b', 'alabilirsiniz.')}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <h3 className="font-semibold text-gray-900">{t('vascoAI.q3', 'Farklı dillerde kullanabilir miyim?')}</h3>
            <p className="mt-1.5 text-sm text-gray-600">{t('vascoAI.a3', 'Evet, Vasco AI çok dilli olarak tasarlanmıştır.')}</p>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-14">
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <Info className="h-5 w-5 shrink-0 mt-0.5" />
          <span>
            <strong>{t('vascoAI.importantLabel', 'Önemli:')}</strong> {t('vascoAI.disclaimer', 'Vasco AI tıbbi tavsiye, tanı veya tedavi sunmaz. Verdiği yanıtlar yalnızca yönlendirme amaçlıdır. Sağlığınızla ilgili tüm kararlar mutlaka bir hekimle birlikte alınmalıdır. Acil durumlarda en yakın sağlık kuruluşuna başvurun.')}
          </span>
        </div>
      </section>
    </div>
  );
}
