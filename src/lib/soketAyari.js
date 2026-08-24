/**
 * Soket yapılandırması — pusher-js'i çekmeden.
 *
 * `lib/echo.js` `laravel-echo` + `pusher-js` içe aktarıyor: paketlenmiş hâli
 * 20 KB gzip (72 KB ham). Bildirim bağlamının tek ihtiyacı "soket ayarlı mı?"
 * sorusunun cevabıydı ve bunu `Boolean(getEcho())` ile soruyordu — yani yedek
 * yoklama aralığını seçmek için TÜM soket yığınını indiriyor, ayrıştırıyor ve
 * bir Echo örneği kuruyordu. Bağlam ortak kabukta olduğu için bu, hiç oturum
 * açmayacak bir ziyaretçinin ana sayfasına da iniyordu.
 *
 * Sorunun cevabı yalnızca ortam değişkenlerinde. Anahtarlar burada duruyor,
 * `echo.js` de buradan okuyor; ileride üçüncü bir yayın kipi eklenirse iki
 * yerde ayrışmasın.
 */

export const reverbKey = process.env.REACT_APP_REVERB_APP_KEY;
export const reverbHost = process.env.REACT_APP_REVERB_HOST || '127.0.0.1';
export const reverbPort = process.env.REACT_APP_REVERB_PORT || '8080';

export const pusherKey = process.env.REACT_APP_PUSHER_APP_KEY;
export const pusherCluster = process.env.REACT_APP_PUSHER_CLUSTER || 'eu';

/**
 * Bir yayın sunucusu yapılandırılmış mı?
 *
 * `getEcho()` bu koşul sağlanmadığında `null` dönüyor; ikisi aynı koşul.
 */
export function soketAyarliMi() {
  return Boolean(reverbKey || pusherKey);
}
