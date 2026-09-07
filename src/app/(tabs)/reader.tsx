import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { getBooks, getChapter, Verse } from '../../lib/bible';
import { useReadingTimer } from '../../lib/readingTimer';
import {
  getBibleTranslation,
  setBibleTranslation,
  getLastReadPosition,
  setLastReadPosition,
  saveBookmark,
  getBookmarks,
} from '../../lib/mmkv';
import { Button } from '../../components/Button';
import {
  Clock,
  Unlock,
  Sparkles,
  ChevronDown,
  Check,
  Bookmark as BookmarkIcon,
} from 'lucide-react-native';

export default function ReaderScreen() {
  const [isFocused, setIsFocused] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

  const timer = useReadingTimer(isFocused);
  const params = useLocalSearchParams<{
    book?: string;
    chapter?: string;
    verse?: string;
  }>();

  const [translation, setTranslationState] = useState<'WEB' | 'KJV'>(() =>
    getBibleTranslation()
  );

  const allBooks = getBooks(translation);

  // Initialize position from query params if passed, or stored MMKV last read position
  const [bookIndex, setBookIndex] = useState(() => {
    if (params.book) {
      const idx = allBooks.findIndex(
        (b) =>
          b.name.toLowerCase() === params.book?.toLowerCase() ||
          b.id.toLowerCase() === params.book?.toLowerCase()
      );
      if (idx !== -1) return idx;
    }
    const saved = getLastReadPosition();
    return saved.bookIndex < allBooks.length ? saved.bookIndex : 0;
  });

  const [chapterNumber, setChapterNumber] = useState(() => {
    if (params.chapter) {
      const ch = parseInt(params.chapter, 10);
      if (!isNaN(ch) && ch > 0) return ch;
    }
    const saved = getLastReadPosition();
    return saved.chapterNumber || 1;
  });

  const [targetVerse, setTargetVerse] = useState<number | null>(() => {
    if (params.verse) {
      const v = parseInt(params.verse, 10);
      return !isNaN(v) ? v : null;
    }
    return null;
  });

  const [bookmarkedVerses, setBookmarkedVerses] = useState<number[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [showBookModal, setShowBookModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const currentChapterData = getChapter(translation, bookIndex, chapterNumber);
  const currentBook = allBooks[bookIndex] || allBooks[0];

  // Refresh saved bookmarks for this chapter
  useEffect(() => {
    const list = getBookmarks();
    const chapterBookmarks = list
      .filter((b) => b.bookName === currentBook.name && b.chapterNumber === chapterNumber)
      .map((b) => b.verseNumber);
    setBookmarkedVerses(chapterBookmarks);
  }, [currentBook.name, chapterNumber]);

  // Handle incoming query parameter changes while on screen
  useEffect(() => {
    if (params.book) {
      const idx = allBooks.findIndex(
        (b) =>
          b.name.toLowerCase() === params.book?.toLowerCase() ||
          b.id.toLowerCase() === params.book?.toLowerCase()
      );
      if (idx !== -1) setBookIndex(idx);
    }
    if (params.chapter) {
      const ch = parseInt(params.chapter, 10);
      if (!isNaN(ch) && ch > 0) setChapterNumber(ch);
    }
    if (params.verse) {
      const v = parseInt(params.verse, 10);
      if (!isNaN(v)) setTargetVerse(v);
    }
  }, [params.book, params.chapter, params.verse]);

  // Persist current reading position whenever book or chapter changes
  useEffect(() => {
    if (currentBook) {
      setLastReadPosition({
        bookIndex,
        bookName: currentBook.name,
        chapterNumber,
        verseNumber: targetVerse || 1,
        updatedAt: Date.now(),
      });
    }
  }, [bookIndex, chapterNumber, currentBook?.name, targetVerse]);

  // Scroll to targeted verse if requested
  useEffect(() => {
    if (targetVerse && currentChapterData?.verses?.length) {
      const verseIdx = currentChapterData.verses.findIndex((v) => v.verse === targetVerse);
      if (verseIdx !== -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: verseIdx,
            animated: true,
            viewPosition: 0.2,
          });
        }, 300);
      }
    }
  }, [targetVerse, currentChapterData]);

  const handleToggleBookmarkVerse = (verseItem: Verse) => {
    const isBookmarked = bookmarkedVerses.includes(verseItem.verse);
    if (isBookmarked) {
      // Remove
      setBookmarkedVerses((prev) => prev.filter((v) => v !== verseItem.verse));
      setToastMessage(`Removed bookmark for ${currentBook.name} ${chapterNumber}:${verseItem.verse}`);
    } else {
      // Add
      saveBookmark({
        id: `bm_${Date.now()}_${verseItem.verse}`,
        title: `${currentBook.name} ${chapterNumber}:${verseItem.verse}`,
        bookIndex,
        bookName: currentBook.name,
        chapterNumber,
        verseNumber: verseItem.verse,
        verseText: verseItem.text,
        color: '#f5b800',
        createdAt: Date.now(),
      });
      setBookmarkedVerses((prev) => [...prev, verseItem.verse]);
      setToastMessage(`Bookmarked ${currentBook.name} ${chapterNumber}:${verseItem.verse}`);
    }
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Switch translation
  const handleToggleTranslation = (newTr: 'WEB' | 'KJV') => {
    setTranslationState(newTr);
    setBibleTranslation(newTr);
  };

  // Switch chapter
  const handleSelectChapter = (ch: number) => {
    setChapterNumber(ch);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleNextChapter = () => {
    if (!currentChapterData) return;
    if (chapterNumber < currentChapterData.totalChapters) {
      handleSelectChapter(chapterNumber + 1);
    } else if (bookIndex < allBooks.length - 1) {
      setBookIndex(bookIndex + 1);
      setChapterNumber(1);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const handlePrevChapter = () => {
    if (chapterNumber > 1) {
      handleSelectChapter(chapterNumber - 1);
    } else if (bookIndex > 0) {
      const prevBookIdx = bookIndex - 1;
      setBookIndex(prevBookIdx);
      const prevBookMeta = allBooks[prevBookIdx];
      setChapterNumber(prevBookMeta.chapterCount);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#181715' }}
      edges={['top', 'left', 'right']}
    >
      {/* Top Active Reading Timer Bar */}
      <View className="px-5 py-3 bg-surface-dark-elevated border-b border-hairline/10">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <View className="mr-2">
              {timer.isGoalMet ? (
                <Unlock size={14} color="#22c55e" />
              ) : (
                <Clock size={14} color="#f5b800" />
              )}
            </View>
            <Text className="text-xs font-sans-semibold uppercase tracking-wider text-on-dark-soft">
              {timer.isGoalMet ? 'Apps Unlocked' : 'Reading Timer Active'}
            </Text>
          </View>
          <Text className="text-sm font-mono font-bold text-primary">
            {timer.formattedTime} / {timer.formattedGoal}
          </Text>
        </View>

        {/* Progress Bar */}
        <View className="h-1.5 w-full bg-surface-dark-soft rounded-full overflow-hidden">
          <View
            className={`h-full ${
              timer.isGoalMet ? 'bg-success' : 'bg-primary'
            } rounded-full`}
            style={{ width: `${Math.round(timer.progress * 100)}%` }}
          />
        </View>
      </View>

      {/* Bookmark Feedback Toast */}
      {toastMessage && (
        <View className="bg-primary/20 border-b border-primary/40 px-4 py-2 flex-row items-center justify-center">
          <BookmarkIcon size={14} color="#f5b800" style={{ marginRight: 6 }} />
          <Text className="text-xs font-sans-medium text-[#f5b800] text-center">
            {toastMessage}
          </Text>
        </View>
      )}

      {/* Book & Translation Selection Bar */}
      <View className="px-5 py-3 flex-row items-center justify-between border-b border-hairline/10">
        <Pressable
          onPress={() => setShowBookModal(true)}
          className="flex-row items-center bg-surface-dark-elevated px-3.5 py-2 rounded-md border border-hairline/20"
        >
          <Text className="text-sm font-sans-bold text-on-dark mr-2">
            {currentBook.name} {chapterNumber}
          </Text>
          <ChevronDown size={14} color="#9e9488" />
        </Pressable>

        {/* Translation Toggle Pill */}
        <View className="flex-row bg-surface-dark-elevated rounded-md p-1 border border-hairline/20">
          <Pressable
            onPress={() => handleToggleTranslation('WEB')}
            className={`px-3 py-1 rounded ${
              translation === 'WEB' ? 'bg-primary' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-xs font-sans-semibold ${
                translation === 'WEB' ? 'text-white' : 'text-on-dark-soft'
              }`}
            >
              WEB
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleToggleTranslation('KJV')}
            className={`px-3 py-1 rounded ${
              translation === 'KJV' ? 'bg-primary' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-xs font-sans-semibold ${
                translation === 'KJV' ? 'text-white' : 'text-on-dark-soft'
              }`}
            >
              KJV
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Horizontal Chapter Picker */}
      <View className="py-2 border-b border-hairline/10 bg-surface-dark">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {Array.from({ length: currentBook.chapterCount }, (_, i) => i + 1).map(
            (ch) => (
              <Pressable
                key={ch}
                onPress={() => handleSelectChapter(ch)}
                className={`w-9 h-9 items-center justify-center rounded-full mr-2 ${
                  chapterNumber === ch
                    ? 'bg-primary'
                    : 'bg-surface-dark-elevated border border-hairline/10'
                }`}
              >
                <Text
                  className={`text-xs font-sans-semibold ${
                    chapterNumber === ch ? 'text-white' : 'text-on-dark-soft'
                  }`}
                >
                  {ch}
                </Text>
              </Pressable>
            )
          )}
        </ScrollView>
      </View>

      {/* Goal Achieved Toast Banner */}
      {timer.isGoalMet && (
        <View className="bg-success/15 px-4 py-2.5 border-b border-success/30 flex-row items-center justify-center">
          <View className="mr-2">
            <Sparkles size={16} color="#22c55e" />
          </View>
          <Text className="text-xs font-sans-medium text-success">
            Daily goal met! Distracting apps are unlocked for the day.
          </Text>
        </View>
      )}

      {/* Scripture Verses List */}
      <FlatList
        ref={flatListRef}
        data={currentChapterData?.verses || []}
        keyExtractor={(item) => String(item.verse)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}
        ListHeaderComponent={
          <View className="mb-6 items-center">
            <Text
              className="text-3xl text-on-dark font-serif text-center mb-1"
              style={{ fontFamily: 'EBGaramond_600SemiBold' }}
            >
              {currentBook.name}
            </Text>
            <Text className="text-xs font-mono text-primary uppercase tracking-widest">
              Chapter {chapterNumber} • {translation}
            </Text>
          </View>
        }
        renderItem={({ item }: { item: Verse }) => {
          const isBookmarked = bookmarkedVerses.includes(item.verse);
          const isTargeted = targetVerse === item.verse;

          return (
            <Pressable
              onLongPress={() => handleToggleBookmarkVerse(item)}
              className={`flex-row items-baseline mb-3.5 p-2 rounded-lg ${
                isTargeted
                  ? 'bg-primary/15 border-l-2 border-primary'
                  : isBookmarked
                  ? 'bg-surface-dark-elevated'
                  : 'bg-transparent'
              }`}
            >
              <Text className="text-xs font-mono text-primary mr-3 w-6 text-right select-none font-bold">
                {item.verse}
              </Text>
              <Text
                className="text-lg text-on-dark flex-1 leading-relaxed"
                style={{
                  fontFamily: 'EBGaramond_400Regular',
                  fontSize: 18,
                  lineHeight: 30,
                }}
              >
                {item.text}
              </Text>
              <Pressable
                onPress={() => handleToggleBookmarkVerse(item)}
                hitSlop={8}
                className="ml-2 p-1"
              >
                <BookmarkIcon
                  size={14}
                  color={isBookmarked ? '#f5b800' : '#4a574f'}
                  fill={isBookmarked ? '#f5b800' : 'transparent'}
                />
              </Pressable>
            </Pressable>
          );
        }}
        ListFooterComponent={
          <View className="mt-8 pt-6 border-t border-hairline/20 flex-row justify-between items-center">
            <Button
              title="← Prev Chapter"
              variant="outline"
              size="sm"
              onPress={handlePrevChapter}
              disabled={bookIndex === 0 && chapterNumber === 1}
            />
            <Button
              title="Next Chapter →"
              variant="primary"
              size="sm"
              onPress={handleNextChapter}
            />
          </View>
        }
      />

      {/* Book Selection Modal */}
      <Modal
        visible={showBookModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBookModal(false)}
      >
        <SafeAreaView className="flex-1 bg-surface-dark">
          <View className="p-4 border-b border-hairline/20 flex-row items-center justify-between">
            <Text className="text-lg font-sans-bold text-on-dark">
              Select Book of the Bible
            </Text>
            <Pressable
              onPress={() => setShowBookModal(false)}
              className="p-2"
            >
              <Text className="text-base text-primary font-sans-medium">Done</Text>
            </Pressable>
          </View>

          <FlatList
            data={allBooks}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => {
              const isSelected = bookIndex === index;
              const isOldTestament = index < 39;
              const showSectionHeader = index === 0 || index === 39;

              return (
                <View>
                  {showSectionHeader && (
                    <View className="bg-surface-dark-soft px-5 py-2.5">
                      <Text className="text-xs font-sans-bold uppercase tracking-wider text-accent-amber">
                        {isOldTestament ? 'Old Testament (39 Books)' : 'New Testament (27 Books)'}
                      </Text>
                    </View>
                  )}
                  <Pressable
                    onPress={() => {
                      setBookIndex(index);
                      setChapterNumber(1);
                      setShowBookModal(false);
                      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
                    }}
                    className={`px-5 py-3.5 border-b border-hairline/10 flex-row items-center justify-between ${
                      isSelected ? 'bg-primary/10' : ''
                    }`}
                  >
                    <Text
                      className={`text-base font-sans ${
                        isSelected ? 'text-primary font-sans-bold' : 'text-on-dark'
                      }`}
                    >
                      {item.name}
                    </Text>
                    <View className="flex-row items-center">
                      <Text className="text-xs text-on-dark-soft font-mono mr-2">
                        {item.chapterCount} {item.chapterCount === 1 ? 'ch' : 'chs'}
                      </Text>
                      {isSelected && <Check size={16} color="#f5b800" />}
                    </View>
                  </Pressable>
                </View>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
