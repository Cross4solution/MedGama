# Medagama - Üçüncü Taraf Bileşen ve Lisans Envanteri

7 Eylül 2026, teslim tutanağının eki

## Kısaca

Teslim edilen kaynak kod, açık kaynak kütüphaneler kullanır. Aşağıda
sunucu tarafı (135 paket) ve arayüz (181 paket) bağımlılıkları
sürüm ve lisansıyla listelenmiştir. Tüm lisanslar ticari kullanıma izin
verir; kütüphaneler değiştirilmeden kullanıldığı için LGPL lisanslı
paketler de ek yükümlülük doğurmaz. Lisans metinleri her paketin kendi
klasöründedir (`vendor/`, `node_modules/`).

| Lisans | Paket sayısı |
|----------------------|------|
| MIT | 233 |
| BSD-3-Clause | 33 |
| Apache-2.0 | 22 |
| ISC | 15 |
| LGPL-3.0-or-later | 2 |
| BSD-3-Clause, GPL-2.0-only, GPL-3.0-only | 2 |
| LGPL-2.1 | 1 |
| LGPL-2.1-or-later | 1 |
| CC-BY-4.0 | 1 |
| (MPL-2.0 OR Apache-2.0) | 1 |
| (MIT AND Zlib) | 1 |
| MIT* | 1 |
| 0BSD | 1 |
| Unlicense | 1 |
| MIT AND ISC | 1 |

Dış hizmetler (kod bağımlılığı değil, Müşteri hesabıyla çalışır): Render,
Vercel, TiDB Cloud, OVH (görüşme ve alt yazı sunucusu), Sentry.

## Sunucu tarafı (PHP / Composer)

