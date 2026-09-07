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
import { useTheme } from '../../lib/themeContext';

export default function ReaderScreen() {
  const { colors, isDark } = useTheme();
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
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top', 'left', 'right']}
    >
      {/* Top Active Reading Timer Bar */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 12,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <View className="mr-2">
              {timer.isGoalMet ? (
                <Unlock size={14} color={colors.success} />
              ) : (
                <Clock size={14} color={colors.accent} />
              )}
            </View>
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Inter_600SemiBold',
                textTransform: 'uppercase',
                letterSpacing: 1,
                color: colors.textSecondary,
              }}
            >
              {timer.isGoalMet ? 'Apps Unlocked' : 'Reading Timer Active'}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Inter_700Bold',
              color: colors.accent,
            }}
          >
            {timer.formattedTime} / {timer.formattedGoal}
          </Text>
        </View>

        {/* Progress Bar */}
        <View
          style={{
            height: 6,
            width: '100%',
            backgroundColor: colors.surfaceSubtle,
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: '100%',
              borderRadius: 3,
              backgroundColor: timer.isGoalMet ? colors.success : colors.accent,
              width: `${Math.round(timer.progress * 100)}%`,
            }}
          />
        </View>
      </View>

      {/* Bookmark Feedback Toast */}
      {toastMessage && (
        <View
          style={{
            backgroundColor: colors.accentBg,
            borderBottomWidth: 1,
            borderBottomColor: colors.accent,
            paddingHorizontal: 16,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BookmarkIcon size={14} color={colors.accent} style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.accent, textAlign: 'center' }}>
            {toastMessage}
          </Text>
        </View>
      )}

      {/* Book & Translation Selection Bar */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable
          onPress={() => setShowBookModal(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'Inter_700Bold',
              color: colors.textPrimary,
              marginRight: 8,
            }}
          >
            {currentBook.name} {chapterNumber}
          </Text>
          <ChevronDown size={14} color={colors.textSecondary} />
        </Pressable>

        {/* Translation Toggle Pill */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.surfaceSubtle,
            borderRadius: 8,
            padding: 3,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Pressable
            onPress={() => handleToggleTranslation('WEB')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 6,
              backgroundColor: translation === 'WEB' ? colors.accent : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Inter_600SemiBold',
                color: translation === 'WEB' ? '#141413' : colors.textSecondary,
              }}
            >
              WEB
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleToggleTranslation('KJV')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 6,
              backgroundColor: translation === 'KJV' ? colors.accent : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Inter_600SemiBold',
                color: translation === 'KJV' ? '#141413' : colors.textSecondary,
              }}
            >
              KJV
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Horizontal Chapter Picker */}
      <View
        style={{
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
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
                style={{
                  width: 36,
                  height: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 18,
                  marginRight: 8,
                  backgroundColor: chapterNumber === ch ? colors.accent : colors.surfaceSubtle,
                  borderWidth: chapterNumber === ch ? 0 : 1,
                  borderColor: colors.borderSubtle,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'Inter_600SemiBold',
                    color: chapterNumber === ch ? '#141413' : colors.textSecondary,
                  }}
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
        <View
          style={{
            backgroundColor: colors.successBg,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View className="mr-2">
            <Sparkles size={16} color={colors.success} />
          </View>
          <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.success }}>
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
              style={{
                fontFamily: 'EBGaramond_700Bold',
                fontSize: 28,
                color: colors.textPrimary,
                textAlign: 'center',
                marginBottom: 4,
              }}
            >
              {currentBook.name}
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Inter_600SemiBold',
                color: colors.accent,
                textTransform: 'uppercase',
                letterSpacing: 2,
              }}
            >
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
              style={{
                flexDirection: 'row',
                alignItems: 'baseline',
                marginBottom: 14,
                padding: 8,
                borderRadius: 8,
                backgroundColor: isTargeted
                  ? colors.accentBg
                  : isBookmarked
                  ? colors.surface
                  : 'transparent',
                borderLeftWidth: isTargeted ? 3 : 0,
                borderLeftColor: colors.accent,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'Inter_700Bold',
                  color: colors.accent,
                  marginRight: 12,
                  width: 24,
                  textAlign: 'right',
                }}
              >
                {item.verse}
              </Text>
              <Text
                style={{
                  flex: 1,
                  fontFamily: 'EBGaramond_400Regular',
                  fontSize: 18,
                  lineHeight: 30,
                  color: colors.textPrimary,
                }}
              >
                {item.text}
              </Text>
              <Pressable
                onPress={() => handleToggleBookmarkVerse(item)}
                hitSlop={8}
                style={{ marginLeft: 8, padding: 4 }}
              >
                <BookmarkIcon
                  size={15}
                  color={isBookmarked ? colors.accent : colors.textMuted}
                  fill={isBookmarked ? colors.accent : 'transparent'}
                />
              </Pressable>
            </Pressable>
          );
        }}
        ListFooterComponent={
          <View
            style={{
              marginTop: 32,
              paddingTop: 24,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
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
        transparent={false}
        statusBarTranslucent
        onRequestClose={() => setShowBookModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <View
              style={{
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ fontSize: 18, fontFamily: 'EBGaramond_700Bold', color: colors.textPrimary }}>
                Select Book of the Bible
              </Text>
              <Pressable
                onPress={() => setShowBookModal(false)}
                style={{ padding: 8 }}
              >
                <Text style={{ fontSize: 15, color: colors.accent, fontFamily: 'Inter_600SemiBold' }}>Done</Text>
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
                      <View style={{ backgroundColor: colors.surfaceSubtle, paddingHorizontal: 20, paddingVertical: 10 }}>
                        <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 1, color: colors.accent }}>
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
                      style={{
                        paddingHorizontal: 20,
                        paddingVertical: 14,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.borderSubtle,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: isSelected ? colors.accentBg : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontFamily: isSelected ? 'Inter_700Bold' : 'Inter_400Regular',
                          color: isSelected ? colors.accent : colors.textPrimary,
                        }}
                      >
                        {item.name}
                      </Text>
                      <View className="flex-row items-center">
                        <Text style={{ fontSize: 12, color: colors.textSecondary, marginRight: 8 }}>
                          {item.chapterCount} {item.chapterCount === 1 ? 'ch' : 'chs'}
                        </Text>
                        {isSelected && <Check size={16} color={colors.accent} />}
                      </View>
                    </Pressable>
                  </View>
                );
              }}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
