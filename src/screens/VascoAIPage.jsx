'use client';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from '@/compat/router';
import { Bot, ListChecks, Compass, Languages, Info, Send, Loader2, Stethoscope, Star, Video, BadgeCheck } from 'lucide-react';
import { vascoAPI } from '../lib/api';
import resolveStorageUrl from '../utils/resolveStorageUrl';
// SEO meta + canonical artık app/vasco-ai/page.jsx generateMetadata ile sunucuda üretiliyor (Faz 3).

function VascoAssistant() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = (i18n.language || 'tr').split('-')[0];
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const loc = (n) => (typeof n === 'string' ? n : (n?.[lang] || n?.en || n?.tr || (n ? Object.values(n)[0] : '')));

  const ask = async () => {
    const q = text.trim();
    if (q.length < 3 || loading) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await vascoAPI.suggest(q, lang);
      setResult(res?.data || res);
    } catch {
      setError(t('vascoAI.error', 'Bir sorun oluştu, tekrar deneyin.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-10">
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-4 flex items-center gap-2 text-white">
        <Bot className="w-5 h-5" />
        <span className="font-semibold">{t('vascoAI.assistantTitle', 'Şikâyetinizi yazın, doğru uzmanı bulalım')}</span>
      </div>
      <div className="p-5">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) ask(); }}
            rows={2}
            placeholder={t('vascoAI.placeholder', 'ör. İki gündür göğsümde ağrı ve çarpıntı var...')}
            className="flex-1 resize-none border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 outline-none"
          />
          <button onClick={ask} disabled={loading || text.trim().length < 3}
            className="h-11 px-4 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-700 disabled:opacity-50 inline-flex items-center gap-1.5">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {t('vascoAI.ask', 'Öner')}
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {result && (
          <div className="mt-5">
            {result.specialty ? (
              <div className="flex items-center gap-2 mb-3">
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
                    className="text-left bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3 hover:border-teal-300 hover:bg-teal-50/30 transition-all">
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

            <p className="mt-3 text-[11px] text-gray-400">{t('vascoAI.disclaimerShort', 'Vasco AI tanı koymaz; yalnızca doğru uzmana yönlendirir.')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VascoAIPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-white">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-gray-700 leading-relaxed">
        <h1 className="text-3xl font-bold text-gray-900">{t('vascoAI.title')}</h1>
        <p className="mt-4 mb-8 text-lg text-gray-600">
          Vasco AI, MedaGama'nın yapay zekâ destekli yönlendirme asistanıdır.
          Belirttiğiniz şikâyet ve semptomları anlayarak sizi platformdaki uygun branş
          ve uzman doktorlara yönlendirir. Vasco AI bir tanı veya tedavi aracı
          değildir; amacı doğru doktora ulaşmanızı kolaylaştırmaktır.
        </p>

        <VascoAssistant />

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">Vasco AI nedir?</h2>
        <p className="mt-3">
          Vasco AI, hastaların kendi cümleleriyle anlattığı şikâyetleri yorumlayarak,
          bu şikâyetlerin hangi tıbbi branşla ilgili olabileceğini değerlendiren bir
          yönlendirme aracıdır. Böylece "hangi doktora gitmeliyim?" sorusuna pratik bir
          başlangıç noktası sunar ve sizi platformdaki ilgili uzmanlara taşır.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">Nasıl çalışır?</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-100 p-4">
            <ListChecks className="h-6 w-6 text-teal-600" />
            <h3 className="mt-2 font-semibold text-gray-900">Semptom analizi</h3>
            <p className="mt-1 text-sm">
              Şikâyetlerinizi serbest metin olarak anlatırsınız; Vasco AI bunları
              değerlendirir.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 p-4">
            <Compass className="h-6 w-6 text-teal-600" />
            <h3 className="mt-2 font-semibold text-gray-900">Branş yönlendirme</h3>
            <p className="mt-1 text-sm">
              İlgili olabilecek tıbbi branşları önerir ve sizi uygun uzmanlara
              yönlendirir.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 p-4">
            <Languages className="h-6 w-6 text-teal-600" />
            <h3 className="mt-2 font-semibold text-gray-900">Çok dilli</h3>
            <p className="mt-1 text-sm">
              Farklı dillerde kullanılabilir; sağlık turizmi ziyaretçileri için
              elverişlidir.
            </p>
          </div>
        </div>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">Neler yapabilir, neler yapamaz?</h2>
        <ul className="mt-3 space-y-2 list-disc pl-5">
          <li>Şikâyetlerinize göre olası branşları önerebilir.</li>
          <li>Sizi platformdaki uzman doktor ve kliniklere yönlendirebilir.</li>
          <li>Çok dilli destekle sağlık turizmi sürecini kolaylaştırabilir.</li>
          <li><strong>Yapamaz:</strong> tanı koymak, ilaç önermek veya tedavi planlamak.</li>
        </ul>

        <p className="mt-6 flex items-center gap-2">
          <Bot className="h-5 w-5 text-teal-600" />
          Yönlendirmenin ardından{' '}
          <Link to="/search" className="text-teal-600 font-medium hover:underline">doktor arayın</Link>{' '}
          ya da{' '}
          <Link to="/doctors-departments" className="text-teal-600 font-medium hover:underline">branşları inceleyin</Link>.
        </p>

        <h2 className="mt-12 text-2xl font-semibold text-gray-900">Sık Sorulan Sorular</h2>
        <div className="mt-4 space-y-5">
          <div>
            <h3 className="font-semibold text-gray-900">Vasco AI tanı koyar mı?</h3>
            <p className="mt-1">
              Hayır. Vasco AI tanı koymaz, tedavi önermez ve tıbbi tavsiye vermez.
              Yalnızca sizi uygun branş ve uzmanlara yönlendiren bir araçtır.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Yönlendirme sonrası ne yapmalıyım?</h3>
            <p className="mt-1">
              Önerilen branştaki uzmanları platformda inceleyebilir, profilleri ve
              hasta yorumlarını okuyup{' '}
              <Link to="/search" className="text-teal-600 hover:underline">randevu</Link> alabilirsiniz.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Farklı dillerde kullanabilir miyim?</h3>
            <p className="mt-1">
              Evet, Vasco AI çok dilli olarak tasarlanmıştır; sorularınız için{' '}
              <Link to="/contact" className="text-teal-600 hover:underline">bize ulaşın</Link>.
            </p>
          </div>
        </div>

        {/* Yasal uyarı — sayfa sonunda, göze batmadan */}
        <div className="mt-12 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <Info className="h-5 w-5 shrink-0 mt-0.5" />
          <span>
            <strong>Önemli:</strong> Vasco AI tıbbi tavsiye, tanı veya tedavi sunmaz.
            Verdiği yanıtlar yalnızca yönlendirme amaçlıdır. Sağlığınızla ilgili tüm
            kararlar mutlaka bir hekimle birlikte alınmalıdır. Acil durumlarda en yakın
            sağlık kuruluşuna başvurun.
          </span>
        </div>
      </article>
    </div>
  );
}