| Paket | Sürüm | Lisans |
|--------------------------|----------|--------------|
| barryvdh/laravel-dompdf | v3.1.1 | MIT |
| brick/math | 0.14.8 | MIT |
| carbonphp/carbon-doctrine-types | 3.2.0 | MIT |
| darkaonline/l5-swagger | 10.1.0 | MIT |
| dflydev/dot-access-data | v3.0.3 | MIT |
| doctrine/inflector | 2.1.0 | MIT |
| doctrine/lexer | 3.0.1 | MIT |
| dompdf/dompdf | v3.1.6 | LGPL-2.1 |
| dompdf/php-font-lib | 1.0.2 | LGPL-2.1-or-later |
| dompdf/php-svg-lib | 1.0.2 | LGPL-3.0-or-later |
| dragonmantank/cron-expression | v3.6.0 | MIT |
| egulias/email-validator | 4.0.4 | MIT |
| fakerphp/faker | v1.24.1 | MIT |
| filp/whoops | 2.18.4 | MIT |
| fruitcake/php-cors | v1.4.0 | MIT |
| graham-campbell/result-type | v1.1.4 | MIT |
| guzzlehttp/guzzle | 7.15.3 | MIT |
| guzzlehttp/promises | 2.5.2 | MIT |
| guzzlehttp/psr7 | 2.13.0 | MIT |
| guzzlehttp/uri-template | v1.0.10 | MIT |
| hamcrest/hamcrest-php | v2.1.1 | BSD-3-Clause |
| jean85/pretty-package-versions | 2.1.1 | MIT |
| laravel/framework | v12.66.0 | MIT |
| laravel/pail | v1.2.6 | MIT |
| laravel/pint | v1.27.1 | MIT |
| laravel/prompts | v0.3.22 | MIT |
| laravel/sail | v1.53.0 | MIT |
| laravel/sanctum | v4.3.1 | MIT |
| laravel/serializable-closure | v2.0.15 | MIT |
| laravel/tinker | v2.11.1 | MIT |
| league/commonmark | 2.10.0 | BSD-3-Clause |
| league/config | v1.2.0 | BSD-3-Clause |
| league/flysystem | 3.35.2 | MIT |
| league/flysystem-local | 3.31.0 | MIT |
| league/mime-type-detection | 1.17.0 | MIT |
| league/uri | 7.8.1 | MIT |
| league/uri-interfaces | 7.8.1 | MIT |
| masterminds/html5 | 2.10.1 | MIT |
| mockery/mockery | 1.6.12 | BSD-3-Clause |
| monolog/monolog | 3.10.0 | MIT |
| myclabs/deep-copy | 1.13.4 | MIT |
| nesbot/carbon | 3.13.2 | MIT |
| nette/schema | v1.3.5 | BSD-3-Clause, GPL-2.0-only, GPL-3.0-only |
| nette/utils | v4.1.5 | BSD-3-Clause, GPL-2.0-only, GPL-3.0-only |
| nikic/php-parser | v5.7.0 | BSD-3-Clause |
| nunomaduro/collision | v8.9.1 | MIT |
| nunomaduro/termwind | v2.4.0 | MIT |
| nyholm/psr7 | 1.8.2 | MIT |
| paragonie/sodium_compat | v2.5.2 | ISC |
| phar-io/manifest | 2.0.4 | BSD-3-Clause |
| phar-io/version | 3.2.1 | BSD-3-Clause |
| phpoption/phpoption | 1.9.5 | Apache-2.0 |
| phpstan/phpdoc-parser | 2.3.2 | MIT |
| phpunit/php-code-coverage | 11.0.12 | BSD-3-Clause |
| phpunit/php-file-iterator | 5.1.1 | BSD-3-Clause |
| phpunit/php-invoker | 5.0.1 | BSD-3-Clause |
| phpunit/php-text-template | 4.0.1 | BSD-3-Clause |
| phpunit/php-timer | 7.0.1 | BSD-3-Clause |
| phpunit/phpunit | 11.5.55 | BSD-3-Clause |
| psr/clock | 1.0.0 | MIT |
| psr/container | 2.0.2 | MIT |
| psr/event-dispatcher | 1.0.0 | MIT |
| psr/http-client | 1.0.3 | MIT |
| psr/http-factory | 1.1.0 | MIT |
| psr/http-message | 2.0 | MIT |
| psr/log | 3.0.2 | MIT |
| psr/simple-cache | 3.0.0 | MIT |
| psy/psysh | v0.12.20 | MIT |
| pusher/pusher-php-server | 7.2.7 | MIT |
| radebatz/type-info-extras | 1.0.6 | MIT |
| ralouphie/getallheaders | 3.0.3 | MIT |
| ramsey/collection | 2.1.1 | MIT |
| ramsey/uuid | 4.9.3 | MIT |
| resend/resend-laravel | v1.4.0 | MIT |
| resend/resend-php | v1.9.0 | MIT |
| sabberworm/php-css-parser | v9.4.0 | MIT |
| sebastian/cli-parser | 3.0.2 | BSD-3-Clause |
| sebastian/code-unit | 3.0.3 | BSD-3-Clause |
| sebastian/code-unit-reverse-lookup | 4.0.1 | BSD-3-Clause |
| sebastian/comparator | 6.3.3 | BSD-3-Clause |
| sebastian/complexity | 4.0.1 | BSD-3-Clause |
| sebastian/diff | 6.0.2 | BSD-3-Clause |
| sebastian/environment | 7.2.1 | BSD-3-Clause |
| sebastian/exporter | 6.3.2 | BSD-3-Clause |
| sebastian/global-state | 7.0.2 | BSD-3-Clause |
| sebastian/lines-of-code | 3.0.1 | BSD-3-Clause |
| sebastian/object-enumerator | 6.0.1 | BSD-3-Clause |
| sebastian/object-reflector | 4.0.1 | BSD-3-Clause |
| sebastian/recursion-context | 6.0.3 | BSD-3-Clause |
| sebastian/type | 5.1.3 | BSD-3-Clause |
| sebastian/version | 5.0.2 | BSD-3-Clause |
| sentry/sentry | 4.30.0 | MIT |
| sentry/sentry-laravel | 4.27.0 | MIT |
| staabm/side-effects-detector | 1.0.5 | MIT |
| swagger-api/swagger-ui | v5.31.2 | Apache-2.0 |
| symfony/clock | v7.4.8 | MIT |
| symfony/console | v7.4.16 | MIT |
| symfony/css-selector | v7.4.9 | MIT |
| symfony/deprecation-contracts | v3.7.1 | MIT |
| symfony/error-handler | v7.4.15 | MIT |
| symfony/event-dispatcher | v7.4.15 | MIT |
| symfony/event-dispatcher-contracts | v3.7.1 | MIT |
| symfony/finder | v7.4.14 | MIT |
| symfony/http-foundation | v7.4.16 | MIT |
| symfony/http-kernel | v7.4.16 | MIT |
| symfony/mailer | v7.4.15 | MIT |
| symfony/mime | v7.4.16 | MIT |
| symfony/options-resolver | v7.4.8 | MIT |
| symfony/polyfill-ctype | v1.37.0 | MIT |
| symfony/polyfill-intl-grapheme | v1.41.0 | MIT |
| symfony/polyfill-intl-idn | v1.38.1 | MIT |
| symfony/polyfill-intl-normalizer | v1.38.0 | MIT |
| symfony/polyfill-mbstring | v1.38.2 | MIT |
| symfony/polyfill-php80 | v1.37.0 | MIT |
| symfony/polyfill-php83 | v1.41.0 | MIT |
| symfony/polyfill-php84 | v1.38.1 | MIT |
| symfony/polyfill-php85 | v1.41.0 | MIT |
| symfony/polyfill-uuid | v1.37.0 | MIT |
| symfony/process | v7.4.13 | MIT |
| symfony/psr-http-message-bridge | v7.4.8 | MIT |
| symfony/routing | v7.4.15 | MIT |
| symfony/service-contracts | v3.7.1 | MIT |
| symfony/string | v7.4.15 | MIT |
| symfony/translation | v7.4.16 | MIT |
| symfony/translation-contracts | v3.7.1 | MIT |
| symfony/type-info | v7.4.4 | MIT |
| symfony/uid | v7.4.9 | MIT |
| symfony/var-dumper | v7.4.15 | MIT |
| symfony/yaml | v7.4.15 | MIT |
| thecodingmachine/safe | v3.4.0 | MIT |
| theseer/tokenizer | 1.3.1 | BSD-3-Clause |
| tijsverkoyen/css-to-inline-styles | v2.4.0 | BSD-3-Clause |
| vlucas/phpdotenv | v5.6.4 | BSD-3-Clause |
| voku/portable-ascii | 2.1.1 | MIT |
| zircote/swagger-php | 6.0.5 | Apache-2.0 |

