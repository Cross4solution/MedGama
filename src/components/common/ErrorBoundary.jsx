import React from 'react';
import i18n from '../../i18n';

// Hata sınırı SINIF bileşeni: `useTranslation` kancası burada çalışmaz,
// çeviri örneği doğrudan kullanılıyor.
//
// Ve savunmacı: bu bileşen uygulamanın son savunma hattı. Çeviri katmanı da
// bozulmuşsa `i18n.t` kendisi patlayabilir — o durumda hata ekranının da
// çökmesi kullanıcıyı bomboş bir sayfayla bırakır. Bu yüzden yedek metin
// her zaman elde.
function ceviri(anahtar, yedek) {
  try {
    const metin = i18n.t(anahtar);
    return metin && metin !== anahtar ? metin : yedek;
  } catch {
    return yedek;
  }
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('React ErrorBoundary:', error, info);
    }
    try {
      if (window && window.dispatchEvent) {
        const evt = new CustomEvent('app:error', { detail: { error, info } });
        window.dispatchEvent(evt);
      }
    } catch {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="p-4 m-4 border rounded bg-red-50 text-red-700">
          <div className="font-semibold mb-1">{ceviri('ortak.birSeylerTersGitti', 'Something went wrong.')}</div>
          <div className="text-sm">{ceviri('ortak.sayfayiYenileyin', 'Try refreshing the page.')}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
