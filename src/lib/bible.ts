import kjvData from '../../assets/bible/kjv.json';
import webData from '../../assets/bible/web.json';

export interface Verse {
  verse: number;
  text: string;
}

export interface Chapter {
  chapter: number;
  verses: Verse[];
}

export interface Book {
  id: string;
  name: string;
  shortName: string;
  chapterCount: number;
  chapters: Chapter[];
}

export interface BibleData {
  translation: string;
  title: string;
  books: Book[];
}

const BIBLE_MAP: Record<'KJV' | 'WEB', BibleData> = {
  KJV: kjvData as unknown as BibleData,
  WEB: webData as unknown as BibleData,
};

export function getBible(translation: 'KJV' | 'WEB' = 'WEB'): BibleData {
  return BIBLE_MAP[translation] || BIBLE_MAP.WEB;
}

export function getBooks(translation: 'KJV' | 'WEB' = 'WEB') {
  const bible = getBible(translation);
  return bible.books.map((b, idx) => ({
    index: idx,
    id: b.id,
    name: b.name,
    shortName: b.shortName,
    chapterCount: b.chapterCount,
  }));
}

export function getChapter(
  translation: 'KJV' | 'WEB',
  bookIndex: number,
  chapterNumber: number
): { bookName: string; shortName: string; chapter: number; totalChapters: number; verses: Verse[] } | null {
  const bible = getBible(translation);
  const book = bible.books[bookIndex];
  if (!book) return null;

  const ch = book.chapters.find((c) => c.chapter === chapterNumber) || book.chapters[0];
  if (!ch) return null;

  return {
    bookName: book.name,
    shortName: book.shortName,
    chapter: ch.chapter,
    totalChapters: book.chapterCount,
    verses: ch.verses,
  };
}

// Fixed rotation for daily verse
// Curated inspirational verses
const INSPIRATIONAL_VERSES = [
  { book: 'Psalms', chapter: 23, verseNum: 1 },
  { book: 'John', chapter: 3, verseNum: 16 },
  { book: 'Philippians', chapter: 4, verseNum: 13 },
  { book: 'Proverbs', chapter: 3, verseNum: 5 },
  { book: 'Romans', chapter: 8, verseNum: 28 },
  { book: 'Isaiah', chapter: 40, verseNum: 31 },
  { book: 'Jeremiah', chapter: 29, verseNum: 11 },
  { book: 'Joshua', chapter: 1, verseNum: 9 },
  { book: 'Matthew', chapter: 6, verseNum: 33 },
  { book: 'Matthew', chapter: 11, verseNum: 28 },
  { book: '2 Corinthians', chapter: 12, verseNum: 9 },
  { book: 'Galatians', chapter: 5, verseNum: 22 },
  { book: 'Ephesians', chapter: 2, verseNum: 8 },
  { book: 'Hebrews', chapter: 11, verseNum: 1 },
  { book: 'James', chapter: 1, verseNum: 5 },
  { book: '1 Peter', chapter: 5, verseNum: 7 },
  { book: 'Psalms', chapter: 46, verseNum: 1 },
  { book: 'Psalms', chapter: 119, verseNum: 105 },
  { book: 'Romans', chapter: 12, verseNum: 2 },
  { book: 'Proverbs', chapter: 16, verseNum: 3 },
];

export interface DailyVerseItem {
  bookName: string;
  chapter: number;
  verseNum: number;
  text: string;
  index: number;
}

function resolveVerseItem(
  translation: 'KJV' | 'WEB',
  index: number
): DailyVerseItem {
  const bible = getBible(translation);
  const safeIdx = ((index % INSPIRATIONAL_VERSES.length) + INSPIRATIONAL_VERSES.length) % INSPIRATIONAL_VERSES.length;
  const pick = INSPIRATIONAL_VERSES[safeIdx];

  const book = bible.books.find(
    (b) => b.name.toLowerCase() === pick.book.toLowerCase() || b.id.toLowerCase() === pick.book.toLowerCase()
  ) || bible.books[0];

  const chapter = book.chapters.find((c) => c.chapter === pick.chapter) || book.chapters[0];
  const verse = chapter?.verses.find((v) => v.verse === pick.verseNum) || chapter?.verses[0];

  return {
    bookName: book.name,
    chapter: chapter?.chapter ?? 1,
    verseNum: verse?.verse ?? 1,
    text: verse?.text ?? 'In the beginning God created the heaven and the earth.',
    index: safeIdx,
  };
}

export function getDailyVerse(translation: 'KJV' | 'WEB' = 'WEB'): DailyVerseItem {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
  );
  return resolveVerseItem(translation, dayOfYear);
}

export function getRandomVerse(
  translation: 'KJV' | 'WEB' = 'WEB',
  excludeIndex?: number
): DailyVerseItem {
  let nextIdx = Math.floor(Math.random() * INSPIRATIONAL_VERSES.length);
  if (excludeIndex !== undefined && nextIdx === excludeIndex && INSPIRATIONAL_VERSES.length > 1) {
    nextIdx = (nextIdx + 1) % INSPIRATIONAL_VERSES.length;
  }
  return resolveVerseItem(translation, nextIdx);
}