## Arayüz (JavaScript / npm, yalnız üretim bağımlılıkları)

| Paket | Sürüm | Lisans |
|--------------------------|----------|--------------|
| @adobe/css-tools | 4.4.3 | MIT |
| @babel/code-frame | 7.27.1 | MIT |
| @babel/helper-validator-identifier | 7.27.1 | MIT |
| @babel/runtime | 7.28.6 | MIT |
| @fullcalendar/core | 6.1.15 | MIT |
| @fullcalendar/daygrid | 6.1.15 | MIT |
| @fullcalendar/interaction | 6.1.15 | MIT |
| @fullcalendar/react | 6.1.15 | MIT |
| @fullcalendar/timegrid | 6.1.15 | MIT |
| @img/colour | 1.1.0 | MIT |
| @img/sharp-darwin-arm64 | 0.35.4 | Apache-2.0 |
| @img/sharp-libvips-darwin-arm64 | 1.3.3 | LGPL-3.0-or-later |
| @next/env | 15.5.24 | MIT |
| @next/swc-darwin-arm64 | 15.5.24 | MIT |
| @playwright/test | 1.62.1 | Apache-2.0 |
| @reduxjs/toolkit | 2.11.2 | MIT |
| @remix-run/router | 1.23.4 | MIT |
| @standard-schema/spec | 1.1.0 | MIT |
| @standard-schema/utils | 0.3.0 | MIT |
| @swc/helpers | 0.5.15 | Apache-2.0 |
| @testing-library/dom | 10.4.0 | MIT |
| @testing-library/jest-dom | 6.6.3 | MIT |
| @testing-library/react | 16.3.0 | MIT |
| @testing-library/user-event | 13.5.0 | MIT |
| @types/aria-query | 5.0.4 | MIT |
| @types/d3-array | 3.2.2 | MIT |
| @types/d3-color | 3.1.3 | MIT |
| @types/d3-ease | 3.0.2 | MIT |
| @types/d3-interpolate | 3.0.4 | MIT |
| @types/d3-path | 3.1.1 | MIT |
| @types/d3-scale | 4.0.9 | MIT |
| @types/d3-shape | 3.1.8 | MIT |
| @types/d3-time | 3.0.4 | MIT |
| @types/d3-timer | 3.0.2 | MIT |
| @types/pako | 2.0.4 | MIT |
| @types/raf | 3.4.3 | MIT |
| @types/trusted-types | 2.0.7 | MIT |
| @types/use-sync-external-store | 0.0.6 | MIT |
| adler-32 | 1.3.1 | Apache-2.0 |
| agent-base | 6.0.2 | MIT |
| ansi-regex | 5.0.1 | MIT |
| ansi-styles | 4.3.0 | MIT |
| ansi-styles | 5.2.0 | MIT |
| aria-query | 5.3.0 | Apache-2.0 |
| asynckit | 0.4.0 | MIT |
| axios | 1.19.0 | MIT |
| base64-arraybuffer | 1.0.2 | MIT |
| call-bind-apply-helpers | 1.0.2 | MIT |
| caniuse-lite | 1.0.30001769 | CC-BY-4.0 |
| canvg | 3.0.11 | MIT |
| cfb | 1.2.2 | Apache-2.0 |
| chalk | 3.0.0 | MIT |
| chalk | 4.1.2 | MIT |
| client-only | 0.0.1 | MIT |
| clsx | 2.1.1 | MIT |
| codepage | 1.15.0 | Apache-2.0 |
| color-convert | 2.0.1 | MIT |
| color-name | 1.1.4 | MIT |
| combined-stream | 1.0.8 | MIT |
| core-js | 3.44.0 | MIT |
| crc-32 | 1.2.2 | Apache-2.0 |
| css-line-break | 2.1.0 | MIT |
| css.escape | 1.5.1 | MIT |
| d3-array | 3.2.4 | ISC |
| d3-color | 3.1.0 | ISC |
| d3-ease | 3.0.1 | BSD-3-Clause |
| d3-format | 3.1.2 | ISC |
| d3-interpolate | 3.0.1 | ISC |
| d3-path | 3.1.0 | ISC |
| d3-scale | 4.0.2 | ISC |
| d3-shape | 3.2.0 | ISC |
| d3-time-format | 4.1.0 | ISC |
| d3-time | 3.1.0 | ISC |
| d3-timer | 3.0.1 | ISC |
| debug | 4.4.1 | MIT |
| decimal.js-light | 2.5.1 | MIT |
| delayed-stream | 1.0.0 | MIT |
| dequal | 2.0.3 | MIT |
| detect-libc | 2.1.2 | Apache-2.0 |
| dom-accessibility-api | 0.5.16 | MIT |
| dom-accessibility-api | 0.6.3 | MIT |
| dompurify | 3.4.14 | (MPL-2.0 OR Apache-2.0) |
| dunder-proto | 1.0.1 | MIT |
| es-define-property | 1.0.1 | MIT |
| es-errors | 1.3.0 | MIT |
| es-object-atoms | 1.1.2 | MIT |
| es-set-tostringtag | 2.1.0 | MIT |
| es-toolkit | 1.45.1 | MIT |
| eventemitter3 | 5.0.4 | MIT |
| fast-png | 6.4.0 | MIT |
| fflate | 0.8.2 | MIT |
| follow-redirects | 1.16.0 | MIT |
| form-data | 4.0.6 | MIT |
| frac | 1.1.2 | Apache-2.0 |
| fsevents | 2.3.2 | MIT |
| function-bind | 1.1.2 | MIT |
| get-intrinsic | 1.3.0 | MIT |
| get-proto | 1.0.1 | MIT |
| gopd | 1.2.0 | MIT |
| has-flag | 4.0.0 | MIT |
| has-symbols | 1.1.0 | MIT |
| has-tostringtag | 1.0.2 | MIT |
| hasown | 2.0.4 | MIT |
| html-parse-stringify | 3.0.1 | MIT |
| html2canvas | 1.4.1 | MIT |
| https-proxy-agent | 5.0.1 | MIT |
| i18next-browser-languagedetector | 8.0.4 | MIT |
| i18next | 23.16.8 | MIT |
| immer | 10.2.0 | MIT |
| immer | 11.1.4 | MIT |
| indent-string | 4.0.0 | MIT |
| internmap | 2.0.3 | ISC |
| invariant | 2.2.4 | MIT |
| iobuffer | 5.4.0 | MIT |
| js-tokens | 4.0.0 | MIT |
| jspdf-autotable | 5.0.7 | MIT |
| jspdf | 4.2.1 | MIT |
| laravel-echo | 2.3.1 | MIT |
| lodash | 4.18.1 | MIT |
| loose-envify | 1.4.0 | MIT |
| lucide-react | 0.525.0 | ISC |
| lz-string | 1.5.0 | MIT |
| math-intrinsics | 1.1.0 | MIT |
| mime-db | 1.52.0 | MIT |
| mime-types | 2.1.35 | MIT |
| min-indent | 1.0.1 | MIT |
| ms | 2.1.3 | MIT |
| nanoid | 3.3.18 | MIT |
| next | 15.5.24 | MIT |
| pako | 2.1.0 | (MIT AND Zlib) |
| performance-now | 2.1.0 | MIT |
| picocolors | 1.1.1 | ISC |
| playwright-core | 1.62.1 | Apache-2.0 |
| playwright | 1.62.1 | Apache-2.0 |
| postcss | 8.4.31 | MIT |
| preact | 10.12.1 | MIT |
| pretty-format | 27.5.1 | MIT |
| proxy-from-env | 2.1.0 | MIT |
| pusher-js | 8.4.3 | MIT |
| raf | 3.4.1 | MIT |
| react-dom | 19.1.0 | MIT |
| react-fast-compare | 3.2.2 | MIT |
| react-helmet-async | 2.0.5 | Apache-2.0 |
| react-i18next | 15.4.1 | MIT |
| react-is | 17.0.2 | MIT |
| react-redux | 9.2.0 | MIT |
| react-router-dom | 6.30.6 | MIT |
| react-router | 6.30.6 | MIT |
| react-window-infinite-loader | 2.0.1 | MIT |
| react-window | 2.2.7 | MIT |
| react | 19.1.0 | MIT |
| recharts | 3.8.0 | MIT |
| redent | 3.0.0 | MIT |
| redux-thunk | 3.1.0 | MIT |
| redux | 5.0.1 | MIT |
| regenerator-runtime | 0.13.11 | MIT |
| reselect | 5.1.1 | MIT |
| rgbcolor | 1.0.1 | MIT* |
| scheduler | 0.26.0 | MIT |
| semver | 7.8.5 | ISC |
| shallowequal | 1.1.0 | MIT |
| sharp | 0.35.4 | Apache-2.0 |
| source-map-js | 1.2.1 | BSD-3-Clause |
| ssf | 0.11.2 | Apache-2.0 |
| stackblur-canvas | 2.7.0 | MIT |
| strip-indent | 3.0.0 | MIT |
| styled-jsx | 5.1.6 | MIT |
| supports-color | 7.2.0 | MIT |
| svg-pathdata | 6.0.3 | MIT |
| text-segmentation | 1.0.3 | MIT |
| tiny-invariant | 1.3.3 | MIT |
| tslib | 2.8.1 | 0BSD |
| tweetnacl | 1.0.3 | Unlicense |
| use-sync-external-store | 1.6.0 | MIT |
| utrie | 1.0.2 | MIT |
| victory-vendor | 37.3.6 | MIT AND ISC |
| void-elements | 3.1.0 | MIT |
| web-vitals | 2.1.4 | Apache-2.0 |
| wmf | 1.0.2 | Apache-2.0 |
| word | 0.3.0 | Apache-2.0 |
| xlsx | 0.18.5 | Apache-2.0 |
