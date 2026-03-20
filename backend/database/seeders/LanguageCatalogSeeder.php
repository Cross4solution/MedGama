<?php

namespace Database\Seeders;

use App\Models\LanguageCatalog;
use Illuminate\Database\Seeder;

class LanguageCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $languages = [
            // ── Popular (top 15) ──
            ['code' => 'tr', 'name' => ['en' => 'Turkish',     'tr' => 'Türkçe'],      'native_name' => 'Türkçe',      'is_popular' => true, 'display_order' => 1],
            ['code' => 'en', 'name' => ['en' => 'English',     'tr' => 'İngilizce'],    'native_name' => 'English',     'is_popular' => true, 'display_order' => 2],
            ['code' => 'de', 'name' => ['en' => 'German',      'tr' => 'Almanca'],      'native_name' => 'Deutsch',     'is_popular' => true, 'display_order' => 3],
            ['code' => 'ar', 'name' => ['en' => 'Arabic',      'tr' => 'Arapça'],       'native_name' => 'العربية',     'is_popular' => true, 'display_order' => 4],
            ['code' => 'ru', 'name' => ['en' => 'Russian',     'tr' => 'Rusça'],        'native_name' => 'Русский',     'is_popular' => true, 'display_order' => 5],
            ['code' => 'fr', 'name' => ['en' => 'French',      'tr' => 'Fransızca'],    'native_name' => 'Français',    'is_popular' => true, 'display_order' => 6],
            ['code' => 'es', 'name' => ['en' => 'Spanish',     'tr' => 'İspanyolca'],   'native_name' => 'Español',     'is_popular' => true, 'display_order' => 7],
            ['code' => 'it', 'name' => ['en' => 'Italian',     'tr' => 'İtalyanca'],    'native_name' => 'Italiano',    'is_popular' => true, 'display_order' => 8],
            ['code' => 'pt', 'name' => ['en' => 'Portuguese',  'tr' => 'Portekizce'],   'native_name' => 'Português',   'is_popular' => true, 'display_order' => 9],
            ['code' => 'zh', 'name' => ['en' => 'Chinese',     'tr' => 'Çince'],        'native_name' => '中文',         'is_popular' => true, 'display_order' => 10],
            ['code' => 'ja', 'name' => ['en' => 'Japanese',    'tr' => 'Japonca'],      'native_name' => '日本語',       'is_popular' => true, 'display_order' => 11],
            ['code' => 'ko', 'name' => ['en' => 'Korean',      'tr' => 'Korece'],       'native_name' => '한국어',       'is_popular' => true, 'display_order' => 12],
            ['code' => 'hi', 'name' => ['en' => 'Hindi',       'tr' => 'Hintçe'],       'native_name' => 'हिन्दी',       'is_popular' => true, 'display_order' => 13],
            ['code' => 'fa', 'name' => ['en' => 'Persian',     'tr' => 'Farsça'],       'native_name' => 'فارسی',       'is_popular' => true, 'display_order' => 14],
            ['code' => 'az', 'name' => ['en' => 'Azerbaijani', 'tr' => 'Azerice'],      'native_name' => 'Azərbaycan',  'is_popular' => true, 'display_order' => 15],

            // ── Remaining world languages ──
            ['code' => 'nl', 'name' => ['en' => 'Dutch',        'tr' => 'Hollandaca'],    'native_name' => 'Nederlands',    'is_popular' => false, 'display_order' => 20],
            ['code' => 'pl', 'name' => ['en' => 'Polish',       'tr' => 'Lehçe'],         'native_name' => 'Polski',        'is_popular' => false, 'display_order' => 21],
            ['code' => 'uk', 'name' => ['en' => 'Ukrainian',    'tr' => 'Ukraynaca'],     'native_name' => 'Українська',    'is_popular' => false, 'display_order' => 22],
            ['code' => 'ro', 'name' => ['en' => 'Romanian',     'tr' => 'Romence'],       'native_name' => 'Română',        'is_popular' => false, 'display_order' => 23],
            ['code' => 'el', 'name' => ['en' => 'Greek',        'tr' => 'Yunanca'],       'native_name' => 'Ελληνικά',      'is_popular' => false, 'display_order' => 24],
            ['code' => 'cs', 'name' => ['en' => 'Czech',        'tr' => 'Çekçe'],         'native_name' => 'Čeština',       'is_popular' => false, 'display_order' => 25],
            ['code' => 'sv', 'name' => ['en' => 'Swedish',      'tr' => 'İsveççe'],       'native_name' => 'Svenska',       'is_popular' => false, 'display_order' => 26],
            ['code' => 'da', 'name' => ['en' => 'Danish',       'tr' => 'Danca'],         'native_name' => 'Dansk',         'is_popular' => false, 'display_order' => 27],
            ['code' => 'no', 'name' => ['en' => 'Norwegian',    'tr' => 'Norveççe'],      'native_name' => 'Norsk',         'is_popular' => false, 'display_order' => 28],
            ['code' => 'fi', 'name' => ['en' => 'Finnish',      'tr' => 'Fince'],         'native_name' => 'Suomi',         'is_popular' => false, 'display_order' => 29],
            ['code' => 'hu', 'name' => ['en' => 'Hungarian',    'tr' => 'Macarca'],       'native_name' => 'Magyar',        'is_popular' => false, 'display_order' => 30],
            ['code' => 'bg', 'name' => ['en' => 'Bulgarian',    'tr' => 'Bulgarca'],      'native_name' => 'Български',     'is_popular' => false, 'display_order' => 31],
            ['code' => 'hr', 'name' => ['en' => 'Croatian',     'tr' => 'Hırvatça'],      'native_name' => 'Hrvatski',      'is_popular' => false, 'display_order' => 32],
            ['code' => 'sr', 'name' => ['en' => 'Serbian',      'tr' => 'Sırpça'],        'native_name' => 'Српски',        'is_popular' => false, 'display_order' => 33],
            ['code' => 'sk', 'name' => ['en' => 'Slovak',       'tr' => 'Slovakça'],      'native_name' => 'Slovenčina',    'is_popular' => false, 'display_order' => 34],
            ['code' => 'sl', 'name' => ['en' => 'Slovenian',    'tr' => 'Slovence'],      'native_name' => 'Slovenščina',   'is_popular' => false, 'display_order' => 35],
            ['code' => 'lt', 'name' => ['en' => 'Lithuanian',   'tr' => 'Litvanca'],      'native_name' => 'Lietuvių',      'is_popular' => false, 'display_order' => 36],
            ['code' => 'lv', 'name' => ['en' => 'Latvian',      'tr' => 'Letonca'],       'native_name' => 'Latviešu',      'is_popular' => false, 'display_order' => 37],
            ['code' => 'et', 'name' => ['en' => 'Estonian',     'tr' => 'Estonca'],       'native_name' => 'Eesti',         'is_popular' => false, 'display_order' => 38],
            ['code' => 'ka', 'name' => ['en' => 'Georgian',     'tr' => 'Gürcüce'],       'native_name' => 'ქართული',      'is_popular' => false, 'display_order' => 39],
            ['code' => 'hy', 'name' => ['en' => 'Armenian',     'tr' => 'Ermenice'],      'native_name' => 'Հայերեն',       'is_popular' => false, 'display_order' => 40],
            ['code' => 'he', 'name' => ['en' => 'Hebrew',       'tr' => 'İbranice'],      'native_name' => 'עברית',         'is_popular' => false, 'display_order' => 41],
            ['code' => 'th', 'name' => ['en' => 'Thai',         'tr' => 'Tayca'],         'native_name' => 'ไทย',           'is_popular' => false, 'display_order' => 42],
            ['code' => 'vi', 'name' => ['en' => 'Vietnamese',   'tr' => 'Vietnamca'],     'native_name' => 'Tiếng Việt',    'is_popular' => false, 'display_order' => 43],
            ['code' => 'id', 'name' => ['en' => 'Indonesian',   'tr' => 'Endonezce'],     'native_name' => 'Bahasa Indonesia', 'is_popular' => false, 'display_order' => 44],
            ['code' => 'ms', 'name' => ['en' => 'Malay',        'tr' => 'Malayca'],       'native_name' => 'Bahasa Melayu', 'is_popular' => false, 'display_order' => 45],
            ['code' => 'tl', 'name' => ['en' => 'Filipino',     'tr' => 'Filipince'],     'native_name' => 'Filipino',      'is_popular' => false, 'display_order' => 46],
            ['code' => 'bn', 'name' => ['en' => 'Bengali',      'tr' => 'Bengalce'],      'native_name' => 'বাংলা',         'is_popular' => false, 'display_order' => 47],
            ['code' => 'ur', 'name' => ['en' => 'Urdu',         'tr' => 'Urduca'],        'native_name' => 'اردو',          'is_popular' => false, 'display_order' => 48],
            ['code' => 'ta', 'name' => ['en' => 'Tamil',        'tr' => 'Tamilce'],       'native_name' => 'தமிழ்',         'is_popular' => false, 'display_order' => 49],
            ['code' => 'te', 'name' => ['en' => 'Telugu',       'tr' => 'Telugu'],        'native_name' => 'తెలుగు',        'is_popular' => false, 'display_order' => 50],
            ['code' => 'mr', 'name' => ['en' => 'Marathi',      'tr' => 'Marathi'],       'native_name' => 'मराठी',          'is_popular' => false, 'display_order' => 51],
            ['code' => 'sw', 'name' => ['en' => 'Swahili',      'tr' => 'Svahili'],       'native_name' => 'Kiswahili',     'is_popular' => false, 'display_order' => 52],
            ['code' => 'am', 'name' => ['en' => 'Amharic',      'tr' => 'Amharca'],       'native_name' => 'አማርኛ',          'is_popular' => false, 'display_order' => 53],
            ['code' => 'ha', 'name' => ['en' => 'Hausa',        'tr' => 'Hausa'],         'native_name' => 'Hausa',         'is_popular' => false, 'display_order' => 54],
            ['code' => 'yo', 'name' => ['en' => 'Yoruba',       'tr' => 'Yoruba'],        'native_name' => 'Yorùbá',        'is_popular' => false, 'display_order' => 55],
            ['code' => 'zu', 'name' => ['en' => 'Zulu',         'tr' => 'Zuluca'],        'native_name' => 'isiZulu',       'is_popular' => false, 'display_order' => 56],
            ['code' => 'uz', 'name' => ['en' => 'Uzbek',        'tr' => 'Özbekçe'],       'native_name' => 'Oʻzbek',       'is_popular' => false, 'display_order' => 57],
            ['code' => 'kk', 'name' => ['en' => 'Kazakh',       'tr' => 'Kazakça'],       'native_name' => 'Қазақ',         'is_popular' => false, 'display_order' => 58],
            ['code' => 'tk', 'name' => ['en' => 'Turkmen',      'tr' => 'Türkmence'],     'native_name' => 'Türkmen',       'is_popular' => false, 'display_order' => 59],
            ['code' => 'ky', 'name' => ['en' => 'Kyrgyz',       'tr' => 'Kırgızca'],      'native_name' => 'Кыргызча',      'is_popular' => false, 'display_order' => 60],
            ['code' => 'ku', 'name' => ['en' => 'Kurdish',      'tr' => 'Kürtçe'],        'native_name' => 'Kurdî',         'is_popular' => false, 'display_order' => 61],
            ['code' => 'ps', 'name' => ['en' => 'Pashto',       'tr' => 'Peştuca'],       'native_name' => 'پښتو',          'is_popular' => false, 'display_order' => 62],
            ['code' => 'sq', 'name' => ['en' => 'Albanian',     'tr' => 'Arnavutça'],     'native_name' => 'Shqip',         'is_popular' => false, 'display_order' => 63],
            ['code' => 'bs', 'name' => ['en' => 'Bosnian',      'tr' => 'Boşnakça'],      'native_name' => 'Bosanski',      'is_popular' => false, 'display_order' => 64],
            ['code' => 'mk', 'name' => ['en' => 'Macedonian',   'tr' => 'Makedonca'],     'native_name' => 'Македонски',    'is_popular' => false, 'display_order' => 65],
            ['code' => 'mn', 'name' => ['en' => 'Mongolian',    'tr' => 'Moğolca'],       'native_name' => 'Монгол',        'is_popular' => false, 'display_order' => 66],
        ];

        foreach ($languages as $lang) {
            LanguageCatalog::updateOrCreate(
                ['code' => $lang['code']],
                $lang,
            );
        }
    }
}
