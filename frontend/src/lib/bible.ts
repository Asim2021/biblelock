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
const INSPIRATIONAL_VERSES = [
  { bookIndex: 18, chapter: 23, verseNum: 1 }, // Psalm 23:1
  { bookIndex: 42, chapter: 3, verseNum: 16 }, // John 3:16
  { bookIndex: 49, chapter: 4, verseNum: 13 }, // Philippians 4:13
  { bookIndex: 19, chapter: 3, verseNum: 5 },  // Proverbs 3:5
  { bookIndex: 44, chapter: 8, verseNum: 28 }, // Romans 8:28
  { bookIndex: 22, chapter: 40, verseNum: 31 },// Isaiah 40:31
  { bookIndex: 23, chapter: 29, verseNum: 11 },// Jeremiah 29:11
];

export function getDailyVerse(translation: 'KJV' | 'WEB' = 'WEB'): {
  bookName: string;
  chapter: number;
  verseNum: number;
  text: string;
} {
  const bible = getBible(translation);
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
  );
  const pick = INSPIRATIONAL_VERSES[dayOfYear % INSPIRATIONAL_VERSES.length];

  const book = bible.books[pick.bookIndex] || bible.books[0];
  const chapter = book.chapters.find((c) => c.chapter === pick.chapter) || book.chapters[0];
  const verse = chapter?.verses.find((v) => v.verse === pick.verseNum) || chapter?.verses[0];

  return {
    bookName: book.name,
    chapter: chapter?.chapter ?? 1,
    verseNum: verse?.verse ?? 1,
    text: verse?.text ?? 'In the beginning God created the heaven and the earth.',
  };
}
