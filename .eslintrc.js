/**
 * ÇÖKME DENETİMİ — kozmetik kurallar için değil.
 *
 * Buradaki her kural, derlemenin YAKALAYAMADIĞI bir çalışma-anı çökmesini
 * hedefliyor. Eksik bir import derleme hatası değildir; sayfa açılana kadar
 * sessiz kalır, sonra ReferenceError ile beyaz ekran verir. Canlıda tam da bu
 * oldu: bir toplu düzenleme üç dosyada import eklemeyi atladı ve
 * "aramaAnahtari is not defined" dokuz dilin hepsinde sayfayı çökertti.
 *
 * O sırada hiçbir denetim çalışmıyordu: next.config.js'te lint kapalıydı ve
 * package.json'daki eslintConfig hâlâ kaldırılmış CRA kurulumuna işaret
 * ediyordu — yani yapılandırma zaten ölüydü.
 *
 * NEDEN .js, .json DEĞİL:
 * İlk sürüm .eslintrc.json idi ve açıklamayı "//" anahtarına koymuştum.
 * ESLint bilinmeyen üst düzey anahtarı reddediyor, dolayısıyla denetim hiç
 * çalışmadı. Fark edilmedi çünkü test ederken --no-eslintrc ile BAŞKA bir
 * dosya kullanılmıştı: gönderilen yol hiç denenmemişti. .js biçiminde yorum
 * yazmak serbest, o yüzden gerekçe burada durabiliyor.
 *
 * Biçim/stil kuralları bilerek YOK. Gürültülü bir denetim görmezden gelinir;
 * bunun okunmaya değer kalması gerekiyor.
 *
 * Çalıştırmak için:  npm run lint:crash
 */
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['react', 'react-hooks'],
  settings: { react: { version: 'detect' } },
  globals: {
    React: 'readonly',
    JSX: 'readonly',
    google: 'readonly',
    mapboxgl: 'readonly',
    Pusher: 'readonly',
    Echo: 'readonly',
    gtag: 'readonly',
    dataLayer: 'readonly',
  },
  ignorePatterns: ['node_modules/', '.next/', 'build/', 'backend/', 'public/'],
  rules: {
    // Canlıyı çökerten hata bu kuralla yakalanır.
    'no-undef': 'error',
    'react/jsx-no-undef': 'error',
    // Koşullu çağrılan hook, render sırasında sırayı bozup çökertir.
    'react-hooks/rules-of-hooks': 'error',
    'no-dupe-keys': 'error',
    'no-dupe-args': 'error',
    'no-dupe-class-members': 'error',
    'no-const-assign': 'error',
    'no-func-assign': 'error',
    'no-import-assign': 'error',
    'no-obj-calls': 'error',
    'no-setter-return': 'error',
    'no-unsafe-negation': 'error',
    'no-unsafe-optional-chaining': 'error',
    'no-unreachable': 'error',
    'no-cond-assign': 'error',
    'use-isnan': 'error',
    'valid-typeof': 'error',
  },
};
