import { useState, useEffect, useCallback } from 'react';
import kjvData from '../../assets/bible/kjv.json';
import webData from '../../assets/bible/web.json';
import {
  getBibleTranslation,
  setBibleTranslation,
  subscribeBibleTranslation,
  ScrollPosition,
} from './mmkv';
import { MoodVerseRef, MOOD_VERSES, MoodKey } from '../data/moodVerses';

const BOOK_INDEX_MAP: Record<string, number> = {};
(webData as unknown as BibleData).books.forEach((b, idx) => {
  BOOK_INDEX_MAP[b.name] = idx;
});

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

export interface BookMetadata {
  index: number;
  id: string;
  name: string;
  shortName: string;
  chapterCount: number;
}

const BOOKS_CACHE: Record<'KJV' | 'WEB', BookMetadata[]> = {
  KJV: (kjvData as unknown as BibleData).books.map((b, idx) => ({
    index: idx,
    id: b.id,
    name: b.name,
    shortName: b.shortName,
    chapterCount: b.chapterCount,
  })),
  WEB: (webData as unknown as BibleData).books.map((b, idx) => ({
    index: idx,
    id: b.id,
    name: b.name,
    shortName: b.shortName,
    chapterCount: b.chapterCount,
  })),
};

export function getBible(translation: 'KJV' | 'WEB' = 'WEB'): BibleData {
  return BIBLE_MAP[translation] || BIBLE_MAP.WEB;
}

export function getBooks(translation: 'KJV' | 'WEB' = 'WEB'): BookMetadata[] {
  return BOOKS_CACHE[translation] || BOOKS_CACHE.WEB;
}

