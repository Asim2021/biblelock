/**
 * ============================================================================
 * BIBLE TRANSLATION CATALOG
 * ============================================================================
 *
 * HOW TO CHANGE THIS TO YOUR OWN REPOSITORY:
 * ----------------------------------------------------------------------------
 * 1. Create a repository on GitHub (e.g. https://github.com/YourUsername/bible-translations).
 * 2. Put your translation JSON files in that repo (e.g. in a `/formats/json` folder).

 * ============================================================================
 */

export const BIBLE_CATALOG_BASE_URL =
	'https://raw.githubusercontent.com/Asim2021/bible-translations/main/formats/json/';

export interface BibleCatalogItem {
	code: string;
	name: string;
	nativeName: string;
	language: string;
	languageCode: string;
	isPreloaded?: boolean;
	filename: string;
	sizeFormatted: string;
	description: string;
}

export const BIBLE_CATALOG: BibleCatalogItem[] = [
	// --- PRE-LOADED IN APP BUNDLE ---
	{
		code: 'WEB',
		name: 'World English Bible',
		nativeName: 'World English Bible',
		language: 'English',
		languageCode: 'en',
		isPreloaded: true,
		filename: 'web.json',
		sizeFormatted: 'Pre-loaded',
		description: 'Modern public domain English translation based on the ASV.',
	},
	{
		code: 'KJV',
		name: 'King James Version',
		nativeName: 'King James Version',
		language: 'English',
		languageCode: 'en',
		isPreloaded: true,
		filename: 'kjv.json',
		sizeFormatted: 'Pre-loaded',
		description: 'Historic 1611 English translation with poetic cadence.',
	},

	// --- DOWNLOADABLE INTERNATIONAL TRANSLATIONS ---
	{
		code: 'SpaRV',
		name: 'Reina-Valera 1909',
		nativeName: 'Reina Valera',
		language: 'Spanish',
		languageCode: 'es',
		filename: 'SpaRV.json',
		sizeFormatted: '5.2 MB',
		description: 'La Biblia más leída en el mundo de habla hispana.',
	},
	{
		code: 'FreCrampon',
		name: 'Bible Augustin Crampon (1923)',
		nativeName: 'Français (Crampon)',
		language: 'French',
		languageCode: 'fr',
		filename: 'FreCrampon.json',
		sizeFormatted: '5.3 MB',
		description: 'Traduction française catholique réputée pour sa fidélité.',
	},
	{
		code: 'GerBoLut',
		name: 'Luther Bibel (1545)',
		nativeName: 'Lutherbibel',
		language: 'German',
		languageCode: 'de',
		filename: 'GerBoLut.json',
		sizeFormatted: '5.1 MB',
		description: 'Klassische deutsche Übersetzung von Martin Luther.',
	},
	{
		code: 'PorBLivre',
		name: 'Bíblia Livre (2016)',
		nativeName: 'Bíblia Livre',
		language: 'Portuguese',
		languageCode: 'pt',
		filename: 'PorBLivre.json',
		sizeFormatted: '5.1 MB',
		description: 'Tradução moderna e precisa em português de domínio público.',
	},
	{
		code: 'TagAngBiblia',
		name: 'Ang Biblia (1905)',
		nativeName: 'Ang Biblia',
		language: 'Tagalog',
		languageCode: 'tl',
		filename: 'TagAngBiblia.json',
		sizeFormatted: '5.2 MB',
		description: 'Ang pinakakilalang klasikong salin ng Banal na Kasulatan sa Tagalog.',
	},
	{
		code: 'ChiUn',
		name: 'Chinese Union Version (Traditional)',
		nativeName: '和合本聖經',
		language: 'Chinese',
		languageCode: 'zh',
		filename: 'ChiUn.json',
		sizeFormatted: '4.8 MB',
		description: '華人基督徒最廣泛使用的中文聖經譯本。',
	},
	{
		code: 'RusSynodal',
		name: 'Russian Synodal Bible',
		nativeName: 'Синодальный перевод',
		language: 'Russian',
		languageCode: 'ru',
		filename: 'RusSynodal.json',
		sizeFormatted: '5.4 MB',
		description: 'Общепринятый и авторитетный русский перевод Священного Писания.',
	},
	{
		code: 'UkrOgienko',
		name: 'Ukrainian Bible (Ogienko)',
		nativeName: 'Біблія Івана Огієнка',
		language: 'Ukrainian',
		languageCode: 'uk',
		filename: 'UkrOgienko.json',
		sizeFormatted: '5.3 MB',
		description: 'Найбільш поширений канонічний український переклад.',
	},
	{
		code: 'Viet',
		name: 'Vietnamese Bible (1934)',
		nativeName: 'Bản Dịch Truyền Thống',
		language: 'Vietnamese',
		languageCode: 'vi',
		filename: 'Viet.json',
		sizeFormatted: '5.1 MB',
		description: 'Bản dịch Kinh Thánh tiếng Việt truyền thống được yêu mến.',
	},
	{
		code: 'KorHKJV',
		name: 'Korean Hangul KJV',
		nativeName: '한국어 킹제임스',
		language: 'Korean',
		languageCode: 'ko',
		filename: 'KorHKJV.json',
		sizeFormatted: '5.4 MB',
		description: '한국어 성경 번역본.',
	},
	{
		code: 'DutSVV',
		name: 'Statenvertaling (1637)',
		nativeName: 'Statenvertaling',
		language: 'Dutch',
		languageCode: 'nl',
		filename: 'DutSVV.json',
		sizeFormatted: '5.3 MB',
		description: 'De gezaghebbende Nederlandse klassieke bijbelvertaling.',
	},
	{
		code: 'PolGdanska',
		name: 'Biblia Gdańska (1632)',
		nativeName: 'Biblia Gdańska',
		language: 'Polish',
		languageCode: 'pl',
		filename: 'PolGdanska.json',
		sizeFormatted: '5.2 MB',
		description: 'Jeden z najważniejszych historycznych polskich przekładów biblijnych.',
	},
	{
		code: 'ASV',
		name: 'American Standard Version (1901)',
		nativeName: 'American Standard',
		language: 'English',
		languageCode: 'en',
		filename: 'ASV.json',
		sizeFormatted: '5.0 MB',
		description: 'Highly literal public domain English revision of the KJV.',
	},
	{
		code: 'BBE',
		name: 'Bible in Basic English (1949)',
		nativeName: 'Basic English',
		language: 'English',
		languageCode: 'en',
		filename: 'BBE.json',
		sizeFormatted: '4.7 MB',
		description: 'Simplified vocabulary designed for ESL and quick reading.',
	},
	{
		code: 'YLT',
		name: "Young's Literal Translation (1898)",
		nativeName: "Young's Literal",
		language: 'English',
		languageCode: 'en',
		filename: 'YLT.json',
		sizeFormatted: '5.1 MB',
		description: 'Strict word-for-word translation preserving Hebrew/Greek idioms.',
	},
	{
		code: 'Vulgate',
		name: 'Biblia Sacra Vulgata',
		nativeName: 'Vulgata Latina',
		language: 'Latin',
		languageCode: 'la',
		filename: 'Vulgate.json',
		sizeFormatted: '5.6 MB',
		description: 'Classic 4th-century Latin translation prepared by St. Jerome.',
	},
	{
		code: 'BSB',
		name: 'Berean Standard Bible',
		nativeName: 'Berean Standard',
		language: 'English',
		languageCode: 'en',
		filename: 'BSB.json',
		sizeFormatted: '4.9 MB',
		description: 'Modern, highly accurate, poetic English public domain translation.',
	},
	{
		code: 'JapKougo',
		name: 'Japanese Kougo-yaku (1955)',
		nativeName: '口語訳聖書',
		language: 'Japanese',
		languageCode: 'ja',
		filename: 'JapKougo.json',
		sizeFormatted: '5.2 MB',
		description: '最も親しまれている日本語の口語訳聖書。',
	},
	{
		code: 'Swe1917',
		name: 'Swedish Bible (1917)',
		nativeName: '1917 års kyrkobibel',
		language: 'Swedish',
		languageCode: 'sv',
		filename: 'Swe1917.json',
		sizeFormatted: '5.2 MB',
		description: 'Den officiella svenska kyrkobibeln från 1917.',
	},
	{
		code: 'GreVamvas',
		name: "Modern Greek (Vamvas's 1850)",
		nativeName: 'Νεοελληνική Μετάφραση',
		language: 'Greek',
		languageCode: 'el',
		filename: 'GreVamvas.json',
		sizeFormatted: '5.5 MB',
		description: 'Η κλασική μετάφραση του Νεοφύτου Βάμβα στη νεοελληνική.',
	},
	{
		code: 'HebModern',
		name: 'Modern Hebrew Bible',
		nativeName: 'תנ״ך והברית החדשה',
		language: 'Hebrew',
		languageCode: 'he',
		filename: 'HebModern.json',
		sizeFormatted: '5.3 MB',
		description: 'Tanakh and New Testament in Modern Hebrew.',
	},
	{
		code: 'ThaiKJV',
		name: 'Thai King James Version',
		nativeName: 'พระคัมภีร์ภาษาไทย',
		language: 'Thai',
		languageCode: 'th',
		filename: 'ThaiKJV.json',
		sizeFormatted: '5.4 MB',
		description: 'ฉบับแปลคิงเจมส์ภาษาไทยเพื่อการศึกษา.',
	},
];

/**
 * Returns full download URL for a catalog item
 */
export function getCatalogItemDownloadUrl(item: BibleCatalogItem): string {
	if (item.isPreloaded) return '';
	return `${BIBLE_CATALOG_BASE_URL}${item.filename}`;
}