export function getChapter(
  translation: 'KJV' | 'WEB',
  bookIndex: number,
  chapterNumber: number
): { bookName: string; shortName: string; chapter: number; totalChapters: number; verses: Verse[] } | null {
  const bible = getBible(translation);
  const book = bible.books[bookIndex];
  if (!book) return null;

  // Direct 0-indexed lookup for 1-indexed chapters before falling back to array search
  const direct = book.chapters[chapterNumber - 1];
  const ch = (direct && direct.chapter === chapterNumber)
    ? direct
    : (book.chapters.find((c) => c.chapter === chapterNumber) || book.chapters[0]);
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
export const INSPIRATIONAL_VERSES = [
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

function buildInspirationalCache(bible: BibleData): DailyVerseItem[] {
  return INSPIRATIONAL_VERSES.map((pick, safeIdx) => {
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
  });
}

const RESOLVED_INSPIRATIONAL_CACHE: Record<'KJV' | 'WEB', DailyVerseItem[]> = {
  KJV: buildInspirationalCache(kjvData as unknown as BibleData),
  WEB: buildInspirationalCache(webData as unknown as BibleData),
};

export function resolveVerseItem(
  translation: 'KJV' | 'WEB',
  index: number
): DailyVerseItem {
  const safeIdx = ((index % INSPIRATIONAL_VERSES.length) + INSPIRATIONAL_VERSES.length) % INSPIRATIONAL_VERSES.length;
  const list = RESOLVED_INSPIRATIONAL_CACHE[translation] || RESOLVED_INSPIRATIONAL_CACHE.WEB;
  return list[safeIdx];
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

export function useBibleTranslation() {
  const [translation, setTranslation] = useState<'WEB' | 'KJV'>(getBibleTranslation);

  useEffect(() => {
    return subscribeBibleTranslation(setTranslation);
  }, []);

  const changeTranslation = useCallback((tr: 'WEB' | 'KJV') => {
    setBibleTranslation(tr);
  }, []);

  return [translation, changeTranslation] as const;
}

// Bible Scroll Feed Utilities
export interface ScrollVerseItem {
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  position: ScrollPosition;
}

export function getVerseAtPosition(
  translation: 'KJV' | 'WEB',
  pos: ScrollPosition
): ScrollVerseItem | null {
  const data = BIBLE_MAP[translation] || BIBLE_MAP.WEB;
  const book = data.books[pos.bookIndex];
  if (!book) return null;
  const chapter = book.chapters[pos.chapterIndex];
  if (!chapter) return null;
  const verseObj = chapter.verses[pos.verseIndex];
  if (!verseObj) return null;

  return {
    bookName: book.name,
    chapter: chapter.chapter,
    verse: verseObj.verse,
    text: verseObj.text,
    position: pos,
  };
}

export function getNextPosition(
  translation: 'KJV' | 'WEB',
  pos: ScrollPosition
): ScrollPosition {
  const data = BIBLE_MAP[translation] || BIBLE_MAP.WEB;
  const book = data.books[pos.bookIndex];
  if (!book) return { bookIndex: 0, chapterIndex: 0, verseIndex: 0 };
  const chapter = book.chapters[pos.chapterIndex];
  if (!chapter) return { bookIndex: 0, chapterIndex: 0, verseIndex: 0 };

  // Next verse in current chapter?
  if (pos.verseIndex + 1 < chapter.verses.length) {
    return {
      bookIndex: pos.bookIndex,
      chapterIndex: pos.chapterIndex,
      verseIndex: pos.verseIndex + 1,
    };
  }

  // Next chapter in current book?
  if (pos.chapterIndex + 1 < book.chapters.length) {
    return {
      bookIndex: pos.bookIndex,
      chapterIndex: pos.chapterIndex + 1,
      verseIndex: 0,
    };
  }

  // Next book?
  if (pos.bookIndex + 1 < data.books.length) {
    return {
      bookIndex: pos.bookIndex + 1,
      chapterIndex: 0,
      verseIndex: 0,
    };
  }

  // Wrap back to Genesis 1:1
  return { bookIndex: 0, chapterIndex: 0, verseIndex: 0 };
}

let _flatVersePositions: ScrollPosition[] | null = null;

function ensureFlatVersePositions(translation: 'KJV' | 'WEB' = 'WEB'): ScrollPosition[] {
  if (_flatVersePositions !== null) return _flatVersePositions;
  const data = BIBLE_MAP[translation] || BIBLE_MAP.WEB;
  const positions: ScrollPosition[] = [];
  data.books.forEach((b, bIdx) => {
    b.chapters.forEach((c, cIdx) => {
      c.verses.forEach((_, vIdx) => {
        positions.push({
          bookIndex: bIdx,
          chapterIndex: cIdx,
          verseIndex: vIdx,
        });
      });
    });
  });
  _flatVersePositions = positions;
  return _flatVersePositions;
}

export function getRandomVerseFull(
  translation: 'KJV' | 'WEB' = 'WEB'
): ScrollVerseItem {
  const positions = ensureFlatVersePositions(translation);
  const randomIndex = Math.floor(Math.random() * positions.length);
  const pos = positions[randomIndex];
  const item = getVerseAtPosition(translation, pos);
  if (item) return item;
  return {
    bookName: 'John',
    chapter: 3,
    verse: 16,
    text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
    position: { bookIndex: 42, chapterIndex: 2, verseIndex: 15 },
  };
}

export function resolveMoodVerse(
  translation: 'KJV' | 'WEB',
  ref: MoodVerseRef
): ScrollVerseItem | null {
  const data = BIBLE_MAP[translation] || BIBLE_MAP.WEB;
  const bookIndex = BOOK_INDEX_MAP[ref.book] !== undefined
    ? BOOK_INDEX_MAP[ref.book]
    : data.books.findIndex((b) => b.name === ref.book);
  if (bookIndex === -1 || bookIndex === undefined) return null;
  const book = data.books[bookIndex];
  if (!book) return null;

  // Direct 0-indexed lookup for 1-indexed chapters before fallback
  const directChapter = book.chapters[ref.chapter - 1];
  const chapterIndex = (directChapter && directChapter.chapter === ref.chapter)
    ? ref.chapter - 1
    : book.chapters.findIndex((c) => c.chapter === ref.chapter);
  if (chapterIndex === -1) return null;
  const chapter = book.chapters[chapterIndex];
  if (!chapter) return null;

  // Direct 0-indexed lookup for 1-indexed verses before fallback
  const directVerse = chapter.verses[ref.verse - 1];
  const verseIndex = (directVerse && directVerse.verse === ref.verse)
    ? ref.verse - 1
    : chapter.verses.findIndex((v) => v.verse === ref.verse);
  if (verseIndex === -1) return null;
  const verseObj = chapter.verses[verseIndex];
  if (!verseObj) return null;

  return {
    bookName: book.name,
    chapter: chapter.chapter,
    verse: verseObj.verse,
    text: verseObj.text,
    position: { bookIndex, chapterIndex, verseIndex },
  };
}

// Pre-resolved in-memory lookup cache for all 13 mood categories across KJV and WEB
const RESOLVED_MOOD_CACHE: Record<
  'KJV' | 'WEB',
  Record<string, ScrollVerseItem[]>
> = {
  KJV: {},
  WEB: {},
};

for (const tr of ['KJV', 'WEB'] as const) {
  for (const [moodKey, refs] of Object.entries(MOOD_VERSES)) {
    RESOLVED_MOOD_CACHE[tr][moodKey] = refs
      .map((ref) => resolveMoodVerse(tr, ref))
      .filter((item): item is ScrollVerseItem => item !== null);
  }
}

export function getMoodVerses(
  translation: 'KJV' | 'WEB',
  mood: Exclude<MoodKey, 'all'>
): ScrollVerseItem[] {
  const trCache = RESOLVED_MOOD_CACHE[translation] || RESOLVED_MOOD_CACHE.WEB;
  return trCache[mood] || [];
}



